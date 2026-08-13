import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection, query, where, getDocs, addDoc, deleteDoc,
  doc, updateDoc, writeBatch, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { uploadImage, uploadAudio, cloudinaryUrl } from '../../services/cloudinary/upload';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Spinner } from '../../shared/ui/Spinner';
import { cn } from '../../shared/utils/cn';
import { Plus, Trash2, GripVertical, ArrowLeft, Upload, X, Music, Play, Pause, ChevronRight, Pencil, Save } from 'lucide-react';

// Helper: extract ID3 tags from MP3 file
function readMp3Tags(file: File): Promise<{ title?: string; artist?: string; coverUrl?: string }> {
  return new Promise((resolve) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jsmediatags = (window as any).jsmediatags;
      if (!jsmediatags) { resolve({}); return; }
      jsmediatags.read(file, {
        onSuccess: (tag: any) => {
          const tags = tag.tags;
          let coverUrl: string | undefined;
          if (tags.picture) {
            const { data, format } = tags.picture;
            const bytes = new Uint8Array(data);
            const blob = new Blob([bytes], { type: format });
            coverUrl = URL.createObjectURL(blob);
          }
          resolve({ title: tags.title, artist: tags.artist, coverUrl });
        },
        onError: () => resolve({}),
      });
    } catch {
      resolve({});
    }
  });
}

// Helper: remove undefined fields recursively
function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  ) as T;
}

interface Track {
  id?: string;
  publicId?: string;
  url?: string;
  src?: string;       // campo legado do site antigo
  cover?: string;     // campo legado do site antigo (URL completa)
  title: string;
  artist?: string;
  coverPublicId?: string;
  coverUrl?: string;
  date?: string;
  orderIndex?: number;
}

interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  orderIndex: number;
  tracks: Track[];
}

function useToast() {
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);
  const show = (text: string, type: 'ok' | 'err' = 'ok') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };
  const Toast = msg ? (
    <div className={cn('fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl font-medium text-sm animate-in slide-in-from-bottom-4 duration-300',
      msg.type === 'ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
    )}>{msg.text}</div>
  ) : null;
  return { show, Toast };
}

// ─── Mini Audio Player Component ─────────────────────────────────────────────
function TrackPlayer({ src, trackId }: { src: string; trackId: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.addEventListener('timeupdate', () => {
      setProgress(audio.currentTime);
    });
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    audio.addEventListener('ended', () => {
      setPlaying(false);
      setProgress(0);
    });
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [src]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      // Pause all other admin audio players
      document.querySelectorAll('[data-admin-audio]').forEach((el) => {
        const evt = new CustomEvent('pause-others', { detail: trackId });
        el.dispatchEvent(evt);
      });
      audio.play();
      setPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = Number(e.target.value);
    if (audioRef.current) audioRef.current.currentTime = t;
    setProgress(t);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 flex-1 min-w-0" data-admin-audio data-track-id={trackId}>
      <button
        onClick={togglePlay}
        className="p-1.5 bg-rose-500/20 hover:bg-rose-500/40 rounded-full text-rose-400 transition-colors shrink-0"
      >
        {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
      </button>
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-xs text-slate-500 font-mono w-8 shrink-0">{fmt(progress)}</span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={progress}
          onChange={handleSeek}
          onPointerDown={e => e.stopPropagation()} // Stop drag propagation
          onMouseDown={e => e.stopPropagation()}
          onTouchStart={e => e.stopPropagation()}
          className="flex-1 h-1 accent-rose-500 cursor-pointer"
        />
        <span className="text-xs text-slate-500 font-mono w-8 shrink-0 text-right">{fmt(duration)}</span>
      </div>
    </div>
  );
}

export default function PlaylistEditor() {
  const { config } = useSiteConfigStore();
  const { show, Toast } = useToast();
  const siteId = config?.id || 'meu-site';

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlaylist, setActivePlaylist] = useState<Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);

  // Drag-and-drop refs
  const dragPlaylistItem = useRef<number | null>(null);
  const dragPlaylistOver = useRef<number | null>(null);
  const dragTrackItem = useRef<number | null>(null);
  const dragTrackOver = useRef<number | null>(null);

  // Playlist creation
  const [creatingPlaylist, setCreatingPlaylist] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ name: '', description: '' });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [savingPlaylist, setSavingPlaylist] = useState(false);

  // Playlist editing
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editPlaylist, setEditPlaylist] = useState({ name: '', description: '' });
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Track upload
  const [creatingTrack, setCreatingTrack] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [trackCoverFile, setTrackCoverFile] = useState<File | null>(null);
  const [trackCoverPreview, setTrackCoverPreview] = useState<string | null>(null);
  const [newTrack, setNewTrack] = useState({ title: '', artist: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const trackCoverRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const editCoverRef = useRef<HTMLInputElement>(null);

  // ─── Load playlists + tracks ──────────────────────────────────────────────
  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'custom_playlists')));
      const loaded: Playlist[] = [];
      snap.forEach(d => {
        if (d.id === '_placeholder') return;
        const data = d.data();
        loaded.push({
          id: d.id,
          name: data.name || data.title || '',
          description: data.description || '',
          coverUrl: data.cover || data.coverUrl || '',
          orderIndex: data.orderIndex ?? 0,
          tracks: [],
        });
      });

      // Fetch tracks from playlist_tracks
      for (const p of loaded) {
        const tSnap = await getDocs(query(collection(db, 'playlist_tracks'), where('playlistId', '==', p.id)));
        const allTracks: Track[] = [];
        let needsRepair = false;

        tSnap.forEach(tDoc => {
          const data = tDoc.data();
          // Backward compat: if there's a tracks array (from my previous bug), flatten it
          if (data.tracks && Array.isArray(data.tracks)) {
            allTracks.push(...data.tracks.map(t => ({ ...t, id: tDoc.id })));
            needsRepair = true;
          } else if (data.title) {
            allTracks.push({ id: tDoc.id, ...data } as Track);
          }
        });
        
        // Sort by legacy orderIndex
        allTracks.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
        p.tracks = allTracks;

        // Auto repair the database if the buggy array format is found
        if (needsRepair && allTracks.length > 0) {
           try {
             const batch = writeBatch(db);
             tSnap.forEach(d => batch.delete(d.ref));
             allTracks.forEach((t, i) => {
               const clean: any = stripUndefined({ ...t, orderIndex: i, playlistId: p.id });
               delete clean.id;
               delete clean.tracks;
               batch.set(doc(collection(db, 'playlist_tracks')), clean);
             });
             await batch.commit();
             // Re-map the IDs now that they've been generated in firestore?
             // Not easily possible without a re-fetch, but loadPlaylists runs often so it's fine.
           } catch(e) {
             console.error("Auto repair failed", e);
           }
        }
      }

      loaded.sort((a, b) => a.orderIndex - b.orderIndex);
      setPlaylists(loaded);
    } catch (e: any) { show('Erro ao carregar playlists: ' + e.message, 'err'); }
    setLoading(false);
  }, []);

  useEffect(() => { loadPlaylists(); }, [loadPlaylists]);

  useEffect(() => {
    if (activePlaylist) {
      const latest = playlists.find(p => p.id === activePlaylist.id);
      setTracks(latest?.tracks || []);
    } else {
      setTracks([]);
    }
  }, [playlists, activePlaylist?.id]);

  // ─── Playlist Drag & Drop ─────────────────────────────────────────────────
  const handlePlaylistDragStart = (idx: number) => { dragPlaylistItem.current = idx; };
  const handlePlaylistDragEnter = (idx: number) => { dragPlaylistOver.current = idx; };
  const handlePlaylistDrop = async () => {
    if (dragPlaylistItem.current === null || dragPlaylistOver.current === null) return;
    if (dragPlaylistItem.current === dragPlaylistOver.current) return;

    const updated = [...playlists];
    const dragged = updated.splice(dragPlaylistItem.current, 1)[0];
    updated.splice(dragPlaylistOver.current, 0, dragged);
    const indexed = updated.map((p, i) => ({ ...p, orderIndex: i }));

    dragPlaylistItem.current = null;
    dragPlaylistOver.current = null;

    setPlaylists(indexed);

    try {
      const batch = writeBatch(db);
      indexed.forEach(p => batch.update(doc(db, 'custom_playlists', p.id), { orderIndex: p.orderIndex }));
      await batch.commit();
    } catch (e: any) { show('Erro ao reordenar: ' + e.message, 'err'); }
  };

  // ─── Track Drag & Drop ───────────────────────────────────────────────────
  const handleTrackDragStart = (idx: number) => { dragTrackItem.current = idx; };
  const handleTrackDragEnter = (idx: number) => { dragTrackOver.current = idx; };
  const handleTrackDrop = async () => {
    if (!activePlaylist || dragTrackItem.current === null || dragTrackOver.current === null) return;
    if (dragTrackItem.current === dragTrackOver.current) return;

    const updated = [...tracks];
    const dragged = updated.splice(dragTrackItem.current, 1)[0];
    updated.splice(dragTrackOver.current, 0, dragged);

    dragTrackItem.current = null;
    dragTrackOver.current = null;

    setTracks(updated);

    try {
      const batch = writeBatch(db);
      
      // We must ensure the old bug is wiped (array tracks in single doc).
      // First, get all current docs for this playlist.
      const tSnap = await getDocs(query(collection(db, 'playlist_tracks'), where('playlistId', '==', activePlaylist.id)));
      tSnap.forEach(d => batch.delete(d.ref)); // delete all to rebuild perfectly

      // Re-insert tracks with correct orderIndex
      updated.forEach((t, i) => {
        const clean: any = stripUndefined({ ...t, orderIndex: i, playlistId: activePlaylist.id });
        delete clean.id; // remove id before inserting
        // remove the nested tracks array if it somehow leaked
        delete clean.tracks;
        
        batch.set(doc(collection(db, 'playlist_tracks')), clean);
      });

      await batch.commit();
      loadPlaylists();
    } catch (e: any) { show('Erro ao reordenar músicas: ' + e.message, 'err'); }
  };

  // ─── Create Playlist ──────────────────────────────────────────────────────
  const handleCreatePlaylist = async () => {
    if (!newPlaylist.name) { show('O nome da playlist é obrigatório', 'err'); return; }
    setSavingPlaylist(true);
    try {
      let coverUrl: string | undefined;
      if (coverFile) {
        const res = await uploadImage(coverFile, `${siteId}/playlists/covers`);
        coverUrl = res.secureUrl;
      }
      await addDoc(collection(db, 'custom_playlists'), stripUndefined({
        name: newPlaylist.name,
        title: newPlaylist.name,
        description: newPlaylist.description || undefined,
        cover: coverUrl,
        coverUrl,
        orderIndex: playlists.length,
        createdAt: serverTimestamp(),
      }));
      show('Playlist criada com sucesso!');
      setCreatingPlaylist(false);
      setNewPlaylist({ name: '', description: '' });
      setCoverFile(null);
      setCoverPreview(null);
      loadPlaylists();
    } catch (e: any) { show('Erro ao criar playlist: ' + e.message, 'err'); }
    setSavingPlaylist(false);
  };

  // ─── Edit Playlist ────────────────────────────────────────────────────────
  const openEditPlaylist = (playlist: Playlist) => {
    setEditingPlaylistId(playlist.id);
    setEditPlaylist({ name: playlist.name, description: playlist.description || '' });
    setEditCoverPreview(playlist.coverUrl || null);
    setEditCoverFile(null);
  };

  const handleUpdatePlaylist = async () => {
    if (!editingPlaylistId || !editPlaylist.name) { show('Nome é obrigatório', 'err'); return; }
    setSavingEdit(true);
    try {
      const updates: any = {
        name: editPlaylist.name,
        title: editPlaylist.name,
      };
      if (editPlaylist.description) updates.description = editPlaylist.description;
      if (editCoverFile) {
        const res = await uploadImage(editCoverFile, `${siteId}/playlists/covers`);
        updates.cover = res.secureUrl;
        updates.coverUrl = res.secureUrl;
      }
      await updateDoc(doc(db, 'custom_playlists', editingPlaylistId), updates);
      show('Playlist atualizada!');
      setEditingPlaylistId(null);
      setEditCoverFile(null);
      setEditCoverPreview(null);
      loadPlaylists();
    } catch (e: any) { show('Erro ao atualizar: ' + e.message, 'err'); }
    setSavingEdit(false);
  };

  // ─── Delete Playlist ──────────────────────────────────────────────────────
  const handleDeletePlaylist = async (playlist: Playlist) => {
    if (!confirm(`Deletar a playlist "${playlist.name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'custom_playlists', playlist.id));
      const tSnap = await getDocs(query(collection(db, 'playlist_tracks'), where('playlistId', '==', playlist.id)));
      if (!tSnap.empty) {
        const batch = writeBatch(db);
        tSnap.forEach(d => batch.delete(doc(db, 'playlist_tracks', d.id)));
        await batch.commit();
      }
      show('Playlist deletada!');
      if (activePlaylist?.id === playlist.id) setActivePlaylist(null);
      loadPlaylists();
    } catch (e: any) { show('Erro ao deletar: ' + e.message, 'err'); }
  };

  // ─── Audio select with ID3 extraction ────────────────────────────────────
  const handleAudioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAudioFile(file);
    
    // Fallback: parse artist and title from "Artist - Title.mp3" format
    let nameFromFile = file.name.replace(/\.[^.]+$/, '');
    let parsedArtist = '';
    let parsedTitle = nameFromFile;
    if (nameFromFile.includes(' - ')) {
      const parts = nameFromFile.split(' - ');
      parsedArtist = parts[0].trim();
      parsedTitle = parts.slice(1).join(' - ').trim();
    } else {
      parsedTitle = parsedTitle.replace(/[-_]/g, ' ');
    }

    const tags = await readMp3Tags(file);
    setNewTrack(t => ({
      ...t,
      title: tags.title || t.title || parsedTitle,
      artist: tags.artist || t.artist || parsedArtist,
    }));
    if (tags.coverUrl) setTrackCoverPreview(tags.coverUrl);
  };

  const handleTrackCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setTrackCoverFile(file);
    setTrackCoverPreview(URL.createObjectURL(file));
  };

  // ─── Upload Track ─────────────────────────────────────────────────────────
  const handleUploadTrack = async () => {
    if (!activePlaylist || !audioFile || !newTrack.title) {
      show('Selecione um arquivo MP3 e informe o título', 'err'); return;
    }
    setUploading(true);
    try {
      const audioRes = await uploadAudio(audioFile, `${siteId}/music`, setUploadProgress);

      let coverUrl: string | undefined;
      let coverPublicId: string | undefined;

      // If ID3 cover was extracted (blob URL), upload it to Cloudinary
      if (trackCoverFile) {
        const coverRes = await uploadImage(trackCoverFile, `${siteId}/music/covers`);
        coverPublicId = coverRes.publicId;
        coverUrl = coverRes.secureUrl;
      } else if (trackCoverPreview && trackCoverPreview.startsWith('blob:')) {
        // Convert blob URL to File and upload
        try {
          const blobRes = await fetch(trackCoverPreview);
          const blob = await blobRes.blob();
          const blobFile = new File([blob], 'cover.jpg', { type: blob.type });
          const coverRes = await uploadImage(blobFile, `${siteId}/music/covers`);
          coverPublicId = coverRes.publicId;
          coverUrl = coverRes.secureUrl;
        } catch { /* ignore cover upload error */ }
      }

      const addedTrack = stripUndefined({
        title: newTrack.title,
        artist: newTrack.artist || undefined,
        src: audioRes.secureUrl,
        url: audioRes.secureUrl,
        publicId: audioRes.publicId,
        cover: coverUrl,
        coverPublicId,
        date: new Date().toISOString(),
        orderIndex: tracks.length,
        playlistId: activePlaylist.id
      });

      await addDoc(collection(db, 'playlist_tracks'), addedTrack);

      show('Música adicionada com sucesso!');
      setAudioFile(null);
      setTrackCoverFile(null);
      setTrackCoverPreview(null);
      setNewTrack({ title: '', artist: '' });
      setCreatingTrack(false);
      setUploadProgress(0);
      loadPlaylists();
    } catch (e: any) { show('Erro no upload: ' + e.message, 'err'); }
    setUploading(false);
  };

  // ─── Delete Track ─────────────────────────────────────────────────────────
  const handleDeleteTrack = async (track: Track) => {
    if (!activePlaylist) return;
    if (!confirm(`Deletar a música "${track.title}"?`)) return;
    try {
      // If we have track.id, just delete it directly
      if (track.id) {
        await deleteDoc(doc(db, 'playlist_tracks', track.id));
      } else {
        // Fallback for nested array bug items
        const tSnap = await getDocs(query(collection(db, 'playlist_tracks'), where('playlistId', '==', activePlaylist.id)));
        tSnap.forEach(async (d) => {
           if (d.data().tracks) {
             const updated = d.data().tracks.filter((t: any) => t.url !== track.url && t.src !== track.src);
             await updateDoc(d.ref, { tracks: updated });
           }
        });
      }
      show('Música deletada!');
      loadPlaylists();
    } catch (e: any) { show('Erro: ' + e.message, 'err'); }
  };

  // ─── RENDER: Track view (inside a playlist) ───────────────────────────────
  if (activePlaylist) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {Toast}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setActivePlaylist(null)} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
              <ArrowLeft className="w-4 h-4" /> Playlists
            </button>
            <span className="text-slate-600">/</span>
            <h1 className="text-2xl font-bold text-white">{activePlaylist.name}</h1>
            <span className="text-slate-500 text-sm font-mono">{tracks.length} músicas</span>
          </div>
          <Button onClick={() => setCreatingTrack(true)} className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Adicionar Música
          </Button>
        </div>

        {creatingTrack && (
          <div className="bg-slate-800 border border-rose-500/40 rounded-xl p-6 space-y-4">
            <h2 className="font-bold text-white text-lg">Nova Música</h2>

            {/* MP3 picker FIRST — fills fields via ID3 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Arquivo MP3 *</label>
              <div
                onClick={() => audioInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-5 flex items-center gap-3 cursor-pointer transition-all',
                  audioFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-600 hover:border-slate-400 bg-slate-900/40'
                )}
              >
                <Music className={cn('w-6 h-6', audioFile ? 'text-emerald-400' : 'text-slate-500')} />
                <span className={cn('text-sm', audioFile ? 'text-emerald-300' : 'text-slate-400')}>
                  {audioFile ? audioFile.name : 'Clique para selecionar o arquivo MP3 (campos serão preenchidos automaticamente)'}
                </span>
              </div>
              <input ref={audioInputRef} type="file" className="hidden" accept="audio/mp3,audio/mpeg,audio/*" onChange={handleAudioSelect} />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Título *</label>
                <Input value={newTrack.title} onChange={e => setNewTrack({ ...newTrack, title: e.target.value })} className="bg-slate-900 border-slate-700 text-slate-200" placeholder="Ex: Perfeito" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Artista</label>
                <Input value={newTrack.artist} onChange={e => setNewTrack({ ...newTrack, artist: e.target.value })} className="bg-slate-900 border-slate-700 text-slate-200" placeholder="Ex: Ed Sheeran" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Capa da Música (Opcional — extraída automaticamente do MP3)</label>
              {trackCoverPreview ? (
                <div className="flex items-center gap-3">
                  <img src={trackCoverPreview} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-600" />
                  <div>
                    <p className="text-xs text-emerald-400 mb-1">✓ Capa extraída do MP3</p>
                    <button onClick={() => { setTrackCoverFile(null); setTrackCoverPreview(null); }} className="text-slate-400 hover:text-white text-xs flex items-center gap-1">
                      <X className="w-3 h-3" /> Remover
                    </button>
                  </div>
                </div>
              ) : (
                <div onClick={() => trackCoverRef.current?.click()} className="border border-dashed border-slate-600 rounded-xl p-4 flex items-center gap-2 cursor-pointer hover:border-slate-400 transition-colors">
                  <Upload className="w-5 h-5 text-slate-500" />
                  <span className="text-slate-400 text-sm">Clique para selecionar uma capa manualmente</span>
                </div>
              )}
              <input ref={trackCoverRef} type="file" className="hidden" accept="image/*" onChange={handleTrackCoverSelect} />
            </div>

            {uploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-400"><span>Enviando...</span><span>{uploadProgress}%</span></div>
                <div className="w-full bg-slate-700 rounded-full h-1.5">
                  <div className="h-full bg-rose-500 transition-all rounded-full" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button onClick={handleUploadTrack} isLoading={uploading} className="gap-2"><Upload className="w-4 h-4" /> Enviar Música</Button>
              <Button variant="secondary" onClick={() => { setCreatingTrack(false); setAudioFile(null); setTrackCoverFile(null); setTrackCoverPreview(null); setNewTrack({ title: '', artist: '' }); }} className="bg-slate-700 text-white">Cancelar</Button>
            </div>
          </div>
        )}

        {tracks.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-slate-700 rounded-xl text-slate-500">
            <Music className="w-10 h-10 mx-auto mb-3 opacity-40" />
            Nenhuma música nesta playlist.
          </div>
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <p className="text-xs text-slate-500 p-4 pb-0">💡 Arraste as músicas para reordená-las</p>
            {tracks.map((track, idx) => (
              <div
                key={track.publicId || track.url || idx}
                draggable
                onDragStart={(e) => {
                  const target = e.target as HTMLElement;
                  // Only allow dragging if they grabbed the drag handle or its children
                  if (!target.closest('.drag-handle-grip')) {
                    e.preventDefault();
                    return;
                  }
                  handleTrackDragStart(idx);
                }}
                onDragEnter={() => handleTrackDragEnter(idx)}
                onDragEnd={handleTrackDrop}
                onDragOver={e => e.preventDefault()}
                className="flex items-center gap-3 p-4 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors group cursor-grab active:cursor-grabbing"
              >
                <div className="drag-handle-grip p-2 -ml-2 cursor-grab active:cursor-grabbing hover:bg-slate-600/50 rounded-lg">
                  <GripVertical className="w-4 h-4 text-slate-600 flex-shrink-0" />
                </div>
                <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {track.coverPublicId ? (
                    <img src={cloudinaryUrl(track.coverPublicId, { w: 80, h: 80, c: 'fill' })} alt="" className="w-full h-full object-cover" />
                  ) : (track.cover || track.coverUrl) ? (
                    <img src={track.cover || track.coverUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Music className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="w-36 shrink-0">
                  <p className="font-semibold text-white truncate text-sm">{track.title}</p>
                  <p className="text-xs text-slate-500 truncate">{track.artist || 'Artista desconhecido'}</p>
                </div>
                {(track.src || track.url) ? (
                  <TrackPlayer src={track.src || track.url || ''} trackId={track.publicId || track.url || String(idx)} />
                ) : (
                  <div className="flex-1" />
                )}
                <button onClick={() => handleDeleteTrack(track)} className="p-2 text-slate-500 hover:text-red-400 transition-colors opacity-50 group-hover:opacity-100 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: Playlist list ────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {Toast}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Playlists</h1>
          <p className="text-slate-400 mt-1">Gerencie as playlists e músicas do site.</p>
        </div>
        <Button onClick={() => setCreatingPlaylist(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Nova Playlist
        </Button>
      </div>

      {creatingPlaylist && (
        <div className="bg-slate-800 border border-rose-500/40 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-white text-lg">Criar Nova Playlist</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Nome *</label>
              <Input value={newPlaylist.name} onChange={e => setNewPlaylist({ ...newPlaylist, name: e.target.value })} className="bg-slate-900 border-slate-700 text-slate-200" placeholder="Ex: Músicas Favoritas" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Descrição</label>
              <Input value={newPlaylist.description} onChange={e => setNewPlaylist({ ...newPlaylist, description: e.target.value })} className="bg-slate-900 border-slate-700 text-slate-200" placeholder="Ex: Para ouvir no carro" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Capa da Playlist</label>
            {coverPreview ? (
              <div className="flex items-center gap-3">
                <img src={coverPreview} alt="" className="w-16 h-16 rounded-lg object-cover" />
                <button onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div onClick={() => coverRef.current?.click()} className="border border-dashed border-slate-600 rounded-xl p-4 flex items-center gap-2 cursor-pointer hover:border-slate-400 transition-colors">
                <Upload className="w-5 h-5 text-slate-500" />
                <span className="text-slate-400 text-sm">Clique para selecionar a capa</span>
              </div>
            )}
            <input ref={coverRef} type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); } }} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreatePlaylist} isLoading={savingPlaylist} className="gap-2"><Plus className="w-4 h-4" /> Criar Playlist</Button>
            <Button variant="secondary" onClick={() => setCreatingPlaylist(false)} className="bg-slate-700 text-white">Cancelar</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : playlists.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-slate-700 rounded-xl text-slate-500">Nenhuma playlist criada ainda.</div>
      ) : (
        <>
          <p className="text-xs text-slate-500">💡 Arraste as playlists para reordená-las</p>
          <div className="space-y-2">
            {playlists.map((playlist, idx) => (
              <div key={playlist.id}>
                <div
                  draggable
                  onDragStart={() => handlePlaylistDragStart(idx)}
                  onDragEnter={() => handlePlaylistDragEnter(idx)}
                  onDragEnd={handlePlaylistDrop}
                  onDragOver={e => e.preventDefault()}
                  className="flex items-center gap-4 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors group cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  {playlist.coverUrl ? (
                    <img src={playlist.coverUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <Music className="w-6 h-6 text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{playlist.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{playlist.tracks.length} músicas</p>
                    {playlist.description && <p className="text-sm text-slate-400 truncate mt-0.5">{playlist.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActivePlaylist(playlist)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      Ver Músicas <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEditPlaylist(playlist)} className="p-2 text-slate-500 hover:text-blue-400 transition-colors opacity-50 group-hover:opacity-100">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeletePlaylist(playlist)} className="p-2 text-slate-500 hover:text-red-400 transition-colors opacity-50 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Edit form expands below */}
                {editingPlaylistId === playlist.id && (
                  <div className="bg-slate-800/80 border border-blue-500/40 rounded-xl p-6 space-y-4 ml-9 mt-2 animate-in fade-in zoom-in-95 duration-200">
                    <h2 className="font-bold text-white text-lg">Editar Playlist</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Nome *</label>
                        <Input value={editPlaylist.name} onChange={e => setEditPlaylist({ ...editPlaylist, name: e.target.value })} className="bg-slate-900 border-slate-700 text-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Descrição</label>
                        <Input value={editPlaylist.description} onChange={e => setEditPlaylist({ ...editPlaylist, description: e.target.value })} className="bg-slate-900 border-slate-700 text-slate-200" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Capa</label>
                      {editCoverPreview ? (
                        <div className="flex items-center gap-3">
                          <img src={editCoverPreview} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-600" />
                          <button onClick={() => { setEditCoverFile(null); setEditCoverPreview(null); }} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
                        </div>
                      ) : (
                        <div onClick={() => editCoverRef.current?.click()} className="border border-dashed border-slate-600 rounded-xl p-4 flex items-center gap-2 cursor-pointer hover:border-slate-400 transition-colors">
                          <Upload className="w-5 h-5 text-slate-500" />
                          <span className="text-slate-400 text-sm">Nova capa</span>
                        </div>
                      )}
                      <input ref={editCoverRef} type="file" className="hidden" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { setEditCoverFile(f); setEditCoverPreview(URL.createObjectURL(f)); } }} />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button onClick={handleUpdatePlaylist} isLoading={savingEdit} className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><Save className="w-4 h-4" /> Salvar</Button>
                      <Button variant="secondary" onClick={() => setEditingPlaylistId(null)} className="bg-slate-700 text-white">Cancelar</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection, getDocs, deleteDoc, query, where,
  doc, updateDoc, writeBatch, addDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { uploadImage, cloudinaryUrl } from '../../services/cloudinary/upload';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Spinner } from '../../shared/ui/Spinner';
import { cn } from '../../shared/utils/cn';
import {
  Plus, Trash2, GripVertical, ArrowLeft, Upload, X, Image as ImageIcon, ChevronRight, Pencil, Save
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Album {
  id: string;
  title: string;
  description?: string;
  date: string;
  coverPublicId?: string;
  coverUrl?: string;
  orderIndex: number;
  photos?: Photo[];
}

interface Photo {
  publicId: string;
  url?: string;
  src?: string;
  caption?: string;
  date?: string;
  lat?: number;
  lng?: number;
}

// ─── Drag-and-drop hook ───────────────────────────────────────────────────────
function useDragOrder<T extends object>(
  items: T[],
  onReorder: (items: T[]) => void
) {
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);

  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragEnter = (idx: number) => { dragOver.current = idx; };
  const handleDrop = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const updated = [...items];
    const dragged = updated.splice(dragItem.current, 1)[0];
    updated.splice(dragOver.current, 0, dragged);
    onReorder(updated);
    dragItem.current = null;
    dragOver.current = null;
  };

  return { handleDragStart, handleDragEnter, handleDrop };
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);
  const show = (text: string, type: 'ok' | 'err' = 'ok') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };
  const Toast = msg ? (
    <div className={cn(
      'fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl font-medium text-sm animate-in slide-in-from-bottom-4 duration-300',
      msg.type === 'ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
    )}>{msg.text}</div>
  ) : null;
  return { show, Toast };
}

// ─── Upload Drop Zone ─────────────────────────────────────────────────────────
interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
}
function DropZone({ onFiles, accept = 'image/*', multiple = true, label = 'Solte as fotos aqui ou clique para selecionar' }: DropZoneProps) {
  const ref = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handle = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith(accept.replace('/*', '')));
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handle}
      onClick={() => ref.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all',
        dragging ? 'border-rose-400 bg-rose-500/10' : 'border-slate-600 hover:border-slate-400 bg-slate-900/40'
      )}
    >
      <Upload className="w-8 h-8 text-slate-400" />
      <p className="text-slate-400 text-sm text-center">{label}</p>
      <input
        ref={ref}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={e => e.target.files && onFiles(Array.from(e.target.files))}
      />
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
      <div className="h-full bg-rose-500 transition-all duration-300 rounded-full" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── ALBUM EDITOR ─────────────────────────────────────────────────────────────
export default function AlbumEditor() {
  const { config } = useSiteConfigStore();
  const { show, Toast } = useToast();

  // ─ State ─
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAlbum, setActiveAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);

  // new album form
  const [creating, setCreating] = useState(false);
  const [newAlbum, setNewAlbum] = useState({ title: '', description: '', date: '' });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // edit album form
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editAlbum, setEditAlbum] = useState({ title: '', description: '', date: '' });
  const [editCoverFile, setEditCoverFile] = useState<File | null>(null);
  const [editCoverPreview, setEditCoverPreview] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // photo upload
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);
  const [uploading, setUploading] = useState(false);

  const siteId = config?.id || 'meu-site';

  const loadAlbums = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'albums')));
      const loaded: Album[] = [];
      
      const albumIds = snap.docs.map(d => d.id);
      
      // Load photos from album_photos in parallel
      const photoPromises = albumIds.map(id =>
        getDocs(query(collection(db, 'album_photos'), where('albumId', '==', id)))
      );
      const photoSnapshots = await Promise.all(photoPromises);
      
      snap.docs.forEach((d, index) => {
        if (d.id === '_placeholder') return;
        const data = d.data();
        const pSnap = photoSnapshots[index];
        const allPhotos: Photo[] = [];
        pSnap.docs.forEach(pDoc => {
          const pData = pDoc.data();
          if (pData.photos && Array.isArray(pData.photos)) {
            allPhotos.push(...pData.photos);
          }
        });
        
        loaded.push({
          id: d.id,
          title: data.title,
          description: data.description,
          date: data.date,
          coverPublicId: data.coverPublicId,
          coverUrl: data.cover || data.coverUrl || data.coverLarge,
          orderIndex: data.orderIndex ?? 0,
          photos: allPhotos
        });
      });
      // Sort locally for old data without orderIndex
      loaded.sort((a, b) => a.orderIndex - b.orderIndex);
      setAlbums(loaded);
    } catch { show('Erro ao carregar álbuns', 'err'); }
    setLoading(false);
  }, []);

  useEffect(() => { loadAlbums(); }, [loadAlbums]);

  // ─ Load photos of active album ─
  useEffect(() => {
    if (activeAlbum) {
      // Find the latest state of the active album from albums list
      const latest = albums.find(a => a.id === activeAlbum.id);
      setPhotos(latest?.photos || []);
    } else {
      setPhotos([]);
    }
  }, [activeAlbum, albums]);

  // ─ Cover file preview ─
  const handleCoverFile = (files: File[]) => {
    if (!files[0]) return;
    setCoverFile(files[0]);
    setCoverPreview(URL.createObjectURL(files[0]));
  };

  // ─ Create album ─
  const handleCreateAlbum = async () => {
    if (!newAlbum.title || !newAlbum.date) { show('Título e data são obrigatórios', 'err'); return; }
    setSaving(true);
    try {
      let coverUrl: string | undefined;
      let coverPublicId: string | undefined;
      if (coverFile) {
        const res = await uploadImage(coverFile, `${siteId}/albums/covers`);
        coverPublicId = res.publicId;
        coverUrl = res.secureUrl;
      }
      await addDoc(collection(db, 'albums'), {
        title: newAlbum.title,
        description: newAlbum.description,
        date: newAlbum.date,
        cover: coverUrl, // usa campo legado
        coverPublicId,
        coverUrl,
        orderIndex: albums.length,
        createdAt: serverTimestamp(),
      });
      show('Álbum criado com sucesso!');
      setCreating(false);
      setNewAlbum({ title: '', description: '', date: '' });
      setCoverFile(null);
      setCoverPreview(null);
      loadAlbums();
    } catch (e: any) { show('Erro ao criar álbum: ' + e.message, 'err'); }
    setSaving(false);
  };

  // ─ Update album ─
  const handleUpdateAlbum = async () => {
    if (!editingAlbumId || !editAlbum.title || !editAlbum.date) { show('Título e data são obrigatórios', 'err'); return; }
    setSavingEdit(true);
    try {
      const updates: any = {
        title: editAlbum.title,
        description: editAlbum.description,
        date: editAlbum.date,
      };
      
      if (editCoverFile) {
        const res = await uploadImage(editCoverFile, `${siteId}/albums/covers`);
        updates.coverPublicId = res.publicId;
        updates.coverUrl = res.secureUrl;
        updates.cover = res.secureUrl;
      }
      
      await updateDoc(doc(db, 'albums', editingAlbumId), updates);
      show('Álbum atualizado com sucesso!');
      setEditingAlbumId(null);
      setEditCoverFile(null);
      setEditCoverPreview(null);
      loadAlbums();
    } catch (e: any) { show('Erro ao atualizar: ' + e.message, 'err'); }
    setSavingEdit(false);
  };

  const openEdit = (album: Album) => {
    setEditingAlbumId(album.id);
    setEditAlbum({ title: album.title, description: album.description || '', date: album.date || '' });
    setEditCoverPreview(album.coverUrl || (album.coverPublicId ? cloudinaryUrl(album.coverPublicId, { w: 300 }) : null));
    setEditCoverFile(null);
  };

  // ─ Delete album (cascade) ─
  const handleDeleteAlbum = async (album: Album) => {
    if (!confirm(`Deletar o álbum "${album.title}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await deleteDoc(doc(db, 'albums', album.id));
      // Deletar os album_photos
      const pSnap = await getDocs(query(collection(db, 'album_photos'), where('albumId', '==', album.id)));
      const batch = writeBatch(db);
      pSnap.forEach(d => batch.delete(doc(db, 'album_photos', d.id)));
      await batch.commit();
      
      show('Álbum deletado!');
      if (activeAlbum?.id === album.id) setActiveAlbum(null);
      loadAlbums();
    } catch (e: any) { show('Erro ao deletar: ' + e.message, 'err'); }
  };

  // ─ Reorder albums ─
  const albumDnd = useDragOrder(albums, async (reordered) => {
    const indexed = reordered.map((a, i) => ({ ...a, orderIndex: i }));
    setAlbums(indexed);
    const batch = writeBatch(db);
    indexed.forEach(a => batch.update(doc(db, 'albums', a.id), { orderIndex: a.orderIndex }));
    await batch.commit();
  });

  // ─ Reorder photos ─
  const photoDnd = useDragOrder(photos, async (reordered) => {
    setPhotos(reordered);
    const reorderedPhotos = reordered.map(p => ({ ...p }));
    const pSnap = await getDocs(query(collection(db, 'album_photos'), where('albumId', '==', activeAlbum!.id)));
    if (!pSnap.empty) {
      await updateDoc(doc(db, 'album_photos', pSnap.docs[0].id), { photos: reorderedPhotos });
      // Delete extra pages if they exist to prevent duplicates
      if (pSnap.docs.length > 1) {
        const batch = writeBatch(db);
        for (let i = 1; i < pSnap.docs.length; i++) {
          batch.delete(doc(db, 'album_photos', pSnap.docs[i].id));
        }
        await batch.commit();
      }
    } else {
      await addDoc(collection(db, 'album_photos'), { albumId: activeAlbum!.id, pageNumber: 1, photos: reorderedPhotos });
    }
    loadAlbums(); // refresh state
  });

  // ─ Photo upload files selected ─
  const handlePhotoFiles = (files: File[]) => {
    setUploadFiles(files);
    setUploadPreviews(files.map(f => URL.createObjectURL(f)));
    setUploadProgress(files.map(() => 0));
  };

  // ─ Confirm photo upload ─
  const handleConfirmUpload = async () => {
    if (!activeAlbum || uploadFiles.length === 0) return;
    setUploading(true);
    try {
      const newPhotos: Photo[] = [];
      for (let i = 0; i < uploadFiles.length; i++) {
        const res = await uploadImage(uploadFiles[i], `${siteId}/albums/${activeAlbum.id}`, (pct) => {
          setUploadProgress(prev => { const n = [...prev]; n[i] = pct; return n; });
        });
        newPhotos.push({
          publicId: res.publicId,
          url: res.secureUrl,
          src: res.secureUrl, // Legacy compatibilidade
          date: new Date().toISOString(),
        });
      }
      const updatedPhotos = [...(activeAlbum.photos || []), ...newPhotos];
      const pSnap = await getDocs(query(collection(db, 'album_photos'), where('albumId', '==', activeAlbum.id)));
      if (!pSnap.empty) {
        await updateDoc(doc(db, 'album_photos', pSnap.docs[0].id), { photos: updatedPhotos });
        if (pSnap.docs.length > 1) {
          const batch = writeBatch(db);
          for (let i = 1; i < pSnap.docs.length; i++) { batch.delete(doc(db, 'album_photos', pSnap.docs[i].id)); }
          await batch.commit();
        }
      } else {
        await addDoc(collection(db, 'album_photos'), { albumId: activeAlbum.id, pageNumber: 1, photos: updatedPhotos });
      }
      show(`${uploadFiles.length} foto(s) enviada(s) com sucesso!`);
      setUploadFiles([]);
      setUploadPreviews([]);
      loadAlbums();
    } catch (e: any) { show('Erro no upload: ' + e.message, 'err'); }
    setUploading(false);
  };

  // ─ Delete photo ─
  const handleDeletePhoto = async (photo: Photo) => {
    if (!activeAlbum || !confirm('Deletar esta foto?')) return;
    try {
      // handleDeletePhoto might delete old photos that don't have publicId but have url/src
      const updatedPhotos = photos.filter(p => (p.publicId || p.url || p.src) !== (photo.publicId || photo.url || photo.src));
      const pSnap = await getDocs(query(collection(db, 'album_photos'), where('albumId', '==', activeAlbum.id)));
      if (!pSnap.empty) {
        await updateDoc(doc(db, 'album_photos', pSnap.docs[0].id), { photos: updatedPhotos });
      }
      setPhotos(updatedPhotos);
      show('Foto deletada!');
      loadAlbums();
    } catch (e: any) { show('Erro ao deletar: ' + e.message, 'err'); }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Photo editor (inside an album)
  // ─────────────────────────────────────────────────────────────────────────────
  if (activeAlbum) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {Toast}
        <div className="flex items-center gap-3">
          <button onClick={() => setActiveAlbum(null)} className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Álbuns
          </button>
          <span className="text-slate-600">/</span>
          <h1 className="text-2xl font-bold text-white">{activeAlbum.title}</h1>
          <span className="text-slate-500 text-sm font-mono">{photos.length} fotos</span>
        </div>

        {/* Upload zone */}
        {uploadFiles.length === 0 ? (
          <DropZone onFiles={handlePhotoFiles} label="Solte as fotos aqui ou clique para selecionar. Você pode selecionar várias de uma vez." />
        ) : (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-white">{uploadFiles.length} foto(s) selecionada(s)</p>
              <button onClick={() => { setUploadFiles([]); setUploadPreviews([]); }} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2">
              {uploadPreviews.map((src, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden relative bg-slate-900">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs text-white font-mono">{uploadProgress[i]}%</div>}
                </div>
              ))}
            </div>
            {uploading && <ProgressBar pct={Math.round(uploadProgress.reduce((a, b) => a + b, 0) / uploadProgress.length)} />}
            <div className="flex gap-3">
              <Button onClick={handleConfirmUpload} isLoading={uploading} className="gap-2">
                <Upload className="w-4 h-4" /> Fazer Upload
              </Button>
              <Button variant="secondary" onClick={() => { setUploadFiles([]); setUploadPreviews([]); }} className="bg-slate-700 text-white">Cancelar</Button>
            </div>
          </div>
        )}

        {/* Photos grid */}
        {photos.length === 0 ? (
          <div className="text-center p-12 border border-dashed border-slate-700 rounded-xl text-slate-500">
            <ImageIcon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            Nenhuma foto. Use a área acima para fazer upload.
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-500">💡 Arraste as fotos para reordená-las</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {photos.map((photo, idx) => (
                <div
                  key={photo.publicId || photo.url || photo.src || idx}
                  draggable
                  onDragStart={() => photoDnd.handleDragStart(idx)}
                  onDragEnter={() => photoDnd.handleDragEnter(idx)}
                  onDragEnd={photoDnd.handleDrop}
                  onDragOver={e => e.preventDefault()}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-grab active:cursor-grabbing bg-slate-800 border border-slate-700"
                >
                  {photo.publicId ? (
                    <img src={cloudinaryUrl(photo.publicId, { w: 400, q: 70 })} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                  ) : (photo.url || photo.src) ? (
                    <img src={photo.url || photo.src} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
                  ) : (
                    <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-500" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button onClick={() => handleDeletePhoto(photo)} className="p-2 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-4 h-4 text-white drop-shadow" />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER: Album list
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {Toast}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Álbuns de Fotos</h1>
          <p className="text-slate-400 mt-1">Crie e organize os álbuns exibidos no site.</p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2 shrink-0">
          <Plus className="w-4 h-4" /> Novo Álbum
        </Button>
      </div>

      {/* Create album form */}
      {creating && (
        <div className="bg-slate-800 border border-rose-500/40 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-white text-lg">Criar Novo Álbum</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Título *</label>
              <Input value={newAlbum.title} onChange={e => setNewAlbum({ ...newAlbum, title: e.target.value })} className="bg-slate-900 border-slate-700 text-slate-200" placeholder="Ex: Nosso Natal 2024" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Data *</label>
              <Input type="date" value={newAlbum.date} onChange={e => setNewAlbum({ ...newAlbum, date: e.target.value })} className="bg-slate-900 border-slate-700 text-slate-200" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Descrição</label>
            <textarea value={newAlbum.description} onChange={e => setNewAlbum({ ...newAlbum, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-rose-500/50 focus:outline-none resize-none" rows={2} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Foto de Capa</label>
            {coverPreview ? (
              <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-600">
                <img src={coverPreview} alt="" className="w-full h-full object-cover" />
                <button onClick={() => { setCoverFile(null); setCoverPreview(null); }} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <DropZone onFiles={handleCoverFile} multiple={false} label="Clique para selecionar a capa" />
            )}
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreateAlbum} isLoading={saving} className="gap-2"><Plus className="w-4 h-4" /> Criar Álbum</Button>
            <Button variant="secondary" onClick={() => setCreating(false)} className="bg-slate-700 text-white">Cancelar</Button>
          </div>
        </div>
      )}

      {/* Albums list */}
      {loading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : albums.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-slate-700 rounded-xl text-slate-500">Nenhum álbum criado ainda.</div>
      ) : (
        <>
          <p className="text-xs text-slate-500">💡 Arraste os álbuns para reordená-los</p>
          <div className="space-y-2">
            {albums.map((album, idx) => (
              <div key={album.id}>
                <div
                  draggable
                  onDragStart={() => albumDnd.handleDragStart(idx)}
                  onDragEnter={() => albumDnd.handleDragEnter(idx)}
                  onDragEnd={albumDnd.handleDrop}
                  onDragOver={e => e.preventDefault()}
                  className="flex items-center gap-4 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:border-slate-600 transition-colors group cursor-grab active:cursor-grabbing"
                >
                  <GripVertical className="w-5 h-5 text-slate-600 flex-shrink-0" />
                  {album.coverPublicId ? (
                    <img src={cloudinaryUrl(album.coverPublicId, { w: 80, h: 80, c: 'fill', q: 70 })} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : album.coverUrl ? (
                    <img src={album.coverUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <ImageIcon className="w-6 h-6 text-slate-500" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white truncate">{album.title}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">{album.date}</p>
                    {album.description && <p className="text-sm text-slate-400 truncate mt-0.5">{album.description}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setActiveAlbum(album)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      Ver Fotos <ChevronRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => openEdit(album)} className="p-2 text-slate-500 hover:text-blue-400 transition-colors opacity-50 group-hover:opacity-100">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteAlbum(album)} className="p-2 text-slate-500 hover:text-red-400 transition-colors opacity-50 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Edit form expands below the album row */}
                {editingAlbumId === album.id && (
                  <div className="bg-slate-800/80 border border-blue-500/40 rounded-xl p-6 space-y-4 ml-9 mt-2 animate-in fade-in zoom-in-95 duration-200">
                    <h2 className="font-bold text-white text-lg">Editar Álbum</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Título *</label>
                        <Input value={editAlbum.title} onChange={e => setEditAlbum({ ...editAlbum, title: e.target.value })} className="bg-slate-900 border-slate-700 text-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Data *</label>
                        <Input type="date" value={editAlbum.date} onChange={e => setEditAlbum({ ...editAlbum, date: e.target.value })} className="bg-slate-900 border-slate-700 text-slate-200" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Descrição</label>
                      <textarea value={editAlbum.description} onChange={e => setEditAlbum({ ...editAlbum, description: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500/50 focus:outline-none resize-none" rows={2} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">Foto de Capa</label>
                      {editCoverPreview ? (
                        <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-slate-600">
                          <img src={editCoverPreview} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => { setEditCoverFile(null); setEditCoverPreview(null); }} className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white"><X className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <DropZone onFiles={(f) => { if (f[0]) { setEditCoverFile(f[0]); setEditCoverPreview(URL.createObjectURL(f[0])); } }} multiple={false} label="Selecionar nova capa" />
                      )}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button onClick={handleUpdateAlbum} isLoading={savingEdit} className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><Save className="w-4 h-4" /> Salvar Alterações</Button>
                      <Button variant="secondary" onClick={() => setEditingAlbumId(null)} className="bg-slate-700 text-white">Cancelar</Button>
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

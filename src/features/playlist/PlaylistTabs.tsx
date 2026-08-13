import { useEffect, useRef, useState } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { usePlayerStore } from '../../store/playerStore';
import type { Track } from '../../store/playerStore';
import { useAudio } from '../player/useAudio';
import { Play, Pause, Music, SkipBack, SkipForward, Shuffle, Repeat } from 'lucide-react';
import { cn } from '../../shared/utils/cn';

interface PlaylistData {
  id: string;
  name: string;
  description: string;
  coverUrl: string;
  tracks: Track[];
}

// ── Formata segundos → "m:ss"
function fmt(t: number) {
  if (!t || isNaN(t)) return '0:00';
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlaylistTabs() {
  const { config } = useSiteConfigStore();
  const [playlists, setPlaylists] = useState<PlaylistData[]>([]);
  const [loading, setLoading] = useState(true);
  // Tab ativa (qual playlist o usuário está vendo)
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const {
    playlist: currentTracks,
    isPlaying,
    setPlaylist,
    togglePlayPause,
    nextTrack,
    previousTrack,
    isShuffle,
    toggleShuffle,
    isRepeat,
    toggleRepeat,
    currentTrackIndex,
    playTrack,
  } = usePlayerStore();

  // Hook de áudio — mantém um único elemento <audio> global
  const { currentTime, duration, seek } = useAudio();

  // Drag na barra de progresso
  const isSeeking = useRef(false);
  const [seekValue, setSeekValue] = useState(0);

  // ── Sync seekValue com currentTime quando não estiver arrastando
  useEffect(() => {
    if (!isSeeking.current) setSeekValue(currentTime);
  }, [currentTime]);

  // ── Carregar playlists do Firestore ────────────────────────────────────────
  useEffect(() => {
    if (!config?.id) return;
    const fetchPlaylists = async () => {
      try {
        const snapshot = await getDocs(query(collection(db, 'custom_playlists'), orderBy('orderIndex', 'asc')));
        const loaded: PlaylistData[] = [];
        snapshot.forEach(doc => {
          if (doc.id === '_placeholder') return;
          const data = doc.data();
          loaded.push({
            id: doc.id,
            name: data.name || data.title || '',
            description: data.description || '',
            coverUrl: data.cover || data.coverUrl || '',
            tracks: [],
          });
        });

        // Carregar tracks individuais de cada playlist
        for (const p of loaded) {
          const tSnap = await getDocs(query(collection(db, 'playlist_tracks'), where('playlistId', '==', p.id)));
          const allTracks: Track[] = [];
          tSnap.forEach(tDoc => {
            const data = tDoc.data();
            if (data.title) {
              allTracks.push({
                ...data,
                id: tDoc.id,
                url: data.url || data.src,
                coverUrl: data.coverUrl || data.cover,
              } as Track);
            }
          });
          // Ordenar por orderIndex (legado)
          allTracks.sort((a: any, b: any) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
          p.tracks = allTracks;
        }

        setPlaylists(loaded);
        if (loaded.length > 0) setActiveTabId(loaded[0].id);
      } catch (err) {
        console.error('Erro ao carregar playlists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylists();
  }, [config?.id]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-rose-300/40 animate-pulse text-sm">
        Carregando playlists...
      </div>
    );
  }

  if (playlists.length === 0) return null;

  const activeTabPlaylist = playlists.find(p => p.id === activeTabId) || playlists[0];

  // A playlist carregada no store (pode ser qualquer uma, não necessariamente a tab ativa)
  // Verificamos se o store está tocando a mesma playlist da tab ativa
  const isCurrentTabLoaded =
    currentTracks.length > 0 &&
    activeTabPlaylist.tracks.length > 0 &&
    currentTracks.some(t => t.url === activeTabPlaylist.tracks[0]?.url);

  // Qual playlist está de fato ativa no player (qualquer tab que tenha tracks no store)
  const loadedPlaylist = playlists.find(p =>
    p.tracks.length > 0 &&
    currentTracks.length > 0 &&
    currentTracks.some(t => t.url === p.tracks[0]?.url)
  ) || null;

  // Track sendo mostrado no card:
  // - Se a tab ativa é a que está tocando → mostra a track atual do store
  // - Se não → mostra a primeira track da tab ativa (preview)
  const displayTrack = isCurrentTabLoaded && currentTracks[currentTrackIndex]
    ? currentTracks[currentTrackIndex]
    : activeTabPlaylist.tracks[0];

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handlePlayPause = () => {
    if (isCurrentTabLoaded) {
      // A playlist da tab ativa já está no store → apenas toggle
      togglePlayPause();
    } else {
      // Carregar a playlist da tab ativa e dar play
      setPlaylist(activeTabPlaylist.tracks);
      // isPlaying será true após setPlaylist + useAudio reagir
      // Mas precisamos de um tick para o store atualizar — usamos setTimeout 0
      setTimeout(() => usePlayerStore.getState().playTrack(0), 50);
    }
  };

  const handleTrackClick = (idx: number) => {
    if (!isCurrentTabLoaded) {
      setPlaylist(activeTabPlaylist.tracks);
      setTimeout(() => usePlayerStore.getState().playTrack(idx), 50);
    } else {
      playTrack(idx);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeekValue(Number(e.target.value));
  };
  const handleSeekCommit = (e: React.ChangeEvent<HTMLInputElement>) => {
    isSeeking.current = false;
    seek(Number(e.target.value));
  };

  const progressPercent = duration > 0 ? (seekValue / duration) * 100 : 0;

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8 px-4">

      {/* ── Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 w-full justify-center no-scrollbar">
        {playlists.map((p) => {
          const isTabPlaying = loadedPlaylist?.id === p.id && isPlaying;
          return (
            <button
              key={p.id}
              onClick={() => setActiveTabId(p.id)}
              className={cn(
                'relative px-5 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-300 border flex items-center gap-2',
                activeTabId === p.id
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(225,29,72,0.15)]'
                  : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200'
              )}
            >
              {/* Indicador de tocando */}
              {isTabPlaying && (
                <span className="flex gap-0.5 items-end h-3">
                  <span className="w-0.5 bg-rose-400 animate-[bounce_0.8s_ease-in-out_infinite]" style={{ height: '100%', animationDelay: '0s' }} />
                  <span className="w-0.5 bg-rose-400 animate-[bounce_0.8s_ease-in-out_infinite]" style={{ height: '60%', animationDelay: '0.15s' }} />
                  <span className="w-0.5 bg-rose-400 animate-[bounce_0.8s_ease-in-out_infinite]" style={{ height: '80%', animationDelay: '0.3s' }} />
                </span>
              )}
              {p.name}
            </button>
          );
        })}
      </div>

      {/* ── Player Card ── */}
      <div className="relative w-full max-w-sm">
        {/* Glow */}
        <div className="absolute inset-0 bg-rose-500/15 blur-3xl rounded-full scale-75 opacity-60 pointer-events-none" />

        <div className="relative rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-white/10 p-6 shadow-2xl overflow-hidden transition-all duration-500 hover:border-rose-500/20">

          {/* Equalizer badge (topo direito) */}
          {isCurrentTabLoaded && isPlaying && (
            <div className="absolute top-4 right-4 flex gap-0.5 items-end h-4">
              <div className="w-1 bg-rose-500 rounded-full animate-[bounce_0.9s_ease-in-out_infinite]" style={{ height: '100%', animationDelay: '0.0s' }} />
              <div className="w-1 bg-rose-500 rounded-full animate-[bounce_0.9s_ease-in-out_infinite]" style={{ height: '60%', animationDelay: '0.2s' }} />
              <div className="w-1 bg-rose-500 rounded-full animate-[bounce_0.9s_ease-in-out_infinite]" style={{ height: '80%', animationDelay: '0.1s' }} />
            </div>
          )}

          {/* ── Capa ── */}
          <div className={cn(
            'relative w-40 h-40 mx-auto mb-5 rounded-2xl overflow-hidden shadow-2xl',
            isCurrentTabLoaded && isPlaying ? 'ring-2 ring-rose-500/50 ring-offset-2 ring-offset-slate-900' : ''
          )}>
            {displayTrack?.coverUrl || activeTabPlaylist.coverUrl ? (
              <img
                src={displayTrack?.coverUrl || activeTabPlaylist.coverUrl}
                alt={displayTrack?.title || activeTabPlaylist.name}
                className={cn(
                  'w-full h-full object-cover transition-transform duration-700',
                  isCurrentTabLoaded && isPlaying ? 'scale-105' : 'hover:scale-105'
                )}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-800 to-rose-950 flex items-center justify-center">
                <Music className="w-14 h-14 text-white/20" />
              </div>
            )}
            {/* Overlay escuro quando tocando */}
            <div className={cn(
              'absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.35)_100%)] pointer-events-none transition-opacity duration-500',
              isCurrentTabLoaded && isPlaying ? 'opacity-100' : 'opacity-0'
            )} />
          </div>

          {/* ── Info ── */}
          <div className="text-center mb-5">
            <h3 className="text-base font-bold text-white mb-0.5 truncate px-2 leading-tight">
              {displayTrack?.title || 'Sem faixas'}
            </h3>
            <p className="text-xs text-slate-400 truncate px-2">
              {displayTrack?.artist || activeTabPlaylist.name}
            </p>
          </div>

          {/* ── Barra de Progresso ── */}
          <div className="mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-mono w-8 text-right flex-shrink-0">
                {isCurrentTabLoaded ? fmt(seekValue) : '0:00'}
              </span>
              <div className="relative flex-1 group">
                {/* Track de fundo */}
                <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-100"
                    style={{ width: isCurrentTabLoaded ? `${progressPercent}%` : '0%' }}
                  />
                </div>
                {/* Input range invisível por cima */}
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={isCurrentTabLoaded ? seekValue : 0}
                  disabled={!isCurrentTabLoaded}
                  onMouseDown={() => { isSeeking.current = true; }}
                  onTouchStart={() => { isSeeking.current = true; }}
                  onChange={handleSeekChange}
                  onMouseUp={handleSeekCommit}
                  onTouchEnd={handleSeekCommit}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-4 -top-1.5 disabled:cursor-default"
                />
                {/* Thumb visível */}
                {isCurrentTabLoaded && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `calc(${progressPercent}% - 6px)` }}
                  />
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-mono w-8 flex-shrink-0">
                {isCurrentTabLoaded ? fmt(duration) : fmt((displayTrack as any)?.duration || 0)}
              </span>
            </div>
          </div>

          {/* ── Controles ── */}
          <div className="flex items-center justify-center gap-5 mb-2">
            <button
              onClick={toggleShuffle}
              className={cn(
                'transition-colors p-1.5 rounded-full',
                isShuffle ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'
              )}
              disabled={!isCurrentTabLoaded}
              title="Aleatório"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={() => { if (!isCurrentTabLoaded) { setPlaylist(activeTabPlaylist.tracks); setTimeout(() => usePlayerStore.getState().previousTrack(), 50); } else previousTrack(); }}
              className="text-slate-300 hover:text-white transition-colors p-1.5"
              title="Anterior"
            >
              <SkipBack className="w-5 h-5 fill-current" />
            </button>

            {/* Play/Pause principal */}
            <button
              onClick={handlePlayPause}
              className="w-14 h-14 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-400 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-rose-500/30"
              title={isCurrentTabLoaded && isPlaying ? 'Pausar' : 'Tocar'}
            >
              {isCurrentTabLoaded && isPlaying ? (
                <Pause className="w-6 h-6 fill-current" />
              ) : (
                <Play className="w-6 h-6 fill-current ml-1" />
              )}
            </button>

            <button
              onClick={() => { if (!isCurrentTabLoaded) { setPlaylist(activeTabPlaylist.tracks); setTimeout(() => usePlayerStore.getState().nextTrack(), 50); } else nextTrack(); }}
              className="text-slate-300 hover:text-white transition-colors p-1.5"
              title="Próxima"
            >
              <SkipForward className="w-5 h-5 fill-current" />
            </button>

            <button
              onClick={toggleRepeat}
              className={cn(
                'transition-colors p-1.5 rounded-full',
                isRepeat ? 'text-rose-400' : 'text-slate-500 hover:text-slate-300'
              )}
              disabled={!isCurrentTabLoaded}
              title="Repetir"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* ── Lista de faixas ── */}
      {activeTabPlaylist.tracks.length > 0 && (
        <div className="w-full max-w-sm space-y-1">
          <p className="text-xs text-slate-500 mb-2 px-1">
            {activeTabPlaylist.tracks.length} faixa{activeTabPlaylist.tracks.length !== 1 ? 's' : ''}
          </p>
          {activeTabPlaylist.tracks.map((track, idx) => {
            // Índice na playlist do store (caso a tab ativa seja a carregada)
            const storeIdx = isCurrentTabLoaded ? currentTracks.findIndex(t => t.url === track.url) : -1;
            const isThisPlaying = isCurrentTabLoaded && storeIdx === currentTrackIndex;

            return (
              <button
                key={track.id || idx}
                onClick={() => handleTrackClick(idx)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left group',
                  isThisPlaying
                    ? 'bg-rose-500/10 border border-rose-500/20'
                    : 'hover:bg-white/5 border border-transparent'
                )}
              >
                {/* Número / Equalizer */}
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  {isThisPlaying && isPlaying ? (
                    <span className="flex gap-0.5 items-end h-4">
                      <span className="w-0.5 bg-rose-400 animate-[bounce_0.8s_ease-in-out_infinite] block" style={{ height: '100%' }} />
                      <span className="w-0.5 bg-rose-400 animate-[bounce_0.8s_ease-in-out_infinite] block" style={{ height: '60%', animationDelay: '0.15s' }} />
                      <span className="w-0.5 bg-rose-400 animate-[bounce_0.8s_ease-in-out_infinite] block" style={{ height: '80%', animationDelay: '0.3s' }} />
                    </span>
                  ) : (
                    <span className={cn(
                      'text-xs font-mono',
                      isThisPlaying ? 'text-rose-400' : 'text-slate-600 group-hover:text-slate-400'
                    )}>
                      {idx + 1}
                    </span>
                  )}
                </div>

                {/* Capa pequena */}
                {track.coverUrl ? (
                  <img
                    src={track.coverUrl}
                    alt=""
                    className="w-8 h-8 rounded-md object-cover flex-shrink-0 bg-slate-800"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-md bg-slate-800 flex items-center justify-center flex-shrink-0">
                    <Music className="w-3 h-3 text-slate-600" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium truncate',
                    isThisPlaying ? 'text-rose-300' : 'text-slate-200 group-hover:text-white'
                  )}>
                    {track.title}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{track.artist}</p>
                </div>

                {/* Duração */}
                {(track as any).duration && (
                  <span className="text-xs text-slate-600 font-mono flex-shrink-0">
                    {fmt((track as any).duration)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}

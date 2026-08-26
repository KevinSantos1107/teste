import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { cn } from '../../shared/utils/cn';
import { imagePreloader } from './ImagePreloader';
import { cloudinaryUrl } from '../../services/cloudinary/upload';

interface Photo {
  id?: string;
  src?: string;
  url?: string;
  description?: string;
  caption?: string;
  publicId?: string;
}

interface Album {
  id: string;
  title: string;
  description?: string;
  date?: string;
  photos: Photo[];
}

interface AlbumViewerModalProps {
  albums: Album[];
  initialAlbumIndex: number;
  onClose: () => void;
  onAlbumChange?: (index: number) => void;
}

// ─── Helper para URL da foto ────────────────────────────────────────────────
function getPhotoUrl(photo: Photo): string {
  if (photo.src || photo.url) return (photo.src || photo.url) as string;
  if (photo.publicId) {
    if (photo.publicId.startsWith('http')) return photo.publicId;
    // Otimiza para tela cheia: auto format, fl_progressive, quality auto
    return cloudinaryUrl(photo.publicId, { f: 'auto', q: 'auto' as any });
  }
  return '';
}

// ─── Painel de um álbum ───────────────────────────────────────────────────────
function AlbumPanel({ album, photoIndex }: { album: Album | undefined; photoIndex: number }) {
  if (!album) return <div className="w-full h-full bg-black" />;
  const photo = album.photos[photoIndex];
  const url = photo ? getPhotoUrl(photo) : '';
  const caption = photo?.caption || photo?.description;

  return (
    <div className="w-full h-full relative bg-black flex items-center justify-center">
      {/* Barras de progresso */}
      <div className="absolute top-4 inset-x-0 z-50 flex gap-[3px] px-4 drop-shadow-md">
        {album.photos.map((_, i) => (
          <div key={i} className="flex-1 h-[3px] bg-white/25 rounded-full overflow-hidden">
            <div className={cn('h-full bg-white rounded-full transition-all duration-200', i <= photoIndex ? 'w-full' : 'w-0')} />
          </div>
        ))}
      </div>

      {/* Título */}
      <div className="absolute top-9 left-4 z-50 pointer-events-none">
        <p className="text-white/90 font-semibold text-sm drop-shadow">{album.title}</p>
      </div>

      {/* Foto - renderização instantânea (sem fade, puxa direto do cache) */}
      {url && (
        <img
          key={url} // Garante que a tag atualize sem flickering de estado anterior
          src={url}
          alt={caption || `Foto ${photoIndex + 1}`}
          draggable={false}
          className="w-full h-full object-contain select-none pointer-events-none"
        />
      )}

      {/* Legenda */}
      {caption && (
        <div className="absolute bottom-8 inset-x-0 flex justify-center px-6 pointer-events-none">
          <div className="bg-black/55 backdrop-blur-md text-white text-sm px-4 py-2 rounded-xl text-center max-w-sm shadow-lg">
            {caption}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Modal principal ──────────────────────────────────────────────────────────
export function AlbumViewerModal({ albums, initialAlbumIndex, onClose, onAlbumChange }: AlbumViewerModalProps) {
  const [albumIndex, setAlbumIndex] = useState(initialAlbumIndex);
  const [photoIndexes, setPhotoIndexes] = useState<Record<string, number>>({});

  // Refs para acesso sem stale closures
  const albumIndexRef = useRef(initialAlbumIndex);
  const photoIndexesRef = useRef<Record<string, number>>({});
  const transitioning = useRef(false);

  // Largura da janela (capturada uma vez)
  const W = useRef(window.innerWidth);

  // ── Motion values ─────────────────────────────────────────────────────────
  const y = useMotionValue(0);
  const bgOpacity = useTransform(y, [-300, 0, 300], [0, 1, 0]);
  const contentScale = useTransform(y, [-300, 0, 300], [0.85, 1, 0.85]);
  const bgColor = useTransform(bgOpacity, (o) => `rgba(0,0,0,${Number(o) * 0.97})`);

  const dragX = useMotionValue(0);
  const stripX = useTransform(dragX, (v) => v - W.current);

  const gesture = useRef<{
    startX: number;
    startY: number;
    startTime: number;
    direction: 'idle' | 'h' | 'v';
    pointerId: number | null;
  }>({ startX: 0, startY: 0, startTime: 0, direction: 'idle', pointerId: null });

  // ── Bloquear scroll do fundo ──────────────────────────────────────────────
  useEffect(() => {
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = orig; };
  }, []);

  // ── SMART PRELOADING ──────────────────────────────────────────────────────
  useEffect(() => {
    const urls: string[] = [];
    
    const addUrl = (aIdx: number, pIdx: number) => {
      const a = albums[aIdx];
      if (!a) return;
      const p = a.photos[pIdx];
      if (!p) return;
      const url = getPhotoUrl(p);
      if (url && !urls.includes(url)) urls.push(url);
    };

    const curA = albumIndex;
    const curP = photoIndexes[albums[curA]?.id] ?? 0;

    // 1. Alta prioridade: Próximas fotos no mesmo álbum
    addUrl(curA, curP + 1);
    addUrl(curA, curP + 2);
    addUrl(curA, curP + 3);

    // 2. Média prioridade: Foto anterior (se o usuário voltar)
    addUrl(curA, curP - 1);

    // 3. Primeira foto do PRÓXIMO álbum (caso passe de álbum)
    const nextA = curA + 1;
    const nextAP = photoIndexes[albums[nextA]?.id] ?? 0;
    addUrl(nextA, nextAP);
    addUrl(nextA, nextAP + 1); // e a seguinte também

    // 4. Primeira foto do ÁLBUM ANTERIOR
    const prevA = curA - 1;
    const prevAP = photoIndexes[albums[prevA]?.id] ?? 0;
    addUrl(prevA, prevAP);

    // Envia fila para o worker de cache
    imagePreloader.setPriority(urls);
  }, [albumIndex, photoIndexes, albums]);

  // ── Ir para álbum ─────────────────────────────────────────────────────────
  const goToAlbum = useCallback((idx: number) => {
    if (albums.length === 0) return;
    const wrappedIdx = (idx + albums.length) % albums.length;
    albumIndexRef.current = wrappedIdx;
    setAlbumIndex(wrappedIdx);
    onAlbumChange?.(wrappedIdx);
  }, [albums.length, onAlbumChange]);

  // ── Navegar foto / transbordar para álbum ─────────────────────────────────
  const navigatePhoto = useCallback((dir: number) => {
    if (transitioning.current || albums.length === 0) return;
    const album = albums[albumIndexRef.current];
    if (!album) return;

    const curr = photoIndexesRef.current[album.id] ?? 0;
    const next = curr + dir;

    if (next >= 0 && next < album.photos.length) {
      const updated = { ...photoIndexesRef.current, [album.id]: next };
      photoIndexesRef.current = updated;
      setPhotoIndexes({ ...updated });
    } else {
      const newIdx = albumIndexRef.current + dir;
      const targetX = dir > 0 ? -W.current : W.current;
      transitioning.current = true;
      animate(dragX, targetX, { type: 'tween', duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] })
        .then(() => {
          goToAlbum(newIdx);
          dragX.set(0);
          transitioning.current = false;
        });
    }
  }, [albums, goToAlbum, dragX]);

  // ── Teclado ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowRight') navigatePhoto(+1);
      if (e.key === 'ArrowLeft') navigatePhoto(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigatePhoto, onClose]);

  // ── Pointer events ────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gesture.current.pointerId !== null || transitioning.current) return;
    gesture.current = {
      startX: e.clientX,
      startY: e.clientY,
      startTime: Date.now(),
      direction: 'idle',
      pointerId: e.pointerId,
    };
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gesture.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - gesture.current.startX;
    const dy = e.clientY - gesture.current.startY;

    if (gesture.current.direction === 'idle') {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        gesture.current.direction = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
      }
    }

    if (gesture.current.direction === 'h') {
      dragX.set(dx); // Removida a resistência nas bordas para permitir loop livre
    } else if (gesture.current.direction === 'v') {
      y.set(dy);
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (gesture.current.pointerId !== e.pointerId) return;

    const { startX, startY, startTime, direction } = gesture.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const dt = Math.max(Date.now() - startTime, 1);
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const velX = dx / dt;
    const velY = dy / dt;

    gesture.current.pointerId = null;
    gesture.current.direction = 'idle';

    if (direction === 'idle' || (absDx < 12 && absDy < 12)) {
      navigatePhoto(e.clientX > W.current / 2 ? +1 : -1);
    } else if (direction === 'h') {
      const swipeDir = dx < 0 ? +1 : -1;
      const newIdx = albumIndexRef.current + swipeDir;
      const shouldSwipe = (absDx > 50 || Math.abs(velX) > 0.25) && albums.length > 1;

      if (shouldSwipe) {
        transitioning.current = true;
        const targetX = dx < 0 ? -W.current : W.current;
        animate(dragX, targetX, { type: 'tween', duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] })
          .then(() => {
            goToAlbum(newIdx);
            dragX.set(0);
            transitioning.current = false;
          });
      } else {
        animate(dragX, 0, { type: 'spring', stiffness: 320, damping: 32 });
      }
    } else if (direction === 'v') {
      if (absDy > 120 || Math.abs(velY) > 0.4) {
        animate(y, dy > 0 ? window.innerHeight : -window.innerHeight, { duration: 0.25 })
          .then(onClose);
      } else {
        animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
      }
    }
  };

  const onPointerCancel = () => {
    gesture.current.pointerId = null;
    gesture.current.direction = 'idle';
    animate(dragX, 0, { type: 'spring', stiffness: 320, damping: 32 });
    animate(y, 0, { type: 'spring', stiffness: 300, damping: 30 });
  };

  // ── Dados dos três painéis ────────────────────────────────────────────────
  const N = albums.length;
  const prevAlbum = N > 0 ? albums[(albumIndex - 1 + N) % N] : undefined;
  const curAlbum = N > 0 ? albums[albumIndex] : undefined;
  const nextAlbum = N > 0 ? albums[(albumIndex + 1) % N] : undefined;
  
  const getPhotoIdx = (album: Album | undefined) =>
    album ? (photoIndexes[album.id] ?? 0) : 0;

  // ── Render ────────────────────────────────────────────────────────────────
  return createPortal(
    <motion.div
      style={{ backgroundColor: bgColor }}
      className="fixed inset-0 z-[99999] touch-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <motion.div style={{ y, scale: contentScale }} className="w-full h-[100dvh] overflow-hidden">
        <motion.div
          style={{ x: stripX }}
          className="flex h-full"
        >
          <div style={{ width: W.current, flexShrink: 0 }}>
            <AlbumPanel key={prevAlbum?.id || 'prev-none'} album={prevAlbum} photoIndex={getPhotoIdx(prevAlbum)} />
          </div>

          <div style={{ width: W.current, flexShrink: 0 }}>
            <AlbumPanel key={curAlbum?.id || 'cur-none'} album={curAlbum} photoIndex={getPhotoIdx(curAlbum)} />
          </div>

          <div style={{ width: W.current, flexShrink: 0 }}>
            <AlbumPanel key={nextAlbum?.id || 'next-none'} album={nextAlbum} photoIndex={getPhotoIdx(nextAlbum)} />
          </div>
        </motion.div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

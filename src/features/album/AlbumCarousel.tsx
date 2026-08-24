import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, EffectCoverflow } from 'swiper/modules';
import { AlbumCube } from './AlbumCube';
import { X, Images } from 'lucide-react';
import { cn } from '../../shared/utils/cn';
import { cloudinaryUrl } from '../../services/cloudinary/upload';

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/effect-coverflow';

interface Photo {
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
  cover?: string;
  coverThumb?: string;
  coverLarge?: string;
  coverPublicId?: string;
  photos: Photo[];
}

// ─── Modal via Portal (bypasses overflow-x-hidden stacking context) ────────────
function AlbumModal({ album, onClose }: { album: Album; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const modal = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999,
        backgroundColor: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0,0,0,0.4)',
        flexShrink: 0,
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#fff', fontFamily: 'serif' }}>
            {album.title}
          </h3>
          {album.description && (
            <p style={{ margin: '4px 0 0', fontSize: '0.875rem', color: '#94a3b8' }}>{album.description}</p>
          )}
          <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: 'var(--theme-secondary, #e0aaff)' }}>
            {album.photos.length} fotos{album.date ? ` · ${album.date}` : ''}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <X style={{ width: 22, height: 22 }} />
        </button>
      </div>

      {/* Body */}
      <div style={{
        flex: 1, overflowY: 'auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '32px 16px',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <AlbumCube photos={album.photos} />
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.75rem', marginTop: 20 }}>
            Deslize o cubo para girar · Toque fora para fechar
          </p>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

// ─── Main Carousel ─────────────────────────────────────────────────────────────
export function AlbumCarousel() {
  const { config } = useSiteConfigStore();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, 'albums'), orderBy('createdAt', 'asc'))
        );
        if (snapshot.empty) { setAlbums([]); setLoading(false); return; }

        const albumIds = snapshot.docs.map((d) => d.id);
        const photoSnapshots = await Promise.all(
          albumIds.map((id) =>
            getDocs(query(
              collection(db, 'album_photos'),
              where('albumId', '==', id),
              orderBy('pageNumber', 'asc')
            ))
          )
        );

        const loaded: Album[] = snapshot.docs.map((doc, idx) => {
          const d = doc.data();
          const allPhotos: Photo[] = [];
          photoSnapshots[idx].forEach((pageDoc) => {
            const pd = pageDoc.data();
            if (Array.isArray(pd.photos)) allPhotos.push(...pd.photos);
          });
          return {
            id: doc.id, title: d.title, description: d.description,
            date: d.date, cover: d.cover, coverThumb: d.coverThumb,
            coverLarge: d.coverLarge, coverPublicId: d.coverPublicId, photos: allPhotos,
          };
        });
        setAlbums(loaded);
      } catch (e) {
        console.error('Erro ao carregar álbuns:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbums();
  }, [config?.id]);

  if (loading) {
    return <div className="h-64 flex items-center justify-center text-white/50 animate-pulse">Revelando memórias...</div>;
  }
  if (albums.length === 0) return null;

  const getCover = (album: Album): string | null => {
    if (album.cover || album.coverThumb || album.coverLarge)
      return album.cover || album.coverThumb || album.coverLarge || null;
    if (album.coverPublicId) return cloudinaryUrl(album.coverPublicId, { w: 600 });
    return null;
  };

  return (
    <>
      <div className="w-full relative py-8">
        <Swiper
          effect="coverflow"
          grabCursor centeredSlides slidesPerView="auto"
          coverflowEffect={{ rotate: 20, stretch: 0, depth: 200, modifier: 1, slideShadows: true }}
          modules={[Navigation, EffectCoverflow]}
          navigation
          className="w-full album-coverflow-swiper"
        >
          {albums.map((album) => {
            const coverSrc = getCover(album);
            return (
              <SwiperSlide key={album.id} style={{ width: 280, height: 380 }}>
                {({ isActive }) => (
                  <button
                    onClick={() => isActive && setSelectedAlbum(album)}
                    className={cn(
                      'group relative w-full h-full rounded-2xl overflow-hidden border border-white/10 transition-all duration-300',
                      isActive ? 'cursor-pointer' : 'opacity-80 cursor-default'
                    )}
                  >
                    {coverSrc ? (
                      <img src={coverSrc} alt={album.title}
                        className={cn('w-full h-full object-cover transition-transform duration-700', isActive && 'group-hover:scale-105')}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                        <Images className="w-16 h-16 text-white/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 inset-x-0 p-6 pointer-events-none">
                      <h3 className="text-white font-bold text-xl drop-shadow-lg mb-1">{album.title}</h3>
                      {album.date && <p className="text-white/70 text-sm">{album.date}</p>}
                      <p className="text-slate-300 text-xs mt-2">{album.photos.length} fotos</p>
                    </div>
                    {isActive && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-black/20 backdrop-blur-[2px] pointer-events-none">
                        <span className="bg-white/20 backdrop-blur-md text-white text-sm font-semibold px-6 py-3 rounded-full border border-white/30">
                          Abrir álbum
                        </span>
                      </div>
                    )}
                  </button>
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {/* Modal via Portal */}
      {selectedAlbum && (
        <AlbumModal album={selectedAlbum} onClose={() => setSelectedAlbum(null)} />
      )}

      <style>{`
        .album-coverflow-swiper .swiper-button-next,
        .album-coverflow-swiper .swiper-button-prev {
          color: rgba(255,255,255,0.9);
          background: rgba(255,255,255,0.1);
          width: 44px; height: 44px;
          border-radius: 50%;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          transition: all 0.3s;
        }
        .album-coverflow-swiper .swiper-button-next:hover,
        .album-coverflow-swiper .swiper-button-prev:hover {
          background: rgba(var(--theme-primary-rgb, 157,78,221), 0.4);
          border-color: var(--theme-primary, #9d4edd);
          transform: scale(1.1);
        }
        .album-coverflow-swiper .swiper-button-next::after,
        .album-coverflow-swiper .swiper-button-prev::after {
          font-size: 16px; font-weight: bold;
        }
      `}</style>
    </>
  );
}

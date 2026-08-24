import { useEffect, useState } from 'react';
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

export function AlbumCarousel() {
  const { config } = useSiteConfigStore();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedAlbum) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedAlbum]);

  // Close on ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedAlbum(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, 'albums'), orderBy('createdAt', 'asc'))
        );

        if (snapshot.empty) {
          setAlbums([]);
          setLoading(false);
          return;
        }

        const albumIds = snapshot.docs.map((d) => d.id);

        const photoPromises = albumIds.map((id) =>
          getDocs(
            query(
              collection(db, 'album_photos'),
              where('albumId', '==', id),
              orderBy('pageNumber', 'asc')
            )
          )
        );
        const photoSnapshots = await Promise.all(photoPromises);

        const loaded: Album[] = snapshot.docs.map((doc, index) => {
          const d = doc.data();
          const allPhotos: Photo[] = [];
          photoSnapshots[index].forEach((pageDoc) => {
            const pageData = pageDoc.data();
            if (Array.isArray(pageData.photos)) {
              allPhotos.push(...pageData.photos);
            }
          });
          return {
            id: doc.id,
            title: d.title,
            description: d.description,
            date: d.date,
            cover: d.cover,
            coverThumb: d.coverThumb,
            coverLarge: d.coverLarge,
            coverPublicId: d.coverPublicId,
            photos: allPhotos,
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
    return (
      <div className="h-64 flex items-center justify-center text-white/50 animate-pulse">
        Revelando memórias...
      </div>
    );
  }

  if (albums.length === 0) return null;

  const getCover = (album: Album): string | null => {
    if (album.cover || album.coverThumb || album.coverLarge) {
      return album.cover || album.coverThumb || album.coverLarge || null;
    }
    if (album.coverPublicId) {
      return cloudinaryUrl(album.coverPublicId, { w: 600 });
    }
    return null;
  };

  return (
    <>
      {/* Carrossel Coverflow */}
      <div className="w-full relative py-8">
        <Swiper
          effect={'coverflow'}
          grabCursor={true}
          centeredSlides={true}
          slidesPerView={'auto'}
          coverflowEffect={{
            rotate: 20,
            stretch: 0,
            depth: 200,
            modifier: 1,
            slideShadows: true,
          }}
          modules={[Navigation, EffectCoverflow]}
          navigation
          className="w-full album-coverflow-swiper"
        >
          {albums.map((album) => {
            const coverSrc = getCover(album);
            return (
              <SwiperSlide key={album.id} style={{ width: '280px', height: '380px' }}>
                {({ isActive }) => (
                  <button
                    onClick={() => isActive && setSelectedAlbum(album)}
                    className={cn(
                      'group relative w-full h-full rounded-2xl overflow-hidden border border-white/10 transition-all duration-300',
                      isActive
                        ? 'hover:border-[var(--theme-primary)]/50 hover:shadow-[0_0_30px_rgba(var(--theme-primary-rgb),0.3)]'
                        : 'opacity-80'
                    )}
                  >
                    {coverSrc ? (
                      <img
                        src={coverSrc}
                        alt={album.title}
                        className={cn(
                          'w-full h-full object-cover transition-transform duration-700',
                          isActive ? 'group-hover:scale-105' : ''
                        )}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center">
                        <Images className="w-16 h-16 text-white/20" />
                      </div>
                    )}

                    {/* Overlay gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />

                    {/* Informações do álbum */}
                    <div className="absolute bottom-0 inset-x-0 p-6 pointer-events-none">
                      <h3 className="text-white font-bold text-xl drop-shadow-lg mb-1">
                        {album.title}
                      </h3>
                      {album.date && (
                        <p className="text-[var(--theme-secondary)] text-sm">{album.date}</p>
                      )}
                      <p className="text-slate-300 text-xs mt-2">{album.photos.length} fotos</p>
                    </div>

                    {/* Hover "Abrir" apenas se for o slide central */}
                    {isActive && (
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-[2px]">
                        <span className="bg-white/20 backdrop-blur-md text-white text-sm font-semibold px-6 py-3 rounded-full border border-white/30 shadow-xl">
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

      {/* Modal fullscreen */}
      {selectedAlbum && (
        <div
          className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-md flex flex-col"
          style={{ animation: 'fadeInModal 0.25s ease-out' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAlbum(null);
          }}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-sm">
            <div>
              <h3 className="text-2xl font-serif font-bold text-white">{selectedAlbum.title}</h3>
              {selectedAlbum.description && (
                <p className="text-slate-400 text-sm mt-0.5">{selectedAlbum.description}</p>
              )}
              <p className="text-[var(--theme-secondary)] text-xs mt-0.5">
                {selectedAlbum.photos.length} fotos · {selectedAlbum.date}
              </p>
            </div>
            <button
              onClick={() => setSelectedAlbum(null)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/20 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Conteúdo com scroll */}
          <div className="flex-1 overflow-y-auto flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-md mx-auto">
              <AlbumCube photos={selectedAlbum.photos} />
              <p className="text-center text-slate-500 text-xs mt-6">Deslize o cubo para girar</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .album-coverflow-swiper .swiper-button-next,
        .album-coverflow-swiper .swiper-button-prev {
          color: rgba(255, 255, 255, 0.9);
          background: rgba(255, 255, 255, 0.1);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          transition: all 0.3s;
        }
        .album-coverflow-swiper .swiper-button-next:hover,
        .album-coverflow-swiper .swiper-button-prev:hover {
          background: rgba(var(--theme-primary-rgb), 0.4);
          border-color: var(--theme-primary);
          transform: scale(1.1);
        }
        .album-coverflow-swiper .swiper-button-next:after,
        .album-coverflow-swiper .swiper-button-prev:after {
          font-size: 18px;
          font-weight: bold;
        }
      `}</style>
    </>
  );
}

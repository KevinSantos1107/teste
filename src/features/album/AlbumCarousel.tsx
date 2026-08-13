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

// Estrutura exatamente igual ao site antigo (firebase-config.js)
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
  cover?: string;          // campo raiz "cover" = URL completa (site antigo)
  coverThumb?: string;
  coverLarge?: string;
  coverPublicId?: string;  // campo novo (admin v2)
  photos: Photo[];
}

export function AlbumCarousel() {
  const { config } = useSiteConfigStore();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);

  useEffect(() => {
    // Carrega EXATAMENTE igual ao site antigo: coleção raiz "albums" + "album_photos"
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

        const albumIds = snapshot.docs.map(d => d.id);

        // Buscar fotos de album_photos em paralelo (igual ao site antigo)
        const photoPromises = albumIds.map(id =>
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
          photoSnapshots[index].forEach(pageDoc => {
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
    return <div className="h-64 flex items-center justify-center text-rose-300/50 animate-pulse">Revelando memórias...</div>;
  }

  if (albums.length === 0) return null;

  // Monta URL de capa: usa "cover" (site antigo) ou "coverPublicId" (admin novo)
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
                      "group relative w-full h-full rounded-2xl overflow-hidden border border-white/10 transition-all duration-300",
                      isActive ? "hover:border-rose-500/50 hover:shadow-[0_0_30px_rgba(225,29,72,0.3)]" : "opacity-80"
                    )}
                  >
                    {coverSrc ? (
                      <img
                        src={coverSrc}
                        alt={album.title}
                        className={cn(
                          "w-full h-full object-cover transition-transform duration-700",
                          isActive ? "group-hover:scale-105" : ""
                        )}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-800 to-rose-950 flex items-center justify-center">
                        <Images className="w-16 h-16 text-white/20" />
                      </div>
                    )}
                    
                    {/* Overlay gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent pointer-events-none" />
                    
                    {/* Informações do álbum */}
                    <div className="absolute bottom-0 inset-x-0 p-6 pointer-events-none">
                      <h3 className="text-white font-bold text-xl drop-shadow-lg mb-1">{album.title}</h3>
                      {album.date && <p className="text-rose-300 text-sm">{album.date}</p>}
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

      {/* Modal fullscreen para o AlbumCube */}
      {selectedAlbum && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-300"
          onClick={e => { if (e.target === e.currentTarget) setSelectedAlbum(null); }}
        >
          <div className="relative w-full max-w-sm mx-auto px-4">
            <button
              onClick={() => setSelectedAlbum(null)}
              className="absolute -top-12 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/20 z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center mb-6">
              <h3 className="text-2xl font-serif font-bold text-white">{selectedAlbum.title}</h3>
              {selectedAlbum.description && (
                <p className="text-slate-400 text-sm mt-1">{selectedAlbum.description}</p>
              )}
            </div>
            
            <AlbumCube photos={selectedAlbum.photos} />
            
            <p className="text-center text-slate-500 text-xs mt-10">Deslize o cubo para girar</p>
          </div>
        </div>
      )}

      <style>{`
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
          background: rgba(225, 29, 72, 0.4);
          border-color: rgba(225, 29, 72, 0.8);
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

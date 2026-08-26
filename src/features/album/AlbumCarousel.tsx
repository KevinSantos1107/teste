import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import { AlbumViewerModal } from './AlbumViewerModal';
import { Images } from 'lucide-react';
import { cn } from '../../shared/utils/cn';
import { cloudinaryUrl } from '../../services/cloudinary/upload';

import 'swiper/css';
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
  const [selectedAlbumIndex, setSelectedAlbumIndex] = useState<number | null>(null);
  const [swiperInstance, setSwiperInstance] = useState<SwiperType | null>(null);

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
          onSwiper={setSwiperInstance}
          effect="coverflow"
          loop={true}
          grabCursor
          centeredSlides
          slidesPerView="auto"
          // Desativa o recurso nativo que falha em clones do loop
          slideToClickedSlide={false}
          coverflowEffect={{ rotate: 20, stretch: 0, depth: 200, modifier: 1, slideShadows: true }}
          modules={[EffectCoverflow]}
          className="w-full album-coverflow-swiper"
          // O onTap distingue perfeitamente um clique/toque intencional de um arrasto
          onTap={(swiper) => {
            if (typeof swiper.clickedIndex !== 'number') return;
            
            if (swiper.clickedIndex === swiper.activeIndex) {
              // Clique no centro: abre
              setSelectedAlbumIndex(swiper.realIndex);
            } else {
              // Clique nas laterais: navega de forma forçada
              swiper.slideTo(swiper.clickedIndex);
            }
          }}
        >
          {albums.map((album) => {
            const coverSrc = getCover(album);
            return (
              <SwiperSlide key={album.id} style={{ width: 280, height: 380 }}>
                {({ isActive }) => (
                  <div
                    className={cn(
                      'group relative w-full h-full rounded-2xl overflow-hidden border border-white/10 transition-all duration-300 cursor-pointer',
                      !isActive && 'opacity-80'
                    )}
                  >
                    {coverSrc ? (
                      <img
                        src={coverSrc}
                        alt={album.title}
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
                  </div>
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>

      {selectedAlbumIndex !== null && (
        <AlbumViewerModal
          albums={albums}
          initialAlbumIndex={selectedAlbumIndex}
          onClose={() => setSelectedAlbumIndex(null)}
          onAlbumChange={(idx) => swiperInstance?.slideToLoop?.(idx) ?? swiperInstance?.slideTo(idx)}
        />
      )}
    </>
  );
}

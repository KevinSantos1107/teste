import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCube, Pagination, Autoplay } from 'swiper/modules';
import { CloudinaryImage } from './CloudinaryImage';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cube';
import 'swiper/css/pagination';

interface Photo {
  id?: string;
  publicId?: string;
  src?: string;
  url?: string;
  description?: string;
  caption?: string;
}

interface AlbumCubeProps {
  photos: Photo[];
}

export function AlbumCube({ photos }: AlbumCubeProps) {
  if (!photos || photos.length === 0) {
    return <div className="text-center p-8 text-theme-text-secondary">Nenhuma foto no álbum.</div>;
  }

  return (
    <div className="w-full max-w-sm mx-auto aspect-square group relative">
      <Swiper
        effect={'cube'}
        grabCursor={true}
        cubeEffect={{
          shadow: true,
          slideShadows: true,
          shadowOffset: 20,
          shadowScale: 0.94,
        }}
        pagination={{ clickable: true }}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        modules={[EffectCube, Pagination, Autoplay]}
        className="w-full h-full rounded-xl overflow-hidden"
      >
        {photos.map((photo, idx) => {
          // Prioridade: src (site antigo) → url → publicId via CloudinaryImage
          const imgSrc = photo.src || photo.url;
          const caption = photo.caption || photo.description;
          return (
            <SwiperSlide
              key={photo.id || idx}
              className="w-full h-full bg-theme-bg rounded-xl overflow-hidden"
            >
              {imgSrc ? (
                <img
                  src={imgSrc}
                  alt={caption}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : photo.publicId ? (
                <CloudinaryImage
                  publicId={photo.publicId}
                  alt={caption}
                  className="w-full h-full"
                />
              ) : null}
              {caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                  <p className="text-white text-sm font-medium text-center drop-shadow-md">
                    {caption}
                  </p>
                </div>
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>
      <div className="absolute -bottom-8 inset-x-0 text-center opacity-0 group-hover:opacity-100 transition-opacity text-xs text-theme-text-secondary">
        Deslize para girar
      </div>
    </div>
  );
}

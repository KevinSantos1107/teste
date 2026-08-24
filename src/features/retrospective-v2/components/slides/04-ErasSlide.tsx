import { useState, useEffect } from 'react';
import { useRetroV2Store } from '../../store/useRetroV2Store';

export function ErasSlide() {
  const { photos } = useRetroV2Store();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Group photos by era/month (simplified for visual effect)
  // For the actual slide effect, we just flash through them quickly
  useEffect(() => {
    if (photos.length <= 1) return;

    // Fast rhythmic photo flashing (every 800ms)
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 800);

    return () => clearInterval(interval);
  }, [photos.length]);

  if (photos.length === 0) {
    return (
      <div className="flex-1 bg-black flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-3xl font-bold mb-4 text-white">Nossas Eras</h2>
        <p className="text-white/50">Adicione fotos aos álbuns.</p>
      </div>
    );
  }

  const currentPhoto = photos[currentIndex];
  // Calculate year for the current era text
  const eraYear = currentPhoto.date ? currentPhoto.date.getFullYear() : '2025';

  return (
    <div className="flex-1 bg-black relative flex flex-col items-center justify-center overflow-hidden">
      {/* Background Image Blurred (Spotify Style) */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-all duration-300 scale-110"
        style={{
          backgroundImage: `url(${currentPhoto.url})`,
          filter: 'blur(20px) brightness(0.4)',
        }}
      />

      <div className="z-10 w-full h-full flex flex-col items-center justify-center p-6 relative">
        <h2
          className="absolute top-12 left-6 text-white font-black opacity-30 transform -rotate-90 origin-bottom-left"
          style={{ fontSize: 'clamp(4rem, 15vw, 6rem)', lineHeight: 0.8 }}
        >
          {eraYear}
        </h2>

        <div className="w-full max-w-[280px] aspect-[3/4] relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden border-2 border-white/10">
          {photos.map((p, i) => (
            <img
              key={i}
              src={p.url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
              style={{ opacity: i === currentIndex ? 1 : 0 }}
            />
          ))}
        </div>

        <div className="absolute bottom-12 right-6 text-right">
          <p className="text-white text-3xl font-bold uppercase tracking-tighter">Nossas</p>
          <p className="text-rose-500 text-5xl font-black uppercase tracking-tighter leading-none">
            Eras
          </p>
        </div>
      </div>
    </div>
  );
}

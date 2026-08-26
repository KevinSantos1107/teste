import { Heart } from 'lucide-react';
import { useSiteConfigStore } from '../store/siteConfigStore';
import { AlbumCarousel } from '../features/album/AlbumCarousel';

export default function AlbumPage() {
  const { config } = useSiteConfigStore();

  if (!config) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pt-8 pb-16">
      <div className="text-center px-4 space-y-4">
        <Heart className="w-12 h-12 mx-auto text-theme-primary" />
        <h2 className="text-4xl font-serif font-bold text-theme-text mb-4">Nossa Galeria</h2>
        <p className="text-theme-text-secondary max-w-2xl mx-auto">
          Relembre nossos melhores momentos juntos.
        </p>
      </div>

      <div className="container mx-auto px-4">
        <AlbumCarousel />
      </div>
    </div>
  );
}

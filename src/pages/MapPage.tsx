import { useState } from 'react';
import { useSiteConfigStore } from '../store/siteConfigStore';
import { StarMap } from '../features/maps/StarMap';
import { VisitedMap } from '../features/maps/VisitedMap';
import { Map, Stars, Plane } from 'lucide-react';

export default function MapPage() {
  const { config } = useSiteConfigStore();
  const [activeTab, setActiveTab] = useState<'stars' | 'travel'>('travel');

  if (!config) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <section className="text-center space-y-4">
        <div className="inline-flex items-center justify-center p-4 bg-theme-primary/10 rounded-full mb-2">
          <Map className="w-10 h-10 text-theme-primary" />
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-theme-text">Nosso Mundo</h1>
        <p className="text-theme-text-secondary text-lg max-w-xl mx-auto">
          Momentos gravados no tempo e no espaço.
        </p>

        <div className="flex justify-center gap-4 mt-8">
          <button
            onClick={() => setActiveTab('travel')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === 'travel'
                ? 'bg-theme-primary text-white shadow-lg scale-105'
                : 'bg-theme-card-bg border border-theme-card-border text-theme-text hover:bg-theme-card-border'
            }`}
          >
            <Plane className="w-5 h-5" /> Nossas Viagens
          </button>

          <button
            onClick={() => setActiveTab('stars')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all ${
              activeTab === 'stars'
                ? 'bg-theme-primary text-white shadow-lg scale-105'
                : 'bg-theme-card-bg border border-theme-card-border text-theme-text hover:bg-theme-card-border'
            }`}
          >
            <Stars className="w-5 h-5" /> Mapa das Estrelas
          </button>
        </div>
      </section>

      <section className="py-2 px-4">
        {activeTab === 'stars' && <StarMap />}
        {activeTab === 'travel' && <VisitedMap />}
      </section>
    </div>
  );
}

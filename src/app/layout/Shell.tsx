import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SplashScreen } from '../../features/core/SplashScreen';
import { FloatingNav } from '../../features/core/FloatingNav';
import { useRetroV2Store } from '../../features/retrospective-v2/store/useRetroV2Store';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { RetroShell } from '../../features/retrospective-v2/components/RetroShell';
import { AudioEngine } from '../../features/player/AudioEngine';
import { PlayCircle } from 'lucide-react';

export function Shell() {
  const [showSplash, setShowSplash] = useState(true);
  const { config } = useSiteConfigStore();
  const openRetro = useRetroV2Store((state) => state.openRetro);

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text transition-colors duration-700 font-sans relative">
      {showSplash ? (
        <SplashScreen
          onComplete={() => setShowSplash(false)}
          title={`${config?.couple.partner1.name} & ${config?.couple.partner2.name}`}
        />
      ) : (
        <div className="animate-in fade-in duration-1000 flex flex-col min-h-screen">
          <RetroShell />

          <main className="flex-1">
            <Outlet />
          </main>

          {/* Global Action Floating Button */}
          <div className="fixed top-6 right-6 z-50">
            <button
              onClick={() => openRetro(config?.id || 'meu-site')}
              className="group flex items-center gap-2 px-4 py-2.5 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white/90 border border-white/10 transition-all shadow-lg hover:scale-105 active:scale-95"
            >
              <PlayCircle className="w-4 h-4 group-hover:animate-pulse" />
              <span className="text-sm">Retrospectiva</span>
            </button>
          </div>

          {/* Motor de áudio global */}
          <AudioEngine />

          {/* Navegação flutuante radial */}
          <FloatingNav />
        </div>
      )}
    </div>
  );
}

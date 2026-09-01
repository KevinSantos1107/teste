import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { SplashScreen } from '../../features/core/SplashScreen';
import { HamburgerMenu } from '../../features/core/HamburgerMenu';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { RetroShell } from '../../features/retrospective-v2/components/RetroShell';
import { AudioEngine } from '../../features/player/AudioEngine';
import { GlobalModals } from '../../features/modals/GlobalModals';

export function Shell() {
  const [showSplash, setShowSplash] = useState(true);
  const { config } = useSiteConfigStore();

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

          {/* Menu Hambúrguer Global */}
          <HamburgerMenu />

          <main className="flex-1">
            <Outlet />
          </main>

          {/* Motor de áudio global */}
          <AudioEngine />

          {/* Modais Globais (Interativos) */}
          <GlobalModals />
        </div>
      )}
    </div>
  );
}

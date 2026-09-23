import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../shared/utils/cn';
import { SplashScreen } from '../../features/core/SplashScreen';
import { HamburgerMenu } from '../../features/core/HamburgerMenu';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { lazy, Suspense } from 'react';
import { GlobalModals } from '../../features/modals/GlobalModals';
import { PlayerAuthInit } from '../../features/auth/PlayerAuthInit';

const RetroShell = lazy(() => import('../../features/retrospective-v2/components/RetroShell').then(m => ({ default: m.RetroShell })));
const AudioEngine = lazy(() => import('../../features/player/AudioEngine').then(m => ({ default: m.AudioEngine })));

export function Shell() {
  const [showSplash, setShowSplash] = useState(true);
  const { config, isLoading } = useSiteConfigStore();

  // The site is ready when config is loaded. We can also add other ready checks here later.
  const isReady = !isLoading && !!config;

  const title = config?.couple
    ? `${config.couple.partner1.name} & ${config.couple.partner2.name}`
    : 'Kevin & Iara';

  // Previne rolagem do body enquanto a splash screen estiver ativa
  useEffect(() => {
    if (showSplash) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showSplash]);

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text transition-colors duration-700 font-sans relative">
      <PlayerAuthInit />
      
      {/* Splash Screen fica sobreposto até terminar sua animação de saída */}
      {showSplash && (
        <SplashScreen
          isReady={isReady}
          onComplete={() => setShowSplash(false)}
          title={title}
        />
      )}

      {/* Renderiza o site por baixo apenas quando as configurações estiverem prontas. */}
      {isReady && (
        <div 
          className={cn(
            "flex flex-col min-h-screen",
            showSplash ? "pointer-events-none h-screen overflow-hidden" : ""
          )}
        >
          <Suspense fallback={null}>
            <RetroShell />
          </Suspense>
          
          <HamburgerMenu />

          <main className="flex-1">
            <Outlet />
          </main>

          <Suspense fallback={null}>
            <AudioEngine />
          </Suspense>
          <GlobalModals />
        </div>
      )}
    </div>
  );
}

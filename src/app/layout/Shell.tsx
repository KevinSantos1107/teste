import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { cn } from '../../shared/utils/cn';
import { SplashScreen } from '../../features/core/SplashScreen';
import { HamburgerMenu } from '../../features/core/HamburgerMenu';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { lazy, Suspense } from 'react';
import { GlobalModals } from '../../features/modals/GlobalModals';

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

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text transition-colors duration-700 font-sans relative">
      
      {/* Splash Screen fica sobreposto até terminar sua animação de saída */}
      {showSplash && (
        <SplashScreen
          isReady={isReady}
          onComplete={() => setShowSplash(false)}
          title={title}
        />
      )}

      {/* Renderiza o site por baixo apenas quando as configurações estiverem prontas. 
          Usamos opacity para que as imagens já comecem a carregar em background sem o usuário ver */}
      {isReady && (
        <div 
          className={cn(
            "flex flex-col min-h-screen transition-opacity duration-1000",
            showSplash ? "opacity-0 pointer-events-none fixed inset-0" : "opacity-100 animate-in fade-in"
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

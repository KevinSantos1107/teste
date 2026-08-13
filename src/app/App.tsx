import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useSiteConfigStore } from '../store/siteConfigStore';
import { Spinner } from '../shared/ui/Spinner';
import { router } from './router';
import { AuthProvider } from '../features/auth/AuthContext';

export default function App() {
  const { config, isLoading, error, loadConfig } = useSiteConfigStore();

  useEffect(() => {
    // In dev, use the env var. In prod, this might come from window.location.hostname
    const siteId = import.meta.env.VITE_SITE_ID || 'meu-site';
    loadConfig(siteId);
  }, [loadConfig]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Spinner size="xl" className="text-rose-500" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-red-400">Erro ao carregar</h1>
          <p className="text-slate-400">{error || 'Configuração não encontrada'}</p>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

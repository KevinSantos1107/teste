import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { Shell } from './layout/Shell';
import { AdminShell } from './layout/AdminShell';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { Spinner } from '../shared/ui/Spinner';

// Lazy load pages
const Home = lazy(() => import('../pages/Home'));
const AlbumPage = lazy(() => import('../pages/AlbumPage'));
const TimelinePage = lazy(() => import('../pages/TimelinePage'));
const MapPage = lazy(() => import('../pages/MapPage'));
const GamesPage = lazy(() => import('../pages/GamesPage'));
const LoginPage = lazy(() => import('../features/auth/LoginPage'));

// Lazy load admin pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const ConfigPage = lazy(() => import('../pages/admin/ConfigPage'));
const AlbumEditor = lazy(() => import('../pages/admin/AlbumEditor'));
const TimelineEditor = lazy(() => import('../pages/admin/TimelineEditor'));
const PlaylistEditor = lazy(() => import('../pages/admin/PlaylistEditor'));
const RouletteEditor = lazy(() => import('../pages/admin/RouletteEditor'));
const MapEditor = lazy(() => import('../pages/admin/MapEditor'));
const StarMapEditor = lazy(() => import('../pages/admin/StarMapEditor'));
const RetrospectiveEditor = lazy(() => import('../pages/admin/RetrospectiveEditor'));

const SuspenseWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<div className="flex h-full items-center justify-center p-8"><Spinner size="lg" /></div>}>
    {children}
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      {
        index: true,
        element: <SuspenseWrapper><Home /></SuspenseWrapper>,
      },
      {
        path: 'album',
        element: <SuspenseWrapper><AlbumPage /></SuspenseWrapper>,
      },
      {
        path: 'timeline',
        element: <SuspenseWrapper><TimelinePage /></SuspenseWrapper>,
      },
      {
        path: 'mapa',
        element: <SuspenseWrapper><MapPage /></SuspenseWrapper>,
      },
      {
        path: 'jogos',
        element: <SuspenseWrapper><GamesPage /></SuspenseWrapper>,
      },
      {
        path: '*',
        element: <div className="p-8 text-center text-red-500">Página não encontrada</div>,
      }
    ],
  },
  {
    path: '/admin/login',
    element: <SuspenseWrapper><LoginPage /></SuspenseWrapper>,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <AdminShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <SuspenseWrapper><AdminDashboard /></SuspenseWrapper>,
      },
      {
        path: 'config',
        element: <SuspenseWrapper><ConfigPage /></SuspenseWrapper>,
      },
      {
        path: 'album',
        element: <SuspenseWrapper><AlbumEditor /></SuspenseWrapper>,
      },
      {
        path: 'timeline',
        element: <SuspenseWrapper><TimelineEditor /></SuspenseWrapper>,
      },
      {
        path: 'playlist',
        element: <SuspenseWrapper><PlaylistEditor /></SuspenseWrapper>,
      },
      {
        path: 'roulette',
        element: <SuspenseWrapper><RouletteEditor /></SuspenseWrapper>,
      },
      {
        path: 'map',
        element: <SuspenseWrapper><MapEditor /></SuspenseWrapper>,
      },
      {
        path: 'starmap',
        element: <SuspenseWrapper><StarMapEditor /></SuspenseWrapper>,
      },
      {
        path: 'retrospective',
        element: <SuspenseWrapper><RetrospectiveEditor /></SuspenseWrapper>,
      }
    ]
  }
]);

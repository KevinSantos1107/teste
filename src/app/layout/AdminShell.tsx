import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../services/firebase/config';
import { LogOut, LayoutDashboard, Settings, Image as ImageIcon, Music, History, Menu, X } from 'lucide-react';

export function AdminShell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { label: 'Configurações', icon: Settings, path: '/admin/config' },
    { label: 'Retrospectiva', icon: Settings, path: '/admin/retrospective' },
    { label: 'Álbum', icon: ImageIcon, path: '/admin/album' },
    { label: 'História', icon: History, path: '/admin/timeline' },
    { label: 'Músicas', icon: Music, path: '/admin/playlist' },
    { label: 'Mapa de Lugares', icon: LayoutDashboard, path: '/admin/map' },
    { label: 'Roleta', icon: LayoutDashboard, path: '/admin/roulette' },
    { label: 'Mapa de Estrelas', icon: LayoutDashboard, path: '/admin/starmap' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-900 text-slate-100 font-sans">
      {/* Overlay do Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Fixa na esquerda (Desktop) ou Drawer (Mobile) */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <div className="flex items-center">
            <span className="font-serif font-bold text-lg tracking-tight text-white">Engine Admin</span>
            {user?.role === 'super_admin' && (
              <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-mono uppercase">Master</span>
            )}
          </div>
          <button 
            className="md:hidden text-slate-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <a 
              key={item.path} 
              href={item.path}
              onClick={(e) => {
                 e.preventDefault();
                 setIsMobileMenuOpen(false);
                 navigate(item.path);
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <item.icon className="w-5 h-5 opacity-70" />
              <span className="font-medium text-sm">{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 text-slate-400 text-sm font-bold uppercase">
               {user?.email?.charAt(0)}
            </div>
            <div className="overflow-hidden">
               <p className="text-sm font-medium text-white truncate">{user?.email}</p>
               <p className="text-xs text-slate-500 truncate">{user?.role === 'super_admin' ? 'Super Admin' : `Site: ${user?.siteId || 'indefinido'}`}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden bg-slate-900">
        {/* Mobile Header */}
        <header className="h-16 md:hidden flex items-center justify-between px-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)} 
              className="text-slate-400 hover:text-white p-1"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-serif font-bold text-white">Engine Admin</span>
          </div>
          <button onClick={handleLogout} className="text-red-400 p-1"><LogOut className="w-5 h-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

import { useAuth } from '../../features/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/Card';
import { LayoutDashboard } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 mt-1">Bem-vindo ao painel de controle do seu site romântico.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-slate-800 border-slate-700 shadow-none">
          <CardHeader className="pb-2">
             <CardTitle className="text-slate-300 text-sm font-medium flex items-center gap-2">
               <LayoutDashboard className="w-4 h-4 text-theme-primary" /> Seu Acesso
             </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white mb-1">
              {user?.role === 'super_admin' ? 'Master' : 'Cliente'}
            </div>
            <p className="text-xs text-slate-400">
              {user?.role === 'super_admin' 
                ? 'Você pode gerenciar todos os sites do sistema.' 
                : `Gerenciando o site: ${user?.siteId}`}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="p-8 border border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center text-center bg-slate-900/50">
        <p className="text-slate-400 mb-2">Utilize o menu lateral para editar as informações, alterar as cores e gerenciar as mídias.</p>
        <p className="text-slate-500 text-sm">As alterações entram no ar imediatamente.</p>
      </div>
    </div>
  );
}

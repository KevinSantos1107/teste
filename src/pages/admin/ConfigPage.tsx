import { useState } from 'react';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { useAuth } from '../../features/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Save } from 'lucide-react';
import type { SiteConfig } from '../../config/siteConfig.schema';

import { useToast } from '../../shared/ui/ToastProvider';

export default function ConfigPage() {
  const { config, updateConfig } = useSiteConfigStore();
  const { user } = useAuth();
  const { show } = useToast();

  const [formData, setFormData] = useState<Partial<SiteConfig>>({
    couple: config?.couple,
    relationship: config?.relationship,
    features: config?.features,
    theme: config?.theme,
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!config) return null;

  const handleSave = async () => {
    const siteId = user?.siteId || 'meu-site';
    setIsSaving(true);
    try {
      await updateConfig(siteId, formData);
      show('Configurações salvas com sucesso!');
    } catch (err: any) {
      show('Erro ao salvar: ' + err.message, 'err');
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Configurações Gerais</h1>
        <p className="text-slate-400 mt-1">
          Altere os dados básicos do casal e ative/desative funcionalidades do site.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Identidade do Casal */}
        <Card className="bg-slate-800 border-slate-700 shadow-none">
          <CardHeader>
            <CardTitle className="text-slate-200">Identidade do Casal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-300">Nome 1</label>
                <Input
                  value={formData.couple?.partner1.name || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      couple: { ...formData.couple!, partner1: { ...formData.couple!.partner1, name: e.target.value } },
                    })
                  }
                  className="bg-slate-900 border-slate-700 text-slate-200"
                />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-300">Aniversário 1</label>
                <Input
                  type="date"
                  value={formData.couple?.partner1.birthDate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      couple: { ...formData.couple!, partner1: { ...formData.couple!.partner1, birthDate: e.target.value } },
                    })
                  }
                  className="bg-slate-900 border-slate-700 text-slate-200"
                />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-300">Gênero 1</label>
                <select
                  value={formData.couple?.partner1.gender || 'M'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      couple: { ...formData.couple!, partner1: { ...formData.couple!.partner1, gender: e.target.value as 'M'|'F' } },
                    })
                  }
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-700/50 pt-4">
              <div className="space-y-2 col-span-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-300">Nome 2</label>
                <Input
                  value={formData.couple?.partner2.name || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      couple: { ...formData.couple!, partner2: { ...formData.couple!.partner2, name: e.target.value } },
                    })
                  }
                  className="bg-slate-900 border-slate-700 text-slate-200"
                />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-300">Aniversário 2</label>
                <Input
                  type="date"
                  value={formData.couple?.partner2.birthDate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      couple: { ...formData.couple!, partner2: { ...formData.couple!.partner2, birthDate: e.target.value } },
                    })
                  }
                  className="bg-slate-900 border-slate-700 text-slate-200"
                />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-1">
                <label className="text-sm font-medium text-slate-300">Gênero 2</label>
                <select
                  value={formData.couple?.partner2.gender || 'F'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      couple: { ...formData.couple!, partner2: { ...formData.couple!.partner2, gender: e.target.value as 'M'|'F' } },
                    })
                  }
                  className="w-full h-10 px-3 bg-slate-900 border border-slate-700 rounded-md text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-700/50 pt-4">
              <label className="text-sm font-medium text-slate-300">Data de Início do Namoro</label>
              <Input
                type="date"
                value={formData.relationship?.startDate || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    relationship: { startDate: e.target.value },
                  })
                }
                className="bg-slate-900 border-slate-700 text-slate-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature Flags */}
        <Card className="bg-slate-800 border-slate-700 shadow-none">
          <CardHeader>
            <CardTitle className="text-slate-200">Módulos Ativos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(Object.keys(formData.features || {}) as Array<keyof SiteConfig['features']>).map(
              (key) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50"
                >
                  <span className="text-slate-300 font-medium capitalize">
                    {key.replace('enable', '')}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.features?.[key] || false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          features: { ...formData.features!, [key]: e.target.checked },
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-primary" />
                  </label>
                </div>
              )
            )}
          </CardContent>
        </Card>

      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
        <Button onClick={handleSave} isLoading={isSaving} className="gap-2 px-8">
          <Save className="w-4 h-4" /> Salvar Alterações
        </Button>
      </div>
    </div>
  );
}

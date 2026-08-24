import { useState } from 'react';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { useAuth } from '../../features/auth/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/ui/Card';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Save } from 'lucide-react';
import type { SiteConfig } from '../../config/siteConfig.schema';

export default function ConfigPage() {
  const { config, updateConfig } = useSiteConfigStore();
  const { user } = useAuth();

  const [formData, setFormData] = useState<Partial<SiteConfig>>({
    couple: config?.couple,
    relationship: config?.relationship,
    features: config?.features,
    theme: config?.theme,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  if (!config) return null;

  const handleSave = async () => {
    const siteId = user?.siteId || 'meu-site';
    setIsSaving(true);
    setMessage('');
    try {
      await updateConfig(siteId, formData);
      setMessage('Configurações salvas com sucesso!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setMessage('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const colors = formData.theme?.colors ?? config.theme.colors;

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
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Nome 1</label>
              <Input
                value={formData.couple?.partner1.name || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    couple: { ...formData.couple!, partner1: { name: e.target.value } },
                  })
                }
                className="bg-slate-900 border-slate-700 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Nome 2</label>
              <Input
                value={formData.couple?.partner2.name || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    couple: { ...formData.couple!, partner2: { name: e.target.value } },
                  })
                }
                className="bg-slate-900 border-slate-700 text-slate-200"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Data de Início</label>
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

        {/* Cores do Tema */}
        <Card className="bg-slate-800 border-slate-700 shadow-none md:col-span-2">
          <CardHeader>
            <CardTitle className="text-slate-200">Cores do Tema</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(['primary', 'secondary', 'bg', 'accent', 'text'] as const).map((colorKey) => {
              const value = colors[colorKey] || '#000000';
              return (
                <div key={colorKey} className="space-y-2">
                  <label className="text-xs font-medium text-slate-400 uppercase">{colorKey}</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => {
                        const newColors = { ...colors, [colorKey]: e.target.value };
                        setFormData({
                          ...formData,
                          theme: { ...formData.theme!, colors: newColors },
                        });
                      }}
                      className="w-8 h-8 rounded border-none cursor-pointer bg-transparent"
                    />
                    <span className="text-sm text-slate-300 font-mono">{value}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-slate-800">
        <Button onClick={handleSave} isLoading={isSaving} className="gap-2 px-8">
          <Save className="w-4 h-4" /> Salvar Alterações
        </Button>
        {message && (
          <span
            className={message.includes('Erro') ? 'text-red-400 text-sm' : 'text-green-400 text-sm'}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

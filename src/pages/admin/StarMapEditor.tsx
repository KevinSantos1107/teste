import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Spinner } from '../../shared/ui/Spinner';
import { cn } from '../../shared/utils/cn';
import { Save, Star } from 'lucide-react';

interface StarMapConfig {
  specialDate: string;
  customLocation: {
    lat: number;
    lng: number;
    name: string;
  };
  romanticQuote: string;
}

function useToast() {
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' } | null>(null);
  const show = (text: string, type: 'ok' | 'err' = 'ok') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3500);
  };
  const Toast = msg ? (
    <div className={cn('fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl font-medium text-sm animate-in slide-in-from-bottom-4 duration-300',
      msg.type === 'ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
    )}>{msg.text}</div>
  ) : null;
  return { show, Toast };
}

export default function StarMapEditor() {
  const { config } = useSiteConfigStore();
  const { show, Toast } = useToast();
  const siteId = config?.id || 'meu-site';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StarMapConfig>({
    specialDate: '',
    customLocation: { lat: -23.5505, lng: -46.6333, name: '' },
    romanticQuote: ''
  });

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'sites', siteId, 'config', 'star_map');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Partial<StarMapConfig>;
          setForm({
            specialDate: data.specialDate || '',
            customLocation: {
              lat: data.customLocation?.lat ?? -23.5505,
              lng: data.customLocation?.lng ?? -46.6333,
              name: data.customLocation?.name || ''
            },
            romanticQuote: data.romanticQuote || ''
          });
        }
      } catch {
        show('Erro ao carregar configurações', 'err');
      }
      setLoading(false);
    };
    loadConfig();
  }, [siteId]);

  const handleSave = async () => {
    if (!form.specialDate || !form.customLocation.name) {
      show('Data e nome do local são obrigatórios', 'err');
      return;
    }
    setSaving(true);
    try {
      await setDoc(doc(db, 'sites', siteId, 'config', 'star_map'), {
        ...form,
        updatedAt: serverTimestamp()
      });
      show('Configurações salvas com sucesso!');
    } catch (e: any) {
      show('Erro ao salvar: ' + e.message, 'err');
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Spinner /></div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {Toast}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Mapa de Estrelas</h1>
          <p className="text-slate-400 mt-1">Configure a data e local exatos para gerar o mapa estelar.</p>
        </div>
        <Button onClick={handleSave} isLoading={saving} className="gap-2 shrink-0">
          <Save className="w-4 h-4" /> Salvar Alterações
        </Button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
          <div className="p-2 bg-theme-primary/10 rounded-lg">
            <Star className="w-5 h-5 text-theme-primary" />
          </div>
          <h2 className="font-bold text-white text-lg">Detalhes do Momento</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Data Especial *</label>
            <Input 
              type="date" 
              value={form.specialDate} 
              onChange={e => setForm(f => ({ ...f, specialDate: e.target.value }))}
              className="bg-slate-900 border-slate-700 text-slate-200" 
            />
            <p className="text-xs text-slate-500">A data que o mapa de estrelas deve representar.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Nome do Local *</label>
            <Input 
              value={form.customLocation.name} 
              onChange={e => setForm(f => ({ ...f, customLocation: { ...f.customLocation, name: e.target.value } }))}
              className="bg-slate-900 border-slate-700 text-slate-200" 
              placeholder="Ex: Paris, França" 
            />
            <p className="text-xs text-slate-500">Como o nome do local vai aparecer no mapa.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Latitude *</label>
            <Input 
              type="number" 
              step="any"
              value={form.customLocation.lat} 
              onChange={e => setForm(f => ({ ...f, customLocation: { ...f.customLocation, lat: parseFloat(e.target.value) } }))}
              className="bg-slate-900 border-slate-700 text-slate-200 font-mono" 
              placeholder="-23.5505" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Longitude *</label>
            <Input 
              type="number" 
              step="any"
              value={form.customLocation.lng} 
              onChange={e => setForm(f => ({ ...f, customLocation: { ...f.customLocation, lng: parseFloat(e.target.value) } }))}
              className="bg-slate-900 border-slate-700 text-slate-200 font-mono" 
              placeholder="-46.6333" 
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Frase Romântica</label>
          <Input 
            value={form.romanticQuote} 
            onChange={e => setForm(f => ({ ...f, romanticQuote: e.target.value }))}
            className="bg-slate-900 border-slate-700 text-slate-200" 
            placeholder="Ex: O céu quando nossos mundos colidiram..." 
          />
        </div>
      </div>
    </div>
  );
}

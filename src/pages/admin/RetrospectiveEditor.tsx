import { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Spinner } from '../../shared/ui/Spinner';
import { cn } from '../../shared/utils/cn';
import { Save, Settings2, Music } from 'lucide-react';

interface RetroV2Config {
  musicUrl?: string;
  musicName?: string;
  wordGameAnswer?: string;
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

export default function RetrospectiveEditor() {
  const { config: siteConfig } = useSiteConfigStore();
  const { show, Toast } = useToast();
  const siteId = siteConfig?.id || 'meu-site';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [retroConfig, setRetroConfig] = useState<RetroV2Config>({
    musicUrl: '',
    musicName: '',
    wordGameAnswer: 'INCRIVEL',
  });
  
  // Data for dropdowns
  const [availableTracks, setAvailableTracks] = useState<{ url: string; title: string }[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load Retrospective Config V2
        const docRef = doc(db, 'sites', siteId, 'retrospective_config', 'v2');
        const snap = await getDoc(docRef);
        
        if (snap.exists()) {
          const data = snap.data();
          setRetroConfig({
            musicUrl: data.musicUrl || '',
            musicName: data.musicName || '',
            wordGameAnswer: data.wordGameAnswer || 'INCRIVEL',
          });
        }

        // Load Tracks from all custom_playlists
        const playlistSnap = await getDocs(collection(db, 'custom_playlists'));
        const loadedTracks: { url: string; title: string }[] = [];
        for (const p of playlistSnap.docs) {
          if (p.id === '_placeholder') continue;
          const tSnap = await getDocs(query(collection(db, 'playlist_tracks'), where('playlistId', '==', p.id)));
          tSnap.forEach(tDoc => {
             const data = tDoc.data();
             if (data.tracks && Array.isArray(data.tracks)) {
               data.tracks.forEach((t: any) => {
                 if (t.url || t.src) {
                   loadedTracks.push({ url: t.url || t.src, title: t.title || 'Música' });
                 }
               });
             } else if (data.title && (data.url || data.src)) {
               loadedTracks.push({ url: data.url || data.src, title: data.title });
             }
          });
        }
        setAvailableTracks(loadedTracks);
      } catch (e: any) {
        show('Erro ao carregar', 'err');
      }
      setLoading(false);
    };
    loadData();
  }, [siteId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'sites', siteId, 'retrospective_config', 'v2'), {
        ...retroConfig,
        updatedAt: serverTimestamp()
      }, { merge: true }); // Use merge true so we don't overwrite unexpected keys
      show('Configurações da retrospectiva salvas!');
    } catch (e: any) {
      show('Erro ao salvar: ' + e.message, 'err');
    }
    setSaving(false);
  };

  const handleTrackSelect = (url: string) => {
    const track = availableTracks.find(t => t.url === url);
    setRetroConfig({
      ...retroConfig,
      musicUrl: url,
      musicName: track ? track.title : ''
    });
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {Toast}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Retrospectiva</h1>
          <p className="text-slate-400 mt-1">Configure a música e o jogo de palavras exibidos na retrospectiva.</p>
        </div>
        <Button onClick={handleSave} isLoading={saving} className="gap-2 shrink-0">
          <Save className="w-4 h-4" /> Salvar Alterações
        </Button>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="p-4 bg-slate-900 border-b border-slate-700">
          <h2 className="font-bold text-white flex items-center gap-2"><Settings2 className="w-5 h-5 text-theme-primary" /> Configurações V2</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Music className="w-4 h-4" /> Música de Fundo
            </label>
            <p className="text-xs text-slate-500 mb-2">Selecione uma das músicas adicionadas nas Playlists.</p>
            <select 
              value={retroConfig.musicUrl || ''} 
              onChange={(e) => handleTrackSelect(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-3 text-sm focus:ring-1 focus:ring-theme-primary outline-none"
            >
              <option value="">(Silêncio - Sem música)</option>
              {availableTracks.map((t, idx) => (
                <option key={idx} value={t.url}>{t.title}</option>
              ))}
            </select>
            {retroConfig.musicUrl && !availableTracks.find(t => t.url === retroConfig.musicUrl) && (
              <p className="text-xs text-yellow-500">Música atualmente selecionada não foi encontrada nas playlists. Se você salvar agora, ela será perdida ou precisará ser tocada na origem antiga.</p>
            )}
          </div>

          <div className="space-y-3 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
            <label className="text-sm font-medium text-slate-300">
              Palavra do Jogo de Palavras (Final da Retrospectiva)
            </label>
            <p className="text-xs text-slate-500">Esta palavra aparecerá como um "Termo" no final da retrospectiva. Evite usar acentos.</p>
            <Input 
              value={retroConfig.wordGameAnswer || ''} 
              onChange={(e) => setRetroConfig({ ...retroConfig, wordGameAnswer: e.target.value.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z]/g, '') })}
              className="bg-slate-900 border-slate-700 text-slate-200 h-10 font-mono text-lg tracking-widest uppercase"
              placeholder="EX: INCRIVEL"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

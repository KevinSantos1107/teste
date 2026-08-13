import { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { Timeline } from './Timeline';
import type { TimelineEvent } from './Timeline';
import { X, Clock } from 'lucide-react';
import { Spinner } from '../../shared/ui/Spinner';

export function TimelineModal() {
  const { config } = useSiteConfigStore();
  const [isOpen, setIsOpen] = useState(false);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchEvents = async () => {
    if (fetched) return;
    setLoading(true);
    try {
      // MESMO caminho do site antigo: coleção raiz "timeline"
      const ref = collection(db, 'timeline');
      const q = query(ref, orderBy('createdAt', 'asc'));
      const snap = await getDocs(q);
      const loaded: TimelineEvent[] = [];
      snap.forEach(doc => {
        if (doc.id === '_placeholder') return;
        const d = doc.data();
        loaded.push({
          id: doc.id,
          date: d.date,
          title: d.title,
          description: d.caption || d.description || '',
          location: d.location,
          // site antigo usa "photo" e "photoLarge"
          photoUrl: d.photoLarge || d.photo,
          publicId: d.publicId,
        });
      });
      // Sort por orderIndex (igual ao site antigo)
      loaded.sort((a: any, b: any) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999));
      setEvents(loaded);
      setFetched(true);
    } catch (e) {
      console.error("Erro ao carregar timeline:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    fetchEvents();
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  };

  const handleClose = () => {
    setIsOpen(false);
    document.body.style.overflow = '';
  };

  // Fechar com ESC
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <>
      {/* Botão de abertura */}
      <button
        onClick={handleOpen}
        className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 hover:border-rose-500/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(225,29,72,0.2)]"
      >
        <div className="w-10 h-10 rounded-full bg-rose-500/10 group-hover:bg-rose-500/20 flex items-center justify-center transition-colors">
        <Clock className="w-5 h-5 text-rose-400 group-hover:text-rose-300 transition-colors" />
        </div>
        <div className="text-left">
          <p className="text-white font-bold text-base group-hover:text-rose-100 transition-colors">Nossa História</p>
          <p className="text-slate-400 text-sm">Relembra nossos momentos juntos</p>
        </div>
        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse ml-2" />
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex flex-col animate-in fade-in duration-300"
          onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
        >
          {/* Modal Container */}
          <div className="relative flex flex-col h-full max-w-4xl w-full mx-auto">
            
            {/* Header fixo */}
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-black/40 backdrop-blur-sm">
              <div>
                <h2 className="text-2xl font-serif font-bold text-white">Nossa História</h2>
                <p className="text-slate-400 text-sm">Cada momento juntos é um capítulo especial</p>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com scroll */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <Spinner size="lg" />
                </div>
              ) : (
                <Timeline events={events} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

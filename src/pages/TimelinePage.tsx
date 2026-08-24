import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useSiteConfigStore } from '../store/siteConfigStore';
import { RetroShell } from '../features/retrospective-v2/components/RetroShell';
import { useRetroV2Store } from '../features/retrospective-v2/store/useRetroV2Store';
import { Timeline } from '../features/timeline/Timeline';
import type { TimelineEvent } from '../features/timeline/Timeline';
import { Spinner } from '../shared/ui/Spinner';

export default function TimelinePage() {
  const { config } = useSiteConfigStore();
  const { openRetro } = useRetroV2Store();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!config?.id) return;

    const fetchEvents = async () => {
      try {
        const eventsRef = collection(db, 'sites', config.id, 'timeline');
        const q = query(eventsRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);

        const loadedEvents: TimelineEvent[] = [];
        snapshot.forEach((doc) => {
          if (doc.id === '_placeholder') return;
          const data = doc.data();
          loadedEvents.push({
            id: doc.id,
            date: data.date,
            title: data.title,
            description: data.description,
            location: data.location,
            publicId: data.publicId,
          });
        });

        setEvents(loadedEvents);
      } catch (error) {
        console.error('Erro ao carregar timeline:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [config?.id]);

  if (!config) return null;

  return (
    <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <RetroShell />
      <section className="pt-8">
        <div className="text-center mb-8">
          <button
            onClick={() => config?.id && openRetro(config.id)}
            className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-full shadow-lg transition-all active:scale-95"
          >
            ✨ Abrir Retrospectiva
          </button>
        </div>
      </section>

      <section>
        <div className="text-center mb-12">
          <h2 className="text-4xl font-serif font-bold text-theme-text mb-4">Nossa História</h2>
          <p className="text-theme-text-secondary max-w-2xl mx-auto">
            Cada momento ao seu lado é um capítulo que merece ser lembrado para sempre.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <Timeline events={events} />
        )}
      </section>
    </div>
  );
}

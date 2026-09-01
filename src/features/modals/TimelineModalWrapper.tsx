import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { TimelineModalContent } from '../timeline/TimelineModal';
import type { TimelineEvent } from '../timeline/Timeline';

export function TimelineModalWrapper({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (isOpen && !fetched) {
      const fetchEvents = async () => {
        setLoading(true);
        try {
          const snap = await getDocs(query(collection(db, 'timeline'), orderBy('createdAt', 'asc')));
          const loaded: TimelineEvent[] = [];
          snap.forEach((doc) => {
            if (doc.id === '_placeholder') return;
            const d = doc.data();
            loaded.push({
              id: doc.id,
              date: d.date,
              title: d.title,
              description: d.caption || d.description || '',
              location: d.location,
              photoUrl: d.photoLarge || d.photo,
              publicId: d.publicId,
              secretMessage: typeof d.secret === 'string' ? d.secret : (d.secretMessage || ''),
            });
          });
          loaded.sort((a: any, b: any) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999));
          setEvents(loaded);
          setFetched(true);
        } catch (e) {
          console.error('Erro ao carregar timeline:', e);
        } finally {
          setLoading(false);
        }
      };
      fetchEvents();
    }
  }, [isOpen, fetched]);

  if (!isOpen) return null;

  return (
    <TimelineModalContent
      events={events}
      loading={loading}
      onClose={onClose}
    />
  );
}

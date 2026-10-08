import { useEffect } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../services/firebase/config';
import { usePlayerStore } from '../../../../store/usePlayerStore';
import { useSiteConfigStore } from '../../../../store/siteConfigStore';
import { getPlayerIds } from '../../../auth/playerIds';
import { useModalsStore } from '../../../../store/useModalsStore';

export type SyncPresenceState = 'offline' | 'site' | 'game';

export interface SyncPresenceDoc {
  updatedAt: unknown;
  presence: Record<string, SyncPresenceState>;
  lastSeen: Record<string, number>;
}

export function SyncPresenceBeacon() {
  const player = usePlayerStore((s) => s.player);
  const config = useSiteConfigStore((s) => s.config);
  const { activeModal } = useModalsStore();

  useEffect(() => {
    if (!player || !config) return;
    const { p1Id, p2Id } = getPlayerIds(config);
    if (player !== p1Id && player !== p2Id) return;

    const roomId = `${p1Id}_${p2Id}`;
    const ref = doc(db, 'sync_presence', roomId);

    const updatePresence = (status: SyncPresenceState) => {
      setDoc(
        ref,
        {
          [`presence.${player}`]: status,
          [`lastSeen.${player}`]: Date.now(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      ).catch(() => {});
    };

    const currentStatus: SyncPresenceState = activeModal === 'sync' ? 'game' : 'site';
    updatePresence(currentStatus);

    const ticker = setInterval(() => {
      if (document.hidden || !navigator.onLine) return;
      const status: SyncPresenceState = activeModal === 'sync' ? 'game' : 'site';
      updatePresence(status);
    }, 15000);

    const handleHide = () => updatePresence('offline');
    window.addEventListener('pagehide', handleHide);

    return () => {
      clearInterval(ticker);
      window.removeEventListener('pagehide', handleHide);
      updatePresence('offline');
    };
  }, [player, config, activeModal]);

  return null;
}

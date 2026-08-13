import { create } from 'zustand';
import { collection, getDocs, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase/config';

/** Safely converts Firestore Timestamp or any date-like value to a JS Date */
function toDate(value: any): Date {
  if (!value) return new Date();
  // Firestore Timestamp object
  if (value?.toDate) return value.toDate();
  // Firestore Timestamp as plain object {seconds, nanoseconds}
  if (value?.seconds !== undefined) return new Date(value.seconds * 1000);
  // ISO string or numeric timestamp
  const d = new Date(value);
  return isNaN(d.getTime()) ? new Date() : d;
}

export interface RetroPhoto {
  url: string;
  caption: string;
  date: Date;
}

export interface RetroEvent {
  title: string;
  date: Date;
}

export interface MapPin {
  lat: number;
  lng: number;
  photoUrl: string;
  title: string;
  date: Date;
}

export interface RetroConfig {
  rouletteOptions: string[];
  musicUrl: string;
  musicName: string;
  wordGameAnswer: string;
}

interface RetroState {
  isOpen: boolean;
  isReady: boolean;
  photos: RetroPhoto[];
  totalPhotos: number;
  events: RetroEvent[];
  mapPins: MapPin[];
  config: RetroConfig;
  
  openRetro: (siteId: string) => Promise<void>;
  closeRetro: () => void;
}

export const useRetroV2Store = create<RetroState>((set, get) => ({
  isOpen: false,
  isReady: false,
  photos: [],
  totalPhotos: 0,
  events: [],
  mapPins: [],
  config: {
    rouletteOptions: ['Jantar', 'Cinema', 'Parque', 'Viagem', 'Ficar em Casa', 'Surpresa'],
    musicUrl: '',
    musicName: 'Nossa Trilha',
    wordGameAnswer: 'O amor da minha vida',
  },

  openRetro: async (siteId: string) => {
    set({ isOpen: true, isReady: false });
    
    try {
      // 1. Fetch Timeline Events
      const tlRef = collection(db, 'sites', siteId, 'timeline');
      const tlSnap = await getDocs(query(tlRef, orderBy('createdAt', 'asc')));
      const events: RetroEvent[] = [];
      tlSnap.forEach(d => {
        if (d.id === '_placeholder') return;
        const data = d.data();
        if (data.date || data.createdAt) {
          events.push({
            title: data.title || '',
            date: toDate(data.date || data.createdAt),
          });
        }
      });

      // 2. Fetch Albums & Map Pins
      const albumRef = collection(db, 'sites', siteId, 'album');
      const albumSnap = await getDocs(query(albumRef, orderBy('createdAt', 'asc')));
      const allPhotosRaw: RetroPhoto[] = [];
      const mapPins: MapPin[] = [];

      albumSnap.forEach(albumDoc => {
        if (albumDoc.id === '_placeholder') return;
        const d = albumDoc.data();
        const albumPhotos: any[] = d.photos || [];
        
        albumPhotos.forEach((p, idx) => {
          if (p.publicId) {
            const photoDate = toDate(p.date || d.createdAt);
            allPhotosRaw.push({
              url: p.publicId,
              caption: p.caption || d.title || '',
              date: photoDate,
            });
            // Map pins from albums that have geo coordinates
            if (idx === 0 && (p.lat || d.lat) && (p.lng || d.lng)) {
              mapPins.push({
                lat: p.lat || d.lat,
                lng: p.lng || d.lng,
                photoUrl: p.publicId,
                title: d.title || 'Nosso Lugar',
                date: photoDate,
              });
            }
          }
        });
      });

      // Smart Photo Selection: group by month-epoch, select balanced spread
      allPhotosRaw.sort((a, b) => a.date.getTime() - b.date.getTime());

      let photos: RetroPhoto[];
      if (allPhotosRaw.length <= 30) {
        photos = allPhotosRaw;
      } else {
        const byEpoch = new Map<string, RetroPhoto[]>();
        allPhotosRaw.forEach(p => {
          const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, '0')}`;
          if (!byEpoch.has(key)) byEpoch.set(key, []);
          byEpoch.get(key)!.push(p);
        });
        const epochs = Array.from(byEpoch.keys()).sort();
        const TARGET = 25;
        const perEpoch = Math.max(1, Math.floor(TARGET / epochs.length));
        const selected: RetroPhoto[] = [];
        epochs.forEach(epochKey => {
          const pool = byEpoch.get(epochKey)!;
          const count = Math.min(perEpoch + 1, pool.length);
          const step = pool.length / count;
          for (let i = 0; i < count; i++) {
            selected.push(pool[Math.floor(i * step)]);
          }
        });
        photos = selected.slice(0, 30);
      }

      // 3. Fetch specific retro config
      let mergedConfig = get().config;
      try {
        const configRef = doc(db, 'sites', siteId, 'retrospective_config', 'v2');
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          mergedConfig = { ...mergedConfig, ...configSnap.data() } as RetroConfig;
        }
        
        // Fetch wheels collection to sync with Admin
        const wheelSnap = await getDocs(query(collection(db, 'sites', siteId, 'wheels')));
        if (!wheelSnap.empty) {
          const firstWheel = wheelSnap.docs[0].data();
          if (firstWheel.options && typeof firstWheel.options === 'string') {
            mergedConfig.rouletteOptions = firstWheel.options.split(',').map((s: string) => s.trim()).filter(Boolean);
          }
        } else {
          // If no wheels are registered, empty the options so it doesn't show default
          mergedConfig.rouletteOptions = [];
        }
      } catch (e) { console.warn('No custom retro v2 config found', e); }

      set({
        events,
        photos,
        totalPhotos: allPhotosRaw.length,
        mapPins,
        config: mergedConfig,
        isReady: true,
      });

    } catch (error) {
      console.error('Failed to load retrospective data', error);
      // Fallback ready state even if error
      set({ isReady: true });
    }
  },

  closeRetro: () => {
    set({ isOpen: false });
  }
}));

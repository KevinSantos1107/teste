import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Spinner } from '../../shared/ui/Spinner';
import L from 'leaflet';

// Fix Leaflet's default icon path issues in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Pin {
  id: string;
  title: string;
  description: string;
  date: string;
  lat: number;
  lng: number;
  image: string;
}

function FlyToMarker({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 13, { duration: 2 });
    }
  }, [position, map]);
  return null;
}

export function VisitedMap() {
  const { config } = useSiteConfigStore();
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePin, setActivePin] = useState<Pin | null>(null);

  useEffect(() => {
    if (!config?.id) return;
    
    const fetchPins = async () => {
      try {
        const pinsRef = collection(db, 'sites', config.id, 'map_pins');
        const q = query(pinsRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);
        
        const loadedPins: Pin[] = [];
        snapshot.forEach(doc => {
          if (doc.id === '_placeholder') return;
          const data = doc.data();
          loadedPins.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            date: data.date,
            lat: data.lat,
            lng: data.lng,
            image: data.image
          });
        });
        setPins(loadedPins);
        if (loadedPins.length > 0) {
          setActivePin(loadedPins[0]);
        }
      } catch (err) {
        console.error("Erro ao carregar pins do mapa:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPins();
  }, [config?.id]);

  if (loading) {
    return <div className="flex justify-center p-12"><Spinner /></div>;
  }

  if (pins.length === 0) {
    return (
      <div className="text-center p-12 bg-slate-800/50 rounded-xl border border-slate-700 text-slate-400">
        Nenhuma viagem cadastrada ainda.
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative z-0">
      
      {/* Sidebar with timeline of pins */}
      <div className="w-full lg:w-1/3 bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 border-b border-slate-700 bg-slate-800">
          <h3 className="font-bold text-white text-lg">Nossas Aventuras</h3>
          <p className="text-sm text-slate-400">{pins.length} lugares visitados</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {pins.map(pin => (
            <button 
              key={pin.id}
              onClick={() => setActivePin(pin)}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                activePin?.id === pin.id 
                  ? 'bg-theme-primary/20 border-theme-primary/50 border' 
                  : 'bg-slate-900/50 hover:bg-slate-800 border border-transparent'
              }`}
            >
              <div className="flex gap-4 items-center">
                {pin.image ? (
                  <img src={pin.image} alt={pin.title} className="w-16 h-16 rounded object-cover shadow-md" />
                ) : (
                  <div className="w-16 h-16 rounded bg-slate-800 flex items-center justify-center">🗺️</div>
                )}
                <div>
                  <h4 className="font-bold text-slate-200">{pin.title}</h4>
                  <p className="text-xs text-theme-primary mb-1">{pin.date}</p>
                  <p className="text-xs text-slate-400 line-clamp-2">{pin.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Map */}
      <div className="w-full lg:w-2/3 h-[600px] rounded-xl overflow-hidden border border-slate-700 shadow-2xl relative z-0">
        <MapContainer 
          center={activePin ? [activePin.lat, activePin.lng] : [0, 0]} 
          zoom={3} 
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', backgroundColor: '#1a1a2e' }}
        >
          {/* CartoDB Dark Matter for a beautiful dark romantic style */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          {pins.map(pin => (
            <Marker 
              key={pin.id} 
              position={[pin.lat, pin.lng]}
              eventHandlers={{
                click: () => setActivePin(pin),
              }}
            >
              <Popup className="custom-polaroid-popup">
                <div className="p-2 w-48 font-sans">
                  {pin.image && (
                    <img src={pin.image} alt={pin.title} className="w-full h-32 object-cover rounded shadow-md mb-2" />
                  )}
                  <h4 className="font-bold text-slate-800 m-0">{pin.title}</h4>
                  <p className="text-xs text-slate-500 m-0 mt-1">{pin.date}</p>
                </div>
              </Popup>
            </Marker>
          ))}
          
          {activePin && <FlyToMarker position={[activePin.lat, activePin.lng]} />}
        </MapContainer>
      </div>

    </div>
  );
}

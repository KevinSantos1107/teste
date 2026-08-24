import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useRetroV2Store } from '../../store/useRetroV2Store';
import { useEffect, useState } from 'react';

// Custom Heart Marker Icon
const heartIcon = new L.DivIcon({
  html: `<div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(16,185,129,0.5);"><svg width="18" height="18" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg></div>`,
  className: 'custom-heart-marker',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13, { duration: 2.5 });
  }, [center, map]);
  return null;
}

function formatDate(dateValue: any) {
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR').format(d);
  } catch (e) {
    return '';
  }
}

export function MapSlide() {
  const { mapPins } = useRetroV2Store();
  const [activePinIndex, setActivePinIndex] = useState(0);

  // If there are no pins, show a fallback message
  if (mapPins.length === 0) {
    return (
      <div className="flex-1 bg-[#121212] flex flex-col items-center justify-center text-center p-8 text-white">
        <span className="text-5xl mb-4">🗺️</span>
        <h2 className="text-2xl font-bold mb-2">Nossa Jornada</h2>
        <p className="text-white/50 text-sm">
          Adicione localizações às suas fotos para gerar este mapa.
        </p>
      </div>
    );
  }

  const activePin = mapPins[activePinIndex];

  return (
    <div className="flex-1 bg-[#09090b] relative flex flex-col">
      {/* Title Header */}
      <div className="absolute top-12 left-0 right-0 z-[1000] text-center pointer-events-none">
        <h2 className="text-white text-2xl font-bold mb-1 drop-shadow-md">Nossa Jornada no Mapa</h2>
        <p className="text-white/70 text-sm drop-shadow-md">Lugares que marcaram nossa história</p>
      </div>

      {/* Leaflet Map (Dark Theme) */}
      <div className="flex-1 w-full h-full relative z-0">
        <MapContainer
          center={[activePin.lat, activePin.lng]}
          zoom={4}
          zoomControl={false}
          attributionControl={false}
          style={{ width: '100%', height: '100%', background: '#09090b' }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
          <MapController center={[activePin.lat, activePin.lng]} />

          {mapPins.map((pin, i) => (
            <Marker
              key={i}
              position={[pin.lat, pin.lng]}
              icon={heartIcon}
              eventHandlers={{
                click: () => setActivePinIndex(i),
              }}
            />
          ))}
        </MapContainer>
      </div>

      {/* Floating Polaroid Photo (Over map) */}
      <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
        <div
          className="bg-white p-3 pb-8 rounded shadow-2xl retro-v2-polaroid transform scale-110 md:scale-125"
          style={{ width: '220px' }}
        >
          <div className="w-full h-[220px] bg-zinc-200 overflow-hidden mb-3">
            <img
              src={activePin.photoUrl}
              alt={activePin.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center">
            <p
              className="text-zinc-800 font-medium text-lg leading-tight"
              style={{ fontFamily: "'Dancing Script', cursive" }}
            >
              {activePin.title || 'Nosso momento'}
            </p>
            <p className="text-zinc-400 text-[10px] mt-1">
              {activePin.date ? formatDate(activePin.date) : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-8 left-4 right-4 z-[1000] flex justify-between items-center bg-[#18181b]/90 backdrop-blur-lg rounded-2xl p-4 shadow-xl border border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="text-emerald-500">📍</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">
              {activePin.title || 'Local'}
            </p>
            <p className="text-white/50 text-xs">
              {activePin.date ? formatDate(activePin.date) : ''}
            </p>
          </div>
        </div>

        {mapPins.length > 1 && (
          <div className="flex gap-2">
            <button
              onClick={() =>
                setActivePinIndex((prev) => (prev === 0 ? mapPins.length - 1 : prev - 1))
              }
              className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-xs transition-colors"
            >
              Anterior
            </button>
            <button
              onClick={() =>
                setActivePinIndex((prev) => (prev === mapPins.length - 1 ? 0 : prev + 1))
              }
              className="px-3 py-2 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-400 transition-colors"
            >
              Próximo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

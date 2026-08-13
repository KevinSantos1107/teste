import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase/config';
import { useSiteConfigStore } from '../../store/siteConfigStore';
import { uploadImage, cloudinaryUrl } from '../../services/cloudinary/upload';
import { Button } from '../../shared/ui/Button';
import { Input } from '../../shared/ui/Input';
import { Spinner } from '../../shared/ui/Spinner';
import { cn } from '../../shared/utils/cn';
import { Plus, Trash2, MapPin, Upload, X, Search, Loader2 } from 'lucide-react';

interface MapPinData {
  id: string;
  city: string;
  date: string;
  caption: string;
  publicId?: string;
  lat: number;
  lng: number;
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

async function geocodeCity(cityName: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  try {
    const encoded = encodeURIComponent(cityName);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`, {
      headers: { 'Accept-Language': 'pt-BR', 'User-Agent': 'romantic-site-admin/1.0' }
    });
    const data = await res.json();
    if (data.length === 0) return null;
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  } catch {
    return null;
  }
}

const emptyForm = () => ({ city: '', date: '', caption: '', lat: '', lng: '' });

export default function MapEditor() {
  const { config } = useSiteConfigStore();
  const { show, Toast } = useToast();
  const siteId = config?.id || 'meu-site';

  const [pins, setPins] = useState<MapPinData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodePreview, setGeocodePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadPins = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'sites', siteId, 'map_pins'));
      const loaded: MapPinData[] = [];
      snap.forEach(d => {
        if (d.id === '_placeholder') return;
        const data = d.data();
        loaded.push({ id: d.id, city: data.city, date: data.date, caption: data.caption, publicId: data.publicId, lat: data.lat, lng: data.lng });
      });
      setPins(loaded);
    } catch { show('Erro ao carregar pins', 'err'); }
    setLoading(false);
  }, [siteId]);

  useEffect(() => { loadPins(); }, [loadPins]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleGeocode = async () => {
    if (!form.city) { show('Digite o nome da cidade primeiro', 'err'); return; }
    setGeocoding(true);
    setGeocodePreview(null);
    const result = await geocodeCity(form.city);
    if (result) {
      setForm(f => ({ ...f, lat: String(result.lat), lng: String(result.lng) }));
      setGeocodePreview(result.displayName);
      show('Localização encontrada!');
    } else {
      show('Localização não encontrada. Tente um nome mais específico ou insira as coordenadas manualmente.', 'err');
    }
    setGeocoding(false);
  };

  const handleCreate = async () => {
    if (!form.city || !form.date) { show('Cidade e data são obrigatórios', 'err'); return; }
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || isNaN(lng)) { show('Coordenadas inválidas. Use o botão "Buscar Localização" ou insira manualmente.', 'err'); return; }
    setSaving(true);
    try {
      let publicId: string | undefined;
      if (photoFile) {
        const res = await uploadImage(photoFile, `${siteId}/map`);
        publicId = res.publicId;
      }
      await addDoc(collection(db, 'sites', siteId, 'map_pins'), {
        city: form.city,
        date: form.date,
        caption: form.caption,
        lat,
        lng,
        publicId: publicId || null,
        photo_url: publicId ? cloudinaryUrl(publicId, { w: 800 }) : null,
        createdAt: serverTimestamp(),
      });
      show('Lugar adicionado!');
      setCreating(false);
      setForm(emptyForm());
      setPhotoFile(null);
      setPhotoPreview(null);
      setGeocodePreview(null);
      loadPins();
    } catch (e: any) { show('Erro: ' + e.message, 'err'); }
    setSaving(false);
  };

  const handleDelete = async (pin: MapPinData) => {
    if (!confirm(`Deletar o pin de "${pin.city}"?`)) return;
    try {
      await deleteDoc(doc(db, 'sites', siteId, 'map_pins', pin.id));
      setPins(p => p.filter(x => x.id !== pin.id));
      show('Pin removido!');
    } catch (e: any) { show('Erro: ' + e.message, 'err'); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {Toast}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Mapa de Lugares</h1>
          <p className="text-slate-400 mt-1">Gerencie os lugares que vocês visitaram juntos.</p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2 shrink-0"><Plus className="w-4 h-4" /> Adicionar Lugar</Button>
      </div>

      {creating && (
        <div className="bg-slate-800 border border-rose-500/40 rounded-xl p-6 space-y-4">
          <h2 className="font-bold text-white text-lg">Novo Lugar</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Cidade *</label>
              <Input
                value={form.city}
                onChange={e => { setForm({ ...form, city: e.target.value }); setGeocodePreview(null); }}
                className="bg-slate-900 border-slate-700 text-slate-200"
                placeholder="Ex: São Paulo, SP, Brazil"
                onKeyDown={e => { if (e.key === 'Enter') handleGeocode(); }}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Data *</label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="bg-slate-900 border-slate-700 text-slate-200" />
            </div>
          </div>

          {/* Geocode Button */}
          <Button
            variant="secondary"
            onClick={handleGeocode}
            isLoading={geocoding}
            className="gap-2 bg-slate-700 text-white border-slate-600"
          >
            {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar Localização Automaticamente
          </Button>

          {geocodePreview && (
            <div className="bg-emerald-900/30 border border-emerald-500/30 rounded-lg px-4 py-2.5 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-emerald-400 font-medium">Localização encontrada:</p>
                <p className="text-xs text-emerald-300">{geocodePreview}</p>
                <p className="text-xs text-emerald-400 font-mono mt-0.5">Lat: {form.lat} · Lng: {form.lng}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Legenda / Memória</label>
            <Input value={form.caption} onChange={e => setForm({ ...form, caption: e.target.value })} className="bg-slate-900 border-slate-700 text-slate-200" placeholder="Ex: Nossa primeira viagem juntos!" />
          </div>

          {/* Manual coords fallback */}
          <details className="group">
            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-400 transition-colors select-none">
              ⚙️ Inserir coordenadas manualmente (avançado)
            </summary>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Latitude</label>
                <Input value={form.lat} onChange={e => setForm({ ...form, lat: e.target.value })} className="bg-slate-900 border-slate-700 text-slate-200 font-mono" placeholder="-23.5505" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Longitude</label>
                <Input value={form.lng} onChange={e => setForm({ ...form, lng: e.target.value })} className="bg-slate-900 border-slate-700 text-slate-200 font-mono" placeholder="-46.6333" />
              </div>
            </div>
            <p className="text-xs text-slate-600 mt-1">Para obter as coordenadas, clique com botão direito em qualquer lugar no Google Maps e copie as coordenadas.</p>
          </details>

          {/* Photo */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Foto do Lugar (Opcional)</label>
            {photoPreview ? (
              <div className="flex items-center gap-3">
                <img src={photoPreview} alt="" className="w-20 h-20 rounded-lg object-cover border border-slate-600" />
                <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed border-slate-600 rounded-xl p-5 flex items-center gap-3 cursor-pointer hover:border-slate-400 transition-colors">
                <Upload className="w-6 h-6 text-slate-500" />
                <span className="text-slate-400 text-sm">Clique para selecionar uma foto</span>
              </div>
            )}
            <input ref={fileRef} type="file" className="hidden" accept="image/*" onChange={handlePhotoSelect} />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleCreate} isLoading={saving} className="gap-2"><MapPin className="w-4 h-4" /> Adicionar ao Mapa</Button>
            <Button variant="secondary" onClick={() => { setCreating(false); setForm(emptyForm()); setGeocodePreview(null); }} className="bg-slate-700 text-white">Cancelar</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12"><Spinner /></div>
      ) : pins.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-slate-700 rounded-xl text-slate-500">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
          Nenhum lugar cadastrado.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pins.map(pin => (
            <div key={pin.id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden group">
              {pin.publicId ? (
                <img src={cloudinaryUrl(pin.publicId, { w: 400, h: 200, c: 'fill', q: 70 })} alt={pin.city} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-slate-700 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-slate-500" />
                </div>
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate">{pin.city}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{pin.date}</p>
                    {pin.caption && <p className="text-sm text-slate-400 mt-1 line-clamp-2">{pin.caption}</p>}
                    <p className="text-xs text-slate-600 font-mono mt-1">{pin.lat?.toFixed(4)}, {pin.lng?.toFixed(4)}</p>
                  </div>
                  <button onClick={() => handleDelete(pin)} className="p-2 text-slate-500 hover:text-red-400 transition-colors opacity-50 group-hover:opacity-100 flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

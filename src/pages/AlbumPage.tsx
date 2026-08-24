import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase/config';
import { useSiteConfigStore } from '../store/siteConfigStore';
import { AlbumCube } from '../features/album/AlbumCube';
import { Spinner } from '../shared/ui/Spinner';

export default function AlbumPage() {
  const { config } = useSiteConfigStore();
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!config?.id) return;

    const fetchAlbums = async () => {
      try {
        const albumsRef = collection(db, 'sites', config.id, 'album');
        const q = query(albumsRef, orderBy('createdAt', 'asc'));
        const snapshot = await getDocs(q);

        const loadedAlbums: any[] = [];
        snapshot.forEach((doc) => {
          if (doc.id === '_placeholder') return;
          const data = doc.data();
          loadedAlbums.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            date: data.date,
            coverPublicId: data.coverPublicId,
            photos: data.photos || [],
          });
        });

        setAlbums(loadedAlbums);
      } catch (error) {
        console.error('Erro ao carregar álbuns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [config?.id]);

  if (!config) return null;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pt-8 pb-16">
      <div className="text-center px-4 space-y-4">
        <Heart className="w-12 h-12 mx-auto text-theme-primary" />
        <h2 className="text-4xl font-serif font-bold text-theme-text mb-4">Nossa Galeria</h2>
        <p className="text-theme-text-secondary max-w-2xl mx-auto">
          Arraste o cubo para girar e relembrar nossos melhores momentos juntos.
        </p>
      </div>

      <div className="container mx-auto px-4 space-y-16">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : albums.length > 0 ? (
          albums.map((album) => (
            <div key={album.id} className="text-center">
              <h3 className="text-2xl font-bold text-theme-text mb-2">{album.title}</h3>
              {album.description && (
                <p className="text-theme-text-secondary mb-6">{album.description}</p>
              )}
              <AlbumCube photos={album.photos} />
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-theme-text-secondary">
            Nenhum álbum encontrado.
          </div>
        )}
      </div>
    </div>
  );
}

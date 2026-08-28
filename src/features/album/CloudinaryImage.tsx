import { useState } from 'react';
import { cld } from '../../services/cloudinary/config';
import { cn } from '../../shared/utils/cn';

interface CloudinaryImageProps {
  publicId: string;
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  onLoad?: () => void;
}

export function CloudinaryImage({
  publicId,
  alt = 'Imagem do Álbum',
  className,
  style,
  onLoad,
}: CloudinaryImageProps) {
  const [loaded, setLoaded] = useState(false);

  if (!publicId) return null;

  const handleLoad = () => {
    setLoaded(true);
    if (onLoad) onLoad();
  };

  // Se for URL completa (fallback/legado), usa img padrão
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return (
      <img
        src={publicId}
        alt={alt}
        className={cn('object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0', className)}
        style={style}
        onLoad={handleLoad}
      />
    );
  }

  // Cloudinary publicId → gera URL otimizada
  const myImage = cld.image(publicId);
  myImage.format('auto').quality('auto');
  const url = myImage.toURL();

  return (
    <img
      src={url}
      alt={alt}
      className={cn('object-cover transition-opacity duration-500', loaded ? 'opacity-100' : 'opacity-0', className)}
      style={style}
      onLoad={handleLoad}
    />
  );
}

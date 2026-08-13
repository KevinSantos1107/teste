import { AdvancedImage, placeholder, lazyload } from '@cloudinary/react';
import { cld } from '../../services/cloudinary/config';
import { cn } from '../../shared/utils/cn';

interface CloudinaryImageProps {
  publicId: string;
  alt?: string;
  className?: string;
  // Options for cropping/resizing on the fly
  width?: number;
  height?: number;
}

export function CloudinaryImage({ publicId, alt = 'Imagem do Álbum', className }: CloudinaryImageProps) {
  if (!publicId) return null;

  // If publicId is a full HTTP URL (fallback/demo), render a standard img tag
  if (publicId.startsWith('http://') || publicId.startsWith('https://')) {
    return (
      <img 
        src={publicId} 
        alt={alt}
        loading="lazy"
        className={cn('object-cover', className)}
      />
    );
  }

  // Generate the Cloudinary URL object
  const myImage = cld.image(publicId);

  // Apply optimizations
  myImage.format('auto').quality('auto');
  
  // se houver width/height, pode-se aplicar transforms aqui futuramente

  return (
    <AdvancedImage
      cldImg={myImage}
      alt={alt}
      className={cn('object-cover', className)}
      plugins={[lazyload(), placeholder({ mode: 'blur' })]}
    />
  );
}

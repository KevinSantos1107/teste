import { Cloudinary } from '@cloudinary/url-gen';

export const cloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
};

export const cld = new Cloudinary({
  cloud: {
    cloudName: cloudinaryConfig.cloudName,
  },
});

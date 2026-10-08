/**
 * Image compression and optimization utility for Floresta Verde CRM & B2B Landing Page
 * Prevents localStorage QuotaExceededError by compressing raster images to high quality,
 * compact WebP/JPEG/PNG while preserving sharpness and transparent alpha channels.
 */

export interface CompressImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default: 0.82)
  outputFormat?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export function compressImageFile(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.82,
      outputFormat,
    } = options;

    // Vector SVG files do not require raster canvas compression
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Falha ao ler arquivo SVG'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Falha ao ler arquivo de imagem'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Falha ao carregar imagem para compressão'));
      img.onload = () => {
        let { width, height } = img;

        // Maintain proportional aspect ratio
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Enable high-fidelity smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Determine best mime type
        const isPng = file.type === 'image/png';
        const targetFormat = outputFormat || (isPng ? 'image/png' : 'image/jpeg');

        try {
          // If PNG and outputFormat wasn't forced to JPEG, check if canvas can produce WebP or PNG
          const compressedDataUrl = canvas.toDataURL(targetFormat, quality);
          resolve(compressedDataUrl);
        } catch {
          // Fallback to standard jpeg
          try {
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } catch {
            resolve(e.target?.result as string);
          }
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

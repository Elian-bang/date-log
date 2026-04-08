/**
 * Client-side image compression utility
 * Resizes and compresses images to Base64 for DB storage
 */

interface CompressOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
}

const DEFAULT_OPTIONS: CompressOptions = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.7,
};

/**
 * Compress and resize an image file to a Base64 data URI
 */
export async function compressImageToBase64(
  file: File,
  options: Partial<CompressOptions> = {}
): Promise<string> {
  const { maxWidth, maxHeight, quality } = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = () => {
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));

    img.onload = () => {
      const canvas = document.createElement('canvas');

      let { width, height } = img;

      // Scale down proportionally
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas를 생성할 수 없습니다.'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      const base64 = canvas.toDataURL('image/jpeg', quality);
      resolve(base64);
    };

    img.onerror = () => reject(new Error('이미지를 로드할 수 없습니다.'));

    reader.readAsDataURL(file);
  });
}

/**
 * Validate image file before processing
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: '이미지 파일만 업로드할 수 있습니다.' };
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: '이미지 크기는 10MB 이하여야 합니다.' };
  }

  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!supportedFormats.includes(file.type)) {
    return { valid: false, error: '지원되는 형식: JPG, PNG, GIF, WebP' };
  }

  return { valid: true };
}

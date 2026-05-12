export interface ParsedPage {
  canvas: HTMLCanvasElement;
  thumb: string;
}

export function loadImageToCanvas(file: File): Promise<ParsedPage> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const thumb = canvas.toDataURL('image/jpeg', 0.3);
      resolve({ canvas, thumb });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

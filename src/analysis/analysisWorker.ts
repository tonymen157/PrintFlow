import type { PageType } from '../pricing/types';

self.onmessage = async (e: MessageEvent) => {
  const { canvasData, fileId, pageNumber } = e.data;
  const { width, height, data } = canvasData;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(width, height);
  (imageData.data as Uint8ClampedArray).set(new Uint8ClampedArray(data));
  ctx.putImageData(imageData, 0, 0);

  const { coverage, type } = analyzeColor(canvas);
  self.postMessage({ fileId, pageNumber, coverage, type });
};

function analyzeColor(canvas: OffscreenCanvas): { coverage: number; type: PageType } {
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
  if (!ctx) return { coverage: 0, type: 'bw' };

  let width: number, height: number;
  if (canvas instanceof HTMLCanvasElement) {
    width = canvas.width;
    height = canvas.height;
  } else {
    width = canvas.width;
    height = canvas.height;
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const totalPixels = width * height;
  let coloredPixels = 0;
  const step = 4;

  for (let i = 0; i < pixels.length; i += 4 * step) {
    const r = pixels[i], g = pixels[i+1], b = pixels[i+2];
    const isWhite = r > 240 && g > 240 && b > 240;
    const saturation = Math.max(r,g,b) - Math.min(r,g,b);
    if (!isWhite && saturation > 30) coloredPixels++;
  }

  const coverage = (coloredPixels / (totalPixels / step)) * 100;
  const type: PageType =
    coverage === 0 ? 'bw' :
    coverage <= 25 ? 'color-low' :
    coverage <= 50 ? 'color-mid' : 'color-high';

  return { coverage, type };
}

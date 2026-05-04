import type { PageType } from '../pricing/types';

const DEFAULT_THRESHOLDS = { colorLow: 25, colorMid: 50 };

export function analyzeColorCoverage(
  canvas: HTMLCanvasElement,
  thresholds = DEFAULT_THRESHOLDS
): { coverage: number; type: PageType } {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { coverage: 0, type: 'bw' };

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;
  const totalPixels = width * height;

  let coloredPixels = 0;
  const step = 4; // sample 1 of every 4 pixels = 25% sample

  for (let i = 0; i < pixels.length; i += 4 * step) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    const isWhiteBackground = r > 240 && g > 240 && b > 240;
    const maxChannel = Math.max(r, g, b);
    const minChannel = Math.min(r, g, b);
    const saturation = maxChannel - minChannel;

    if (!isWhiteBackground && saturation > 30) {
      coloredPixels++;
    }
  }

  const coverage = (coloredPixels / (totalPixels / step)) * 100;
  const type: PageType =
    coverage === 0 ? 'bw' : coverage <= thresholds.colorLow ? 'color-low' : coverage <= thresholds.colorMid ? 'color-mid' : 'color-high';

  return { coverage, type };
}

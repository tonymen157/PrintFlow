import * as pdfjsLib from 'pdfjs-dist';

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

export interface ParsedPage {
  canvas: HTMLCanvasElement;
  thumb: string; // data:image/jpeg;base64
}

export async function parsePdfPages(file: File): Promise<ParsedPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;
  const results: ParsedPage[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    void canvas.getContext('2d');
    await page.render({ canvas, viewport }).promise;
    const thumb = canvas.toDataURL('image/jpeg', 0.3);
    results.push({ canvas, thumb });
  }

  return results;
}

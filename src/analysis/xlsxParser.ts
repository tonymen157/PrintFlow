import * as XLSX from 'xlsx';

export async function parseXlsxToCanvas(file: File): Promise<HTMLCanvasElement[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const canvases: HTMLCanvasElement[] = [];

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const html = XLSX.utils.sheet_to_html(sheet);

    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    canvas.height = 1400;
    const ctx = canvas.getContext('2d')!;

    const img = new Image();
    await new Promise<void>((resolve) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        canvases.push(canvas);
        resolve();
      };
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1400">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial;font-size:12px;">${html}</div>
        </foreignObject>
      </svg>`;
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  return canvases;
}

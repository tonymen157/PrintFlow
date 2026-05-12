import mammoth from 'mammoth';

export interface ParsedPage {
  canvas: HTMLCanvasElement;
  thumb: string;
}

export async function parseDocxToCanvas(file: File): Promise<ParsedPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d')!;

  const img = new Image();
  await new Promise<void>((resolve) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      resolve();
    };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial;font-size:14px;">${html}</div>
      </foreignObject>
    </svg>`;
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });

  const thumb = canvas.toDataURL('image/jpeg', 0.3);
  return [{ canvas, thumb }];
}

import mammoth from 'mammoth';

export async function parseDocxToCanvas(file: File): Promise<HTMLCanvasElement[]> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1200;
  const ctx = canvas.getContext('2d')!;

  // Render HTML to canvas via hidden div
  const div = document.createElement('div');
  div.style.width = '800px';
  div.style.position = 'absolute';
  div.style.left = '-9999px';
  div.innerHTML = html;
  document.body.appendChild(div);

  // Use SVG foreignObject for HTML rendering
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1200">
    <foreignObject width="100%" height="100%">
      <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial;font-size:14px;">${html}</div>
    </foreignObject>
  </svg>`;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      document.body.removeChild(div);
      resolve([canvas]);
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
}

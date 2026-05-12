import { jsPDF } from 'jspdf';
import type { QuoteResult, QuoteLine, PageType } from '../pricing/types';
import { formatCurrency, pageTypeLabels, pageTypeNames } from '../utils/formatters';

const PAGE_WIDTH = 210; // A4 en mm
const MARGIN = 10;
const LINE_HEIGHT = 6;

export function downloadQuotePDF(quote: QuoteResult, businessName: string = 'PrintFlow') {
  const doc = new jsPDF();
  let y = 15;

  // Encabezado
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(businessName, PAGE_WIDTH / 2, y, { align: 'center' });
  y += 2;
  doc.setDrawColor(0, 122, 255);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 8;

  // Info de la cotización
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cotización #${quote.id.slice(0, 8).toUpperCase()}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Fecha: ${quote.createdAt.toLocaleDateString('es-MX', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Copias: ${quote.copies}`, MARGIN, y);
  y += LINE_HEIGHT;
  doc.text(`Tamaño papel: ${quote.paperSize.toUpperCase()}`, MARGIN, y);
  y += LINE_HEIGHT + 4;

  // Tabla de detalle por archivo
  const byFile: Record<string, QuoteLine[]> = {};
  for (const line of quote.lines) {
    if (!byFile[line.fileName]) byFile[line.fileName] = [];
    byFile[line.fileName].push(line);
  }

  for (const [fileName, lines] of Object.entries(byFile)) {
    // Encabezado de archivo
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`📄 ${fileName}`, MARGIN, y);
    y += LINE_HEIGHT + 2;

    // Header de tabla
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(220, 230, 240);
    doc.rect(MARGIN, y - 3, PAGE_WIDTH - MARGIN * 2, 7, 'F');
    doc.text('Página', MARGIN + 2, y + 1);
    doc.text('Tipo', MARGIN + 25, y + 1);
    doc.text('Trabajo', MARGIN + 60, y + 1);
    doc.text('Impresión', MARGIN + 85, y + 1);
    doc.text('P.Unitario', MARGIN + 130, y + 1);
    doc.text('Subtotal', MARGIN + 165, y + 1);
    y += LINE_HEIGHT + 2;

    // Filas
    doc.setFont('helvetica', 'normal');
    for (const line of lines) {
      if (y > 280) { doc.addPage(); y = 15; }

      doc.text(`Pág ${line.pageNumber}`, MARGIN + 2, y);
      doc.text(pageTypeLabels[line.pageType] || line.pageType, MARGIN + 25, y);

      const workLabel = line.workType === 'impresion' ? 'Impresión'
        : line.workType === 'copias' ? 'Copias' : 'Libro';
      doc.text(workLabel, MARGIN + 60, y);

      const printLabel = line.printType === 'bw' ? 'BN'
        : line.printType === 'color' ? 'Color' : 'Laser';
      doc.text(printLabel, MARGIN + 85, y);

      doc.text(formatCurrency(line.unitPrice), MARGIN + 130, y, { align: 'right' });
      doc.text(formatCurrency(line.subtotal), MARGIN + 165, y, { align: 'right' });
      y += LINE_HEIGHT;
    }

    y += 6;
  }

  // Total
  y += 4;
  if (y > 260) { doc.addPage(); y = 15; }
  doc.setDrawColor(0, 122, 255);
  doc.setLineWidth(0.8);
  doc.line(MARGIN + 130, y - 2, PAGE_WIDTH - MARGIN, y - 2);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', MARGIN + 130, y + 5);
  doc.text(formatCurrency(quote.total), PAGE_WIDTH - MARGIN, y + 5, { align: 'right' });

  // Pie de página
  y = doc.internal.pageSize.height - 15;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(150);
  doc.text(
    `Generado por ${businessName} — ${new Date().toLocaleString('es-MX')}`,
    PAGE_WIDTH / 2,
    y,
    { align: 'center' }
  );

  doc.save(`cotizacion-${quote.id.slice(0, 8)}-${Date.now()}.pdf`);
}

export function downloadHistoryPDF(quotes: QuoteResult[], businessName: string = 'PrintFlow') {
  const doc = new jsPDF();
  let y = 15;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(`Reporte de Cotizaciones — ${businessName}`, PAGE_WIDTH / 2, y, { align: 'center' });
  y += 2;
  doc.setDrawColor(0, 122, 255);
  doc.setLineWidth(0.5);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(220, 230, 240);
  doc.rect(MARGIN, y - 3, PAGE_WIDTH - MARGIN * 2, 8, 'F');
  doc.text('#', MARGIN + 2, y + 2);
  doc.text('Fecha', MARGIN + 15, y + 2);
  doc.text('Archivos', MARGIN + 50, y + 2);
  doc.text('Páginas', MARGIN + 80, y + 2);
  doc.text('Copias', MARGIN + 95, y + 2);
  doc.text('T.Total', MARGIN + 120, y + 2);
  doc.text('Pagado', MARGIN + 155, y + 2);
  doc.text('Estado', MARGIN + 175, y + 2);
  y += 11;

  let totalRevenue = 0;

  for (let i = 0; i < quotes.length; i++) {
    const q = quotes[i];
    if (y > 275) { doc.addPage(); y = 15; }

    const uniqueFiles = [...new Set(q.lines.map(l => l.fileName))].length;
    const totalPages = q.lines.length;
    totalRevenue += q.total;

    doc.setFont('helvetica', 'normal');
    doc.text(`${i + 1}`, MARGIN + 2, y);
    doc.text(q.createdAt.toLocaleDateString('es-MX'), MARGIN + 15, y);
    doc.text(uniqueFiles.toString(), MARGIN + 50, y);
    doc.text(totalPages.toString(), MARGIN + 83, y);
    doc.text(q.copies.toString(), MARGIN + 98, y);
    doc.text(formatCurrency(q.total), MARGIN + 145, y, { align: 'right' });
    doc.text('Pendiente', MARGIN + 175, y);
    y += LINE_HEIGHT;
  }

  // Resumen
  y += 8;
  if (y > 270) { doc.addPage(); y = 15; }
  doc.setDrawColor(0, 122, 255);
  doc.setLineWidth(0.8);
  doc.line(MARGIN + 120, y - 2, PAGE_WIDTH - MARGIN, y - 2);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total general: ${formatCurrency(totalRevenue)}`, PAGE_WIDTH - MARGIN, y + 5, { align: 'right' });

  doc.save(`reporte-cotizaciones-${Date.now()}.pdf`);
}

export function getSummary(quotes: QuoteResult[]) {
  let totalPages = 0;
  let totalRevenue = 0;
  const typeCount: Record<string, number> = {};

  for (const q of quotes) {
    totalPages += q.lines.length * q.copies;
    totalRevenue += q.total;
    for (const line of q.lines) {
      const key = `${line.workType}-${line.printType}`;
      typeCount[key] = (typeCount[key] || 0) + 1;
    }
  }

  return { totalPages, totalRevenue, typeCount, count: quotes.length };
}
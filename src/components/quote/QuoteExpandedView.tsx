import { jsPDF } from 'jspdf';
import type { QuoteResult } from '../../pricing/types';
import { formatCurrency, pageTypeLabels, pageTypeNames } from '../../utils/formatters';

interface Props {
  quote: QuoteResult;
  businessName?: string;
}

export function QuoteExpandedView({ quote, businessName = 'PrintFlow' }: Props) {
  const byFile: Record<string, typeof quote.lines> = {};
  for (const line of quote.lines) {
    if (!byFile[line.fileName]) byFile[line.fileName] = [];
    byFile[line.fileName].push(line);
  }

  const totalPages = quote.lines.reduce((acc, l) => acc + 1, 0);
  const bwPages = quote.lines.filter(l => l.pageType === 'bw').length;
  const colorPages = quote.lines.filter(l => l.pageType !== 'bw').length;

  return (
    <div className="space-y-4">
      {/* Resumen estadístico */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-gray-800">{quote.lines.length}</div>
          <div className="text-xs text-gray-500">Páginas totales</div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-gray-800">{quote.copies}</div>
          <div className="text-xs text-gray-500">Copias</div>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-blue-700">{bwPages}</div>
          <div className="text-xs text-blue-600">Páginas BN</div>
        </div>
        <div className="bg-orange-50 p-3 rounded-lg text-center">
          <div className="text-lg font-bold text-orange-700">{colorPages}</div>
          <div className="text-xs text-orange-600">Páginas Color</div>
        </div>
      </div>

      {/* Detalle por archivo */}
      {Object.entries(byFile).map(([fileName, lines]) => (
        <div key={fileName} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
            <span className="text-sm font-medium text-gray-700">📄 {fileName}</span>
            <span className="ml-2 text-xs text-gray-400">({lines.length} páginas)</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-100">
                  <th className="text-left p-2 text-gray-500 font-medium">Página</th>
                  <th className="text-left p-2 text-gray-500 font-medium">Tipo</th>
                  <th className="text-left p-2 text-gray-500 font-medium">Trabajo</th>
                  <th className="text-left p-2 text-gray-500 font-medium">Impresión</th>
                  <th className="text-right p-2 text-gray-500 font-medium">P. Unitario</th>
                  <th className="text-right p-2 text-gray-500 font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-2 text-gray-700">{line.pageNumber}</td>
                    <td className="p-2">
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium
                        ${line.pageType === 'bw' ? 'bg-gray-200 text-gray-700'
                        : line.pageType === 'color-low' ? 'bg-blue-200 text-blue-700'
                        : line.pageType === 'color-mid' ? 'bg-orange-200 text-orange-700'
                        : line.pageType === 'color-high' ? 'bg-red-200 text-red-700'
                        : 'bg-purple-200 text-purple-700'}`}>
                        {pageTypeLabels[line.pageType]}
                      </span>
                    </td>
                    <td className="p-2 text-gray-600">
                      {line.workType === 'impresion' ? 'Impresión'
                        : line.workType === 'copias' ? 'Copias' : 'Libro'}
                    </td>
                    <td className="p-2 text-gray-600">
                      {line.printType === 'bw' ? 'BN' : line.printType === 'color' ? 'Color' : 'Laser'}
                    </td>
                    <td className="p-2 text-right text-gray-600">{formatCurrency(line.unitPrice)}</td>
                    <td className="p-2 text-right font-medium text-gray-800">{formatCurrency(line.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Total */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold">TOTAL</span>
          <span className="text-2xl font-bold">{formatCurrency(quote.total)}</span>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            const doc = new jsPDF();
            let y = 15;
            const M = 10;
            const PW = 210;

            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text(businessName, PW / 2, y, { align: 'center' });
            y += 10;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Cotización #${quote.id.slice(0, 8).toUpperCase()} — ${quote.createdAt.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, M, y);
            y += 6;
            doc.text(`Copias: ${quote.copies} | Papel: ${quote.paperSize.toUpperCase()}`, M, y);
            y += 10;

            for (const [fileName, lines] of Object.entries(byFile)) {
              doc.setFontSize(12);
              doc.setFont('helvetica', 'bold');
              if (y > 270) { doc.addPage(); y = 15; }
              doc.text(`📄 ${fileName}`, M, y);
              y += 7;

              doc.setFontSize(8);
              doc.setFont('helvetica', 'bold');
              doc.setFillColor(220, 230, 240);
              doc.rect(M, y - 3, PW - M * 2, 6, 'F');
              doc.text('Pág', M + 2, y + 1);
              doc.text('Tipo', M + 15, y + 1);
              doc.text('Trabajo', M + 45, y + 1);
              doc.text('Imp.', M + 65, y + 1);
              doc.text('P.Unit', M + 85, y + 1, { align: 'right' });
              doc.text('Subtotal', M + 110, y + 1, { align: 'right' });
              y += 6;

              doc.setFont('helvetica', 'normal');
              for (const line of lines) {
                if (y > 280) { doc.addPage(); y = 15; }
                doc.text(String(line.pageNumber), M + 2, y);
                doc.text(pageTypeLabels[line.pageType] || '', M + 15, y);
                doc.text(line.workType === 'impresion' ? 'Imp.' : line.workType === 'copias' ? 'Cop.' : 'Lib.', M + 45, y);
                doc.text(line.printType === 'bw' ? 'BN' : line.printType === 'color' ? 'Col' : 'Las', M + 65, y);
                doc.text(formatCurrency(line.unitPrice), M + 100, y, { align: 'right' });
                doc.text(formatCurrency(line.subtotal), M + 120, y, { align: 'right' });
                y += 5;
              }
              y += 8;
            }

            y += 4;
            if (y > 270) { doc.addPage(); y = 15; }
            doc.setDrawColor(0, 122, 255);
            doc.setLineWidth(0.8);
            doc.line(M + 85, y - 2, PW - M, y - 2);
            doc.setFontSize(13);
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL:', PW - M - 50, y + 5);
            doc.text(formatCurrency(quote.total), PW - M, y + 5, { align: 'right' });

            y = doc.internal.pageSize.height - 12;
            doc.setFontSize(7);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(150);
            doc.text(`Generado por ${businessName} — ${new Date().toLocaleString('es-MX')}`, PW / 2, y, { align: 'center' });

            doc.save(`cotizacion-${quote.id.slice(0, 8)}.pdf`);
          }}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition-colors flex items-center gap-2"
        >
          📥 Descargar PDF
        </button>
      </div>
    </div>
  );
}
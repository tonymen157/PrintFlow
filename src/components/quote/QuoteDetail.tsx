import { useAppStore } from '../../store/appStore';
import { formatCurrency, pageTypeLabels } from '../../utils/formatters';

const WORK_TYPE_LABELS: Record<string, string> = {
  impresion: 'Impresión',
  copias: 'Copias',
  libro: 'Libro',
};

export function QuoteDetail() {
  const quote = useAppStore((s) => s.quote);
  if (!quote) return null;

  const MAX_VISIBLE = 10;

  // Group by fileId to handle duplicates
  const byFile: Record<string, typeof quote.lines> = {};
  for (const line of quote.lines) {
    if (!byFile[line.fileId]) byFile[line.fileId] = [];
    byFile[line.fileId].push(line);
  }

  const renderLines = (lines: typeof quote.lines) => {
    if (lines.length <= MAX_VISIBLE + 1) return lines;
    return [
      ...lines.slice(0, MAX_VISIBLE),
      { pageNumber: -1 } as (typeof lines)[0],
      lines[lines.length - 1],
    ];
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h3 className="font-semibold text-lg text-gray-800 mb-4">Desglose</h3>
      {Object.entries(byFile).map(([fileId, lines]) => {
        const first = lines[0];
        const workTypeLabel = WORK_TYPE_LABELS[first.workType] || first.workType;
        const printTypeLabel = first.printType === 'bw' ? ' • BN' : first.printType === 'color' ? ' • Color' : ' • Laser';
        return (
          <div key={fileId} className="mb-4 last:mb-0">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              {first.fileName}
              <span className="text-gray-400 font-normal text-xs">{workTypeLabel}{printTypeLabel}</span>
            </h4>
            <div className="text-xs divide-y divide-gray-100">
              {renderLines(lines).map((l, i) =>
                l.pageNumber === -1 ? (
                  <div key={`ellipsis-${i}`} className="py-2 text-center text-gray-400">
                    ...
                  </div>
                ) : (
                  <div key={i} className="flex justify-between py-2 hover:bg-gray-50 transition-colors">
                    <span className="text-gray-600">
                      Pág {l.pageNumber}{' '}
                      <span className="text-gray-400">
                        {pageTypeLabels[l.pageType]}
                      </span>
                    </span>
                    <span className="font-medium text-gray-700">{formatCurrency(l.subtotal)}</span>
                  </div>
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

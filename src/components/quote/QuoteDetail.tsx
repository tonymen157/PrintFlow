import { useAppStore } from '../../store/appStore';
import { formatCurrency, pageTypeLabels } from '../../utils/formatters';

export function QuoteDetail() {
  const quote = useAppStore((s) => s.quote);
  if (!quote) return null;

  // Group by file
  const byFile: Record<string, typeof quote.lines> = {};
  for (const line of quote.lines) {
    if (!byFile[line.fileName]) byFile[line.fileName] = [];
    byFile[line.fileName].push(line);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border mt-4 p-4">
      <h3 className="font-semibold text-gray-700 mb-3">Desglose</h3>
      {Object.entries(byFile).map(([fileName, lines]) => (
        <div key={fileName} className="mb-3">
          <h4 className="text-sm font-medium text-gray-600">{fileName}</h4>
          <div className="text-xs divide-y">
            {lines.map((l, i) => (
              <div key={i} className="flex justify-between py-1">
                <span>Pág {l.pageNumber} <span className="text-gray-400">{pageTypeLabels[l.pageType]}</span></span>
                <span>{formatCurrency(l.subtotal)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

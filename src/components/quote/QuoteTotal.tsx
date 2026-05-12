import { useAppStore } from '../../store/appStore';
import { formatCurrency } from '../../utils/formatters';

export function QuoteTotal() {
  const quote = useAppStore((s) => s.quote);
  if (!quote) return null;

  const lines = quote.lines;
  const countByType: Record<string, number> = {};
  lines.forEach(l => {
    const key = `${l.workType}-${l.printType}`;
    countByType[key] = (countByType[key] || 0) + 1;
  });

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl p-5 shadow-lg">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold opacity-90">TOTAL COTIZACIÓN</h3>
        <span className="text-3xl font-bold">{formatCurrency(quote.total)}</span>
      </div>
      <div className="flex flex-wrap gap-3 text-sm opacity-80">
        <span>{quote.copies} copia(s)</span>
        <span>•</span>
        <span>{quote.paperSize.toUpperCase()}</span>
        <span>•</span>
        <span>{lines.length} página(s)</span>
      </div>
      {Object.entries(countByType).length > 1 && (
        <div className="mt-3 pt-3 border-t border-blue-400 border-opacity-30">
          <p className="text-xs opacity-70 mb-1">Desglose por tipo:</p>
          {Object.entries(countByType).map(([key, count]) => {
            const [workType, printType] = key.split('-');
            const label = workType === 'impresion' ? 'Impresión' : workType === 'copias' ? 'Copias' : 'Libro';
            const printLabel = printType === 'bw' ? 'BN' : printType === 'color' ? 'Color' : 'Laser';
            return (
              <div key={key} className="flex justify-between text-sm">
                <span className="opacity-80">{label} ({printLabel})</span>
                <span>{count} pág.</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

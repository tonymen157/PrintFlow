import { useAppStore } from '../../store/appStore';
import { formatCurrency } from '../../utils/formatters';

export function QuoteTotal() {
  const quote = useAppStore((s) => s.quote);
  if (!quote) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-600">Subtotal</span>
        <span>{formatCurrency(quote.subtotal)}</span>
      </div>
      {quote.tax > 0 && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">IVA</span>
          <span>{formatCurrency(quote.tax)}</span>
        </div>
      )}
      <div className="flex justify-between items-center pt-2 border-t border-blue-200">
        <span className="text-lg font-bold text-blue-900">TOTAL</span>
        <span className="text-2xl font-bold text-blue-700">{formatCurrency(quote.total)}</span>
      </div>
      <p className="text-xs text-gray-400 mt-2">{quote.copies} copia(s) × {quote.paperSize.toUpperCase()} {quote.sides === 'double' ? 'doble' : 'una'} cara</p>
    </div>
  );
}

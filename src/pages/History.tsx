import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { formatCurrency } from '../utils/formatters';
import { QuoteExpandedView } from '../components/quote/QuoteExpandedView';
import type { QuoteResult } from '../pricing/types';
import { downloadQuotePDF, downloadHistoryPDF } from '../lib/pdfExport';

export function History() {
  const quotes = useAppStore((s) => s.quotesHistory);
  const quotesFilter = useAppStore((s) => s.quotesFilter);
  const setQuotesFilter = useAppStore((s) => s.setQuotesFilter);
  const removeQuoteFromHistory = useAppStore((s) => s.removeQuoteFromHistory);
  const markQuoteAsPaid = useAppStore((s) => s.markQuoteAsPaid);
  const clearHistory = useAppStore((s) => s.clearHistory);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredQuotes = useMemo(() => {
    let result = [...quotes];

    // Filtrar por estado
    if (quotesFilter === 'pendientes') {
      result = result.filter((q) => q.status === 'pendiente');
    } else if (quotesFilter === 'pagados') {
      result = result.filter((q) => q.status === 'pagado');
    }

    // Filtrar por fechas
    if (dateFrom) {
      const from = new Date(dateFrom);
      from.setHours(0, 0, 0, 0);
      result = result.filter((q) => {
        const d = q.createdAt instanceof Date ? q.createdAt : new Date(q.createdAt);
        return d >= from;
      });
    }
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((q) => {
        const d = q.createdAt instanceof Date ? q.createdAt : new Date(q.createdAt);
        return d <= to;
      });
    }

    // Más recientes primero
    result.sort((a, b) => {
      const da = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
      const db = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
      return db.getTime() - da.getTime();
    });

    return result;
  }, [quotes, quotesFilter, dateFrom, dateTo]);

  const stats = useMemo(() => {
    const totalRevenue = quotes.reduce((sum, q) => {
      if (q.status === 'pagado') return sum + q.total;
      return sum;
    }, 0);
    const pendingRevenue = quotes.reduce((sum, q) => {
      if (q.status === 'pendiente') return sum + q.total;
      return sum;
    }, 0);
    const totalFiles = quotes.reduce((sum, q) => sum + new Set(q.lines.map((l: any) => l.fileName)).size, 0);
    const totalPages = quotes.reduce((sum, q) => sum + q.lines.length * q.copies, 0);
    return { totalRevenue, pendingRevenue, count: quotes.length, totalFiles, totalPages };
  }, [quotes]);

  const handleClearHistory = () => {
    if (!confirm('¿Borrar todo el historial? Esta acción no se puede deshacer.')) return;
    clearHistory();
  };

  const handleExportReport = () => {
    downloadHistoryPDF(quotes as QuoteResult[]);
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📋 Historial de Cotizaciones</h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportReport}
            disabled={quotes.length === 0}
            className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
          >
            📥 Exportar Reporte
          </button>
          <button
            onClick={handleClearHistory}
            disabled={quotes.length === 0}
            className="px-3 py-1.5 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-lg disabled:opacity-50 font-medium transition-colors border border-red-200"
          >
            🗑 Borrar todo
          </button>
        </div>
      </div>

      {/* Resumen general */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.count}</div>
          <div className="text-xs text-gray-500 mt-1">Total cotizaciones</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalFiles}</div>
          <div className="text-xs text-gray-500 mt-1">Archivos procesados</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.totalPages}</div>
          <div className="text-xs text-gray-500 mt-1">Páginas totales</div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100 text-center">
          <div className="text-2xl font-bold text-green-700">{formatCurrency(stats.totalRevenue)}</div>
          <div className="text-xs text-green-600 mt-1">Ingresos (pagados)</div>
        </div>
        {stats.pendingRevenue > 0 && (
          <div className="bg-yellow-50 p-4 rounded-xl shadow-sm border border-yellow-100 text-center col-span-2 sm:col-span-1">
            <div className="text-xl font-bold text-yellow-700">{formatCurrency(stats.pendingRevenue)}</div>
            <div className="text-xs text-yellow-600 mt-1">Pendiente de cobro</div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Estado */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
            <select
              value={quotesFilter}
              onChange={(e) => setQuotesFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="todos">Todos</option>
              <option value="pendientes">⏳ Pendientes</option>
              <option value="pagados">✅ Pagados</option>
            </select>
          </div>

          {/* Fecha desde */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Fecha hasta */}
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Limpiar filtros */}
          {(dateFrom || dateTo || quotesFilter !== 'todos') && (
            <button
              onClick={() => { setDateFrom(''); setDateTo(''); setQuotesFilter('todos'); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Lista de cotizaciones */}
      <div className="space-y-3">
        {filteredQuotes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg">{quotes.length === 0 ? 'No hay cotizaciones aún' : 'No se encontraron resultados'}</p>
            {quotes.length > 0 && (
              <p className="text-sm mt-1">Prueba ajustar los filtros o fechas</p>
            )}
          </div>
        ) : (
          filteredQuotes.map((quote) => {
            const d = quote.createdAt instanceof Date ? quote.createdAt : new Date(quote.createdAt);
            const uniqueFiles = new Set(quote.lines.map((l: any) => l.fileName)).size;
            const isExpanded = expandedId === quote.id;

            return (
              <div
                key={quote.id}
                className={`bg-white rounded-xl border transition-all ${
                  isExpanded ? 'border-blue-300 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-md'
                }`}
              >
                {/* Resumen de la cotización */}
                <div
                  className="p-4 cursor-pointer select-none"
                  onClick={() => setExpandedId(isExpanded ? null : quote.id)}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Flecha expandir */}
                    <span className={`transition-transform text-gray-400 ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>

                    {/* ID */}
                    <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                      #{quote.id.slice(0, 8).toUpperCase()}
                    </span>

                    {/* Fecha */}
                    <span className="text-sm text-gray-600">
                      {d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      <span className="text-gray-400 ml-1">{d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>

                    {/* Archivos */}
                    <span className="text-sm text-gray-500">
                      📄 {uniqueFiles} archivo{uniqueFiles !== 1 ? 's' : ''} · {quote.lines.length} pág · {quote.copies} cop{quote.copies !== 1 ? 'ias' : 'ia'}
                    </span>

                    {/* Estado */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        quote.status === 'pagado'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {quote.status === 'pagado' ? '✅ Pagado' : '⏳ Pendiente'}
                    </span>

                    {/* Total */}
                    <span className="text-lg font-bold text-gray-800 ml-auto">
                      {formatCurrency(quote.total)}
                    </span>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="px-4 pb-3 flex gap-2">
                  {quote.status === 'pendiente' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markQuoteAsPaid(quote.id);
                      }}
                      className="px-3 py-1 text-xs bg-green-50 text-green-600 hover:bg-green-100 rounded-md border border-green-200 font-medium transition-colors"
                    >
                      ✅ Marcar como pagado
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadQuotePDF(quote as any);
                    }}
                    className="px-3 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md border border-blue-200 font-medium transition-colors"
                  >
                    📥 PDF
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('¿Eliminar esta cotización del historial?')) {
                        removeQuoteFromHistory(quote.id);
                      }
                    }}
                    className="px-3 py-1 text-xs bg-red-50 text-red-600 hover:bg-red-100 rounded-md border border-red-200 font-medium transition-colors"
                  >
                    🗑 Eliminar
                  </button>
                </div>

                {/* Vista expandida con detalle */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <QuoteExpandedView quote={quote as QuoteResult} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
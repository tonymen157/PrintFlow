import { useState } from 'react';
import { useAppStore } from '../../store/appStore';
import { formatFileSize } from '../../utils/fileHelpers';
import { ColorBadge } from '../shared/ColorBadge';

export function FileList() {
  const files = useAppStore((s) => s.files);
  const removeFile = useAppStore((s) => s.removeFile);
  const duplicateFile = useAppStore((s) => s.duplicateFile);
  const analysisResults = useAppStore((s) => s.analysisResults);
  const fileConfigs = useAppStore((s) => s.fileConfigs);
  const setFileConfig = useAppStore((s) => s.setFileConfig);
  const setPageRange = useAppStore((s) => s.setPageRange);
  const [showConfigMap, setShowConfigMap] = useState<Record<string, boolean>>({});

  if (files.length === 0) return null;

  return (
    <div className="mt-4">
      <h3 className="font-semibold text-gray-800 mb-4 text-lg">Archivos ({files.length})</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {files.map((f) => {
          const analysis = analysisResults.find((r) => r.fileId === f.id);
          const status = analysis?.status;
          const firstThumb = analysis?.pages?.[0]?.thumbnail;
          const firstPage = analysis?.pages?.[0];
          const cfg = fileConfigs[f.id] || {
            copies: 1, paperSize: 'a4',
            selectedPages: [] as number[],
            rangeInput: '', workType: 'impresion' as const,
            printType: 'color' as const,
          };
          const selectedCount = cfg.selectedPages.length;
          const totalCount = analysis?.totalPages || 0;
          const showConfig = showConfigMap[f.id] || false;

          return (
            <div key={f.id} className="relative group">
              {/* Card A4 con thumbnail */}
              <div className="aspect-[1/1.414] bg-white border border-gray-200 rounded-2xl overflow-hidden relative shadow-sm hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                {firstThumb ? (
                  <img src={firstThumb} alt={f.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">
                    📄
                  </div>
                )}

                {/* Status overlay */}
                {status === 'analyzing' && (
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-center">
                      <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-sm text-blue-600 font-medium">Analizando...</p>
                    </div>
                  </div>
                )}
                {status === 'error' && (
                  <div className="absolute inset-0 bg-red-50/90 flex items-center justify-center backdrop-blur-sm">
                    <p className="text-sm text-red-600 font-medium">Error al analizar</p>
                  </div>
                )}

                {/* Color badge sobre la imagen */}
                {firstPage && (
                  <div className="absolute top-2 left-2">
                    <ColorBadge type={firstPage.overriddenType || firstPage.detectedType} />
                  </div>
                )}

                {/* Botón duplicar */}
                <button
                  onClick={() => duplicateFile(f.id)}
                  className="absolute top-2 right-8 bg-blue-500 hover:bg-blue-600 text-white w-6 h-6 rounded-full text-sm
                             opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                  title="Duplicar"
                >+</button>

                {/* Botón eliminar */}
                <button
                  onClick={() => removeFile(f.id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white w-6 h-6 rounded-full text-sm
                             opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                  title="Eliminar"
                >×</button>

                {/* Botón engrane para config */}
                <button
                  onClick={() => setShowConfigMap(prev => ({ ...prev, [f.id]: !prev[f.id] }))}
                  className="absolute bottom-3 right-3 bg-white/95 hover:bg-white rounded-xl w-8 h-8 flex items-center justify-center shadow-md hover:shadow-lg
                             text-gray-600 hover:text-gray-800 transition-all duration-200"
                  title="Configurar"
                >⚙</button>

                {/* Copias badge */}
                {cfg.copies > 1 && (
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                    ×{cfg.copies}
                  </div>
                )}
              </div>

              {/* Nombre abajo */}
              <p className="text-xs text-gray-600 mt-1.5 truncate font-medium" title={f.name}>{f.name}</p>
              <p className="text-[10px] text-gray-400">
                {formatFileSize(f.size)}{' '}
                {status === 'done' && `• ${totalCount} pág.`}
              </p>

              {/* Panel de config elegante (expandible) */}
              {showConfig && (
                <div className="mt-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-xl space-y-3">
                  {/* Tipo de trabajo: Copias / Libro */}
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Trabajo</label>
                    <div className="flex gap-1.5">
                      {(['impresion', 'copias', 'libro'] as const).map((wt) => (
                        <button
                          key={wt}
                          onClick={() => setFileConfig(f.id, { workType: wt })}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                            cfg.workType === wt
                              ? 'bg-blue-500 text-white shadow-md scale-105'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}>{wt === 'copias' ? 'Copias' : wt === 'libro' ? 'Libro' : 'Impresión'}</button>
                      ))}
                    </div>
                  </div>

                  {/* Formato */}
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Formato</label>
                    <div className="flex gap-1.5">
                      {(['a4', 'a5', 'a3'] as const).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setFileConfig(f.id, { paperSize: sz })}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                            cfg.paperSize === sz
                              ? 'bg-blue-500 text-white shadow-md scale-105'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}>{sz.toUpperCase()}</button>
                      ))}
                    </div>
                  </div>

                  {/* Páginas: input rango */}
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Páginas (rango)</label>
                    <input
                      type="text"
                      placeholder="Ej: 1-10, 15, 20-25"
                      value={cfg.rangeInput || ''}
                      onChange={(e) => setPageRange(f.id, e.currentTarget.value, totalCount)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-center focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                      <span className="font-medium text-gray-600">{selectedCount}</span> de {totalCount} seleccionada(s)
                      {cfg.rangeInput && <span className="ml-1 text-blue-500 font-medium">{cfg.rangeInput}</span>}
                    </p>
                  </div>

                  {/* Copias */}
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Copias</label>
                    <input
                      type="number"
                      min={1}
                      value={cfg.copies}
                      onChange={(e) => setFileConfig(f.id, { copies: Math.max(1, Number(e.currentTarget.value) || 1) })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-center focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                    />
                  </div>

                  {/* Tipo de impresión: BN / Color / Laser */}
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Impresión</label>
                    <div className="flex gap-1.5">
                      {(['bw', 'color', 'laser'] as const).map((pt) => (
                        <button
                          key={pt}
                          onClick={() => setFileConfig(f.id, { printType: pt })}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                            cfg.printType === pt
                              ? 'bg-blue-500 text-white shadow-md scale-105'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}>{pt === 'bw' ? 'BN' : pt === 'color' ? 'Color' : 'Laser'}</button>
                      ))}
                    </div>
                  </div>
              </div>
            )}

            </div>
          );
        })}
      </div>
    </div>
  );
}
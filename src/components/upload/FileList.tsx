import { useAppStore } from '../../store/appStore';
import { formatFileSize } from '../../utils/fileHelpers';

export function FileList() {
  const files = useAppStore((s) => s.files);
  const removeFile = useAppStore((s) => s.removeFile);
  const analysisResults = useAppStore((s) => s.analysisResults);

  if (files.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <h3 className="font-semibold text-gray-700">Archivos ({files.length})</h3>
      {files.map((f) => {
        const analysis = analysisResults.find((r) => r.fileId === f.id);
        return (
          <div key={f.id} className="flex items-center justify-between bg-white p-3 rounded shadow-sm border">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{f.name}</p>
              <p className="text-xs text-gray-400">{formatFileSize(f.size)}</p>
            </div>
            <div className="flex items-center gap-2">
              {analysis && (
                <span className="text-xs text-gray-500">
                  {analysis.status === 'done' ? `${analysis.totalPages} pág.` :
                   analysis.status === 'analyzing' ? 'Analizando...' :
                   analysis.status === 'error' ? 'Error' : 'Pendiente'}
                </span>
              )}
              <button
                onClick={() => removeFile(f.id)}
                className="text-red-500 hover:text-red-700 text-lg leading-none"
                title="Eliminar"
              >×</button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { useAppStore } from '../../store/appStore';

export function PrintConfig() {
  const config = useAppStore((s) => s.printConfig);
  const setPrintConfig = useAppStore((s) => s.setPrintConfig);
  const files = useAppStore((s) => s.files);

  if (files.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mt-4">
      <h3 className="font-semibold text-gray-700 mb-3">Configuración de impresión</h3>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Tamaño</label>
          <select
            value={config.paperSize}
            onChange={(e) => setPrintConfig({ paperSize: e.currentTarget.value })}
            className="w-full border rounded px-2 py-1.5 text-sm"
          >
            <option value="letter">Carta</option>
            <option value="legal">Oficio</option>
            <option value="a3">A3</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Caras</label>
          <select
            value={config.sides}
            onChange={(e) => setPrintConfig({ sides: e.currentTarget.value as 'single' | 'double' })}
            className="w-full border rounded px-2 py-1.5 text-sm"
          >
            <option value="single">Una cara</option>
            <option value="double">Doble cara</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Copias</label>
          <input
            type="number"
            min={1}
            value={config.copies}
            onChange={(e) => setPrintConfig({ copies: Math.max(1, parseInt(e.currentTarget.value) || 1) })}
            className="w-full border rounded px-2 py-1.5 text-sm"
          />
        </div>
      </div>
    </div>
  );
}

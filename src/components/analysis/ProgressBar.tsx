interface Props {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="w-full mb-6">
      <div className="flex justify-between text-sm mb-2">
        <span className="text-gray-600 font-medium">Analizando archivos...</span>
        <span className="text-gray-500">{current} / {total}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${pct}%` }}
        >
          {pct > 5 && (
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}

interface Props {
  current: number;
  total: number;
}

export function ProgressBar({ current, total }: Props) {
  const pct = total > 0 ? (current / total) * 100 : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
      <div
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
      <p className="text-xs text-gray-500 mt-1">{current} / {total} archivos analizados</p>
    </div>
  );
}

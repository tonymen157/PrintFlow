import type { PageAnalysis } from '../../pricing/types';
import { ColorBadge } from '../shared/ColorBadge';
import { useAppStore } from '../../store/appStore';

interface Props {
  fileId: string;
  page: PageAnalysis;
}

export function PageCard({ fileId, page }: Props) {
  const updatePageType = useAppStore((s) => s.updatePageType);
  const effectiveType = page.overriddenType || page.detectedType;

  return (
    <div className="border rounded-lg p-2 bg-white shadow-sm text-center text-sm">
      <div className="aspect-[3/4] bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
        {page.thumbnail ? (
          <img src={page.thumbnail} alt={`Pág ${page.pageNumber}`} className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-gray-400">Pág {page.pageNumber}</span>
        )}
      </div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">Pág {page.pageNumber}</span>
        <ColorBadge type={effectiveType} />
      </div>
      <select
        value={effectiveType}
        onChange={(e) => updatePageType(fileId, page.pageNumber, e.currentTarget.value as typeof page.detectedType)}
        className="text-xs border rounded px-1 py-0.5 w-full"
      >
        <option value="bw">BN</option>
        <option value="color-low">C1 Bajo</option>
        <option value="color-mid">C2 Medio</option>
        <option value="color-high">C3 Alto</option>
      </select>
    </div>
  );
}

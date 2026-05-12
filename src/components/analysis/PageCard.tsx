import type { PageAnalysis } from '../../pricing/types';
import { ColorBadge } from '../shared/ColorBadge';
import { useAppStore } from '../../store/appStore';

interface Props {
  fileId: string;
  page: PageAnalysis;
  showCheckbox?: boolean;
  onToggleCheckbox?: () => void;
}

export function PageCard({ fileId, page, showCheckbox = false, onToggleCheckbox }: Props) {
  const updatePageType = useAppStore((s) => s.updatePageType);
  const fileConfigs = useAppStore((s) => s.fileConfigs);
  const effectiveType = page.overriddenType || page.detectedType;
  const cfg = fileConfigs[fileId];
  const isSelected = cfg?.selectedPages.includes(page.pageNumber) ?? true;

  return (
    <div className={`border rounded-lg p-2 bg-white shadow-sm text-center text-sm ${!isSelected ? 'opacity-40' : ''}`}>
      <div className="aspect-[3/4] bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden relative">
        {showCheckbox && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleCheckbox}
            className="absolute top-1 left-1 w-4 h-4 z-10"
          />
        )}
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
      <p className="text-[10px] text-gray-400">{page.colorCoverage.toFixed(1)}% color</p>
      <select
        value={effectiveType}
        onChange={(e) => updatePageType(fileId, page.pageNumber, e.currentTarget.value as typeof page.detectedType)}
        className="text-xs border rounded px-1 py-0.5 w-full mt-0.5"
      >
        <option value="bw">BN</option>
        <option value="color-low">C1</option>
        <option value="color-mid">C2</option>
        <option value="color-high">C3</option>
        <option value="color-very-high">C4</option>
      </select>
    </div>
  );
}

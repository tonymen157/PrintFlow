import type { FileAnalysis } from '../../pricing/types';
import type { PageAnalysis } from '../../pricing/types';
import { PageCard } from './PageCard';

const MAX_VISIBLE = 10;

interface Props {
  analyses: FileAnalysis[];
  fileConfigs?: Record<string, { selectedPages?: number[];[key: string]: unknown }>;
  showCheckboxes?: boolean;
  onTogglePage?: (pageNumber: number) => void;
}

function getVisiblePages(pages: PageAnalysis[], selectedPages?: number[]) {
  const filtered = selectedPages && selectedPages.length > 0
    ? pages.filter(p => selectedPages.includes(p.pageNumber))
    : pages;
  if (filtered.length <= MAX_VISIBLE + 1) return filtered;
  return [...filtered.slice(0, MAX_VISIBLE), { ...filtered[filtered.length - 1], pageNumber: -1 } as PageAnalysis];
}

export function PageGrid({ analyses, fileConfigs = {}, showCheckboxes = false, onTogglePage }: Props) {
  return (
    <div className="mt-4 space-y-4">
      {analyses.filter((a) => a.status === 'done').map((analysis) => {
        const cfg = fileConfigs[analysis.fileId];
        const selectedPages = cfg?.selectedPages;
        const visible = getVisiblePages(analysis.pages, selectedPages);
        const totalVisible = selectedPages && selectedPages.length > 0 ? selectedPages.length : analysis.pages.length;

        return (
          <div key={analysis.fileId}>
            <h4 className="font-medium text-gray-700 mb-2">{analysis.fileName}</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {visible.map((page) =>
                page.pageNumber === -1 ? (
                  <div key="ellipsis" className="col-span-full text-center text-xs text-gray-400 py-1">
                    ...
                  </div>
                ) : (
                  <PageCard
                    key={page.pageNumber}
                    fileId={analysis.fileId}
                    page={page}
                    showCheckbox={showCheckboxes}
                    onToggleCheckbox={() => onTogglePage?.(page.pageNumber)}
                  />
                )
              )}
              {totalVisible > MAX_VISIBLE + 1 && (
                <p className="col-span-full text-center text-xs text-gray-400 py-1">
                  Mostrando {Math.min(MAX_VISIBLE, totalVisible)} de {totalVisible} páginas
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

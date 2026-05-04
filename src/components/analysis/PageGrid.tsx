import type { FileAnalysis } from '../../pricing/types';
import { PageCard } from './PageCard';

interface Props {
  analyses: FileAnalysis[];
}

export function PageGrid({ analyses }: Props) {
  return (
    <div className="mt-4 space-y-4">
      {analyses.filter((a) => a.status === 'done').map((analysis) => (
        <div key={analysis.fileId}>
          <h4 className="font-medium text-gray-700 mb-2">{analysis.fileName}</h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {analysis.pages.map((page) => (
              <PageCard key={page.pageNumber} fileId={analysis.fileId} page={page} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

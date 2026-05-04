import { useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { DropZone } from '../components/upload/DropZone';
import { FileList } from '../components/upload/FileList';
import { ProgressBar } from '../components/analysis/ProgressBar';
import { PageGrid } from '../components/analysis/PageGrid';
import { PrintConfig } from '../components/quote/PrintConfig';
import { QuoteDetail } from '../components/quote/QuoteDetail';
import { QuoteTotal } from '../components/quote/QuoteTotal';
import { computeQuote } from '../pricing/calculator';
import { analyzeColorCoverage } from '../analysis/colorAnalyzer';
import { parsePdfPages } from '../analysis/pdfParser';
import { parseDocxToCanvas } from '../analysis/docxParser';
import { parseXlsxToCanvas } from '../analysis/xlsxParser';
import { loadImageToCanvas } from '../analysis/imageParser';
import { getFileCategory } from '../utils/fileHelpers';

export function Home() {
  const files = useAppStore((s) => s.files);
  const analysisResults = useAppStore((s) => s.analysisResults);
  const setAnalysis = useAppStore((s) => s.setAnalysis);
  const printConfig = useAppStore((s) => s.printConfig);
  const pricing = useAppStore((s) => s.pricing);
  const setQuote = useAppStore((s) => s.setQuote);
  const quote = useAppStore((s) => s.quote);
  const clearFiles = useAppStore((s) => s.clearFiles);

  const [analyzing, setAnalyzing] = useState(false);

  const analyzeFiles = useCallback(async () => {
    setAnalyzing(true);
    for (const fileEntry of files) {
      const cat = getFileCategory(fileEntry.name, fileEntry.type);
      setAnalysis(fileEntry.id, [], 'analyzing');

      try {
        let canvases: HTMLCanvasElement[] = [];

        if (cat === 'pdf') {
          canvases = await parsePdfPages(fileEntry.file);
        } else if (cat === 'docx') {
          canvases = await parseDocxToCanvas(fileEntry.file);
        } else if (cat === 'xlsx') {
          canvases = await parseXlsxToCanvas(fileEntry.file);
        } else if (cat === 'image') {
          const canvas = await loadImageToCanvas(fileEntry.file);
          canvases = [canvas];
        } else {
          setAnalysis(fileEntry.id, [], 'error');
          continue;
        }

        const pages = canvases.map((canvas, idx) => {
          const { coverage, type } = analyzeColorCoverage(canvas);
          return {
            pageNumber: idx + 1,
            colorCoverage: coverage,
            detectedType: type,
            thumbnail: canvas.toDataURL('image/jpeg', 0.3),
          };
        });

        setAnalysis(fileEntry.id, pages, 'done');
      } catch (err) {
        console.error('Analysis error:', err);
        setAnalysis(fileEntry.id, [], 'error');
      }
    }
    setAnalyzing(false);
  }, [files, setAnalysis]);

  const generateQuote = () => {
    const doneAnalyses = analysisResults.filter((r) => r.status === 'done');
    if (doneAnalyses.length === 0) return;
    const q = computeQuote(
      doneAnalyses.map((a) => ({ fileId: a.fileId, fileName: a.fileName, pages: a.pages })),
      pricing,
      printConfig.paperSize,
      printConfig.sides,
      printConfig.copies
    );
    setQuote(q);
  };

  const doneCount = analysisResults.filter((r) => r.status === 'done').length;
  const hasPending = files.length > 0 && doneCount < files.length;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">PrintFlow — Cotizador</h1>

      <DropZone />
      <FileList />

      {hasPending && (
        <button
          onClick={analyzeFiles}
          disabled={analyzing}
          className="mt-4 w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {analyzing ? 'Analizando...' : 'Analizar archivos'}
        </button>
      )}

      {analyzing && <ProgressBar current={doneCount} total={files.length} />}

      <PageGrid analyses={analysisResults} />

      {doneCount > 0 && !quote && (
        <>
          <PrintConfig />
          <button
            onClick={generateQuote}
            className="mt-4 w-full bg-green-600 text-white py-3 rounded-lg font-medium text-lg hover:bg-green-700"
          >
            Calcular cotización
          </button>
        </>
      )}

      {quote && (
        <>
          <QuoteDetail />
          <QuoteTotal />
          <button
            onClick={clearFiles}
            className="mt-4 w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
          >
            Nueva cotización
          </button>
        </>
      )}
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { DropZone } from '../components/upload/DropZone';
import { FileList } from '../components/upload/FileList';
import { ProgressBar } from '../components/analysis/ProgressBar';
import { QuoteDetail } from '../components/quote/QuoteDetail';
import { QuoteTotal } from '../components/quote/QuoteTotal';
import { computeQuote } from '../pricing/calculator';
import { analyzeColorCoverage } from '../analysis/colorAnalyzer';
import { parsePdfPages, type ParsedPage } from '../analysis/pdfParser';
import { parseDocxToCanvas } from '../analysis/docxParser';
import { parseXlsxToCanvas } from '../analysis/xlsxParser';
import { loadImageToCanvas } from '../analysis/imageParser';
import { getFileCategory } from '../utils/fileHelpers';
import type { PageType } from '../pricing/types';

export function Home() {
  const files = useAppStore((s) => s.files);
  const analysisResults = useAppStore((s) => s.analysisResults);
  const setAnalysis = useAppStore((s) => s.setAnalysis);
  const pricing = useAppStore((s) => s.pricing);
  const fileConfigs = useAppStore((s) => s.fileConfigs);
  const setQuote = useAppStore((s) => s.setQuote);
  const quote = useAppStore((s) => s.quote);
  const clearFiles = useAppStore((s) => s.clearFiles);
  const addQuoteToHistory = useAppStore((s) => s.addQuoteToHistory);

  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState('');
  const analyzingRef = useRef(false);
  const prevFilesLengthRef = useRef(0);

  const analyzeFiles = useCallback(async (fileIds?: string[]) => {
    const filesToProcess = fileIds
      ? files.filter((f) => fileIds.includes(f.id))
      : files;

    for (const fileEntry of filesToProcess) {
      const existing = analysisResults.find((r) => r.fileId === fileEntry.id);
      if (existing && (existing.status === 'done' || existing.status === 'analyzing')) {
        continue;
      }

      const cat = getFileCategory(fileEntry.name, fileEntry.type);
      setAnalysis(fileEntry.id, [], 'analyzing');

      try {
        let parsed: ParsedPage[] = [];

        if (cat === 'pdf') {
          parsed = await parsePdfPages(fileEntry.file);
        } else if (cat === 'docx') {
          parsed = await parseDocxToCanvas(fileEntry.file);
        } else if (cat === 'xlsx') {
          parsed = await parseXlsxToCanvas(fileEntry.file);
        } else if (cat === 'image') {
          const p = await loadImageToCanvas(fileEntry.file);
          parsed = [p];
        } else {
          setAnalysis(fileEntry.id, [], 'error');
          continue;
        }

        const pages = parsed.map((p, idx) => {
          const { coverage, type } = analyzeColorCoverage(p.canvas);
          return {
            pageNumber: idx + 1,
            colorCoverage: coverage,
            detectedType: type as PageType,
            thumbnail: p.thumb,
          };
        });

        setAnalysis(fileEntry.id, pages, 'done');
      } catch (err) {
        console.error('Analysis error:', err);
        setAnalysis(fileEntry.id, [], 'error');
      }
    }
  }, [files, analysisResults, setAnalysis]);

  // Auto-analyze when new files are added
  useEffect(() => {
    if (files.length > prevFilesLengthRef.current) {
      const newFiles = files.filter((f) => {
        const existing = analysisResults.find((r) => r.fileId === f.id);
        return !existing || existing.status === 'pending' || existing.status === 'error';
      });

      if (newFiles.length > 0 && !analyzingRef.current) {
        analyzingRef.current = true;
        setAnalyzing(true);
        analyzeFiles(newFiles.map((f) => f.id)).finally(() => {
          analyzingRef.current = false;
          setAnalyzing(false);
        });
      }
    }
    prevFilesLengthRef.current = files.length;
  }, [files.length, analysisResults]);

  // Auto-clear quote when all files deleted
  useEffect(() => {
    if (files.length === 0 && quote) {
      setQuote(null);
    }
  }, [files.length, quote, setQuote]);

  const generateQuote = () => {
    const done = analysisResults.filter((r) => r.status === 'done');
    if (done.length === 0) return;

    const quoteInputs = done.map((a) => {
      const cfg = fileConfigs[a.fileId] || {
        copies: 1, paperSize: 'a4',
        selectedPages: [] as number[], rangeInput: '', workType: 'impresion' as const,
      };
      return {
        fileId: a.fileId,
        fileName: a.fileName,
        pages: a.pages,
        copies: cfg.copies,
        paperSize: cfg.paperSize,
        workType: cfg.workType,
        printType: cfg.printType,
        selectedPages: cfg.selectedPages.length > 0
          ? cfg.selectedPages
          : a.pages.map((p) => p.pageNumber),
      };
    });

    const q = computeQuote(quoteInputs, pricing);
    setQuote(q);
  };

  const doneCount = analysisResults.filter((r) => r.status === 'done').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PrintFlow</h1>
          <p className="text-gray-500">Cotizador de impresiones</p>
        </div>

        {/* Drop Zone */}
        <div className="mb-6">
          <DropZone />
        </div>

        {/* File List */}
        <FileList />

        {/* Progress */}
        {analyzing && <ProgressBar current={doneCount} total={files.length} />}

        {/* Calculate button */}
        {doneCount > 0 && !quote && (
          <button
            onClick={generateQuote}
            className="mt-6 w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transition-all"
          >
            📄 Calcular cotización
          </button>
        )}

        {/* Quote shows HERE, no reemplaza */}
        {quote && (
          <div className="mt-6 space-y-4">
            <QuoteDetail />
            <QuoteTotal />
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => {
                  if (quote) {
                    addQuoteToHistory(quote, 'pagado');
                    setQuote(null);
                    clearFiles();
                    setMessage('✅ Cotización cobrada y guardada en historial');
                  }
                }}
                className="bg-yellow-500 text-white py-2.5 rounded-xl hover:bg-yellow-600 font-semibold shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
              >
                💰 Cobrar
              </button>
              <button
                onClick={generateQuote}
                className="bg-blue-500 text-white py-2.5 rounded-xl hover:bg-blue-600 font-medium shadow-sm hover:shadow transition-all"
              >
                🔄 Actualizar
              </button>
              <button
                onClick={clearFiles}
                className="bg-gray-100 text-gray-700 py-2.5 rounded-xl hover:bg-gray-200 font-medium transition-all"
              >
                🗑 Nueva cotización
              </button>
            </div>
            {message && (
              <div className="mt-3 p-3 bg-green-50 text-green-700 rounded-lg text-sm text-center">
                {message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PageAnalysis, FileAnalysis, PricingConfig, QuoteResult, UploadedFile } from '../pricing/types';
import { defaultPricing } from '../pricing/defaults';

interface AppStore {
  files: UploadedFile[];
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;

  analysisResults: FileAnalysis[];
  setAnalysis: (fileId: string, pages: PageAnalysis[], status: FileAnalysis['status']) => void;
  updatePageType: (fileId: string, pageNumber: number, newType: PageAnalysis['detectedType']) => void;

  printConfig: {
    paperSize: string;
    sides: 'single' | 'double';
    copies: number;
  };
  setPrintConfig: (config: Partial<AppStore['printConfig']>) => void;

  pricing: PricingConfig;
  updatePricing: (config: Partial<PricingConfig>) => void;

  quote: QuoteResult | null;
  setQuote: (quote: QuoteResult | null) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      files: [],
      addFiles: (files) =>
        set((state) => ({
          files: [
            ...state.files,
            ...files.map((f) => ({
              id: crypto.randomUUID(),
              file: f,
              name: f.name,
              size: f.size,
              type: f.type,
            })),
          ],
        })),
      removeFile: (id) =>
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
          analysisResults: state.analysisResults.filter((r) => r.fileId !== id),
        })),
      clearFiles: () => set({ files: [], analysisResults: [], quote: null }),

      analysisResults: [],
      setAnalysis: (fileId, pages, status) =>
        set((state) => {
          const existing = state.analysisResults.findIndex((r) => r.fileId === fileId);
          const record: FileAnalysis = {
            fileId,
            fileName: state.files.find((f) => f.id === fileId)?.name || '',
            totalPages: pages.length,
            pages,
            status,
          };
          if (existing >= 0) {
            const updated = [...state.analysisResults];
            updated[existing] = record;
            return { analysisResults: updated };
          }
          return { analysisResults: [...state.analysisResults, record] };
        }),
      updatePageType: (fileId, pageNumber, newType) =>
        set((state) => ({
          analysisResults: state.analysisResults.map((r) =>
            r.fileId === fileId
              ? {
                  ...r,
                  pages: r.pages.map((p) =>
                    p.pageNumber === pageNumber ? { ...p, overriddenType: newType } : p
                  ),
                }
              : r
          ),
        })),

      printConfig: { paperSize: 'letter', sides: 'single', copies: 1 },
      setPrintConfig: (config) =>
        set((state) => ({ printConfig: { ...state.printConfig, ...config } })),

      pricing: defaultPricing,
      updatePricing: (config) =>
        set((state) => ({ pricing: { ...state.pricing, ...config } as PricingConfig })),

      quote: null,
      setQuote: (quote) => set({ quote }),
    }),
    {
      name: 'printcalc-storage',
      partialize: (state) => ({
        pricing: state.pricing,
        printConfig: state.printConfig,
      }),
    }
  )
);

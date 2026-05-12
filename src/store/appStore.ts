import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { PageAnalysis, FileAnalysis, PricingConfig, QuoteResult, UploadedFile, PrintType } from '../pricing/types';
import { defaultPricing } from '../pricing/defaults';
import { api } from '../lib/api';

interface SavedQuote extends QuoteResult {
  status: 'pendiente' | 'pagado' | 'cancelado';
}

interface AppStore {
  files: UploadedFile[];
  addFiles: (files: File[]) => void;
  removeFile: (id: string) => void;
  duplicateFile: (id: string) => void;
  clearFiles: () => void;

  approved: boolean;
  setApproved: (approved: boolean) => void;

  userRole: string;
  setUserRole: (role: string) => void;

  analysisResults: FileAnalysis[];
  setAnalysis: (fileId: string, pages: PageAnalysis[], status: FileAnalysis['status']) => void;
  updatePageType: (fileId: string, pageNumber: number, newType: PageAnalysis['detectedType']) => void;
  setPageRange: (fileId: string, range: string, totalPages: number) => void;

  fileConfigs: Record<string, {
    copies: number; paperSize: string;
    selectedPages: number[];
    rangeInput: string; workType: 'impresion' | 'copias' | 'libro';
    printType: PrintType;
  }>;
  setFileConfig: (fileId: string, config: Partial<AppStore['fileConfigs'][string]>) => void;

  defaultPrintType: PrintType;
  defaultPaperSize: 'a4' | 'a5' | 'a3';
  defaultWorkType: 'impresion' | 'copias' | 'libro';
  defaultCopies: number;
  setDefaultPrintType: (pt: PrintType) => void;
  setDefaultPaperSize: (sz: 'a4' | 'a5' | 'a3') => void;
  setDefaultWorkType: (wt: 'impresion' | 'copias' | 'libro') => void;
  setDefaultCopies: (copies: number) => void;

  pricing: PricingConfig;
  updatePricing: (config: Partial<PricingConfig>) => void;
  setPricing: (pricing: PricingConfig) => void;

  quote: QuoteResult | null;
  setQuote: (quote: QuoteResult | null) => void;

  quotesHistory: SavedQuote[];
  addQuoteToHistory: (quote: QuoteResult, status?: 'pendiente' | 'pagado') => Promise<void>;
  removeQuoteFromHistory: (id: string) => Promise<void>;
  markQuoteAsPaid: (id: string) => Promise<void>;
  quotesFilter: 'todos' | 'pendientes' | 'pagados';
  setQuotesFilter: (filter: 'todos' | 'pendientes' | 'pagados') => void;
  clearHistory: () => void;

  resetStore: () => void;

  loadUserConfig: () => Promise<void>;
  saveUserConfig: () => Promise<void>;
}

const parseQuotesFromBackend = (rows: any[]): SavedQuote[] => {
  return rows.map((row) => ({
    id: row.id,
    createdAt: row.createdAt ? new Date(row.createdAt) : new Date(),
    total: row.total || 0,
    copies: row.copies || 1,
    paperSize: row.paperSize || 'a4',
    lines: typeof row.lines === 'string' ? JSON.parse(row.lines || '[]') : (row.lines || []),
    status: row.status || 'pagado',
  }));
};

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      approved: false,
      setApproved: (approved) => set({ approved }),

      userRole: localStorage.getItem('userRole') || 'user',
      setUserRole: (role: string) => set({ userRole: role }),

      defaultPrintType: 'color' as const,
      defaultPaperSize: 'a4' as const,
      defaultWorkType: 'impresion' as const,
      defaultCopies: 1,
      setDefaultPrintType: (pt) => set({ defaultPrintType: pt }),
      setDefaultPaperSize: (sz) => set({ defaultPaperSize: sz }),
      setDefaultWorkType: (wt) => set({ defaultWorkType: wt }),
      setDefaultCopies: (copies) => set({ defaultCopies: copies }),

      files: [],
      addFiles: (files) =>
        set((state) => {
          const newFiles = files.map((f) => ({
            id: crypto.randomUUID(),
            file: f,
            name: f.name,
            size: f.size,
            type: f.type,
          }));
          return { files: [...state.files, ...newFiles] };
        }),
      removeFile: (id) =>
        set((state) => ({
          files: state.files.filter((f) => f.id !== id),
          analysisResults: state.analysisResults.filter((r) => r.fileId !== id),
          fileConfigs: (() => { const c = { ...state.fileConfigs }; delete c[id]; return c; })(),
        })),
      duplicateFile: (id) =>
        set((state) => {
          const original = state.files.find((f) => f.id === id);
          if (!original) return {};
          const newId = crypto.randomUUID();
          const newName = `${original.name} (copia)`;
          const newFile = { id: newId, file: original.file, name: newName, size: original.size, type: original.type };
          const newAnalysisResults = [...state.analysisResults];
          const origAnalysis = state.analysisResults.find((r) => r.fileId === id);
          if (origAnalysis) newAnalysisResults.push({ ...origAnalysis, fileId: newId, fileName: newName });
          return {
            files: [...state.files, newFile],
            analysisResults: newAnalysisResults,
            fileConfigs: { ...state.fileConfigs, [newId]: { copies: get().defaultCopies, paperSize: get().defaultPaperSize, selectedPages: [] as number[], rangeInput: '', workType: get().defaultWorkType, printType: get().defaultPrintType } },
          };
        }),
      clearFiles: () => set({ files: [], analysisResults: [], quote: null, fileConfigs: {} }),

      analysisResults: [],
      setAnalysis: (fileId, pages, status) =>
        set((state) => {
          const existing = state.analysisResults.findIndex((r) => r.fileId === fileId);
          const record = { fileId, fileName: state.files.find((f) => f.id === fileId)?.name || '', totalPages: pages.length, pages, status };
          if (existing >= 0) {
            const updated = [...state.analysisResults];
            updated[existing] = record;
            return { analysisResults: updated };
          }
          const cfg = state.fileConfigs;
          if (!cfg[fileId]) return { analysisResults: [...state.analysisResults, record], fileConfigs: { ...cfg, [fileId]: { copies: get().defaultCopies, paperSize: get().defaultPaperSize, selectedPages: pages.map((p) => p.pageNumber), rangeInput: '', workType: get().defaultWorkType, printType: get().defaultPrintType } } };
          return { analysisResults: [...state.analysisResults, record] };
        }),
      updatePageType: (fileId, pageNumber, newType) =>
        set((state) => ({
          analysisResults: state.analysisResults.map((r) =>
            r.fileId === fileId ? { ...r, pages: r.pages.map((p) => p.pageNumber === pageNumber ? { ...p, overriddenType: newType } : p) } : r
          ),
        })),
      setPageRange: (fileId, range, totalPages) =>
        set((state) => {
          const cfg = state.fileConfigs[fileId] || { copies: get().defaultCopies, paperSize: get().defaultPaperSize, selectedPages: [] as number[], rangeInput: '', workType: get().defaultWorkType, printType: get().defaultPrintType };
          const pages: number[] = [];
          for (const part of range.split(',').map(s => s.trim()).filter(Boolean)) {
            if (part.includes('-')) {
              const [startStr, endStr] = part.split('-').map(s => s.trim());
              const start = parseInt(startStr) || 1;
              const end = parseInt(endStr) || totalPages;
              for (let i = start; i <= Math.min(end, totalPages); i++) if (!pages.includes(i)) pages.push(i);
            } else {
              const n = parseInt(part);
              if (n >= 1 && n <= totalPages && !pages.includes(n)) pages.push(n);
            }
          }
          pages.sort((a, b) => a - b);
          return { fileConfigs: { ...state.fileConfigs, [fileId]: { ...cfg, selectedPages: pages, rangeInput: range } } };
        }),

      fileConfigs: {},
      setFileConfig: (fileId, config) =>
        set((state) => {
          const prev = state.fileConfigs[fileId] || { copies: get().defaultCopies, paperSize: get().defaultPaperSize, selectedPages: [] as number[], rangeInput: '', workType: get().defaultWorkType, printType: get().defaultPrintType };
          return { fileConfigs: { ...state.fileConfigs, [fileId]: { ...prev, ...config } } };
        }),

      pricing: defaultPricing,
      updatePricing: (config) =>
        set((state) => ({ pricing: { ...state.pricing, ...config } as PricingConfig })),
      setPricing: (pricing) => set({ pricing }),

      quote: null,
      setQuote: (quote) => set({ quote }),

      // Historial de cotizaciones (sincronizado con backend)
      quotesHistory: [] as SavedQuote[],
      addQuoteToHistory: async (quote: QuoteResult, status: 'pendiente' | 'pagado' = 'pagado') => {
        try {
          await api.quotes.save({
            id: quote.id,
            createdAt: quote.createdAt instanceof Date ? quote.createdAt.toISOString() : quote.createdAt,
            total: quote.total,
            copies: quote.copies,
            paperSize: quote.paperSize,
            lines: quote.lines,
            status,
          });
        } catch (e) {
          console.error('Error saving quote to backend:', e);
        }
        set((state) => ({
          quotesHistory: [
            { ...quote, createdAt: quote.createdAt instanceof Date ? quote.createdAt : new Date(quote.createdAt), status },
            ...state.quotesHistory,
          ],
        }));
      },
      removeQuoteFromHistory: async (id: string) => {
        try {
          await api.quotes.delete(id);
        } catch (e) {
          console.error('Error deleting quote from backend:', e);
        }
        set((state) => ({ quotesHistory: state.quotesHistory.filter((q) => q.id !== id) }));
      },
      markQuoteAsPaid: async (id: string) => {
        try {
          await api.quotes.updateStatus(id, 'pagado');
        } catch (e) {
          console.error('Error updating quote status on backend:', e);
        }
        set((state) => ({
          quotesHistory: state.quotesHistory.map((q) => q.id === id ? { ...q, status: 'pagado' as const } : q),
        }));
      },
      quotesFilter: 'todos' as 'todos' | 'pendientes' | 'pagados',
      setQuotesFilter: (filter: 'todos' | 'pendientes' | 'pagados') => set({ quotesFilter: filter }),
      clearHistory: () => set({ quotesHistory: [] }),

      // Reset completo del store (para logout)
      resetStore: () => {
        set({
          files: [], analysisResults: [], fileConfigs: {}, quote: null, quotesHistory: [],
          pricing: defaultPricing, defaultPrintType: 'color' as const, defaultPaperSize: 'a4' as const,
          defaultWorkType: 'impresion' as const, defaultCopies: 1, approved: false, userRole: 'user',
        });
      },

      // Funciones para sincronizar con backend
      loadUserConfig: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        try {
          const [me, defaults, pricing] = await Promise.all([
            api.me(),
            api.config.getDefaults(),
            api.config.getPricing(),
          ]);

          set({
            approved: me.approved === 1 || me.role === 'admin',
            userRole: me.role || 'user',
            defaultPrintType: defaults.defaultPrintType || 'color',
            defaultPaperSize: defaults.defaultPaperSize || 'a4',
            defaultWorkType: defaults.defaultWorkType || 'impresion',
            defaultCopies: defaults.defaultCopies || 1,
            pricing: {
              ...pricing,
              impresionPrices: typeof pricing.impresionPrices === 'string' ? JSON.parse(pricing.impresionPrices || '{}') : pricing.impresionPrices,
              copiasPrices: typeof pricing.copiasPrices === 'string' ? JSON.parse(pricing.copiasPrices || '{}') : pricing.copiasPrices,
              libroPrices: typeof pricing.libroPrices === 'string' ? JSON.parse(pricing.libroPrices || '{}') : pricing.libroPrices,
              impresionLaserPrices: typeof pricing.impresionLaserPrices === 'string' ? JSON.parse(pricing.impresionLaserPrices || '{}') : pricing.impresionLaserPrices,
              copiasLaserPrices: typeof pricing.copiasLaserPrices === 'string' ? JSON.parse(pricing.copiasLaserPrices || '{}') : pricing.copiasLaserPrices,
              libroLaserPrices: typeof pricing.libroLaserPrices === 'string' ? JSON.parse(pricing.libroLaserPrices || '{}') : pricing.libroLaserPrices,
              currency: pricing.currency || 'USD',
            } as PricingConfig,
          });

          if (me.role) localStorage.setItem('userRole', me.role);
        } catch (e) {
          console.error('Error loading user config:', e);
        }

        // Cargar historial de forma independiente (tolerante a errores)
        try {
          const quotes = await api.quotes.getAll();
          set({ quotesHistory: parseQuotesFromBackend(quotes || []) });
        } catch (e) {
          console.error('Error loading quotes history:', e);
        }
      },
      saveUserConfig: async () => {
        const state = get();
        const token = localStorage.getItem('authToken');
        if (!token) return;
        try {
          await Promise.all([
            api.config.saveDefaults({ defaultPrintType: state.defaultPrintType, defaultPaperSize: state.defaultPaperSize, defaultWorkType: state.defaultWorkType, defaultCopies: state.defaultCopies }),
            api.config.savePricing(state.pricing),
          ]);
        } catch (e) {
          console.error('Error saving user config:', e);
        }
      },
    }),
    {
      name: 'printcalc-storage',
      partialize: (state) => ({
        pricing: {
          ...state.pricing,
          impresionPrices: state.pricing.impresionPrices,
          copiasPrices: state.pricing.copiasPrices,
          libroPrices: state.pricing.libroPrices,
          impresionLaserPrices: state.pricing.impresionLaserPrices,
          copiasLaserPrices: state.pricing.copiasLaserPrices,
          libroLaserPrices: state.pricing.libroLaserPrices,
        },
        fileConfigs: state.fileConfigs,
        defaultPrintType: state.defaultPrintType,
        defaultPaperSize: state.defaultPaperSize,
        defaultWorkType: state.defaultWorkType,
        defaultCopies: state.defaultCopies,
        approved: state.approved,
        quotesHistory: state.quotesHistory,
      }),
    }
  )
);
export type PageType = 'bw' | 'color-low' | 'color-mid' | 'color-high' | 'color-very-high';
export type PrintType = 'bw' | 'color' | 'laser';
export type PrintTech = 'standard' | 'laser';

export interface PageAnalysis {
  pageNumber: number;
  colorCoverage: number;
  detectedType: PageType;
  overriddenType?: PageType;
  thumbnail: string;
}

export interface FileAnalysis {
  fileId: string;
  fileName: string;
  totalPages: number;
  pages: PageAnalysis[];
  status: 'pending' | 'analyzing' | 'done' | 'error';
  error?: string;
}

export interface PricingConfig {
  thresholds?: {
    colorLow: number;
    colorMid: number;
  };
  // Precios por tipo de trabajo
  impresionPrices: {
    [paperSize: string]: {
      [pageType in PageType]: number;
    };
  };
  copiasPrices: {
    [paperSize: string]: {
      [pageType in PageType]: number;
    };
  };
  libroPrices: {
    [paperSize: string]: {
      [pageType in PageType]: number;
    };
  };
  // Precios laser (siempre mas caros)
  impresionLaserPrices: {
    [paperSize: string]: {
      [pageType in PageType]: number;
    };
  };
  copiasLaserPrices: {
    [paperSize: string]: {
      [pageType in PageType]: number;
    };
  };
  libroLaserPrices: {
    [paperSize: string]: {
      [pageType in PageType]: number;
    };
  };
  currency: string;
}

export interface QuoteLine {
  fileId: string;
  fileName: string;
  pageNumber: number;
  pageType: PageType;
  workType: 'impresion' | 'copias' | 'libro';
  printType: PrintType;
  unitPrice: number;
  subtotal: number;
}

export interface QuoteResult {
  id: string;
  createdAt: Date;
  lines: QuoteLine[];
  copies: number;
  paperSize: string;
  subtotal: number;
  total: number;
}

export interface BusinessProfile {
  name: string;
  logo?: string;
  contact: string;
}

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
}

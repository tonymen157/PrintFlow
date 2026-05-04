export type PageType = 'bw' | 'color-low' | 'color-mid' | 'color-high';

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
  thresholds: {
    colorLow: number;
    colorMid: number;
  };
  prices: {
    [paperSize: string]: {
      [pageType in PageType]: {
        single: number;
        double: number;
      };
    };
  };
  taxRate: number;
  currency: string;
}

export interface QuoteLine {
  fileId: string;
  fileName: string;
  pageNumber: number;
  pageType: PageType;
  unitPrice: number;
  subtotal: number;
}

export interface QuoteResult {
  id: string;
  createdAt: Date;
  lines: QuoteLine[];
  copies: number;
  paperSize: string;
  sides: 'single' | 'double';
  subtotal: number;
  tax: number;
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

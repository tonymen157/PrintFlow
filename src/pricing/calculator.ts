import type { PageAnalysis, PricingConfig, QuoteLine, QuoteResult, PageType, PrintType } from './types';

function getEffectiveType(page: PageAnalysis, printType: PrintType): PageType {
  if (printType === 'bw') return 'bw';
  return page.overriddenType || page.detectedType;
}

export function computeQuote(
  analyses: {
    fileId: string;
    fileName: string;
    pages: PageAnalysis[];
    copies: number;
    paperSize: string;
    workType: 'impresion' | 'copias' | 'libro';
    printType: PrintType;
    selectedPages: number[];
  }[],
  pricing: PricingConfig
): QuoteResult {
  const lines: QuoteLine[] = [];

  for (const analysis of analyses) {
    const { fileId, fileName, pages, copies, paperSize, workType, printType, selectedPages } = analysis;
    const pagesToUse = selectedPages.length > 0 ? pages.filter(p => selectedPages.includes(p.pageNumber)) : pages;

    // Pick base table key based on workType + printType
    let tableKey: string;
    if (workType === 'impresion') tableKey = printType === 'laser' ? 'impresionLaserPrices' : 'impresionPrices';
    else if (workType === 'copias') tableKey = printType === 'laser' ? 'copiasLaserPrices' : 'copiasPrices';
    else tableKey = printType === 'laser' ? 'libroLaserPrices' : 'libroPrices';

    const allTables = pricing as unknown as Record<string, Record<string, Record<string, number>>>;
    const priceTable = allTables[tableKey];
    const baseTable = priceTable?.[paperSize] || priceTable?.['a4'] || {};

    for (const page of pagesToUse) {
      const type = getEffectiveType(page, printType);
      const unitPrice = baseTable?.[type] || 0;

      lines.push({
        fileId,
        fileName,
        pageNumber: page.pageNumber,
        pageType: type,
        workType,
        printType,
        unitPrice,
        subtotal: unitPrice * copies,
      });
    }
  }

  const copies = Math.max(...analyses.map((a) => a.copies), 1);
  const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0);
  const total = subtotal;

  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    lines,
    copies,
    paperSize: analyses[0]?.paperSize || 'a4',
    subtotal,
    total,
  };
}

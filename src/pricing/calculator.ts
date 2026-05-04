import type { PageAnalysis, PricingConfig, QuoteLine, QuoteResult, PageType } from './types';

function getEffectiveType(page: PageAnalysis): PageType {
  return page.overriddenType || page.detectedType;
}

export function computeQuote(
  analyses: { fileId: string; fileName: string; pages: PageAnalysis[] }[],
  pricing: PricingConfig,
  paperSize: string,
  sides: 'single' | 'double',
  copies: number
): QuoteResult {
  const lines: QuoteLine[] = [];
  const sizePrices = pricing.prices[paperSize] || pricing.prices['letter'];

  for (const analysis of analyses) {
    for (const page of analysis.pages) {
      const type = getEffectiveType(page);
      const priceEntry = sizePrices[type];
      const unitPrice = sides === 'single' ? priceEntry.single : priceEntry.double;
      lines.push({
        fileId: analysis.fileId,
        fileName: analysis.fileName,
        pageNumber: page.pageNumber,
        pageType: type,
        unitPrice,
        subtotal: unitPrice,
      });
    }
  }

  const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0) * copies;
  const tax = subtotal * pricing.taxRate;
  const total = subtotal + tax;

  return {
    id: crypto.randomUUID(),
    createdAt: new Date(),
    lines,
    copies,
    paperSize,
    sides,
    subtotal,
    tax,
    total,
  };
}

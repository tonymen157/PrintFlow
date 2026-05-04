export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return value.toFixed(1) + '%';
}

export const pageTypeLabels: Record<string, string> = {
  bw: 'BN',
  'color-low': 'C1',
  'color-mid': 'C2',
  'color-high': 'C3',
};

export const pageTypeNames: Record<string, string> = {
  bw: 'Blanco y negro',
  'color-low': 'Color bajo',
  'color-mid': 'Color medio',
  'color-high': 'Color alto',
};

export const pageTypeColors: Record<string, string> = {
  bw: 'bg-gray-200 text-gray-800',
  'color-low': 'bg-blue-200 text-blue-800',
  'color-mid': 'bg-orange-200 text-orange-800',
  'color-high': 'bg-red-200 text-red-800',
};

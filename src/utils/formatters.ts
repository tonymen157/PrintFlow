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
  bw: 'BN (0%)',
  'color-low': 'C1 (0-25%)',
  'color-mid': 'C2 (25-50%)',
  'color-high': 'C3 (50-75%)',
  'color-very-high': 'C4 (75-100%)',
};

export const pageTypeNames: Record<string, string> = {
  bw: 'Blanco y negro (0%)',
  'color-low': 'Color bajo (0-25%)',
  'color-mid': 'Color medio (25-50%)',
  'color-high': 'Color alto (50-75%)',
  'color-very-high': 'Color muy alto (75-100%)',
};

export const pageTypeDesc: Record<string, string> = {
  bw: 'Sin color — $',
  'color-low': '0-25% color — $',
  'color-mid': '25-50% color — $',
  'color-high': '50-75% color — $',
  'color-very-high': '75-100% color — $',
};

export const pageTypeColors: Record<string, string> = {
  bw: 'bg-gray-200 text-gray-800',
  'color-low': 'bg-blue-200 text-blue-800',
  'color-mid': 'bg-orange-200 text-orange-800',
  'color-high': 'bg-red-200 text-red-800',
  'color-very-high': 'bg-purple-200 text-purple-800',
};

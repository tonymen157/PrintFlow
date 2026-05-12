import type { PricingConfig, BusinessProfile } from './types';

export const defaultPricing: PricingConfig = {
  thresholds: {
    colorLow: 25,
    colorMid: 50,
  },
  impresionPrices: {
    a4: {
      bw: 0.5,
      'color-low': 1.0,
      'color-mid': 1.5,
      'color-high': 2.5,
      'color-very-high': 3.5,
    },
    a5: {
      bw: 0.3,
      'color-low': 0.6,
      'color-mid': 1.0,
      'color-high': 1.5,
      'color-very-high': 2.5,
    },
    a3: {
      bw: 1.0,
      'color-low': 2.0,
      'color-mid': 3.0,
      'color-high': 5.0,
      'color-very-high': 7.0,
    },
  },
  copiasPrices: {
    a4: {
      bw: 0.4,
      'color-low': 0.8,
      'color-mid': 1.2,
      'color-high': 2.0,
      'color-very-high': 3.0,
    },
    a5: {
      bw: 0.25,
      'color-low': 0.5,
      'color-mid': 0.8,
      'color-high': 1.2,
      'color-very-high': 2.0,
    },
    a3: {
      bw: 0.8,
      'color-low': 1.5,
      'color-mid': 2.5,
      'color-high': 4.0,
      'color-very-high': 6.0,
    },
  },
  libroPrices: {
    a4: {
      bw: 0.6,
      'color-low': 1.2,
      'color-mid': 1.8,
      'color-high': 3.0,
      'color-very-high': 4.0,
    },
    a5: {
      bw: 0.35,
      'color-low': 0.7,
      'color-mid': 1.2,
      'color-high': 2.0,
      'color-very-high': 3.0,
    },
    a3: {
      bw: 1.2,
      'color-low': 2.5,
      'color-mid': 4.0,
      'color-high': 6.0,
      'color-very-high': 8.0,
    },
  },
  impresionLaserPrices: {
    a4: {
      bw: 0.7,
      'color-low': 1.8,
      'color-mid': 2.5,
      'color-high': 4.0,
      'color-very-high': 5.5,
    },
    a5: {
      bw: 0.4,
      'color-low': 1.2,
      'color-mid': 1.8,
      'color-high': 2.5,
      'color-very-high': 3.5,
    },
    a3: {
      bw: 1.5,
      'color-low': 3.5,
      'color-mid': 5.0,
      'color-high': 8.0,
      'color-very-high': 11.0,
    },
  },
  copiasLaserPrices: {
    a4: {
      bw: 0.5,
      'color-low': 1.2,
      'color-mid': 1.8,
      'color-high': 3.0,
      'color-very-high': 4.0,
    },
    a5: {
      bw: 0.3,
      'color-low': 0.8,
      'color-mid': 1.2,
      'color-high': 2.0,
      'color-very-high': 3.0,
    },
    a3: {
      bw: 1.0,
      'color-low': 2.0,
      'color-mid': 3.0,
      'color-high': 5.0,
      'color-very-high': 7.0,
    },
  },
  libroLaserPrices: {
    a4: {
      bw: 0.8,
      'color-low': 1.5,
      'color-mid': 2.2,
      'color-high': 3.5,
      'color-very-high': 5.0,
    },
    a5: {
      bw: 0.45,
      'color-low': 0.9,
      'color-mid': 1.5,
      'color-high': 2.5,
      'color-very-high': 3.5,
    },
    a3: {
      bw: 1.5,
      'color-low': 3.0,
      'color-mid': 4.5,
      'color-high': 7.0,
      'color-very-high': 9.0,
    },
  },
  currency: 'USD',
};

export const defaultProfile: BusinessProfile = {
  name: 'PrintFlow',
  contact: '',
};

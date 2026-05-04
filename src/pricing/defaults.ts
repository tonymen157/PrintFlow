import type { PricingConfig, BusinessProfile } from './types';

export const defaultPricing: PricingConfig = {
  thresholds: {
    colorLow: 25,
    colorMid: 50,
  },
  prices: {
    letter: {
      bw: { single: 0.5, double: 0.3 },
      'color-low': { single: 1.0, double: 0.6 },
      'color-mid': { single: 1.5, double: 0.9 },
      'color-high': { single: 2.5, double: 1.5 },
    },
    legal: {
      bw: { single: 0.7, double: 0.4 },
      'color-low': { single: 1.2, double: 0.7 },
      'color-mid': { single: 1.8, double: 1.1 },
      'color-high': { single: 3.0, double: 1.8 },
    },
    a3: {
      bw: { single: 1.0, double: 0.6 },
      'color-low': { single: 2.0, double: 1.2 },
      'color-mid': { single: 3.0, double: 1.8 },
      'color-high': { single: 5.0, double: 3.0 },
    },
  },
  taxRate: 0,
  currency: 'USD',
};

export const defaultProfile: BusinessProfile = {
  name: 'PrintFlow',
  contact: '',
};

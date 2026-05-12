import { useState, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { pageTypeNames } from '../utils/formatters';
import { api } from '../lib/api';
import type { PricingConfig } from '../pricing/types';

const TYPES = ['bw', 'color-low', 'color-mid', 'color-high', 'color-very-high'] as const;
const SIZES = ['a4', 'a5', 'a3'] as const;
const SECTIONS = [
  { key: 'impresionPrices', label: 'Impresión' },
  { key: 'copiasPrices', label: 'Copias' },
  { key: 'libroPrices', label: 'Libro' },
] as const;
type LaserMode = 'tintas' | 'laser';

export function Admin() {
  const pricing = useAppStore((s) => s.pricing);
  const updatePricing = useAppStore((s) => s.updatePricing);
  const setPricing = useAppStore((s) => s.setPricing);
  const defaultPrintType = useAppStore((s) => s.defaultPrintType);
  const defaultPaperSize = useAppStore((s) => s.defaultPaperSize);
  const defaultWorkType = useAppStore((s) => s.defaultWorkType);
  const defaultCopies = useAppStore((s) => s.defaultCopies);
  const setDefaultPrintType = useAppStore((s) => s.setDefaultPrintType);
  const setDefaultPaperSize = useAppStore((s) => s.setDefaultPaperSize);
  const setDefaultWorkType = useAppStore((s) => s.setDefaultWorkType);
  const setDefaultCopies = useAppStore((s) => s.setDefaultCopies);
  const [loading, setLoading] = useState(true);
  const [laserMode, setLaserMode] = useState<LaserMode>('tintas');
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);

  // Load user config on mount
  useEffect(() => {
    const loadUserConfig = async () => {
      try {
        const defaults = await api.config.getDefaults();
        const pricingData = await api.config.getPricing();

        setDefaultPrintType(defaults.defaultPrintType);
        setDefaultPaperSize(defaults.defaultPaperSize);
        setDefaultWorkType(defaults.defaultWorkType);
        setDefaultCopies(defaults.defaultCopies);

        setPricing({
          ...pricingData,
          impresionPrices: JSON.parse(pricingData.impresionPrices || '{}'),
          copiasPrices: JSON.parse(pricingData.copiasPrices || '{}'),
          libroPrices: JSON.parse(pricingData.libroPrices || '{}'),
          impresionLaserPrices: JSON.parse(pricingData.impresionLaserPrices || '{}'),
          copiasLaserPrices: JSON.parse(pricingData.copiasLaserPrices || '{}'),
          libroLaserPrices: JSON.parse(pricingData.libroLaserPrices || '{}'),
        } as PricingConfig);
      } catch (err) {
        console.error('Error loading config:', err);
      } finally {
        setLoading(false);
      }
    };
    loadUserConfig();
  }, [setDefaultPrintType, setDefaultPaperSize, setDefaultWorkType, setDefaultCopies, setPricing]);

  // Guardar SOLO los defaults
  const saveDefaults = async () => {
    setSavingDefaults(true);
    try {
      await api.config.saveDefaults({
        defaultPrintType,
        defaultPaperSize,
        defaultWorkType,
        defaultCopies,
      });
    } catch (err) {
      console.error('Error saving defaults:', err);
    } finally {
      setSavingDefaults(false);
    }
  };

  // Guardar SOLO los precios
  const savePricing = async () => {
    setSavingPrices(true);
    try {
      await api.config.savePricing(pricing);
    } catch (err) {
      console.error('Error saving pricing:', err);
    } finally {
      setSavingPrices(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Cargando configuración...</div>
      </div>
    );
  }

  const getSectionKey = (baseKey: string) => {
    if (laserMode === 'tintas') return baseKey;
    return baseKey.replace('Prices', 'LaserPrices');
  };

  const updatePrice = (sectionKey: string, size: string, type: typeof TYPES[number], value: number) => {
    const effectiveKey = getSectionKey(sectionKey);
    const next = JSON.parse(JSON.stringify((pricing as unknown as Record<string, unknown>)[effectiveKey] || {}));
    if (!next[size]) next[size] = {};
    next[size][type] = value;
    updatePricing({ [effectiveKey]: next });
  };

  const handleLogout = () => {
    api.clearToken();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Panel de Administración</h1>
          <div className="flex gap-2">
            {(savingDefaults || savingPrices) && <span className="text-sm text-gray-500 self-center">Guardando...</span>}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Toggle Tintas / Laser */}
        <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm mb-6 w-fit">
          {(['tintas', 'laser'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setLaserMode(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                laserMode === m
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >{m === 'tintas' ? 'Tintas' : 'Laser'}</button>
          ))}
        </div>

        {/* Default Settings for New Documents */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-semibold mb-4 text-lg text-gray-800">Valores por defecto para nuevos documentos</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Tipo de impresión</label>
              <div className="flex gap-1.5">
                {(['bw', 'color', 'laser'] as const).map((pt) => (
                  <button
                    key={pt}
                    onClick={() => setDefaultPrintType(pt)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      defaultPrintType === pt
                        ? 'bg-blue-500 text-white shadow-md scale-105'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {pt === 'bw' ? 'BN' : pt === 'color' ? 'Color' : 'Laser'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Tamaño de papel</label>
              <div className="flex gap-1.5">
                {(['a4', 'a5', 'a3'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setDefaultPaperSize(sz)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      defaultPaperSize === sz
                        ? 'bg-blue-500 text-white shadow-md scale-105'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {sz.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Tipo de trabajo</label>
              <div className="flex gap-1.5">
                {(['impresion', 'copias', 'libro'] as const).map((wt) => (
                  <button
                    key={wt}
                    onClick={() => setDefaultWorkType(wt)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      defaultWorkType === wt
                        ? 'bg-blue-500 text-white shadow-md scale-105'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {wt === 'impresion' ? 'Impresión' : wt === 'copias' ? 'Copias' : 'Libro'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">Copias</label>
              <input
                type="number"
                min={1}
                value={defaultCopies}
                onChange={(e) => setDefaultCopies(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs text-center focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>
          <button
            onClick={saveDefaults}
            disabled={savingDefaults}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {savingDefaults ? '⏳ Guardando...' : '💾 Guardar Defaults'}
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-2">
          Umbrales fijos: BN 0%, C1 0-25%, C2 25-50%, C3 50-75%, C4 75-100%.
          {laserMode === 'laser' && <span className="ml-2 text-blue-500">(Editando precios Laser)</span>}
        </p>

        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-gray-500">Modifica los precios y haz clic en Guardar Precios</span>
          <button
            onClick={savePricing}
            disabled={savingPrices}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            {savingPrices ? '⏳ Guardando...' : '💾 Guardar Precios'}
          </button>
        </div>

        {SECTIONS.map(({ key, label }) => {
          const effectiveKey = getSectionKey(key);
          return (
            <div key={key} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <h3 className="font-semibold mb-4 text-lg text-gray-800">
                {label}
                {laserMode === 'laser' && <span className="text-blue-500 ml-2 text-sm font-normal">(Laser)</span>}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 text-gray-600">Categoría</th>
                      {SIZES.map((s) => (
                        <th key={s} className="text-center py-3 text-gray-600 uppercase">{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TYPES.map((t) => (
                      <tr key={t} className="border-t border-gray-100">
                        <td className="py-3 font-medium text-gray-700">{pageTypeNames[t]}</td>
                        {SIZES.map((s) => (
                          <td key={s} className="py-3 text-center">
                            <input
                              type="number"
                              step="0.05"
                              value={(pricing as unknown as Record<string, Record<string, Record<string, number>>>)[effectiveKey]?.[s]?.[t] ?? 0}
                              onChange={(e) => {
                                updatePrice(key, s, t, +e.currentTarget.value);
                              }}
                              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-center focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
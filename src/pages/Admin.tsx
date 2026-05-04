import { useState } from 'react';
import { useAppStore } from '../store/appStore';

export function Admin() {
  const pricing = useAppStore((s) => s.pricing);
  const updatePricing = useAppStore((s) => s.updatePricing);
  const [pin, setPin] = useState('');
  const [auth, setAuth] = useState(false);

  if (!auth) {
    return (
      <div className="max-w-sm mx-auto p-4 mt-8">
        <h1 className="text-xl font-bold mb-4">Admin — Ingresar PIN</h1>
        <input
          type="password"
          value={pin}
          onChange={(e) => setPin(e.currentTarget.value)}
          placeholder="PIN de 4 dígitos"
          className="w-full border rounded px-3 py-2 mb-3"
        />
        <button
          onClick={() => pin === '1234' ? setAuth(true) : alert('PIN incorrecto')}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Entrar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Panel de Administración</h1>

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
        <h3 className="font-semibold mb-3">Umbrales de color</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            Color bajo (%)
            <input
              type="number"
              value={pricing.thresholds.colorLow}
              onChange={(e) => updatePricing({ thresholds: { ...pricing.thresholds, colorLow: +e.currentTarget.value }})}
              className="w-full border rounded px-2 py-1 mt-1"
            />
          </label>
          <label className="text-sm">
            Color medio (%)
            <input
              type="number"
              value={pricing.thresholds.colorMid}
              onChange={(e) => updatePricing({ thresholds: { ...pricing.thresholds, colorMid: +e.currentTarget.value }})}
              className="w-full border rounded px-2 py-1 mt-1"
            />
          </label>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border mb-4">
        <h3 className="font-semibold mb-3">Precios (Carta - una cara)</h3>
        <div className="grid grid-cols-4 gap-3 text-sm">
          {(['bw', 'color-low', 'color-mid', 'color-high'] as const).map((type) => (
            <label>
              {type === 'bw' ? 'BN' : type === 'color-low' ? 'C1' : type === 'color-mid' ? 'C2' : 'C3'}
              <input
                type="number"
                step="0.1"
                value={pricing.prices.letter[type].single}
                onChange={(e) => {
                  const next = { ...pricing.prices };
                  next.letter[type].single = +e.currentTarget.value;
                  updatePricing({ prices: next });
                }}
                className="w-full border rounded px-2 py-1 mt-1"
              />
            </label>
          ))}
        </div>
      </div>

      <button
        onClick={() => setAuth(false)}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        Cerrar sesión
      </button>
    </div>
  );
}

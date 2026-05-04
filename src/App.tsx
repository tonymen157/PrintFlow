import { useState } from 'react'
import { Home } from './pages/Home'
import { History } from './pages/History'
import { Admin } from './pages/Admin'

type Tab = 'home' | 'history' | 'admin';

function App() {
  const [tab, setTab] = useState<Tab>('home');

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex gap-1 p-2">
          {([
            { key: 'home' as const, label: 'Inicio' },
            { key: 'history' as const, label: 'Historial' },
            { key: 'admin' as const, label: 'Admin' },
          ]).map(({ key, label }) => (
            <button
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${tab === key ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {tab === 'home' && <Home />}
      {tab === 'history' && <History />}
      {tab === 'admin' && <Admin />}
    </div>
  )
}

export default App

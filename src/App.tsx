import ErrorFallback from './ErrorFallback';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { History } from './pages/History';
import { Admin } from './pages/Admin';
import { AdminUsers } from './pages/AdminUsers';
import { Login } from './pages/Login';
import { Profile } from './pages/Profile';
import { api } from './lib/api';
import { useAppStore } from './store/appStore';

type Tab = 'home' | 'history' | 'admin';

function AppContent() {
  const [tab, setTab] = useState<Tab>('home');
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const isAuthenticated = !!api.getToken();
  const approved = useAppStore(state => state.approved);
  const userRole = useAppStore(state => state.userRole);
  const isAdmin = userRole === 'admin';
  const hasAccess = isAdmin || approved;
  const loadUserConfig = useAppStore(state => state.loadUserConfig);
  const resetStore = useAppStore(state => state.resetStore);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isLoaded) {
      loadUserConfig()
        .then(() => setIsLoaded(true))
        .catch((err) => {
          if (err.sessionExpired) {
            api.clearAllStorage();
            resetStore();
            window.location.reload();
          } else {
            setError(err);
          }
        });
    }
  }, [isAuthenticated, isLoaded, loadUserConfig, resetStore]);

  // Interceptor global: detectar 401 en cualquier fetch
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        api.clearAllStorage();
        resetStore();
        window.location.reload();
        return response;
      }
      return response;
    };
    return () => { window.fetch = originalFetch; };
  }, []);

  const handleLogout = () => {
    if (confirm('¿Cerrar sesión?')) {
      api.clearAllStorage();
      resetStore();
      window.location.reload();
    }
  };

  const closeProfile = () => setShowProfile(false);

  const openProfile = () => {
    setShowUserManagement(false);
    setShowProfile(true);
    setTab('home');
  };

  const switchToAdmin = () => {
    setShowUserManagement(false);
    setShowProfile(false);
    setTab('admin');
  };

  const switchToUsers = () => {
    setShowProfile(false);
    setShowUserManagement(true);
    setTab('admin');
  };

  if (error) {
    return (
      <div className="p-8 text-red-600">
        <h2>Error</h2>
        <p>{error.message}</p>
        <button onClick={() => { setError(null); setIsLoaded(false); }} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">Reintentar</button>
      </div>
    );
  }

  // No autenticado -> login
  if (!isAuthenticated) {
    return (
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    );
  }

  // Cargando config
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Sin acceso (pendiente de aprobación)
  if (!hasAccess) {
    return (
      <Router>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white border-b shadow-sm sticky top-0 z-10">
            <div className="max-w-4xl mx-auto flex gap-1 p-2">
              <button
                onClick={() => { setShowProfile(true); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showProfile ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Perfil
              </button>
              <button onClick={handleLogout} className="ml-auto px-3 py-1 text-sm text-gray-600 hover:text-red-600">
                Salir
              </button>
            </div>
          </nav>
          <div className="max-w-4xl mx-auto p-8 text-center">
            <h2 className="text-xl font-bold text-yellow-600 mb-2">Cuenta pendiente de aprobación</h2>
            <p className="text-gray-600">Tu cuenta está siendo revisada por el administrador.</p>
          </div>
          {showProfile && <Profile onClose={closeProfile} />}
        </div>
      </Router>
    );
  }

  // Acceso completo
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b shadow-sm sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex gap-1 p-2">
            <button
              onClick={() => { setShowProfile(false); setShowUserManagement(false); setTab('home'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'home' && !showUserManagement && !showProfile ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Inicio
            </button>
            <button
              onClick={() => { setShowProfile(false); setShowUserManagement(false); setTab('history'); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'history' && !showUserManagement && !showProfile ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Historial
            </button>
            {hasAccess && (
              <button
                onClick={switchToAdmin}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'admin' && !showUserManagement && !showProfile ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Admin
              </button>
            )}
            {isAdmin && (
              <button
                onClick={switchToUsers}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showUserManagement ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                Usuarios
              </button>
            )}
            <button
              onClick={openProfile}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${showProfile ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              Perfil
            </button>
            <button onClick={handleLogout} className="ml-auto px-3 py-1 text-sm text-gray-600 hover:text-red-600">
              Salir
            </button>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={
            showProfile ? <Profile onClose={closeProfile} /> :
            showUserManagement ? <AdminUsers /> :
            tab === 'home' ? <Home /> : tab === 'history' ? <History /> : <Admin />
          } />
          <Route path="/login" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default function App() {
  return <AppContent />;
}
import { useState } from 'react';
import { api } from '../lib/api';
import { useAppStore } from '../store/appStore';

export function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const setApproved = useAppStore(state => state.setApproved);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const result = isRegister
        ? await api.auth.register(email, password, shopName)
        : await api.auth.login(email, password);

      console.log('Login response:', result);
      if (result.error) {
        setError(result.error);
      } else if (result.message) {
        // Registration successful but needs approval
        setSuccess(result.message);
      } else {
        // Permitir login aunque no esté aprobado - el acceso a la app se controla después
        api.setToken(result.token);
        // Store user info for role check
        localStorage.setItem('userRole', result.role || 'user');
        localStorage.setItem('userId', String(result.userId));
        localStorage.setItem('userEmail', result.email || email);
        localStorage.setItem('userShopName', result.shopName || '');
        // approved viene como 1/0 del SQLite, convertir a booleano
        setApproved(result.role === 'admin' || result.approved === 1);
        // Force page reload to update auth state
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Error de conexión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-sm w-full mx-auto p-6 bg-white rounded-2xl shadow-xl">
        <h1 className="text-2xl font-bold mb-2 text-center text-gray-800">
          {isRegister ? 'Registrarse' : 'Iniciar sesión'}
        </h1>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-500 text-sm mb-4">{success}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Nombre de la tienda</label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-xl font-medium hover:bg-blue-600 transition"
          >
            {isRegister ? 'Registrarse' : 'Entrar'}
          </button>
        </form>

        <button
          onClick={() => setIsRegister(!isRegister)}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700"
        >
          {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  );
}
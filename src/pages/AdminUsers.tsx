import { useEffect, useState } from 'react';
import { api } from '../lib/api';

interface User {
  id: number;
  email: string;
  shopName: string;
  approved: number;
  role: string;
  createdAt: string;
  subscriptionStatus?: string;
  subscriptionExpiry?: string;
  subscriptionDuration?: number;
}

type DurationOption = { label: string; months: number };
const DURATIONS: DurationOption[] = [
  { label: '1 mes', months: 1 },
  { label: '3 meses', months: 3 },
  { label: '6 meses', months: 6 },
  { label: '12 meses', months: 12 },
];

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const currentUserId = Number(localStorage.getItem('userId') || '0');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.admin.getUsers();
      if (Array.isArray(data)) {
        setUsers(data);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setMessage(err instanceof Error ? err.message : 'Error loading users');
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (id: number, durationMonths: number) => {
    setProcessingId(id);
    try {
      const result = await api.admin.approveUser(id, durationMonths);
      setMessage(result.message || 'Usuario aprobado');
      loadUsers();
    } catch (err) {
      console.error('Error approving user:', err);
      setMessage(err instanceof Error ? err.message : 'Error al aprobar usuario');
    } finally {
      setProcessingId(null);
    }
  };

  const revokeAccess = async (id: number) => {
    if (!confirm('¿Cancelar suscripción de este usuario? Perderá acceso a todas las funciones.')) return;
    setRevokingId(id);
    try {
      await api.admin.revokeUser(id);
      setMessage('Suscripción cancelada, acceso revocado');
      loadUsers();
    } catch (err) {
      setMessage('Error al revocar acceso');
    } finally {
      setRevokingId(null);
    }
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getSubscriptionBadge = (user: User): JSX.Element => {
    if (!user.subscriptionStatus) return <span className="text-gray-400">-</span>;

    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      expired: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-600',
      inactive: 'bg-yellow-100 text-yellow-700',
    };

    return (
      <div className="space-y-1 text-xs">
        <span className={`px-2 py-0.5 rounded-full font-medium ${colors[user.subscriptionStatus] || 'bg-gray-100'}`}>
          {user.subscriptionStatus === 'active' ? '🟢 Activa'
            : user.subscriptionStatus === 'expired' ? '🔴 Expirada'
            : user.subscriptionStatus === 'cancelled' ? '⚫ Cancelada'
            : '🟡 Inactiva'}
        </span>
        {user.subscriptionDuration && (
          <span className="text-gray-500 block mt-0.5">{user.subscriptionDuration} mes(es)</span>
        )}
        <span className="text-gray-500 block">Vence: {formatDate(user.subscriptionExpiry)}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
        <button
          onClick={loadUsers}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          🔄 Actualizar
        </button>
      </div>

      {message && (
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
          {message}
        </div>
      )}

      {/* Resumen rápido */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-blue-600">{users.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total usuarios</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.approved === 1 || u.subscriptionStatus === 'active').length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Activos</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {users.filter(u => u.approved === 0 && u.role !== 'admin').length}
          </div>
          <div className="text-xs text-gray-500 mt-1">Pendientes</div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                <th className="text-left p-3 text-gray-600 font-medium">Email</th>
                <th className="text-left p-3 text-gray-600 font-medium">Tienda</th>
                <th className="text-left p-3 text-gray-600 font-medium">Rol</th>
                <th className="text-left p-3 text-gray-600 font-medium">Aprobado</th>
                <th className="text-left p-3 text-gray-600 font-medium">Suscripción</th>
                <th className="text-left p-3 text-gray-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users
                .filter((user) => user.id !== currentUserId)
                .map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <span className="text-gray-900">{user.email}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-medium text-gray-800">{user.shopName || 'Sin nombre'}</span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                      </span>
                    </td>
                    <td className="p-3">
                      {user.approved ? (
                        <span className="text-green-600 font-medium">✔ Aprobado</span>
                      ) : (
                        <span className="text-yellow-600 font-medium">⏳ Pendiente</span>
                      )}
                    </td>
                    <td className="p-3">
                      {getSubscriptionBadge(user)}
                    </td>
                    <td className="p-3">
                      {user.role !== 'admin' && (
                        <div className="flex gap-1 items-center">
                          {user.approved ? (
                            <button
                              onClick={() => revokeAccess(user.id)}
                              disabled={revokingId === user.id}
                              className="px-2.5 py-1 text-[11px] bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-md border border-orange-200 transition-colors font-medium disabled:opacity-50"
                            >
                              {revokingId === user.id ? '⏳ Cancelando...' : '🔕 Cancelar'}
                            </button>
                          ) : (
                            <div className="flex gap-1">
                              {DURATIONS.map((d) => (
                                <button
                                  key={d.months}
                                  onClick={() => approveUser(user.id, d.months)}
                                  disabled={processingId === user.id}
                                  title={`Aprobar por ${d.label}`}
                                  className="px-1.5 py-1 text-[11px] font-medium rounded-md transition-colors disabled:opacity-50 whitespace-nowrap
                                    ${d.months === 1
                                      ? 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                                      : d.months === 3
                                        ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                                        : d.months === 6
                                          ? 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
                                          : 'bg-orange-50 text-orange-600 hover:bg-orange-100 border border-orange-200'}"
                                >
                                  {d.label === '1 mes' && '1m'}
                                  {d.label === '3 meses' && '3m'}
                                  {d.label === '6 meses' && '6m'}
                                  {d.label === '12 meses' && '12m'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {users.filter((u) => u.id !== currentUserId).length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No hay usuarios registrados
          </div>
        )}
      </div>
    </div>
  );
}
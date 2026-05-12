const API_URL = import.meta.env.VITE_API_URL || '/api';

import type { PricingConfig } from '../pricing/types';

export function isTokenExpired(): boolean {
  const token = localStorage.getItem('authToken');
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

async function handleResponse(res: Response): Promise<any> {
  const text = await res.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    data = {};
  }

  if (!res.ok) {
    // No filtrar errores internos detallados al usuario
    if (res.status === 401) {
      const error = new Error('Sesión expirada o inválida. Inicia sesión de nuevo.');
      throw Object.assign(error, { status: 401, sessionExpired: true });
    }
    const userMessage = data.error || `Error del servidor (${res.status})`;
    const error = new Error(userMessage);
    throw Object.assign(error, { status: res.status });
  }
  return data;
}

export const api = {
  setToken: (token: string) => localStorage.setItem('authToken', token),
  getToken: () => localStorage.getItem('authToken'),
  clearToken: () => localStorage.removeItem('authToken'),
  clearAllStorage: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userShopName');
    localStorage.removeItem('printcalc-storage');
  },

  auth: {
    register: async (email: string, password: string, shopName: string) => {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, shopName }),
      });
      return handleResponse(res);
    },
    login: async (email: string, password: string) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return handleResponse(res);
    },
  },

  config: {
    getDefaults: async () => {
      const token = api.getToken();
      const res = await fetch(`${API_URL}/config/defaults`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return handleResponse(res);
    },
    saveDefaults: async (data: {
      defaultPrintType: string;
      defaultPaperSize: string;
      defaultWorkType: string;
      defaultCopies: number;
    }) => {
      const token = api.getToken();
      const res = await fetch(`${API_URL}/config/defaults`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      return handleResponse(res);
    },
    getPricing: async () => {
      const token = api.getToken();
      const res = await fetch(`${API_URL}/config/pricing`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return handleResponse(res);
    },
    savePricing: async (pricing: PricingConfig) => {
      const token = api.getToken();
      const res = await fetch(`${API_URL}/config/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pricing),
      });
      return handleResponse(res);
    },
  },

  me: async () => {
    if (isTokenExpired()) {
      const error = new Error('Sesión expirada');
      throw Object.assign(error, { status: 401, sessionExpired: true });
    }
    const token = api.getToken();
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(res);
  },
  quotes: {
    getAll: async () => {
      const token = api.getToken();
      const res = await fetch(`${API_URL}/quotes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return handleResponse(res);
    },
    getById: async (id: string) => {
      const token = api.getToken();
      const res = await fetch(`${API_URL}/quotes/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return handleResponse(res);
    },
    save: async (quote: any) => {
      const token = api.getToken();
      const res = await fetch(`${API_URL}/quotes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(quote),
      });
      return handleResponse(res);
    },
    updateStatus: async (id: string, status: string) => {
      const token = api.getToken();
      const res = await fetch(`${API_URL}/quotes/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const token = api.getToken();
      const res = await fetch(`${API_URL}/quotes/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      return handleResponse(res);
    },
  },
  admin: {
    getUsers: async () => {
      const token = api.getToken();
      const res = await fetch(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return handleResponse(res);
    },
    approveUser: async (id: number, durationMonths?: number) => {
      const token = api.getToken();
      const body: any = {};
      if (durationMonths !== undefined) body.durationMonths = durationMonths;
      const res = await fetch(`${API_URL}/admin/users/${id}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        ...(Object.keys(body).length > 0 && { body: JSON.stringify(body) })
      });
      return handleResponse(res);
    },
    rejectUser: async (id: number) => {
      const token = api.getToken();
      const res = await fetch(`${API_URL}/admin/users/${id}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      return handleResponse(res);
    },
    revokeUser: async (id: number) => {
      const token = api.getToken();
      const res = await fetch(`${API_URL}/admin/users/${id}/revoke`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      return handleResponse(res);
    },
  },
};
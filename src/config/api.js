// 1) Base de la API (usa .env si existe; si no, fallback local)
const RAW_BASE =
  process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

export const API_BASE_URL = RAW_BASE.replace(/\/$/, '');

// 2) Helpers de auth y headers
export const auth = {
  // Lee 'access_token' (backend) y, por compatibilidad, 'token'
  getToken: () =>
    localStorage.getItem('access_token') || localStorage.getItem('token'),

  headers(json = true, extra = {}) {
    const h = {};
    if (json) h['Content-Type'] = 'application/json';
    const token = auth.getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return { ...h, ...extra };
  },
};

// 3) Pequeño wrapper de fetch para GET/POST/PUT/DELETE
async function handle(res) {
  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const msg = (data && (data.message || data.error || data.msg)) || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const api = {
  get: (url, options = {}) =>
    fetch(url, { method: 'GET', headers: auth.headers(false), ...options }).then(handle),
  post: (url, body, options = {}) =>
    fetch(url, { method: 'POST', headers: auth.headers(true), body: JSON.stringify(body), ...options }).then(handle),
  put: (url, body, options = {}) =>
    fetch(url, { method: 'PUT', headers: auth.headers(true), body: JSON.stringify(body), ...options }).then(handle),
  del: (url, options = {}) =>
    fetch(url, { method: 'DELETE', headers: auth.headers(false), ...options }).then(handle),
};

// 4) Endpoints centralizados
export const endpoints = {
  auth: {
    login: `${API_BASE_URL}/auth/login`,
    refresh: `${API_BASE_URL}/auth/refresh`,
    // OJO: en tu backend, usuarios/roles NO cuelgan de /auth
    // Deja las rutas correctas abajo en "users" y "roles"
  },

  dashboard: {
    summary: `${API_BASE_URL}/dashboard/summary`,
  },

  products: {
    base: `${API_BASE_URL}/products/`,         // colección → slash final
    search: `${API_BASE_URL}/products/search`,
    posSearch: `${API_BASE_URL}/products/pos-search`,
    byId: (id) => `${API_BASE_URL}/products/${id}`,   // recurso → sin slash final
  },

  // Colecciones → slash final para evitar 308
  categories: `${API_BASE_URL}/categories/`,
  suppliers: `${API_BASE_URL}/suppliers/`,
  users: `${API_BASE_URL}/usuarios/`,
  roles: `${API_BASE_URL}/roles/`,
  clients: `${API_BASE_URL}/clientes/`,
  rates: `${API_BASE_URL}/tasas/`,
  credits: {
    base: `${API_BASE_URL}/creditos/`,
    preview: `${API_BASE_URL}/creditos/preview`,
    byClient: (id) => `${API_BASE_URL}/creditos/cliente/${id}`,
  },
  documentTypes: `${API_BASE_URL}/document_types/`,
  invoiceTypes: `${API_BASE_URL}/invoice_types/`,
  invoiceFormats: `${API_BASE_URL}/invoice_formats/`,
  paymentMethods: `${API_BASE_URL}/payment_methods/`,
  paymentConditions: `${API_BASE_URL}/payment_conditions/`,
  invoiceNumbers: `${API_BASE_URL}/invoice_numbers/`,
  invoices: `${API_BASE_URL}/invoices/`,     // ← importante

  branches: `${API_BASE_URL}/branches/`,
  cash: `${API_BASE_URL}/cash/`,

  cashRegister: {
    open: `${API_BASE_URL}/cash-register/open`,
    close: `${API_BASE_URL}/cash-register/close`,
    movements: `${API_BASE_URL}/cash-register/movements`,
    history: `${API_BASE_URL}/cash-register/history`,
    confirm: (id) => `${API_BASE_URL}/cash-register/${id}/confirm`,
  },

  payments: `${API_BASE_URL}/pagos/`,
  paymentMethods: `${API_BASE_URL}/pagos/formas_pago`,
  accounting: {
    dashboard: `${API_BASE_URL}/contabilidad/dashboard`,
    entries: `${API_BASE_URL}/contabilidad/asientos`,
    apertura: `${API_BASE_URL}/contabilidad/apertura`,
  }
};

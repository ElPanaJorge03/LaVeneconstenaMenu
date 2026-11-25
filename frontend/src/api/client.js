const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const AUTH_STORAGE_KEY = "vc_auth_v1";

let refreshInFlight = null;

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(payload) {
  if (!payload) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } else {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("vc-auth-changed", { detail: payload }));
  }
}

async function tryRefreshAccessToken() {
  const auth = getStoredAuth();
  if (!auth?.refresh) return null;

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_BASE}/api/v1/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: auth.refresh }),
    })
      .then(async (res) => {
        if (!res.ok) {
          setStoredAuth(null);
          return null;
        }
        const data = await res.json();
        const updated = {
          ...auth,
          access: data.access,
          refresh: data.refresh || auth.refresh,
        };
        setStoredAuth(updated);
        return updated.access;
      })
      .catch(() => null)
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
}

export async function apiRequest(path, options = {}, _retried = false) {
  const url = `${API_BASE}${path}`;
  const auth = getStoredAuth();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.auth !== false && auth?.access
      ? { Authorization: `Bearer ${auth.access}` }
      : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && options.auth !== false && !_retried && auth?.refresh) {
    const newAccess = await tryRefreshAccessToken();
    if (newAccess) {
      return apiRequest(path, options, true);
    }
  }

  if (!response.ok) {
    let detail = `Error ${response.status}`;
    let fieldErrors = null;
    try {
      const payload = await response.json();
      detail = payload.detail || payload.message || detail;
      if (!payload.detail && typeof payload === "object") {
        fieldErrors = payload;
      }
    } catch {
      // keep default status text
    }
    const err = new Error(detail);
    err.status = response.status;
    err.fieldErrors = fieldErrors;
    throw err;
  }

  if (response.status === 204) return null;
  return response.json();
}

export async function fetchBlobWithAuth(path, _retried = false) {
  const url = `${API_BASE}${path}`;
  const auth = getStoredAuth();
  const response = await fetch(url, {
    headers: auth?.access ? { Authorization: `Bearer ${auth.access}` } : {},
  });
  if (response.status === 401 && !_retried && auth?.refresh) {
    const newAccess = await tryRefreshAccessToken();
    if (newAccess) return fetchBlobWithAuth(path, true);
  }
  if (!response.ok) throw new Error(`Error ${response.status}`);
  return response.blob();
}

function buildProductBody(data) {
  if (data instanceof FormData) return data;
  if (data?.imagenFile instanceof File) {
    const fd = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (k === "imagenFile") {
        fd.append("imagen", v);
      } else if (v !== undefined) {
        fd.append(k, v === null ? "" : String(v));
      }
    });
    return fd;
  }
  const { imagenFile, ...clean } = data || {};
  return JSON.stringify(clean);
}

export function fetchHealth() {
  return apiRequest("/api/health/", { auth: false });
}

export function fetchPublicMenu() {
  return apiRequest("/api/v1/menu/public/", { auth: false });
}

export function fetchLocalInfo() {
  return apiRequest("/api/v1/local/info/", { auth: false });
}

export function fetchPublicMesa(mesaId) {
  return apiRequest(`/api/v1/mesas/public/${mesaId}/`, { auth: false });
}

export function createPublicOrder(payload) {
  return apiRequest("/api/v1/pedidos/public/", {
    method: "POST",
    auth: false,
    body: JSON.stringify(payload),
  });
}

export function fetchOrderTracking(codigo) {
  return apiRequest(`/api/v1/pedidos/seguimiento/${encodeURIComponent(codigo)}/`, {
    auth: false,
  });
}

export function initBoldPayment(codigo) {
  return apiRequest(`/api/v1/pagos/bold/iniciar/${encodeURIComponent(codigo)}/`, {
    method: "POST",
    auth: false,
  });
}

export function loginRequest(credentials) {
  return apiRequest("/api/v1/auth/login/", {
    method: "POST",
    auth: false,
    body: JSON.stringify(credentials),
  });
}

export function fetchMe() {
  return apiRequest("/api/v1/auth/me/");
}

export const panelOrdersApi = {
  list: () => apiRequest("/api/v1/pedidos/panel/"),
  listActiveMesas: () => apiRequest("/api/v1/mesas/activas/"),
  createManual: (payload) =>
    apiRequest("/api/v1/pedidos/panel/manual/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  changeEstado: (id, estado) =>
    apiRequest(`/api/v1/pedidos/panel/${id}/estado/`, {
      method: "POST",
      body: JSON.stringify({ estado }),
    }),
  marcarEfectivo: (id) =>
    apiRequest(`/api/v1/pedidos/panel/${id}/marcar-efectivo/`, {
      method: "POST",
    }),
};

export const adminMenuApi = {
  listCategorias: () => apiRequest("/api/v1/menu/admin/categorias/"),
  createCategoria: (data) =>
    apiRequest("/api/v1/menu/admin/categorias/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCategoria: (id, data) =>
    apiRequest(`/api/v1/menu/admin/categorias/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCategoria: (id) =>
    apiRequest(`/api/v1/menu/admin/categorias/${id}/`, {
      method: "DELETE",
    }),

  listProductos: () => apiRequest("/api/v1/menu/admin/productos/"),
  createProducto: (data) =>
    apiRequest("/api/v1/menu/admin/productos/", {
      method: "POST",
      body: buildProductBody(data),
    }),
  updateProducto: (id, data) =>
    apiRequest(`/api/v1/menu/admin/productos/${id}/`, {
      method: "PATCH",
      body: buildProductBody(data),
    }),
  deleteProducto: (id) =>
    apiRequest(`/api/v1/menu/admin/productos/${id}/`, {
      method: "DELETE",
    }),
  toggleProductoDisponible: (id) =>
    apiRequest(`/api/v1/menu/admin/productos/${id}/toggle_disponible/`, {
      method: "POST",
    }),

  listAdicionales: () => apiRequest("/api/v1/menu/admin/adicionales/"),
  createAdicional: (data) =>
    apiRequest("/api/v1/menu/admin/adicionales/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateAdicional: (id, data) =>
    apiRequest(`/api/v1/menu/admin/adicionales/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteAdicional: (id) =>
    apiRequest(`/api/v1/menu/admin/adicionales/${id}/`, {
      method: "DELETE",
    }),
  toggleAdicionalDisponible: (id) =>
    apiRequest(`/api/v1/menu/admin/adicionales/${id}/toggle_disponible/`, {
      method: "POST",
    }),
};

export const adminFullApi = {
  listMesas: () => apiRequest("/api/v1/mesas/admin/"),
  createMesa: (data) =>
    apiRequest("/api/v1/mesas/admin/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMesa: (id, data) =>
    apiRequest(`/api/v1/mesas/admin/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteMesa: (id) =>
    apiRequest(`/api/v1/mesas/admin/${id}/`, {
      method: "DELETE",
    }),
  downloadMesaQrBlob: (id) => fetchBlobWithAuth(`/api/v1/mesas/admin/${id}/qr/`),

  listUsuarios: () => apiRequest("/api/v1/auth/admin/usuarios/"),
  createUsuario: (data) =>
    apiRequest("/api/v1/auth/admin/usuarios/", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateUsuario: (id, data) =>
    apiRequest(`/api/v1/auth/admin/usuarios/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteUsuario: (id) =>
    apiRequest(`/api/v1/auth/admin/usuarios/${id}/`, {
      method: "DELETE",
    }),

  getConfigLocal: () => apiRequest("/api/v1/local/admin/config/"),
  updateConfigLocal: (data) =>
    apiRequest("/api/v1/local/admin/config/", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getVentasResumen: (rango = "hoy") =>
    apiRequest(`/api/v1/pedidos/admin/ventas/?rango=${encodeURIComponent(rango)}`),
};

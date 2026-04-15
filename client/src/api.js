const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Dashboard
  dashboard: () => request('/dashboard'),

  // Matrizes
  matrizes: {
    list: (params) => request('/matrizes' + (params ? `?${new URLSearchParams(params)}` : '')),
    get: (id) => request(`/matrizes/${id}`),
    create: (data) => request('/matrizes', { method: 'POST', body: data }),
    update: (id, data) => request(`/matrizes/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/matrizes/${id}`, { method: 'DELETE' }),
    inseminacoes: (id) => request(`/matrizes/${id}/inseminacoes`),
    bezerros: (id) => request(`/matrizes/${id}/bezerros`),
  },

  // Inseminações
  inseminacoes: {
    list: () => request('/inseminacoes'),
    get: (id) => request(`/inseminacoes/${id}`),
    create: (data) => request('/inseminacoes', { method: 'POST', body: data }),
    update: (id, data) => request(`/inseminacoes/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/inseminacoes/${id}`, { method: 'DELETE' }),
  },

  // Bezerros
  bezerros: {
    list: (params) => request('/bezerros' + (params ? `?${new URLSearchParams(params)}` : '')),
    get: (id) => request(`/bezerros/${id}`),
    create: (data) => request('/bezerros', { method: 'POST', body: data }),
    update: (id, data) => request(`/bezerros/${id}`, { method: 'PUT', body: data }),
    updateDestino: (id, data) => request(`/bezerros/${id}/destino`, { method: 'PATCH', body: data }),
    delete: (id) => request(`/bezerros/${id}`, { method: 'DELETE' }),
    pesagens: (id) => request(`/bezerros/${id}/pesagens`),
  },

  // Pesagens
  pesagens: {
    list: () => request('/pesagens'),
    create: (data) => request('/pesagens', { method: 'POST', body: data }),
    delete: (id) => request(`/pesagens/${id}`, { method: 'DELETE' }),
  },
};

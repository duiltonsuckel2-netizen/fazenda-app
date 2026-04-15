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

  // Alimentação
  alimentacao: {
    list: (params) => request('/alimentacao' + (params ? `?${new URLSearchParams(params)}` : '')),
    create: (data) => request('/alimentacao', { method: 'POST', body: data }),
    update: (id, data) => request(`/alimentacao/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/alimentacao/${id}`, { method: 'DELETE' }),
    resumo: () => request('/alimentacao/resumo'),
  },

  // Pesagens
  pesagens: {
    list: () => request('/pesagens'),
    create: (data) => request('/pesagens', { method: 'POST', body: data }),
    delete: (id) => request(`/pesagens/${id}`, { method: 'DELETE' }),
  },

  // Touros
  touros: {
    list: (params) => request('/touros' + (params ? `?${new URLSearchParams(params)}` : '')),
    get: (id) => request(`/touros/${id}`),
    create: (data) => request('/touros', { method: 'POST', body: data }),
    update: (id, data) => request(`/touros/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/touros/${id}`, { method: 'DELETE' }),
    bezerros: (id) => request(`/touros/${id}/bezerros`),
  },

  // Sanitário
  sanitario: {
    list: (params) => request('/sanitario' + (params ? `?${new URLSearchParams(params)}` : '')),
    vencimentos: () => request('/sanitario/vencimentos'),
    create: (data) => request('/sanitario', { method: 'POST', body: data }),
    update: (id, data) => request(`/sanitario/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/sanitario/${id}`, { method: 'DELETE' }),
  },

  // Piquetes
  piquetes: {
    list: () => request('/piquetes'),
    get: (id) => request(`/piquetes/${id}`),
    create: (data) => request('/piquetes', { method: 'POST', body: data }),
    update: (id, data) => request(`/piquetes/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/piquetes/${id}`, { method: 'DELETE' }),
    alocacoes: (id) => request(`/piquetes/${id}/alocacoes`),
    alocar: (id, data) => request(`/piquetes/${id}/alocacoes`, { method: 'POST', body: data }),
    desalocar: (alocId, data) => request(`/piquetes/alocacoes/${alocId}/saida`, { method: 'PATCH', body: data }),
    deleteAlocacao: (alocId) => request(`/piquetes/alocacoes/${alocId}`, { method: 'DELETE' }),
  },

  // Financeiro
  financeiro: {
    list: (params) => request('/financeiro' + (params ? `?${new URLSearchParams(params)}` : '')),
    resumo: () => request('/financeiro/resumo'),
    create: (data) => request('/financeiro', { method: 'POST', body: data }),
    update: (id, data) => request(`/financeiro/${id}`, { method: 'PUT', body: data }),
    delete: (id) => request(`/financeiro/${id}`, { method: 'DELETE' }),
  },

  // Relatórios
  relatorios: {
    geral: () => request('/relatorios'),
    crescimento: (bezerroId) => request(`/relatorios/crescimento/${bezerroId}`),
  },
};

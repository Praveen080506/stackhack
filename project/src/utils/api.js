// Lightweight API wrappers used by Messages component
// Tries backend endpoints; falls back gracefully if unavailable.

const API = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'token';

const authHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function get(path) {
  if (!API) return null;
  try {
    const res = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json', ...authHeaders() } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error('request_failed');
    return data;
  } catch (_) {
    return null;
  }
}

async function post(path, body) {
  if (!API) return null;
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error('request_failed');
    return data;
  } catch (_) {
    return null;
  }
}

async function patch(path, body) {
  if (!API) return null;
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error('request_failed');
    return data;
  } catch (_) {
    return null;
  }
}

async function uploadMultipart(path, formData) {
  if (!API) return null;
  try {
    const res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { ...authHeaders() },
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error('request_failed');
    return data;
  } catch (_) {
    return null;
  }
}

export const messagesAPI = {
  async conversations() {
    // Backend exposes /messages/conversations/list
    const data = await get('/messages/conversations/list');
    // Data shape is [{ id, name, lastMessage, img }]
    return data || { conversations: [] };
  },
  async listByConversation(conversationId, limit=200) {
    if (!conversationId) return { messages: [] };
    const items = await get(`/messages/${encodeURIComponent(conversationId)}?limit=${limit}`);
    // Backend returns an array; normalize to { messages }
    return { messages: Array.isArray(items) ? items : [] };
  },
  async sendMessage(payload) {
    // payload: { conversationId, participants: [ids], text, meta? }
    const data = await post('/messages', payload);
    return data || null;
  },
  // Not available on backend by default; keep fallbacks
  async byCode(_code) { return { messages: [] }; },
  async upload(_formData) { return { message: null }; },
};

export const notificationsAPI = {
  async list() {
    // Backend exposes /notifications/me returning array
    const items = await get('/notifications/me');
    return { notifications: Array.isArray(items) ? items : [] };
  },
  async markRead(id) {
    if (!id) return null;
    const data = await patch(`/notifications/${id}/read`, {});
    return data || {};
  },
  async create(payload) {
    // Not implemented on backend; no-op
    return null;
  },
};

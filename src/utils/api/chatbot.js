import api from './index.js';

// ============================================
// Chat Messages
// ============================================

export const sendChatMessage = async (message, sessionId = null, provider = 'chatgpt', useAiQuery = true) => {
  const response = await api.post('/api/v1/chatbot/chat', {
    message,
    session_id: sessionId,
    provider,
    use_ai_query: useAiQuery,
  });
  return response.data;
};

// ============================================
// Sessions
// ============================================

export const createSession = async (title = null) => {
  const response = await api.post('/api/v1/chatbot/sessions', { title });
  return response.data;
};

export const getSessions = async (statusFilter = null, limit = 20) => {
  const params = new URLSearchParams();
  if (statusFilter) params.append('status_filter', statusFilter);
  if (limit) params.append('limit', limit);

  const response = await api.get(`/api/v1/chatbot/sessions?${params.toString()}`);
  return response.data;
};

export const getSession = async (sessionId) => {
  const response = await api.get(`/api/v1/chatbot/sessions/${sessionId}`);
  return response.data;
};

export const updateSession = async (sessionId, data) => {
  const response = await api.put(`/api/v1/chatbot/sessions/${sessionId}`, data);
  return response.data;
};

export const archiveSession = async (sessionId) => {
  const response = await api.put(`/api/v1/chatbot/sessions/${sessionId}/archive`);
  return response.data;
};

// ============================================
// Saved Queries
// ============================================

export const saveQuery = async (intent, entities, label) => {
  const response = await api.post('/api/v1/chatbot/saved-queries', {
    intent,
    entities,
    label,
  });
  return response.data;
};

export const getSavedQueries = async () => {
  const response = await api.get('/api/v1/chatbot/saved-queries');
  return response.data;
};

export const runSavedQuery = async (queryId) => {
  const response = await api.post(`/api/v1/chatbot/saved-queries/${queryId}/run`);
  return response.data;
};

export const deleteSavedQuery = async (queryId) => {
  const response = await api.delete(`/api/v1/chatbot/saved-queries/${queryId}`);
  return response.data;
};

// ============================================
// Providers
// ============================================

export const getChatbotProviders = async () => {
  const response = await api.get('/api/v1/chatbot/providers');
  return response.data;
};

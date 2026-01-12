import api from './index.js';

export const getLeads = async (params = {}) => {
  const response = await api.get('/leads', { params });
  return response.data;
};

export const getLeadsNeedingFollowup = async (daysAhead = 7) => {
  const response = await api.get('/leads/followup', { params: { days_ahead: daysAhead } });
  return response.data;
};

export const getLeadStatistics = async (userId = null) => {
  const params = userId ? { user_id: userId } : {};
  const response = await api.get('/leads/statistics', { params });
  return response.data;
};

export const getLead = async (leadId) => {
  const response = await api.get(`/leads/${leadId}`);
  return response.data;
};

export const createLead = async (leadData) => {
  const response = await api.post('/leads', leadData);
  return response.data;
};

export const updateLead = async (leadId, leadData) => {
  const response = await api.patch(`/leads/${leadId}`, leadData);
  return response.data;
};

export const deleteLead = async (leadId) => {
  await api.delete(`/leads/${leadId}`);
};

export const recordContact = async (leadId, contactDate = null) => {
  const response = await api.post(`/leads/${leadId}/contact`, { contact_date: contactDate });
  return response.data;
};



































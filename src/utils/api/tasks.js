import api from './index.js';

export const getTasks = async (params = {}) => {
  const response = await api.get('/tasks', { params });
  return response.data;
};

export const getTodayTasks = async () => {
  const response = await api.get('/tasks/today');
  return response.data;
};

export const getWeekTasks = async () => {
  const response = await api.get('/tasks/week');
  return response.data;
};

export const getTaskStatistics = async (userId = null) => {
  const params = userId ? { user_id: userId } : {};
  const response = await api.get('/tasks/statistics', { params });
  return response.data;
};

export const getTask = async (taskId) => {
  const response = await api.get(`/tasks/${taskId}`);
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

export const updateTask = async (taskId, taskData) => {
  const response = await api.patch(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  await api.delete(`/tasks/${taskId}`);
};



































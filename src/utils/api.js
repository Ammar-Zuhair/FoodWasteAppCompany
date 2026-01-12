/**
 * API Client للاتصال بالـ Backend
 */
import { getAuthHeaders, isAuthenticated } from './api/auth.js';
import { API_CONFIG } from '../config/api.config.js';

const API_BASE_URL = API_CONFIG.baseURL;
const LLAMA_SERVICE_URL = API_CONFIG.llamaURL;

async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        const { logout } = await import('./api/auth.js');
        logout();
        // Dispatch event for App.jsx to handle logout and redirect
        window.dispatchEvent(new CustomEvent('auth:expired'));
        const error = await response.json().catch(() => ({ detail: 'Session expired. Please login again.' }));
        const authError = new Error(error.detail || 'Session expired. Please login again.');
        authError.status = 401;
        authError.isAuthError = true;
        throw authError;
      }

      const error = await response.json().catch(() => ({ detail: response.statusText }));
      const httpError = new Error(error.detail || `HTTP error! status: ${response.status}`);
      httpError.status = response.status;
      throw httpError;
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export async function checkHealth() {
  return apiRequest('/health/');
}

export const modelsAPI = {
  async list() {
    return apiRequest('/api/v1/models/list');
  },
  async getInfo(modelName) {
    return apiRequest(`/api/v1/models/${modelName}/info`);
  },
  async predict(modelName, inputData) {
    return apiRequest('/api/v1/models/predict', {
      method: 'POST',
      body: JSON.stringify({
        model_name: modelName,
        input_data: inputData,
      }),
    });
  },
};

export const llamaAPI = {
  async getStatus() {
    return apiRequest('/api/v1/llama/status');
  },
  async generate(prompt, options = {}) {
    return apiRequest('/api/v1/llama/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        max_tokens: options.maxTokens || 512,
        temperature: options.temperature || 0.7,
        language: options.language || 'ar',
      }),
    });
  },
  async chat(messages) {
    return apiRequest('/api/v1/llama/chat', {
      method: 'POST',
      body: JSON.stringify(messages),
    });
  },
};

export const dashboardAPI = {
  async overview() {
    if (!isAuthenticated()) {
      const error = new Error('Authentication required. Please login first.');
      error.status = 401;
      throw error;
    }

    return apiRequest('/api/v1/dashboard/overview', {
      headers: getAuthHeaders(),
    });
  },
  async getSection(section) {
    if (!section) {
      throw new Error('Section is required');
    }

    if (!isAuthenticated()) {
      const error = new Error('Authentication required. Please login first.');
      error.status = 401;
      throw error;
    }

    const response = await apiRequest(`/api/v1/dashboard/${section}`, {
      headers: getAuthHeaders(),
    });

    if (response && response.data) {
      return response.data;
    }
    return response;
  },
};

/**
 * Helper functions للاستخدام الشائع
 */
export const apiHelpers = {
  /**
   * تحويل بيانات food_value إلى تنسيق مناسب للعرض
   */
  formatFoodValuePrediction(prediction) {
    if (!prediction || !prediction.prediction) {
      return null;
    }

    const data = prediction.prediction;
    return {
      qualityScore: data.quality_score || 0,
      action: data.action || 'Unknown',
      safetyStatus: data.safety_status || 'Unknown',
      actionProbabilities: data.action_probabilities || {},
      inferenceTime: prediction.inference_time_ms || 0,
    };
  },

  /**
   * تحويل بيانات LLaMA إلى تنسيق مناسب
   */
  formatLLaMAResponse(response) {
    return {
      text: response.response || '',
      tokensGenerated: response.tokens_generated || 0,
      model: response.model || 'llama-7b',
      generationTime: response.generation_time_ms || 0,
    };
  },
};

export default {
  checkHealth,
  modelsAPI,
  llamaAPI,
  dashboardAPI,
  apiHelpers,
};

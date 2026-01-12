/**
 * Centralized API exports
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders, logout } from './auth.js';

/**
 * Handle 401 Unauthorized errors
 */
let isHandlingUnauthorized = false;

/**
 * Handle 401 Unauthorized errors
 * Debounced to prevent multiple redirects/events when multiple requests fail simultaneously
 */
function handleUnauthorized() {
  if (isHandlingUnauthorized) return;
  isHandlingUnauthorized = true;

  // Clear auth data
  logout();

  // Dispatch event to notify app of auth expiration
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth:expired'));

    // Redirect to login page
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }

    // Reset flag after a delay to allow future logins
    setTimeout(() => {
      isHandlingUnauthorized = false;
    }, 1000);
  }
}

/**
 * API Client - axios-like interface using fetch
 */
const api = {
  async request(endpoint, options = {}) {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    };

    if (options.data) {
      config.body = JSON.stringify(options.data);
    }

    if (options.params) {
      const params = new URLSearchParams(options.params);
      const separator = url.includes('?') ? '&' : '?';
      const fullUrl = `${url}${separator}${params.toString()}`;
      const response = await fetch(fullUrl, config);
      if (!response.ok) {
        // Handle 401 Unauthorized
        if (response.status === 401) {
          handleUnauthorized();
        }
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `HTTP error! status: ${response.status}`);
      }
      return { data: await response.json() };
    }

    const response = await fetch(url, config);
    if (!response.ok) {
      // Handle 401 Unauthorized
      if (response.status === 401) {
        handleUnauthorized();
      }
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }
    return { data: await response.json() };
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  post(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', data });
  },

  put(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', data });
  },

  patch(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', data });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },
};

export default api;

export * from './auth.js';
export * from './drivers.js';
export * from './waste.js';
export * from './forecast.js';
export * from './shipments.js';
export * from './dashboard.js';
export * from './alerts.js';
export * from './facilities.js';
export * from './inventory.js';
export * from './planning.js';
export * from './returns.js';
export * from './reports.js';
export * from './charity.js';
export * from './users.js';
export * from './quality.js';
export * from './orders.js';
export * from './tasks.js';
export * from './leads.js';
export * from './chatbot.js';
export * from './heatmaps.js';
export * from './rfid.js';


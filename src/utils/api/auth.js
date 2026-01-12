/**
 * Authentication API Service
 */
import { API_CONFIG, findWorkingIP, POSSIBLE_IPS } from '../../config/api.config.js';

// Check if running in native app (Capacitor)
const isNative = () => {
  return typeof window !== 'undefined' &&
    window.Capacitor !== undefined &&
    typeof window.Capacitor.isNativePlatform === 'function' &&
    window.Capacitor.isNativePlatform();
};

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/auth`;

/**
 * Login user
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Promise<Object>} Login response with token and user info
 */
export async function login(username, password) {
  const isNativeApp = isNative();
  let lastError = null;

  if (isNativeApp) {
    // Try auto-discovery for native app
    try {
      const { autoDiscoverIP } = await import('../../utils/networkIPDiscovery.js');
      await autoDiscoverIP();
      const { refreshAPIConfig } = await import('../../config/api.config.js');
      refreshAPIConfig();
    } catch (e) {
      console.warn('[Auth API] Auto-discovery failed, using current IP');
    }

    try {
      return await attemptLogin(`${API_CONFIG.baseURL}/api/v1/auth/login`, username, password);
    } catch (error) {
      lastError = error;
      console.warn('[Auth API] Failed with current IP, trying to find working IP...');

      const workingIP = await findWorkingIP();
      if (workingIP) {
        const newBaseURL = `http://${workingIP}:8000`;
        const { updateCurrentIP, refreshAPIConfig } = await import('../../config/api.config.js');
        updateCurrentIP(workingIP);
        refreshAPIConfig();

        try {
          return await attemptLogin(`${newBaseURL}/api/v1/auth/login`, username, password);
        } catch (retryError) {
          lastError = retryError;
        }
      }
    }
  } else {
    return await attemptLogin(`${BASE_URL}/login`, username, password);
  }

  if (lastError) {
    if (lastError.message.includes('401') || lastError.message.includes('Unauthorized')) {
      throw lastError;
    }
    const currentIP = API_CONFIG.baseURL.replace('http://', '').replace(':8000', '');
    throw new Error(`لا يمكن الاتصال بالخادم. تأكد من أن Backend يعمل على http://${currentIP}:8000`);
  }

  throw lastError || new Error('فشل تسجيل الدخول');
}

async function attemptLogin(url, username, password) {
  console.log(`[Auth API] Attempting login to: ${url}`);

  const healthUrl = url.replace('/api/v1/auth/login', '/health/');
  try {
    const healthCheck = await fetch(healthUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    if (!healthCheck.ok) {
      throw new Error(`Backend health check failed: ${healthCheck.status}`);
    }
  } catch (healthError) {
    console.error(`[Auth API] Backend health check failed:`, healthError);
    throw new Error(`لا يمكن الاتصال بالخادم`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = { detail: `HTTP ${response.status}` };
      }
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.warn('Error storing auth data:', e);
    }

    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('انتهت مهلة الاتصال');
    }
    throw error;
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
  const token = getToken();
  if (!token) throw new Error('No token found');

  const response = await fetch(`${BASE_URL}/me`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      window.dispatchEvent(new CustomEvent('auth:expired'));
      throw new Error('Session expired');
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * Logout user
 */
export function logout() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  } catch (e) {
    console.warn('Error during logout:', e);
  }
}

/**
 * Get stored token
 */
export function getToken() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('access_token');
    }
  } catch (e) {
    console.warn('localStorage not available:', e);
  }
  return null;
}

/**
 * Get stored user
 */
export function getStoredUser() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  } catch (e) {
    console.warn('localStorage not available:', e);
  }
  return null;
}

/**
 * Check if token is expired
 */
export function isTokenExpired() {
  const token = getToken();
  if (!token) return true;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const payload = JSON.parse(jsonPayload);
    return payload.exp * 1000 < Date.now();
  } catch (e) {
    return true;
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  if (isTokenExpired()) {
    console.warn('Token is expired locally');
    return false;
  }
  return true;
}

/**
 * Get authorization headers
 */
export function getAuthHeaders() {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

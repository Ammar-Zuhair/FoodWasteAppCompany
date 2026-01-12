/**
 * Alerts API Service - خدمة التنبيهات
 * Enhanced with bilingual support and new filters
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders, isAuthenticated } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/alerts`;

/**
 * Get current language from localStorage
 */
function getCurrentLang() {
  return localStorage.getItem('language') || 'en';
}

/**
 * Get alerts list with enhanced filtering
 * @param {Object} filters - Filter options
 * @param {string} filters.status - Alert status (open, acknowledged, resolved, dismissed)
 * @param {string} filters.severity - Alert severity (low, medium, high, critical)
 * @param {string} filters.entity_type - Entity type (truck, company_warehouse, etc.)
 * @param {string} filters.violation_type - Violation type code
 * @param {number} filters.limit - Limit number of results
 * @param {number} filters.offset - Offset for pagination
 * @returns {Promise<Object>}
 */
export async function getAlerts(filters = {}) {
  if (!isAuthenticated()) {
    return { alerts: [], total: 0 };
  }

  try {
    const params = new URLSearchParams();
    params.append('lang', getCurrentLang());

    if (filters.status) params.append('status', filters.status);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.entity_type) params.append('entity_type', filters.entity_type);
    if (filters.violation_type) params.append('violation_type', filters.violation_type);
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());

    const url = `${BASE_URL}?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { alerts: [], total: 0 };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return { alerts: [], total: 0 };
  }
}

/**
 * Get alert details
 * @param {string} alertId - Alert ID
 * @returns {Promise<Object>}
 */
export async function getAlert(alertId) {
  try {
    const params = new URLSearchParams();
    params.append('lang', getCurrentLang());

    const response = await fetch(`${BASE_URL}/${alertId}?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching alert:', error);
    throw error;
  }
}

/**
 * Get alert lookups for filtering
 * @returns {Promise<Object>}
 */
export async function getAlertLookups() {
  if (!isAuthenticated()) {
    return { violation_types: [], alert_statuses: [], severities: [], entity_types: [] };
  }

  try {
    const params = new URLSearchParams();
    params.append('lang', getCurrentLang());

    const response = await fetch(`${BASE_URL}/lookups?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { violation_types: [], alert_statuses: [], severities: [], entity_types: [] };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching alert lookups:', error);
    return { violation_types: [], alert_statuses: [], severities: [], entity_types: [] };
  }
}

/**
 * Acknowledge an alert
 * @param {string} alertId - Alert ID
 * @returns {Promise<Object>}
 */
export async function acknowledgeAlert(alertId) {
  try {
    const response = await fetch(`${BASE_URL}/${alertId}/acknowledge`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    throw error;
  }
}

/**
 * Resolve an alert
 * @param {string} alertId - Alert ID
 * @param {string} notes - Resolution notes
 * @returns {Promise<Object>}
 */
export async function resolveAlert(alertId, notes = null) {
  try {
    const response = await fetch(`${BASE_URL}/${alertId}/resolve`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }
}

/**
 * Get alert statistics
 * @returns {Promise<Object>}
 */
export async function getAlertStats() {
  if (!isAuthenticated()) {
    return { total: 0, by_severity: {}, by_entity_type: {}, by_status: {} };
  }

  try {
    const params = new URLSearchParams();
    params.append('lang', getCurrentLang());

    const response = await fetch(`${BASE_URL}/stats?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return { total: 0, by_severity: {}, by_entity_type: {}, by_status: {} };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    return { total: 0, by_severity: {}, by_entity_type: {}, by_status: {} };
  }
}

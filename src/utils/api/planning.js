/**
 * Planning API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/planning`;

/**
 * Get production orders
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getProductionOrders(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const url = `${BASE_URL}/orders${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching production orders:', error);
    throw error;
  }
}

/**
 * Get demand forecasts
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getDemandForecasts(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.product_id) params.append('product_id', filters.product_id);
    if (filters.period_start) params.append('period_start', filters.period_start);
    if (filters.period_end) params.append('period_end', filters.period_end);

    const url = `${BASE_URL}/forecasts${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching demand forecasts:', error);
    throw error;
  }
}

/**
 * Get AI production suggestions
 * @param {Object} params - Parameters
 * @returns {Promise<Object>}
 */
export async function getProductionSuggestions(params = {}) {
  try {
    const headers = getAuthHeaders();
    headers['Content-Type'] = 'application/json';

    const response = await fetch(`${API_CONFIG.baseURL}/api/v1/ai/forecast/suggest-production`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting production suggestions:', error);
    throw error;
  }
}


/**
 * Get recommendation statistics
 * @param {Object} params - Parameters (e.g., target_date)
 * @returns {Promise<Object>}
 */
export async function getRecommendationStats(params = {}) {
  try {
    const searchParams = new URLSearchParams();
    if (params.target_date) searchParams.append('target_date', params.target_date);

    const url = `${API_CONFIG.baseURL}/api/production/recommendations/stats${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching recommendation stats:', error);
    throw error;
  }
}

/**
 * Generate new AI recommendations
 * @returns {Promise<Object>}
 */
export async function generateAIRecommendations() {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/production/recommendations/generate-ai`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating AI recommendations:', error);
    throw error;
  }
}

/**
 * Get AI recommendations
 * @param {Object} filters - Filter options (category, priority)
 * @returns {Promise<Array>}
 */
export async function getAIRecommendations(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.limit) params.append('limit', filters.limit);

    const url = `${API_CONFIG.baseURL}/api/production/recommendations/ai${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching AI recommendations:', error);
    throw error;
  }
}

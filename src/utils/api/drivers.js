/**
 * Drivers API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/drivers`;

/**
 * Get current driver information
 * @returns {Promise<Object>}
 */
export async function getCurrentDriver() {
  try {
    const headers = getAuthHeaders();
    const response = await fetch(`${BASE_URL}/me`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting current driver:', error);
    throw error;
  }
}




/**
 * Get list of drivers
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getDrivers(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);

    const url = `${BASE_URL}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.drivers || [];
  } catch (error) {
    console.error('Error fetching drivers:', error);
    throw error;
  }
}

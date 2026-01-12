/**
 * Inventory API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/inventory`;

/**
 * Get inventory positions
 * @param {Object} filters - Filter options
 * @param {string} filters.facility_id - Facility ID
 * @param {string} filters.product_id - Product ID
 * @returns {Promise<Object>}
 */
export async function getInventoryPositions(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.product_id) params.append('product_id', filters.product_id);

    const url = `${BASE_URL}/positions${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching inventory positions:', error);
    throw error;
  }
}

/**
 * Get batches
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getBatches(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.product_id) params.append('product_id', filters.product_id);
    if (filters.status) params.append('status', filters.status);

    const url = `${BASE_URL}/batches${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching batches:', error);
    throw error;
  }
}

/**
 * Get expiring batches
 * @param {number} days - Number of days ahead to check
 * @returns {Promise<Object>}
 */
export async function getExpiringBatches(days = 30) {
  try {
    const response = await fetch(`${BASE_URL}/expiring?days=${days}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching expiring batches:', error);
    throw error;
  }
}

/**
 * Create inventory transfer
 * @param {Object} transferData - Transfer data
 * @returns {Promise<Object>}
 */
export async function createTransfer(transferData) {
  try {
    const response = await fetch(`${BASE_URL}/transfers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transferData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating transfer:', error);
    throw error;
  }
}



/**
 * Production API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/production`;

export async function getProductionBatches(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.date) params.append('date_filter', filters.date); // Filter by date
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const url = `${BASE_URL}/batches${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : (data.batches || []);
  } catch (error) {
    console.error('Error fetching production batches:', error);
    throw error;
  }
}

export async function getProductionStats(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);

    const url = `${BASE_URL}/stats${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching production stats:', error);
    throw error;
  }
}

export async function recordProductionWaste(wasteData) {
  try {
    const response = await fetch(`${BASE_URL}/waste`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(wasteData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error recording production waste:', error);
    throw error;
  }
}

export async function getProductionLines(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.status) params.append('status', filters.status);

    const url = `${API_CONFIG.baseURL}/api/production/lines${params.toString() ? '?' + params.toString() : ''}`;
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
    console.error('Error fetching production lines:', error);
    throw error;
  }
}

export async function getProductionOrders(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.status_id) params.append('status_id', filters.status_id);
    if (filters.limit) params.append('limit', filters.limit);

    const url = `${API_CONFIG.baseURL}/api/production/orders${params.toString() ? '?' + params.toString() : ''}`;
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
    console.error('Error fetching production orders:', error);
    throw error;
  }
}


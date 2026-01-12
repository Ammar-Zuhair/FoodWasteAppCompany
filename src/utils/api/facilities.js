/**
 * Facilities API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/facilities`;

export async function getFacilities(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.facility_type) params.append('facility_type', filters.facility_type);
    if (filters.status) params.append('status', filters.status);

    const url = `${BASE_URL}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.facilities || [];
  } catch (error) {
    console.error('Error fetching facilities:', error);
    throw error;
  }
}

export async function getFacility(facilityId) {
  try {
    const response = await fetch(`${BASE_URL}/${facilityId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching facility:', error);
    throw error;
  }
}

export async function createFacility(facilityData) {
  try {
    const response = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(facilityData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating facility:', error);
    throw error;
  }
}

export async function updateFacility(facilityId, facilityData) {
  try {
    const response = await fetch(`${BASE_URL}/${facilityId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(facilityData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating facility:', error);
    throw error;
  }
}

export async function deleteFacility(facilityId) {
  try {
    const response = await fetch(`${BASE_URL}/${facilityId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting facility:', error);
    throw error;
  }
}

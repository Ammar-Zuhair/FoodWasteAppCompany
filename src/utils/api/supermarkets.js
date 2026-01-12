/**
 * Supermarkets API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/merchants`;

export async function getSupermarkets(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
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
    return data.merchants || [];
  } catch (error) {
    console.error('Error fetching supermarkets:', error);
    throw error;
  }
}

export async function getSupermarket(supermarketId) {
  try {
    const response = await fetch(`${BASE_URL}/${supermarketId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching supermarket:', error);
    throw error;
  }
}

export async function createSupermarket(supermarketData) {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(supermarketData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating supermarket:', error);
    throw error;
  }
}

export async function updateSupermarket(supermarketId, supermarketData) {
  try {
    const response = await fetch(`${BASE_URL}/${supermarketId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(supermarketData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating supermarket:', error);
    throw error;
  }
}

export async function deleteSupermarket(supermarketId) {
  try {
    const response = await fetch(`${BASE_URL}/${supermarketId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting supermarket:', error);
    throw error;
  }
}
























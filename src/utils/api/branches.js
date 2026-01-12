/**
 * Branches API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/branches`;

export async function getBranches(filters = {}) {
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
    return data.branches || [];
  } catch (error) {
    console.error('Error fetching branches:', error);
    throw error;
  }
}

export async function getBranch(branchId) {
  try {
    const response = await fetch(`${BASE_URL}/${branchId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching branch:', error);
    throw error;
  }
}

export async function createBranch(branchData) {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(branchData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating branch:', error);
    throw error;
  }
}

export async function updateBranch(branchId, branchData) {
  try {
    const response = await fetch(`${BASE_URL}/${branchId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(branchData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating branch:', error);
    throw error;
  }
}

export async function deleteBranch(branchId) {
  try {
    const response = await fetch(`${BASE_URL}/${branchId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting branch:', error);
    throw error;
  }
}
























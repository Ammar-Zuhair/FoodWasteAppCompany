/**
 * Charity API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/charity`;

/**
 * Get charity donations list
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getDonations(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const url = `${BASE_URL}${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching donations:', error);
    throw error;
  }
}

/**
 * Get a single donation by ID
 * @param {string} donationId - Donation ID
 * @returns {Promise<Object>}
 */
export async function getDonation(donationId) {
  try {
    const response = await fetch(`${BASE_URL}/${donationId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching donation:', error);
    throw error;
  }
}

/**
 * Create a charity donation
 * @param {Object} donationData - Donation data
 * @returns {Promise<Object>}
 */
export async function createDonation(donationData) {
  try {
    const response = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(donationData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating donation:', error);
    throw error;
  }
}

/**
 * Update a charity donation
 * @param {string} donationId - Donation ID
 * @param {Object} donationData - Updated donation data
 * @returns {Promise<Object>}
 */
export async function updateDonation(donationId, donationData) {
  try {
    const response = await fetch(`${BASE_URL}/${donationId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(donationData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating donation:', error);
    throw error;
  }
}

/**
 * Delete a charity donation
 * @param {string} donationId - Donation ID
 * @returns {Promise<Object>}
 */
export async function deleteDonation(donationId) {
  try {
    const response = await fetch(`${BASE_URL}/${donationId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error deleting donation:', error);
    throw error;
  }
}

/**
 * Get donation statistics
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getDonationStats(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);

    const url = `${BASE_URL}/stats/summary${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching donation stats:', error);
    throw error;
  }
}












/**
 * Get list of charities
 * @param {Object} filters
 * @returns {Promise<Array>}
 */
export async function getCharities(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);

    const url = `${BASE_URL}/charities${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching charities:', error);
    throw error;
  }
}

/**
 * Get potential donation suggestions
 * @param {string} organizationId 
 * @param {string} charityId 
 * @returns {Promise<Array>}
 */
export async function getPotentialDonations(organizationId, charityId = null) {
  try {
    const params = new URLSearchParams({ organization_id: organizationId });
    if (charityId) params.append('charity_id', charityId);

    const url = `${BASE_URL}/potential-donations?${params.toString()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching potential donations:', error);
    throw error;
  }
}

/**
 * Create a new charity
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export async function createCharity(data) {
  try {
    const response = await fetch(`${BASE_URL}/charities`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || `HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating charity:', error);
    throw error;
  }
}

/**
 * Update a charity
 * @param {number} id 
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export async function updateCharity(id, data) {
  try {
    const response = await fetch(`${BASE_URL}/charities/${id}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error updating charity:', error);
    throw error;
  }
}

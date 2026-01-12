/**
 * Organizations API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/organizations`;

/**
 * Get organizations list
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getOrganizations(filters = {}) {
    try {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
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

        const data = await response.json();
        return data.organizations || [];
    } catch (error) {
        console.error('Error fetching organizations:', error);
        throw error;
    }
}

/**
 * Data API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1`;

export const getGovernorates = async () => {
    try {
        const response = await fetch(`${BASE_URL}/data/governorates`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching governorates:', error);
        throw error;
    }
};

export const getDataFacilities = async (orgId) => {
    try {
        const url = orgId ? `${BASE_URL}/data/facilities?org_id=${orgId}` : `${BASE_URL}/data/facilities`;
        const response = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching facilities:', error);
        throw error;
    }
};

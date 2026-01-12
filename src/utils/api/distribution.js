/**
 * Distribution API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/distribution`;

export async function distributeOrder(orderId, distributionMode = 'auto') {
  try {
    const response = await fetch(`${BASE_URL}/order/${orderId}/distribute?distribution_mode=${distributionMode}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error distributing order:', error);
    throw error;
  }
}

export async function optimizeDistributionRoute(orderIds, sourceFacilityId = null) {
  try {
    const queryParams = sourceFacilityId ? `?source_facility_id=${sourceFacilityId}` : '';
    const response = await fetch(`${BASE_URL}/route/optimize${queryParams}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderIds),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error optimizing route:', error);
    throw error;
  }
}










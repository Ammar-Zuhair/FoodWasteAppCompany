/**
 * Demand Forecasting API Service
 */
import { API_CONFIG } from '../../config/api.config.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/ai/forecast`;

/**
 * Predict demand for a product
 * @param {Object} params - Prediction parameters
 * @param {string} params.productId - Product ID
 * @param {string} params.facilityId - Optional facility ID
 * @param {number} params.daysAhead - Days to predict ahead (default: 30)
 * @param {string} params.organizationId - Optional organization ID
 * @returns {Promise<Object>}
 */
export async function predictDemand({ productId, facilityId = null, daysAhead = 30, organizationId = null }) {
  try {
    const response = await fetch(`${BASE_URL}/demand`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        facility_id: facilityId,
        days_ahead: daysAhead,
        organization_id: organizationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error predicting demand:', error);
    throw error;
  }
}

/**
 * Suggest production quantity based on demand forecast
 * @param {Object} params - Suggestion parameters
 * @param {string} params.productId - Product ID
 * @param {string} params.facilityId - Optional facility ID
 * @param {number} params.daysAhead - Days to predict ahead (default: 30)
 * @returns {Promise<Object>}
 */
export async function suggestProduction({ productId, facilityId = null, daysAhead = 30 }) {
  try {
    const response = await fetch(`${BASE_URL}/suggest-production`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        facility_id: facilityId,
        days_ahead: daysAhead,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error suggesting production:', error);
    throw error;
  }
}

/**
 * Get forecasts for an organization
 * @param {string} organizationId - Organization ID
 * @param {string} productId - Optional product ID filter
 * @param {string} facilityId - Optional facility ID filter
 * @returns {Promise<Object>}
 */
export async function getForecasts(organizationId, productId = null, facilityId = null) {
  try {
    let url = `${BASE_URL}/forecasts?organization_id=${organizationId}`;
    
    if (productId) {
      url += `&product_id=${productId}`;
    }
    if (facilityId) {
      url += `&facility_id=${facilityId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching forecasts:', error);
    throw error;
  }
}

/**
 * Manually trigger update of all forecasts
 * @param {string} organizationId - Optional organization ID
 * @returns {Promise<Object>}
 */
export async function updateAllForecasts(organizationId = null) {
  try {
    const response = await fetch(`${BASE_URL}/update-all`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        organization_id: organizationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating forecasts:', error);
    throw error;
  }
}






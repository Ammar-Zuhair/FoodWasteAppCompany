/**
 * Dashboard API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders, isAuthenticated } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/dashboard`;

/**
 * Get dashboard overview
 * @returns {Promise<Object>}
 */
export async function getDashboardOverview() {
  if (!isAuthenticated()) {
    return {};
  }
  
  try {
    const response = await fetch(`${BASE_URL}/overview`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {};
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard overview:', error);
    return {};
  }
}

/**
 * Get dashboard KPIs
 * @returns {Promise<Object>}
 */
export async function getDashboardKPIs() {
  if (!isAuthenticated()) {
    return {};
  }
  
  try {
    const response = await fetch(`${BASE_URL}/kpis`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {};
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error);
    return {};
  }
}

/**
 * Get dashboard section data
 * @param {string} section - Section name
 * @returns {Promise<Object>}
 */
export async function getDashboardSection(section) {
  console.log(`[Dashboard API] ===== Getting section "${section}" =====`);
  const isAuth = isAuthenticated();
  console.log(`[Dashboard API] isAuthenticated(): ${isAuth}`);
  if (!isAuth) {
    console.warn(`[Dashboard API] Not authenticated, returning empty object`);
    return {
      digitalTwinLocations: [],
      trackedBatches: [],
      earlyWarnings: []
    };
  }
  
  try {
    const url = `${BASE_URL}/${section}`;
    console.log(`[Dashboard API] Fetching from: ${url}`);
    const headers = getAuthHeaders();
    console.log(`[Dashboard API] Headers:`, headers);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: headers,
    });

    console.log(`[Dashboard API] Response status: ${response.status}`);
    if (!response.ok) {
      if (response.status === 401) {
        console.warn(`[Dashboard API] Unauthorized (401), returning empty object`);
        return {};
      }
      const errorText = await response.text();
      console.error(`[Dashboard API] HTTP error! status: ${response.status}, body: ${errorText}`);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`[Dashboard API] Section "${section}" response:`, JSON.stringify(result, null, 2));
    console.log(`[Dashboard API] Response keys:`, Object.keys(result));
    console.log(`[Dashboard API] Has 'data' key:`, 'data' in result);
    console.log(`[Dashboard API] Has 'section' key:`, 'section' in result);
    
    // Handle both formats: {section: "ai", data: {...}} and {data: {...}} or direct data
    if (result.data) {
      console.log(`[Dashboard API] Returning data:`, JSON.stringify(result.data, null, 2));
      console.log(`[Dashboard API] Data keys:`, Object.keys(result.data));
      if (result.data.digitalTwinLocations) {
        console.log(`[Dashboard API] digitalTwinLocations length:`, result.data.digitalTwinLocations.length);
      }
      return result.data;
    } else if (result.section && result.data) {
      console.log(`[Dashboard API] Returning data from section:`, JSON.stringify(result.data, null, 2));
      return result.data;
    }
    console.log(`[Dashboard API] Returning full result:`, JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error(`[Dashboard API] Error fetching dashboard section "${section}":`, error);
    console.error(`[Dashboard API] Error details:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    // Return empty object instead of throwing to prevent UI crashes
    return {
      digitalTwinLocations: [],
      trackedBatches: [],
      earlyWarnings: []
    };
  }
}

// Export as object for backward compatibility
export const dashboardAPI = {
  getOverview: getDashboardOverview,
  getKPIs: getDashboardKPIs,
  getSection: getDashboardSection,
};



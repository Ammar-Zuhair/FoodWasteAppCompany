/**
 * Waste Management API Service
 */
import { API_CONFIG } from '../../config/api.config.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/waste`;

/**
 * Get batches at risk of expiring
 * @param {number} days - Number of days to check ahead (default: 30)
 * @returns {Promise<Object>}
 */
export async function getAtRiskBatches(days = 30) {
  try {
    const response = await fetch(`${BASE_URL}/at-risk-batches?days=${days}`, {
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
    console.error('Error fetching at-risk batches:', error);
    throw error;
  }
}

/**
 * Update risk scores for batches
 * @param {string[]} batchIds - Optional array of batch IDs to update (null = all)
 * @returns {Promise<Object>}
 */
export async function updateRiskScores(batchIds = null) {
  try {
    const response = await fetch(`${BASE_URL}/update-risk-scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        batch_ids: batchIds,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating risk scores:', error);
    throw error;
  }
}

/**
 * Get AI-powered action suggestions for a batch
 * @param {string} batchId - Batch ID
 * @returns {Promise<Object>}
 */
export async function suggestActions(batchId) {
  try {
    const response = await fetch(`${BASE_URL}/batches/${batchId}/suggest-actions`, {
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
    console.error('Error getting action suggestions:', error);
    throw error;
  }
}

/**
 * Get waste statistics
 * @param {string} organizationId - Organization ID
 * @param {Date} startDate - Optional start date
 * @param {Date} endDate - Optional end date
 * @returns {Promise<Object>}
 */
export async function getWasteStatistics(organizationId, startDate = null, endDate = null) {
  try {
    let url = `${BASE_URL}/statistics?organization_id=${organizationId}`;

    if (startDate) {
      url += `&start_date=${startDate.toISOString()}`;
    }
    if (endDate) {
      url += `&end_date=${endDate.toISOString()}`;
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
    console.error('Error fetching waste statistics:', error);
    throw error;
  }
}


/**
 * Get wasted batches (WasteEvents) with full details
 * @param {Object} options - Query options
 * @returns {Promise<Object>}
 */
export async function getWastedBatches(options = {}) {
  try {
    const params = new URLSearchParams();
    if (options.days) params.append('days', options.days);
    if (options.limit) params.append('limit', options.limit);

    const url = `${BASE_URL}/wasted-batches${params.toString() ? '?' + params.toString() : ''}`;
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
    console.error('Error fetching wasted batches:', error);
    throw error;
  }
}


/**
 * Get batch journey through the supply chain
 * @param {string} batchId - Batch ID
 * @returns {Promise<Object>}
 */
export async function getBatchJourney(batchId) {
  try {
    const response = await fetch(`${BASE_URL}/batches/${batchId}/journey`, {
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
    console.error('Error fetching batch journey:', error);
    throw error;
  }
}


/**
 * Get comprehensive waste analysis
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getWasteAnalysis(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.days) params.append('days', filters.days);

    const url = `${BASE_URL}/analysis${params.toString() ? '?' + params.toString() : ''}`;
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
    console.error('Error fetching waste analysis:', error);
    throw error;
  }
}


/**
 * Generate AI waste recommendations
 * @returns {Promise<Object>}
 */
export async function generateWasteRecommendations() {
  try {
    const response = await fetch(`${BASE_URL}/recommendations/generate-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.recommendations || [];
  } catch (error) {
    console.error('Error generating waste recommendations:', error);
    throw error;
  }
}


/**
 * Get existing waste AI recommendations
 * @param {Object} filters - Filter options (limit, priority)
 * @returns {Promise<Array>}
 */
export async function getWasteRecommendations(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.priority) params.append('priority', filters.priority);

    const url = `${BASE_URL}/recommendations/ai${params.toString() ? '?' + params.toString() : ''}`;
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
    console.error('Error fetching waste recommendations:', error);
    throw error;
  }
}


/**
 * Orders API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/orders`;

/**
 * Get orders list
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getOrders(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.branch_id) params.append('branch_id', filters.branch_id);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
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
    console.error('Error fetching orders:', error);
    throw error;
  }
}

/**
 * Get a single order by ID
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>}
 */
export async function getOrder(orderId) {
  try {
    const response = await fetch(`${BASE_URL}/${orderId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching order:', error);
    throw error;
  }
}

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>}
 */
export async function createOrder(orderData) {
  try {
    const response = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

/**
 * Update an order
 * @param {string} orderId - Order ID
 * @param {Object} orderData - Updated order data
 * @returns {Promise<Object>}
 */
export async function updateOrder(orderId, orderData) {
  try {
    const response = await fetch(`${BASE_URL}/${orderId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

/**
 * Distribute an order using smart distribution
 * @param {string} orderId - Order ID
 * @param {string} distributionMode - Distribution mode (auto, direct, aggregated)
 * @returns {Promise<Object>}
 */
export async function distributeOrder(orderId, distributionMode = 'auto') {
  try {
    const response = await fetch(`${BASE_URL}/${orderId}/distribute?distribution_mode=${distributionMode}`, {
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

/**
 * Get order statistics
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getOrderStats(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

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
    console.error('Error fetching order stats:', error);
    throw error;
  }
}

/**
 * Allocate batches for an order using FEFO
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>}
 */
export async function allocateBatches(orderId) {
  try {
    const response = await fetch(`${BASE_URL}/${orderId}/allocate-batches`, {
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
    console.error('Error allocating batches:', error);
    throw error;
  }
}

/**
 * Get waste reduction statistics for orders
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getWasteReductionStats(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);

    const url = `${BASE_URL}/stats/waste-reduction${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching waste reduction stats:', error);
    throw error;
  }
}

/**
 * Get batch allocations for an order
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>}
 */
export async function getOrderBatchAllocations(orderId) {
  try {
    const response = await fetch(`${BASE_URL}/${orderId}/batch-allocations`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching batch allocations:', error);
    throw error;
  }
}


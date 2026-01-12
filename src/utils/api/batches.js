/**
 * Batches API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/batches`;

export async function getBatches(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.product_id) params.append('product_id', filters.product_id);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.status) params.append('status', filters.status);
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
    return Array.isArray(data) ? data : (data.batches || []);
  } catch (error) {
    console.error('Error fetching batches:', error);
    throw error;
  }
}

export async function getBatch(batchId) {
  try {
    const response = await fetch(`${BASE_URL}/${batchId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching batch:', error);
    throw error;
  }
}

export async function createBatch(batchData) {
  try {
    const response = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating batch:', error);
    throw error;
  }
}

export async function updateBatch(batchId, batchData) {
  try {
    const response = await fetch(`${BASE_URL}/${batchId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(batchData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating batch:', error);
    throw error;
  }
}

export async function shipBatch(batchId, shipmentData) {
  try {
    const response = await fetch(`${BASE_URL}/${batchId}/ship`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(shipmentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error shipping batch:', error);
    throw error;
  }
}

export async function getBatchesFIFO(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.product_id) params.append('product_id', filters.product_id);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const url = `${BASE_URL}/fifo${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      let errorDetail = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || errorDetail;
        console.error('FIFO API Error:', errorData);
      } catch (e) {
        // Ignore JSON parse errors
      }
      throw new Error(errorDetail);
    }

    const data = await response.json();
    return data.batches || [];
  } catch (error) {
    console.error('Error fetching FIFO batches:', error);
    throw error;
  }
}

export async function getBatchesFEFO(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.product_id) params.append('product_id', filters.product_id);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const url = `${BASE_URL}/fefo${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      let errorDetail = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || errorDetail;
        console.error('FEFO API Error:', errorData);
      } catch (e) {
        // Ignore JSON parse errors
      }
      throw new Error(errorDetail);
    }

    const data = await response.json();
    return data.batches || [];
  } catch (error) {
    console.error('Error fetching FEFO batches:', error);
    throw error;
  }
}
export async function getBatchAllocations(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.product_id) params.append('product_id', filters.product_id);
    if (filters.tracking_location_id) params.append('tracking_location_id', filters.tracking_location_id);

    const url = `${BASE_URL}/allocations${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.allocations || [];
  } catch (error) {
    console.error('Error fetching batch allocations:', error);
    throw error;
  }
}

export async function analyzeBatchExpiry(batchId) {
  try {
    const response = await fetch(`${BASE_URL}/${batchId}/analyze-expiry`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error analyzing batch expiry:', error);
    throw error;
  }
}

export async function suggestBatchStep(batchId) {
  try {
    const response = await fetch(`${BASE_URL}/${batchId}/suggest-step`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting AI step suggestion:', error);
    throw error;
  }
}

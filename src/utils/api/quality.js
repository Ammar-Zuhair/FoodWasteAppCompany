/**
 * Quality Management API Service
 */
import { API_CONFIG } from '../../config/api.config.js';
import { getAuthHeaders } from './auth.js';

const BASE_URL = `${API_CONFIG.baseURL}/api/v1/quality`;

/**
 * Get quality standards list
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getStandards(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.product_id) params.append('product_id', filters.product_id);
    if (filters.standard_type) params.append('standard_type', filters.standard_type);
    if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const url = `${BASE_URL}/standards${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching standards:', error);
    throw error;
  }
}

/**
 * Create a quality standard
 * @param {Object} standardData - Standard data
 * @returns {Promise<Object>}
 */
export async function createStandard(standardData) {
  try {
    const response = await fetch(`${BASE_URL}/standards`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(standardData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating standard:', error);
    throw error;
  }
}

/**
 * Get quality inspections list
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getInspections(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.batch_id) params.append('batch_id', filters.batch_id);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.inspection_type) params.append('inspection_type', filters.inspection_type);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const url = `${BASE_URL}/inspections${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching inspections:', error);
    throw error;
  }
}

/**
 * Create a quality inspection
 * @param {Object} inspectionData - Inspection data
 * @returns {Promise<Object>}
 */
export async function createInspection(inspectionData) {
  try {
    const response = await fetch(`${BASE_URL}/inspections`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inspectionData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating inspection:', error);
    throw error;
  }
}

/**
 * Update a quality inspection
 * @param {string} inspectionId - Inspection ID
 * @param {Object} inspectionData - Updated inspection data
 * @returns {Promise<Object>}
 */
export async function updateInspection(inspectionId, inspectionData) {
  try {
    const response = await fetch(`${BASE_URL}/inspections/${inspectionId}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(inspectionData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating inspection:', error);
    throw error;
  }
}

/**
 * Get quality approvals list
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getApprovals(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.inspection_id) params.append('inspection_id', filters.inspection_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const url = `${BASE_URL}/approvals${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching approvals:', error);
    throw error;
  }
}

/**
 * Create a quality approval
 * @param {Object} approvalData - Approval data
 * @returns {Promise<Object>}
 */
export async function createApproval(approvalData) {
  try {
    const response = await fetch(`${BASE_URL}/approvals`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(approvalData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating approval:', error);
    throw error;
  }
}

/**
 * Get quality reports list
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getReports(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
    if (filters.report_type) params.append('report_type', filters.report_type);
    if (filters.start_date) params.append('start_date', filters.start_date);
    if (filters.end_date) params.append('end_date', filters.end_date);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const url = `${BASE_URL}/reports${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
}

/**
 * Create a quality report
 * @param {Object} reportData - Report data
 * @returns {Promise<Object>}
 */
export async function createReport(reportData) {
  try {
    const response = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reportData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
}

/**
 * Get quality statistics
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getQualityStats(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.facility_id) params.append('facility_id', filters.facility_id);
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
    console.error('Error fetching quality stats:', error);
    throw error;
  }
}


// ========== Quality Inspection Workflow ==========

/**
 * Get batches pending quality inspection
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getBatchesForInspection(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const url = `${BASE_URL}/batches-for-inspection${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching batches for inspection:', error);
    throw error;
  }
}

/**
 * Lock a batch for inspection
 * @param {string} batchId - Batch ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>}
 */
export async function lockBatch(batchId, sessionId) {
  try {
    const response = await fetch(`${BASE_URL}/batches/${batchId}/lock`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error locking batch:', error);
    throw error;
  }
}

/**
 * Release batch lock
 * @param {string} batchId - Batch ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>}
 */
export async function releaseBatch(batchId, sessionId) {
  try {
    const response = await fetch(`${BASE_URL}/batches/${batchId}/release`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error releasing batch lock:', error);
    throw error;
  }
}

/**
 * Pass batch quality inspection
 * @param {string} batchId - Batch ID
 * @param {Object} data - Pass data (notes, temperature, session_id)
 * @returns {Promise<Object>}
 */
export async function passBatch(batchId, data) {
  try {
    const response = await fetch(`${BASE_URL}/batches/${batchId}/pass`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error passing batch:', error);
    throw error;
  }
}

/**
 * Fail batch quality inspection
 * @param {string} batchId - Batch ID
 * @param {Object} data - Fail data (reason, resolution_type, temperature, session_id)
 * @returns {Promise<Object>}
 */
export async function failBatch(batchId, data) {
  try {
    const response = await fetch(`${BASE_URL}/batches/${batchId}/fail`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error failing batch:', error);
    throw error;
  }
}

/**
 * Check batch eligibility for stock operations
 * @param {string} batchId - Batch ID
 * @returns {Promise<Object>}
 */
export async function checkBatchEligibility(batchId) {
  try {
    const response = await fetch(`${BASE_URL}/batches/${batchId}/eligibility`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking batch eligibility:', error);
    throw error;
  }
}


// ========== Approved Batches (from View) ==========

/**
 * Get approved batches from database view
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getApprovedBatches(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.offset) params.append('offset', filters.offset);

    const url = `${BASE_URL}/approved-batches${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching approved batches:', error);
    throw error;
  }
}


// ========== AI Quality Reports ==========

/**
 * Generate AI-powered quality report
 * @param {Object} data - Report parameters
 * @returns {Promise<Object>}
 */
export async function generateQualityReport(data, organizationId) {
  try {
    const params = new URLSearchParams();
    params.append('organization_id', organizationId);

    const response = await fetch(`${BASE_URL}/generate-report?${params.toString()}`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating quality report:', error);
    throw error;
  }
}

/**
 * Get latest AI quality reports
 * @param {Object} filters - Filter options
 * @returns {Promise<Object>}
 */
export async function getLatestQualityReports(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.organization_id) params.append('organization_id', filters.organization_id);
    if (filters.limit) params.append('limit', filters.limit);

    const url = `${BASE_URL}/reports/latest${params.toString() ? '?' + params.toString() : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching quality reports:', error);
    throw error;
  }
}




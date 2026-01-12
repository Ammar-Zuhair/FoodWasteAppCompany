import { useState, useEffect, useCallback } from 'react';
import {
  getStandards,
  createStandard,
  getInspections,
  createInspection,
  updateInspection,
  getApprovals,
  createApproval,
  getReports,
  createReport,
  getQualityStats,
} from '../utils/api/quality.js';
import { getStoredUser } from '../utils/api/auth.js';

// Helper function to get organization_id from stored user
function getOrganizationId() {
  const user = getStoredUser();
  return user?.organization_id || null;
}

/**
 * Hook for quality standards list
 */
export function useStandards(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStandards(filters);
      setStandards(Array.isArray(data) ? data : (data.standards || data.items || []));
    } catch (err) {
      console.error('Error loading standards:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    standards,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for creating quality standard
 */
export function useCreateStandard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (standardData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createStandard(standardData);
      return result;
    } catch (err) {
      console.error('Error creating standard:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

/**
 * Hook for quality inspections list
 */
export function useInspections(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInspections(filters);
      setInspections(Array.isArray(data) ? data : (data.inspections || data.items || []));
    } catch (err) {
      console.error('Error loading inspections:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    inspections,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for creating quality inspection
 */
export function useCreateInspection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (inspectionData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createInspection(inspectionData);
      return result;
    } catch (err) {
      console.error('Error creating inspection:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

/**
 * Hook for updating quality inspection
 */
export function useUpdateInspection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(async (inspectionId, inspectionData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await updateInspection(inspectionId, inspectionData);
      return result;
    } catch (err) {
      console.error('Error updating inspection:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

/**
 * Hook for quality approvals list
 */
export function useApprovals(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getApprovals(filters);
      setApprovals(Array.isArray(data) ? data : (data.approvals || data.items || []));
    } catch (err) {
      console.error('Error loading approvals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    approvals,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for creating quality approval
 */
export function useCreateApproval() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (approvalData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createApproval(approvalData);
      return result;
    } catch (err) {
      console.error('Error creating approval:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

/**
 * Hook for quality reports list
 */
export function useReports(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReports(filters);
      setReports(Array.isArray(data) ? data : (data.reports || data.items || []));
    } catch (err) {
      console.error('Error loading reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    reports,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for creating quality report
 */
export function useCreateReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (reportData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createReport(reportData);
      return result;
    } catch (err) {
      console.error('Error creating report:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

/**
 * Hook for quality statistics
 */
export function useQualityStats(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getQualityStats(filters);
      setStats(data);
    } catch (err) {
      console.error('Error loading quality stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    stats,
    loading,
    error,
    reload: load,
  };
}


// ========== Batch Inspection Workflow Hooks ==========

import {
  getBatchesForInspection,
  lockBatch,
  releaseBatch,
  passBatch,
  failBatch,
} from '../utils/api/quality.js';

/**
 * Hook for batches pending quality inspection
 */
export function useBatchesForInspection(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [batches, setBatches] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const orgId = filters.organization_id || getOrganizationId();
    if (!orgId) {
      setLoading(false);
      setError('Organization ID not available');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getBatchesForInspection({ ...filters, organization_id: orgId });
      setBatches(data.batches || []);
      setCount(data.count || 0);
    } catch (err) {
      console.error('Error loading batches for inspection:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    batches,
    count,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for locking batch for inspection
 */
export function useLockBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const lock = useCallback(async (batchId, sessionId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await lockBatch(batchId, sessionId);
      return result;
    } catch (err) {
      console.error('Error locking batch:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const release = useCallback(async (batchId, sessionId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await releaseBatch(batchId, sessionId);
      return result;
    } catch (err) {
      console.error('Error releasing batch lock:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { lock, release, loading, error };
}

/**
 * Hook for passing batch quality inspection
 */
export function usePassBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pass = useCallback(async (batchId, data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await passBatch(batchId, data);
      return result;
    } catch (err) {
      console.error('Error passing batch:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { pass, loading, error };
}

/**
 * Hook for failing batch quality inspection
 */
export function useFailBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fail = useCallback(async (batchId, data) => {
    try {
      setLoading(true);
      setError(null);
      const result = await failBatch(batchId, data);
      return result;
    } catch (err) {
      console.error('Error failing batch:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { fail, loading, error };
}


// ========== Approved Batches Hook ==========

import {
  getApprovedBatches,
  generateQualityReport,
  getLatestQualityReports,
} from '../utils/api/quality.js';

/**
 * Hook for approved batches (from database view)
 */
export function useApprovedBatches(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [batches, setBatches] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const orgId = filters.organization_id || getOrganizationId();
    if (!orgId) {
      setLoading(false);
      setError('Organization ID not available');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getApprovedBatches({ ...filters, organization_id: orgId });
      setBatches(data.batches || []);
      setCount(data.count || 0);
    } catch (err) {
      console.error('Error loading approved batches:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    batches,
    count,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for generating AI quality report
 */
export function useGenerateQualityReport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async (data, organizationId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await generateQualityReport(data, organizationId);
      return result;
    } catch (err) {
      console.error('Error generating report:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generate, loading, error };
}

/**
 * Hook for latest AI quality reports
 */
export function useLatestQualityReports(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    const orgId = filters.organization_id || getOrganizationId();
    if (!orgId) {
      setLoading(false);
      setError('Organization ID not available');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await getLatestQualityReports({ ...filters, organization_id: orgId });
      setReports(data.reports || []);
    } catch (err) {
      console.error('Error loading quality reports:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    reports,
    loading,
    error,
    reload: load,
  };
}




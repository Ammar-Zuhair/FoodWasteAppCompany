import { useState, useEffect, useCallback, useMemo } from 'react';
import * as batchesAPI from '../utils/api/batches.js';
import { getStoredUser } from '../utils/api/auth.js';

// Helper function to get organization_id from stored user
function getOrganizationId() {
  const user = getStoredUser();
  return user?.organization_id || null;
}

export function useBatches(filters = {}) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBatches = useCallback(async () => {
    const orgId = filters.organization_id || getOrganizationId();
    if (!orgId) {
      setLoading(false);
      setError('Organization ID not available');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await batchesAPI.getBatches({ ...filters, organization_id: orgId });
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  return { batches, loading, error, reload: loadBatches };
}

export function useBatch(batchId) {
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!batchId) {
      setLoading(false);
      return;
    }

    async function loadBatch() {
      try {
        setLoading(true);
        setError(null);
        const data = await batchesAPI.getBatch(batchId);
        setBatch(data);
      } catch (err) {
        setError(err.message);
        setBatch(null);
      } finally {
        setLoading(false);
      }
    }

    loadBatch();
  }, [batchId]);

  return { batch, loading, error };
}

export function useCreateBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (batchData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await batchesAPI.createBatch(batchData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

export function useUpdateBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(async (batchId, batchData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await batchesAPI.updateBatch(batchId, batchData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

export function useShipBatch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ship = useCallback(async (batchId, shipmentData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await batchesAPI.shipBatch(batchId, shipmentData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { ship, loading, error };
}

export function useBatchesFIFO(filters = {}) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBatches = useCallback(async () => {
    const orgId = filters.organization_id || getOrganizationId();
    if (!orgId) {
      setLoading(false);
      setError('Organization ID not available');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await batchesAPI.getBatchesFIFO({ ...filters, organization_id: orgId });
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  return { batches, loading, error, reload: loadBatches };
}

export function useBatchesFEFO(filters = {}) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBatches = useCallback(async () => {
    const orgId = filters.organization_id || getOrganizationId();
    if (!orgId) {
      setLoading(false);
      setError('Organization ID not available');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await batchesAPI.getBatchesFEFO({ ...filters, organization_id: orgId });
      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  return { batches, loading, error, reload: loadBatches };
}
export function useBatchAllocations(filters = {}) {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAllocations = useCallback(async () => {
    const orgId = filters.organization_id || getOrganizationId();
    if (!orgId) {
      setLoading(false);
      setError('Organization ID not available');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await batchesAPI.getBatchAllocations({ ...filters, organization_id: orgId });
      setAllocations(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setAllocations([]);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    loadAllocations();
  }, [loadAllocations]);

  return { allocations, loading, error, reload: loadAllocations };
}

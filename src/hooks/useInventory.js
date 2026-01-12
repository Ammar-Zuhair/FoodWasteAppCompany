import { useState, useEffect, useCallback } from 'react';
import { getInventoryPositions, getBatches, getExpiringBatches, createTransfer } from '../utils/api/inventory.js';

/**
 * Hook for inventory positions
 */
export function useInventoryPositions(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getInventoryPositions(filters);
      setPositions(Array.isArray(data) ? data : (data.positions || data.items || []));
    } catch (err) {
      console.error('Error loading inventory positions:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    positions,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for batches
 */
export function useBatches(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBatches(filters);
      setBatches(Array.isArray(data) ? data : (data.batches || data.items || []));
    } catch (err) {
      console.error('Error loading batches:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    batches,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for expiring batches
 */
export function useExpiringBatches(days = 30, options = {}) {
  const { autoLoad = true } = options;
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getExpiringBatches(days);
      setBatches(Array.isArray(data) ? data : (data.batches || data.items || []));
    } catch (err) {
      console.error('Error loading expiring batches:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    batches,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for inventory transfers
 */
export function useInventoryTransfer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (transferData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createTransfer(transferData);
      return result;
    } catch (err) {
      console.error('Error creating transfer:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    create,
    loading,
    error,
  };
}




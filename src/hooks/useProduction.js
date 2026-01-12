import { useState, useEffect, useCallback } from 'react';
import * as productionAPI from '../utils/api/production.js';
import { getStoredUser } from '../utils/api/auth.js';

// Helper function to get organization_id from stored user
function getOrganizationId() {
  const user = getStoredUser();
  return user?.organization_id || null;
}

export function useProductionBatches(filters = {}) {
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
      const data = await productionAPI.getProductionBatches({ ...filters, organization_id: orgId });
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

export function useProductionStats(filters = {}) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      const orgId = filters.organization_id || getOrganizationId();
      if (!orgId) {
        setLoading(false);
        setError('Organization ID not available');
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await productionAPI.getProductionStats({ ...filters, organization_id: orgId });
        setStats(data);
      } catch (err) {
        setError(err.message);
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [JSON.stringify(filters)]);

  return { stats, loading, error };
}












import { useState, useEffect, useCallback } from 'react';
import { getDashboardOverview, getDashboardKPIs } from '../utils/api/dashboard.js';

/**
 * Hook for dashboard data
 */
export function useDashboard() {
  const [overview, setOverview] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOverview = useCallback(async () => {
    try {
      setError(null);
      const data = await getDashboardOverview();
      setOverview(data);
    } catch (err) {
      console.error('Error loading dashboard overview:', err);
      setError(err.message);
    }
  }, []);

  const loadKPIs = useCallback(async () => {
    try {
      setError(null);
      const data = await getDashboardKPIs();
      setKpis(data);
    } catch (err) {
      console.error('Error loading dashboard KPIs:', err);
      setError(err.message);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadOverview(), loadKPIs()]);
    } finally {
      setLoading(false);
    }
  }, [loadOverview, loadKPIs]);

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only load once on mount

  return {
    overview,
    kpis,
    loading,
    error,
    reload: loadAll,
    reloadOverview: loadOverview,
    reloadKPIs: loadKPIs,
  };
}



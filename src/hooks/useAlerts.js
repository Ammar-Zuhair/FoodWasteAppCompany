import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { getAlerts, getAlert, acknowledgeAlert, resolveAlert, getAlertStats, getAlertLookups } from '../utils/api/alerts.js';

/**
 * Hook for alerts data with enhanced filtering
 */
export function useAlerts(filters = {}, options = {}) {
  const { autoLoad = true, pollInterval = null } = options;
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [lookups, setLookups] = useState({
    violation_types: [],
    alert_statuses: [],
    severities: [],
    entity_types: [],
  });
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
    hasMore: false,
  });

  // Use ref to store current filters to avoid dependency issues
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Memoize filters key to detect changes
  const filtersKey = useMemo(() => JSON.stringify(filters), [JSON.stringify(filters)]);

  const loadAlerts = useCallback(async () => {
    try {
      setError(null);
      const data = await getAlerts(filtersRef.current);
      setAlerts(Array.isArray(data) ? data : (data.alerts || data.items || []));
      setPagination({
        total: data.total || 0,
        limit: data.limit || 100,
        offset: data.offset || 0,
        hasMore: data.has_more || false,
      });
    } catch (err) {
      console.error('Error loading alerts:', err);
      setError(err.message);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      setError(null);
      const data = await getAlertStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading alert stats:', err);
      setError(err.message);
    }
  }, []);

  const loadLookups = useCallback(async () => {
    try {
      const data = await getAlertLookups();
      setLookups(data);
    } catch (err) {
      console.error('Error loading alert lookups:', err);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadAlerts(), loadStats(), loadLookups()]);
    } finally {
      setLoading(false);
    }
  }, [loadAlerts, loadStats, loadLookups]);

  useEffect(() => {
    if (autoLoad) {
      setLoading(true);
      Promise.all([loadAlerts(), loadStats(), loadLookups()]).finally(() => {
        setLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad, filtersKey]);

  // Polling support
  useEffect(() => {
    if (pollInterval && autoLoad) {
      const interval = setInterval(loadAlerts, pollInterval);
      return () => clearInterval(interval);
    }
  }, [pollInterval, autoLoad, loadAlerts]);

  const acknowledge = useCallback(async (alertId) => {
    try {
      await acknowledgeAlert(alertId);
      await loadAlerts();
    } catch (err) {
      console.error('Error acknowledging alert:', err);
      throw err;
    }
  }, [loadAlerts]);

  const resolve = useCallback(async (alertId, notes = null) => {
    try {
      await resolveAlert(alertId, notes);
      await loadAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
      throw err;
    }
  }, [loadAlerts]);

  return {
    alerts,
    stats,
    lookups,
    pagination,
    loading,
    error,
    reload: loadAll,
    reloadAlerts: loadAlerts,
    acknowledge,
    resolve,
  };
}

/**
 * Hook for single alert
 */
export function useAlert(alertId) {
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!alertId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getAlert(alertId);
      setAlert(data);
    } catch (err) {
      console.error('Error loading alert:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [alertId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    alert,
    loading,
    error,
    reload: load,
  };
}

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getProductionOrders,
  getDemandForecasts,
  getProductionSuggestions,
  getRecommendationStats
} from '../utils/api/planning.js';

/**
 * Hook for production orders
 */
export function useProductionOrders(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  // Memoize filters to prevent unnecessary re-renders
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProductionOrders(filters);
      setOrders(Array.isArray(data) ? data : (data.orders || data.items || []));
    } catch (err) {
      console.error('Error loading production orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filtersKey]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    orders,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for demand forecasts
 */
export function useDemandForecasts(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  // Memoize filters to prevent unnecessary re-renders
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDemandForecasts(filters);
      setForecasts(Array.isArray(data) ? data : (data.forecasts || data.items || []));
    } catch (err) {
      console.error('Error loading demand forecasts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filtersKey]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    forecasts,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for production suggestions
 */
export function useProductionSuggestions() {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (params) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProductionSuggestions(params);
      setSuggestions(data);
      return data;
    } catch (err) {
      console.error('Error loading production suggestions:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    suggestions,
    loading,
    error,
    load,
  };
}

/**
 * Hook for Recommendation Stats
 */
export function useRecommendationStats(params = {}, options = {}) {
  const { autoLoad = true } = options;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRecommendationStats(params);
      setStats(data);
    } catch (err) {
      console.error('Error loading recommendation stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [paramsKey]);

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





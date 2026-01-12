import { useState, useEffect, useCallback, useMemo } from 'react';
import { getReturns, createReturn, updateReturnStatus, getReturnsRecommendations } from '../utils/api/returns.js';

/**
 * Hook for returns list with pagination
 */
export function useReturns(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [data, setData] = useState({ returns: [], total: 0, page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  // Memoize filters to prevent unnecessary re-renders
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const load = useCallback(async (overrideFilters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const activeFilters = { ...filters, ...overrideFilters };
      const response = await getReturns(activeFilters);

      // Handle both old and new response formats if necessary, but we expect new format
      if (response.data) {
        setData({
          returns: response.data,
          total: response.total,
          page: response.page,
          total_pages: response.total_pages
        });
      } else if (Array.isArray(response)) {
        setData({ returns: response, total: response.length, page: 1, total_pages: 1 });
      } else {
        setData({ returns: [], total: 0, page: 1, total_pages: 1 });
      }

    } catch (err) {
      console.error('Error loading returns:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filtersKey]); // Dependencies

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  const updateStatus = async (id, status, notes) => {
    try {
      await updateReturnStatus(id, status, notes);
      load(); // Reload data
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };

  return {
    returns: data.returns,
    pagination: {
      total: data.total,
      page: data.page,
      totalPages: data.total_pages
    },
    loading,
    error,
    reload: load,
    updateStatus
  };
}

/**
 * Hook for returns AI recommendations
 */
export function useReturnsRecommendations(options = {}) {
  const { autoLoad = false } = options;
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await getReturnsRecommendations({ force_refresh: force });
      setRecommendations(res.recommendations || []);
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    recommendations,
    loading,
    error,
    fetchRecommendations: load
  };
}


/**
 * Hook for creating returns
 */
export function useCreateReturn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (returnData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createReturn(returnData);
      return result;
    } catch (err) {
      console.error('Error creating return:', err);
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

// Deprecated or Dummy
export function useReturnsAnalysis() {
  return { analysis: {}, loading: false, error: null };
}

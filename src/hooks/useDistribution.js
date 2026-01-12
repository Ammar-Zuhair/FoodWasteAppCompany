import { useState, useCallback } from 'react';
import * as distributionAPI from '../utils/api/distribution.js';

export function useDistributeOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const distribute = useCallback(async (orderId, distributionMode = 'auto') => {
    try {
      setLoading(true);
      setError(null);
      const result = await distributionAPI.distributeOrder(orderId, distributionMode);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { distribute, loading, error };
}

export function useOptimizeRoute() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const optimize = useCallback(async (orderIds, sourceFacilityId = null) => {
    try {
      setLoading(true);
      setError(null);
      const result = await distributionAPI.optimizeDistributionRoute(orderIds, sourceFacilityId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { optimize, loading, error };
}










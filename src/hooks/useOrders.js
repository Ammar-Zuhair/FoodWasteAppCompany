import { useState, useEffect, useCallback } from 'react';
import {
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  distributeOrder,
  getOrderStats,
  allocateBatches,
  getWasteReductionStats,
  getOrderBatchAllocations,
} from '../utils/api/orders.js';

/**
 * Hook for orders list
 */
export function useOrders(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrders(filters);
      setOrders(Array.isArray(data) ? data : (data.orders || data.items || []));
    } catch (err) {
      console.error('Error loading orders:', err);
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
    orders,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for single order
 */
export function useOrder(orderId, options = {}) {
  const { autoLoad = true } = options;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getOrder(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Error loading order:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (autoLoad && orderId) {
      load();
    }
  }, [autoLoad, orderId, load]);

  return {
    order,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for creating order
 */
export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (orderData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createOrder(orderData);
      return result;
    } catch (err) {
      console.error('Error creating order:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { create, loading, error };
}

/**
 * Hook for updating order
 */
export function useUpdateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(async (orderId, orderData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await updateOrder(orderId, orderData);
      return result;
    } catch (err) {
      console.error('Error updating order:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { update, loading, error };
}

/**
 * Hook for distributing order
 */
export function useDistributeOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const distribute = useCallback(async (orderId, distributionMode = 'auto') => {
    try {
      setLoading(true);
      setError(null);
      const result = await distributeOrder(orderId, distributionMode);
      return result;
    } catch (err) {
      console.error('Error distributing order:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { distribute, loading, error };
}

/**
 * Hook for order statistics
 */
export function useOrderStats(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrderStats(filters);
      setStats(data);
    } catch (err) {
      console.error('Error loading order stats:', err);
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


/**
 * Hook for allocating batches using FEFO strategy
 */
export function useAllocateBatches() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const allocate = useCallback(async (orderId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await allocateBatches(orderId);
      return result;
    } catch (err) {
      console.error('Error allocating batches:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { allocate, loading, error };
}


/**
 * Hook for waste reduction statistics
 */
export function useWasteReductionStats(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWasteReductionStats(filters);
      setStats(data);
    } catch (err) {
      console.error('Error loading waste reduction stats:', err);
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


/**
 * Hook for batch allocations of an order
 */
export function useOrderBatchAllocations(orderId, options = {}) {
  const { autoLoad = true } = options;
  const [allocations, setAllocations] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getOrderBatchAllocations(orderId);
      setAllocations(data);
    } catch (err) {
      console.error('Error loading batch allocations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (autoLoad && orderId) {
      load();
    }
  }, [autoLoad, orderId, load]);

  return {
    allocations,
    loading,
    error,
    reload: load,
  };
}








import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  createShipment,
  getShipment,
  getShipments,
  getActiveShipments,
  getInTransitShipments,
  updateShipmentLocation,
  updateShipmentTemperature,
  checkDeliveryReadiness
} from '../utils/api/shipments.js';

/**
 * Hook for shipments list
 */
export function useShipments(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  // Extract filter values to prevent infinite loops
  const organizationId = filters?.organization_id;
  const status = filters?.status;
  const limit = filters?.limit;
  const offset = filters?.offset;

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getShipments({ organization_id: organizationId, status, limit, offset });
      setShipments(Array.isArray(data.shipments) ? data.shipments : (data.items || []));
    } catch (err) {
      console.error('Error loading shipments:', err);
      setError(err.message);
      setShipments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [organizationId, status, limit, offset]); // Use individual values instead of filters object

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    shipments,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for active shipments
 */
export function useActiveShipments(driverId, options = {}) {
  const { autoLoad = true } = options;
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!driverId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getActiveShipments(driverId);
      setShipments(Array.isArray(data.shipments) ? data.shipments : (data.items || []));
    } catch (err) {
      console.error('Error loading active shipments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [driverId]);

  useEffect(() => {
    if (autoLoad && driverId) {
      load();
    }
  }, [autoLoad, driverId, load]);

  return {
    shipments,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for single shipment
 */
export function useShipment(shipmentId, options = {}) {
  const { autoLoad = true } = options;
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!shipmentId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getShipment(shipmentId);
      setShipment(data);
    } catch (err) {
      console.error('Error loading shipment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [shipmentId]);

  useEffect(() => {
    if (autoLoad && shipmentId) {
      load();
    }
  }, [autoLoad, shipmentId, load]);

  const updateLocation = useCallback(async (latitude, longitude) => {
    try {
      await updateShipmentLocation(shipmentId, latitude, longitude);
      await load(); // Reload after update
    } catch (err) {
      console.error('Error updating shipment location:', err);
      throw err;
    }
  }, [shipmentId, load]);

  const updateTemperature = useCallback(async (temperature) => {
    try {
      await updateShipmentTemperature(shipmentId, temperature);
      await load(); // Reload after update
    } catch (err) {
      console.error('Error updating shipment temperature:', err);
      throw err;
    }
  }, [shipmentId, load]);

  const checkDelivery = useCallback(async () => {
    try {
      const result = await checkDeliveryReadiness(shipmentId);
      await load(); // Reload after check
      return result;
    } catch (err) {
      console.error('Error checking delivery readiness:', err);
      throw err;
    }
  }, [shipmentId, load]);

  return {
    shipment,
    loading,
    error,
    reload: load,
    updateLocation,
    updateTemperature,
    checkDelivery,
  };
}

/**
 * Hook for creating shipments
 */
export function useCreateShipment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (shipmentData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createShipment(shipmentData);
      return result;
    } catch (err) {
      console.error('Error creating shipment:', err);
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

/**
 * Hook for in-transit shipments with auto-refresh
 */
export function useInTransitShipments(organizationId, options = {}) {
  const { autoLoad = true, refreshInterval = 60000, language = 'ar' } = options;
  const [data, setData] = useState({ shipments: [], summary: {}, total: 0 });
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getInTransitShipments(organizationId, language);
      setData({
        shipments: result.shipments || [],
        summary: result.summary || {},
        total: result.total || 0
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading in-transit shipments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId, language]);

  // Initial load
  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  // Auto-refresh polling
  useEffect(() => {
    if (!refreshInterval || refreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      load();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, load]);

  return {
    shipments: data.shipments,
    summary: data.summary,
    total: data.total,
    loading,
    error,
    reload: load,
    lastUpdated,
  };
}


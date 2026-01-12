import { useState, useEffect, useCallback } from 'react';
import { getFacilities, getFacility, getFacilityOverview, getFacilityInventory, getFacilitySensors } from '../utils/api/facilities.js';

/**
 * Hook for facilities list
 */
export function useFacilities(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFacilities(filters);
      setFacilities(Array.isArray(data) ? data : (data.facilities || data.items || []));
    } catch (err) {
      console.error('Error loading facilities:', err);
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
    facilities,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for single facility
 */
export function useFacility(facilityId, options = {}) {
  const { includeOverview = false, includeInventory = false, includeSensors = false } = options;
  const [facility, setFacility] = useState(null);
  const [overview, setOverview] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [sensors, setSensors] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!facilityId) return;
    try {
      setLoading(true);
      setError(null);
      
      const [facilityData, ...rest] = await Promise.all([
        getFacility(facilityId),
        includeOverview ? getFacilityOverview(facilityId) : null,
        includeInventory ? getFacilityInventory(facilityId) : null,
        includeSensors ? getFacilitySensors(facilityId) : null,
      ]);

      setFacility(facilityData);
      if (includeOverview && rest[0]) setOverview(rest[0]);
      if (includeInventory && rest[1]) setInventory(rest[1]);
      if (includeSensors && rest[2]) setSensors(rest[2]);
    } catch (err) {
      console.error('Error loading facility:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [facilityId, includeOverview, includeInventory, includeSensors]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    facility,
    overview,
    inventory,
    sensors,
    loading,
    error,
    reload: load,
  };
}




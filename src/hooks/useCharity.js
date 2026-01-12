import { useState, useEffect, useCallback } from 'react';
import { getDonations, createDonation, updateDonation, deleteDonation, getDonationStats, getCharities, getPotentialDonations, createCharity, updateCharity } from '../utils/api/charity.js';
import { getDonationImpactReport } from '../utils/api/reports.js';

/**
 * Hook for charity donations list
 */
export function useDonations(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDonations(filters);
      setDonations(Array.isArray(data) ? data : (data.donations || data.items || []));
    } catch (err) {
      console.error('Error loading donations:', err);
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
    donations,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for donation statistics
 */
export function useDonationStats(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDonationStats(filters);
      setStats(data);
    } catch (err) {
      console.error('Error loading donation stats:', err);
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
 * Hook for creating donations
 */
export function useCreateDonation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const create = useCallback(async (donationData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await createDonation(donationData);
      return result;
    } catch (err) {
      console.error('Error creating donation:', err);
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
 * Hook for updating donations
 */
export function useUpdateDonation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(async (donationId, donationData) => {
    try {
      setLoading(true);
      setError(null);
      const result = await updateDonation(donationId, donationData);
      return result;
    } catch (err) {
      console.error('Error updating donation:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    update,
    loading,
    error,
  };
}

/**
 * Hook for deleting donations
 */
export function useDeleteDonation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const remove = useCallback(async (donationId) => {
    try {
      setLoading(true);
      setError(null);
      const result = await deleteDonation(donationId);
      return result;
    } catch (err) {
      console.error('Error deleting donation:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    delete: remove,
    loading,
    error,
  };
}













/**
 * Hook for charities list
 */
export function useCharities(filters = {}, options = {}) {
  const { autoLoad = true } = options;
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(autoLoad);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCharities(filters);
      setCharities(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    if (autoLoad) load();
  }, [autoLoad, load]);

  return { charities, loading, reload: load };
}

/**
 * Hook for potential donations
 */
export function usePotentialDonations(organizationId, charityId = null) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchSuggestions = useCallback(async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      const data = await getPotentialDonations(organizationId, charityId);
      setSuggestions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, charityId]);

  return { suggestions, loading, fetchSuggestions };
}

/**
 * Hook for donation impact report
 */
export function useDonationImpact(period = 'month') {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await getDonationImpactReport(period);
        setReport(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [period]);

  return { report, loading };
}

/**
 * Hook to create a charity
 */
export function useCreateCharity() {
  const [loading, setLoading] = useState(false);
  const create = async (data) => {
    try {
      setLoading(true);
      return await createCharity(data);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };
  return { create, loading };
}

/**
 * Hook to update a charity
 */
export function useUpdateCharity() {
  const [loading, setLoading] = useState(false);
  const update = async (id, data) => {
    try {
      setLoading(true);
      return await updateCharity(id, data);
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };
  return { update, loading };
}

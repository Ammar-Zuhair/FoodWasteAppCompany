import { useState, useEffect, useCallback } from 'react';
import { getAtRiskBatches, getWasteStatistics, updateRiskScores, suggestActions } from '../utils/api/waste.js';

/**
 * Hook for at-risk batches
 */
export function useAtRiskBatches(days = 30, options = {}) {
  const { autoLoad = true } = options;
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAtRiskBatches(days);
      setBatches(Array.isArray(data) ? data : (data.batches || data.items || []));
    } catch (err) {
      console.error('Error loading at-risk batches:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    batches,
    loading,
    error,
    reload: load,
  };
}

/**
 * Hook for waste statistics
 */
export function useWasteStatistics(organizationId, startDate = null, endDate = null, options = {}) {
  const { autoLoad = true } = options;
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!organizationId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getWasteStatistics(organizationId, startDate, endDate);
      setStats(data);
    } catch (err) {
      console.error('Error loading waste statistics:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [organizationId, startDate, endDate]);

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
 * Hook for updating risk scores
 */
export function useUpdateRiskScores() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = useCallback(async (batchIds = null) => {
    try {
      setLoading(true);
      setError(null);
      const result = await updateRiskScores(batchIds);
      return result;
    } catch (err) {
      console.error('Error updating risk scores:', err);
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
 * Hook for action suggestions
 */
export function useActionSuggestions(batchId) {
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!batchId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await suggestActions(batchId);
      setSuggestions(data);
      return data;
    } catch (err) {
      console.error('Error loading action suggestions:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  return {
    suggestions,
    loading,
    error,
    load,
  };
}


/**
 * Hook for wasted batches (WasteEvents)
 */
export function useWastedBatches(days = 30, options = {}) {
  const { autoLoad = true, limit = 50 } = options;
  const [data, setData] = useState({ batches: [], summary: {} });
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { getWastedBatches } = await import('../utils/api/waste.js');
      const result = await getWastedBatches({ days, limit });
      setData({
        batches: result.batches || [],
        summary: result.summary || {}
      });
      return result;
    } catch (err) {
      console.error('Error loading wasted batches:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days, limit]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    batches: data.batches,
    summary: data.summary,
    loading,
    error,
    reload: load,
  };
}


/**
 * Hook for batch journey
 */
export function useBatchJourney(batchId) {
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!batchId) return;
    try {
      setLoading(true);
      setError(null);
      const { getBatchJourney } = await import('../utils/api/waste.js');
      const data = await getBatchJourney(batchId);
      setJourney(data);
      return data;
    } catch (err) {
      console.error('Error loading batch journey:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (batchId) {
      load();
    }
  }, [batchId, load]);

  return {
    journey,
    loading,
    error,
    reload: load,
  };
}


/**
 * Hook for waste analysis
 */
export function useWasteAnalysis(days = 30, options = {}) {
  const { autoLoad = true } = options;
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { getWasteAnalysis } = await import('../utils/api/waste.js');
      const data = await getWasteAnalysis({ days });
      setAnalysis(data);
      return data;
    } catch (err) {
      console.error('Error loading waste analysis:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  return {
    analysis,
    loading,
    error,
    reload: load,
  };
}


/**
 * Hook for waste recommendations
 */
export function useWasteRecommendations(options = {}) {
  const { autoLoad = true, limit = 10 } = options;
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { getWasteRecommendations } = await import('../utils/api/waste.js');
      const data = await getWasteRecommendations({ limit });
      setRecommendations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading waste recommendations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const generate = useCallback(async () => {
    try {
      setIsGenerating(true);
      setError(null);
      const { generateWasteRecommendations } = await import('../utils/api/waste.js');
      const newRecs = await generateWasteRecommendations();
      setRecommendations(Array.isArray(newRecs) ? newRecs : []);
      return newRecs;
    } catch (err) {
      console.error('Error generating waste recommendations:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsGenerating(false);
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
    isGenerating,
    reload: load,
    generate,
  };
}

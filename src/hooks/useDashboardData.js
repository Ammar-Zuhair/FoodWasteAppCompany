import { useEffect, useState, useCallback, useRef } from "react";
import { dashboardAPI } from "../utils/api";

/**
 * Hook لجلب بيانات لوحة التحكم لأي قسم
 */
export function useDashboardSection(section, options = {}) {
  const { autoLoad = true, pollInterval = null } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  // Use ref to track if data has been loaded at least once to avoid flashing loading state
  const isLoadedRef = useRef(false);

  const load = useCallback(async () => {
    if (!section) {
      console.warn(`[useDashboardSection] No section provided`);
      return;
    }
    console.log(`[useDashboardSection] Loading section "${section}"`);
    try {
      // Only show loading spinner on initial load, not on polling updates
      if (!isLoadedRef.current) {
        setLoading(true);
      }
      setError(null);
      // console.log(`[useDashboardSection] Calling dashboardAPI.getSection("${section}")`);
      const response = await dashboardAPI.getSection(section);
      // console.log(`[useDashboardSection] Received response for "${section}":`, response);
      setData(response);
      isLoadedRef.current = true;
    } catch (err) {
      // If authentication error, token was already cleared by apiRequest
      // Dispatch event to notify App.jsx to check authentication status
      if (err.isAuthError || err.status === 401) {
        console.warn(`[useDashboardSection] Authentication expired for section "${section}"`);
        // Dispatch custom event to notify App about auth failure
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:expired'));
        }
        // Don't set error state - let App.jsx handle the redirect
        return;
      }
      console.error(`[useDashboardSection] Error loading dashboard section "${section}":`, err);
      setError(err.message);
    } finally {
      if (isLoadedRef.current) {
        setLoading(false);
      } else {
        // If error occurred during first load
        setLoading(false);
      }
    }
  }, [section]);

  useEffect(() => {
    if (autoLoad) {
      load();
    }
  }, [autoLoad, load]);

  // Polling support for real-time updates
  useEffect(() => {
    if (pollInterval && autoLoad && section) {
      const interval = setInterval(() => {
        load();
      }, pollInterval);
      return () => clearInterval(interval);
    }
  }, [pollInterval, autoLoad, section, load]);

  return {
    data,
    loading,
    error,
    reload: load,
  };
}











import { useState, useEffect, useCallback } from 'react';
import { getSupermarkets } from '../utils/api/supermarkets.js';

/**
 * Hook to fetch merchants
 */
export function useMerchants(filters = {}, options = {}) {
    const { autoLoad = true } = options;
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(autoLoad);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await getSupermarkets(filters);
            setMerchants(data);
        } catch (err) {
            console.error('Error loading merchants:', err);
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
        merchants,
        loading,
        error,
        reload: load,
    };
}

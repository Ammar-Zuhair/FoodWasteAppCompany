import { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../utils/api/products.js';

/**
 * Hook to fetch products
 */
export function useProducts(filters = {}, options = {}) {
    const { autoLoad = true } = options;
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(autoLoad);
    const [error, setError] = useState(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const data = await getProducts(filters);
            setProducts(data);
        } catch (err) {
            console.error('Error loading products:', err);
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
        products,
        loading,
        error,
        reload: load,
    };
}

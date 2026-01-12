/**
 * API Interceptor - Request/Response Handling with Permissions
 * Adapted for Mobile (Android)
 */

import { getStoredUser, getToken, logout } from './auth.js';

// Try to import permissions, use fallback if not available
let buildScopeParams = () => ({});
let canView = () => true;
let RESOURCES = {};

try {
    const permissions = require('../permissions.js');
    buildScopeParams = permissions.buildScopeParams || buildScopeParams;
    canView = permissions.canView || canView;
    RESOURCES = permissions.RESOURCES || RESOURCES;
} catch (e) {
    console.warn('[API Interceptor] Permissions module not available, using defaults');
}

// Endpoint to Resource mapping
const ENDPOINT_RESOURCE_MAP = {
    '/api/v1/orders': RESOURCES.ORDERS || 'orders',
    '/api/v1/batches': RESOURCES.BATCHES || 'batches',
    '/api/v1/inventory': RESOURCES.INVENTORY || 'inventory',
    '/api/v1/allocations': RESOURCES.INVENTORY || 'inventory',
    '/api/v1/production': RESOURCES.PRODUCTION || 'production',
    '/api/v1/shipments': RESOURCES.SHIPMENTS || 'shipments',
    '/api/v1/quality': RESOURCES.QUALITY || 'quality',
    '/api/v1/waste': RESOURCES.WASTE_ANALYSIS || 'waste',
    '/api/v1/alerts': RESOURCES.ALERTS || 'alerts',
    '/api/v1/reports': RESOURCES.REPORTS || 'reports',
    '/api/v1/users': RESOURCES.USERS || 'users',
    '/api/v1/facilities': RESOURCES.FACILITIES || 'facilities',
    '/api/v1/branches': RESOURCES.BRANCHES || 'branches',
    '/api/v1/vehicles': RESOURCES.VEHICLES || 'vehicles',
    '/api/v1/merchants': RESOURCES.SUPERMARKETS || 'supermarkets',
    '/api/v1/distribution': RESOURCES.DISTRIBUTION || 'distribution',
    '/api/v1/refrigeration': RESOURCES.REFRIGERATION || 'refrigeration',
    '/api/v1/tasks': RESOURCES.TASKS || 'tasks',
    '/api/v1/leads': RESOURCES.LEADS || 'leads',
    '/api/v1/returns': RESOURCES.RETURNS || 'returns',
    '/api/v1/charity': RESOURCES.CHARITY || 'charity',
    '/api/v1/monitoring': RESOURCES.REFRIGERATION || 'refrigeration',
    '/api/v1/sensors': RESOURCES.REFRIGERATION || 'refrigeration',
    '/api/v1/dashboard': RESOURCES.DASHBOARD || 'dashboard',
    '/api/v1/ai': RESOURCES.AI_DASHBOARD || 'ai',
    '/api/v1/chatbot': RESOURCES.CHATBOT || 'chatbot',
};

/**
 * Extract resource from URL
 */
export function extractResourceFromUrl(url) {
    if (!url) return null;

    for (const [endpoint, resource] of Object.entries(ENDPOINT_RESOURCE_MAP)) {
        if (url.includes(endpoint)) {
            return resource;
        }
    }

    return null;
}

/**
 * Setup axios interceptors
 */
export function setupApiInterceptors(axiosInstance) {
    if (!axiosInstance?.interceptors) {
        console.warn('[API Interceptor] Invalid axios instance');
        return;
    }

    // Request interceptor
    axiosInstance.interceptors.request.use(
        (config) => {
            const user = getStoredUser();
            const token = getToken();

            if (token) {
                config.headers = config.headers || {};
                config.headers['Authorization'] = `Bearer ${token}`;
            }

            if (user && typeof buildScopeParams === 'function') {
                const scopeParams = buildScopeParams(user);
                config.params = { ...config.params, ...scopeParams };
            }

            config._resource = config.meta?.resource || extractResourceFromUrl(config.url);
            config._user = user;

            return config;
        },
        (error) => Promise.reject(error)
    );

    // Response interceptor
    axiosInstance.interceptors.response.use(
        (response) => response,
        (error) => {
            const { config, response } = error;

            if (response?.status === 401) {
                console.warn('[API] Token expired - logging out');
                logout();
                if (typeof window !== 'undefined' && window.location) {
                    window.location.href = '/';
                }
                return Promise.reject(error);
            }

            if (response?.status === 403) {
                console.warn('[API] Access forbidden:', config?.url);
                return Promise.reject(error);
            }

            return Promise.reject(error);
        }
    );
}

/**
 * Check if user can access endpoint
 */
export function canAccessEndpoint(url, user) {
    if (!user) return false;

    const resource = extractResourceFromUrl(url);
    if (!resource) return true;

    if (typeof canView === 'function') {
        return canView(user.role, resource);
    }
    return true;
}

/**
 * Create scoped request
 */
export function createScopedRequest(baseRequest) {
    return async (url, options = {}) => {
        const user = getStoredUser();
        const scopeParams = (user && typeof buildScopeParams === 'function')
            ? buildScopeParams(user)
            : {};

        const mergedParams = { ...options.params, ...scopeParams };

        return baseRequest(url, {
            ...options,
            params: mergedParams,
        });
    };
}

export default {
    setupApiInterceptors,
    extractResourceFromUrl,
    canAccessEndpoint,
    createScopedRequest,
    ENDPOINT_RESOURCE_MAP,
};

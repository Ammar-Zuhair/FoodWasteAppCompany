/**
 * AuthContext - Centralized Authentication & Authorization State
 * 
 * Security Notes:
 * - userScopes MUST come from JWT token claims, not client state
 * - Backend is the source of truth for all permissions
 * - This context provides UX convenience only
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStoredUser, getToken, logout as authLogout, isAuthenticated } from '../utils/api/auth.js';
import { getRolePermissions, getDataScope, buildScopeParams } from '../utils/permissions.js';

// Default context value
const defaultAuthContext = {
    user: null,
    role: null,
    permissions: null,
    userScopes: {
        facility_id: null,
        branch_id: null,
        merchant_id: null,
        vehicle_id: null,
        organization_id: null,
    },
    token: null,
    isLoading: true,
    isLoggedIn: false,

    // Methods
    login: async () => { },
    logout: () => { },
    refreshUser: () => { },
    getScopeParams: () => ({}),
};

const AuthContext = createContext(defaultAuthContext);

/**
 * AuthProvider Component
 * Wraps the app and provides authentication state
 */
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Derive permissions from role
    const role = user?.role || null;
    const permissions = role ? getRolePermissions(role) : null;

    // User scopes - extracted from stored user (should be from JWT in production)
    const userScopes = {
        facility_id: user?.facility_id || null,
        branch_id: user?.branch_id || null,
        merchant_id: user?.merchant_id || null,
        vehicle_id: user?.vehicle_id || null,
        organization_id: user?.organization_id || null,
    };

    /**
     * Load user from stored token on mount
     */
    useEffect(() => {
        const loadUser = () => {
            try {
                const storedToken = getToken();
                const storedUser = getStoredUser();

                if (storedToken && storedUser) {
                    setToken(storedToken);
                    setUser(storedUser);
                }
            } catch (error) {
                console.error('[AuthContext] Error loading user:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUser();
    }, []);

    /**
     * Login handler - updates context after successful login
     */
    const login = useCallback((userData, accessToken) => {
        setUser(userData);
        setToken(accessToken || getToken());
    }, []);

    /**
     * Logout handler - clears all auth state
     */
    const logout = useCallback(() => {
        authLogout();
        setUser(null);
        setToken(null);
    }, []);

    /**
     * Refresh user data from storage
     */
    const refreshUser = useCallback(() => {
        const storedUser = getStoredUser();
        if (storedUser) {
            setUser(storedUser);
        }
    }, []);

    /**
     * Get scope params for API requests
     * These should be automatically added to all API calls
     */
    const getScopeParams = useCallback(() => {
        if (!user) return {};
        return buildScopeParams(user);
    }, [user]);

    const value = {
        user,
        role,
        permissions,
        userScopes,
        token,
        isLoading,
        isLoggedIn: !!user && !!token,

        // Methods
        login,
        logout,
        refreshUser,
        getScopeParams,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

/**
 * useAuth Hook
 * Access auth context from any component
 */
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;

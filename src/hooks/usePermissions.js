/**
 * usePermissions Hook
 * Provides permission checking with compound rules support
 * 
 * Usage:
 *   const { canView, canCreate, canEdit, canDelete, isReadOnly } = usePermissions();
 *   if (canView('orders', { facility_id: 1 })) { ... }
 */

import { useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import {
    canView as checkCanView,
    canCreate as checkCanCreate,
    canEdit as checkCanEdit,
    canDelete as checkCanDelete,
    isReadOnly as checkIsReadOnly,
    getDataScope,
    canViewWithScope,
    DATA_SCOPE,
} from '../utils/permissions.js';

export function usePermissions() {
    const { user, role, permissions, userScopes } = useAuth();

    /**
     * Check if user can view a resource
     * @param {string} resource - Resource name
     * @param {Object} scope - Optional scope constraints { facility_id, etc }
     */
    const canView = useCallback((resource, scope = {}) => {
        if (!role) return false;

        // If scope is provided, use compound check
        if (Object.keys(scope).length > 0 && user) {
            return canViewWithScope(resource, scope, user);
        }

        return checkCanView(role, resource);
    }, [role, user]);

    /**
     * Check if user can create a resource
     */
    const canCreate = useCallback((resource) => {
        if (!role) return false;
        return checkCanCreate(role, resource);
    }, [role]);

    /**
     * Check if user can edit a resource
     */
    const canEdit = useCallback((resource) => {
        if (!role) return false;
        return checkCanEdit(role, resource);
    }, [role]);

    /**
     * Check if user can delete a resource
     */
    const canDelete = useCallback((resource) => {
        if (!role) return false;
        return checkCanDelete(role, resource);
    }, [role]);

    /**
     * Check if user's role is read-only
     */
    const isReadOnly = useMemo(() => {
        if (!role) return true;
        return checkIsReadOnly(role);
    }, [role]);

    /**
     * Get user's data scope
     */
    const dataScope = useMemo(() => {
        if (!role) return DATA_SCOPE.PERSONAL;
        return getDataScope(role);
    }, [role]);

    /**
     * Check if user has global access
     */
    const hasGlobalAccess = useMemo(() => {
        return dataScope === DATA_SCOPE.GLOBAL;
    }, [dataScope]);

    /**
     * Check if action is allowed for current scope
     */
    const canPerformInScope = useCallback((action, resource, targetScope = {}) => {
        // First check basic permission
        let hasPermission = false;
        switch (action) {
            case 'view':
                hasPermission = canView(resource);
                break;
            case 'create':
                hasPermission = canCreate(resource);
                break;
            case 'edit':
                hasPermission = canEdit(resource);
                break;
            case 'delete':
                hasPermission = canDelete(resource);
                break;
            default:
                return false;
        }

        if (!hasPermission) return false;

        // Global access can do anything
        if (hasGlobalAccess) return true;

        // Check scope match
        if (targetScope.facility_id && userScopes.facility_id) {
            return targetScope.facility_id === userScopes.facility_id;
        }
        if (targetScope.branch_id && userScopes.branch_id) {
            return targetScope.branch_id === userScopes.branch_id;
        }
        if (targetScope.merchant_id && userScopes.merchant_id) {
            return targetScope.merchant_id === userScopes.merchant_id;
        }

        return true;
    }, [canView, canCreate, canEdit, canDelete, hasGlobalAccess, userScopes]);

    return {
        canView,
        canCreate,
        canEdit,
        canDelete,
        isReadOnly,
        dataScope,
        hasGlobalAccess,
        canPerformInScope,
        userScopes,
    };
}

export default usePermissions;

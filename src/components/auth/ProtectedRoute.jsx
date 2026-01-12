/**
 * ProtectedRoute - Route Protection HOC
 * 
 * Prevents access to routes based on user permissions.
 * Logs unauthorized access attempts with severity levels.
 * 
 * Usage:
 *   <ProtectedRoute requiredPermission="orders">
 *     <OrderManagement />
 *   </ProtectedRoute>
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { logUnauthorizedAccess } from '../../services/auditService.js';

function ProtectedRoute({
    children,
    requiredPermission = null,
    allowedRoles = [],
    fallbackPath = '/dashboard',
    requireAuth = true,
}) {
    const { user, isLoggedIn, isLoading } = useAuth();
    const { canView } = usePermissions();
    const location = useLocation();

    // Show loading while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    // Check authentication
    if (requireAuth && !isLoggedIn) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // Check role-based access
    if (allowedRoles.length > 0) {
        const userRole = user?.role?.toLowerCase();
        const isAllowed = allowedRoles.some(role => role.toLowerCase() === userRole);

        if (!isAllowed) {
            // Log unauthorized attempt - LOW severity for route access
            logUnauthorizedAccess(user, location.pathname, 'LOW', {
                type: 'ROUTE_ACCESS',
                allowedRoles,
                userRole,
            });
            return <Navigate to="/403" replace />;
        }
    }

    // Check permission-based access
    if (requiredPermission) {
        if (!canView(requiredPermission)) {
            // Log unauthorized attempt - LOW severity for route access
            logUnauthorizedAccess(user, location.pathname, 'LOW', {
                type: 'PERMISSION_DENIED',
                requiredPermission,
                userRole: user?.role,
            });
            return <Navigate to="/403" replace />;
        }
    }

    return children;
}

export default ProtectedRoute;

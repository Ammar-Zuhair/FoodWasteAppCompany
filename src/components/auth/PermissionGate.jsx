/**
 * PermissionGate - UI Element Protection Component
 * 
 * Conditionally renders children based on user permissions.
 * For read-only roles, can show a message instead of the action element.
 * 
 * Usage:
 *   <PermissionGate action="create" resource="orders">
 *     <button>إضافة طلب</button>
 *   </PermissionGate>
 * 
 *   <PermissionGate action="edit" resource="batches" showReadOnlyMessage>
 *     <button>تعديل</button>
 *   </PermissionGate>
 */

import { usePermissions } from '../../hooks/usePermissions.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

function PermissionGate({
    children,
    action = 'view',  // 'view' | 'create' | 'edit' | 'delete'
    resource,
    scope = {},       // Optional scope for compound checks
    showReadOnlyMessage = false,
    fallback = null,  // Custom fallback component
    readOnlyMessage = null, // Custom read-only message
}) {
    const { canView, canCreate, canEdit, canDelete, isReadOnly, canPerformInScope } = usePermissions();
    const { t } = useLanguage();

    // Determine if action is allowed
    let isAllowed = false;

    // If scope is provided, use compound check
    if (Object.keys(scope).length > 0) {
        isAllowed = canPerformInScope(action, resource, scope);
    } else {
        // Simple permission check
        switch (action) {
            case 'view':
                isAllowed = canView(resource);
                break;
            case 'create':
                isAllowed = canCreate(resource);
                break;
            case 'edit':
                isAllowed = canEdit(resource);
                break;
            case 'delete':
                isAllowed = canDelete(resource);
                break;
            default:
                isAllowed = false;
        }
    }

    // If allowed, render children
    if (isAllowed) {
        return children;
    }

    // If read-only and should show message
    if (isReadOnly && showReadOnlyMessage) {
        const message = readOnlyMessage || t?.('readOnlyAccess') || 'عرض فقط';
        return (
            <span className="text-xs text-slate-400 italic px-2 py-1 bg-slate-800/50 rounded">
                {message}
            </span>
        );
    }

    // Return fallback or nothing
    return fallback;
}

/**
 * ViewGate - Shorthand for view permission
 */
export function ViewGate({ children, resource, scope, fallback }) {
    return (
        <PermissionGate action="view" resource={resource} scope={scope} fallback={fallback}>
            {children}
        </PermissionGate>
    );
}

/**
 * CreateGate - Shorthand for create permission
 */
export function CreateGate({ children, resource, scope, showReadOnlyMessage, fallback }) {
    return (
        <PermissionGate
            action="create"
            resource={resource}
            scope={scope}
            showReadOnlyMessage={showReadOnlyMessage}
            fallback={fallback}
        >
            {children}
        </PermissionGate>
    );
}

/**
 * EditGate - Shorthand for edit permission
 */
export function EditGate({ children, resource, scope, showReadOnlyMessage, fallback }) {
    return (
        <PermissionGate
            action="edit"
            resource={resource}
            scope={scope}
            showReadOnlyMessage={showReadOnlyMessage}
            fallback={fallback}
        >
            {children}
        </PermissionGate>
    );
}

/**
 * DeleteGate - Shorthand for delete permission
 */
export function DeleteGate({ children, resource, scope, fallback }) {
    return (
        <PermissionGate action="delete" resource={resource} scope={scope} fallback={fallback}>
            {children}
        </PermissionGate>
    );
}

export default PermissionGate;

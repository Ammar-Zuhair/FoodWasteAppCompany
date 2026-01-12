/**
 * RoleBadge - Display user role and facility info
 * 
 * Shows the user's role with appropriate styling and optional facility name.
 */

import { getRoleDisplayInfo, getDataScope, DATA_SCOPE, isReadOnly } from '../../utils/permissions.js';
import { useLanguage } from '../../contexts/LanguageContext.jsx';

// Role color mappings
const ROLE_COLORS = {
    admin: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    branch_manager: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    warehouse_manager: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    quality_manager: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    production_manager: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    distribution_manager: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    driver: { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    supermarket: { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
    sales_rep: { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
};

const DEFAULT_COLORS = { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };

function RoleBadge({
    role,
    facilityName = null,
    showScope = false,
    size = 'default', // 'small' | 'default' | 'large'
    showReadOnly = true,
}) {
    const { language } = useLanguage();

    // Get role display info
    const roleDisplay = getRoleDisplayInfo(role);
    const roleName = language === 'ar' ? roleDisplay.ar : roleDisplay.en;

    // Get colors
    const roleKey = role?.toLowerCase();
    const colors = ROLE_COLORS[roleKey] || DEFAULT_COLORS;

    // Check if read-only
    const roleIsReadOnly = isReadOnly(role);

    // Get data scope
    const dataScope = getDataScope(role);
    const scopeLabels = {
        [DATA_SCOPE.GLOBAL]: language === 'ar' ? 'عام' : 'Global',
        [DATA_SCOPE.ORGANIZATION]: language === 'ar' ? 'المنظمة' : 'Organization',
        [DATA_SCOPE.FACILITY]: language === 'ar' ? 'المنشأة' : 'Facility',
        [DATA_SCOPE.BRANCH]: language === 'ar' ? 'الفرع' : 'Branch',
        [DATA_SCOPE.VEHICLE]: language === 'ar' ? 'المركبة' : 'Vehicle',
        [DATA_SCOPE.MERCHANT]: language === 'ar' ? 'المتجر' : 'Store',
        [DATA_SCOPE.PERSONAL]: language === 'ar' ? 'شخصي' : 'Personal',
    };

    // Size classes
    const sizeClasses = {
        small: 'px-2 py-0.5 text-xs',
        default: 'px-3 py-1 text-xs',
        large: 'px-4 py-1.5 text-sm',
    };

    return (
        <div className={`inline-flex items-center gap-2 ${sizeClasses[size]} rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
            {/* Role Name */}
            <span className="font-medium">
                {roleName}
            </span>

            {/* Facility Name */}
            {facilityName && (
                <>
                    <span className="opacity-50">|</span>
                    <span className="truncate max-w-[120px]" title={facilityName}>
                        {facilityName}
                    </span>
                </>
            )}

            {/* Scope Indicator */}
            {showScope && dataScope !== DATA_SCOPE.GLOBAL && (
                <>
                    <span className="opacity-50">•</span>
                    <span className="opacity-75 text-[10px]">
                        {scopeLabels[dataScope]}
                    </span>
                </>
            )}

            {/* Read-Only Indicator */}
            {showReadOnly && roleIsReadOnly && (
                <span
                    className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-yellow-500/20 text-yellow-400"
                    title={language === 'ar' ? 'عرض فقط' : 'Read Only'}
                >
                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                    </svg>
                </span>
            )}
        </div>
    );
}

/**
 * CompactRoleBadge - Smaller version for tight spaces
 */
export function CompactRoleBadge({ role }) {
    const { language } = useLanguage();
    const roleDisplay = getRoleDisplayInfo(role);
    const roleName = language === 'ar' ? roleDisplay.ar : roleDisplay.en;

    const roleKey = role?.toLowerCase();
    const colors = ROLE_COLORS[roleKey] || DEFAULT_COLORS;

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text}`}>
            {roleName}
        </span>
    );
}

export default RoleBadge;

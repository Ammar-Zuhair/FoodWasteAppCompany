/**
 * MobilePageWrapper - Wrapper for all pages with mobile-optimized styling
 * Provides consistent safe area handling, bottom spacing, and mobile-first design
 */
import { useTheme } from '../contexts/ThemeContext.jsx';
import { useLanguage } from '../contexts/LanguageContext.jsx';

function MobilePageWrapper({ children, title, subtitle, showHeader = true, headerActions = null }) {
    const { theme } = useTheme();
    const { language, t } = useLanguage();

    // Theme classes
    const textColor = theme === 'dark' ? 'text-white' : 'text-slate-800';
    const subTextColor = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
    const cardBg = theme === 'dark'
        ? 'bg-slate-900/80 border-slate-700/50'
        : 'bg-white/90 border-slate-200/50';

    return (
        <div
            className="page-content touch-scroll hide-scrollbar"
            dir={language === 'ar' ? 'rtl' : 'ltr'}
            style={{
                paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 100px)',
                minHeight: 'calc(100vh - 80px)',
            }}
        >
            {/* Page Header */}
            {showHeader && title && (
                <div className="mb-6">
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="min-w-0">
                            <h1 className={`text-xl md:text-2xl font-bold ${textColor} truncate`}>
                                {title}
                            </h1>
                            {subtitle && (
                                <p className={`text-sm ${subTextColor} mt-1`}>
                                    {subtitle}
                                </p>
                            )}
                        </div>
                        {headerActions && (
                            <div className="flex items-center gap-2 shrink-0">
                                {headerActions}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Page Content */}
            <div className="space-y-4">
                {children}
            </div>

            {/* Bottom Safe Spacer */}
            <div className="bottom-spacer" />
        </div>
    );
}

/**
 * MobileCard - Mobile-optimized card component
 */
export function MobileCard({ children, onClick, className = '', noPadding = false }) {
    const { theme } = useTheme();

    const cardClass = theme === 'dark'
        ? 'bg-slate-900/80 border-slate-700/50 backdrop-blur-xl'
        : 'bg-white/90 border-slate-200/50 backdrop-blur-xl';

    return (
        <div
            onClick={onClick}
            className={`
        rounded-2xl border shadow-lg transition-all duration-200
        ${cardClass}
        ${onClick ? 'cursor-pointer active:scale-[0.98] hover:shadow-xl' : ''}
        ${noPadding ? '' : 'p-4'}
        ${className}
      `}
        >
            {children}
        </div>
    );
}

/**
 * MobileStatCard - Mobile-optimized statistics card
 */
export function MobileStatCard({
    icon,
    title,
    value,
    unit,
    trend,
    trendDirection,
    color = 'cyan',
    onClick
}) {
    const { theme } = useTheme();
    const { language } = useLanguage();

    const colors = {
        cyan: { bg: 'from-cyan-500/20 to-cyan-600/20', text: 'text-cyan-500', border: 'border-cyan-500/30' },
        emerald: { bg: 'from-emerald-500/20 to-emerald-600/20', text: 'text-emerald-500', border: 'border-emerald-500/30' },
        red: { bg: 'from-red-500/20 to-red-600/20', text: 'text-red-500', border: 'border-red-500/30' },
        amber: { bg: 'from-amber-500/20 to-amber-600/20', text: 'text-amber-500', border: 'border-amber-500/30' },
        blue: { bg: 'from-blue-500/20 to-blue-600/20', text: 'text-blue-500', border: 'border-blue-500/30' },
        purple: { bg: 'from-purple-500/20 to-purple-600/20', text: 'text-purple-500', border: 'border-purple-500/30' },
    };

    const colorScheme = colors[color] || colors.cyan;
    const textColor = theme === 'dark' ? 'text-white' : 'text-slate-800';
    const subTextColor = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

    return (
        <div
            onClick={onClick}
            className={`
        relative overflow-hidden rounded-2xl p-4 
        bg-gradient-to-br ${colorScheme.bg} 
        border ${colorScheme.border}
        backdrop-blur-xl shadow-lg
        transition-all duration-200
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
      `}
        >
            {/* Background Decoration */}
            <div
                className={`absolute top-0 ${language === 'ar' ? 'left-0' : 'right-0'} w-16 h-16 rounded-full opacity-30 blur-xl`}
                style={{ background: `var(--${color}-500, #06b6d4)` }}
            />

            <div className="relative">
                {/* Icon & Title */}
                <div className="flex items-center gap-2 mb-3">
                    {icon && (
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorScheme.text} bg-white/10`}>
                            {icon}
                        </div>
                    )}
                    <span className={`text-xs font-medium ${subTextColor} uppercase tracking-wide`}>
                        {title}
                    </span>
                </div>

                {/* Value */}
                <div className={`text-2xl font-bold ${textColor}`}>
                    {typeof value === 'number' ? value.toLocaleString() : value}
                    {unit && <span className={`text-sm ${subTextColor} mr-1`}>{unit}</span>}
                </div>

                {/* Trend */}
                {trend !== undefined && (
                    <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trendDirection === 'up' ? 'text-emerald-500' :
                            trendDirection === 'down' ? 'text-red-500' :
                                subTextColor
                        }`}>
                        {trendDirection === 'up' && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                            </svg>
                        )}
                        {trendDirection === 'down' && (
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                            </svg>
                        )}
                        {trend}%
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * MobileList - Mobile-optimized list container
 */
export function MobileList({ children, className = '' }) {
    return (
        <div className={`space-y-2 ${className}`}>
            {children}
        </div>
    );
}

/**
 * MobileListItem - Mobile-optimized list item
 */
export function MobileListItem({
    icon,
    title,
    subtitle,
    rightContent,
    onClick,
    className = ''
}) {
    const { theme } = useTheme();
    const textColor = theme === 'dark' ? 'text-white' : 'text-slate-800';
    const subTextColor = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';

    return (
        <div
            onClick={onClick}
            className={`
        mobile-list-item rounded-xl p-3
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
        ${className}
      `}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                {icon && (
                    <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100'
                        }`}>
                        {icon}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${textColor} truncate`}>
                        {title}
                    </div>
                    {subtitle && (
                        <div className={`text-xs ${subTextColor} truncate`}>
                            {subtitle}
                        </div>
                    )}
                </div>
                {rightContent && (
                    <div className="shrink-0">
                        {rightContent}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * MobileButton - Mobile-optimized button component
 */
export function MobileButton({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    icon = null,
    disabled = false,
    className = ''
}) {
    const { theme } = useTheme();

    const variants = {
        primary: 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25',
        secondary: theme === 'dark'
            ? 'bg-slate-700 text-white hover:bg-slate-600'
            : 'bg-slate-200 text-slate-700 hover:bg-slate-300',
        danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25',
        ghost: theme === 'dark'
            ? 'text-white hover:bg-slate-700/50'
            : 'text-slate-700 hover:bg-slate-100',
    };

    const sizes = {
        sm: 'px-3 py-2 text-xs',
        md: 'px-4 py-3 text-sm',
        lg: 'px-6 py-4 text-base',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        touch-btn rounded-xl font-semibold transition-all duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
        ${className}
      `}
        >
            <div className="flex items-center justify-center gap-2">
                {icon}
                {children}
            </div>
        </button>
    );
}

/**
 * FloatingActionButton - FAB for mobile
 */
export function FloatingActionButton({ onClick, icon, color = 'cyan' }) {
    const colors = {
        cyan: 'from-cyan-500 to-cyan-600',
        emerald: 'from-emerald-500 to-emerald-600',
        blue: 'from-blue-500 to-blue-600',
    };

    return (
        <button
            onClick={onClick}
            className={`
        fab bg-gradient-to-r ${colors[color] || colors.cyan}
        text-white shadow-2xl
        active:scale-95 hover:shadow-3xl
      `}
        >
            {icon || (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
            )}
        </button>
    );
}

/**
 * MobileModal - Bottom sheet style modal
 */
export function MobileModal({ isOpen, onClose, title, children }) {
    const { theme } = useTheme();
    const { language } = useLanguage();
    const textColor = theme === 'dark' ? 'text-white' : 'text-slate-800';

    if (!isOpen) return null;

    return (
        <div
            className="mobile-modal-overlay"
            onClick={onClose}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
            <div
                className="mobile-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Handle Bar */}
                <div className="flex justify-center mb-4">
                    <div className={`w-12 h-1 rounded-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-300'}`} />
                </div>

                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-bold ${textColor}`}>{title}</h3>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-xl ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="overflow-y-auto max-h-[70vh] touch-scroll hide-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}

/**
 * MobileSkeleton - Loading skeleton for mobile
 */
export function MobileSkeleton({ variant = 'card', count = 1 }) {
    const skeletons = Array(count).fill(0);

    const variants = {
        card: (
            <div className="skeleton rounded-2xl h-32 w-full" />
        ),
        listItem: (
            <div className="flex items-center gap-3 p-3">
                <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1">
                    <div className="skeleton h-4 w-3/4 mb-2" />
                    <div className="skeleton h-3 w-1/2" />
                </div>
            </div>
        ),
        stat: (
            <div className="skeleton rounded-2xl h-24 w-full" />
        ),
    };

    return (
        <div className="space-y-3">
            {skeletons.map((_, i) => (
                <div key={i}>{variants[variant]}</div>
            ))}
        </div>
    );
}

export default MobilePageWrapper;

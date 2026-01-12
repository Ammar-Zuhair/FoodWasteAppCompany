import { useMemo, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import {
    MdFactory,
    MdInventory2,
    MdLocalShipping,
    MdTransform,
    MdStore,
    MdMoving,
    MdOutlineShoppingCart,
    MdWarning,
    MdLocationOn,
    MdThermostat,
    MdErrorOutline,
    MdTimeline
} from "react-icons/md";

function ProductJourney({ journey, loading }) {
    const { theme } = useTheme();
    const { language } = useLanguage();
    const [selectedViolation, setSelectedViolation] = useState(null);

    const textColor = theme === "dark" ? "#e2e8f0" : "#053F5C";
    const subTextColor = theme === "dark" ? "#94a3b8" : "#429EBD";
    const borderClass = theme === "dark" ? "border-white/10" : "border-slate-200";
    const cardBgClass = theme === "dark"
        ? "bg-slate-900/80 backdrop-blur-xl"
        : "bg-white/90 backdrop-blur-xl shadow-lg";

    // Journey stage icons and colors
    const stageConfig = {
        production: {
            icon: MdFactory,
            color: "#3b82f6",
            label: language === "ar" ? "المصنع" : "Factory",
            order: 1
        },
        warehouse_in: {
            icon: MdInventory2,
            color: "#8b5cf6",
            label: language === "ar" ? "مخزن الشركة" : "Company Warehouse",
            order: 2
        },
        dispatch: {
            icon: MdLocalShipping,
            color: "#f59e0b",
            label: language === "ar" ? "شاحنة الشركة" : "Company Truck",
            order: 3
        },
        transfer: {
            icon: MdTransform,
            color: "#06b6d4",
            label: language === "ar" ? "نقل" : "Transfer",
            order: 4
        },
        delivery: {
            icon: MdStore,
            color: "#10b981",
            label: language === "ar" ? "الموزع" : "Distributor",
            order: 5
        },
        distributor_truck: {
            icon: MdMoving,
            color: "#ec4899",
            label: language === "ar" ? "شاحنة الموزع" : "Distributor Truck",
            order: 6
        },
        retail: {
            icon: MdOutlineShoppingCart,
            color: "#84cc16",
            label: language === "ar" ? "السوبرماركت" : "Supermarket",
            order: 7
        }
    };

    // Process journey stages
    const journeyStages = useMemo(() => {
        if (journey?.journey_stages && journey.journey_stages.length > 0) {
            return journey.journey_stages.map((stage, index) => {
                const config = stageConfig[stage.movement_type] || {
                    icon: MdLocationOn,
                    color: "#6b7280",
                    label: stage.location_name || "غير معروف",
                    order: 99
                };

                // Check for violations
                const hasViolation = stage.has_issue ||
                    (stage.temperature && (stage.temperature > 8 || stage.temperature < 0));

                return {
                    ...stage,
                    config,
                    hasViolation,
                    violationDetails: hasViolation ? {
                        type: stage.temperature > 8 ? 'temperature_high' : stage.temperature < 0 ? 'temperature_low' : 'other',
                        description: stage.temperature > 8
                            ? (language === "ar" ? `درجة الحرارة مرتفعة: ${stage.temperature}°C` : `High temperature: ${stage.temperature}°C`)
                            : stage.temperature < 0
                                ? (language === "ar" ? `درجة الحرارة منخفضة جداً: ${stage.temperature}°C` : `Temperature too low: ${stage.temperature}°C`)
                                : (language === "ar" ? 'مشكلة في المرحلة' : 'Stage issue'),
                        location: stage.location_name,
                        time: stage.timestamp
                    } : null
                };
            });
        }
        return [];
    }, [journey, language]);

    // Current locations with waste highlighting
    const currentLocations = useMemo(() => {
        if (!journey?.current_locations) return [];
        return journey.current_locations.map(loc => ({
            ...loc,
            hasViolation: loc.has_waste || loc.wasted_quantity > 0
        }));
    }, [journey]);

    const wasteEvents = journey?.waste_events || [];

    // Generate default stages if no journey data
    const defaultStages = useMemo(() => [
        { type: "production", ...stageConfig.production },
        { type: "warehouse_in", ...stageConfig.warehouse_in },
        { type: "dispatch", ...stageConfig.dispatch },
        { type: "delivery", ...stageConfig.delivery },
        { type: "retail", ...stageConfig.retail },
    ], [language]);

    if (loading) {
        return (
            <div className={`p-8 rounded-xl border ${borderClass} ${cardBgClass} animate-pulse`}>
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
                <div className="flex items-center justify-between gap-4">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="flex flex-col items-center flex-1">
                            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                            <div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded mt-3"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!journey) {
        return (
            <div className={`p-8 rounded-xl border ${borderClass} ${cardBgClass} text-center`}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                </div>
                <p className="text-lg font-semibold" style={{ color: textColor }}>
                    {language === "ar" ? "اختر دفعة لعرض رحلتها" : "Select a batch to view its journey"}
                </p>
                <p className="text-sm mt-2" style={{ color: subTextColor }}>
                    {language === "ar" ? "اضغط على أيقونة الساعة بجانب أي دفعة" : "Click the clock icon next to any batch"}
                </p>
            </div>
        );
    }

    const displayStages = journeyStages.length > 0 ? journeyStages : null;

    return (
        <div className={`p-6 rounded-xl border ${borderClass} ${cardBgClass} space-y-6`}>
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: textColor }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {language === "ar" ? "رحلة المنتج" : "Product Journey"}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: subTextColor }}>
                        {journey.product_name} - {journey.batch_code}
                    </p>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                    {journey.risk_score > 0 && (
                        <div className={`px-4 py-2 rounded-lg ${journey.risk_score >= 0.8 ? 'bg-red-500/20 text-red-500' :
                            journey.risk_score >= 0.5 ? 'bg-amber-500/20 text-amber-500' :
                                'bg-emerald-500/20 text-emerald-500'
                            }`}>
                            <span className="text-sm font-bold">
                                {language === "ar" ? "المخاطر:" : "Risk:"} {Math.round(journey.risk_score * 100)}%
                            </span>
                        </div>
                    )}
                    {journey.expiry_date && (
                        <div className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                            <span className="text-sm" style={{ color: subTextColor }}>
                                {language === "ar" ? "الانتهاء:" : "Expiry:"} {new Date(journey.expiry_date).toLocaleDateString()}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Journey Timeline */}
            {displayStages ? (
                <div className="relative py-4">
                    {/* Timeline Line */}
                    <div className="absolute top-12 left-0 right-0 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>

                    {/* Progress line for completed stages */}
                    <div
                        className="absolute top-12 left-0 h-1.5 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${(journeyStages.length / 5) * 100}%` }}
                    ></div>

                    {/* Stages */}
                    <div className="relative flex items-start justify-between gap-2 overflow-x-auto pb-4">
                        {displayStages.map((stage, index) => (
                            <div key={index} className="flex flex-col items-center flex-1 min-w-[100px]">
                                {/* Stage Icon - clickable if has violation */}
                                <button
                                    onClick={() => stage.hasViolation && setSelectedViolation(stage.violationDetails)}
                                    disabled={!stage.hasViolation}
                                    className={`w-20 h-20 rounded-full flex items-center justify-center border-4 z-10 transition-all shadow-lg ${stage.hasViolation
                                        ? 'border-red-500 bg-red-100 dark:bg-red-900/30 cursor-pointer hover:scale-110 animate-pulse'
                                        : 'border-white dark:border-slate-800 cursor-default shadow-indigo-500/10'
                                        }`}
                                    style={{
                                        backgroundColor: stage.hasViolation ? undefined : `${stage.config.color}15`,
                                        color: stage.hasViolation ? '#ef4444' : stage.config.color
                                    }}
                                    title={stage.hasViolation ? (language === "ar" ? "اضغط لعرض التفاصيل" : "Click for details") : ""}
                                >
                                    {stage.hasViolation ? <MdWarning size={36} /> : <stage.config.icon size={36} />}
                                </button>

                                {/* Stage Info */}
                                <div className="mt-3 text-center">
                                    <div
                                        className={`text-sm font-bold truncate max-w-[120px] ${stage.hasViolation ? 'text-red-500' : ''}`}
                                        style={{ color: stage.hasViolation ? undefined : textColor }}
                                    >
                                        {stage.location_name || stage.config.label}
                                    </div>
                                    {stage.timestamp && (
                                        <div className="text-xs" style={{ color: subTextColor }}>
                                            {new Date(stage.timestamp).toLocaleDateString()}
                                        </div>
                                    )}
                                    {stage.temperature !== null && stage.temperature !== undefined && (
                                        <div className={`text-xs font-bold mt-1 flex items-center justify-center gap-1 ${stage.hasViolation ? 'text-red-500' : 'text-emerald-500'}`}>
                                            <MdThermostat size={14} /> {stage.temperature}°C
                                        </div>
                                    )}
                                    {stage.hasViolation && (
                                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-red-500 text-white font-bold animate-pulse">
                                            {language === "ar" ? "تجاوز!" : "Violation!"}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                /* Default placeholder stages */
                <div className="relative py-4">
                    <div className="absolute top-12 left-0 right-0 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    <div className="relative flex items-start justify-between">
                        {defaultStages.map((stage, index) => (
                            <div key={index} className="flex flex-col items-center flex-1">
                                <div
                                    className="w-16 h-16 rounded-full flex items-center justify-center border-4 border-white dark:border-slate-800 z-10 bg-slate-100 dark:bg-slate-800 shadow-sm"
                                    style={{ color: stage.color }}
                                >
                                    <stage.icon size={28} />
                                </div>
                                <div className="mt-3 text-center">
                                    <div className="text-sm font-bold" style={{ color: subTextColor }}>
                                        {stage.label}
                                    </div>
                                    <div className="text-xs" style={{ color: subTextColor }}>
                                        {language === "ar" ? "لا توجد بيانات" : "No data"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Violation Details Modal */}
            {selectedViolation && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedViolation(null)}
                >
                    <div
                        className={`${cardBgClass} rounded-xl border-2 border-red-500 p-6 max-w-md w-full`}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
                                <MdErrorOutline size={32} />
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-red-500">
                                    {language === "ar" ? "تفاصيل التجاوز" : "Violation Details"}
                                </h4>
                                <p className="text-sm" style={{ color: subTextColor }}>
                                    {selectedViolation.location}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-red-900/20" : "bg-red-50"}`}>
                                <div className="text-sm font-bold text-red-500 mb-1">
                                    {language === "ar" ? "المشكلة:" : "Issue:"}
                                </div>
                                <div style={{ color: textColor }}>
                                    {selectedViolation.description}
                                </div>
                            </div>

                            {selectedViolation.time && (
                                <div className="flex items-center gap-2">
                                    <span className="text-sm" style={{ color: subTextColor }}>
                                        {language === "ar" ? "الوقت:" : "Time:"}
                                    </span>
                                    <span className="text-sm font-bold" style={{ color: textColor }}>
                                        {new Date(selectedViolation.time).toLocaleString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSelectedViolation(null)}
                            className="w-full mt-4 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-colors"
                        >
                            {language === "ar" ? "إغلاق" : "Close"}
                        </button>
                    </div>
                </div>
            )}

            {/* Current Locations Summary */}
            {currentLocations.length > 0 && (
                <div className="space-y-3">
                    <h4 className="text-sm font-bold uppercase tracking-wider" style={{ color: subTextColor }}>
                        {language === "ar" ? "المواقع الحالية" : "Current Locations"}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {currentLocations.map((loc, index) => (
                            <div
                                key={index}
                                className={`p-4 rounded-lg border ${borderClass} ${loc.hasViolation ? 'border-l-4 border-l-red-500 bg-red-500/5' : ''
                                    }`}
                                style={{ backgroundColor: loc.hasViolation ? undefined : (theme === "dark" ? "rgba(30,41,59,0.5)" : "rgba(248,250,252,0.8)") }}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="font-semibold" style={{ color: textColor }}>{loc.location_name}</span>
                                    {loc.hasViolation && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-bold">
                                            {language === "ar" ? "هدر" : "Waste"}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4 mt-2">
                                    <div>
                                        <div className="text-lg font-bold" style={{ color: textColor }}>{loc.quantity}</div>
                                        <div className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "وحدة" : "units"}</div>
                                    </div>
                                    <div>
                                        <div className="text-lg font-bold" style={{ color: textColor }}>{loc.carton_count || 0}</div>
                                        <div className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "كرتون" : "cartons"}</div>
                                    </div>
                                    {loc.wasted_quantity > 0 && (
                                        <div>
                                            <div className="text-lg font-bold text-red-500">{loc.wasted_quantity}</div>
                                            <div className="text-xs text-red-400">{language === "ar" ? "مهدر" : "wasted"}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Waste Events Warning */}
            {wasteEvents.length > 0 && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                    <div className="flex items-center gap-3 mb-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        <h4 className="font-bold text-red-500">
                            {language === "ar" ? `تم تسجيل ${wasteEvents.length} حدث هدر` : `${wasteEvents.length} Waste Event(s) Recorded`}
                        </h4>
                    </div>
                    <div className="space-y-2">
                        {wasteEvents.map((event, index) => (
                            <div key={index} className="flex items-center justify-between text-sm p-3 rounded-lg bg-red-500/10">
                                <div>
                                    <span className="font-semibold" style={{ color: textColor }}>
                                        {event.reason || (language === "ar" ? "غير محدد" : "Unknown")}
                                    </span>
                                    {event.detected_at && (
                                        <div className="text-xs" style={{ color: subTextColor }}>
                                            {new Date(event.detected_at).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-bold text-red-500">{event.quantity} {language === "ar" ? "وحدة" : "units"}</span>
                                    {event.cost_loss > 0 && (
                                        <span className="text-red-400 text-xs">{event.cost_loss.toLocaleString()} {language === "ar" ? "ر.ي" : "YER"}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-red-500/20 flex items-center justify-between">
                        <span className="font-bold" style={{ color: textColor }}>
                            {language === "ar" ? "إجمالي الهدر:" : "Total Waste:"}
                        </span>
                        <span className="text-xl font-bold text-red-500">
                            {journey.total_waste} {language === "ar" ? "وحدة" : "units"}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProductJourney;

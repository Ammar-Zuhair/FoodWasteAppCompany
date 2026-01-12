import { useState, useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useInTransitShipments } from "../../hooks/useShipments.js";
import { getStoredUser } from "../../utils/api/auth.js";

/**
 * In-Transit Shipments View
 * 
 * Displays shipments currently in transit with:
 * - Batch codes (instead of shipment number)
 * - Driver and vehicle info
 * - Origin → Destination
 * - Departure time and travel duration
 * - Distance (Haversine calculated)
 * - GPS progress if available
 * - Status indicators (on_track/delayed/critical)
 */
function InTransitShipments({ user: propUser }) {
    const { theme } = useTheme();
    const { language, t } = useLanguage();
    const storedUser = getStoredUser();
    const user = propUser || storedUser;

    const {
        shipments,
        summary,
        loading,
        error,
        reload,
        lastUpdated
    } = useInTransitShipments(user?.organization_id, {
        autoLoad: true,
        refreshInterval: 60000, // Refresh every 60 seconds
        language: language
    });

    // Styling classes
    const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
    const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
    const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
    const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";
    const headerBgClass = theme === "dark" ? "bg-slate-800/50" : "bg-[#E0F7FA]";

    // Status badge component
    const StatusBadge = ({ status }) => {
        const statusConfig = {
            on_track: {
                bg: theme === "dark" ? "bg-emerald-500/20" : "bg-emerald-100",
                text: "text-emerald-500",
                label: language === "ar" ? "في المسار" : "On Track",
                icon: "✓"
            },
            delayed: {
                bg: theme === "dark" ? "bg-amber-500/20" : "bg-amber-100",
                text: "text-amber-500",
                label: language === "ar" ? "متأخر" : "Delayed",
                icon: "⚠"
            },
            critical: {
                bg: theme === "dark" ? "bg-red-500/20" : "bg-red-100",
                text: "text-red-500",
                label: language === "ar" ? "تأخير حرج" : "Critical",
                icon: "⚠"
            }
        };

        const config = statusConfig[status] || statusConfig.on_track;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
                <span>{config.icon}</span>
                {config.label}
            </span>
        );
    };

    // Progress bar component
    const ProgressBar = ({ progress, hasGps }) => {
        if (progress === null || progress === undefined) {
            return (
                <div className={`text-xs ${subTextColor}`}>
                    {language === "ar" ? "لا يوجد GPS" : "No GPS"}
                </div>
            );
        }

        const clampedProgress = Math.min(progress, 100);
        const isOverdue = progress > 100;

        return (
            <div className="w-full">
                <div className={`h-2 rounded-full ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"}`}>
                    <div
                        className={`h-full rounded-full transition-all duration-300 ${isOverdue ? "bg-red-500" : progress > 80 ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                        style={{ width: `${clampedProgress}%` }}
                    />
                </div>
                <div className={`text-xs mt-1 ${isOverdue ? "text-red-500 font-semibold" : subTextColor}`}>
                    {Math.round(progress)}%
                    {hasGps && <span className="ml-1 text-emerald-500">📍</span>}
                </div>
            </div>
        );
    };

    return (
        <div className={`space-y-4 sm:space-y-5 md:space-y-6`} dir={language === "ar" ? "rtl" : "ltr"}>
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className={`text-2xl md:text-4xl font-bold ${textColor} mb-2`}>
                            {language === "ar" ? "الشحنات في الطريق" : "In-Transit Shipments"}
                        </h2>
                        <p className={`text-sm md:text-lg ${subTextColor}`}>
                            {language === "ar" ? "تتبع الشحنات النشطة مع السائقين" : "Track active shipments with drivers"}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {lastUpdated && (
                            <span className={`text-xs ${subTextColor}`}>
                                {language === "ar" ? "آخر تحديث: " : "Last update: "}
                                {lastUpdated.toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US")}
                            </span>
                        )}
                        <button
                            onClick={reload}
                            disabled={loading}
                            className={`p-2 rounded-lg ${theme === "dark" ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-100 hover:bg-slate-200"} transition-colors disabled:opacity-50`}
                        >
                            <svg className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} text-center`}>
                    <div className={`text-3xl font-bold ${textColor}`}>{summary.total_in_transit || 0}</div>
                    <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "في الطريق" : "In Transit"}</div>
                </div>
                <div className={`p-4 rounded-xl border-2 border-emerald-500/30 ${theme === "dark" ? "bg-emerald-500/10" : "bg-emerald-50"} text-center`}>
                    <div className="text-3xl font-bold text-emerald-500">{summary.on_track_count || 0}</div>
                    <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "في المسار" : "On Track"}</div>
                </div>
                <div className={`p-4 rounded-xl border-2 border-amber-500/30 ${theme === "dark" ? "bg-amber-500/10" : "bg-amber-50"} text-center`}>
                    <div className="text-3xl font-bold text-amber-500">{summary.delayed_count || 0}</div>
                    <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "متأخر" : "Delayed"}</div>
                </div>
                <div className={`p-4 rounded-xl border-2 border-red-500/30 ${theme === "dark" ? "bg-red-500/10" : "bg-red-50"} text-center`}>
                    <div className="text-3xl font-bold text-red-500">{summary.critical_count || 0}</div>
                    <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "حرج" : "Critical"}</div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {error}
                </div>
            )}

            {/* Shipments Table */}
            <div className={`rounded-xl border-2 ${borderClass} ${cardBgClass} overflow-hidden shadow-lg`}>
                <div className={`px-6 py-4 border-b ${borderClass} ${headerBgClass} flex items-center justify-between`}>
                    <h3 className={`text-lg font-bold ${textColor} flex items-center gap-2`}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                            <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                        </svg>
                        {language === "ar" ? "الشحنات النشطة" : "Active Shipments"}
                    </h3>
                    <span className={`text-sm ${subTextColor}`}>
                        {shipments.length} {language === "ar" ? "شحنة" : "shipments"}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={`${theme === "dark" ? "bg-slate-800/30" : "bg-slate-50"}`}>
                            <tr>
                                <th className={`px-4 py-4 text-right ${textColor} font-bold text-sm`}>
                                    {language === "ar" ? "رقم الدفعة" : "Batch Code"}
                                </th>
                                <th className={`px-4 py-4 text-right ${textColor} font-bold text-sm`}>
                                    {language === "ar" ? "السائق" : "Driver"}
                                </th>
                                <th className={`px-4 py-4 text-right ${textColor} font-bold text-sm`}>
                                    {language === "ar" ? "من → إلى" : "From → To"}
                                </th>
                                <th className={`px-4 py-4 text-center ${textColor} font-bold text-sm`}>
                                    {language === "ar" ? "وقت الخروج" : "Departure"}
                                </th>
                                <th className={`px-4 py-4 text-center ${textColor} font-bold text-sm`}>
                                    {language === "ar" ? "مدة الرحلة" : "Duration"}
                                </th>
                                <th className={`px-4 py-4 text-center ${textColor} font-bold text-sm`}>
                                    {language === "ar" ? "المسافة" : "Distance"}
                                </th>
                                <th className={`px-4 py-4 text-center ${textColor} font-bold text-sm`}>
                                    {language === "ar" ? "التقدم" : "Progress"}
                                </th>
                                <th className={`px-4 py-4 text-center ${textColor} font-bold text-sm`}>
                                    {language === "ar" ? "الحالة" : "Status"}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && shipments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className={`px-4 py-12 text-center ${subTextColor}`}>
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            {language === "ar" ? "جاري التحميل..." : "Loading..."}
                                        </div>
                                    </td>
                                </tr>
                            ) : shipments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className={`px-4 py-12 text-center ${subTextColor}`}>
                                        <div className="flex flex-col items-center gap-2">
                                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="opacity-50">
                                                <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                                <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
                                            </svg>
                                            {language === "ar" ? "لا توجد شحنات في الطريق حالياً" : "No shipments in transit"}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                shipments.map((shipment) => {
                                    const statusBorder =
                                        shipment.status === "critical" ? "border-l-red-500" :
                                            shipment.status === "delayed" ? "border-l-amber-500" :
                                                "border-l-emerald-500";

                                    return (
                                        <tr
                                            key={shipment.id}
                                            className={`border-t ${borderClass} border-l-4 ${statusBorder} hover:${theme === "dark" ? "bg-slate-800/30" : "bg-slate-50"} transition-colors`}
                                        >
                                            {/* Batch Codes */}
                                            <td className="px-4 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {shipment.batch_codes?.length > 0 ? (
                                                        shipment.batch_codes.map((code, idx) => (
                                                            <span
                                                                key={idx}
                                                                className={`px-2 py-1 rounded text-xs font-mono ${theme === "dark" ? "bg-slate-700" : "bg-slate-100"} ${textColor}`}
                                                            >
                                                                {code}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className={`text-sm ${subTextColor}`}>—</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Driver */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-[#429EBD]/20 flex items-center justify-center">
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#429EBD" strokeWidth="2">
                                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div className={`text-sm font-semibold ${textColor}`}>{shipment.driver?.name || "—"}</div>
                                                        {shipment.vehicle && (
                                                            <div className={`text-xs ${subTextColor}`}>{shipment.vehicle.plate_number}</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* From → To */}
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm ${textColor}`}>{shipment.from_facility?.name || "—"}</span>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={subTextColor}>
                                                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                                                    </svg>
                                                    <span className={`text-sm ${textColor}`}>{shipment.to_facility?.name || "—"}</span>
                                                </div>
                                            </td>

                                            {/* Departure Time */}
                                            <td className={`px-4 py-4 text-center text-sm ${textColor}`}>
                                                {shipment.departure_time ? (
                                                    new Date(shipment.departure_time).toLocaleTimeString(
                                                        language === "ar" ? "ar-SA" : "en-US",
                                                        { hour: '2-digit', minute: '2-digit' }
                                                    )
                                                ) : "—"}
                                            </td>

                                            {/* Travel Duration */}
                                            <td className={`px-4 py-4 text-center`}>
                                                <span className={`text-sm font-semibold ${shipment.status === "critical" ? "text-red-500" :
                                                        shipment.status === "delayed" ? "text-amber-500" :
                                                            textColor
                                                    }`}>
                                                    {shipment.travel_duration_formatted || "—"}
                                                </span>
                                            </td>

                                            {/* Distance */}
                                            <td className={`px-4 py-4 text-center text-sm ${textColor}`}>
                                                {shipment.distance_km > 0 ? (
                                                    <>
                                                        {shipment.distance_km} <span className={`text-xs ${subTextColor}`}>
                                                            {language === "ar" ? "كم" : "km"}
                                                        </span>
                                                    </>
                                                ) : "—"}
                                            </td>

                                            {/* Progress */}
                                            <td className="px-4 py-4" style={{ minWidth: '100px' }}>
                                                <ProgressBar
                                                    progress={shipment.progress_percent}
                                                    hasGps={shipment.has_gps}
                                                />
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-4 text-center">
                                                <StatusBadge status={shipment.status} />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default InTransitShipments;

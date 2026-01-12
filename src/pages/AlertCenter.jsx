import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import AlertCard from "../components/shared/AlertCard.jsx";
import { BellIcon, WarningIcon, LightningIcon, InfoIcon } from "../components/shared/Icons.jsx";
import { useAlerts } from "../hooks/useAlerts.js";

function AlertCenter() {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  // Filter state
  const [selectedSeverity, setSelectedSeverity] = useState("");
  const [selectedEntityType, setSelectedEntityType] = useState("");
  const [selectedViolationType, setSelectedViolationType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  // Build filters object
  const filters = useMemo(() => {
    const f = {};
    if (selectedSeverity) f.severity = selectedSeverity;
    if (selectedEntityType) f.entity_type = selectedEntityType;
    if (selectedViolationType) f.violation_type = selectedViolationType;
    if (selectedStatus) f.status = selectedStatus;
    return f;
  }, [selectedSeverity, selectedEntityType, selectedViolationType, selectedStatus]);

  const {
    alerts: apiAlerts,
    stats,
    lookups,
    pagination,
    loading,
    error,
    reload,
    acknowledge,
    resolve
  } = useAlerts(filters, { autoLoad: true, pollInterval: 30000 });

  // Map API alerts to display format
  const alerts = useMemo(() => {
    if (!apiAlerts || apiAlerts.length === 0) {
      return [];
    }

    return apiAlerts.map((alert) => ({
      ...alert,
      id: alert.id,
      type: alert.entity_type || alert.source_type || "system",
      severity: alert.severity || "medium",
      status: alert.status || "open",
      title: alert.title || "",
      message: alert.message || "",
      timestamp: alert.created_at,
      violationType: alert.violation_type,
      violationName: alert.violation_type_name,
      entityType: alert.entity_type,
      entityName: alert.entity_name,
      logType: alert.log_type,
      logId: alert.log_id,
      actionLabel: language === "ar" ? "عرض التفاصيل" : "View Details",
      onAction: () => handleAlertClick(alert),
    }));
  }, [apiAlerts, language]);

  const handleAlertClick = useCallback((alert) => {
    // Navigate based on entity_type or source_type
    if (alert.entity_type === "truck") {
      navigate(`/vehicles`);
    } else if (alert.entity_type === "company_warehouse" || alert.entity_type === "distributor_warehouse") {
      navigate(`/facilities`);
    } else if (alert.entity_type === "supermarket") {
      navigate(`/supermarkets`);
    } else if (alert.source_type === "batch") {
      navigate(`/batches`);
    } else {
      // Acknowledge the alert if open
      if (alert.status === "open") {
        acknowledge(alert.id);
      }
    }
  }, [navigate, acknowledge]);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  // Statistics - Map database codes to display codes
  // Database: info, warning, error, critical
  // Display: low, medium, high, critical
  const alertStats = useMemo(() => {
    const bySeverity = stats?.by_severity || {};
    const critical = bySeverity.critical?.count || 0;
    const warning = bySeverity.warning?.count || 0;
    const info = bySeverity.info?.count || 0;

    return {
      total: critical + warning + info,
      critical,
      warning,
      info,
    };
  }, [stats]);

  // Get entity type label
  const getEntityTypeLabel = (type) => {
    const labels = {
      truck: language === "ar" ? "شاحنة" : "Truck",
      company_warehouse: language === "ar" ? "مستودع الشركة" : "Company Warehouse",
      distributor_warehouse: language === "ar" ? "مستودع الموزع" : "Distributor Warehouse",
      supermarket: language === "ar" ? "سوبرماركت" : "Supermarket",
    };
    return labels[type] || type;
  };

  // Get severity color - handles both DB codes and display codes
  const getSeverityColor = (severity) => {
    const colors = {
      critical: "text-red-600",
      error: "text-red-500",
      high: "text-red-500",
      warning: "text-amber-500",
      medium: "text-amber-500",
      info: "text-green-500",
      low: "text-green-500",
    };
    return colors[severity] || "text-gray-500";
  };

  if (loading && (!apiAlerts || apiAlerts.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className={`text-lg font-semibold ${textColor}`}>
            {language === "ar" ? "جاري تحميل مركز التنبيهات..." : "Loading alert center..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
        <p className="text-lg font-semibold text-red-500">
          {language === "ar" ? "حدث خطأ أثناء تحميل البيانات" : "Failed to load data"}
        </p>
        <button
          onClick={reload}
          className="px-6 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          {language === "ar" ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Page Header */}
      <div className="mb-8 animate-slide-in">
        <h2 className={`text-4xl font-semibold ${textColor} mb-3 leading-tight tracking-tight`}>
          {language === "ar" ? "مركز التنبيهات" : "Alert Center"}
        </h2>
        <p className={`text-lg ${subTextColor} leading-relaxed font-normal`}>
          {language === "ar"
            ? "مركز التنبيهات المتقدم - مراقبة وإدارة جميع التجاوزات"
            : "Advanced Alert Center - Monitor and manage all violations"}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`rounded-xl border ${borderClass} p-5 ${cardBgClass} backdrop-blur-xl`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${subTextColor} mb-1`}>
                {language === "ar" ? "إجمالي التنبيهات" : "Total Alerts"}
              </p>
              <p className={`text-3xl font-bold ${textColor}`}>{alertStats.total}</p>
            </div>
            <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-blue-500/10" : "bg-blue-50"}`}>
              <BellIcon className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className={`rounded-xl border ${borderClass} p-5 ${cardBgClass} backdrop-blur-xl`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${subTextColor} mb-1`}>
                {language === "ar" ? "حرج" : "Critical"}
              </p>
              <p className="text-3xl font-bold text-red-600">{alertStats.critical}</p>
            </div>
            <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-red-500/10" : "bg-red-50"}`}>
              <WarningIcon className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className={`rounded-xl border ${borderClass} p-5 ${cardBgClass} backdrop-blur-xl`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${subTextColor} mb-1`}>
                {language === "ar" ? "تحذير" : "Warning"}
              </p>
              <p className="text-3xl font-bold text-amber-500">{alertStats.warning}</p>
            </div>
            <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-amber-500/10" : "bg-amber-50"}`}>
              <LightningIcon className="w-6 h-6 text-amber-500" />
            </div>
          </div>
        </div>

        <div className={`rounded-xl border ${borderClass} p-5 ${cardBgClass} backdrop-blur-xl`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${subTextColor} mb-1`}>
                {language === "ar" ? "معلومة" : "Information"}
              </p>
              <p className="text-3xl font-bold text-green-500">{alertStats.info}</p>
            </div>
            <div className={`p-3 rounded-lg ${theme === "dark" ? "bg-green-500/10" : "bg-green-50"}`}>
              <InfoIcon className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-xl border ${borderClass} p-4 ${cardBgClass} backdrop-blur-xl`}>
        <div className="flex flex-wrap items-center gap-4">
          {/* Entity Type Filter */}
          <div className="flex items-center gap-2">
            <span className={subTextColor}>
              {language === "ar" ? "نوع الجهة:" : "Entity Type:"}
            </span>
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${theme === "dark"
                ? "bg-slate-800 text-white border border-slate-700"
                : "bg-white text-[#053F5C] border border-[#9FE7F5]/40"
                }`}
            >
              <option value="">{language === "ar" ? "الكل" : "All"}</option>
              {lookups.entity_types?.map((et) => (
                <option key={et.code} value={et.code}>
                  {et.name}
                </option>
              ))}
            </select>
          </div>

          {/* Violation Type Filter */}
          <div className="flex items-center gap-2">
            <span className={subTextColor}>
              {language === "ar" ? "نوع التجاوز:" : "Violation Type:"}
            </span>
            <select
              value={selectedViolationType}
              onChange={(e) => setSelectedViolationType(e.target.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${theme === "dark"
                ? "bg-slate-800 text-white border border-slate-700"
                : "bg-white text-[#053F5C] border border-[#9FE7F5]/40"
                }`}
            >
              <option value="">{language === "ar" ? "الكل" : "All"}</option>
              {lookups.violation_types?.map((vt) => (
                <option key={vt.code} value={vt.code}>
                  {vt.name}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <span className={subTextColor}>
              {language === "ar" ? "الخطورة:" : "Severity:"}
            </span>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${theme === "dark"
                ? "bg-slate-800 text-white border border-slate-700"
                : "bg-white text-[#053F5C] border border-[#9FE7F5]/40"
                }`}
            >
              <option value="">{language === "ar" ? "الكل" : "All"}</option>
              {lookups.severities?.filter(s => s.code !== 'error').map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className={subTextColor}>
              {language === "ar" ? "الحالة:" : "Status:"}
            </span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${theme === "dark"
                ? "bg-slate-800 text-white border border-slate-700"
                : "bg-white text-[#053F5C] border border-[#9FE7F5]/40"
                }`}
            >
              <option value="">{language === "ar" ? "الكل" : "All"}</option>
              {lookups.alert_statuses?.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={reload}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${theme === "dark"
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-emerald-500 text-white hover:bg-emerald-600"
              }`}
          >
            {language === "ar" ? "تحديث" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className={`rounded-xl border ${borderClass} p-8 ${cardBgClass} backdrop-blur-xl text-center`}>
            <BellIcon className={`w-12 h-12 mx-auto mb-4 ${subTextColor}`} />
            <p className={textColor}>
              {language === "ar" ? "لا توجد تنبيهات" : "No alerts found"}
            </p>
            <p className={`text-sm ${subTextColor} mt-2`}>
              {language === "ar"
                ? "جميع الأنظمة تعمل بشكل طبيعي"
                : "All systems are operating normally"}
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border ${borderClass} p-5 ${cardBgClass} backdrop-blur-xl cursor-pointer hover:shadow-lg transition-all`}
              onClick={() => alert.onAction?.()}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Severity Badge */}
                    <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${alert.severity === "critical" ? "bg-red-100 text-red-700" :
                      alert.severity === "high" ? "bg-red-50 text-red-600" :
                        alert.severity === "medium" ? "bg-amber-100 text-amber-700" :
                          "bg-green-100 text-green-700"
                      }`}>
                      {lookups.severities?.find(s => s.code === alert.severity)?.name || alert.severity}
                    </span>

                    {/* Entity Type Badge */}
                    {alert.entityType && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"
                        }`}>
                        {getEntityTypeLabel(alert.entityType)}
                      </span>
                    )}

                    {/* Violation Type Badge */}
                    {alert.violationName && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${theme === "dark" ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-600"
                        }`}>
                        {alert.violationName}
                      </span>
                    )}

                    {/* Status Badge */}
                    {alert.status && (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${alert.status === "open" ? "bg-yellow-100 text-yellow-700" :
                        alert.status === "acknowledged" ? "bg-blue-100 text-blue-700" :
                          alert.status === "resolved" ? "bg-green-100 text-green-700" :
                            "bg-gray-100 text-gray-600"
                        }`}>
                        {lookups.alert_statuses?.find(s => s.code === alert.status)?.name || alert.status}
                      </span>
                    )}
                  </div>

                  <h3 className={`text-lg font-semibold ${textColor} mb-1`}>
                    {alert.title}
                  </h3>

                  <p className={`text-sm ${subTextColor} mb-2`}>
                    {alert.message}
                  </p>

                  <div className={`text-xs ${subTextColor} flex items-center gap-4`}>
                    <span>
                      {new Date(alert.timestamp).toLocaleString(language === "ar" ? "ar-SA" : "en-US")}
                    </span>
                    {alert.logType && (
                      <span className="opacity-70">
                        {language === "ar" ? `المصدر: ${alert.logType}` : `Source: ${alert.logType}`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {alert.status === "open" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        acknowledge(alert.id);
                      }}
                      className="px-3 py-1 rounded-lg text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    >
                      {language === "ar" ? "اطلاع" : "Acknowledge"}
                    </button>
                  )}
                  {alert.status !== "resolved" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resolve(alert.id);
                      }}
                      className="px-3 py-1 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                    >
                      {language === "ar" ? "حل" : "Resolve"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Info */}
      {pagination.total > 0 && (
        <div className={`text-center ${subTextColor} text-sm`}>
          {language === "ar"
            ? `عرض ${alerts.length} من ${pagination.total} تنبيه`
            : `Showing ${alerts.length} of ${pagination.total} alerts`}
        </div>
      )}
    </div>
  );
}

export default AlertCenter;

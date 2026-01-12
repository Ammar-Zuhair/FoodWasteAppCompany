import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useAlerts } from "../../hooks/useAlerts.js";

function CommonAlerts() {
  const { theme } = useTheme();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { alerts: apiAlerts, loading } = useAlerts({ status: "open", limit: 3 });

  // Map API alerts to display format - only use real data
  const alerts = useMemo(() => {
    if (loading) {
      // Show loading state - empty array
      return [];
    }

    if (!apiAlerts || apiAlerts.length === 0) {
      // No alerts - return empty array (don't show fallback data)
      return [];
    }

    // Map API alerts to display format
    return apiAlerts.slice(0, 3).map((alert) => {
      // Determine color based on severity
      let tagColor = "amber";
      if (alert.severity === "critical" || alert.severity === "high") {
        tagColor = "red";
      } else if (alert.severity === "low") {
        tagColor = "emerald";
      }

      return {
        id: alert.id,
        title: alert.title || alert.message || "Alert",
        tag: alert.severity || "alert",
        tagColor,
        borderColor: tagColor,
      };
    });
  }, [apiAlerts, loading, t]);

  const getColorClasses = (color) => {
    if (theme === "dark") {
      return {
        amber: {
          border: "border-amber-500/30",
          bg: "bg-amber-500/10",
          text: "text-amber-300",
          tagBg: "bg-amber-500/20",
          tagText: "text-amber-300",
          glow: "shadow-amber-500/20",
          contentText: "text-slate-300",
        },
        red: {
          border: "border-red-500/30",
          bg: "bg-red-500/10",
          text: "text-red-300",
          tagBg: "bg-red-500/20",
          tagText: "text-red-300",
          glow: "shadow-red-500/20",
          contentText: "text-slate-300",
        },
        emerald: {
          border: "border-emerald-500/30",
          bg: "bg-emerald-500/10",
          text: "text-emerald-300",
          tagBg: "bg-emerald-500/20",
          tagText: "text-emerald-300",
          glow: "shadow-emerald-500/20",
          contentText: "text-slate-300",
        },
      }[color];
    } else {
      // ألوان ناعمة ومنسقة للوضع الفاتح
      return {
        amber: {
          border: "border-[#F7AD19]/35",
          bg: "bg-gradient-to-br from-[#FEF3C7]/50 to-[#FDE68A]/30",
          text: "text-[#053F5C]",
          tagBg: "bg-[#F7AD19]/25",
          tagText: "text-[#053F5C]",
          glow: "shadow-[#F7AD19]/15",
          contentText: "text-[#429EBD]",
        },
        red: {
          border: "border-red-300/40",
          bg: "bg-gradient-to-br from-red-50/60 to-red-100/40",
          text: "text-[#053F5C]",
          tagBg: "bg-red-100/60",
          tagText: "text-[#053F5C]",
          glow: "shadow-red-200/20",
          contentText: "text-[#429EBD]",
        },
        emerald: {
          border: "border-[#429EBD]/35",
          bg: "bg-gradient-to-br from-[#9FE7F5]/40 to-[#E0F7FA]/30",
          text: "text-[#053F5C]",
          tagBg: "bg-[#429EBD]/25",
          tagText: "text-[#053F5C]",
          glow: "shadow-[#429EBD]/15",
          contentText: "text-[#429EBD]",
        },
      }[color];
    }
  };

  return (
    <div className="grid gap-3 sm:gap-4 md:gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 mb-5 md:mb-6">
      {loading ? (
        // حالة التحميل
        <div className={`col-span-full p-4 rounded-xl border ${theme === "dark" ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"} text-center`}>
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-t-transparent border-[#429EBD] rounded-full animate-spin" />
            <span className={theme === "dark" ? "text-slate-400" : "text-slate-500"}>
              {language === "ar" ? "جاري تحميل التنبيهات..." : "Loading alerts..."}
            </span>
          </div>
        </div>
      ) : alerts.length === 0 ? (
        // لا توجد تنبيهات
        <div
          onClick={() => navigate("/alerts")}
          className={`col-span-full p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${theme === "dark" ? "border-emerald-500/30 bg-emerald-500/10" : "border-[#429EBD]/30 bg-[#429EBD]/10"}`}
        >
          <div className="flex items-center justify-center gap-3">
            <svg className={`w-6 h-6 ${theme === "dark" ? "text-emerald-400" : "text-[#429EBD]"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className={`font-medium ${theme === "dark" ? "text-emerald-300" : "text-[#053F5C]"}`}>
              {language === "ar" ? "لا توجد تنبيهات غير مراجعة" : "No unreviewed alerts"}
            </span>
          </div>
        </div>
      ) : (
        // عرض التنبيهات
        alerts.map((alert, index) => {
          const colors = getColorClasses(alert.tagColor);
          return (
            <div
              key={index}
              onClick={() => navigate("/alerts")}
              className={`group relative overflow-hidden rounded-xl border ${colors.border} ${colors.bg} backdrop-blur-sm p-4 sm:p-4 md:p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${colors.glow} animate-slide-in cursor-pointer`}
              style={{ animationDelay: `${index * 0.1}s` }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate("/alerts");
                }
              }}
              aria-label={`${alert.title} - ${t("clickToViewDetails") || "انقر لعرض التفاصيل"}`}
            >
              {/* تأثير توهج خلفي */}
              <div className={`absolute -inset-1 bg-gradient-to-br ${colors.bg} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-300`} />

              {/* أيقونة سهم للإشارة إلى القابلية للنقر */}
              <div className="absolute top-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ [language === "ar" ? "left" : "right"]: "0.75rem" }}>
                <svg
                  className={`w-4 h-4 ${colors.text} transform ${language === "ar" ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>

              <div className="relative pr-8">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <h3 className={`text-sm sm:text-base md:text-lg font-bold ${colors.text} leading-tight truncate`}>
                      {alert.title}
                    </h3>
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs md:text-sm font-bold ${colors.tagText} ${colors.tagBg} rounded-full px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 border ${colors.border} whitespace-nowrap flex-shrink-0`}
                  >
                    {alert.tag}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default CommonAlerts;

import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import StatusBadge from "./StatusBadge.jsx";

function AlertCard({ title, message, severity, location, timestamp, onAction, actionLabel }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const getSeverityConfig = (severity) => {
    const severityLower = severity?.toLowerCase() || "medium";
    
    if (severityLower === "high" || severityLower === "عالي") {
      return {
        bg: theme === "dark" ? "bg-red-500/10 border-red-500/30" : "bg-red-50 border-red-200",
        text: theme === "dark" ? "text-red-300" : "text-red-700",
        label: "عالي",
      };
    }
    if (severityLower === "medium" || severityLower === "متوسط") {
      return {
        bg: theme === "dark" ? "bg-amber-500/10 border-amber-500/30" : "bg-amber-50 border-amber-200",
        text: theme === "dark" ? "text-amber-300" : "text-amber-700",
        label: "متوسط",
      };
    }
    return {
      bg: theme === "dark" ? "bg-blue-500/10 border-blue-500/30" : "bg-blue-50 border-blue-200",
      text: theme === "dark" ? "text-blue-300" : "text-blue-700",
      label: "منخفض",
    };
  };

  const config = getSeverityConfig(severity);
  const textClass = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextClass = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";

  return (
    <div className={`rounded-lg border p-4 ${config.bg} transition-all duration-300 hover:shadow-lg`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <h4 className={`font-bold ${textClass}`}>
            {title}
          </h4>
        </div>
        <StatusBadge status={severity} size="sm" />
      </div>
      <p className={`text-sm ${config.text} mb-3 leading-relaxed`}>
        {message}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs">
          {location && (
            <span className={subTextClass}>
              {language === "ar" ? "الموقع:" : "Location:"} {location}
            </span>
          )}
          {timestamp && (
            <span className={subTextClass}>
              {language === "ar" ? "الوقت:" : "Time:"} {timestamp}
            </span>
          )}
        </div>
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
              theme === "dark"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
                : "bg-emerald-500 text-white hover:bg-emerald-600"
            }`}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default AlertCard;


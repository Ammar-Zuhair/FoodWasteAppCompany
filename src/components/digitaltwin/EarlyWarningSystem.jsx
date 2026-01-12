import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useMemo } from "react";

function EarlyWarningSystem({ warnings }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const groupedWarnings = useMemo(() => {
    if (!warnings || warnings.length === 0) return {};
    
    return warnings.reduce((acc, warning) => {
      const level = warning.warningLevel;
      if (!acc[level]) {
        acc[level] = [];
      }
      acc[level].push(warning);
      return acc;
    }, {});
  }, [warnings]);

  const getWarningLevelInfo = (level) => {
    switch (level) {
      case "60-days":
        return {
          label: language === "ar" ? "60 يوم" : "60 Days",
          color: theme === "dark" ? "#3b82f6" : "#2563eb",
          bgColor: theme === "dark" ? "rgba(59, 130, 246, 0.15)" : "rgba(37, 99, 235, 0.1)",
        };
      case "30-days":
        return {
          label: language === "ar" ? "30 يوم" : "30 Days",
          color: theme === "dark" ? "#f59e0b" : "#d97706",
          bgColor: theme === "dark" ? "rgba(245, 158, 11, 0.15)" : "rgba(217, 119, 6, 0.1)",
        };
      case "15-days":
        return {
          label: language === "ar" ? "15 يوم" : "15 Days",
          color: theme === "dark" ? "#f97316" : "#ea580c",
          bgColor: theme === "dark" ? "rgba(249, 115, 22, 0.15)" : "rgba(234, 88, 12, 0.1)",
        };
      case "5-days":
        return {
          label: language === "ar" ? "5 أيام" : "5 Days",
          color: theme === "dark" ? "#ef4444" : "#dc2626",
          bgColor: theme === "dark" ? "rgba(239, 68, 68, 0.15)" : "rgba(220, 38, 38, 0.1)",
        };
      default:
        return {
          label: level,
          color: theme === "dark" ? "#6b7280" : "#9ca3af",
          bgColor: theme === "dark" ? "rgba(107, 114, 128, 0.15)" : "rgba(156, 163, 175, 0.1)",
        };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return theme === "dark" ? "#ef4444" : "#dc2626";
      case "medium":
        return theme === "dark" ? "#f59e0b" : "#d97706";
      case "low":
        return theme === "dark" ? "#10b981" : "#059669";
      default:
        return theme === "dark" ? "#6b7280" : "#9ca3af";
    }
  };

  const levels = ["60-days", "30-days", "15-days", "5-days"];

  return (
    <div className="space-y-8">
      <h3 className={`text-2xl font-black ${theme === "dark" ? "text-white" : "text-[#053F5C]"}`}>
        {language === "ar" ? "نظام الإنذار المبكر" : "Early Warning System"}
      </h3>

      {levels.map((level) => {
        const levelWarnings = groupedWarnings[level] || [];
        if (levelWarnings.length === 0) return null;

        const levelInfo = getWarningLevelInfo(level);

        return (
          <div key={level} className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{ 
                  backgroundColor: levelInfo.bgColor,
                  border: `3px solid ${levelInfo.color}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full"
                  style={{ backgroundColor: levelInfo.color }}
                />
              </div>
              <div>
                <h4 className={`text-2xl font-black mb-1 ${theme === "dark" ? "text-white" : "text-[#053F5C]"}`}>
                  {language === "ar" ? `تنبيهات قبل ${levelInfo.label}` : `Warnings ${levelInfo.label} Before`}
                </h4>
                <p className={`text-base font-bold ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                  {levelWarnings.length} {language === "ar" ? "تنبيه" : "warning(s)"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {levelWarnings.map((warning) => (
                <div
                  key={warning.id}
                  className={`rounded-2xl border-2 p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl cursor-pointer ${
                    theme === "dark"
                      ? "bg-slate-900/95 border-white/20 backdrop-blur-xl"
                      : "bg-linear-to-br from-white/95 to-[#F0FAFC]/80 border-[#9FE7F5]/60 backdrop-blur-xl shadow-xl"
                  }`}
                  style={{
                    borderLeftColor: getPriorityColor(warning.priority),
                    borderLeftWidth: "6px",
                    boxShadow: theme === "dark"
                      ? `0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 0 0 1px ${getPriorityColor(warning.priority)}40`
                      : `0 8px 24px rgba(66, 158, 189, 0.15), 0 0 0 1px rgba(159, 231, 245, 0.3), inset 0 0 0 1px ${getPriorityColor(warning.priority)}20`,
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h5 className={`text-xl font-black mb-2 ${theme === "dark" ? "text-white" : "text-[#053F5C]"}`}>
                        {warning.productName}
                      </h5>
                      <p className={`text-base font-bold ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                        {warning.batchId}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className="text-4xl font-black tracking-tight"
                        style={{ color: getPriorityColor(warning.priority) }}
                      >
                        {warning.daysUntilExpiry}
                      </p>
                      <p className={`text-sm font-bold uppercase tracking-wider mt-1 ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                        {language === "ar" ? "يوم متبقي" : "days left"}
                      </p>
                    </div>
                  </div>

                  <p className={`text-base font-semibold mb-4 leading-relaxed ${theme === "dark" ? "text-slate-300" : "text-[#053F5C]"}`}>
                    {warning.message}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t-2" style={{ borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(66, 158, 189, 0.2)" }}>
                    <div>
                      <p className={`text-xs font-black uppercase tracking-widest mb-2 ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                        {language === "ar" ? "الموقع" : "Location"}
                      </p>
                      <p className={`text-base font-bold ${theme === "dark" ? "text-slate-200" : "text-[#053F5C]"}`}>
                        {warning.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-black uppercase tracking-widest mb-2 ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                        {language === "ar" ? "الإجراء المقترح" : "Recommended Action"}
                      </p>
                      <p className={`text-base font-bold ${theme === "dark" ? "text-slate-200" : "text-[#053F5C]"}`}>
                        {warning.recommendedAction}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {Object.keys(groupedWarnings).length === 0 && (
        <div className={`rounded-2xl border-2 p-12 text-center ${theme === "dark" ? "bg-slate-900/80 border-white/10" : "bg-white/50 border-[#9FE7F5]/40"}`}>
          <p className={`text-xl font-bold ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
            {language === "ar" ? "لا توجد تنبيهات حالياً" : "No warnings at the moment"}
          </p>
        </div>
      )}
    </div>
  );
}

export default EarlyWarningSystem;

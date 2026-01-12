import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import DataCard from "../shared/DataCard.jsx";

function ProductionRecommendations({ recommendations }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const textColor = theme === "dark" ? "#e2e8f0" : "#053F5C";
  const subTextColor = theme === "dark" ? "#94a3b8" : "#429EBD";
  const borderColor = theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(66, 158, 189, 0.2)";

  // Use real data or fallback to empty array
  const safeRecommendations = useMemo(() => {
    if (recommendations && recommendations.length > 0) {
      return recommendations.map(rec => ({
        id: rec.id,
        title: rec.title,
        description: rec.description,
        impact: rec.priority || "medium", // Use priority for coloring/impact
        priority: rec.priority || "medium",
        estimatedSavings: rec.expectedSavings || 0,
        action: rec.status === 'planning' ? (language === "ar" ? "تنفيذ" : "Execute") : (language === "ar" ? "مراجعة" : "Review"),
        // Additional fields from backend
        category: rec.category,
        confidence: rec.confidence,
        reasoning: rec.reasoning,
        implementationSteps: rec.implementationSteps
      }));
    }
    return [];
  }, [recommendations, language]);

  const getImpactColor = (impact) => {
    switch (impact) {
      case "high":
        return { main: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
      case "medium":
        return { main: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" };
      case "low":
        return { main: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
      default:
        return { main: "#6b7280", bg: "rgba(107, 114, 128, 0.15)" };
    }
  };

  const getImpactLabel = (impact) => {
    switch (impact) {
      case "high":
        return language === "ar" ? "عالي" : "High";
      case "medium":
        return language === "ar" ? "متوسط" : "Medium";
      case "low":
        return language === "ar" ? "منخفض" : "Low";
      default:
        return impact;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      case "medium":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        );
    }
  };

  const [selectedRec, setSelectedRec] = useState(null);

  // Stats
  const stats = useMemo(() => {
    const totalSavings = safeRecommendations.reduce((sum, r) => sum + (r.estimatedSavings || 0), 0);
    const highPriority = safeRecommendations.filter(r => r.priority === "high").length;

    return { totalSavings, highPriority, total: safeRecommendations.length };
  }, [safeRecommendations]);

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold" style={{ color: textColor }}>
          {language === "ar" ? "التوصيات الذكية" : "Smart Recommendations"}
        </h3>
        <div className="flex items-center gap-4">
          <div
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: theme === "dark" ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)" }}
          >
            <span className="text-sm font-medium" style={{ color: "#10b981" }}>
              {language === "ar" ? "توفير متوقع:" : "Expected Savings:"} {stats.totalSavings.toLocaleString()} {language === "ar" ? "ريال" : "YER"}
            </span>
          </div>
        </div>
      </div>

      {/* Recommendations Cards */}
      {safeRecommendations.length === 0 ? (
        <div className="p-10 text-center rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-gray-700">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            {language === "ar" ? "لا توجد توصيات متاحة حالياً. اضغط على 'توليد توصيات جديدة' للبدء." : "No recommendations available. Click 'Generate New Recommendations' to start."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {safeRecommendations.map((rec, index) => {
            const colors = getImpactColor(rec.impact);

            return (
              <div
                key={rec.id || index}
                className={`p-5 rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${theme === "dark" ? "bg-slate-900/80 border-white/10" : "bg-white border-slate-100"
                  }`}
                style={{
                  borderTopWidth: "4px",
                  borderTopColor: colors.main,
                }}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getPriorityIcon(rec.priority)}
                    <h4 className="font-bold text-base line-clamp-1" style={{ color: textColor }} title={rec.title}>
                      {rec.title}
                    </h4>
                  </div>
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full shrink-0"
                    style={{ backgroundColor: colors.bg, color: colors.main }}
                  >
                    {getImpactLabel(rec.impact)}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm mb-4 leading-relaxed line-clamp-3 h-[4.5em]" style={{ color: subTextColor }}>
                  {rec.description}
                </p>

                {/* Footer */}
                <div
                  className="flex items-center justify-between pt-4 border-t"
                  style={{ borderColor }}
                >
                  <div>
                    <div className="text-xs" style={{ color: subTextColor }}>
                      {language === "ar" ? "التوفير المتوقع" : "Est. Savings"}
                    </div>
                    <div className="text-xl font-bold" style={{ color: "#10b981" }}>
                      {rec.estimatedSavings?.toLocaleString()} <span className="text-sm">{language === "ar" ? "ريال" : "YER"}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedRec(selectedRec?.id === rec.id ? null : rec);
                    }}
                    type="button"
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105 ${theme === "dark"
                      ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                      : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                      } ${selectedRec?.id === rec.id ? "ring-2 ring-offset-2 ring-emerald-500" : ""}`}
                  >
                    {selectedRec?.id === rec.id ? (language === "ar" ? "إغلاق" : "Close") : rec.action}
                  </button>
                </div>

                {/* Inline Details - Solutions requested by user */}
                {selectedRec?.id === rec.id && (
                  <div
                    className={`mt-6 p-5 rounded-2xl border animate-in slide-in-from-top-4 duration-300 ${theme === "dark" ? "bg-slate-800/50 border-white/5" : "bg-slate-50 border-slate-100"
                      }`}
                  >
                    <div className="space-y-6">
                      {/* Confidence & Reasoning Grid */}
                      <div className="flex flex-col md:flex-row gap-6 items-start">
                        {/* Confidence Mini Card */}
                        <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 shrink-0 w-full md:w-32 ${theme === "dark" ? "bg-slate-900 border-white/5" : "bg-white border-slate-200"
                          }`}>
                          <div className="relative w-16 h-16 flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                              <path className={`${theme === "dark" ? "text-slate-800" : "text-slate-100"}`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                              <path className="text-blue-500" strokeDasharray={`${(rec.confidence || 0.8) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                            </svg>
                            <span className={`absolute text-sm font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                              {Math.round((rec.confidence || 0.8) * 100)}%
                            </span>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
                            {language === "ar" ? "ثقة النظام" : "Confidence"}
                          </span>
                        </div>

                        {/* Reasoning */}
                        <div className="flex-1">
                          <h5 className={`text-xs font-bold uppercase tracking-wider mb-2 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                            {language === "ar" ? "لماذا هذه التوصية؟" : "Why this recommendation?"}
                          </h5>
                          <p className={`text-sm leading-relaxed ${theme === "dark" ? "text-slate-200" : "text-slate-700"} italic`}>
                            "{rec.reasoning || (language === "ar" ? "لا توجد تفاصيل إضافية" : "No additional details")}"
                          </p>
                        </div>
                      </div>

                      {/* Implementation Steps */}
                      {rec.implementationSteps && rec.implementationSteps.length > 0 && (
                        <div className="space-y-4">
                          <h5 className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                            {language === "ar" ? "خطوات التنفيذ" : "Execution Steps"}
                          </h5>
                          <div className="space-y-3">
                            {rec.implementationSteps.map((step, idx) => (
                              <div key={idx} className="flex gap-3 items-start group">
                                <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${theme === "dark" ? "bg-emerald-600 text-white" : "bg-emerald-500 text-white"
                                  }`}>
                                  {idx + 1}
                                </div>
                                <p className={`text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>
                                  {step}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <button className="w-full py-3 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all text-sm">
                        {language === "ar" ? "اعتماد التنفيذ" : "Approve Plan"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DataCard
          title={language === "ar" ? "إجمالي التوصيات" : "Total Recommendations"}
          value={stats.total}
          subtitle={language === "ar" ? "توصية" : "recommendations"}
        />
        <DataCard
          title={language === "ar" ? "أولوية عالية" : "High Priority"}
          value={stats.highPriority}
          subtitle={language === "ar" ? "تحتاج إجراء" : "need action"}
        />
        <DataCard
          title={language === "ar" ? "إجمالي التوفير المتوقع" : "Total Expected Savings"}
          value={stats.totalSavings.toLocaleString()}
          subtitle={language === "ar" ? "ريال" : "YER"}
        />
      </div>
    </div>
  );
}

export default ProductionRecommendations;

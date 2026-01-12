import { useMemo, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

function WasteRecommendations({ recommendations, onGenerate, isGenerating }) {
    const { theme } = useTheme();
    const { language } = useLanguage();

    const textColor = theme === "dark" ? "#e2e8f0" : "#053F5C";
    const subTextColor = theme === "dark" ? "#94a3b8" : "#429EBD";
    const borderColor = theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(66, 158, 189, 0.2)";
    const cardBgClass = theme === "dark"
        ? "bg-slate-900/80 backdrop-blur-xl border-white/10"
        : "bg-white/90 backdrop-blur-xl border-slate-100 shadow-lg";

    const safeRecommendations = useMemo(() => {
        if (recommendations && recommendations.length > 0) {
            return recommendations.map(rec => ({
                id: rec.id,
                title: language === "ar" ? rec.title : (rec.title_en || rec.title),
                description: language === "ar" ? rec.description : (rec.description_en || rec.description),
                impact: rec.priority || "medium",
                priority: rec.priority || "medium",
                estimatedSavings: rec.expected_savings || rec.expectedSavings || 0,
                category: rec.category,
                confidence: rec.confidence || 0.8,
                reasoning: language === "ar" ? rec.reasoning : (rec.reasoning_en || rec.reasoning),
                implementationSteps: language === "ar"
                    ? (rec.implementation_steps || rec.implementationSteps || [])
                    : (rec.implementation_steps_en || rec.implementationSteps || []),
                wasteCause: rec.waste_cause,
                affectedStage: rec.affected_stage
            }));
        }
        return [];
    }, [recommendations, language]);

    const [selectedRec, setSelectedRec] = useState(null);

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

    const getWasteCauseLabel = (cause) => {
        const causeMap = {
            storage: language === "ar" ? "سوء التخزين" : "Poor Storage",
            transport: language === "ar" ? "مشاكل النقل" : "Transport Issues",
            temperature: language === "ar" ? "انتهاك درجة الحرارة" : "Temperature Violation",
            delay: language === "ar" ? "تأخير التسليم" : "Delivery Delay",
            overproduction: language === "ar" ? "فائض الإنتاج" : "Overproduction",
            other: language === "ar" ? "أخرى" : "Other"
        };
        return causeMap[cause] || cause;
    };

    const getStageLabel = (stage) => {
        const stageMap = {
            factory: language === "ar" ? "المصنع" : "Factory",
            warehouse: language === "ar" ? "المستودع" : "Warehouse",
            truck: language === "ar" ? "الشاحنة" : "Truck",
            distributor: language === "ar" ? "الموزع" : "Distributor",
            supermarket: language === "ar" ? "السوبرماركت" : "Supermarket"
        };
        return stageMap[stage] || stage;
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

    const stats = useMemo(() => {
        const totalSavings = safeRecommendations.reduce((sum, r) => sum + (r.estimatedSavings || 0), 0);
        const highPriority = safeRecommendations.filter(r => r.priority === "high").length;
        return { totalSavings, highPriority, total: safeRecommendations.length };
    }, [safeRecommendations]);

    return (
        <div className="space-y-6">
            {/* Header with Generate Button */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h3 className="text-2xl font-bold" style={{ color: textColor }}>
                        {language === "ar" ? "التوصيات الذكية للهدر" : "Smart Waste Recommendations"}
                    </h3>
                    <p className="text-sm mt-1" style={{ color: subTextColor }}>
                        {language === "ar" ? "توصيات مدعومة بالذكاء الاصطناعي لمنع الهدر" : "AI-powered recommendations to prevent waste"}
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {stats.total > 0 && (
                        <div
                            className="px-4 py-2 rounded-lg"
                            style={{ backgroundColor: theme === "dark" ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)" }}
                        >
                            <span className="text-sm font-medium" style={{ color: "#10b981" }}>
                                {language === "ar" ? "توفير متوقع:" : "Expected Savings:"} {stats.totalSavings.toLocaleString()} {language === "ar" ? "ر.ي" : "YER"}
                            </span>
                        </div>
                    )}
                    <button
                        onClick={onGenerate}
                        disabled={isGenerating}
                        className={`
              px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2
              ${isGenerating
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:scale-105'
                            }
              text-white
            `}
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {language === "ar" ? "جاري التوليد..." : "Generating..."}
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                                {language === "ar" ? "توليد توصيات جديدة" : "Generate Recommendations"}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Recommendations Cards */}
            {safeRecommendations.length === 0 ? (
                <div className={`p-10 text-center rounded-xl border-2 border-dashed ${cardBgClass}`}>
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </div>
                    <p className="text-lg font-semibold" style={{ color: textColor }}>
                        {language === "ar" ? "لا توجد توصيات متاحة" : "No recommendations available"}
                    </p>
                    <p className="text-sm mt-2" style={{ color: subTextColor }}>
                        {language === "ar" ? "اضغط على 'توليد توصيات جديدة' للحصول على تحليل ذكي للهدر" : "Click 'Generate Recommendations' for AI-powered waste analysis"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {safeRecommendations.map((rec, index) => {
                        const colors = getImpactColor(rec.impact);
                        const isSelected = selectedRec?.id === rec.id;

                        return (
                            <div
                                key={rec.id || index}
                                className={`p-5 rounded-xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${cardBgClass}`}
                                style={{
                                    borderTopWidth: "4px",
                                    borderTopColor: colors.main,
                                }}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        {getPriorityIcon(rec.priority)}
                                        <h4 className="font-bold text-base line-clamp-2" style={{ color: textColor }} title={rec.title}>
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

                                {/* Waste Cause & Stage Tags */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {rec.wasteCause && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-500 font-medium">
                                            {getWasteCauseLabel(rec.wasteCause)}
                                        </span>
                                    )}
                                    {rec.affectedStage && (
                                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500 font-medium">
                                            {getStageLabel(rec.affectedStage)}
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                <p className="text-sm mb-4 leading-relaxed line-clamp-3" style={{ color: subTextColor }}>
                                    {rec.description}
                                </p>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor }}>
                                    <div>
                                        <div className="text-xs" style={{ color: subTextColor }}>
                                            {language === "ar" ? "التوفير المتوقع" : "Est. Savings"}
                                        </div>
                                        <div className="text-xl font-bold" style={{ color: "#10b981" }}>
                                            {rec.estimatedSavings?.toLocaleString()} <span className="text-sm">{language === "ar" ? "ر.ي" : "YER"}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedRec(isSelected ? null : rec)}
                                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 hover:scale-105 ${theme === "dark"
                                            ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                            } ${isSelected ? "ring-2 ring-offset-2 ring-emerald-500" : ""}`}
                                    >
                                        {isSelected ? (language === "ar" ? "إغلاق" : "Close") : (language === "ar" ? "مراجعة" : "Review")}
                                    </button>
                                </div>

                                {/* Expanded Details */}
                                {isSelected && (
                                    <div className={`mt-6 p-5 rounded-xl border ${theme === "dark" ? "bg-slate-800/50 border-white/5" : "bg-slate-50 border-slate-100"}`}>
                                        <div className="space-y-5">
                                            {/* Confidence & Reasoning */}
                                            <div className="flex flex-col md:flex-row gap-5 items-start">
                                                {/* Confidence */}
                                                <div className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center space-y-2 shrink-0 w-full md:w-32 ${theme === "dark" ? "bg-slate-900 border-white/5" : "bg-white border-slate-200"
                                                    }`}>
                                                    <div className="relative w-14 h-14 flex items-center justify-center">
                                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                                            <path className={`${theme === "dark" ? "text-slate-800" : "text-slate-100"}`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                                            <path className="text-amber-500" strokeDasharray={`${rec.confidence * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                                                        </svg>
                                                        <span className={`absolute text-sm font-black ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                                                            {Math.round(rec.confidence * 100)}%
                                                        </span>
                                                    </div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
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
                                                <div className="space-y-3">
                                                    <h5 className={`text-xs font-bold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
                                                        {language === "ar" ? "خطوات التنفيذ" : "Implementation Steps"}
                                                    </h5>
                                                    <div className="space-y-2">
                                                        {rec.implementationSteps.map((step, idx) => (
                                                            <div key={idx} className="flex gap-3 items-start">
                                                                <div className={`shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${theme === "dark" ? "bg-amber-600 text-white" : "bg-amber-500 text-white"
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
                                            <button className="w-full py-3 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition-all text-sm">
                                                {language === "ar" ? "اعتماد وتنفيذ" : "Approve & Execute"}
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
            {safeRecommendations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`p-5 rounded-xl border ${cardBgClass} text-center`}>
                        <div className="text-3xl font-black" style={{ color: textColor }}>{stats.total}</div>
                        <div className="text-sm" style={{ color: subTextColor }}>{language === "ar" ? "إجمالي التوصيات" : "Total Recommendations"}</div>
                    </div>
                    <div className={`p-5 rounded-xl border ${cardBgClass} text-center`}>
                        <div className="text-3xl font-black text-red-500">{stats.highPriority}</div>
                        <div className="text-sm" style={{ color: subTextColor }}>{language === "ar" ? "أولوية عالية" : "High Priority"}</div>
                    </div>
                    <div className={`p-5 rounded-xl border ${cardBgClass} text-center`}>
                        <div className="text-3xl font-black text-emerald-500">{stats.totalSavings.toLocaleString()}</div>
                        <div className="text-sm" style={{ color: subTextColor }}>{language === "ar" ? "التوفير المتوقع (ر.ي)" : "Expected Savings (YER)"}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default WasteRecommendations;

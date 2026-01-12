import { useState, useMemo, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useWastedBatches, useWasteRecommendations, useBatchJourney, useWasteAnalysis } from "../hooks/useWaste.js";
import WasteRecommendations from "../components/waste/WasteRecommendations.jsx";
import ProductJourney from "../components/waste/ProductJourney.jsx";

function WasteAnalysis({ user }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  // جلب البيانات الفعلية من قاعدة البيانات
  const { batches: wastedBatches, summary, loading: batchesLoading, reload: reloadBatches } = useWastedBatches(30);
  const { analysis: wasteAnalysisData, loading: analysisLoading, reload: reloadAnalysis } = useWasteAnalysis(30);
  const {
    recommendations: wasteRecommendations,
    isGenerating,
    generate: generateRecommendations,
  } = useWasteRecommendations({ limit: 10 });

  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const { journey: batchJourney, loading: journeyLoading } = useBatchJourney(selectedBatchId);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark"
    ? "bg-slate-900/80 backdrop-blur-xl border-white/10"
    : "bg-gradient-to-br from-[#F0FAFC]/95 to-[#E6F7FB]/90 backdrop-blur-xl border-[#9FE7F5]/40 shadow-lg";

  // الإحصائيات من البيانات الفعلية - تستخدم تحليل الAPI أولاً
  const wasteStats = useMemo(() => {
    // استخدام الإحصائيات من analysis API إذا توفرت
    if (wasteAnalysisData?.summary) {
      return {
        totalCartons: wasteAnalysisData.summary.total_cartons || 0,
        totalWaste: wasteAnalysisData.summary.total_quantity || 0,
        totalIncidents: wasteAnalysisData.summary.total_events || 0,
        avgConfidence: 0.82,
        uniqueCauses: wasteAnalysisData.summary.unique_causes || wasteAnalysisData.by_type?.length || 0,
        totalCost: wasteAnalysisData.summary.total_cost || 0
      };
    }

    // حساب من بيانات الدفعات المهدورة كبديل
    const totalCartons = summary?.total_cartons || wastedBatches.reduce((sum, b) => sum + (b.waste_cartons || 0), 0);
    const totalWaste = summary?.total_waste || wastedBatches.reduce((sum, b) => sum + (b.wasteAmount || 0), 0);
    const incidentCount = summary?.incident_count || wastedBatches.length;
    const totalCost = summary?.total_cost || wastedBatches.reduce((sum, b) => sum + (b.cost_loss || 0), 0);
    const uniqueCauses = new Set(wastedBatches.filter(b => b.rootCause && b.rootCause !== 'Unknown').map(b => b.rootCause)).size || 0;
    const avgConfidence = wastedBatches.length > 0
      ? wastedBatches.reduce((sum, b) => sum + (b.confidence || 0.8), 0) / wastedBatches.length
      : 0.82;

    return {
      totalCartons,
      totalWaste,
      totalIncidents: incidentCount,
      avgConfidence,
      uniqueCauses,
      totalCost
    };
  }, [wastedBatches, summary, wasteAnalysisData]);

  // تحليل الأسباب الجذرية من البيانات الفعلية
  const rootCauseStats = useMemo(() => {
    const causeCount = {};
    const causeAmount = {};

    wastedBatches.forEach((item) => {
      const cause = item.rootCause || "Unknown";
      causeCount[cause] = (causeCount[cause] || 0) + 1;
      causeAmount[cause] = (causeAmount[cause] || 0) + (item.waste_cartons || 0);
    });

    return Object.keys(causeCount).map((cause) => ({
      cause,
      causeName: getCauseName(cause),
      count: causeCount[cause],
      amount: causeAmount[cause],
    })).sort((a, b) => b.amount - a.amount);
  }, [wastedBatches, language]);

  function getCauseName(cause) {
    const causeMap = {
      "Storage": language === "ar" ? "سوء التخزين" : "Storage Issues",
      "Transport": language === "ar" ? "مشاكل النقل" : "Transport Issues",
      "Overproduction": language === "ar" ? "الإفراط في الإنتاج" : "Overproduction",
      "Expiry": language === "ar" ? "انتهاء الصلاحية" : "Expiry",
      "Damage": language === "ar" ? "التلف الفيزيائي" : "Physical Damage",
      "Unknown": language === "ar" ? "غير معروف" : "Unknown"
    };
    return causeMap[cause] || cause;
  }

  const COLORS = {
    "Expiry": "#ef4444",
    "Storage": "#f59e0b",
    "Transport": "#3b82f6",
    "Overproduction": "#8b5cf6",
    "Damage": "#ec4899",
    "Unknown": "#6b7280"
  };

  const getStageLabel = (stage) => {
    const stageMap = {
      factory: language === "ar" ? "المصنع" : "Factory",
      warehouse: language === "ar" ? "المستودع" : "Warehouse",
      transport: language === "ar" ? "النقل" : "Transport",
      distributor: language === "ar" ? "الموزع" : "Distributor",
      retail: language === "ar" ? "السوبرماركت" : "Supermarket"
    };
    return stageMap[stage] || stage;
  };

  const handleViewJourney = (batchId) => {
    setSelectedBatchId(selectedBatchId === batchId ? null : batchId);
  };

  const handleGenerateRecommendations = async () => {
    try {
      await generateRecommendations();
    } catch (err) {
      console.error("Error generating recommendations:", err);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([reloadBatches?.(), reloadAnalysis?.()]);
  };

  const maxAmount = Math.max(...rootCauseStats.map(s => s.amount), 1);

  if (batchesLoading && wastedBatches.length === 0) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className={`text-lg font-semibold ${textColor}`}>
            {language === "ar" ? "جاري تحميل بيانات الهدر..." : "Loading waste data..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 md:space-y-8 pb-10" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header - Mobile Friendly */}
      <div className="mb-4">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold ${textColor} mb-1`}>
              {language === "ar" ? "تحليل الهدر" : "Waste Analysis"}
            </h2>
            <p className={`text-sm ${subTextColor}`}>
              {language === "ar" ? "تتبع رحلة المنتج وتحليل أسباب الهدر" : "Track product journey and analyze waste"}
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={batchesLoading}
            className="w-full py-3 rounded-xl font-bold bg-[#429EBD] text-white flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" /></svg>
            {language === "ar" ? "تحديث" : "Refresh"}
          </button>
        </div>
      </div>

      {/* Stats Cards - Grid 4 Columns */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className={`p-2.5 rounded-xl border ${borderClass} ${cardBgClass} border-b-2 border-b-red-500`}>
          <div className={`text-[10px] ${subTextColor} truncate uppercase`}>{language === "ar" ? "إجمالي الهدر" : "Total"}</div>
          <div className={`text-lg font-black ${textColor}`}>{wasteStats.totalCartons.toLocaleString()}</div>
        </div>
        <div className={`p-2.5 rounded-xl border ${borderClass} ${cardBgClass} border-b-2 border-b-amber-500`}>
          <div className={`text-[10px] ${subTextColor} truncate uppercase`}>{language === "ar" ? "الحوادث" : "Events"}</div>
          <div className={`text-lg font-black ${textColor}`}>{wasteStats.totalIncidents}</div>
        </div>
        <div className={`p-2.5 rounded-xl border ${borderClass} ${cardBgClass} border-b-2 border-b-emerald-500`}>
          <div className={`text-[10px] ${subTextColor} truncate uppercase`}>{language === "ar" ? "الدقة" : "Acc"}</div>
          <div className="text-lg font-black text-emerald-500">{Math.round(wasteStats.avgConfidence * 100)}%</div>
        </div>
        <div className={`p-2.5 rounded-xl border ${borderClass} ${cardBgClass} border-b-2 border-b-blue-500`}>
          <div className={`text-[10px] ${subTextColor} truncate uppercase`}>{language === "ar" ? "الأسباب" : "Causes"}</div>
          <div className={`text-lg font-black ${textColor}`}>{wasteStats.uniqueCauses}</div>
        </div>
      </div>

      {/* Donut Chart & Legend - Stacked on Mobile */}
      {rootCauseStats.length > 0 && (
        <div className={`rounded-xl border ${borderClass} ${cardBgClass} p-4 shadow-md`}>
          <h3 className={`text-sm font-bold mb-4 uppercase tracking-wider ${textColor}`}>
            {language === "ar" ? "توزيع الأسباب الجذرية" : "Root Cause Distribution"}
          </h3>

          <div className="flex flex-col items-center gap-6">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {(() => {
                  let currentAngle = 0;
                  const total = rootCauseStats.reduce((sum, s) => sum + s.count, 0);
                  return rootCauseStats.map((stat, index) => {
                    const percentage = stat.count / total;
                    const angle = percentage * 360;
                    const startAngle = currentAngle;
                    currentAngle += angle;
                    const startRad = (startAngle * Math.PI) / 180;
                    const endRad = ((startAngle + angle) * Math.PI) / 180;
                    const x1 = 50 + 40 * Math.cos(startRad);
                    const y1 = 50 + 40 * Math.sin(startRad);
                    const x2 = 50 + 40 * Math.cos(endRad);
                    const y2 = 50 + 40 * Math.sin(endRad);
                    const largeArc = angle > 180 ? 1 : 0;
                    return (
                      <path
                        key={index}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={COLORS[stat.cause] || "#6b7280"}
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    );
                  });
                })()}
                <circle cx="50" cy="50" r="28" fill={theme === "dark" ? "#0f172a" : "#ffffff"} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-black ${textColor}`}>{wasteStats.totalIncidents}</span>
                <span className={`text-[10px] uppercase font-bold ${subTextColor}`}>{language === "ar" ? "حادثة" : "Inc"}</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-2 gap-2">
              {rootCauseStats.map((stat, index) => (
                <div key={index} className={`p-2 rounded-lg ${theme === "dark" ? "bg-slate-800/50" : "bg-slate-50"} flex items-center gap-2 border ${borderClass}`}>
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[stat.cause] || "#6b7280" }} />
                  <div className="min-w-0">
                    <div className={`text-[10px] font-black truncate uppercase ${textColor}`}>{stat.causeName}</div>
                    <div className={`text-[9px] font-bold ${subTextColor}`}>{Math.round((stat.count / wastedBatches.length) * 100)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detailed Analysis - Bars */}
      {rootCauseStats.length > 0 && (
        <div className={`rounded-xl border ${borderClass} ${cardBgClass} p-4 shadow-md`}>
          <h3 className={`text-sm font-bold mb-4 uppercase tracking-wider ${textColor}`}>
            {language === "ar" ? "تحليل الكميات المهدرة" : "Volume Analysis"}
          </h3>
          <div className="space-y-3">
            {rootCauseStats.map((stat, index) => {
              const widthPercent = (stat.amount / maxAmount) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                    <span className={textColor}>{stat.causeName}</span>
                    <span className={subTextColor}>{stat.amount} {language === "ar" ? "كرتون" : "Cartons"}</span>
                  </div>
                  <div className={`h-4 w-full rounded-full ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"} overflow-hidden`}>
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(widthPercent, 5)}%`, backgroundColor: COLORS[stat.cause] || "#6b7280" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Wasted Batches Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className={`text-lg font-black ${textColor}`}>
            {language === "ar" ? "قائمة الهدر" : "Waste List"}
          </h3>
          <span className={`text-[10px] font-bold px-2 py-1 rounded bg-red-500/10 text-red-500 border border-red-500/20`}>
            {wastedBatches.length} {language === "ar" ? "دفعة" : "batches"}
          </span>
        </div>

        {wastedBatches.length === 0 ? (
          <div className={`${cardBgClass} rounded-2xl p-10 text-center border-2 border-dashed ${borderClass}`}>
            <p className={subTextColor}>{language === "ar" ? "لا توجد دفعات مهدورة" : "No waste recorded"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wastedBatches.map((batch) => {
              const isSelected = selectedBatchId === batch.batch_id;
              const confidenceColor = batch.confidence >= 0.8 ? "text-emerald-500" : batch.confidence >= 0.6 ? "text-amber-500" : "text-red-500";

              return (
                <div key={batch.id} className={`rounded-2xl border-2 ${borderClass} ${cardBgClass} p-4 border-l-8 shadow-md relative overflow-hidden`} style={{ borderLeftColor: COLORS[batch.rootCause] || "#6b7280" }}>
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 min-w-0">
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-black font-mono tracking-wider mb-1 inline-block">#{batch.batch_code}</span>
                      <h4 className={`text-base font-black ${textColor} truncate`}>{batch.product_name_ar || batch.product_name}</h4>
                    </div>
                    <div className="text-right">
                      <span className={`text-xl font-black text-red-500`}>{batch.waste_cartons}</span>
                      <span className={`text-[9px] font-bold block ${subTextColor} uppercase`}>{language === "ar" ? "كرتون" : "Cartons"}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className={`p-2 rounded-xl ${theme === "dark" ? "bg-slate-800/50" : "bg-slate-50"} border ${borderClass}`}>
                      <span className={`text-[9px] font-bold uppercase block mb-0.5 ${subTextColor}`}>{language === "ar" ? "السبب" : "Cause"}</span>
                      <span className="text-xs font-black" style={{ color: COLORS[batch.rootCause] }}>{language === "ar" ? batch.cause_name_ar : batch.cause_name_en}</span>
                    </div>
                    <div className={`p-2 rounded-xl ${theme === "dark" ? "bg-slate-800/50" : "bg-slate-50"} border ${borderClass}`}>
                      <span className={`text-[9px] font-bold uppercase block mb-0.5 ${subTextColor}`}>{language === "ar" ? "الموقع" : "Location"}</span>
                      <span className={`text-xs font-black ${textColor} truncate block`}>{getStageLabel(batch.stage)} - {batch.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t ${borderClass} border-dashed">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className={`h-full rounded-full ${batch.confidence >= 0.8 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${batch.confidence * 100}%` }} />
                      </div>
                      <span className={`text-[10px] font-black ${confidenceColor}`}>{Math.round(batch.confidence * 100)}% {language === "ar" ? "ثقة" : "conf"}</span>
                    </div>
                    <button
                      onClick={() => handleViewJourney(batch.batch_id)}
                      disabled={!batch.batch_id}
                      className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${isSelected ? 'bg-blue-500 text-white shadow-lg' : 'bg-blue-500/10 text-blue-500 active:bg-blue-200'}`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                      {isSelected ? (language === "ar" ? "إخفاء" : "Hide") : (language === "ar" ? "الرحلة" : "Journey")}
                    </button>
                  </div>

                  {isSelected && batchJourney && (
                    <div className="mt-4 animate-scale-in">
                      <ProductJourney journey={batchJourney} loading={journeyLoading} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Smart Recommendations */}
      <div className="mt-8">
        <WasteRecommendations
          recommendations={wasteRecommendations}
          onGenerate={handleGenerateRecommendations}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
}

export default WasteAnalysis;

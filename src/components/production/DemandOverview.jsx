import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import DataCard from "../shared/DataCard.jsx";
import { useMemo } from "react";

function DemandOverview({ demandForecast, stats, loading }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const textColor = theme === "dark" ? "#e2e8f0" : "#053F5C";
  const subTextColor = theme === "dark" ? "#94a3b8" : "#429EBD";

  // Use real data from props or empty defaults
  const safeForecast = useMemo(() => {
    return Array.isArray(demandForecast) ? demandForecast : [];
  }, [demandForecast]);

  const displayStats = useMemo(() => {
    if (stats) {
      return {
        totalDemand: Math.round(stats.total_demand || 0),
        avgConfidence: Math.round((stats.avg_confidence || 0) * 100),
        topProduct: stats.top_product ? {
          name: language === "ar" ? stats.top_product.name : stats.top_product.name_en,
          demand: Math.round(stats.top_product.demand)
        } : null,
        topGovernorate: stats.top_governorate ? {
          name: language === "ar" ? stats.top_governorate.name_ar : stats.top_governorate.name_en,
          demand: Math.round(stats.top_governorate.demand)
        } : null,
      };
    }

    return {
      totalDemand: 0,
      avgConfidence: 0,
      topProduct: null,
      topGovernorate: null,
    };
  }, [stats, language]);

  const maxDemand = useMemo(() => {
    if (safeForecast.length === 0) return 1000;
    return Math.max(...safeForecast.map(f => f.predictedDemand || f.forecast_qty || 0)) || 1000;
  }, [safeForecast]);

  if (loading && !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold" style={{ color: textColor }}>
        {language === "ar" ? "نظرة عامة على الطلب" : "Demand Overview"}
      </h3>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DataCard
          title={language === "ar" ? "إجمالي الطلب المتوقع" : "Total Forecasted Demand"}
          value={displayStats.totalDemand.toLocaleString()}
          subtitle={language === "ar" ? "وحدة" : "units"}
        />
        <DataCard
          title={language === "ar" ? "متوسط الثقة" : "Average Confidence"}
          value={`${displayStats.avgConfidence}%`}
          subtitle={language === "ar" ? "دقة التنبؤ" : "forecast accuracy"}
        />
        <DataCard
          title={language === "ar" ? "أعلى منتج" : "Top Product"}
          value={displayStats.topProduct ? displayStats.topProduct.demand.toLocaleString() : "0"}
          subtitle={displayStats.topProduct ? displayStats.topProduct.name : (language === "ar" ? "لا توجد بيانات" : "No data")}
        />
        <DataCard
          title={language === "ar" ? "أعلى محافظة" : "Top Governorate"}
          value={displayStats.topGovernorate ? displayStats.topGovernorate.demand.toLocaleString() : "0"}
          subtitle={displayStats.topGovernorate ? displayStats.topGovernorate.name : (language === "ar" ? "لا توجد بيانات" : "No data")}
        />
      </div>

      {/* Demand by Product Chart */}
      {safeForecast.length > 0 && (
        <div
          className={`rounded-xl border p-6 ${theme === "dark" ? "bg-slate-900/80 border-white/10" : "bg-white border-slate-100"
            }`}
        >
          <h4 className="text-lg font-bold mb-4" style={{ color: textColor }}>
            {language === "ar" ? "الطلب حسب المنتج" : "Demand by Product"}
          </h4>
          <div className="space-y-4">
            {safeForecast.slice(0, 6).map((item, index) => {
              const forecast_qty = item.predictedDemand || item.demand || item.forecast_qty || 0;
              const product_name = language === "ar"
                ? (item.product_name || item.product || "Unknown")
                : (item.product_name_en || item.product_en || item.product || "Unknown");
              const gov_name = language === "ar"
                ? (item.governorate_name || item.governorate || "")
                : (item.governorate_name_en || item.governorate_en || item.governorate || "");
              const percentage = (forecast_qty / maxDemand) * 100;
              const confidence = Math.round((item.confidence || 0.75) * 100);

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{
                          backgroundColor: confidence >= 85 ? "#10b981" : confidence >= 70 ? "#f59e0b" : "#ef4444"
                        }}
                      />
                      <span className="font-semibold" style={{ color: textColor }}>
                        {product_name}
                      </span>
                      {gov_name && (
                        <span className="text-sm" style={{ color: subTextColor }}>
                          ({gov_name})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm" style={{ color: subTextColor }}>
                        {confidence}% {language === "ar" ? "ثقة" : "conf."}
                      </span>
                      <span className="font-bold" style={{ color: textColor }}>
                        {forecast_qty.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div
                    className="h-6 rounded-lg overflow-hidden"
                    style={{
                      backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"
                    }}
                  >
                    <div
                      className="h-full rounded-lg flex items-center justify-end px-3 transition-all duration-700"
                      style={{
                        width: `${Math.max(percentage, 5)}%`,
                        background: `linear-gradient(90deg, ${theme === "dark" ? "#3b82f6" : "#2563eb"}, ${theme === "dark" ? "#1d4ed8" : "#1e40af"})`,
                        boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                      }}
                    >
                      <span className="text-white text-xs font-bold">
                        {forecast_qty.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div
            className="flex items-center justify-center gap-6 pt-4 mt-4 border-t"
            style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#10b981" }} />
              <span className="text-sm" style={{ color: subTextColor }}>
                {language === "ar" ? "ثقة عالية (≥85%)" : "High Conf. (≥85%)"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
              <span className="text-sm" style={{ color: subTextColor }}>
                {language === "ar" ? "ثقة متوسطة (70-85%)" : "Med Conf. (70-85%)"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#ef4444" }} />
              <span className="text-sm" style={{ color: subTextColor }}>
                {language === "ar" ? "ثقة منخفضة (<70%)" : "Low Conf. (<70%)"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DemandOverview;



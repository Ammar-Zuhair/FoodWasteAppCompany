import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import ChartContainer from "../shared/ChartContainer.jsx";
import DataCard from "../shared/DataCard.jsx";

function DemandForecast({ forecasts }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  // Ensure forecasts is an array - no dummy data
  const safeForecasts = useMemo(() => {
    if (Array.isArray(forecasts) && forecasts.length > 0) {
      return forecasts;
    }
    // Return empty array - no dummy data
    return [];
  }, [forecasts]);

  // Process chart data
  const chartData = useMemo(() => {
    return safeForecasts
      .map((forecast) => ({
        governorate: forecast.governorate || forecast.product || "Unknown",
        demand: forecast.predictedDemand || forecast.demand || 0,
        confidence: Math.round((forecast.confidence || 0.75) * 100),
        products: forecast.products || [],
      }))
      .filter(d => d.demand > 0)
      .sort((a, b) => b.demand - a.demand);
  }, [safeForecasts]);

  const totalDemand = useMemo(() => {
    return safeForecasts.reduce((sum, f) => sum + (f.predictedDemand || f.demand || 0), 0);
  }, [safeForecasts]);

  const avgConfidence = useMemo(() => {
    if (safeForecasts.length === 0) return 0;
    const total = safeForecasts.reduce((sum, f) => sum + (f.confidence || 0.75), 0);
    return total / safeForecasts.length;
  }, [safeForecasts]);

  const maxDemand = useMemo(() => {
    return chartData.length > 0 ? Math.max(...chartData.map(d => d.demand)) : 1000;
  }, [chartData]);

  // Get bar color based on ratio
  const getBarColor = (demand) => {
    const ratio = maxDemand > 0 ? demand / maxDemand : 0;
    if (ratio >= 0.8) {
      return theme === "dark" ? "#10b981" : "#429EBD";
    } else if (ratio >= 0.6) {
      return theme === "dark" ? "#3b82f6" : "#429EBD";
    } else if (ratio >= 0.4) {
      return theme === "dark" ? "#f59e0b" : "#F7AD19";
    } else {
      return theme === "dark" ? "#64748b" : "#94a3b8";
    }
  };

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderColor = theme === "dark" ? "border-slate-700" : "border-[#9FE7F5]";

  return (
    <div className="space-y-6">
      {/* Data Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DataCard
          title={language === "ar" ? "إجمالي الطلب المتوقع" : "Total Predicted Demand"}
          value={totalDemand.toLocaleString()}
          subtitle={language === "ar" ? "وحدة" : "units"}
        />
        <DataCard
          title={language === "ar" ? "متوسط الثقة" : "Average Confidence"}
          value={`${Math.round(avgConfidence * 100)}%`}
          subtitle={language === "ar" ? "دقة التنبؤ" : "prediction accuracy"}
        />
        <DataCard
          title={language === "ar" ? "عدد التوقعات" : "Total Forecasts"}
          value={safeForecasts.length}
          subtitle={language === "ar" ? "توقع" : "forecasts"}
        />
      </div>

      {/* Forecast Cards (تم إخفاء الجدول والاحتفاظ بالبطاقات فقط) */}

      {safeForecasts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {safeForecasts.map((forecast, index) => {
            const uniqueKey = `${forecast.governorate || 'unknown'}-${index}`;
            const demand = forecast.predictedDemand || forecast.demand || 0;
            const confidence = Math.round((forecast.confidence || 0.75) * 100);
            const barColor = getBarColor(demand);

            return (
              <div
                key={uniqueKey}
                className={`group rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${theme === "dark"
                  ? "bg-slate-900/80 border-white/10 hover:border-white/20"
                  : "bg-white/70 border-[#9FE7F5]/40 hover:border-[#429EBD]/50"
                  }`}
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: barColor,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-bold text-lg ${textColor}`}>
                    {forecast.governorate || forecast.product || "Unknown"}
                  </h4>
                  <span
                    className="text-xs px-3 py-1.5 rounded-full font-semibold"
                    style={{
                      backgroundColor: `${barColor}20`,
                      color: barColor,
                    }}
                  >
                    {confidence}% {language === "ar" ? "ثقة" : "confidence"}
                  </span>
                </div>
                <div
                  className="text-3xl font-bold mb-2"
                  style={{ color: barColor }}
                >
                  {demand.toLocaleString()}
                </div>
                <div className={`text-sm ${subTextColor} mb-3`}>
                  {language === "ar" ? "وحدة متوقعة" : "predicted units"}
                </div>

                {/* Products List in Card */}
                {forecast.products && forecast.products.length > 0 && (
                  <div className={`border-t pt-3 ${borderColor}`}>
                    <div className={`text-xs font-semibold mb-2 ${subTextColor}`}>
                      {language === "ar" ? "المنتجات المتوقعة:" : "Predicted Products:"}
                    </div>
                    <div className="space-y-1">
                      {forecast.products.slice(0, 5).map((prod, pIdx) => (
                        <div
                          key={pIdx}
                          className={`flex justify-between items-center text-sm ${theme === "dark" ? "bg-slate-800/50" : "bg-slate-50"
                            } px-2 py-1 rounded`}
                        >
                          <span className={textColor}>{prod.name}</span>
                          <span className={`font-semibold ${subTextColor}`}>
                            {prod.demand.toLocaleString()} {prod.unit || ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DemandForecast;

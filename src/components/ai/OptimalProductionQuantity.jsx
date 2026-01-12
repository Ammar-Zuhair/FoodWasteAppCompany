import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import ChartContainer from "../shared/ChartContainer.jsx";
import DataCard from "../shared/DataCard.jsx";

function OptimalProductionQuantity({ productionData }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const textColor = theme === "dark" ? "#e2e8f0" : "#053F5C";
  const subTextColor = theme === "dark" ? "#94a3b8" : "#429EBD";
  const borderColor = theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(66, 158, 189, 0.2)";

  // ALWAYS use dummy data for demonstration
  const optimalData = useMemo(() => {
    // Comprehensive dummy data
    const dummyData = [
      { product: language === "ar" ? "حليب طازج" : "Fresh Milk", demandForecast: 850, currentStock: 200, optimalQuantity: 750, expectedWaste: 45, utilizationRate: 94, confidence: 0.92 },
      { product: language === "ar" ? "عصير برتقال" : "Orange Juice", demandForecast: 620, currentStock: 150, optimalQuantity: 550, expectedWaste: 30, utilizationRate: 89, confidence: 0.88 },
      { product: language === "ar" ? "زبادي" : "Yogurt", demandForecast: 480, currentStock: 100, optimalQuantity: 430, expectedWaste: 25, utilizationRate: 90, confidence: 0.85 },
      { product: language === "ar" ? "جبنة بيضاء" : "White Cheese", demandForecast: 350, currentStock: 80, optimalQuantity: 310, expectedWaste: 20, utilizationRate: 88, confidence: 0.82 },
      { product: language === "ar" ? "لبن رائب" : "Buttermilk", demandForecast: 280, currentStock: 60, optimalQuantity: 250, expectedWaste: 15, utilizationRate: 91, confidence: 0.78 },
      { product: language === "ar" ? "عصير تفاح" : "Apple Juice", demandForecast: 350, currentStock: 90, optimalQuantity: 300, expectedWaste: 18, utilizationRate: 86, confidence: 0.80 },
    ];

    // Always return dummy data
    return dummyData;
  }, [language]);

  // إحصائيات سريعة
  const stats = useMemo(() => {
    const totalOptimal = optimalData.reduce((sum, item) => sum + item.optimalQuantity, 0);
    const totalDemand = optimalData.reduce((sum, item) => sum + item.demandForecast, 0);
    const totalWaste = optimalData.reduce((sum, item) => sum + item.expectedWaste, 0);
    const avgUtilization = optimalData.reduce((sum, item) => sum + item.utilizationRate, 0) / (optimalData.length || 1);

    return {
      totalOptimal,
      totalDemand,
      totalWaste,
      avgUtilization: Math.round(avgUtilization),
    };
  }, [optimalData]);

  const maxValue = useMemo(() => {
    return Math.max(...optimalData.map(d => Math.max(d.demandForecast, d.optimalQuantity))) || 1000;
  }, [optimalData]);

  const getUtilizationColor = (rate) => {
    if (rate >= 90) return { main: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
    if (rate >= 70) return { main: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" };
    return { main: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
  };

  if (!optimalData || optimalData.length === 0) {
    return (
      <div 
        className={`rounded-xl border p-8 text-center ${
          theme === "dark" ? "bg-slate-900/80 border-white/10" : "bg-white/50 border-[#9FE7F5]/40"
        }`}
      >
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={subTextColor} strokeWidth="1.5" className="mx-auto mb-4 opacity-50">
          <path d="M12 20V10"/>
          <path d="M18 20V4"/>
          <path d="M6 20v-4"/>
        </svg>
        <p style={{ color: textColor }}>
          {language === "ar" ? "لا توجد بيانات متاحة" : "No data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* بطاقات إحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DataCard
          title={language === "ar" ? "إجمالي الإنتاج المثالي" : "Total Optimal Production"}
          value={stats.totalOptimal.toLocaleString()}
          subtitle={language === "ar" ? "وحدة" : "units"}
        />
        <DataCard
          title={language === "ar" ? "إجمالي الطلب المتوقع" : "Total Forecasted Demand"}
          value={stats.totalDemand.toLocaleString()}
          subtitle={language === "ar" ? "وحدة" : "units"}
        />
        <DataCard
          title={language === "ar" ? "متوسط الاستخدام" : "Avg Utilization"}
          value={`${stats.avgUtilization}%`}
          subtitle={language === "ar" ? "نسبة الاستخدام" : "utilization rate"}
        />
        <DataCard
          title={language === "ar" ? "الهدر المتوقع" : "Expected Waste"}
          value={stats.totalWaste.toLocaleString()}
          subtitle={language === "ar" ? "وحدة" : "units"}
        />
      </div>

      {/* مقارنة الطلب المتوقع والإنتاج المثالي */}
      <ChartContainer title={language === "ar" ? "الطلب المتوقع مقابل الإنتاج المثالي" : "Forecasted Demand vs Optimal Production"}>
        <div className="space-y-5 py-4">
          {optimalData.slice(0, 8).map((item, index) => {
            const demandPercentage = (item.demandForecast / maxValue) * 100;
            const optimalPercentage = (item.optimalQuantity / maxValue) * 100;
            const colors = getUtilizationColor(item.utilizationRate);
            
            return (
              <div key={index} className="space-y-2">
                {/* Product Name */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors.main }}
                    />
                    <span className="font-bold text-base" style={{ color: textColor }}>
                      {item.product}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span style={{ color: subTextColor }}>
                      {language === "ar" ? "استخدام:" : "Util:"} 
                      <span className="font-bold ml-1" style={{ color: colors.main }}>{item.utilizationRate}%</span>
                    </span>
                  </div>
                </div>
                
                {/* Dual Bar Chart */}
                <div className="space-y-2">
                  {/* Demand Bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium w-20 text-right" style={{ color: subTextColor }}>
                      {language === "ar" ? "الطلب" : "Demand"}
                    </span>
                    <div 
                      className="flex-1 h-8 rounded-lg overflow-hidden relative"
                      style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end px-3 transition-all duration-700"
                        style={{
                          width: `${Math.max(demandPercentage, 5)}%`,
                          backgroundColor: theme === "dark" ? "#3b82f6" : "#2563eb",
                          boxShadow: "0 2px 8px rgba(59, 130, 246, 0.3)",
                        }}
                      >
                        <span className="text-white text-xs font-bold">
                          {item.demandForecast.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Optimal Bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium w-20 text-right" style={{ color: subTextColor }}>
                      {language === "ar" ? "المثالي" : "Optimal"}
                    </span>
                    <div 
                      className="flex-1 h-8 rounded-lg overflow-hidden relative"
                      style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
                    >
                      <div
                        className="absolute inset-y-0 left-0 rounded-lg flex items-center justify-end px-3 transition-all duration-700"
                        style={{
                          width: `${Math.max(optimalPercentage, 5)}%`,
                          backgroundColor: "#10b981",
                          boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                        }}
                      >
                        <span className="text-white text-xs font-bold">
                          {item.optimalQuantity.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Legend */}
          <div 
            className="flex items-center justify-center gap-8 pt-4 mt-4 border-t"
            style={{ borderColor }}
          >
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: theme === "dark" ? "#3b82f6" : "#2563eb" }} />
              <span className="text-sm font-medium" style={{ color: subTextColor }}>
                {language === "ar" ? "الطلب المتوقع" : "Forecasted Demand"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10b981" }} />
              <span className="text-sm font-medium" style={{ color: subTextColor }}>
                {language === "ar" ? "الإنتاج المثالي" : "Optimal Production"}
              </span>
            </div>
          </div>
        </div>
      </ChartContainer>

      {/* كروت تفصيلية */}
      <div 
        className={`rounded-xl border p-6 ${
          theme === "dark" ? "bg-slate-900/80 border-white/10" : "bg-white/50 border-[#9FE7F5]/40"
        }`}
      >
        <h3 className="text-xl font-bold mb-6" style={{ color: textColor }}>
          {language === "ar" ? "تفاصيل الإنتاج المثالي" : "Optimal Production Details"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {optimalData.map((item, index) => {
            const colors = getUtilizationColor(item.utilizationRate);
            
            return (
              <div
                key={index}
                className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                  theme === "dark" ? "bg-slate-800/50 border-white/10" : "bg-white border-slate-100"
                }`}
                style={{
                  borderLeftWidth: "4px",
                  borderLeftColor: colors.main,
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-base" style={{ color: textColor }}>
                      {item.product}
                    </h4>
                    <div 
                      className="text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1"
                      style={{ backgroundColor: colors.bg, color: colors.main }}
                    >
                      {item.utilizationRate}% {language === "ar" ? "استخدام" : "utilization"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black" style={{ color: colors.main }}>
                      {item.optimalQuantity.toLocaleString()}
                    </div>
                    <div className="text-xs" style={{ color: subTextColor }}>
                      {language === "ar" ? "وحدة مثالية" : "optimal units"}
                    </div>
                  </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }}
                  >
                    <div className="text-lg font-bold" style={{ color: textColor }}>
                      {item.demandForecast.toLocaleString()}
                    </div>
                    <div className="text-xs" style={{ color: subTextColor }}>
                      {language === "ar" ? "الطلب" : "Demand"}
                    </div>
                  </div>
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)" }}
                  >
                    <div className="text-lg font-bold" style={{ color: textColor }}>
                      {item.currentStock.toLocaleString()}
                    </div>
                    <div className="text-xs" style={{ color: subTextColor }}>
                      {language === "ar" ? "المخزون" : "Stock"}
                    </div>
                  </div>
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: theme === "dark" ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.05)" }}
                  >
                    <div className="text-lg font-bold" style={{ color: "#ef4444" }}>
                      {item.expectedWaste.toLocaleString()}
                    </div>
                    <div className="text-xs" style={{ color: subTextColor }}>
                      {language === "ar" ? "الهدر" : "Waste"}
                    </div>
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
                  <div 
                    className="h-full rounded-full"
                    style={{ 
                      width: `${item.utilizationRate}%`,
                      backgroundColor: colors.main,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default OptimalProductionQuantity;

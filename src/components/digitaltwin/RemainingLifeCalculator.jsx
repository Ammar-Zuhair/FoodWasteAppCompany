import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useMemo } from "react";
import ChartContainer from "../shared/ChartContainer.jsx";

function RemainingLifeCalculator({ batches }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const textColor = theme === "dark" ? "#e2e8f0" : "#053F5C";
  const subTextColor = theme === "dark" ? "#94a3b8" : "#429EBD";

  const getBarColor = (difference) => {
    if (difference < -5) return { main: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
    if (difference < 0) return { main: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" };
    if (difference > 5) return { main: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
    return { main: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" };
  };

  const getStatusLabel = (difference) => {
    if (difference < -5) return language === "ar" ? "منتهي قريباً" : "Expiring Soon";
    if (difference < 0) return language === "ar" ? "تحذير" : "Warning";
    if (difference > 5) return language === "ar" ? "جيد" : "Good";
    return language === "ar" ? "عادي" : "Normal";
  };

  const chartData = useMemo(() => {
    if (!batches || batches.length === 0) {
      // Dummy data for demonstration
      return [
        { name: language === "ar" ? "عصير برتقال" : "Orange Juice", written: 45, actual: 40, difference: -5 },
        { name: language === "ar" ? "حليب طازج" : "Fresh Milk", written: 30, actual: 35, difference: 5 },
        { name: language === "ar" ? "جبنة بيضاء" : "White Cheese", written: 60, actual: 55, difference: -5 },
        { name: language === "ar" ? "زبادي" : "Yogurt", written: 25, actual: 28, difference: 3 },
      ];
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return batches.map((batch) => {
      const writtenExpiry = new Date(batch.writtenExpiry);
      const actualExpiry = new Date(batch.actualExpiry);
      
      writtenExpiry.setHours(0, 0, 0, 0);
      actualExpiry.setHours(0, 0, 0, 0);
      
      const writtenDays = Math.ceil((writtenExpiry - today) / (1000 * 60 * 60 * 24));
      const actualDays = Math.ceil((actualExpiry - today) / (1000 * 60 * 60 * 24));
      const difference = actualDays - writtenDays;
      
      return {
        name: batch.productName,
        written: writtenDays,
        actual: actualDays,
        difference: difference,
        batchId: batch.id,
      };
    });
  }, [batches, language]);

  const maxDays = useMemo(() => {
    if (chartData.length === 0) return 60;
    return Math.max(...chartData.map(d => Math.max(d.written, d.actual))) + 10;
  }, [chartData]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className={`rounded-2xl border-2 p-12 text-center ${
        theme === "dark" 
          ? "bg-slate-900/95 border-white/20" 
          : "bg-white/90 border-[#9FE7F5]/60"
      }`}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={subTextColor} strokeWidth="1.5" className="mx-auto mb-4 opacity-50">
          <path d="M12 20V10"/>
          <path d="M18 20V4"/>
          <path d="M6 20v-4"/>
        </svg>
        <p className={`text-xl font-bold`} style={{ color: textColor }}>
          {language === "ar" ? "لا توجد بيانات متاحة" : "No data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart */}
      <ChartContainer title={language === "ar" ? "العمر المتبقي الفعلي" : "Actual Remaining Life"}>
        <div className="space-y-6 py-4">
          {chartData.map((item, index) => {
            const colors = getBarColor(item.difference);
            const actualPercentage = (item.actual / maxDays) * 100;
            const writtenPercentage = (item.written / maxDays) * 100;
            
            return (
              <div key={index} className="space-y-2">
                {/* Product Name & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: colors.main }}
                    />
                    <span className="font-bold text-base" style={{ color: textColor }}>
                      {item.name}
                    </span>
                    <span 
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: colors.bg, color: colors.main }}
                    >
                      {getStatusLabel(item.difference)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm" style={{ color: subTextColor }}>
                      {language === "ar" ? "مدون:" : "Written:"} {item.written} {language === "ar" ? "يوم" : "d"}
                    </span>
                    <span 
                      className="text-lg font-bold"
                      style={{ color: colors.main }}
                    >
                      {item.actual} {language === "ar" ? "يوم" : "days"}
                    </span>
                  </div>
                </div>
                
                {/* Bar Chart */}
                <div className="relative">
                  {/* Background bar */}
                  <div 
                    className="h-10 rounded-lg"
                    style={{ 
                      backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" 
                    }}
                  >
                    {/* Written days marker */}
                    <div 
                      className="absolute top-0 bottom-0 w-0.5"
                      style={{ 
                        left: `${writtenPercentage}%`,
                        backgroundColor: theme === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)",
                      }}
                    />
                    
                    {/* Actual days bar */}
                    <div
                      className="absolute top-0 bottom-0 left-0 rounded-lg flex items-center justify-end px-4 transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.max(actualPercentage, 5)}%`,
                        background: `linear-gradient(90deg, ${colors.main}dd, ${colors.main})`,
                        boxShadow: `0 4px 15px ${colors.main}40`,
                      }}
                    >
                      <span className="text-white font-bold text-sm drop-shadow-md">
                        {item.actual} {language === "ar" ? "يوم" : "days"}
                      </span>
                    </div>
                  </div>
                  
                  {/* Difference badge */}
                  <div 
                    className="absolute -right-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-lg text-xs font-bold text-white"
                    style={{ 
                      backgroundColor: colors.main,
                      boxShadow: `0 2px 8px ${colors.main}50`,
                    }}
                  >
                    {item.difference > 0 ? "+" : ""}{item.difference}
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Scale */}
          <div 
            className="flex justify-between pt-4 border-t"
            style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}
          >
            {[0, Math.round(maxDays * 0.25), Math.round(maxDays * 0.5), Math.round(maxDays * 0.75), maxDays].map((val, i) => (
              <span key={i} className="text-xs font-medium" style={{ color: subTextColor }}>
                {val}
              </span>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10b981" }} />
              <span className="text-sm" style={{ color: subTextColor }}>
                {language === "ar" ? "جيد (> 5 أيام)" : "Good (> 5 days)"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }} />
              <span className="text-sm" style={{ color: subTextColor }}>
                {language === "ar" ? "عادي" : "Normal"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#f59e0b" }} />
              <span className="text-sm" style={{ color: subTextColor }}>
                {language === "ar" ? "تحذير" : "Warning"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ef4444" }} />
              <span className="text-sm" style={{ color: subTextColor }}>
                {language === "ar" ? "حرج" : "Critical"}
              </span>
            </div>
          </div>
        </div>
      </ChartContainer>

      {/* Analysis Cards */}
      <div 
        className={`rounded-2xl border-2 p-6 ${
        theme === "dark" 
            ? "bg-slate-900/95 border-white/15" 
            : "bg-white/90 border-[#9FE7F5]/40"
        }`}
      >
        <h3 className="text-xl font-bold mb-6" style={{ color: textColor }}>
          {language === "ar" ? "تحليل الفروقات" : "Difference Analysis"}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {chartData.map((item, index) => {
            const colors = getBarColor(item.difference);
            
            return (
              <div
                key={index}
                className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                theme === "dark" 
                    ? "bg-slate-800/50 border-white/10" 
                    : "bg-white border-slate-100"
              }`}
              style={{
                  borderLeftWidth: "4px",
                  borderLeftColor: colors.main,
              }}
            >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-base mb-2" style={{ color: textColor }}>
                  {item.name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm">
                      <span style={{ color: subTextColor }}>
                        {language === "ar" ? "مدون:" : "Written:"}{" "}
                        <span className="font-semibold" style={{ color: textColor }}>{item.written} {language === "ar" ? "يوم" : "d"}</span>
                    </span>
                      <span style={{ color: subTextColor }}>
                        {language === "ar" ? "فعلي:" : "Actual:"}{" "}
                        <span className="font-semibold" style={{ color: colors.main }}>{item.actual} {language === "ar" ? "يوم" : "d"}</span>
                    </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div 
                      className="text-3xl font-black"
                      style={{ color: colors.main }}
                    >
                      {item.difference > 0 ? "+" : ""}{item.difference}
                    </div>
                    <div className="text-xs font-medium" style={{ color: subTextColor }}>
                      {language === "ar" ? "يوم" : "days"}
                    </div>
                  </div>
                </div>
                
                {/* Mini progress bar */}
                <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.bg }}>
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                  style={{ 
                      width: `${(item.actual / Math.max(item.written, item.actual)) * 100}%`,
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

export default RemainingLifeCalculator;

import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

function RefrigerationStats({ refrigerators }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const textColor = theme === "dark" ? "#ffffff" : "#053F5C";
  const subTextColor = theme === "dark" ? "#94a3b8" : "#64748b";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";

  const stats = useMemo(() => {
    const total = refrigerators?.length || 0;
    if (total === 0) {
      return { total: 0, avgTemp: "0.0", highRisk: 0, avgEnergy: "0.0" };
    }
    
    const avgTemp = refrigerators.reduce((sum, f) => sum + (f.currentTemp || 0), 0) / total;
    const avgEnergy = refrigerators.reduce((sum, f) => sum + (f.energyConsumption || 2.5), 0) / total;
    const highRisk = refrigerators.filter((f) => (f.failureRisk || 0) > 30).length;

    return {
      total,
      avgTemp: avgTemp.toFixed(1),
      avgEnergy: avgEnergy.toFixed(1),
      highRisk,
    };
  }, [refrigerators]);

  const cards = [
    {
      title: language === "ar" ? "إجمالي الثلاجات" : "Total Refrigerators",
      value: stats.total,
      unit: "",
      subtitle: language === "ar" ? "ثلاجة نشطة" : "active",
      color: "#3b82f6",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="2" width="16" height="20" rx="2"/><line x1="4" y1="10" x2="20" y2="10"/>
        </svg>
      )
    },
    {
      title: language === "ar" ? "متوسط الحرارة" : "Avg Temperature",
      value: stats.avgTemp,
      unit: "°C",
      subtitle: language === "ar" ? "درجة مئوية" : "celsius",
      color: parseFloat(stats.avgTemp) <= 5 ? "#10b981" : parseFloat(stats.avgTemp) <= 8 ? "#f59e0b" : "#ef4444",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
        </svg>
      )
    },
    {
      title: language === "ar" ? "ثلاجات في خطر" : "At Risk",
      value: stats.highRisk,
      unit: "",
      subtitle: language === "ar" ? "تحتاج صيانة" : "need attention",
      color: "#ef4444", // Always red for danger
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      )
    },
    {
      title: language === "ar" ? "استهلاك الطاقة" : "Energy Usage",
      value: stats.avgEnergy,
      unit: " kW",
      subtitle: language === "ar" ? "متوسط يومي" : "daily avg",
      color: "#8b5cf6",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, idx) => (
        <div 
          key={idx}
          className={`relative overflow-hidden rounded-xl p-4 border-2 ${borderClass} transition-all hover:scale-[1.02] cursor-pointer`}
          style={{ 
            background: theme === "dark" 
              ? "linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))" 
              : "linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.9))",
            borderColor: `${card.color}30`
          }}
        >
          {/* Background decoration */}
          <div 
            className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-10"
            style={{ background: card.color, transform: "translate(30%, -30%)" }}
          />
          
          {/* Icon */}
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
            style={{ backgroundColor: `${card.color}15`, color: card.color }}
          >
            {card.icon}
          </div>
          
          {/* Value */}
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold" style={{ color: textColor, fontFamily: "system-ui" }}>
              {card.value}
            </span>
            <span className="text-lg font-semibold" style={{ color: card.color }}>
              {card.unit}
            </span>
          </div>
          
          {/* Title & Subtitle */}
          <div className="mt-1">
            <div className="text-sm font-medium" style={{ color: textColor }}>{card.title}</div>
            <div className="text-xs" style={{ color: subTextColor }}>{card.subtitle}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default RefrigerationStats;

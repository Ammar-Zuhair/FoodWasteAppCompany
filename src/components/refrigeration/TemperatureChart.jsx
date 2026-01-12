import { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

function TemperatureChart({ refrigeratorId, temperatureHistory }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedId, setDisplayedId] = useState(refrigeratorId);

  const textColor = theme === "dark" ? "#ffffff" : "#053F5C";
  const subTextColor = theme === "dark" ? "#94a3b8" : "#64748b";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/80";

  // Animation when switching refrigerators
  useEffect(() => {
    if (refrigeratorId !== displayedId) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedId(refrigeratorId);
        setIsTransitioning(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [refrigeratorId, displayedId]);

  // Process data
  const displayData = useMemo(() => {
    if (!temperatureHistory || !Array.isArray(temperatureHistory) || temperatureHistory.length === 0) {
      return [];
    }
    return temperatureHistory.filter(item => 
      item && 
      typeof item.temperature === 'number' && 
      !isNaN(item.temperature) &&
      item.time
    );
  }, [temperatureHistory]);

  // Calculate stats
  const stats = useMemo(() => {
    if (displayData.length === 0) return { min: 0, max: 0, avg: 0, current: 0 };
    const temps = displayData.map(d => d.temperature);
    return {
      min: Math.min(...temps).toFixed(1),
      max: Math.max(...temps).toFixed(1),
      avg: (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1),
      current: (temps[temps.length - 1] || 0).toFixed(1)
    };
  }, [displayData]);

  const hasData = displayData && displayData.length > 0;

  // Status based on current temperature
  const getStatus = (temp) => {
    const t = parseFloat(temp);
    if (t <= 4) return { label: language === "ar" ? "ممتاز" : "Excellent", color: "#10b981" };
    if (t <= 6) return { label: language === "ar" ? "جيد" : "Good", color: "#22c55e" };
    if (t <= 8) return { label: language === "ar" ? "تحذير" : "Warning", color: "#f59e0b" };
    return { label: language === "ar" ? "حرج" : "Critical", color: "#ef4444" };
  };

  const status = getStatus(stats.current);

  // Get short ID for display
  const shortId = useMemo(() => {
    if (!refrigeratorId) return "";
    if (refrigeratorId.length > 15) {
      return refrigeratorId.substring(0, 8) + "...";
    }
    return refrigeratorId;
  }, [refrigeratorId]);

  return (
    <div 
      className={`rounded-2xl border-2 ${borderClass} ${cardBgClass} shadow-lg overflow-hidden transition-all duration-500`}
      style={{
        opacity: isTransitioning ? 0 : 1,
        transform: isTransitioning ? "scale(0.95) translateY(10px)" : "scale(1) translateY(0)",
      }}
    >
      {/* Header with animation */}
      <div 
        className="px-5 py-4 border-b flex items-center justify-between transition-all duration-500"
        style={{ 
          borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          background: `linear-gradient(135deg, ${status.color}15, transparent)`
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 animate-pulse"
            style={{ backgroundColor: `${status.color}20`, boxShadow: `0 0 20px ${status.color}30` }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={status.color} strokeWidth="2.5">
              <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-white text-lg">{language === "ar" ? "مراقبة الحرارة" : "Temperature"}</h3>
            <p className="text-xs text-white/60">{shortId}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div 
            className="px-4 py-2 rounded-xl text-white font-bold text-xl transition-all duration-500"
            style={{ 
              backgroundColor: status.color,
              boxShadow: `0 4px 15px ${status.color}50`,
              fontFamily: "system-ui"
            }}
          >
            {stats.current}°C
          </div>
          <span 
            className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all duration-300"
            style={{ backgroundColor: `${status.color}20`, color: status.color }}
          >
            {status.label}
          </span>
        </div>
      </div>

      {/* Chart with animation */}
      <div className="p-4">
        {!hasData ? (
          <div className={`rounded-xl p-12 text-center ${theme === "dark" ? "bg-slate-800/30" : "bg-slate-100"}`}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={subTextColor} strokeWidth="1.5" className="mx-auto mb-3 opacity-50">
              <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
            </svg>
            <p className="text-sm" style={{ color: subTextColor }}>{language === "ar" ? "لا توجد بيانات" : "No data available"}</p>
          </div>
        ) : (
          <div 
            className="transition-all duration-700"
            style={{
              opacity: isTransitioning ? 0 : 1,
              transform: isTransitioning ? "translateX(-20px)" : "translateX(0)"
            }}
          >
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={displayData} margin={{ top: 10, right: 20, left: 5, bottom: 0 }}>
                {/* Add padding to separate Y-axis from first point */}
                <defs>
                  <linearGradient id={`tempGradient-${refrigeratorId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={status.color} stopOpacity={0.5}/>
                    <stop offset="100%" stopColor={status.color} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} 
                  vertical={false}
                />
                <XAxis 
                  dataKey="time" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: subTextColor, fontSize: 10 }}
                  interval="preserveStartEnd"
                  padding={{ left: 20, right: 10 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: subTextColor, fontSize: 10 }}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  tickFormatter={(v) => `${v}°`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                    border: "none",
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                    padding: "12px 16px"
                  }}
                  labelStyle={{ color: textColor, fontWeight: "bold", marginBottom: "4px" }}
                  formatter={(value) => [`${value}°C`, language === "ar" ? "درجة الحرارة" : "Temperature"]}
                  labelFormatter={(label) => `${language === "ar" ? "الوقت" : "Time"}: ${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="temperature"
                  stroke="#ffffff"
                  strokeWidth={4}
                  fill={`url(#tempGradient-${refrigeratorId})`}
                  dot={{ r: 5, fill: status.color, strokeWidth: 3, stroke: "#ffffff" }}
                  activeDot={{ r: 8, fill: status.color, strokeWidth: 4, stroke: "#ffffff" }}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                  connectNulls={true}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Stats Footer with staggered animation */}
      <div className="px-4 pb-4 grid grid-cols-4 gap-2">
        {[
          { value: stats.min, label: language === "ar" ? "أدنى" : "Min", color: "#22d3ee", delay: 0 },
          { value: stats.avg, label: language === "ar" ? "متوسط" : "Avg", color: "#10b981", delay: 100 },
          { value: stats.max, label: language === "ar" ? "أعلى" : "Max", color: "#f59e0b", delay: 200 },
          { value: stats.current, label: language === "ar" ? "حالي" : "Now", color: status.color, delay: 300 },
        ].map((stat, idx) => (
          <div 
            key={idx}
            className={`p-3 rounded-xl text-center transition-all duration-500 hover:scale-105`}
            style={{ 
              backgroundColor: theme === "dark" ? "rgba(30, 41, 59, 0.6)" : "rgba(241, 245, 249, 0.8)",
              transform: isTransitioning ? "translateY(20px)" : "translateY(0)",
              opacity: isTransitioning ? 0 : 1,
              transitionDelay: `${stat.delay}ms`
            }}
          >
            <div 
              className="text-lg font-bold transition-all duration-300" 
              style={{ color: stat.color, fontFamily: "system-ui" }}
            >
              {stat.value}°
            </div>
            <div className="text-xs text-white/70">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Animated indicator bar */}
      <div className="h-1 w-full overflow-hidden">
        <div 
          className="h-full transition-all duration-1000"
          style={{ 
            background: `linear-gradient(90deg, transparent, ${status.color}, transparent)`,
            animation: isTransitioning ? "none" : "shimmer 2s infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

export default TemperatureChart;

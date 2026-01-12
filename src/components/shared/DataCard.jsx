import { useTheme } from "../../contexts/ThemeContext.jsx";

function DataCard({ title, value, subtitle, icon, trend, className = "" }) {
  const { theme } = useTheme();

  // Ensure value is always a valid string or number, never NaN
  const safeValue = (() => {
    if (value === null || value === undefined) {
      return "0";
    }
    if (typeof value === "number") {
      if (isNaN(value) || !isFinite(value)) {
        return "0";
      }
      return value.toString();
    }
    if (typeof value === "string") {
      // Check if string represents NaN
      if (value === "NaN" || value.toLowerCase() === "nan") {
        return "0";
      }
      return value;
    }
    // For any other type, convert to string
    const stringValue = String(value);
    if (stringValue === "NaN" || stringValue.toLowerCase() === "nan") {
      return "0";
    }
    return stringValue;
  })();

  const cardBgClass = theme === "dark"
    ? "bg-slate-900/90 backdrop-blur-xl border-white/20"
    : "bg-gradient-to-br from-white/95 to-[#F0FAFC]/90 backdrop-blur-xl border-[#9FE7F5]/50 shadow-xl";
  const textClass = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextClass = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/20" : "border-[#9FE7F5]/50";

  return (
    <div 
      className={`rounded-2xl ${cardBgClass} border-2 ${borderClass} p-6 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${className}`}
      style={{
        boxShadow: theme === "dark"
          ? "0 4px 16px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)"
          : "0 4px 16px rgba(66, 158, 189, 0.15), 0 0 0 1px rgba(159, 231, 245, 0.3)",
      }}
    >
      {title && (
        <div className={`text-sm font-black ${subTextClass} mb-3 uppercase tracking-widest`}>
          {title}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className={`text-5xl font-black ${textClass} mb-2 tracking-tight`}>
            {safeValue}
          </div>
          {subtitle && (
            <div className={`text-sm font-bold ${subTextClass}`}>
              {subtitle}
            </div>
          )}
          {trend && (
            <div className={`text-sm mt-2 ${trend === "up" ? (theme === "dark" ? "text-emerald-400" : "text-emerald-600") : (theme === "dark" ? "text-red-400" : "text-red-600")} font-black`}>
              {trend === "up" ? "↑" : "↓"}
            </div>
          )}
        </div>
        {icon && (
          <div className={`text-5xl ${subTextClass} opacity-60`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

export default DataCard;

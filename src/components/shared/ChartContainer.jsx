import { useTheme } from "../../contexts/ThemeContext.jsx";

function ChartContainer({ title, children, className = "" }) {
  const { theme } = useTheme();

  const cardBgClass = theme === "dark"
    ? "bg-slate-900/80 backdrop-blur-xl border-white/10"
    : "bg-gradient-to-br from-[#F0FAFC]/95 to-[#E6F7FB]/90 backdrop-blur-xl border-[#9FE7F5]/40 shadow-lg";
  const textClass = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";

  return (
    <div className={`rounded-xl ${cardBgClass} border ${borderClass} p-6 transition-all duration-300 ${className}`}>
      {title && (
        <h3 className={`text-lg font-bold ${textClass} mb-4`}>
          {title}
        </h3>
      )}
      <div className="w-full">
        {children}
      </div>
    </div>
  );
}

export default ChartContainer;










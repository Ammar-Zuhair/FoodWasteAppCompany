import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

function LocationsList({ locations, selectedLocationId, onLocationClick, onHoverLocation }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [hoveredLocation, setHoveredLocation] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case "normal":
        return { main: "#10b981", bg: "rgba(16, 185, 129, 0.15)", text: "#10b981" };
      case "warning":
        return { main: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b" };
      case "critical":
        return { main: "#ef4444", bg: "rgba(239, 68, 68, 0.15)", text: "#ef4444" };
      default:
        return { main: "#6b7280", bg: "rgba(107, 114, 128, 0.15)", text: "#6b7280" };
    }
  };

  const getTypeIcon = (type, color) => {
    switch (type) {
      case "warehouse":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M3 21h18"/>
            <path d="M5 21V7l7-4 7 4v14"/>
            <path d="M9 21v-8h6v8"/>
          </svg>
        );
      case "factory":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M2 20V10l5-3v3l5-3v3l5-3v3l5-3v13H2z"/>
            <path d="M6 15h2"/>
            <path d="M10 15h2"/>
            <path d="M14 15h2"/>
          </svg>
        );
      case "branch":
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M3 21h18"/>
            <path d="M5 21V9l7-5 7 5v12"/>
            <path d="M9 21v-6h6v6"/>
            <path d="M9 10h6"/>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        );
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "warehouse":
        return language === "ar" ? "مخزن" : "Warehouse";
      case "factory":
        return language === "ar" ? "مصنع" : "Factory";
      case "branch":
        return language === "ar" ? "فرع" : "Branch";
      default:
        return "?";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "normal":
        return language === "ar" ? "طبيعي" : "Normal";
      case "warning":
        return language === "ar" ? "تحذير" : "Warning";
      case "critical":
        return language === "ar" ? "حرج" : "Critical";
      default:
        return "?";
    }
  };

  const handleMouseEnter = (location) => {
    setHoveredLocation(location);
    if (onHoverLocation) onHoverLocation(location);
  };

  const handleMouseLeave = () => {
    setHoveredLocation(null);
    if (onHoverLocation) onHoverLocation(null);
  };

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderColor = theme === "dark" ? "rgba(255, 255, 255, 0.15)" : "rgba(66, 158, 189, 0.3)";

  return (
    <div 
      className={`rounded-2xl border-2 overflow-hidden ${
        theme === "dark" 
          ? "bg-slate-900/95 border-white/15 backdrop-blur-xl" 
          : "bg-white/90 border-[#9FE7F5]/40 backdrop-blur-xl shadow-xl"
      }`}
      style={{ height: "600px" }}
    >
      {/* Header */}
      <div 
        className={`p-4 border-b flex items-center justify-between ${
          theme === "dark" ? "bg-slate-800/50" : "bg-[#f0fafc]"
        }`}
        style={{ borderColor }}
      >
        <div className="flex items-center gap-3">
          <div 
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              theme === "dark" ? "bg-emerald-500/20" : "bg-[#429EBD]/10"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme === "dark" ? "#10b981" : "#429EBD"} strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div>
            <h4 className={`text-lg font-bold ${textColor}`}>
              {language === "ar" ? "المواقع" : "Locations"}
            </h4>
            <p className={`text-sm ${subTextColor}`}>
              {locations.length} {language === "ar" ? "موقع" : "locations"}
            </p>
          </div>
        </div>
      </div>
      
      {/* List */}
      <div 
        className="p-4 space-y-3 overflow-y-auto"
        style={{
          height: "calc(100% - 80px)",
          scrollbarWidth: "thin",
          scrollbarColor: theme === "dark" ? "rgba(255, 255, 255, 0.2) transparent" : "rgba(66, 158, 189, 0.3) transparent",
        }}
      >
        {locations.map((location) => {
          const colors = getStatusColor(location.status);
          const isHovered = hoveredLocation?.id === location.id;
          const isSelected = selectedLocationId === location.id;
          
          return (
            <div
              key={location.id}
              className={`group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                isSelected 
                  ? "ring-2 ring-offset-2" 
                  : ""
              } ${
                theme === "dark" 
                  ? "bg-slate-800/40 hover:bg-slate-800/70 border-white/10" 
                  : "bg-white/70 hover:bg-white border-[#9FE7F5]/30"
              }`}
              onClick={() => onLocationClick && onLocationClick(location)}
              onMouseEnter={() => handleMouseEnter(location)}
              onMouseLeave={handleMouseLeave}
              style={{ 
                borderLeftWidth: "4px",
                borderLeftColor: colors.main,
                transform: isHovered ? "translateX(-4px)" : "translateX(0)",
                boxShadow: isHovered || isSelected
                  ? `0 8px 24px ${colors.main}25, 0 0 0 1px ${colors.main}30`
                  : undefined,
                ringColor: colors.main,
                ringOffsetColor: theme === "dark" ? "#0f172a" : "#ffffff",
              }}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: colors.bg }}
                  >
                    {getTypeIcon(location.type, colors.main)}
                  </div>
                  <div>
                    <h5 className={`font-bold text-base ${textColor}`}>
                      {location.name}
                    </h5>
                    <p className={`text-sm ${subTextColor}`}>
                      {getTypeLabel(location.type)}
                    </p>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: colors.bg }}
                >
                  <span 
                    className={`w-2 h-2 rounded-full ${location.status === "critical" ? "animate-pulse" : ""}`}
                    style={{ backgroundColor: colors.main }}
                  />
                  <span 
                    className="text-xs font-bold"
                    style={{ color: colors.main }}
                  >
                    {getStatusLabel(location.status)}
                  </span>
                </div>
              </div>
              
              {/* Stats Row */}
              <div className="flex items-center gap-3 flex-wrap">
                <div 
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                    theme === "dark" ? "bg-slate-700/50" : "bg-slate-100"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={subTextColor.includes("dark") ? "#94a3b8" : "#429EBD"} strokeWidth="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                  <span className={`text-sm font-semibold ${textColor}`}>
                    {location.batches || 0}
                  </span>
                  <span className={`text-xs ${subTextColor}`}>
                    {language === "ar" ? "دفعة" : "batches"}
                  </span>
                </div>
                
                {location.type === "warehouse" && location.capacity > 0 && (
                  <div 
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                      theme === "dark" ? "bg-slate-700/50" : "bg-slate-100"
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={subTextColor.includes("dark") ? "#94a3b8" : "#429EBD"} strokeWidth="2">
                      <path d="M18 20V10"/>
                      <path d="M12 20V4"/>
                      <path d="M6 20v-6"/>
                    </svg>
                    <span className={`text-sm font-semibold ${textColor}`}>
                      {Math.round((location.currentStock / location.capacity) * 100)}%
                    </span>
                    <span className={`text-xs ${subTextColor}`}>
                      {language === "ar" ? "ممتلئ" : "full"}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Hover indicator */}
              <div 
                className={`absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-300 ${
                  isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
                }`}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={colors.main}
                  strokeWidth="2"
                  style={{ transform: language === "ar" ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </div>
            </div>
          );
        })}
        
        {locations.length === 0 && (
          <div className={`text-center py-12 ${subTextColor}`}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <p className="font-medium">
              {language === "ar" ? "لا توجد مواقع متاحة" : "No locations available"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LocationsList;

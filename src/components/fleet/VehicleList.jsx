import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";

function VehicleList({ vehicles, selectedVehicleId, onVehicleClick }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const getVFSColor = (vfs) => {
    if (vfs >= 80) return theme === "dark" ? "#10b981" : "#059669";
    if (vfs >= 60) return theme === "dark" ? "#f59e0b" : "#d97706";
    return theme === "dark" ? "#ef4444" : "#dc2626";
  };

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderColor = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";

  return (
    <div 
      className={`h-[700px] rounded-2xl border-2 p-6 overflow-y-auto ${
        theme === "dark" 
          ? "bg-slate-900/95 border-white/20 backdrop-blur-xl" 
          : "bg-white/90 border-[#9FE7F5]/60 backdrop-blur-xl shadow-xl"
      }`}
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: theme === "dark" ? "rgba(255, 255, 255, 0.2) transparent" : "rgba(66, 158, 189, 0.3) transparent",
        minHeight: "700px",
      }}
    >
      <h4 className={`text-xl font-black mb-6 ${theme === "dark" ? "text-white" : "text-[#053F5C]"}`}>
        {language === "ar" ? "المركبات" : "Vehicles"}
      </h4>
      <div className="space-y-3">
        {vehicles.map((vehicle) => {
          const vfsColor = getVFSColor(vehicle.vfs);
          const isSelected = selectedVehicleId === vehicle.id;
          
          return (
            <div
              key={vehicle.id}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                isSelected ? "scale-105" : "hover:scale-102"
              } ${
                theme === "dark" 
                  ? "bg-slate-800/50 border-white/20 backdrop-blur-xl" 
                  : "bg-[#F0FAFC]/80 border-[#9FE7F5]/50 backdrop-blur-xl shadow-lg"
              }`}
              onClick={() => onVehicleClick && onVehicleClick(vehicle)}
              style={{ 
                borderLeftColor: vfsColor, 
                borderLeftWidth: isSelected ? "6px" : "5px",
                boxShadow: isSelected
                  ? theme === "dark"
                    ? `0 8px 24px rgba(0, 0, 0, 0.5), 0 0 0 1px ${vfsColor}40`
                    : `0 8px 24px rgba(66, 158, 189, 0.2), 0 0 0 1px ${vfsColor}30`
                  : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className={`font-black text-base ${theme === "dark" ? "text-white" : "text-[#053F5C]"}`}>
                  {vehicle.plateNumber}
                </h4>
                <StatusBadge status={vehicle.status} />
              </div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <p className={`text-sm font-bold ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                  {vehicle.type}
                </p>
                <span className={`text-xs ${theme === "dark" ? "text-slate-500" : "text-[#9FE7F5]"}`}>•</span>
                <p className={`text-sm font-bold ${theme === "dark" ? "text-slate-300" : "text-[#053F5C]"}`}>
                  {vehicle.driver}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-black uppercase tracking-wide ${subTextColor}`}>
                    VFS:
                  </span>
                  <span 
                    className="text-lg font-black"
                    style={{ color: vfsColor }}
                  >
                    {vehicle.vfs}%
                  </span>
                </div>
                <p className={`text-xs font-bold ${subTextColor}`}>
                  {vehicle.currentLocation}
                </p>
              </div>
              {vehicle.currentTrip && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className={`text-xs font-bold ${subTextColor}`}>
                    {language === "ar" ? "في رحلة إلى:" : "Trip to:"} {vehicle.currentTrip.to}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VehicleList;






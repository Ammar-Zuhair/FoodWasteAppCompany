import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

function TripDetails({ vehicle }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  if (!vehicle || !vehicle.currentTrip) {
    return null;
  }

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderColor = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";

  const getTempColor = (temp) => {
    if (temp <= 4) return theme === "dark" ? "#10b981" : "#059669";
    if (temp <= 6) return theme === "dark" ? "#f59e0b" : "#d97706";
    return theme === "dark" ? "#ef4444" : "#dc2626";
  };

  const startTime = new Date(vehicle.currentTrip.startTime);
  const estimatedArrival = new Date(vehicle.currentTrip.estimatedArrival);
  const now = new Date();
  const elapsed = now - startTime;
  const total = estimatedArrival - startTime;
  const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));

  return (
    <div className={`rounded-2xl border-2 p-6 backdrop-blur-xl transition-all duration-300 ${
      theme === "dark" 
        ? "bg-slate-900/95 border-white/20 shadow-2xl" 
        : "bg-white/90 border-[#9FE7F5]/60 shadow-xl"
    }`}>
      <h3 className={`text-2xl font-black mb-6 ${textColor}`}>
        {language === "ar" ? "تفاصيل الرحلة الحالية" : "Current Trip Details"}
      </h3>
      
      <div className="space-y-6">
        {/* معلومات الرحلة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-700/20">
            <p className={`text-xs font-black uppercase tracking-wide mb-2 ${subTextColor}`}>
              {language === "ar" ? "من" : "From"}
            </p>
            <p className={`font-black text-lg ${textColor}`}>{vehicle.currentTrip.from}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-700/20">
            <p className={`text-xs font-black uppercase tracking-wide mb-2 ${subTextColor}`}>
              {language === "ar" ? "إلى" : "To"}
            </p>
            <p className={`font-black text-lg ${textColor}`}>{vehicle.currentTrip.to}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-700/20">
            <p className={`text-xs font-black uppercase tracking-wide mb-2 ${subTextColor}`}>
              {language === "ar" ? "المنتج" : "Product"}
            </p>
            <p className={`font-black text-lg ${textColor}`}>{vehicle.currentTrip.product}</p>
          </div>
          <div className="p-4 rounded-lg bg-slate-700/20">
            <p className={`text-xs font-black uppercase tracking-wide mb-2 ${subTextColor}`}>
              {language === "ar" ? "السائق" : "Driver"}
            </p>
            <p className={`font-black text-lg ${textColor}`}>{vehicle.driver}</p>
          </div>
        </div>

        {/* تقدم الرحلة */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm font-black uppercase tracking-wide ${subTextColor}`}>
              {language === "ar" ? "تقدم الرحلة" : "Trip Progress"}
            </p>
            <span className={`text-lg font-black ${textColor}`}>
              {Math.round(vehicle.currentTrip.progress || progress)}%
            </span>
          </div>
          <div className="flex-1 h-4 rounded-full overflow-hidden bg-slate-700/30 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 transition-all duration-700 shadow-lg"
              style={{ width: `${vehicle.currentTrip.progress || progress}%` }}
            />
          </div>
          {vehicle.currentTrip.distanceRemaining && (
            <p className={`text-xs font-bold mt-2 ${subTextColor}`}>
              {language === "ar" ? "المسافة المتبقية:" : "Distance Remaining:"} {vehicle.currentTrip.distanceRemaining} {language === "ar" ? "كم" : "km"}
            </p>
          )}
        </div>

        {/* معلومات الحالة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-slate-700/20">
            <p className={`text-xs font-black uppercase tracking-wide mb-2 ${subTextColor}`}>
              {language === "ar" ? "درجة الحرارة" : "Temperature"}
            </p>
            <p 
              className="font-black text-2xl"
              style={{ color: getTempColor(vehicle.currentTrip.currentTemp) }}
            >
              {vehicle.currentTrip.currentTemp}°C
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-700/20">
            <p className={`text-xs font-black uppercase tracking-wide mb-2 ${subTextColor}`}>
              {language === "ar" ? "السرعة" : "Speed"}
            </p>
            <p className={`font-black text-2xl ${textColor}`}>
              {vehicle.speed} {language === "ar" ? "كم/س" : "km/h"}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-700/20">
            <p className={`text-xs font-black uppercase tracking-wide mb-2 ${subTextColor}`}>
              {language === "ar" ? "مستوى الوقود" : "Fuel Level"}
            </p>
            <p className={`font-black text-2xl ${textColor}`}>
              {vehicle.fuelLevel}%
            </p>
          </div>
          <div className="p-4 rounded-lg bg-slate-700/20">
            <p className={`text-xs font-black uppercase tracking-wide mb-2 ${subTextColor}`}>
              {language === "ar" ? "الوصول المتوقع" : "ETA"}
            </p>
            <p className={`font-black text-lg ${textColor}`}>
              {estimatedArrival.toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US", { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripDetails;









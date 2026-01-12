import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import DataCard from "../shared/DataCard.jsx";

function ProductionLinesStatus({ productionLines }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderColor = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";

  const stats = {
    active: productionLines.filter((line) => line.status === "active").length,
    idle: productionLines.filter((line) => line.status === "idle").length,
    maintenance: productionLines.filter((line) => line.status === "maintenance").length,
    avgEfficiency: Math.round(
      productionLines
        .filter((line) => line.status === "active")
        .reduce((sum, line) => sum + line.efficiency, 0) /
        productionLines.filter((line) => line.status === "active").length || 1
    ),
  };

  return (
    <div className="space-y-6 relative">
      <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/5 via-blue-500/5 to-amber-500/5 rounded-2xl blur-xl opacity-50" />
      <div className="relative">
        <h3 className={`text-2xl font-black mb-6 ${textColor}`}>
          {language === "ar" ? "حالة خطوط الإنتاج" : "Production Lines Status"}
        </h3>
        
        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <DataCard
          title={language === "ar" ? "نشطة" : "Active"}
          value={stats.active}
          unit={language === "ar" ? "خط" : "lines"}
          color="green"
        />
        <DataCard
          title={language === "ar" ? "متوقفة" : "Idle"}
          value={stats.idle}
          unit={language === "ar" ? "خط" : "lines"}
          color="gray"
        />
        <DataCard
          title={language === "ar" ? "صيانة" : "Maintenance"}
          value={stats.maintenance}
          unit={language === "ar" ? "خط" : "lines"}
          color="orange"
        />
        <DataCard
          title={language === "ar" ? "متوسط الكفاءة" : "Avg Efficiency"}
          value={stats.avgEfficiency}
          unit="%"
          color="blue"
        />
        </div>

        {/* قائمة خطوط الإنتاج */}
        <div className={`rounded-2xl border-2 p-6 backdrop-blur-xl transition-all duration-300 relative overflow-hidden ${
        theme === "dark" 
          ? "bg-slate-900/95 border-white/20 shadow-2xl" 
          : "bg-white/90 border-[#9FE7F5]/60 shadow-xl"
      }`}>
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 rounded-full blur-3xl -z-0" />
          <div className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productionLines.map((line) => (
                <div
                  key={line.id}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer group relative overflow-hidden ${
                  theme === "dark" 
                    ? "bg-slate-800/60 border-white/10 hover:border-emerald-500/40" 
                    : "bg-[#F0FAFC]/80 border-[#9FE7F5]/40 hover:border-emerald-400/60"
                  }`}
                  style={{
                    transform: "translateZ(0)",
                  }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-500/10 to-amber-500/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className={`font-black text-lg ${textColor}`}>{line.name}</h4>
                      <StatusBadge status={line.status} />
                    </div>
                    
                    {line.status === "active" && (
                      <>
                        <div className="space-y-3 mb-4">
                          <div className="p-3 rounded-lg bg-slate-700/20">
                            <p className={`text-xs font-black uppercase tracking-wide mb-1 ${subTextColor}`}>
                              {language === "ar" ? "المنتج الحالي" : "Current Product"}
                            </p>
                            <p className={`font-black text-lg ${textColor}`}>{line.currentProduct}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-slate-700/20">
                              <p className={`text-xs font-black uppercase tracking-wide mb-1 ${subTextColor}`}>
                                {language === "ar" ? "معدل الإنتاج" : "Rate"}
                              </p>
                              <p className={`font-black text-xl ${textColor}`}>
                                {line.productionRate}
                              </p>
                              <p className={`text-xs font-bold ${subTextColor}`}>
                                {language === "ar" ? "وحدة/ساعة" : "units/hr"}
                              </p>
                            </div>
                            <div className="p-3 rounded-lg bg-slate-700/20">
                              <p className={`text-xs font-black uppercase tracking-wide mb-1 ${subTextColor}`}>
                                {language === "ar" ? "الكفاءة" : "Efficiency"}
                              </p>
                              <p className={`font-black text-xl ${textColor}`}>{line.efficiency}%</p>
                            </div>
                          </div>
                          <div>
                            <p className={`text-xs font-black uppercase tracking-wide mb-2 ${subTextColor}`}>
                              {language === "ar" ? "الإنجاز" : "Progress"}
                            </p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-3 rounded-full overflow-hidden bg-slate-700/30 shadow-inner">
                                <div
                                  className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 transition-all duration-700 shadow-lg"
                                  style={{ 
                                    width: `${(line.completedHours / line.scheduledHours) * 100}%` 
                                  }}
                                />
                              </div>
                              <span className={`text-sm font-black min-w-14 text-right ${textColor}`}>
                                {line.completedHours}/{line.scheduledHours}h
                              </span>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {line.status === "idle" && (
                      <div className="p-4 rounded-lg bg-slate-700/20 text-center">
                        <p className={`text-sm font-bold ${subTextColor}`}>
                          {language === "ar" ? "لا يوجد إنتاج حالياً" : "No production currently"}
                        </p>
                      </div>
                    )}
                    
                    {line.status === "maintenance" && (
                      <div className="space-y-2 p-3 rounded-lg bg-slate-700/20">
                        <p className={`text-xs font-black uppercase tracking-wide ${subTextColor}`}>
                          {language === "ar" ? "الصيانة حتى:" : "Maintenance until:"}
                        </p>
                        <p className={`font-black text-lg ${textColor}`}>
                          {new Date(line.nextMaintenance).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductionLinesStatus;


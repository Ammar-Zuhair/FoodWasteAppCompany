import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";

function RefrigerationTable({ refrigerators, onSelectFridge }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  const tableBgClass = theme === "dark"
    ? "bg-slate-900/80 backdrop-blur-xl border-white/10"
    : "bg-gradient-to-br from-[#F0FAFC]/95 to-[#E6F7FB]/90 backdrop-blur-xl border-[#9FE7F5]/40 shadow-lg";
  const textClass = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextClass = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const headerBgClass = theme === "dark"
    ? "bg-slate-800/50"
    : "bg-[#9FE7F5]/20";

  const getTempColor = (temp, normalRange) => {
    if (temp < normalRange.min || temp > normalRange.max) {
      return theme === "dark" ? "text-red-400" : "text-red-600";
    }
    return theme === "dark" ? "text-emerald-400" : "text-emerald-600";
  };

  const getEnergyStatus = (current, normal) => {
    const diff = ((current - normal) / normal) * 100;
    if (diff > 20) return { status: "عالي", color: "text-red-400" };
    if (diff > 10) return { status: "مرتفع", color: "text-amber-400" };
    return { status: "طبيعي", color: "text-emerald-400" };
  };

  return (
    <div className={`rounded-xl ${tableBgClass} border ${borderClass} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={headerBgClass}>
            <tr>
              <th className={`px-6 py-4 text-right text-sm font-bold ${textClass} whitespace-nowrap`}>
                {language === "ar" ? "رقم الثلاجة" : "Refrigerator ID"}
              </th>
              <th className={`px-6 py-4 text-right text-sm font-bold ${textClass} whitespace-nowrap`}>
                {language === "ar" ? "الموقع" : "Location"}
              </th>
              <th className={`px-6 py-4 text-right text-sm font-bold ${textClass} whitespace-nowrap`}>
                {language === "ar" ? "الحرارة" : "Temperature"}
              </th>
              <th className={`px-6 py-4 text-right text-sm font-bold ${textClass} whitespace-nowrap`}>
                {language === "ar" ? "الحد الطبيعي" : "Normal Range"}
              </th>
              <th className={`px-6 py-4 text-right text-sm font-bold ${textClass} whitespace-nowrap`}>
                {language === "ar" ? "آخر فتح" : "Last Door Open"}
              </th>
              <th className={`px-6 py-4 text-right text-sm font-bold ${textClass} whitespace-nowrap`}>
                {language === "ar" ? "الطاقة" : "Energy"}
              </th>
              <th className={`px-6 py-4 text-right text-sm font-bold ${textClass} whitespace-nowrap`}>
                {language === "ar" ? "الحالة" : "Status"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-opacity-20">
            {refrigerators.map((fridge, index) => {
              const energyStatus = getEnergyStatus(fridge.energyConsumption, fridge.normalEnergy);
              return (
                <tr
                  key={fridge.id}
                  onClick={() => onSelectFridge && onSelectFridge(fridge.id)}
                  className={`transition-colors duration-200 cursor-pointer ${
                    theme === "dark" ? "hover:bg-slate-800/50" : "hover:bg-[#9FE7F5]/10"
                  }`}
                >
                  <td className={`px-6 py-4 ${textClass} font-semibold`}>
                    {fridge.id}
                  </td>
                  <td className={`px-6 py-4 ${subTextClass} text-sm`}>
                    {fridge.location}
                  </td>
                  <td className={`px-6 py-4 font-bold ${getTempColor(fridge.currentTemp, fridge.normalRange)}`}>
                    {fridge.currentTemp}°C
                  </td>
                  <td className={`px-6 py-4 ${subTextClass} text-sm`}>
                    {fridge.normalRange.min}°C - {fridge.normalRange.max}°C
                  </td>
                  <td className={`px-6 py-4 ${subTextClass} text-sm`}>
                    {fridge.lastDoorOpen}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`font-semibold ${energyStatus.color}`}>
                        {fridge.energyConsumption} kW
                      </span>
                      <span className={`text-xs ${subTextClass}`}>
                        {energyStatus.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={fridge.status} size="sm" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RefrigerationTable;


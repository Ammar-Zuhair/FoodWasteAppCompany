import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";

function ProductionScheduleTable({ schedule, onScheduleClick }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "green";
      case "in-progress":
        return "blue";
      case "scheduled":
        return "gray";
      case "cancelled":
        return "red";
      default:
        return "gray";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return theme === "dark" ? "text-red-400" : "text-red-600";
      case "medium":
        return theme === "dark" ? "text-yellow-400" : "text-yellow-600";
      case "low":
        return theme === "dark" ? "text-green-400" : "text-green-600";
      default:
        return theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
    }
  };

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderColor = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const bgColor = theme === "dark" ? "bg-slate-800/50" : "bg-[#F0FAFC]/50";

  return (
    <div className={`rounded-2xl border-2 p-6 backdrop-blur-xl transition-all duration-300 relative overflow-hidden ${theme === "dark"
        ? "bg-slate-900/95 border-white/20 shadow-2xl"
        : "bg-white/90 border-[#9FE7F5]/60 shadow-xl"
      }`}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500/10 to-amber-500/10 rounded-full blur-3xl -z-0" />
      <div className="relative z-10">
        <h3 className={`text-2xl font-black mb-6 ${textColor}`}>
          {language === "ar" ? "جدول الإنتاج" : "Production Schedule"}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b-2 ${borderColor}`}>
                <th className={`text-right py-4 px-5 font-black text-sm uppercase tracking-wider ${subTextColor}`}>
                  {language === "ar" ? "المنتج" : "Product"}
                </th>
                <th className={`text-right py-4 px-5 font-black text-sm uppercase tracking-wider ${subTextColor}`}>
                  {language === "ar" ? "خط الإنتاج" : "Production Line"}
                </th>
                <th className={`text-right py-4 px-5 font-black text-sm uppercase tracking-wider ${subTextColor}`}>
                  {language === "ar" ? "التاريخ" : "Date"}
                </th>
                <th className={`text-right py-4 px-5 font-black text-sm uppercase tracking-wider ${subTextColor}`}>
                  {language === "ar" ? "الوقت" : "Time"}
                </th>
                <th className={`text-right py-4 px-5 font-black text-sm uppercase tracking-wider ${subTextColor}`}>
                  {language === "ar" ? "الكمية" : "Quantity"}
                </th>
                <th className={`text-right py-4 px-5 font-black text-sm uppercase tracking-wider ${subTextColor}`}>
                  {language === "ar" ? "الحالة" : "Status"}
                </th>
                <th className={`text-right py-4 px-5 font-black text-sm uppercase tracking-wider ${subTextColor}`}>
                  {language === "ar" ? "الإنجاز" : "Progress"}
                </th>
              </tr>
            </thead>
            <tbody>
              {schedule.map((item) => (
                <tr
                  key={item.id}
                  className={`border-b ${borderColor} transition-all duration-300 hover:scale-[1.01] hover:shadow-lg cursor-pointer group ${theme === "dark" ? "hover:bg-slate-800/70" : "hover:bg-[#F0FAFC]/70"
                    }`}
                  onClick={() => onScheduleClick && onScheduleClick(item)}
                  style={{
                    transform: "translateZ(0)",
                  }}
                >
                  <td className="py-4 px-5">
                    <p className={`font-black text-base mb-1 ${textColor}`}>
                      {language === "ar" ? (item.product_name || item.product) : (item.product_name_en || item.product_en || item.product)}
                    </p>
                    <p className={`text-xs font-bold ${subTextColor}`}>
                      {language === "ar" ? (item.facility_name || item.governorate) : (item.facility_name_en || item.governorate_en || item.governorate)}
                    </p>
                  </td>
                  <td className="py-4 px-5">
                    <p className={`font-black text-sm mb-1 ${textColor}`}>{item.productionLine}</p>
                    <p className={`text-xs font-semibold ${subTextColor}`}>{item.factory}</p>
                  </td>
                  <td className="py-4 px-5">
                    <p className={`font-black text-base ${textColor}`}>
                      {new Date(item.scheduledDate).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                    </p>
                  </td>
                  <td className="py-4 px-5">
                    <p className={`font-black text-base ${textColor}`}>
                      {item.startTime} - {item.endTime}
                    </p>
                  </td>
                  <td className="py-4 px-5">
                    <p className={`font-black text-xl mb-1 ${textColor}`}>
                      {item.quantity?.toLocaleString()}
                    </p>
                    <p className={`text-xs font-bold ${subTextColor}`}>
                      {language === "ar" ? "متوقع: " : "Forecast: "}
                      {item.demandForecast?.toLocaleString()}
                    </p>
                  </td>
                  <td className="py-4 px-5">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 rounded-full overflow-hidden bg-slate-700/30 shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 transition-all duration-700 shadow-lg"
                          style={{ width: `${item.completion || 0}%` }}
                        />
                      </div>
                      <span className={`text-sm font-black min-w-12 text-right ${textColor}`}>
                        {item.completion || 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ProductionScheduleTable;


import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

function RootCauseAnalysis({ wasteData }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const textColor = theme === "dark" ? "#ffffff" : "#053F5C";
  const subTextColor = theme === "dark" ? "#94a3b8" : "#429EBD";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  // بيانات وهمية عن اليمن
  const dummyWasteData = useMemo(() => [
    { id: 1, product: language === "ar" ? "حليب طازج" : "Fresh Milk", rootCause: "Expiry", wasteAmount: 150, confidence: 0.92, date: new Date().toISOString(), location: language === "ar" ? "صنعاء" : "Sana'a" },
    { id: 2, product: language === "ar" ? "زبادي" : "Yogurt", rootCause: "Storage", wasteAmount: 80, confidence: 0.85, date: new Date(Date.now() - 86400000).toISOString(), location: language === "ar" ? "عدن" : "Aden" },
    { id: 3, product: language === "ar" ? "جبنة" : "Cheese", rootCause: "Transport", wasteAmount: 45, confidence: 0.78, date: new Date(Date.now() - 172800000).toISOString(), location: language === "ar" ? "تعز" : "Taiz" },
    { id: 4, product: language === "ar" ? "عصير برتقال" : "Orange Juice", rootCause: "Overproduction", wasteAmount: 200, confidence: 0.88, date: new Date(Date.now() - 259200000).toISOString(), location: language === "ar" ? "الحديدة" : "Hodeidah" },
    { id: 5, product: language === "ar" ? "كريمة" : "Cream", rootCause: "Damage", wasteAmount: 35, confidence: 0.72, date: new Date(Date.now() - 345600000).toISOString(), location: language === "ar" ? "إب" : "Ibb" },
    { id: 6, product: language === "ar" ? "زبدة" : "Butter", rootCause: "Storage", wasteAmount: 60, confidence: 0.81, date: new Date(Date.now() - 432000000).toISOString(), location: language === "ar" ? "المكلا" : "Mukalla" },
    { id: 7, product: language === "ar" ? "لبن" : "Buttermilk", rootCause: "Expiry", wasteAmount: 90, confidence: 0.89, date: new Date(Date.now() - 518400000).toISOString(), location: language === "ar" ? "ذمار" : "Dhamar" },
    { id: 8, product: language === "ar" ? "عصير تفاح" : "Apple Juice", rootCause: "Transport", wasteAmount: 55, confidence: 0.75, date: new Date(Date.now() - 604800000).toISOString(), location: language === "ar" ? "سيئون" : "Sayun" },
  ], [language]);

  const displayData = (wasteData && wasteData.length > 0) ? wasteData : dummyWasteData;

  // تحويل الأسباب للعربية
  const getCauseName = (cause) => {
    const causeMap = {
      "Storage": language === "ar" ? "التخزين" : "Storage",
      "Transport": language === "ar" ? "النقل" : "Transport",
      "Overproduction": language === "ar" ? "الإفراط في الإنتاج" : "Overproduction",
      "Expiry": language === "ar" ? "انتهاء الصلاحية" : "Expiry",
      "Damage": language === "ar" ? "التلف" : "Damage",
      "Unknown": language === "ar" ? "غير معروف" : "Unknown"
    };
    return causeMap[cause] || cause;
  };

  // تحليل الأسباب الجذرية
  const rootCauseStats = useMemo(() => {
    const causeCount = {};
    const causeAmount = {};

    displayData.forEach((item) => {
      const cause = item.rootCause || "Unknown";
      causeCount[cause] = (causeCount[cause] || 0) + 1;
      causeAmount[cause] = (causeAmount[cause] || 0) + (item.wasteAmount || 0);
    });

    return Object.keys(causeCount).map((cause) => ({
      cause,
      causeName: getCauseName(cause),
      count: causeCount[cause],
      amount: causeAmount[cause],
    })).sort((a, b) => b.amount - a.amount);
  }, [displayData, language]);

  // الألوان
  const COLORS = {
    "Expiry": "#ef4444",
    "Storage": "#f59e0b",
    "Transport": "#3b82f6",
    "Overproduction": "#8b5cf6",
    "Damage": "#ec4899",
    "Unknown": "#6b7280"
  };

  const totalWaste = displayData.reduce((sum, item) => sum + (item.wasteAmount || 0), 0);
  const totalIncidents = displayData.length;
  const avgConfidence = displayData.reduce((sum, item) => sum + (item.confidence || 0), 0) / displayData.length;
  const maxAmount = Math.max(...rootCauseStats.map(s => s.amount));

  return (
    <div className="space-y-6">
      {/* بطاقات إحصائية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-xl border-2 ${borderClass} ${cardBgClass}`}>
          <div className="text-sm" style={{ color: subTextColor }}>{language === "ar" ? "إجمالي الهدر" : "Total Waste"}</div>
          <div className="text-3xl font-bold mt-1" style={{ color: textColor }}>{totalWaste.toLocaleString()}</div>
          <div className="text-xs mt-1" style={{ color: subTextColor }}>{language === "ar" ? "كيلوغرام" : "kg"}</div>
        </div>
        <div className={`p-5 rounded-xl border-2 ${borderClass} ${cardBgClass}`}>
          <div className="text-sm" style={{ color: subTextColor }}>{language === "ar" ? "عدد الحوادث" : "Incidents"}</div>
          <div className="text-3xl font-bold mt-1" style={{ color: textColor }}>{totalIncidents}</div>
          <div className="text-xs mt-1" style={{ color: subTextColor }}>{language === "ar" ? "حادثة" : "incidents"}</div>
        </div>
        <div className={`p-5 rounded-xl border-2 ${borderClass} ${cardBgClass}`}>
          <div className="text-sm" style={{ color: subTextColor }}>{language === "ar" ? "دقة التحليل" : "Accuracy"}</div>
          <div className="text-3xl font-bold mt-1 text-emerald-500">{Math.round(avgConfidence * 100)}%</div>
          <div className="text-xs mt-1" style={{ color: subTextColor }}>{language === "ar" ? "متوسط الثقة" : "avg confidence"}</div>
        </div>
        <div className={`p-5 rounded-xl border-2 ${borderClass} ${cardBgClass}`}>
          <div className="text-sm" style={{ color: subTextColor }}>{language === "ar" ? "الأسباب" : "Causes"}</div>
          <div className="text-3xl font-bold mt-1" style={{ color: textColor }}>{rootCauseStats.length}</div>
          <div className="text-xs mt-1" style={{ color: subTextColor }}>{language === "ar" ? "سبب مختلف" : "different"}</div>
        </div>
      </div>

      {/* توزيع الأسباب - Custom Donut Chart */}
      <div className={`rounded-xl border-2 ${borderClass} ${cardBgClass} p-6`}>
        <h3 className="text-xl font-bold mb-6" style={{ color: textColor }}>
          {language === "ar" ? "توزيع الأسباب الجذرية" : "Root Cause Distribution"}
        </h3>

        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Donut Chart */}
          <div className="relative w-64 h-64">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {(() => {
                let currentAngle = 0;
                const total = rootCauseStats.reduce((sum, s) => sum + s.count, 0);
                return rootCauseStats.map((stat, index) => {
                  const percentage = stat.count / total;
                  const angle = percentage * 360;
                  const startAngle = currentAngle;
                  currentAngle += angle;

                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = ((startAngle + angle) * Math.PI) / 180;

                  const x1 = 50 + 40 * Math.cos(startRad);
                  const y1 = 50 + 40 * Math.sin(startRad);
                  const x2 = 50 + 40 * Math.cos(endRad);
                  const y2 = 50 + 40 * Math.sin(endRad);

                  const largeArc = angle > 180 ? 1 : 0;

                  return (
                    <path
                      key={index}
                      d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={COLORS[stat.cause] || "#6b7280"}
                      stroke={theme === "dark" ? "#1e293b" : "#ffffff"}
                      strokeWidth="1"
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  );
                });
              })()}
              {/* Center circle for donut effect */}
              <circle cx="50" cy="50" r="25" fill={theme === "dark" ? "#1e293b" : "#ffffff"} />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: textColor }}>{totalIncidents}</span>
              <span className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "حادثة" : "incidents"}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 grid grid-cols-2 gap-3">
            {rootCauseStats.map((stat, index) => {
              const percentage = Math.round((stat.count / displayData.length) * 100);
              return (
                <div key={index} className={`p-3 rounded-lg ${theme === "dark" ? "bg-slate-800/50" : "bg-slate-50"} flex items-center gap-3`}>
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[stat.cause] || "#6b7280" }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: textColor }}>{stat.causeName}</div>
                    <div className="text-xs" style={{ color: subTextColor }}>{stat.count} ({percentage}%)</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* تحليل تفصيلي - Custom Bar Chart */}
      <div className={`rounded-xl border-2 ${borderClass} ${cardBgClass} p-6`}>
        <h3 className="text-xl font-bold mb-6" style={{ color: textColor }}>
          {language === "ar" ? "تحليل تفصيلي للأسباب" : "Detailed Cause Analysis"}
        </h3>

        <div className="space-y-4">
          {rootCauseStats.map((stat, index) => {
            const widthPercent = (stat.amount / maxAmount) * 100;
            return (
              <div key={index} className="flex items-center gap-4">
                <div className="w-32 text-right flex-shrink-0">
                  <span className="text-sm font-semibold" style={{ color: textColor }}>{stat.causeName}</span>
                </div>
                <div className="flex-1 relative">
                  <div
                    className={`h-10 rounded-lg ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}
                  >
                    <div
                      className="h-full rounded-lg flex items-center justify-between px-3 transition-all duration-500"
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: COLORS[stat.cause] || "#6b7280",
                        minWidth: "60px"
                      }}
                    >
                      <span className="text-white text-xs font-bold">{stat.count} {language === "ar" ? "حادثة" : "inc"}</span>
                      <span className="text-white text-sm font-bold">{stat.amount.toLocaleString()} {language === "ar" ? "حبة" : "pcs"}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#ef4444" }} />
            <span className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "انتهاء صلاحية" : "Expiry"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#f59e0b" }} />
            <span className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "تخزين" : "Storage"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#3b82f6" }} />
            <span className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "نقل" : "Transport"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#8b5cf6" }} />
            <span className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "إفراط إنتاج" : "Overproduction"}</span>
          </div>
        </div>
      </div>

      {/* جدول تفصيلي */}
      <div className={`rounded-xl border-2 ${borderClass} ${cardBgClass} overflow-hidden`}>
        <div className={`px-6 py-4 border-b ${borderClass} ${theme === "dark" ? "bg-slate-800/50" : "bg-[#E0F7FA]"}`}>
          <h3 className="text-lg font-bold" style={{ color: textColor }}>
            {language === "ar" ? "تفاصيل الحوادث" : "Incident Details"}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme === "dark" ? "bg-slate-800/30" : "bg-slate-50"}`}>
              <tr>
                <th className="px-4 py-3 text-right text-sm font-bold" style={{ color: textColor }}>{language === "ar" ? "المنتج" : "Product"}</th>
                <th className="px-4 py-3 text-right text-sm font-bold" style={{ color: textColor }}>{language === "ar" ? "الموقع" : "Location"}</th>
                <th className="px-4 py-3 text-center text-sm font-bold" style={{ color: textColor }}>{language === "ar" ? "السبب" : "Cause"}</th>
                <th className="px-4 py-3 text-center text-sm font-bold" style={{ color: textColor }}>{language === "ar" ? "الكمية" : "Amount"}</th>
                <th className="px-4 py-3 text-center text-sm font-bold" style={{ color: textColor }}>{language === "ar" ? "الثقة" : "Confidence"}</th>
                <th className="px-4 py-3 text-center text-sm font-bold" style={{ color: textColor }}>{language === "ar" ? "التاريخ" : "Date"}</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((item, index) => (
                <tr
                  key={index}
                  className={`border-t ${borderClass} border-l-4 transition-colors ${theme === "dark" ? "hover:bg-slate-800/30" : "hover:bg-slate-50"}`}
                  style={{ borderLeftColor: COLORS[item.rootCause] || "#6b7280" }}
                >
                  <td className="px-4 py-3">
                    <span className="font-semibold" style={{ color: textColor }}>{item.product}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span style={{ color: subTextColor }}>{item.location}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: COLORS[item.rootCause] || "#6b7280" }}
                    >
                      {getCauseName(item.rootCause)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-bold" style={{ color: textColor }}>
                    {item.wasteAmount} <span className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "حبة" : "pcs"}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${item.confidence * 100}%`,
                            backgroundColor: item.confidence >= 0.8 ? "#10b981" : item.confidence >= 0.6 ? "#f59e0b" : "#ef4444"
                          }}
                        />
                      </div>
                      <span className="text-sm font-bold" style={{
                        color: item.confidence >= 0.8 ? "#10b981" : item.confidence >= 0.6 ? "#f59e0b" : "#ef4444"
                      }}>
                        {Math.round(item.confidence * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center" style={{ color: subTextColor }}>
                    {new Date(item.date).toLocaleDateString(language === "ar" ? "ar-YE" : "en-US")}
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

export default RootCauseAnalysis;

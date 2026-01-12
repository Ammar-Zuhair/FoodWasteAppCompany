import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import ChartContainer from "../shared/ChartContainer.jsx";

function SpoilagePrediction({ predictions }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  // Ensure predictions is an array - no dummy data
  const safePredictions = useMemo(() => {
    if (Array.isArray(predictions) && predictions.length > 0) {
      return predictions;
    }
    // Return empty array - no dummy data
    return [];
  }, [predictions]);

  // Process chart data
  const chartData = useMemo(() => {
    return safePredictions
      .map((pred) => ({
        name: pred.productName || pred.product || "Unknown",
        risk: pred.spoilageRisk || pred.riskScore || 0,
        batchCode: pred.batchCode || pred.batchId || "",
        daysUntilExpiry: pred.daysUntilExpiry,
        storageLocation: pred.storageLocation,
        quantity: pred.quantity,
        unit: pred.unit,
      }))
      .sort((a, b) => b.risk - a.risk);
  }, [safePredictions]);

  // Get risk color
  const getRiskColor = (risk) => {
    if (risk >= 70) return theme === "dark" ? "#ef4444" : "#dc2626";
    if (risk >= 40) return theme === "dark" ? "#f59e0b" : "#d97706";
    return theme === "dark" ? "#10b981" : "#059669";
  };

  // Get risk level text
  const getRiskLevel = (risk) => {
    if (risk >= 70) return language === "ar" ? "عالي جداً" : "Very High";
    if (risk >= 40) return language === "ar" ? "متوسط" : "Medium";
    return language === "ar" ? "منخفض" : "Low";
  };

  // Get risk background
  const getRiskBg = (risk) => {
    if (risk >= 70) return theme === "dark" ? "bg-red-500/10" : "bg-red-50";
    if (risk >= 40) return theme === "dark" ? "bg-amber-500/10" : "bg-amber-50";
    return theme === "dark" ? "bg-emerald-500/10" : "bg-emerald-50";
  };

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderColor = theme === "dark" ? "border-slate-700" : "border-[#9FE7F5]";

  return (
    <div className="space-y-6">
      {/* Prediction Cards (البطاقات فقط - تم إخفاء الجدول) */}

      {safePredictions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {safePredictions.map((pred, idx) => {
            const risk = pred.spoilageRisk || pred.riskScore || 0;
            const riskColor = getRiskColor(risk);
            const riskLevel = getRiskLevel(risk);
            const riskBg = getRiskBg(risk);

            return (
              <div
                key={pred.batchCode || pred.batchId || idx}
                className={`group rounded-xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${theme === "dark"
                  ? "bg-slate-900/90 border-white/10 backdrop-blur-xl"
                  : "bg-white/80 border-[#9FE7F5]/50 backdrop-blur-xl"
                  }`}
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: riskColor,
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h4 className={`text-lg font-bold ${textColor} truncate max-w-[60%]`}>
                    {pred.productName || pred.product || "Unknown"}
                  </h4>
                  <span
                    className="text-xs px-3 py-1.5 rounded-full font-bold"
                    style={{
                      backgroundColor: `${riskColor}20`,
                      color: riskColor,
                    }}
                  >
                    {riskLevel}
                  </span>
                </div>

                {/* Risk Value */}
                <div className="flex items-end gap-2 mb-4">
                  <span
                    className="text-4xl font-black"
                    style={{ color: riskColor }}
                  >
                    {risk}%
                  </span>
                  <span className={`text-sm pb-1 ${subTextColor}`}>
                    {language === "ar" ? "نسبة الخطورة" : "risk score"}
                  </span>
                </div>

                {/* Mini Progress Bar */}
                <div
                  className={`h-2 rounded-full overflow-hidden mb-4 ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"
                    }`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${risk}%`,
                      backgroundColor: riskColor,
                    }}
                  />
                </div>

                {/* Batch Info */}
                <div className={`space-y-2 text-sm ${subTextColor}`}>
                  {pred.batchCode && (
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      </svg>
                      <span className="font-mono">{pred.batchCode}</span>
                    </div>
                  )}
                  {pred.daysUntilExpiry !== undefined && (
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>
                        {pred.daysUntilExpiry} {language === "ar" ? "يوم" : "days"}
                      </span>
                    </div>
                  )}
                  {/* Storage Location */}
                  {pred.storageLocation && pred.storageLocation.facilityName && (
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      <span>{pred.storageLocation.facilityName}</span>
                      {pred.storageLocation.zoneName && (
                        <span className="opacity-60">- {pred.storageLocation.zoneName}</span>
                      )}
                    </div>
                  )}
                  {/* Quantity */}
                  {pred.quantity > 0 && (
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-60">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <line x1="3" y1="9" x2="21" y2="9" />
                        <line x1="9" y1="21" x2="9" y2="9" />
                      </svg>
                      <span>
                        {pred.quantity} {pred.unit || ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Warning for high risk */}
                {risk >= 70 && (
                  <div
                    className={`mt-4 p-3 rounded-lg ${riskBg} flex items-center gap-2`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={riskColor} strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span className="text-sm font-semibold" style={{ color: riskColor }}>
                      {language === "ar" ? "يتطلب إجراء فوري!" : "Immediate action required!"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SpoilagePrediction;

import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";
import DataCard from "../shared/DataCard.jsx";

function BatchTracker({ batches, onBatchClick }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [hoveredBatch, setHoveredBatch] = useState(null);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "high":
        return theme === "dark" ? "#ef4444" : "#dc2626";
      case "medium":
        return theme === "dark" ? "#f59e0b" : "#d97706";
      case "low":
        return theme === "dark" ? "#10b981" : "#059669";
      default:
        return theme === "dark" ? "#6b7280" : "#9ca3af";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US");
  };

  return (
    <div className="space-y-6">
      <h3 className={`text-2xl font-black ${theme === "dark" ? "text-white" : "text-[#053F5C]"}`}>
        {language === "ar" ? "تتبع الدفعات" : "Batch Tracking"}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DataCard
          title={language === "ar" ? "إجمالي الدفعات" : "Total Batches"}
          value={batches?.length || 0}
          subtitle={language === "ar" ? "دفعة نشطة" : "active batches"}
        />
        <DataCard
          title={language === "ar" ? "دفعات عالية الخطورة" : "High Risk Batches"}
          value={batches?.filter((b) => b.riskLevel === "high").length || 0}
          subtitle={language === "ar" ? "تحتاج متابعة" : "need attention"}
          trend="up"
        />
        <DataCard
          title={language === "ar" ? "متوسط العمر المتبقي" : "Avg Remaining Life"}
          value={`${Math.round(batches?.reduce((sum, b) => sum + b.remainingLife, 0) / (batches?.length || 1)) || 0}`}
          subtitle={language === "ar" ? "يوم" : "days"}
        />
      </div>

      <div className="space-y-4">
        {batches?.map((batch) => {
          const isHovered = hoveredBatch === batch.id;
          const riskColor = getRiskColor(batch.riskLevel);
          
          return (
            <div
              key={batch.id}
              className={`rounded-2xl border-2 p-6 transition-all duration-300 cursor-pointer ${
                isHovered ? "scale-[1.02] shadow-2xl" : "hover:scale-[1.01] hover:shadow-xl"
              } ${
                theme === "dark"
                  ? "bg-slate-900/95 border-white/20 backdrop-blur-xl"
                  : "bg-linear-to-br from-white/95 to-[#F0FAFC]/80 border-[#9FE7F5]/60 backdrop-blur-xl shadow-lg"
              }`}
              onClick={() => onBatchClick && onBatchClick(batch)}
              onMouseEnter={() => setHoveredBatch(batch.id)}
              onMouseLeave={() => setHoveredBatch(null)}
              style={{
                borderLeftColor: riskColor,
                borderLeftWidth: "6px",
                boxShadow: theme === "dark"
                  ? `0 ${isHovered ? "12" : "8"}px ${isHovered ? "32" : "24"}px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 0 0 1px ${riskColor}40`
                  : `0 ${isHovered ? "12" : "8"}px ${isHovered ? "32" : "24"}px rgba(66, 158, 189, 0.15), 0 0 0 1px rgba(159, 231, 245, 0.3), inset 0 0 0 1px ${riskColor}20`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h4 className={`text-2xl font-black mb-2 ${theme === "dark" ? "text-white" : "text-[#053F5C]"}`}>
                    {batch.productName}
                  </h4>
                  <p className={`text-base font-bold ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                    {batch.id} • {batch.currentLocationName}
                  </p>
                </div>
                <StatusBadge 
                  status={batch.riskLevel === "high" 
                    ? (language === "ar" ? "عالي" : "High") 
                    : batch.riskLevel === "medium" 
                    ? (language === "ar" ? "متوسط" : "Medium") 
                    : (language === "ar" ? "منخفض" : "Low")} 
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6">
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest mb-2 ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                    {language === "ar" ? "الكمية" : "Quantity"}
                  </p>
                  <p className={`text-3xl font-black ${theme === "dark" ? "text-white" : "text-[#053F5C]"}`}>
                    {batch.quantity}
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest mb-2 ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                    {language === "ar" ? "العمر المتبقي" : "Remaining Life"}
                  </p>
                  <p className={`text-3xl font-black`} style={{ color: riskColor }}>
                    {batch.remainingLife}
                  </p>
                  <p className={`text-sm font-bold mt-1 ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                    {language === "ar" ? "يوم" : "days"}
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest mb-2 ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                    {language === "ar" ? "خطر الفساد" : "Spoilage Risk"}
                  </p>
                  <p className={`text-3xl font-black`} style={{ color: riskColor }}>
                    {batch.spoilageRisk}%
                  </p>
                </div>
                <div>
                  <p className={`text-xs font-black uppercase tracking-widest mb-2 ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                    {language === "ar" ? "الانتهاء الفعلي" : "Actual Expiry"}
                  </p>
                  <p className={`text-lg font-black ${theme === "dark" ? "text-slate-200" : "text-[#053F5C]"}`}>
                    {formatDate(batch.actualExpiry)}
                  </p>
                </div>
              </div>

              {/* مسار الرحلة */}
              <div className="mt-6 pt-6 border-t-2" style={{ borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(66, 158, 189, 0.2)" }}>
                <p className={`text-sm font-black uppercase tracking-widest mb-4 ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                  {language === "ar" ? "مسار الرحلة" : "Journey Path"}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  {batch.journey?.map((step, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span 
                        className={`text-sm px-4 py-2 rounded-lg font-bold transition-all duration-300 ${
                          isHovered ? "scale-105" : ""
                        } ${
                          theme === "dark" 
                            ? "bg-slate-800/80 text-slate-200 border border-slate-700" 
                            : "bg-[#E6F7FB] text-[#053F5C] border border-[#9FE7F5]"
                        }`}
                        style={{
                          boxShadow: theme === "dark"
                            ? "0 2px 8px rgba(0, 0, 0, 0.3)"
                            : "0 2px 8px rgba(66, 158, 189, 0.1)",
                        }}
                      >
                        {step.locationName}
                      </span>
                      {idx < batch.journey.length - 1 && (
                        <span 
                          className={`text-xl font-black ${theme === "dark" ? "text-slate-500" : "text-[#429EBD]"}`}
                          style={{ color: riskColor }}
                        >
                          →
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BatchTracker;

import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import ChartContainer from "../shared/ChartContainer.jsx";
import StatusBadge from "../shared/StatusBadge.jsx";

function ExpiryPrediction({ predictions }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  const getDifferenceColor = (diff) => {
    if (diff < 0) return theme === "dark" ? "text-red-400" : "text-red-600";
    if (diff > 0) return theme === "dark" ? "text-emerald-400" : "text-emerald-600";
    return theme === "dark" ? "text-slate-400" : "text-slate-600";
  };

  const getDifferenceIcon = (diff) => {
    if (diff < 0) return language === "ar" ? "ينتهي مبكراً" : "Expires Early";
    if (diff > 0) return language === "ar" ? "ينتهي متأخراً" : "Expires Later";
    return language === "ar" ? "طبيعي" : "Normal";
  };

  return (
    <div className="space-y-6">
      <ChartContainer title={language === "ar" ? "توقع الانتهاء الفعلي مقابل المكتوب" : "Actual vs Written Expiry Prediction"}>
        <div className="space-y-4">
          {predictions.map((pred) => (
            <div
              key={pred.batchId}
              className={`rounded-lg border p-4 ${
                theme === "dark" ? "bg-slate-900/80 border-white/10" : "bg-white/50 border-[#9FE7F5]/40"
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className={`font-bold text-lg ${theme === "dark" ? "text-white" : "text-[#053F5C]"}`}>
                    {pred.productName}
                  </h4>
                  <p className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                    {pred.batchId}
                  </p>
                </div>
                <StatusBadge
                  status={
                    pred.difference < 0
                      ? language === "ar" ? "ينتهي مبكراً" : "Expires Early"
                      : pred.difference > 0
                      ? language === "ar" ? "ينتهي متأخراً" : "Expires Later"
                      : language === "ar" ? "طبيعي" : "Normal"
                  }
                  size="sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className={`text-xs mb-1 ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                    {language === "ar" ? "تاريخ الانتهاء المكتوب" : "Written Expiry Date"}
                  </div>
                  <div className={`font-semibold ${theme === "dark" ? "text-white" : "text-[#053F5C]"}`}>
                    {pred.writtenExpiry}
                  </div>
                </div>
                <div>
                  <div className={`text-xs mb-1 ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                    {language === "ar" ? "تاريخ الانتهاء المتوقع" : "Predicted Expiry Date"}
                  </div>
                  <div className={`font-semibold ${getDifferenceColor(pred.difference)}`}>
                    {pred.predictedExpiry}
                  </div>
                </div>
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                theme === "dark" ? "bg-slate-800/50" : "bg-[#9FE7F5]/20"
              }`}>
                <div className="flex-1">
                  <div className={`font-semibold ${getDifferenceColor(pred.difference)} mb-1`}>
                    {pred.difference > 0 ? "+" : ""}{pred.difference} {language === "ar" ? "يوم" : "days"} - {getDifferenceIcon(pred.difference)}
                  </div>
                  <div className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}`}>
                    {pred.reason}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ChartContainer>
    </div>
  );
}

export default ExpiryPrediction;


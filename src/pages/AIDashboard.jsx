import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useModels } from "../hooks/useModels.js";
import { useLLaMA } from "../hooks/useLLaMA.js";
import { checkHealth } from "../utils/api.js";
import { useDashboardSection } from "../hooks/useDashboardData.js";
import SpoilagePrediction from "../components/ai/SpoilagePrediction.jsx";
import DemandForecast from "../components/ai/DemandForecast.jsx";
import ExpiryPrediction from "../components/ai/ExpiryPrediction.jsx";
import PrescriptiveActions from "../components/ai/PrescriptiveActions.jsx";
import ModelPredictor from "../components/ai/ModelPredictor.jsx";
import VehicleSuitabilityTab from "../components/ai/VehicleSuitabilityTab.jsx";
import EquipmentHealthTab from "../components/ai/EquipmentHealthTab.jsx";
import DataCard from "../components/shared/DataCard.jsx";

function AIDashboard() {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [activeTab, setActiveTab] = useState("spoilage");
  const [apiStatus, setApiStatus] = useState(null);
  const { models, loading: modelsLoading } = useModels();
  const { status: llamaStatus, checkStatus: checkLLaMAStatus } = useLLaMA();
  const { data: aiData, loading: aiLoading, error: aiError, reload: reloadAI } = useDashboardSection("ai");

  const aiPredictions = aiData?.aiPredictions || {
    demandForecast: [],
    spoilagePredictions: [],
    expiryPredictions: [],
  };
  const prescriptiveActions = aiData?.prescriptiveActions || [];

  useEffect(() => {
    // فحص حالة API
    checkHealth()
      .then(setApiStatus)
      .catch(() => setApiStatus({ status: 'error' }));

    // فحص حالة LLaMA
    checkLLaMAStatus();
  }, []);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const tabActiveClass = theme === "dark"
    ? "bg-gradient-to-r from-emerald-500/20 to-amber-500/20 text-white border-emerald-500/30"
    : "bg-gradient-to-r from-[#429EBD]/15 to-[#F7AD19]/15 text-[#053F5C] border-[#429EBD]/30";
  const tabInactiveClass = theme === "dark"
    ? "text-slate-400 hover:bg-slate-800/50 hover:text-white"
    : "text-[#429EBD] hover:bg-[#9FE7F5]/30 hover:text-[#053F5C]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";

  const tabs = [
    { id: "spoilage", label: language === "ar" ? "تنبؤ الفساد" : "Spoilage Prediction" },
    { id: "demand", label: language === "ar" ? "توقع الطلب" : "Demand Forecast" },
    { id: "expiry", label: language === "ar" ? "توقع الانتهاء" : "Expiry Prediction" },
    //{ id: "food-value", label: language === "ar" ? "تقييم جودة الطعام" : "Food Value Assessment" },
    { id: "vehicle-suitability", label: language === "ar" ? "ملاءمة المركبات" : "Vehicle Suitability" },
    { id: "equipment-health", label: language === "ar" ? "صحة المعدات" : "Equipment Health" },
    { id: "actions", label: language === "ar" ? "الإجراءات المقترحة" : "Prescriptive Actions" },
  ];

  // حقول الإدخال لنموذج food_value
  const foodValueFields = [
    { name: 'ideal_temp', label: language === 'ar' ? 'الحرارة المثالية (°C)' : 'Ideal Temperature (°C)', type: 'number', step: 0.1 },
    { name: 'is_high_risk', label: language === 'ar' ? 'منتج عالي الخطورة' : 'High Risk Product', type: 'checkbox' },
    { name: 'sensitivity', label: language === 'ar' ? 'الحساسية' : 'Sensitivity', type: 'number', step: 0.1, min: 0, max: 1 },
    { name: 'total_trip_hours', label: language === 'ar' ? 'إجمالي ساعات الرحلة' : 'Total Trip Hours', type: 'number', step: 0.1 },
    { name: 'recorded_temp', label: language === 'ar' ? 'الحرارة المسجلة (°C)' : 'Recorded Temperature (°C)', type: 'number', step: 0.1 },
    { name: 'hours_above_threshold', label: language === 'ar' ? 'ساعات فوق العتبة' : 'Hours Above Threshold', type: 'number', step: 0.1 },
  ];

  if (aiLoading && !aiData) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="text-lg font-semibold text-[#053F5C] dark:text-white">
          {language === "ar" ? "جاري تحميل بيانات الذكاء الاصطناعي..." : "Loading AI dashboard data..."}
        </p>
      </div>
    );
  }

  if (aiError) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
        <p className="text-lg font-semibold text-red-500">
          {language === "ar" ? "حدث خطأ أثناء تحميل بيانات AI" : "Failed to load AI data"}
        </p>
        <button
          onClick={reloadAI}
          className="px-6 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          {language === "ar" ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* العنوان */}
      <div className="mb-8 animate-slide-in">
        <h2 className={`text-4xl font-semibold ${textColor} mb-3 leading-tight tracking-tight`}>
          {t("aiDashboard")}
        </h2>
        <p className={`text-lg ${subTextColor} leading-relaxed font-normal`}>
          {language === "ar"
            ? "لوحة تحكم الذكاء الاصطناعي والتنبؤات الذكية"
            : "AI Engine Dashboard with Intelligent Predictions"}
        </p>
      </div>

      {/* حالة API */}
      {/* {apiStatus && (
        <div className={`mb-4 p-3 rounded-lg ${apiStatus.status === 'healthy'
          ? 'bg-green-500/10 border border-green-500/30'
          : 'bg-red-500/10 border border-red-500/30'
          }`}>
          <p className={`text-sm ${apiStatus.status === 'healthy' ? 'text-green-500' : 'text-red-500'
            }`}>
            {language === 'ar'
              ? `API: ${apiStatus.status === 'healthy' ? 'متصل' : 'غير متصل'}`
              : `API: ${apiStatus.status === 'healthy' ? 'Connected' : 'Disconnected'}`
            }
            {llamaStatus && ` | LLaMA: ${llamaStatus.status === 'healthy' ? (language === 'ar' ? 'متاح' : 'Available') : (language === 'ar' ? 'غير متاح' : 'Unavailable')}`}
          </p>
        </div>
      )}*/}

      {/* بطاقات إحصائية سريعة */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-slide-in" style={{ animationDelay: "0.1s" }}>
        <DataCard
          title={language === "ar" ? "النماذج المتاحة" : "Available Models"}
          value={Object.keys(models).length || 10}
          subtitle={language === "ar" ? "نموذج" : "models"}
        />
        <DataCard
          title={language === "ar" ? "توقعات الطلب" : "Demand Forecasts"}
          value={aiPredictions.demandForecast.length}
          subtitle={language === "ar" ? "محافظة" : "governorates"}
        />
        <DataCard
          title={language === "ar" ? "تنبؤات الانتهاء" : "Expiry Predictions"}
          value={aiPredictions.expiryPredictions.length}
          subtitle={language === "ar" ? "دفعة" : "batches"}
        />
        <DataCard
          title={language === "ar" ? "إجراءات مقترحة" : "Prescriptive Actions"}
          value={prescriptiveActions.length}
          subtitle={language === "ar" ? "إجراء جاهز" : "actions ready"}
        />
      </div>

      {/* التبويبات */}
      <div className={`rounded-xl border ${borderClass} p-1 ${theme === "dark" ? "bg-slate-900/80" : "bg-white/50"} backdrop-blur-xl`}>
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap border ${activeTab === tab.id ? `${tabActiveClass} shadow-lg` : `${tabInactiveClass} border-transparent`
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* المحتوى حسب التبويب النشط */}
      <div className="animate-slide-in" style={{ animationDelay: "0.2s" }}>
        {activeTab === "spoilage" && (
          <SpoilagePrediction predictions={aiPredictions.spoilagePredictions} />
        )}
        {activeTab === "demand" && (
          <DemandForecast forecasts={aiPredictions.demandForecast} />
        )}
        {activeTab === "expiry" && (
          <ExpiryPrediction predictions={aiPredictions.expiryPredictions} />
        )}
        {activeTab === "food-value" && (
          <ModelPredictor
            modelName="food_value"
            inputFields={foodValueFields}
          />
        )}
        {activeTab === "vehicle-suitability" && (
          <VehicleSuitabilityTab />
        )}
        {activeTab === "equipment-health" && (
          <EquipmentHealthTab />
        )}
        {activeTab === "actions" && (
          <PrescriptiveActions actions={prescriptiveActions} />
        )}
      </div>
    </div>
  );
}

export default AIDashboard;


import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useDashboardSection } from "../hooks/useDashboardData.js";
import RefrigerationStats from "../components/refrigeration/RefrigerationStats.jsx";
import RefrigerationTable from "../components/refrigeration/RefrigerationTable.jsx";
import TemperatureChart from "../components/refrigeration/TemperatureChart.jsx";
import MaintenanceAlerts from "../components/refrigeration/MaintenanceAlerts.jsx";
import RefrigerationFailurePrediction from "../components/ai/RefrigerationFailurePrediction.jsx";

function RefrigerationManagement() {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  // Poll every 10 seconds for real-time updates
  const { data, loading, error, reload } = useDashboardSection("refrigerators", { 
    pollInterval: 10000 // 10 seconds
  });
  const refrigerators = data ?? [];
  const [selectedFridge, setSelectedFridge] = useState(null);

  useEffect(() => {
    if (!loading && refrigerators.length > 0 && !selectedFridge) {
      setSelectedFridge(refrigerators[0].id);
    }
  }, [loading, refrigerators, selectedFridge]);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";

  // توليد بيانات تاريخية وهمية لدرجة الحرارة
  const temperatureHistory = useMemo(() => {
    if (!selectedFridge || !refrigerators || refrigerators.length === 0) return [];
    
    const selected = refrigerators.find((f) => f.id === selectedFridge);
    if (!selected || !selected.currentTemp) return [];

    const history = [];
    const now = new Date();
    // استخدام seed ثابت بناءً على selectedFridge لضمان ثبات البيانات
    const seed = selectedFridge.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // دالة pseudo-random بسيطة باستخدام seed
    let randomSeed = seed;
    const seededRandom = () => {
      randomSeed = (randomSeed * 9301 + 49297) % 233280;
      return randomSeed / 233280;
    };
    
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hour = time.getHours();
      // استخدام seeded random للحصول على قيم ثابتة
      const variation = (seededRandom() - 0.5) * 2; // تغيير ثابت ±1°C
      const temp = selected.currentTemp + variation;
      
      history.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        temperature: Number(temp.toFixed(1)),
        normalMin: selected.normalRange?.min || 2,
        normalMax: selected.normalRange?.max || 6,
      });
    }
    return history;
  }, [selectedFridge, refrigerators]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="text-lg font-semibold text-[#053F5C] dark:text-white">
          {language === "ar" ? "جاري تحميل بيانات الثلاجات..." : "Loading refrigeration data..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
        <p className="text-lg font-semibold text-red-500">
          {language === "ar" ? "حدث خطأ أثناء تحميل البيانات" : "Failed to load data"}
        </p>
        <button
          onClick={reload}
          className="px-6 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          {language === "ar" ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  }

  if (!refrigerators.length) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="text-lg font-semibold text-[#053F5C] dark:text-white">
          {language === "ar" ? "لا توجد بيانات متاحة" : "No data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* العنوان */}
      <div className="mb-8 animate-slide-in">
        <h2 className={`text-4xl font-semibold ${textColor} mb-3 leading-tight tracking-tight`}>
          {t("refrigerationManagement")}
        </h2>
        <p className={`text-lg ${subTextColor} leading-relaxed font-normal`}>
          {language === "ar"
            ? "مراقبة وإدارة الثلاجات والمبردات في الوقت الفعلي"
            : "Real-time monitoring and management of refrigerators and coolers"}
        </p>
      </div>

      {/* الإحصائيات */}
      <RefrigerationStats refrigerators={refrigerators} />

      {/* تنبيهات الصيانة */}
      <MaintenanceAlerts refrigerators={refrigerators} />

      {/* رسم بياني لدرجة الحرارة */}
      {selectedFridge && (
        <div className="animate-slide-in" style={{ animationDelay: "0.2s" }}>
          <TemperatureChart
            refrigeratorId={selectedFridge}
            temperatureHistory={temperatureHistory}
          />
        </div>
      )}

      {/* جدول الثلاجات */}
      <div className="animate-slide-in" style={{ animationDelay: "0.3s" }}>
        <div className="mb-4">
          <h3 className={`text-xl font-bold ${textColor} mb-2`}>
            {language === "ar" ? "قائمة الثلاجات" : "Refrigerators List"}
          </h3>
          <p className={`text-sm ${subTextColor}`}>
            {language === "ar"
              ? "انقر على ثلاجة لعرض تفاصيلها"
              : "Click on a refrigerator to view details"}
          </p>
        </div>
        <RefrigerationTable
          refrigerators={refrigerators}
          onSelectFridge={setSelectedFridge}
        />
      </div>

      {/* توقع أعطال الثلاجات */}
      <div className="animate-slide-in" style={{ animationDelay: "0.4s" }}>
        <RefrigerationFailurePrediction refrigerators={refrigerators} />
      </div>
    </div>
  );
}

export default RefrigerationManagement;


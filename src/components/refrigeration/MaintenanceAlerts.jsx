import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import AlertCard from "../shared/AlertCard.jsx";

function MaintenanceAlerts({ refrigerators }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  const highRiskRefrigerators = refrigerators.filter(
    (fridge) => fridge.failureRisk > 30
  );

  if (highRiskRefrigerators.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-[#053F5C]"} mb-4`}>
        {language === "ar" ? "تنبيهات الصيانة" : "Maintenance Alerts"}
      </h3>
      {highRiskRefrigerators.map((fridge) => (
        <AlertCard
          key={fridge.id}
          title={`${language === "ar" ? "ثلاجة" : "Refrigerator"} ${fridge.id} ${language === "ar" ? "في خطر" : "at Risk"}`}
          message={
            language === "ar"
              ? `الثلاجة ${fridge.id} قد تتعرض لعطل ${fridge.rul_days !== undefined && fridge.rul_days !== null ? `خلال ${fridge.rul_days} يوم` : "قريباً"}. نسبة الخطورة: ${fridge.failureRisk}%`
              : `Refrigerator ${fridge.id} may experience failure ${fridge.rul_days !== undefined && fridge.rul_days !== null ? `within ${fridge.rul_days} days` : "soon"}. Risk level: ${fridge.failureRisk}%`
          }
          severity="high"
          location={fridge.location}
          timestamp={language === "ar" ? "الآن" : "Now"}
          actionLabel={language === "ar" ? "جدولة صيانة" : "Schedule Maintenance"}
          onAction={() => alert(`Schedule maintenance for ${fridge.id}`)}
        />
      ))}
    </div>
  );
}

export default MaintenanceAlerts;










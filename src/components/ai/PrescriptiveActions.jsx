import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import AlertCard from "../shared/AlertCard.jsx";

function PrescriptiveActions({ actions }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  if (!actions || actions.length === 0) {
    return (
      <div className={`rounded-lg border p-6 text-center ${
        theme === "dark" ? "bg-slate-900/80 border-white/10" : "bg-white/50 border-[#9FE7F5]/40"
      }`}>
        <p className={theme === "dark" ? "text-slate-400" : "text-[#429EBD]"}>
          {language === "ar" ? "لا توجد إجراءات مقترحة حالياً" : "No actions suggested at the moment"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className={`text-xl font-bold ${theme === "dark" ? "text-white" : "text-[#053F5C]"} mb-4`}>
        {language === "ar" ? "الإجراءات المقترحة" : "Prescriptive Actions"}
      </h3>
      {actions.map((action, index) => (
        <AlertCard
          key={index}
          title={action.title}
          message={action.description}
          severity={action.priority}
          location={action.location}
          timestamp={action.timestamp}
          actionLabel={language === "ar" ? "تنفيذ الإجراء" : "Execute Action"}
          onAction={() => alert(`Executing: ${action.title}`)}
        />
      ))}
    </div>
  );
}

export default PrescriptiveActions;










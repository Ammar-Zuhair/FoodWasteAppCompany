import { useState } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { XIcon } from "../shared/Icons.jsx";

function ReportOptionsModal({ isOpen, onClose, onGenerate, selectedPeriod }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const [selectedSections, setSelectedSections] = useState({
    summary: true,
    wasteTrend: true,
    wasteCauses: true,
    equipmentRisk: true,
    returns: true,
    wasteDetails: true,
    returnsDetails: true,
    recommendations: true,
  });

  if (!isOpen) return null;

  const bgClass = theme === "dark" ? "bg-slate-900" : "bg-white";
  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-800" : "bg-slate-50";

  const sections = [
    { key: "summary", label: language === "ar" ? "الإحصائيات العامة" : "General Statistics" },
    { key: "wasteTrend", label: language === "ar" ? "اتجاه الهدر الشهري" : "Monthly Waste Trend" },
    { key: "wasteCauses", label: language === "ar" ? "توزيع أسباب الهدر" : "Waste Cause Distribution" },
    { key: "equipmentRisk", label: language === "ar" ? "توزيع مخاطر المعدات" : "Equipment Risk Distribution" },
    { key: "returns", label: language === "ar" ? "احتمالية المرتجع للمنتجات" : "Product Return Probabilities" },
    { key: "wasteDetails", label: language === "ar" ? "تفاصيل حوادث الهدر" : "Waste Incidents Details" },
    { key: "returnsDetails", label: language === "ar" ? "تفاصيل المرتجعات " : " Returns Details" },
    { key: "recommendations", label: language === "ar" ? "التوصيات والإجراءات" : "Recommendations and Actions" },
  ];

  const toggleSection = (key) => {
    setSelectedSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const selectAll = () => {
    setSelectedSections(
      sections.reduce((acc, section) => {
        acc[section.key] = true;
        return acc;
      }, {})
    );
  };

  const deselectAll = () => {
    setSelectedSections(
      sections.reduce((acc, section) => {
        acc[section.key] = false;
        return acc;
      }, {})
    );
  };

  const handleGenerate = () => {
    if (Object.values(selectedSections).some((v) => v)) {
      onGenerate(selectedSections);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] overflow-y-auto" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
          onClick={onClose}
        ></div>

        <div className={`relative transform overflow-hidden rounded-2xl ${bgClass} border ${borderClass} shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl animate-scale-in flex flex-col max-h-[90vh]`}>
          {/* Header */}
          <div className={`px-6 py-4 border-b ${borderClass} flex items-center justify-between`}>
            <h3 className={`text-2xl font-bold ${textColor}`}>
              {language === "ar" ? "خيارات التقرير" : "Report Options"}
            </h3>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-slate-800" : "hover:bg-slate-100"} transition-colors`}
            >
              <XIcon className={`w-5 h-5 ${subTextColor}`} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 text-right">
            <div className="mb-4">
              <p className={`${subTextColor} text-sm mb-4`}>
                {language === "ar"
                  ? "اختر الأقسام التي تريد تضمينها في التقرير:"
                  : "Select the sections you want to include in the report:"}
              </p>
              <div className="flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={selectAll}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${theme === "dark"
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                      : "bg-[#429EBD] hover:bg-[#2E7A94] text-white"
                    }`}
                >
                  {language === "ar" ? "تحديد الكل" : "Select All"}
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${theme === "dark"
                      ? "bg-slate-700 hover:bg-slate-600 text-white"
                      : "bg-slate-200 hover:bg-slate-300 text-[#053F5C]"
                    }`}
                >
                  {language === "ar" ? "إلغاء التحديد" : "Deselect All"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {sections.map((section) => (
                <label
                  key={section.key}
                  className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border-2 ${selectedSections[section.key]
                      ? theme === "dark"
                        ? "bg-emerald-500/10 border-emerald-500/50"
                        : "bg-[#429EBD]/10 border-[#429EBD]/50"
                      : `${cardBgClass} border-transparent`
                    } hover:scale-[1.01]`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSections[section.key]}
                    onChange={() => toggleSection(section.key)}
                    className="w-5 h-5 rounded border-2 cursor-pointer accent-emerald-500"
                  />
                  <span className={`font-bold ${textColor} flex-1`}>{section.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className={`px-6 py-4 border-t ${borderClass} flex items-center justify-end gap-3`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 ${textColor} hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-bold`}
            >
              {language === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <button
              onClick={handleGenerate}
              disabled={!Object.values(selectedSections).some((v) => v)}
              className={`flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all font-bold disabled:bg-slate-400 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed`}
            >
              {language === "ar" ? "إنشاء PDF" : "Generate PDF"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportOptionsModal;














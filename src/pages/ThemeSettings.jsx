import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";

function ThemeSettings() {
  const { theme, toggleTheme } = useTheme();
  const { language } = useLanguage();

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  const themeOptions = [
    {
      id: "dark",
      name: language === "ar" ? "الوضع الداكن" : "Dark Mode",
      description: language === "ar" ? "مظهر داكن مريح للعين" : "Dark theme for comfortable viewing",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      ),
      gradient: "from-slate-800 to-slate-900",
    },
    {
      id: "light",
      name: language === "ar" ? "الوضع الفاتح" : "Light Mode",
      description: language === "ar" ? "مظهر فاتح مشرق" : "Bright light theme",
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
      ),
      gradient: "from-blue-50 to-cyan-50",
    },
  ];

  return (
    <div className="space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="mb-6">
        <h2 className={`text-2xl md:text-4xl font-bold ${textColor} mb-2`}>
          {language === "ar" ? "إعدادات المظهر" : "Appearance Settings"}
        </h2>
        <p className={`text-sm md:text-lg ${subTextColor}`}>
          {language === "ar" ? "اختر المظهر المناسب لك" : "Choose your preferred appearance"}
        </p>
      </div>

      {/* Theme Selection */}
      <div className={`rounded-2xl border-2 ${borderClass} ${cardBgClass} p-6 shadow-lg`}>
        <h3 className={`text-lg font-bold ${textColor} mb-4`}>
          {language === "ar" ? "اختر المظهر" : "Select Theme"}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themeOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => {
                if (theme !== option.id) {
                  toggleTheme();
                }
              }}
              className={`relative p-6 rounded-xl border-2 transition-all ${
                theme === option.id
                  ? `${borderClass} border-[#429EBD] bg-[#429EBD]/10 shadow-lg scale-105`
                  : `${borderClass} hover:border-[#429EBD]/50 hover:bg-white/5`
              }`}
            >
              {/* Selected Indicator */}
              {theme === option.id && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#429EBD] flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                </div>
              )}

              {/* Theme Preview */}
              <div className={`w-full h-24 rounded-lg bg-gradient-to-br ${option.gradient} mb-4 flex items-center justify-center`}>
                <div className={`text-${theme === option.id ? "white" : "slate-600"}`}>
                  {option.icon}
                </div>
              </div>

              {/* Theme Info */}
              <div className="text-left">
                <h4 className={`font-bold text-lg ${textColor} mb-1`}>
                  {option.name}
                </h4>
                <p className={`text-sm ${subTextColor}`}>
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Additional Settings */}
      <div className={`rounded-2xl border-2 ${borderClass} ${cardBgClass} p-6 shadow-lg`}>
        <h3 className={`text-lg font-bold ${textColor} mb-4`}>
          {language === "ar" ? "إعدادات إضافية" : "Additional Settings"}
        </h3>
        
        <div className="space-y-4">
          {/* Auto Theme (Future Feature) */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
            <div>
              <p className={`font-medium ${textColor}`}>
                {language === "ar" ? "المظهر التلقائي" : "Auto Theme"}
              </p>
              <p className={`text-sm ${subTextColor}`}>
                {language === "ar" ? "تغيير المظهر تلقائياً حسب الوقت" : "Automatically switch theme based on time"}
              </p>
            </div>
            <button
              disabled
              className={`relative w-12 h-6 rounded-full transition-colors bg-slate-600 cursor-not-allowed opacity-50`}
            >
              <span className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform left-1" />
            </button>
          </div>

          {/* Current Theme Info */}
          <div className="p-4 rounded-xl bg-white/5">
            <p className={`text-sm ${subTextColor} mb-2`}>
              {language === "ar" ? "المظهر الحالي:" : "Current Theme:"}
            </p>
            <p className={`font-semibold ${textColor}`}>
              {theme === "dark" 
                ? (language === "ar" ? "الوضع الداكن" : "Dark Mode")
                : (language === "ar" ? "الوضع الفاتح" : "Light Mode")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ThemeSettings;










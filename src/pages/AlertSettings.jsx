import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { getAlertThresholds, updateAlertThresholds } from "../utils/api/settings.js";

function AlertSettings() {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  
  const [thresholds, setThresholds] = useState({
    temperature_min: -2.0,
    temperature_max: 8.0,
    expiry_days_warning: 3,
    low_stock_percentage: 20.0,
    waste_threshold: 100.0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadThresholds();
  }, []);

  const loadThresholds = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAlertThresholds();
      setThresholds(data);
    } catch (err) {
      setError(err.message);
      console.error("Error loading alert thresholds:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      await updateAlertThresholds(thresholds);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
      console.error("Error saving alert thresholds:", err);
    } finally {
      setSaving(false);
    }
  };

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";
  const inputClass = `w-full px-4 py-3 rounded-xl border-2 ${borderClass} ${cardBgClass} ${textColor} focus:ring-2 focus:ring-[#429EBD] focus:border-transparent transition-all`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className={`text-lg font-semibold ${textColor}`}>
          {language === "ar" ? "جاري تحميل الإعدادات..." : "Loading settings..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="mb-8 animate-slide-in">
        <h2 className={`text-4xl font-semibold ${textColor} mb-3 leading-tight tracking-tight`}>
          {language === "ar" ? "إعدادات التنبيهات" : "Alert Settings"}
        </h2>
        <p className={`text-lg ${subTextColor} leading-relaxed font-normal`}>
          {language === "ar" ? "ضبط حدود التنبيهات والإنذارات" : "Configure alert thresholds and warnings"}
        </p>
      </div>

      {error && (
        <div className={`rounded-lg border border-red-500/30 bg-red-500/10 p-4 ${textColor}`}>
          {error}
        </div>
      )}

      {success && (
        <div className={`rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 ${textColor}`}>
          {language === "ar" ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully"}
        </div>
      )}

      <form onSubmit={handleSave} className={`rounded-xl border ${borderClass} p-6 ${cardBgClass} backdrop-blur-xl space-y-6`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block mb-2 ${textColor} font-semibold`}>
              {language === "ar" ? "الحد الأدنى لدرجة الحرارة (°C)" : "Minimum Temperature (°C)"}
            </label>
            <input
              type="number"
              step="0.1"
              value={thresholds.temperature_min}
              onChange={(e) => setThresholds({ ...thresholds, temperature_min: parseFloat(e.target.value) })}
              className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
          </div>

          <div>
            <label className={`block mb-2 ${textColor} font-semibold`}>
              {language === "ar" ? "الحد الأقصى لدرجة الحرارة (°C)" : "Maximum Temperature (°C)"}
            </label>
            <input
              type="number"
              step="0.1"
              value={thresholds.temperature_max}
              onChange={(e) => setThresholds({ ...thresholds, temperature_max: parseFloat(e.target.value) })}
              className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
          </div>

          <div>
            <label className={`block mb-2 ${textColor} font-semibold`}>
              {language === "ar" ? "أيام التحذير قبل انتهاء الصلاحية" : "Days Warning Before Expiry"}
            </label>
            <input
              type="number"
              value={thresholds.expiry_days_warning}
              onChange={(e) => setThresholds({ ...thresholds, expiry_days_warning: parseInt(e.target.value) })}
              className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
          </div>

          <div>
            <label className={`block mb-2 ${textColor} font-semibold`}>
              {language === "ar" ? "نسبة المخزون المنخفض (%)" : "Low Stock Percentage (%)"}
            </label>
            <input
              type="number"
              step="0.1"
              value={thresholds.low_stock_percentage}
              onChange={(e) => setThresholds({ ...thresholds, low_stock_percentage: parseFloat(e.target.value) })}
              className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
          </div>

          <div>
            <label className={`block mb-2 ${textColor} font-semibold`}>
              {language === "ar" ? "حد الهدر للتنبيه (كجم)" : "Waste Threshold (kg)"}
            </label>
            <input
              type="number"
              step="0.1"
              value={thresholds.waste_threshold}
              onChange={(e) => setThresholds({ ...thresholds, waste_threshold: parseFloat(e.target.value) })}
              className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-2 rounded-lg font-semibold transition-all ${
              saving
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-600"
            } text-white`}
          >
            {saving
              ? (language === "ar" ? "جاري الحفظ..." : "Saving...")
              : (language === "ar" ? "حفظ الإعدادات" : "Save Settings")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AlertSettings;























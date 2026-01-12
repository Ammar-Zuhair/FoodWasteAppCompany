import { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { getIntegrationSettings, updateIntegrationSettings } from "../utils/api/settings.js";

function SystemSettings() {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  
  const [settings, setSettings] = useState({
    mqtt_enabled: true,
    mqtt_broker_url: "mqtt://localhost:1883",
    mqtt_topic_prefix: "food_waste",
    external_api_enabled: false,
    external_api_url: "",
    external_api_key: "",
    webhook_url: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getIntegrationSettings();
      setSettings(data);
    } catch (err) {
      setError(err.message);
      console.error("Error loading integration settings:", err);
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
      await updateIntegrationSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
      console.error("Error saving integration settings:", err);
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
          {language === "ar" ? "إعدادات النظام" : "System Settings"}
        </h2>
        <p className={`text-lg ${subTextColor} leading-relaxed font-normal`}>
          {language === "ar" ? "ضبط إعدادات الربط مع الأنظمة الخارجية" : "Configure external system integrations"}
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
        <div className="space-y-6">
          <div>
            <h3 className={`text-xl font-semibold ${textColor} mb-4`}>
              {language === "ar" ? "إعدادات MQTT" : "MQTT Settings"}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="mqtt_enabled"
                  checked={settings.mqtt_enabled}
                  onChange={(e) => setSettings({ ...settings, mqtt_enabled: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="mqtt_enabled" className={textColor}>
                  {language === "ar" ? "تفعيل MQTT" : "Enable MQTT"}
                </label>
              </div>

              <div>
                <label className={`block mb-2 ${textColor} font-semibold`}>
                  {language === "ar" ? "عنوان MQTT Broker" : "MQTT Broker URL"}
                </label>
                <input
                  type="text"
                  value={settings.mqtt_broker_url || ""}
                  onChange={(e) => setSettings({ ...settings, mqtt_broker_url: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
              </div>

              <div>
                <label className={`block mb-2 ${textColor} font-semibold`}>
                  {language === "ar" ? "بادئة الموضوع" : "Topic Prefix"}
                </label>
                <input
                  type="text"
                  value={settings.mqtt_topic_prefix || ""}
                  onChange={(e) => setSettings({ ...settings, mqtt_topic_prefix: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className={`text-xl font-semibold ${textColor} mb-4`}>
              {language === "ar" ? "إعدادات API الخارجية" : "External API Settings"}
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="external_api_enabled"
                  checked={settings.external_api_enabled}
                  onChange={(e) => setSettings({ ...settings, external_api_enabled: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="external_api_enabled" className={textColor}>
                  {language === "ar" ? "تفعيل API الخارجي" : "Enable External API"}
                </label>
              </div>

              <div>
                <label className={`block mb-2 ${textColor} font-semibold`}>
                  {language === "ar" ? "عنوان API الخارجي" : "External API URL"}
                </label>
                <input
                  type="text"
                  value={settings.external_api_url || ""}
                  onChange={(e) => setSettings({ ...settings, external_api_url: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
              </div>

              <div>
                <label className={`block mb-2 ${textColor} font-semibold`}>
                  {language === "ar" ? "مفتاح API" : "API Key"}
                </label>
                <input
                  type="password"
                  value={settings.external_api_key || ""}
                  onChange={(e) => setSettings({ ...settings, external_api_key: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className={`text-xl font-semibold ${textColor} mb-4`}>
              {language === "ar" ? "إعدادات Webhook" : "Webhook Settings"}
            </h3>
            <div>
              <label className={`block mb-2 ${textColor} font-semibold`}>
                {language === "ar" ? "عنوان Webhook" : "Webhook URL"}
              </label>
              <input
                type="text"
                value={settings.webhook_url || ""}
                onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                className={`w-full px-4 py-2 rounded-lg border ${inputClass} focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
            </div>
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

export default SystemSettings;








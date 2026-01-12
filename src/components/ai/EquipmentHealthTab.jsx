import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { getToken } from "../../utils/api/auth.js";
import { API_CONFIG } from "../../config/api.config.js";

const API_BASE = `${API_CONFIG.baseURL}/api/v1`;

function EquipmentHealthTab() {
    const { theme } = useTheme();
    const { language, t } = useLanguage();
    const [equipment, setEquipment] = useState([]);
    const [sensors, setSensors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeView, setActiveView] = useState("fridges");

    const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
    const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
    const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
    const cardBg = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        const token = getToken();
        try {
            // Fetch refrigeration equipment with AI predictions
            const equipResp = await fetch(`${API_BASE}/monitoring/refrigeration/equipment`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (equipResp.ok) {
                const equipData = await equipResp.json();
                setEquipment(equipData.equipment || equipData.items || []);
            }

            // Fetch sensors with AI predictions
            const sensorResp = await fetch(`${API_BASE}/monitoring/sensors/health`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (sensorResp.ok) {
                const sensorData = await sensorResp.json();
                setSensors(sensorData.sensors || sensorData.items || []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const totalEquip = equipment.length;
        const criticalEquip = equipment.filter(e => e.failure_probability >= 0.7).length;
        const warningEquip = equipment.filter(e => e.failure_probability >= 0.4 && e.failure_probability < 0.7).length;

        const totalSensors = sensors.length;
        const anomalySensors = sensors.filter(s => s.anomaly_detected).length;

        return { totalEquip, criticalEquip, warningEquip, totalSensors, anomalySensors };
    }, [equipment, sensors]);

    const getHealthColor = (probability) => {
        if (probability >= 0.7) return "text-red-500";
        if (probability >= 0.4) return "text-amber-500";
        return "text-emerald-500";
    };

    const getHealthBg = (probability) => {
        if (probability >= 0.7) return "bg-red-500/20";
        if (probability >= 0.4) return "bg-amber-500/20";
        return "bg-emerald-500/20";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className={`ms-3 ${textColor}`}>
                    {language === "ar" ? "جاري تحميل بيانات المعدات..." : "Loading equipment data..."}
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500">{error}</p>
                <button onClick={loadData} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">
                    {language === "ar" ? "إعادة المحاولة" : "Retry"}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className={`${cardBg} rounded-xl p-4 border ${borderClass}`}>
                    <p className={`text-xs ${subTextColor}`}>{language === "ar" ? "معدات التبريد" : "Refrigeration Units"}</p>
                    <p className={`text-2xl font-bold ${textColor}`}>{stats.totalEquip}</p>
                </div>
                <div className={`${cardBg} rounded-xl p-4 border border-red-500/30`}>
                    <p className={`text-xs text-red-400`}>{language === "ar" ? "حالة حرجة" : "Critical"}</p>
                    <p className={`text-2xl font-bold text-red-500`}>{stats.criticalEquip}</p>
                </div>
                <div className={`${cardBg} rounded-xl p-4 border border-amber-500/30`}>
                    <p className={`text-xs text-amber-400`}>{language === "ar" ? "تحذير" : "Warning"}</p>
                    <p className={`text-2xl font-bold text-amber-500`}>{stats.warningEquip}</p>
                </div>
                <div className={`${cardBg} rounded-xl p-4 border ${borderClass}`}>
                    <p className={`text-xs ${subTextColor}`}>{language === "ar" ? "المستشعرات" : "Sensors"}</p>
                    <p className={`text-2xl font-bold ${textColor}`}>{stats.totalSensors}</p>
                </div>
                <div className={`${cardBg} rounded-xl p-4 border border-purple-500/30`}>
                    <p className={`text-xs text-purple-400`}>{language === "ar" ? "شذوذ مكتشف" : "Anomalies"}</p>
                    <p className={`text-2xl font-bold text-purple-500`}>{stats.anomalySensors}</p>
                </div>
            </div>

            {/* Toggle View */}
            <div className={`${cardBg} rounded-xl border ${borderClass} p-1 flex gap-2`}>
                <button
                    onClick={() => setActiveView("fridges")}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${activeView === "fridges"
                        ? "bg-blue-500 text-white"
                        : `${textColor} hover:bg-blue-500/10`
                        }`}
                >
                    {language === "ar" ? "معدات التبريد" : "Refrigeration Equipment"}
                </button>
                <button
                    onClick={() => setActiveView("sensors")}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${activeView === "sensors"
                        ? "bg-purple-500 text-white"
                        : `${textColor} hover:bg-purple-500/10`
                        }`}
                >
                    {language === "ar" ? "المستشعرات" : "Sensors"}
                </button>
            </div>

            {/* Equipment Table */}
            {activeView === "fridges" && (
                <div className={`${cardBg} rounded-xl border ${borderClass} overflow-hidden`}>
                    <div className="p-4 border-b ${borderClass}">
                        <h3 className={`text-lg font-bold ${textColor}`}>
                            {language === "ar" ? "توقعات أعطال معدات التبريد" : "Refrigeration Equipment Failure Predictions"}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={theme === "dark" ? "bg-slate-800/50" : "bg-slate-100"}>
                                <tr>
                                    <th className={`py-3 px-4 text-start ${subTextColor}`}>{language === "ar" ? "المعدة" : "Equipment"}</th>
                                    <th className={`py-3 px-4 text-start ${subTextColor}`}>{language === "ar" ? "الموقع" : "Location"}</th>
                                    <th className={`py-3 px-4 text-center ${subTextColor}`}>{language === "ar" ? "احتمالية العطل" : "Failure Probability"}</th>
                                    <th className={`py-3 px-4 text-center ${subTextColor}`}>{language === "ar" ? "العمر المتبقي (أيام)" : "RUL (Days)"}</th>
                                    <th className={`py-3 px-4 text-start ${subTextColor}`}>{language === "ar" ? "نوع العطل المتوقع" : "Predicted Failure"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipment.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className={`py-8 text-center ${subTextColor}`}>
                                            {language === "ar" ? "لا توجد بيانات متاحة" : "No data available"}
                                        </td>
                                    </tr>
                                ) : (
                                    equipment.slice(0, 10).map((eq) => (
                                        <tr key={eq.id} className={`border-t ${borderClass}`}>
                                            <td className={`py-3 px-4 ${textColor} font-medium`}>{eq.name || eq.equipment_code || `Equipment #${eq.id}`}</td>
                                            <td className={`py-3 px-4 ${subTextColor} text-sm`}>{eq.location || eq.facility_name || "-"}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getHealthBg(eq.failure_probability || 0)} ${getHealthColor(eq.failure_probability || 0)}`}>
                                                    {Math.round((eq.failure_probability || 0) * 100)}%
                                                </span>
                                            </td>
                                            <td className={`py-3 px-4 text-center ${textColor}`}>
                                                {eq.remaining_useful_life_days || eq.rul_days || "-"}
                                            </td>
                                            <td className={`py-3 px-4 ${subTextColor}`}>
                                                {eq.predicted_failure_type || eq.failure_type_next || "-"}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Sensors Table */}
            {activeView === "sensors" && (
                <div className={`${cardBg} rounded-xl border ${borderClass} overflow-hidden`}>
                    <div className="p-4 border-b ${borderClass}">
                        <h3 className={`text-lg font-bold ${textColor}`}>
                            {language === "ar" ? "اكتشاف شذوذ المستشعرات" : "Sensor Anomaly Detection"}
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className={theme === "dark" ? "bg-slate-800/50" : "bg-slate-100"}>
                                <tr>
                                    <th className={`py-3 px-4 text-start ${subTextColor}`}>{language === "ar" ? "المستشعر" : "Sensor"}</th>
                                    <th className={`py-3 px-4 text-start ${subTextColor}`}>{language === "ar" ? "الموقع" : "Location"}</th>
                                    <th className={`py-3 px-4 text-center ${subTextColor}`}>{language === "ar" ? "النوع" : "Type"}</th>
                                    <th className={`py-3 px-4 text-center ${subTextColor}`}>{language === "ar" ? "درجة الشذوذ" : "Anomaly Score"}</th>
                                    <th className={`py-3 px-4 text-center ${subTextColor}`}>{language === "ar" ? "الحالة" : "Status"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sensors.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className={`py-8 text-center ${subTextColor}`}>
                                            {language === "ar" ? "لا توجد بيانات متاحة" : "No data available"}
                                        </td>
                                    </tr>
                                ) : (
                                    sensors.slice(0, 10).map((sensor) => (
                                        <tr key={sensor.id} className={`border-t ${borderClass}`}>
                                            <td className={`py-3 px-4 ${textColor} font-medium`}>{sensor.name || sensor.sensor_code || `Sensor #${sensor.id}`}</td>
                                            <td className={`py-3 px-4 ${subTextColor} text-sm`}>{sensor.location || sensor.facility_name || "-"}</td>
                                            <td className={`py-3 px-4 text-center ${subTextColor}`}>{sensor.sensor_type || "-"}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${(sensor.anomaly_score || 0) > 0.5 ? "bg-red-500/20 text-red-500" : "bg-emerald-500/20 text-emerald-500"
                                                    }`}>
                                                    {Math.round((sensor.anomaly_score || 0) * 100)}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {sensor.anomaly_detected ? (
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-500">
                                                        {language === "ar" ? "شذوذ مكتشف" : "Anomaly Detected"}
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-500">
                                                        {language === "ar" ? "طبيعي" : "Normal"}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EquipmentHealthTab;

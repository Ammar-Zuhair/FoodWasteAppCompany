import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { getVehicles, getVehicleSuitability } from "../../utils/api/vehicles.js";

function VehicleSuitabilityTab() {
    const { theme } = useTheme();
    const { language, t } = useLanguage();
    const [vehicles, setVehicles] = useState([]);
    const [suitabilityData, setSuitabilityData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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
        try {
            const vehicleList = await getVehicles();
            setVehicles(vehicleList || []);

            // Fetch suitability for each vehicle
            const suitability = {};
            for (const v of (vehicleList || []).slice(0, 10)) {
                try {
                    const result = await getVehicleSuitability(v.id);
                    if (result && result.recommendations && result.recommendations.length > 0) {
                        suitability[v.id] = {
                            category: result.recommendations[0].category,
                            score: result.recommendations[0].score,
                            allRecommendations: result.recommendations
                        };
                    }
                } catch (err) {
                    console.warn(`Failed to get suitability for vehicle ${v.id}`);
                }
            }
            setSuitabilityData(suitability);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const total = vehicles.length;
        const analyzed = Object.keys(suitabilityData).length;
        const categories = {};
        Object.values(suitabilityData).forEach(s => {
            categories[s.category] = (categories[s.category] || 0) + 1;
        });
        return { total, analyzed, categories };
    }, [vehicles, suitabilityData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className={`ms-3 ${textColor}`}>
                    {language === "ar" ? "جاري تحميل بيانات المركبات..." : "Loading vehicle data..."}
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500">{error}</p>
                <button onClick={loadData} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg">
                    {language === "ar" ? "إعادة المحاولة" : "Retry"}
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`${cardBg} rounded-xl p-6 border ${borderClass}`}>
                    <p className={subTextColor}>{language === "ar" ? "إجمالي المركبات" : "Total Vehicles"}</p>
                    <p className={`text-3xl font-bold ${textColor}`}>{stats.total}</p>
                </div>
                <div className={`${cardBg} rounded-xl p-6 border ${borderClass}`}>
                    <p className={subTextColor}>{language === "ar" ? "تم تحليلها بالذكاء الاصطناعي" : "AI Analyzed"}</p>
                    <p className={`text-3xl font-bold text-emerald-500`}>{stats.analyzed}</p>
                </div>
                <div className={`${cardBg} rounded-xl p-6 border ${borderClass}`}>
                    <p className={subTextColor}>{language === "ar" ? "التصنيفات المحددة" : "Categories Identified"}</p>
                    <p className={`text-3xl font-bold text-purple-500`}>{Object.keys(stats.categories).length}</p>
                </div>
            </div>

            {/* Vehicle Table */}
            <div className={`${cardBg} rounded-xl border ${borderClass} overflow-hidden`}>
                <div className="p-4 border-b ${borderClass}">
                    <h3 className={`text-lg font-bold ${textColor}`}>
                        {language === "ar" ? "توصيات ملاءمة المركبات" : "Vehicle Suitability Recommendations"}
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={theme === "dark" ? "bg-slate-800/50" : "bg-slate-100"}>
                            <tr>
                                <th className={`py-3 px-4 text-start ${subTextColor} font-medium`}>{language === "ar" ? "رقم اللوحة" : "Plate Number"}</th>
                                <th className={`py-3 px-4 text-start ${subTextColor} font-medium`}>{language === "ar" ? "نوع المركبة" : "Vehicle Type"}</th>
                                <th className={`py-3 px-4 text-center ${subTextColor} font-medium`}>{language === "ar" ? "أفضل تصنيف" : "Best Category"}</th>
                                <th className={`py-3 px-4 text-center ${subTextColor} font-medium`}>{language === "ar" ? "نسبة التوافق" : "Match Score"}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vehicles.slice(0, 10).map((vehicle) => (
                                <tr key={vehicle.id} className={`border-t ${borderClass} hover:${theme === "dark" ? "bg-slate-800/30" : "bg-slate-50"}`}>
                                    <td className={`py-3 px-4 ${textColor} font-medium`}>{vehicle.plate_number}</td>
                                    <td className={`py-3 px-4 ${subTextColor}`}>{vehicle.vehicle_type_name || vehicle.vehicle_type || "-"}</td>
                                    <td className="py-3 px-4 text-center">
                                        {suitabilityData[vehicle.id] ? (
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${theme === "dark" ? "bg-purple-500/20 text-purple-400" : "bg-purple-100 text-purple-700"}`}>
                                                {t('vps_' + suitabilityData[vehicle.id].category) || suitabilityData[vehicle.id].category}
                                            </span>
                                        ) : (
                                            <span className={subTextColor}>-</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                        {suitabilityData[vehicle.id] ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                                                        style={{ width: `${Math.round(suitabilityData[vehicle.id].score * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`text-sm font-bold ${textColor}`}>
                                                    {Math.round(suitabilityData[vehicle.id].score * 100)}%
                                                </span>
                                            </div>
                                        ) : (
                                            <span className={subTextColor}>-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default VehicleSuitabilityTab;

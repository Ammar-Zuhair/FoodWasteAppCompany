import { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from "recharts";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

function PerformanceBenchmark({ data: propData }) {
    const { theme } = useTheme();
    const { language } = useLanguage();

    const defaultData = [
        {
            name: language === "ar" ? "لا توجد بيانات" : "No Data",
            waste: 0,
            efficiency: 0,
            delivery: 0,
        }
    ];

    const data = propData && propData.length > 0 ? propData : defaultData;

    // Find best and worst performers safely
    const bestPerformer = [...data].sort((a, b) => b.efficiency - a.efficiency)[0] || {};
    const worstPerformer = [...data].sort((a, b) => b.waste - a.waste)[0] || {};

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className={`p-4 rounded-lg shadow-lg border ${theme === "dark"
                    ? "bg-slate-800 border-slate-700 text-white"
                    : "bg-white border-slate-200 text-[#053F5C]"
                    }`}>
                    <p className="font-bold mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {entry.value}%
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className={`p-6 rounded-2xl border-2 transition-all duration-300 ${theme === "dark"
            ? "bg-slate-900/50 border-white/10"
            : "bg-white/50 border-[#9FE7F5]/40"
            } backdrop-blur-xl shadow-xl space-y-8`}>

            <div className="flex justify-between items-center">
                <h3 className={`text-2xl font-black ${theme === "dark" ? "text-white" : "text-[#053F5C]"}`}>
                    {language === "ar" ? "مقارنة أداء المرافق" : "Facility Performance Benchmark"}
                </h3>

                <div className="flex gap-2">
                    {bestPerformer.name && (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-500 text-sm font-bold">
                            {language === "ar" ? `الأفضل: ${bestPerformer.name}` : `Top: ${bestPerformer.name}`}
                        </span>
                    )}
                    {worstPerformer.name && (
                        <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-sm font-bold">
                            {language === "ar" ? `تحذير: ${worstPerformer.name}` : `Warning: ${worstPerformer.name}`}
                        </span>
                    )}
                </div>
            </div>

            <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        barSize={40}
                    >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis
                            dataKey="name"
                            stroke={theme === "dark" ? "#94a3b8" : "#64748b"}
                            tick={{ fill: theme === "dark" ? "#94a3b8" : "#64748b" }}
                        />
                        <YAxis
                            stroke={theme === "dark" ? "#94a3b8" : "#64748b"}
                            tick={{ fill: theme === "dark" ? "#94a3b8" : "#64748b" }}
                            unit="%"
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: "20px" }} />

                        <Bar
                            dataKey="efficiency"
                            name={language === "ar" ? "الكفاءة التشغيلية" : "Operational Efficiency"}
                            fill="#10B981"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="delivery"
                            name={language === "ar" ? "دقة التسليم" : "Delivery Accuracy"}
                            fill="#3B82F6"
                            radius={[4, 4, 0, 0]}
                        />
                        <Bar
                            dataKey="waste"
                            name={language === "ar" ? "نسبة الهدر" : "Waste Rate"}
                            fill="#EF4444"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default PerformanceBenchmark;

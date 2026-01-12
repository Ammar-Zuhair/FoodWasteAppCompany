import { useState, useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import { useTheme } from "../../contexts/ThemeContext";
import { useLanguage } from "../../contexts/LanguageContext";

function WhatIfSimulator({ baseWasteRate = 2.5 }) {
    const { theme } = useTheme();
    const { language } = useLanguage();

    const [temperatureRise, setTemperatureRise] = useState(0);
    const [delayDays, setDelayDays] = useState(0);
    const [storageEfficiency, setStorageEfficiency] = useState(100);

    // حساب تأثير السيناريو
    const simulationData = useMemo(() => {
        // Generate base waste trends seeded by the real baseWasteRate
        // Add some small random variation to look like a trend
        const baseWaste = Array.from({ length: 8 }, (_, i) => {
            const variation = (i % 3 === 0 ? 0.2 : -0.1) + (i * 0.1);
            return Math.max(0, Number((baseWasteRate + variation).toFixed(2)));
        });

        const months = language === "ar"
            ? ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس"]
            : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];

        return months.map((month, index) => {
            // Logic: 
            // +1 degree = +10% waste
            // +1 day delay = +15% waste
            // -1% efficiency = +0.5% waste

            const tempFactor = 1 + (temperatureRise * 0.1);
            const delayFactor = 1 + (delayDays * 0.15);
            const effFactor = 1 + ((100 - storageEfficiency) * 0.02);

            const impact = tempFactor * delayFactor * effFactor;
            const simulatedWaste = baseWaste[index] * impact;

            return {
                name: month,
                base: baseWaste[index],
                simulated: Number(simulatedWaste.toFixed(2)),
            };
        });
    }, [temperatureRise, delayDays, storageEfficiency, language]);

    const totalImpact = useMemo(() => {
        const lastPoint = simulationData[simulationData.length - 1];
        const increase = ((lastPoint.simulated - lastPoint.base) / lastPoint.base) * 100;
        return increase.toFixed(1);
    }, [simulationData]);

    const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
    const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";

    return (
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 rounded-2xl border-2 transition-all duration-300 ${theme === "dark"
            ? "bg-slate-900/50 border-white/10"
            : "bg-white/50 border-[#9FE7F5]/40"
            } backdrop-blur-xl shadow-xl`}>

            {/* Controls */}
            <div className="lg:col-span-1 space-y-8">
                <div>
                    <h3 className={`text-2xl font-black mb-2 ${textColor}`}>
                        {language === "ar" ? "محاكاة السيناريوهات" : "What-If Simulator"}
                    </h3>
                    <p className={subTextColor}>
                        {language === "ar"
                            ? "قم بتغيير المتغيرات لرؤية التأثير على نسبة الهدر"
                            : "Adjust variables to simulate waste impact"}
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Temperature Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className={`font-bold ${textColor}`}>
                                {language === "ar" ? "ارتفاع الحرارة (°C)" : "Temp Rise (°C)"}
                            </label>
                            <span className="font-mono font-bold text-red-500">+{temperatureRise}°C</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={temperatureRise}
                            onChange={(e) => setTemperatureRise(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-red-500"
                        />
                    </div>

                    {/* Delay Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className={`font-bold ${textColor}`}>
                                {language === "ar" ? "تأخير النقل (أيام)" : "Transport Delay (Days)"}
                            </label>
                            <span className="font-mono font-bold text-yellow-500">+{delayDays} {language === "ar" ? "أيام" : "days"}</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="7"
                            step="1"
                            value={delayDays}
                            onChange={(e) => setDelayDays(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-yellow-500"
                        />
                    </div>

                    {/* Efficiency Slider */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className={`font-bold ${textColor}`}>
                                {language === "ar" ? "كفاءة التخزين (%)" : "Storage Efficiency (%)"}
                            </label>
                            <span className={`font-mono font-bold ${storageEfficiency < 90 ? "text-red-500" : "text-emerald-500"}`}>
                                {storageEfficiency}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="50"
                            max="100"
                            step="5"
                            value={storageEfficiency}
                            onChange={(e) => setStorageEfficiency(Number(e.target.value))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-emerald-500"
                        />
                    </div>
                </div>

                {/* Result Summary */}
                <div className={`p-4 rounded-xl border ${temperatureRise === 0 && delayDays === 0 && storageEfficiency === 100
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-red-500/10 border-red-500/30"
                    }`}>
                    <p className="text-sm font-bold mb-1 opacity-80">
                        {language === "ar" ? "التأثير المتوقع على الهدر" : "Projected Waste Impact"}
                    </p>
                    <p className={`text-3xl font-black ${temperatureRise === 0 && delayDays === 0 && storageEfficiency === 100
                        ? "text-emerald-500"
                        : "text-red-500"
                        }`}>
                        {totalImpact > 0 ? "+" : ""}{totalImpact}%
                    </p>
                </div>
            </div>

            {/* Chart */}
            <div className="lg:col-span-2 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simulationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSim" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke={theme === "dark" ? "#94a3b8" : "#64748b"} />
                        <YAxis stroke={theme === "dark" ? "#94a3b8" : "#64748b"} unit="%" />
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                color: theme === 'dark' ? '#fff' : '#0f172a'
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="base"
                            name={language === "ar" ? "الوضع الحالي" : "Current Baseline"}
                            stroke="#10B981"
                            fillOpacity={1}
                            fill="url(#colorBase)"
                        />
                        {(temperatureRise > 0 || delayDays > 0 || storageEfficiency < 100) && (
                            <Area
                                type="monotone"
                                dataKey="simulated"
                                name={language === "ar" ? "السيناريو المتوقع" : "Simulated Scenario"}
                                stroke="#EF4444"
                                fillOpacity={1}
                                fill="url(#colorSim)"
                            />
                        )}
                        <Legend />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default WhatIfSimulator;

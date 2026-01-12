import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from "recharts";
import ChartContainer from "../shared/ChartContainer.jsx";
import DataCard from "../shared/DataCard.jsx";

function ColdChainFailure({ vehicles }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  // تحليل بيانات فشل سلسلة التبريد
  const failureData = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];

    return vehicles
      .filter((v) => v.currentTrip) // فقط المركبات في رحلة
      .map((vehicle) => {
        // حساب احتمالية الفشل بناءً على VFS وبيانات الرحلة
        const vfs = vehicle.vfs || 50;
        const failureProbability = Math.max(0, Math.min(100, 100 - vfs + (vehicle.currentTrip?.distanceRemaining || 0) / 10));
        
        const riskLevel = failureProbability >= 70 
          ? (language === "ar" ? "حرج" : "Critical") 
          : failureProbability >= 50 
          ? (language === "ar" ? "عالي" : "High") 
          : failureProbability >= 30 
          ? (language === "ar" ? "متوسط" : "Medium") 
          : (language === "ar" ? "منخفض" : "Low");
        
        // نقطة الفشل المتوقعة (نسبة من المسار)
        const failurePoint = vehicle.currentTrip?.failurePoint || Math.random() * 0.7 + 0.1; // بين 10% و 80% من المسار
        
        return {
          vehicleId: vehicle.id,
          plateNumber: vehicle.plateNumber,
          vfs,
          failureProbability,
          riskLevel,
          failurePoint: Math.round(failurePoint * 100),
          failureType: vehicle.predictedFailureType || (language === "ar" ? "انتهاك الحرارة" : "Temperature Breach"),
          confidence: vehicle.predictionConfidence || 0.75,
          from: vehicle.currentTrip?.from,
          to: vehicle.currentTrip?.to,
          distanceRemaining: vehicle.currentTrip?.distanceRemaining || 0,
          progress: vehicle.currentTrip?.progress || 0,
        };
      })
      .sort((a, b) => b.failureProbability - a.failureProbability);
  }, [vehicles, language]);

  // إحصائيات سريعة
  const stats = useMemo(() => {
    const critical = failureData.filter((f) => f.riskLevel === "Critical").length;
    const high = failureData.filter((f) => f.riskLevel === "High").length;
    const medium = failureData.filter((f) => f.riskLevel === "Medium").length;
    const low = failureData.filter((f) => f.riskLevel === "Low").length;
    const avgProbability = failureData.reduce((sum, f) => sum + f.failureProbability, 0) / (failureData.length || 1);
    const avgVFS = failureData.reduce((sum, f) => sum + f.vfs, 0) / (failureData.length || 1);

    return {
      critical,
      high,
      medium,
      low,
      avgProbability: Math.round(avgProbability),
      avgVFS: Math.round(avgVFS),
      total: failureData.length,
    };
  }, [failureData]);

  // بيانات الرسم البياني
  const chartData = useMemo(() => {
    return failureData.map((item) => ({
      vehicle: item.plateNumber,
      probability: item.failureProbability,
      vfs: item.vfs,
      failurePoint: item.failurePoint,
      confidence: Math.round(item.confidence * 100),
    }));
  }, [failureData]);

  const getRiskColor = (probability) => {
    if (probability >= 70) return theme === "dark" ? "#ef4444" : "#dc2626";
    if (probability >= 50) return theme === "dark" ? "#f59e0b" : "#d97706";
    if (probability >= 30) return theme === "dark" ? "#eab308" : "#ca8a04";
    return theme === "dark" ? "#10b981" : "#059669";
  };

  if (!vehicles || vehicles.length === 0 || failureData.length === 0) {
    return (
      <div className={`rounded-xl border ${borderClass} p-8 ${cardBgClass} backdrop-blur-xl`}>
        <p className={textColor}>
          {language === "ar" ? "لا توجد مركبات في رحلة حالياً" : "No vehicles on trip currently"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* بطاقات إحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DataCard
          title={language === "ar" ? "متوسط الاحتمالية" : "Avg Probability"}
          value={`${stats.avgProbability}%`}
          subtitle={language === "ar" ? "احتمالية الفشل" : "failure probability"}
        />
        <DataCard
          title={language === "ar" ? "متوسط VFS" : "Avg VFS"}
          value={`${stats.avgVFS}%`}
          subtitle={language === "ar" ? "درجة النضارة" : "freshness score"}
        />
        <DataCard
          title={language === "ar" ? "حرج" : "Critical"}
          value={stats.critical}
          subtitle={language === "ar" ? "مركبة" : "vehicles"}
        />
        <DataCard
          title={language === "ar" ? "إجمالي المركبات" : "Total Vehicles"}
          value={stats.total}
          subtitle={language === "ar" ? "في رحلة" : "on trip"}
        />
      </div>

      {/* احتمالية الفشل لكل مركبة */}
      <ChartContainer title={language === "ar" ? "احتمالية فشل سلسلة التبريد" : "Cold Chain Failure Probability"}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              stroke={subTextColor}
              tick={{ fill: subTextColor, fontSize: 12 }}
            />
            <YAxis
              dataKey="vehicle"
              type="category"
              width={0}
              stroke={subTextColor}
              tick={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: theme === "dark" ? "#1e293b" : "#ffffff",
                border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"}`,
                borderRadius: "8px",
                color: theme === "dark" ? "#ffffff" : "#053F5C",
              }}
              itemStyle={{ color: theme === "dark" ? "#ffffff" : "#053F5C" }}
              labelStyle={{ color: theme === "dark" ? "#ffffff" : "#053F5C", fontWeight: "bold" }}
              formatter={(value, name) => {
                if (name === "probability") return [`${value}%`, language === "ar" ? "احتمالية الفشل" : "Failure Probability"];
                if (name === "vfs") return [`${value}%`, language === "ar" ? "VFS" : "VFS"];
                if (name === "failurePoint") return [`${value}%`, language === "ar" ? "نقطة الفشل المتوقعة" : "Expected Failure Point"];
                if (name === "confidence") return [`${value}%`, language === "ar" ? "الثقة" : "Confidence"];
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ color: textColor }} />
            <Bar dataKey="probability" name={language === "ar" ? "احتمالية الفشل (%)" : "Failure Probability (%)"} radius={[0, 8, 8, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getRiskColor(entry.probability)} />
              ))}
              <LabelList 
                dataKey="vehicle" 
                position="insideLeft" 
                style={{ fill: "#ffffff", fontSize: "14px", fontWeight: "bold" }}
                offset={10}
              />
              <LabelList 
                dataKey="probability" 
                position="insideRight" 
                style={{ fill: "#ffffff", fontSize: "14px", fontWeight: "bold" }}
                formatter={(value) => `${value}%`}
                offset={5}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>

      {/* جدول تفصيلي */}
      <div className={`rounded-xl border ${borderClass} p-6 ${cardBgClass} backdrop-blur-xl`}>
        <h3 className={`text-xl font-bold ${textColor} mb-4`}>
          {language === "ar" ? "تفاصيل التنبؤات" : "Prediction Details"}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${borderClass}`}>
                <th className={`text-right py-3 px-4 ${subTextColor} font-semibold`}>
                  {language === "ar" ? "المركبة" : "Vehicle"}
                </th>
                <th className={`text-right py-3 px-4 ${subTextColor} font-semibold`}>
                  {language === "ar" ? "VFS" : "VFS"}
                </th>
                <th className={`text-right py-3 px-4 ${subTextColor} font-semibold`}>
                  {language === "ar" ? "احتمالية الفشل" : "Failure Probability"}
                </th>
                <th className={`text-right py-3 px-4 ${subTextColor} font-semibold`}>
                  {language === "ar" ? "نقطة الفشل المتوقعة" : "Expected Failure Point"}
                </th>
                <th className={`text-right py-3 px-4 ${subTextColor} font-semibold`}>
                  {language === "ar" ? "نوع الفشل" : "Failure Type"}
                </th>
                <th className={`text-right py-3 px-4 ${subTextColor} font-semibold`}>
                  {language === "ar" ? "المسار" : "Route"}
                </th>
              </tr>
            </thead>
            <tbody>
              {failureData.map((item, index) => {
                const riskColor = getRiskColor(item.failureProbability);
                return (
                  <tr
                    key={index}
                    className={`border-b ${borderClass} hover:bg-opacity-50 transition-colors`}
                    style={{ borderLeftColor: riskColor, borderLeftWidth: "4px" }}
                  >
                    <td className={`py-3 px-4 ${textColor} font-semibold`}>{item.plateNumber}</td>
                    <td className={`py-3 px-4`}>
                      <span className="font-bold" style={{ color: getRiskColor(100 - item.vfs) }}>
                        {item.vfs}%
                      </span>
                    </td>
                    <td className={`py-3 px-4`}>
                      <span className="font-bold" style={{ color: riskColor }}>
                        {item.failureProbability.toFixed(1)}%
                      </span>
                    </td>
                    <td className={`py-3 px-4 ${textColor}`}>
                      {item.failurePoint}% {language === "ar" ? "من المسار" : "of route"}
                    </td>
                    <td className={`py-3 px-4 ${textColor}`}>{item.failureType}</td>
                    <td className={`py-3 px-4 ${subTextColor} text-sm`}>
                      {item.from} → {item.to}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ColdChainFailure;


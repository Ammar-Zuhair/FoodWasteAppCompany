import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LabelList } from "recharts";
import ChartContainer from "../shared/ChartContainer.jsx";
import DataCard from "../shared/DataCard.jsx";

function ReturnsPrediction({ returnsData }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  // دالة لتحويل الأسباب للعربية
  const getReasonName = (reason) => {
    const reasonMap = {
      "Expiry": "انتهاء الصلاحية",
      "Damage": "التلف",
      "Overstock": "فائض مخزون",
      "Quality": "الجودة",
      "Unknown": "غير معروف"
    };
    return language === "ar" ? (reasonMap[reason] || reason) : reason;
  };

  // تحليل بيانات المرتجعات
  const predictionData = useMemo(() => {
    if (!returnsData || returnsData.length === 0) return [];

    return returnsData.map((item) => {
      const returnProbability = item.returnProbability || (item.predicted ? item.predictionConfidence || 0.5 : 0.2);
      const predictedQuantity = item.predictedQuantity || item.quantity || 0;
      const predictedReasonRaw = item.predictedReason || item.reason || "Unknown";
      const predictedReason = getReasonName(predictedReasonRaw);

      let riskLevel = language === "ar" ? "منخفض" : "Low";
      if (returnProbability >= 0.7) riskLevel = language === "ar" ? "عالي" : "High";
      else if (returnProbability >= 0.5) riskLevel = language === "ar" ? "متوسط" : "Medium";

      return {
        id: item.id,
        product: item.product,
        branch: item.branch,
        returnProbability: returnProbability * 100,
        predictedQuantity,
        predictedReason,
        riskLevel,
        confidence: item.predictionConfidence || 0.75,
        returnDate: item.returnDate,
        actualReturned: item.actualReturned || false,
      };
    }).sort((a, b) => b.returnProbability - a.returnProbability);
  }, [returnsData, language]);

  // إحصائيات سريعة
  const stats = useMemo(() => {
    const totalPredicted = predictionData.filter((item) => item.returnProbability >= 50).length;
    const totalQuantity = predictionData.reduce((sum, item) => sum + item.predictedQuantity, 0);
    const avgProbability = predictionData.reduce((sum, item) => sum + item.returnProbability, 0) / (predictionData.length || 1);
    const highRisk = predictionData.filter((item) => item.riskLevel === "High").length;
    const totalConfidence = predictionData.reduce((sum, item) => sum + item.confidence, 0) / (predictionData.length || 1);

    return {
      totalPredicted,
      totalQuantity,
      avgProbability: Math.round(avgProbability),
      highRisk,
      avgConfidence: Math.round(totalConfidence * 100),
    };
  }, [predictionData]);

  // بيانات الرسم البياني
  const chartData = useMemo(() => {
    return predictionData.slice(0, 10).map((item) => ({
      product: item.product.length > 15 ? item.product.substring(0, 15) + "..." : item.product,
      probability: item.returnProbability,
      quantity: item.predictedQuantity,
      confidence: Math.round(item.confidence * 100),
    }));
  }, [predictionData]);

  // توزيع الأسباب
  const reasonDistribution = useMemo(() => {
    const reasons = {};
    predictionData.forEach((item) => {
      // استخدام السبب الأصلي (الإنجليزية) للعد
      const reasonRaw = item.predictedReason || item.reason || "Unknown";
      const reason = getReasonName(reasonRaw);
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    return Object.keys(reasons).map((reason) => ({
      reason,
      count: reasons[reason],
    })).sort((a, b) => b.count - a.count);
  }, [predictionData, language]);

  const getRiskColor = (probability) => {
    if (probability >= 70) return theme === "dark" ? "#ef4444" : "#dc2626";
    if (probability >= 50) return theme === "dark" ? "#f59e0b" : "#d97706";
    return theme === "dark" ? "#10b981" : "#059669";
  };

  if (!returnsData || returnsData.length === 0) {
    return (
      <div className={`rounded-xl border ${borderClass} p-8 ${cardBgClass} backdrop-blur-xl`}>
        <p className={textColor}>
          {language === "ar" ? "لا توجد بيانات متاحة" : "No data available"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* بطاقات إحصائية */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <DataCard
          title={language === "ar" ? "مرتجعات متوقعة" : "Predicted Returns"}
          value={stats.totalPredicted}
          subtitle={language === "ar" ? "منتج" : "products"}
        />
        <DataCard
          title={language === "ar" ? "إجمالي الكمية" : "Total Quantity"}
          value={stats.totalQuantity.toLocaleString()}
          subtitle={language === "ar" ? "وحدة" : "units"}
        />
        <DataCard
          title={language === "ar" ? "متوسط الاحتمالية" : "Avg Probability"}
          value={`${stats.avgProbability}%`}
          subtitle={language === "ar" ? "احتمالية المرتجع" : "return probability"}
        />
        <DataCard
          title={language === "ar" ? "عالي المخاطر" : "High Risk"}
          value={stats.highRisk}
          subtitle={language === "ar" ? "منتج" : "products"}
        />
      </div>

      {/* احتمالية المرتجع لكل منتج */}
      <ChartContainer title={language === "ar" ? "احتمالية المرتجع لكل منتج" : "Return Probability by Product"}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
            <XAxis 
              type="number" 
              domain={[0, 100]} 
              stroke={subTextColor}
              tick={{ fill: "#ffffff", fontSize: 12 }}
            />
            <YAxis
              dataKey="product"
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
                if (name === "probability") return [`${value}%`, language === "ar" ? "الاحتمالية" : "Probability"];
                if (name === "quantity") return [`${value} ${language === "ar" ? "وحدة" : "units"}`, language === "ar" ? "الكمية المتوقعة" : "Predicted Quantity"];
                if (name === "confidence") return [`${value}%`, language === "ar" ? "الثقة" : "Confidence"];
                return [value, name];
              }}
            />
            <Legend 
              wrapperStyle={{ 
                color: "#ffffff", 
                paddingTop: "20px",
                display: "flex",
                justifyContent: "center",
                gap: "30px",
                fontSize: "14px",
                fontWeight: "500"
              }}
              iconType="square"
              iconSize={14}
            />
            <Bar dataKey="probability" name={language === "ar" ? "احتمالية المرتجع (%)" : "Return Probability (%)"} radius={[0, 10, 10, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getRiskColor(entry.probability)} />
              ))}
              <LabelList 
                dataKey="product" 
                position="inside" 
                style={{ fill: "#ffffff", fontSize: "14px", fontWeight: "bold" }}
                offset={0}
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

      {/* توزيع الأسباب */}
      <ChartContainer title={language === "ar" ? "توزيع أسباب المرتجعات" : "Return Reasons Distribution"}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={reasonDistribution}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"} />
            <XAxis
              dataKey="reason"
              stroke={subTextColor}
              tick={false}
            />
            <YAxis 
              stroke={subTextColor}
              tick={{ fill: "#ffffff", fontSize: 12 }}
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
            />
            <Bar dataKey="count" fill={theme === "dark" ? "#3b82f6" : "#2563eb"} radius={[10, 10, 0, 0]}>
              <LabelList 
                dataKey="reason" 
                position="inside" 
                style={{ fill: "#ffffff", fontSize: "13px", fontWeight: "bold" }}
                offset={0}
              />
              <LabelList 
                dataKey="count" 
                position="insideTop" 
                style={{ fill: "#ffffff", fontSize: "14px", fontWeight: "bold" }}
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
                  {language === "ar" ? "المنتج" : "Product"}
                </th>
                <th className={`text-right py-3 px-4 ${subTextColor} font-semibold`}>
                  {language === "ar" ? "الفرع" : "Branch"}
                </th>
                <th className={`text-right py-3 px-4 ${subTextColor} font-semibold`}>
                  {language === "ar" ? "احتمالية المرتجع" : "Return Probability"}
                </th>
                <th className={`text-right py-3 px-4 ${subTextColor} font-semibold`}>
                  {language === "ar" ? "الكمية المتوقعة" : "Predicted Quantity"}
                </th>
                <th className={`text-right py-3 px-4 ${subTextColor} font-semibold`}>
                  {language === "ar" ? "السبب المتوقع" : "Predicted Reason"}
                </th>
                <th className={`text-right py-3 px-4 ${subTextColor} font-semibold`}>
                  {language === "ar" ? "الثقة" : "Confidence"}
                </th>
              </tr>
            </thead>
            <tbody>
              {predictionData.map((item, index) => {
                const riskColor = getRiskColor(item.returnProbability);
                return (
                  <tr
                    key={index}
                    className={`border-b ${borderClass} hover:bg-opacity-50 transition-colors`}
                    style={{ borderLeftColor: riskColor, borderLeftWidth: "4px" }}
                  >
                    <td className={`py-3 px-4 ${textColor} font-semibold`}>{item.product}</td>
                    <td className={`py-3 px-4 ${textColor}`}>{item.branch}</td>
                    <td className={`py-3 px-4`}>
                      <span className="font-bold" style={{ color: riskColor }}>
                        {item.returnProbability.toFixed(1)}%
                      </span>
                    </td>
                    <td className={`py-3 px-4 ${textColor}`}>
                      {item.predictedQuantity.toLocaleString()} {language === "ar" ? "وحدة" : "units"}
                    </td>
                    <td className={`py-3 px-4 ${textColor}`}>{item.predictedReason}</td>
                    <td className={`py-3 px-4`}>
                      <span className="font-semibold" style={{ color: riskColor }}>
                        {Math.round(item.confidence * 100)}%
                      </span>
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

export default ReturnsPrediction;


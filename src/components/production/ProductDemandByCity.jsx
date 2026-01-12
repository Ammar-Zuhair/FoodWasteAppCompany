import { useMemo, useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { API_CONFIG } from "../../config/api.config.js";

function ProductDemandByCity() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [viewMode, setViewMode] = useState("products"); // products or cities
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const textColor = theme === "dark" ? "#e2e8f0" : "#053F5C";
  const subTextColor = theme === "dark" ? "#94a3b8" : "#429EBD";
  const borderColor = theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(66, 158, 189, 0.2)";

  // جلب التوصيات من API
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_CONFIG.baseURL}/api/production/recommendations`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRecommendations(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError(err.message);
      // Set empty data to show empty state instead of error
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  // توليد توصيات جديدة
  const handleGenerateRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_CONFIG.baseURL}/api/production/recommendations/generate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      // إعادة جلب التوصيات بعد التوليد
      await fetchRecommendations();

      // عرض رسالة نجاح
      alert(language === "ar"
        ? `✅ تم توليد ${result.count} توصية بنجاح!`
        : `✅ Successfully generated ${result.count} recommendations!`
      );
    } catch (err) {
      console.error('Error generating recommendations:', err);
      setError(err.message);
      alert(language === "ar"
        ? `❌ خطأ في توليد التوصيات: ${err.message}`
        : `❌ Error generating recommendations: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // تجميع البيانات حسب المنتج (مجموع جميع المحافظات)
  const productData = useMemo(() => {
    const grouped = {};
    recommendations.forEach(item => {
      const prodId = item.product_id;
      if (!grouped[prodId]) {
        grouped[prodId] = {
          id: prodId,
          name_ar: item.product_name || "Unknown",
          name_en: item.product_name_en || item.product_name || "Unknown",
          cities: [],
          totalDemand: 0,
          totalProduction: 0,
          avgConfidence: 0,
          confidenceSum: 0,
          count: 0
        };
      }
      grouped[prodId].cities.push({
        name_ar: item.governorate_name || "Unknown",
        name_en: item.governorate_name_en || item.governorate_name || "Unknown",
        demand: item.predicted_demand || 0,
        production: item.recommended_production || 0,
        confidence: item.confidence_score || 0.75,
      });
      grouped[prodId].totalDemand += item.predicted_demand || 0;
      grouped[prodId].totalProduction += item.recommended_production || 0;
      grouped[prodId].confidenceSum += item.confidence_score || 0.75;
      grouped[prodId].count += 1;
    });

    // حساب متوسط الثقة
    Object.values(grouped).forEach(product => {
      product.avgConfidence = product.count > 0 ? product.confidenceSum / product.count : 0;
      product.cities.sort((a, b) => b.demand - a.demand);
    });

    return Object.values(grouped).sort((a, b) => b.totalDemand - a.totalDemand);
  }, [recommendations]);

  // تجميع البيانات حسب المدينة
  const cityData = useMemo(() => {
    const grouped = {};
    recommendations.forEach(item => {
      const cityId = item.governorate_id;
      if (!grouped[cityId]) {
        grouped[cityId] = {
          id: cityId,
          name_ar: item.governorate_name || "Unknown",
          name_en: item.governorate_name_en || item.governorate_name || "Unknown",
          products: [],
          totalDemand: 0,
          totalProduction: 0,
        };
      }
      grouped[cityId].products.push({
        name_ar: item.product_name || "Unknown",
        name_en: item.product_name_en || item.product_name || "Unknown",
        demand: item.predicted_demand || 0,
        production: item.recommended_production || 0,
        confidence: item.confidence_score || 0.75,
      });
      grouped[cityId].totalDemand += item.predicted_demand || 0;
      grouped[cityId].totalProduction += item.recommended_production || 0;
    });

    Object.values(grouped).forEach(city => {
      city.products.sort((a, b) => b.demand - a.demand);
    });

    return Object.values(grouped).sort((a, b) => b.totalDemand - a.totalDemand);
  }, [recommendations]);

  const maxProductDemand = useMemo(() => {
    return Math.max(...productData.map(p => p.totalDemand), 1);
  }, [productData]);

  const maxCityDemand = useMemo(() => {
    return Math.max(...cityData.map(c => c.totalDemand), 1);
  }, [cityData]);

  const getConfidenceColor = (conf) => {
    const confidence = conf * 100;
    if (confidence >= 85) return { main: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
    if (confidence >= 70) return { main: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" };
    return { main: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
  };

  const productColors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: subTextColor }}>{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p style={{ color: "#ef4444" }}>{language === "ar" ? "خطأ في تحميل البيانات" : "Error loading data"}: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold" style={{ color: textColor }}>
            {language === "ar" ? "الطلب المتوقع حسب المنتج" : "Expected Demand by Product"}
          </h3>
          <p className="text-sm mt-1" style={{ color: subTextColor }}>
            {language === "ar"
              ? "توصيات الذكاء الاصطناعي للإنتاج اليومي"
              : "AI-powered daily production recommendations"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Generate Button */}
          <button
            onClick={handleGenerateRecommendations}
            disabled={loading}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${loading
              ? 'opacity-50 cursor-not-allowed'
              : 'hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
              } ${theme === "dark"
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                : "bg-gradient-to-r from-[#429EBD] to-[#053F5C] text-white"
              }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.75" />
                </svg>
                <span>{language === "ar" ? "جاري التوليد..." : "Generating..."}</span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v20M2 12h20" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>{language === "ar" ? "بدء التنبؤ" : "Generate Predictions"}</span>
              </>
            )}
          </button>

          {/* View Toggle */}
          <div
            className="flex rounded-lg p-1"
            style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" }}
          >
            <button
              onClick={() => setViewMode("products")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${viewMode === "products"
                ? theme === "dark"
                  ? "bg-emerald-500 text-white"
                  : "bg-[#429EBD] text-white"
                : ""
                }`}
              style={{ color: viewMode !== "products" ? subTextColor : undefined }}
            >
              {language === "ar" ? "حسب المنتج" : "By Product"}
            </button>
            <button
              onClick={() => setViewMode("cities")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${viewMode === "cities"
                ? theme === "dark"
                  ? "bg-emerald-500 text-white"
                  : "bg-[#429EBD] text-white"
                : ""
                }`}
              style={{ color: viewMode !== "cities" ? subTextColor : undefined }}
            >
              {language === "ar" ? "حسب المدينة" : "By City"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - List */}
        <div
          className={`rounded-xl border p-5 ${theme === "dark" ? "bg-slate-900/80 border-white/10" : "bg-white border-slate-100"
            }`}
        >
          <h4 className="text-lg font-bold mb-4" style={{ color: textColor }}>
            {viewMode === "products"
              ? (language === "ar" ? "المنتجات" : "Products")
              : (language === "ar" ? "المحافظات" : "Governorates")
            }
          </h4>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {(viewMode === "products" ? productData : cityData).map((item, index) => {
              const color = productColors[index % productColors.length];
              const percentage = ((item.totalDemand) / (viewMode === "products" ? maxProductDemand : maxCityDemand)) * 100;
              const isSelected = selectedProduct === item.id;
              const displayName = language === "ar" ? item.name_ar : item.name_en;

              return (
                <div
                  key={index}
                  onClick={() => setSelectedProduct(isSelected ? null : item.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${isSelected
                    ? "scale-[1.02] shadow-lg"
                    : "hover:scale-[1.01]"
                    } ${theme === "dark"
                      ? "bg-slate-800/50 border-white/10 hover:border-white/20"
                      : "bg-slate-50 border-slate-100 hover:border-slate-200"
                    }`}
                  style={{
                    borderLeftWidth: "4px",
                    borderLeftColor: isSelected ? color : "transparent",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                        style={{ backgroundColor: color }}
                      >
                        {viewMode === "products" ? (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          </svg>
                        ) : (
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h5 className="font-bold" style={{ color: textColor }}>
                          {displayName}
                        </h5>
                        <p className="text-xs" style={{ color: subTextColor }}>
                          {viewMode === "products"
                            ? `${item.cities.length} ${language === "ar" ? "محافظات" : "cities"}`
                            : `${item.products.length} ${language === "ar" ? "منتجات" : "products"}`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black" style={{ color }}>
                        {item.totalDemand.toLocaleString()}
                      </div>
                      <div className="text-xs" style={{ color: subTextColor }}>
                        {language === "ar" ? "وحدة" : "units"}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div
                    className="h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel - Details */}
        <div
          className={`rounded-xl border p-5 ${theme === "dark" ? "bg-slate-900/80 border-white/10" : "bg-white border-slate-100"
            }`}
        >
          <h4 className="text-lg font-bold mb-4" style={{ color: textColor }}>
            {selectedProduct
              ? (viewMode === "products"
                ? (language === "ar"
                  ? `المحافظات التي تطلب: ${productData.find(p => p.id === selectedProduct)?.name_ar}`
                  : `Cities ordering: ${productData.find(p => p.id === selectedProduct)?.name_en}`)
                : (language === "ar"
                  ? `المنتجات المطلوبة في: ${cityData.find(c => c.id === selectedProduct)?.name_ar}`
                  : `Products ordered in: ${cityData.find(c => c.id === selectedProduct)?.name_en}`))
              : (language === "ar" ? "اختر منتج أو مدينة لعرض التفاصيل" : "Select a product or city for details")
            }
          </h4>

          {selectedProduct ? (
            <div className="space-y-3">
              {(() => {
                const selected = viewMode === "products"
                  ? productData.find(p => p.id === selectedProduct)
                  : cityData.find(c => c.id === selectedProduct);

                if (!selected) return null;

                const items = viewMode === "products" ? selected.cities : selected.products;
                const maxItemDemand = Math.max(...items.map(i => i.demand), 1);

                return items.map((item, index) => {
                  const colors = getConfidenceColor(item.confidence);
                  const percentage = (item.demand / maxItemDemand) * 100;
                  const itemDisplayName = language === "ar" ? item.name_ar : item.name_en;

                  return (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border ${theme === "dark" ? "bg-slate-800/30 border-white/5" : "bg-slate-50 border-slate-100"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: colors.bg }}
                          >
                            {viewMode === "products" ? (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.main} strokeWidth="2">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                              </svg>
                            ) : (
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.main} strokeWidth="2">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h6 className="font-semibold" style={{ color: textColor }}>
                              {itemDisplayName}
                            </h6>
                            <span
                              className="text-xs font-medium px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: colors.bg, color: colors.main }}
                            >
                              {Math.round(item.confidence * 100)}% {language === "ar" ? "ثقة" : "conf."}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black" style={{ color: colors.main }}>
                            {item.demand.toLocaleString()}
                          </div>
                          <div className="text-xs" style={{ color: subTextColor }}>
                            {language === "ar" ? "وحدة" : "units"}
                          </div>
                        </div>
                      </div>

                      {/* Bar */}
                      <div
                        className="h-3 rounded-full overflow-hidden"
                        style={{ backgroundColor: colors.bg }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: colors.main,
                          }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={subTextColor} strokeWidth="1.5" className="mb-4 opacity-30">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <p style={{ color: subTextColor }}>
                {language === "ar"
                  ? "اضغط على منتج أو مدينة من القائمة لعرض التفاصيل"
                  : "Click on a product or city from the list to view details"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductDemandByCity;

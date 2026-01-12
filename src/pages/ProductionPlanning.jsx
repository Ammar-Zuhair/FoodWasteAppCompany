import { useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  useProductionOrders,
  useDemandForecasts,
  useProductionSuggestions,
  useRecommendationStats
} from "../hooks/usePlanning.js";
import { getProductionLines, getProductionOrders } from "../utils/api/production.js";
import { getAIRecommendations, generateAIRecommendations } from "../utils/api/planning.js";
import DemandOverview from "../components/production/DemandOverview.jsx";
import ProductionScheduleTable from "../components/production/ProductionScheduleTable.jsx";
import ProductionLinesStatus from "../components/production/ProductionLinesStatus.jsx";
import ProductionRecommendations from "../components/production/ProductionRecommendations.jsx";
import OptimalProductionQuantity from "../components/ai/OptimalProductionQuantity.jsx";
import ProductDemandByCity from "../components/production/ProductDemandByCity.jsx";

function ProductionPlanning({ user }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const { orders: productionOrders, loading: ordersLoading, error: ordersError, reload: reloadOrders } = useProductionOrders({});
  const { forecasts: demandForecasts, loading: forecastsLoading, error: forecastsError, reload: reloadForecasts } = useDemandForecasts({});
  const { suggestions: productionSuggestions, loading: suggestionsLoading, load: loadSuggestions } = useProductionSuggestions();
  const { stats: recommendationStats, loading: statsLoading, reload: reloadStats } = useRecommendationStats({});
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  // New state for production lines and orders
  const [productionLines, setProductionLines] = useState([]);
  const [productionSchedule, setProductionSchedule] = useState([]);
  const [linesLoading, setLinesLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);

  // AI Recommendations state
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [aiRecsLoading, setAiRecsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const loading = ordersLoading || forecastsLoading || statsLoading || linesLoading || scheduleLoading || aiRecsLoading;
  const error = ordersError || forecastsError;

  // Map API data to component format
  const demandForecast = demandForecasts || [];
  const productionRecommendations = productionSuggestions?.recommendations || [];

  // Fetch AI recommendations on mount
  useEffect(() => {
    const fetchAIRecommendations = async () => {
      try {
        setAiRecsLoading(true);
        const recs = await getAIRecommendations({ limit: 10 });

        // Map API response to component format
        const mappedRecs = recs.map(rec => ({
          id: rec.id,
          title: language === "ar" ? rec.title : (rec.title_en || rec.title),
          priority: rec.priority,
          category: rec.category,
          description: language === "ar" ? rec.description : (rec.description_en || rec.description),
          expectedSavings: rec.expected_savings,
          confidence: rec.confidence,
          status: rec.status || "planning",
          implementationSteps: rec.implementation_steps || []
        }));
        setAiRecommendations(mappedRecs);
      } catch (error) {
        console.error("Error fetching AI recommendations:", error);
      } finally {
        setAiRecsLoading(false);
      }
    };

    fetchAIRecommendations();
  }, [language]);

  const handleGenerateRecommendations = async () => {
    setIsGenerating(true);
    try {
      const newRecs = await generateAIRecommendations();

      // Only keep successful recommendations
      if (newRecs && Array.isArray(newRecs) && newRecs.length > 0) {
        // Map API response to component format (Same as in useEffect)
        const mappedRecs = newRecs.map(rec => ({
          id: rec.id,
          title: language === "ar" ? rec.title : (rec.title_en || rec.title),
          priority: rec.priority,
          category: rec.category,
          description: language === "ar" ? rec.description : (rec.description_en || rec.description),
          expectedSavings: rec.expected_savings,
          confidence: rec.confidence,
          status: rec.status || "planning",
          implementationSteps: rec.implementation_steps || []
        }));

        setAiRecommendations(mappedRecs);
        toast.success(
          language === "ar"
            ? `تم توليد ${newRecs.length} توصية جديدة بنجاح`
            : `Successfully generated ${newRecs.length} new recommendations`
        );
      } else {
        toast(
          language === "ar"
            ? "لم يتم العثور على توصيات جديدة في الوقت الحالي"
            : "No new recommendations found at this time",
          { icon: 'ℹ️' }
        );
      }
    } catch (error) {
      console.error("Failed to generate recommendations:", error);

      let errorMessage = language === "ar"
        ? "فشل توليد التوصيات. يرجى التحقق من الإعدادات."
        : "Failed to generate recommendations. Please check settings.";

      if (error.response && error.response.data && error.response.data.detail) {
        const backendError = error.response.data.detail;
        if (typeof backendError === 'string') {
          errorMessage = backendError;
        } else if (Array.isArray(backendError)) {
          errorMessage = backendError.map(e => e.msg || JSON.stringify(e)).join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch production lines
  useEffect(() => {
    const fetchProductionLines = async () => {
      try {
        setLinesLoading(true);
        const lines = await getProductionLines({});

        // Map API response to component format
        const mappedLines = lines.map(line => ({
          id: line.id,
          name: language === "ar" ? line.name : (line.name_en || line.name),
          status: line.status,
          currentProduct: language === "ar" ? line.current_product : (line.current_product_en || line.current_product),
          productionRate: line.production_rate,
          efficiency: line.efficiency,
          completedHours: line.completed_hours,
          scheduledHours: line.scheduled_hours,
          nextMaintenance: line.next_maintenance
        }));

        setProductionLines(mappedLines);
      } catch (error) {
        console.error("Error fetching production lines:", error);
      } finally {
        setLinesLoading(false);
      }
    };

    fetchProductionLines();
  }, [language]);

  // Fetch production orders/schedule
  useEffect(() => {
    const fetchProductionSchedule = async () => {
      try {
        setScheduleLoading(true);
        const orders = await getProductionOrders({ limit: 20 });

        // Map API response to component format
        const mappedOrders = orders.map(order => ({
          id: order.id,
          product: order.product,
          product_en: order.product_en,
          product_name: order.product,
          product_name_en: order.product_en,
          facility_name: order.facility_name,
          facility_name_en: order.facility_name_en,
          governorate: order.governorate,
          governorate_en: order.governorate_en,
          productionLine: order.production_line,
          factory: language === "ar" ? order.facility_name : (order.facility_name_en || order.facility_name),
          scheduledDate: order.scheduled_date,
          startTime: order.start_time,
          endTime: order.end_time,
          quantity: order.quantity,
          demandForecast: order.demand_forecast,
          status: order.status,
          completion: order.completion
        }));

        setProductionSchedule(mappedOrders);
      } catch (error) {
        console.error("Error fetching production schedule:", error);
      } finally {
        setScheduleLoading(false);
      }
    };


    fetchProductionSchedule();
  }, [language]);

  // Fetch AI recommendations
  useEffect(() => {
    const fetchAIRecommendations = async () => {
      try {
        setAiRecsLoading(true);
        const recs = await getAIRecommendations({ limit: 10 });

        // Map to component format
        const mappedRecs = recs.map(rec => ({
          id: rec.id,
          title: language === "ar" ? rec.title : (rec.title_en || rec.title),
          priority: rec.priority,
          category: rec.category,
          description: language === "ar" ? rec.description : (rec.description_en || rec.description),
          expectedSavings: rec.expected_savings,
          confidence: rec.confidence,
          status: rec.status || "planning",
          implementationSteps: rec.implementation_steps || []
        }));

        setAiRecommendations(mappedRecs);
      } catch (error) {
        console.error("Error fetching AI recommendations:", error);
        setAiRecommendations([]);
      } finally {
        setAiRecsLoading(false);
      }
    };

    fetchAIRecommendations();
  }, [language]);

  useEffect(() => {
    if (!loading && productionSchedule.length > 0 && !selectedSchedule) {
      setSelectedSchedule(productionSchedule[0]);
    }
  }, [loading, productionSchedule, selectedSchedule]);

  // Generate optimal production data from demand forecasts if not available from API
  const optimalProductionData = useMemo(() => {
    // If we have data from API suggestions, use it
    if (productionSuggestions?.optimal_quantities && productionSuggestions.optimal_quantities.length > 0) {
      return productionSuggestions.optimal_quantities;
    }

    // Otherwise, generate from demand forecasts
    if (demandForecast.length > 0) {
      return demandForecast.map((forecast) => {
        const demand = forecast.predictedDemand || forecast.demand || 0;
        const currentStock = forecast.currentStock || 0;
        const optimalQuantity = Math.max(0, demand - currentStock + (demand * 0.1)); // +10% buffer
        const expectedWaste = Math.max(0, (demand * 0.1) * 0.15); // 15% of buffer

        return {
          product: language === "ar"
            ? (forecast.product_name || forecast.product || 'Unknown')
            : (forecast.product_name_en || forecast.product || 'Unknown'),
          productId: forecast.product_id || forecast.productId,
          demandForecast: demand,
          currentStock: currentStock,
          optimalQuantity: Math.round(optimalQuantity),
          expectedWaste: Math.round(expectedWaste),
          confidence: forecast.confidence || 0.75,
          recommendation: 'Proceed',
        };
      });
    }

    return [];
  }, [productionSuggestions, demandForecast, language]);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";

  const handleScheduleClick = (schedule) => {
    setSelectedSchedule(schedule);
  };

  const reload = () => {
    reloadOrders();
    reloadForecasts();
    reloadStats();
  };

  if (loading && !recommendationStats) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="text-lg font-semibold text-[#053F5C] dark:text-white">
          {language === "ar" ? "جاري تحميل بيانات الإنتاج..." : "Loading production data..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* العنوان */}
      <div className="mb-8 relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-blue-500/10 rounded-3xl blur-2xl opacity-50" />
        <div className="relative">
          <h1 className={`text-4xl font-black mb-3 ${textColor}`}>
            {t("productionPlanning")}
          </h1>
          <p className={`text-lg font-semibold ${subTextColor}`}>
            {language === "ar"
              ? "تخطيط الإنتاج الذكي بناءً على توقعات الطلب والتحليلات"
              : "Smart production planning based on demand forecasts and analytics"}
          </p>
        </div>
      </div>

      {/* نظرة عامة على الطلب */}
      <DemandOverview
        //demandForecast={demandForecast}
        stats={recommendationStats}
        loading={statsLoading}
      />

      {/* توقعات الطلب حسب المنتج والمدينة */}
      <ProductDemandByCity demandForecast={demandForecast} />

      {/* حالة خطوط الإنتاج */}
      <ProductionLinesStatus productionLines={productionLines} />

          
      
      {/* زر توليد التوصيات الذكية */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleGenerateRecommendations}
          disabled={isGenerating}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-all duration-300
            ${isGenerating
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#F2C94C] to-[#F2994A] hover:shadow-lg hover:scale-105'
            }
            text-white flex items-center gap-2
          `}
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {language === "ar" ? "جاري التوليد..." : "Generating..."}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {language === "ar" ? "توليد توصيات جديدة" : "Generate New Recommendations"}
            </>
          )}
        </button>
      </div>

      {/* التوصيات الذكية */}
      <ProductionRecommendations recommendations={aiRecommendations} />

      {/* الإنتاج المثالي */}
      {/*<div className="animate-slide-in" style={{ animationDelay: "0.4s" }}>
        <OptimalProductionQuantity productionData={optimalProductionData} />
      </div>*/}
    </div>
  );
}
export default ProductionPlanning;

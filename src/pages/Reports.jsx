import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  LabelList,
} from "recharts";
import ChartContainer from "../components/shared/ChartContainer.jsx";
import DataCard from "../components/shared/DataCard.jsx";
import { PrinterIcon, DownloadIcon } from "../components/shared/Icons.jsx";
import ReportOptionsModal from "../components/reports/ReportOptionsModal.jsx";
import { generatePDFReport } from "../utils/pdfGenerator.js";
import { useDashboardSection } from "../hooks/useDashboardData.js";
import { useReportsData } from "../hooks/useReportsData.js";
import { exportReportExcel, exportComprehensiveExcel, exportComprehensivePDF, exportWasteExecutiveReport, exportSalesReport, generateAISummary, getMonthlyWasteTrend, getLatestAISummary, getSystemOverview } from "../utils/api/reports.js";
import { printReport, shareContent, isNative } from "../utils/capacitor.js";

function Reports() {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [showReportModal, setShowReportModal] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(null);
  const [selectedExportData, setSelectedExportData] = useState(null); // للخطوة الثانية
  const [monthlyWasteData, setMonthlyWasteData] = useState([]);
  const [pdfSections, setPdfSections] = useState({
    cover: true,
    summary: true,
    kpis: true,
    monthly: true,
    causes: true,
    risks: true,
    returns: true,
    details: true,
    recommendations: true
  });

  // System overview state
  const [systemOverview, setSystemOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Use v2 comprehensive reports API
  const { data: reportData, loading: reportLoading, error: reportError, insights, reload, updateFilters } = useReportsData({ period: selectedPeriod });

  // Legacy hooks for backward compatibility (returns data)
  const returnsHook = useDashboardSection("returns");
  const returnsData = returnsHook.data?.returns || [];

  // Fetch system overview on mount
  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setOverviewLoading(true);
        const data = await getSystemOverview();
        setSystemOverview(data);
      } catch (error) {
        console.error("Error fetching system overview:", error);
      } finally {
        setOverviewLoading(false);
      }
    };
    fetchOverview();
  }, []);

  // Update filters when period changes
  useEffect(() => {
    updateFilters({ period: selectedPeriod });
  }, [selectedPeriod, updateFilters]);

  // Fetch monthly waste data
  useEffect(() => {
    const fetchMonthlyData = async () => {
      try {
        const result = await getMonthlyWasteTrend(12);
        if (result?.data) {
          setMonthlyWasteData(result.data);
        }
      } catch (error) {
        console.error("Error fetching monthly waste:", error);
      }
    };
    fetchMonthlyData();
  }, []);

  // Fetch latest AI summary on mount
  useEffect(() => {
    const fetchLatestAI = async () => {
      try {
        const result = await getLatestAISummary(language === "ar" ? "ar" : "en");
        if (result) {
          setAiSummary(result);
        }
      } catch (error) {
        console.error("Error fetching latest AI summary:", error);
      }
    };
    fetchLatestAI();
  }, [language]);

  // AI Summary generation handler
  const handleGenerateAI = async () => {
    if (!reportData) return;

    setAiLoading(true);
    try {
      const payload = {
        kpis: reportData.kpis,
        top_causes: reportData.top_causes,
        period: selectedPeriod,
        comparisons: reportData.comparisons || {},
        data_completeness: reportData.data_completeness || 0.5,
        sample_size: reportData.sample_size || 10
      };
      const result = await generateAISummary(payload, language);
      setAiSummary(result);
    } catch (error) {
      console.error("Error generating AI summary:", error);
      setAiSummary({ error: true, message: language === "ar" ? "حدث خطأ أثناء توليد التقرير" : "Error generating report" });
    } finally {
      setAiLoading(false);
    }
  };

  // Combined loading and error states
  const loading = reportLoading || returnsHook.loading;
  const error = reportError || returnsHook.error;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showExportDropdown && !e.target.closest('.relative')) {
        setShowExportDropdown(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showExportDropdown]);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  // إحصائيات عامة - From v2 API
  const generalStats = useMemo(() => {
    if (!reportData?.kpis) {
      return {
        totalWaste: 0,
        totalReturns: 0,
        avgRefrigerationRisk: 0,
        avgVehicleRisk: 0,
        incidentCount: 0,
      };
    }

    const kpis = reportData.kpis;
    return {
      totalWaste: Math.round(kpis.total_waste || 0),
      incidentCount: kpis.incident_count || 0,
      totalReturns: kpis.returns_count || 0,
      avgRefrigerationRisk: Math.round(kpis.cooling_risk || 0),
      avgVehicleRisk: Math.round(kpis.transport_risk || 0),
    };
  }, [reportData]);

  // بيانات الهدر - From v2 API
  const wasteTrendData = useMemo(() => {
    // Use top_causes as trend data for now
    if (!reportData?.top_causes || reportData.top_causes.length === 0) {
      return [];
    }

    return reportData.top_causes.map(cause => ({
      name: language === "ar" ? cause.name_ar : cause.name_en,
      waste: cause.quantity || 0,
      incidents: cause.count || 0,
    }));
  }, [reportData, language]);

  // بيانات المنشآت الأعلى هدراً - From v2 API
  const topFacilitiesData = useMemo(() => {
    if (!reportData?.top_facilities || reportData.top_facilities.length === 0) {
      return [];
    }

    return reportData.top_facilities.map(facility => ({
      name: facility.name,
      waste: facility.quantity || 0,
      incidents: facility.incidents || 0,
    }));
  }, [reportData]);

  // توزيع أسباب الهدر - From v2 API
  const wasteCauseDistribution = useMemo(() => {
    if (!reportData?.top_causes || reportData.top_causes.length === 0) {
      return [];
    }

    const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

    return reportData.top_causes.map((cause, index) => ({
      name: language === "ar" ? cause.name_ar : cause.name_en,
      value: cause.quantity || 0,
      count: cause.count || 0,
      color: COLORS[index % COLORS.length]
    }));
  }, [reportData, language]);

  // توزيع مستويات المخاطر - From v2 API
  const riskDistribution = useMemo(() => {
    if (!reportData?.risk_distribution) {
      return [];
    }

    const risk = reportData.risk_distribution;
    return [
      { name: language === "ar" ? "منخفض" : "Low", value: risk.low || 0, color: "#10b981" },
      { name: language === "ar" ? "متوسط" : "Medium", value: risk.medium || 0, color: "#f59e0b" },
      { name: language === "ar" ? "عالي" : "High", value: risk.high || 0, color: "#ef4444" },
    ];
  }, [reportData, language]);

  // المقارنة مع الفترة السابقة - From v2 API
  const comparisons = useMemo(() => {
    if (!reportData?.comparisons) {
      return {
        wasteChange: { value: 0, direction: "stable", isImproving: true },
        incidentsChange: { value: 0, direction: "stable", isImproving: true },
        returnsChange: { value: 0, direction: "stable", isImproving: true },
      };
    }

    const c = reportData.comparisons;
    return {
      wasteChange: {
        value: Math.abs(c.waste_change || 0),
        direction: c.waste_direction || "stable",
        isImproving: c.waste_direction === "down"
      },
      incidentsChange: {
        value: Math.abs(c.incidents_change || 0),
        direction: c.incidents_direction || "stable",
        isImproving: c.incidents_direction === "down"
      },
      returnsChange: {
        value: Math.abs(c.returns_change || 0),
        direction: c.returns_direction || "stable",
        isImproving: c.returns_direction === "down"
      },
    };
  }, [reportData]);

  // AI Insights from hook
  const aiInsights = useMemo(() => {
    if (!insights) {
      return null;
    }
    return {
      highestCause: insights.highestCause,
      mostWastedProduct: insights.mostWastedProduct,
      riskiestFacility: insights.riskiestFacility,
    };
  }, [insights]);

  // بيانات المرتجعات - Real data only
  const returnsTrendData = useMemo(() => {
    if (!returnsData || returnsData.length === 0) {
      return [];
    }
    return returnsData.slice(0, 6).map((item) => ({
      product: item.product.length > 10 ? item.product.substring(0, 10) + "..." : item.product,
      probability: Math.round((item.returnProbability || 0) * 100),
      quantity: item.predictedQuantity || 0,
    }));
  }, [returnsData, language]);

  // بيانات مخاطر المعدات - Using riskDistribution from v2 API
  const equipmentRiskData = riskDistribution;

  const COLORS = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];

  // وظيفة الطباعة - تدعم الموبايل والويب
  const handlePrint = async () => {
    try {
      if (isNative()) {
        // على الموبايل، نستخدم تصدير PDF مباشرة ثم مشاركته
        await handleExportPDF("comprehensive");
      } else {
        // على الويب، نستخدم الطباعة العادية
        window.print();
      }
    } catch (error) {
      console.error("Print error:", error);
      // Fallback: حاول الطباعة العادية
      try {
        window.print();
      } catch (e) {
        alert(language === "ar" ? "فشل في الطباعة. حاول تصدير PDF بدلاً من ذلك." : "Print failed. Try exporting PDF instead.");
      }
    }
  };

  // وظيفة إنشاء PDF
  const handleGeneratePDF = async (selectedSections) => {
    setShowReportModal(false);

    const reportData = {
      selectedPeriod,
      generalStats,
      wasteTrendData,
      wasteCauseDistribution,
      equipmentRiskData,
      returnsTrendData,
      detailedWasteData,
      detailedReturnsData,
      aiSummary, // Pass AI summary for the report
    };

    try {
      await generatePDFReport(reportData, selectedSections, language);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(language === "ar" ? "حدث خطأ أثناء إنشاء PDF" : "Error generating PDF");
    }
  };

  // وظيفة تصدير Excel - Using v2 API
  const handleExportExcel = async (reportType = "comprehensive") => {
    try {
      if (reportType === "comprehensive") {
        await exportComprehensiveExcel({
          period: selectedPeriod,
          user_email: "admin@hsa.com"
        });
      } else {
        await exportReportExcel(reportType, { period: selectedPeriod });
      }
    } catch (error) {
      console.error("Error exporting Excel:", error);
      alert(language === "ar" ? "حدث خطأ أثناء تصدير Excel" : "Error exporting Excel");
    }
  };

  // وظيفة تصدير PDF من الخادم - Server Side PDF
  const handleExportPDF = async (reportType = "comprehensive") => {
    if (isExporting) return; // منع التصدير المتعدد

    setIsExporting(true);
    try {
      await exportComprehensivePDF({
        period: selectedPeriod,
        language: language,
        report_type: reportType,
        generated_by: user?.name || user?.full_name || (language === "ar" ? "مدير النظام" : "System Admin")
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert(language === "ar" ? "حدث خطأ أثناء تصدير PDF. تأكد من اتصال الإنترنت." : "Error exporting PDF. Check your internet connection.");
    } finally {
      setIsExporting(false);
    }
  };

  // بيانات تفصيلية للجداول - From v2 API
  const detailedWasteData = useMemo(() => {
    if (!reportData?.top_products || reportData.top_products.length === 0) {
      return [];
    }
    return reportData.top_products.map((item, index) => ({
      id: index + 1,
      date: reportData.date_range?.end?.split('T')[0] || new Date().toISOString().split('T')[0],
      product: item.name || "غير محدد",
      cause: insights?.highestCause?.name_ar || (language === "ar" ? "غير معروف" : "Unknown"),
      amount: item.quantity || 0,
      incidents: item.incidents || 0,
    }));
  }, [language, reportData, insights]);

  const detailedReturnsData = useMemo(() => {
    if (!returnsData || returnsData.length === 0) {
      return [];
    }
    return returnsData.slice(0, 10).map((item) => ({
      product: item.product,
      probability: Math.round((item.returnProbability || 0) * 100),
      quantity: item.predictedQuantity || 0,
      reason:
        language === "ar"
          ? item.reason === "Quality"
            ? "الجودة"
            : item.reason === "Expiry"
              ? "انتهاء الصلاحية"
              : item.reason === "Damage"
                ? "التلف"
                : item.reason === "Overstock"
                  ? "فائض المخزون"
                  : item.reason || "غير معروف"
          : item.reason || "Unknown",
    }));
  }, [language, returnsData]);

  if (loading && !reportData) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="text-lg font-semibold text-[#053F5C] dark:text-white">
          {language === "ar" ? "جاري تحميل التقارير..." : "Loading reports..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
        <p className="text-lg font-semibold text-red-500">
          {language === "ar" ? "حدث خطأ أثناء تحميل البيانات" : "Failed to load data"}
        </p>
        <button
          onClick={() => {
            reload();
            returnsHook.reload();
          }}
          className="px-6 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          {language === "ar" ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* عنوان الصفحة مع أزرار الإجراءات */}
      <div className="mb-8 print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-2xl md:text-4xl font-bold ${textColor} mb-2`}>
              {t("reports")}
            </h2>
            <p className={`text-sm md:text-lg ${subTextColor}`}>
              {language === "ar" ? "التقارير واللوحات التحكم الشاملة" : "Comprehensive Reports and Dashboards"}
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {/* Unified Export Button */}
            <button
              onClick={() => setShowExportDropdown(showExportDropdown === 'export' ? null : 'export')}
              className="group flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all shadow-xl hover:shadow-2xl hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white"
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="group-hover:-translate-y-1 transition-transform">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="text-base">{language === "ar" ? "تصدير التقرير" : "Export Report"}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Export Modal - Using Portal to render outside parent hierarchy */}
            {showExportDropdown === 'export' && createPortal(
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"
                style={{ zIndex: 99999 }}
                onClick={() => { setShowExportDropdown(null); setSelectedExportData(null); }}
              >
                <div
                  className={`w-full max-w-lg mx-4 rounded-3xl shadow-2xl ${theme === "dark" ? "bg-slate-800" : "bg-white"} overflow-hidden`}
                  style={{ maxHeight: '85vh', overflowY: 'auto' }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="p-6 pb-4" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{language === "ar" ? "تصدير التقرير" : "Export Report"}</h3>
                        <p className="text-white/80 text-sm">
                          {selectedExportData
                            ? (language === "ar" ? "الخطوة ٢: اختر صيغة الملف" : "Step 2: Choose file format")
                            : (language === "ar" ? "الخطوة ١: اختر نوع البيانات" : "Step 1: Choose data type")
                          }
                        </p>
                      </div>
                    </div>
                    {/* Step Indicator */}
                    <div className="flex gap-2 mt-4">
                      <div className={`flex-1 h-2 rounded-full ${!selectedExportData ? "bg-white" : "bg-white/30"}`}></div>
                      <div className={`flex-1 h-2 rounded-full ${selectedExportData ? "bg-white" : "bg-white/30"}`}></div>
                    </div>
                  </div>

                  {/* Modal Content */}
                  <div className="p-6">
                    {!selectedExportData ? (
                      /* Step 1: Data Selection */
                      <div>
                        <h4 className={`text-sm font-bold ${subTextColor} mb-4 uppercase tracking-wider`}>
                          {language === "ar" ? "اختر نوع البيانات" : "Select Data Type"}
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { id: "waste", label: language === "ar" ? "تقرير الهدر" : "Waste Report", icon: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16", color: "#ef4444", description: language === "ar" ? "بيانات الهدر والخسائر" : "Waste & loss data" },
                            { id: "sales", label: language === "ar" ? "تقرير المبيعات" : "Sales Report", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", color: "#10b981", description: language === "ar" ? "بيانات المبيعات" : "Sales data" },
                            { id: "comprehensive", label: language === "ar" ? "تقرير شامل" : "Comprehensive", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", color: "#3b82f6", description: language === "ar" ? "جميع البيانات" : "All data" },
                            { id: "inventory", label: language === "ar" ? "المخزون" : "Inventory", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", color: "#8b5cf6", description: language === "ar" ? "بيانات المخزون" : "Stock data" },
                            { id: "production", label: language === "ar" ? "الإنتاج" : "Production", icon: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z", color: "#f59e0b", description: language === "ar" ? "أوامر الإنتاج" : "Production orders" },
                            { id: "donations", label: language === "ar" ? "التبرعات" : "Donations", icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z", color: "#ec4899", description: language === "ar" ? "بيانات التبرعات" : "Donation data" },
                          ].map(item => (
                            <button
                              key={item.id}
                              onClick={() => setSelectedExportData(item)}
                              className={`p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] text-center ${theme === "dark" ? "border-slate-600 hover:border-indigo-500" : "border-slate-200 hover:border-indigo-500"}`}
                              style={{ borderColor: `${item.color}30` }}
                            >
                              <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: `${item.color}15` }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2">
                                  <path d={item.icon} />
                                </svg>
                              </div>
                              <div className={`font-bold ${textColor} text-sm`}>{item.label}</div>
                              <div className={`text-xs ${subTextColor} mt-1`}>{item.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Step 2: Format Selection */
                      <div>
                        {/* Selected Data Preview */}
                        <div className={`p-4 rounded-2xl mb-6 flex items-center gap-4 ${theme === "dark" ? "bg-slate-700/50" : "bg-slate-100"}`}>
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${selectedExportData.color}20` }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={selectedExportData.color} strokeWidth="2">
                              <path d={selectedExportData.icon} />
                            </svg>
                          </div>
                          <div className="flex-1">
                            <div className={`font-bold ${textColor}`}>{selectedExportData.label}</div>
                            <div className={`text-sm ${subTextColor}`}>{selectedExportData.description}</div>
                          </div>
                          <button
                            onClick={() => setSelectedExportData(null)}
                            className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-slate-600" : "hover:bg-slate-200"}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M15 18l-6-6 6-6" />
                            </svg>
                          </button>
                        </div>

                        <h4 className={`text-sm font-bold ${subTextColor} mb-4 uppercase tracking-wider`}>
                          {language === "ar" ? "اختر صيغة الملف" : "Select File Format"}
                        </h4>

                        <div className="grid grid-cols-2 gap-4">
                          {/* PDF Option */}
                          <button
                            onClick={async () => {
                              const dataId = selectedExportData.id;
                              setShowExportDropdown(null);
                              setSelectedExportData(null);
                              await handleExportPDF(dataId);
                            }}
                            className={`p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] ${theme === "dark" ? "border-slate-600 hover:border-red-500 hover:bg-red-500/10" : "border-slate-200 hover:border-red-500 hover:bg-red-50"}`}
                          >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                              </svg>
                            </div>
                            <div className={`font-bold text-lg ${textColor}`}>PDF</div>
                            <div className={`text-xs ${subTextColor} mt-1`}>{language === "ar" ? "تقرير احترافي للطباعة" : "Professional printable report"}</div>
                          </button>

                          {/* Excel Option */}
                          <button
                            onClick={async () => {
                              setShowExportDropdown(null);
                              const dataId = selectedExportData.id;
                              setSelectedExportData(null);
                              try {
                                if (dataId === "waste") {
                                  await exportWasteExecutiveReport({ period: selectedPeriod });
                                } else if (dataId === "sales") {
                                  await exportSalesReport({ period: selectedPeriod });
                                } else {
                                  await handleExportExcel(dataId);
                                }
                              } catch (error) {
                                alert(language === "ar" ? "فشل التصدير" : "Export failed");
                              }
                            }}
                            className={`p-5 rounded-2xl border-2 transition-all hover:scale-[1.02] ${theme === "dark" ? "border-slate-600 hover:border-green-500 hover:bg-green-500/10" : "border-slate-200 hover:border-green-500 hover:bg-green-50"}`}
                          >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                                <path d="M4 4h16v16H4zM4 10h16M10 4v16" />
                              </svg>
                            </div>
                            <div className={`font-bold text-lg ${textColor}`}>Excel</div>
                            <div className={`text-xs ${subTextColor} mt-1`}>{language === "ar" ? "بيانات تفصيلية للتحليل" : "Detailed data for analysis"}</div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className={`p-4 border-t ${theme === "dark" ? "border-slate-700 bg-slate-800/50" : "border-slate-100 bg-slate-50"}`}>
                    <div className="flex gap-3">
                      {selectedExportData && (
                        <button
                          onClick={() => setSelectedExportData(null)}
                          className={`flex-1 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${theme === "dark" ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                          {language === "ar" ? "رجوع" : "Back"}
                        </button>
                      )}
                      <button
                        onClick={() => { setShowExportDropdown(null); setSelectedExportData(null); }}
                        className={`flex-1 py-3 rounded-xl font-semibold transition-all ${theme === "dark" ? "bg-slate-700 text-white hover:bg-slate-600" : "bg-slate-200 text-slate-700 hover:bg-slate-300"}`}
                      >
                        {language === "ar" ? "إغلاق" : "Close"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>,
              document.body
            )}

            {/* Print Button */}
            <button
              onClick={handlePrint}
              disabled={isExporting}
              className={`group flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl ${isExporting ? 'opacity-70 cursor-wait' : 'hover:scale-105'}`}
              style={{
                background: theme === "dark" ? "linear-gradient(135deg, #475569, #334155)" : "linear-gradient(135deg, #64748b, #475569)",
                color: "white"
              }}
            >
              {isExporting ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:scale-110 transition-transform">
                  <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
                </svg>
              )}
              {isExporting
                ? (language === "ar" ? "جاري التصدير..." : "Exporting...")
                : (language === "ar" ? "طباعة / تصدير" : "Print / Export")
              }
            </button>
          </div>
        </div>
      </div>

      {/* فلترة الفترة */}
      <div className={`rounded-xl border ${borderClass} p-4 ${cardBgClass} backdrop-blur-xl print:hidden`}>
        <div className="flex items-center gap-4">
          <span className={subTextColor}>{language === "ar" ? "الفترة:" : "Period:"}</span>
          <div className="flex gap-2">
            {["week", "month", "quarter", "year"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${selectedPeriod === period
                  ? theme === "dark"
                    ? "bg-emerald-500 text-white"
                    : "bg-[#429EBD] text-white"
                  : theme === "dark"
                    ? "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    : "bg-white text-[#053F5C] hover:bg-slate-50"
                  }`}
              >
                {language === "ar"
                  ? period === "week"
                    ? "أسبوع"
                    : period === "month"
                      ? "شهر"
                      : period === "quarter"
                        ? "ربع سنوي"
                        : "سنة"
                  : period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* معلومات التقرير للطباعة */}
      <div className="hidden print:block mb-6">
        <div className="text-center mb-4">
          <h1 className={`text-3xl font-bold ${textColor} mb-2`}>
            {language === "ar" ? "تقرير شامل - تقليل هدر الطعام" : "Comprehensive Report - Food Waste Reduction"}
          </h1>
          <p className={subTextColor}>
            {language === "ar"
              ? `الفترة: ${selectedPeriod === "week" ? "أسبوع" : selectedPeriod === "month" ? "شهر" : selectedPeriod === "quarter" ? "ربع سنوي" : "سنة"} - تاريخ التقرير: ${new Date().toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}`
              : `Period: ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} - Report Date: ${new Date().toLocaleDateString("en-US")}`
            }
          </p>
        </div>
      </div>

      {/* بطاقات إحصائية - تصميم محسن */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* إجمالي الهدر */}
        <div className={`relative overflow-hidden rounded-2xl p-5 shadow-xl transition-all hover:scale-[1.02] cursor-pointer`}
          style={{ background: theme === "dark" ? "linear-gradient(135deg, #1e293b, #0f172a)" : "linear-gradient(135deg, #ffffff, #f8fafc)", border: `2px solid ${theme === "dark" ? "#ef444430" : "#ef444420"}` }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20" style={{ background: "#ef4444", transform: "translate(30%, -30%)" }} />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </div>
            <span className={`text-sm font-medium ${subTextColor}`}>{language === "ar" ? "إجمالي الهدر" : "Total Waste"}</span>
          </div>
          <div className={`text-3xl font-bold ${textColor}`} style={{ fontFamily: "system-ui" }}>{generalStats.totalWaste.toLocaleString("en-US")}</div>
          <div className={`text-xs ${subTextColor} mt-1`}>{language === "ar" ? "عبوة" : "units"}</div>
        </div>

        {/* المرتجعات المتوقعة */}
        <div className={`relative overflow-hidden rounded-2xl p-5 shadow-xl transition-all hover:scale-[1.02] cursor-pointer`}
          style={{ background: theme === "dark" ? "linear-gradient(135deg, #1e293b, #0f172a)" : "linear-gradient(135deg, #ffffff, #f8fafc)", border: `2px solid ${theme === "dark" ? "#f59e0b30" : "#f59e0b20"}` }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20" style={{ background: "#f59e0b", transform: "translate(30%, -30%)" }} />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
            </div>
            <span className={`text-sm font-medium ${subTextColor}`}>{language === "ar" ? "المرتجعات" : "Returns"}</span>
          </div>
          <div className={`text-3xl font-bold ${textColor}`} style={{ fontFamily: "system-ui" }}>{generalStats.totalReturns.toLocaleString("en-US")}</div>
          <div className={`text-xs ${subTextColor} mt-1`}>{language === "ar" ? "وحدة" : "units"}</div>
        </div>

        {/* مخاطر التبريد */}
        <div className={`relative overflow-hidden rounded-2xl p-5 shadow-xl transition-all hover:scale-[1.02] cursor-pointer`}
          style={{ background: theme === "dark" ? "linear-gradient(135deg, #1e293b, #0f172a)" : "linear-gradient(135deg, #ffffff, #f8fafc)", border: `2px solid ${theme === "dark" ? "#3b82f630" : "#3b82f620"}` }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20" style={{ background: "#3b82f6", transform: "translate(30%, -30%)" }} />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" /></svg>
            </div>
            <span className={`text-sm font-medium ${subTextColor}`}>{language === "ar" ? "مخاطر التبريد" : "Cooling Risk"}</span>
          </div>
          <div className={`text-3xl font-bold ${textColor}`} style={{ fontFamily: "system-ui" }}>{generalStats.avgRefrigerationRisk}%</div>
          <div className={`text-xs ${subTextColor} mt-1`}>{language === "ar" ? "متوسط المخاطر" : "average risk"}</div>
        </div>

        {/* مخاطر النقل */}
        <div className={`relative overflow-hidden rounded-2xl p-5 shadow-xl transition-all hover:scale-[1.02] cursor-pointer`}
          style={{ background: theme === "dark" ? "linear-gradient(135deg, #1e293b, #0f172a)" : "linear-gradient(135deg, #ffffff, #f8fafc)", border: `2px solid ${theme === "dark" ? "#8b5cf630" : "#8b5cf620"}` }}>
          <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-20" style={{ background: "#8b5cf6", transform: "translate(30%, -30%)" }} />
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
            </div>
            <span className={`text-sm font-medium ${subTextColor}`}>{language === "ar" ? "مخاطر النقل" : "Transport Risk"}</span>
          </div>
          <div className={`text-3xl font-bold ${textColor}`} style={{ fontFamily: "system-ui" }}>{generalStats.avgVehicleRisk}%</div>
          <div className={`text-xs ${subTextColor} mt-1`}>{language === "ar" ? "متوسط المخاطر" : "average risk"}</div>
        </div>
      </div>

      {/* ====== نظرة شاملة على النظام - System Overview Dashboard ====== */}
      <div className={`rounded-2xl border-2 ${borderClass} ${cardBgClass} p-6 shadow-2xl`}>
        <h3 className={`text-2xl font-bold ${textColor} mb-8 flex items-center gap-3`}>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shadow-lg">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
          </div>
          <div>
            <span className="block">{language === "ar" ? "لوحة بيانات النظام الشاملة" : "Comprehensive System Dashboard"}</span>
            <span className={`text-sm font-normal ${subTextColor}`}>
              {language === "ar" ? "جميع البيانات المتوفرة في النظام" : "All available system data at a glance"}
            </span>
          </div>
        </h3>

        {overviewLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <>
            {/* Row 1: Main KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {/* Sales */}
              <div className="relative overflow-hidden rounded-2xl p-4 sm:p-6 transition-all hover:scale-[1.02] shadow-lg"
                style={{ background: "linear-gradient(135deg, #059669, #10b981)", border: "none" }}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20" style={{ background: "#fff", transform: "translate(30%, -30%)" }} />
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-white/90">{language === "ar" ? "المبيعات" : "Sales"}</span>
                </div>
                <div className="text-xl sm:text-2xl md:text-3xl font-black text-white drop-shadow-md truncate">{(systemOverview?.sales?.total_amount || 0).toLocaleString("en-US")}</div>
                <div className="text-xs sm:text-sm text-white/80 mt-1 sm:mt-2 font-semibold">{language === "ar" ? "ريال يمني" : "YER Total"}</div>
                <div className="text-xs sm:text-sm text-white/70 mt-1 font-medium">{systemOverview?.sales?.total_count || 0} {language === "ar" ? "عملية بيع" : "transactions"}</div>
              </div>

              {/* Production */}
              <div className="relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-[1.02] shadow-lg"
                style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)", border: "none" }}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20" style={{ background: "#fff", transform: "translate(30%, -30%)" }} />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" /></svg>
                  </div>
                  <span className="text-base font-bold text-white/90">{language === "ar" ? "الإنتاج" : "Production"}</span>
                </div>
                <div className="text-4xl font-black text-white drop-shadow-md">{systemOverview?.production?.total_orders || 0}</div>
                <div className="text-sm text-white/80 mt-2 font-semibold">{language === "ar" ? "أوامر إنتاج" : "Production Orders"}</div>
                <div className="text-sm text-white/70 mt-1 font-medium">{systemOverview?.production?.pending || 0} {language === "ar" ? "قيد الإنتظار" : "pending"}</div>
              </div>

              {/* Waste */}
              <div className="relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-[1.02] shadow-lg"
                style={{ background: "linear-gradient(135deg, #dc2626, #ef4444)", border: "none" }}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20" style={{ background: "#fff", transform: "translate(30%, -30%)" }} />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  </div>
                  <span className="text-base font-bold text-white/90">{language === "ar" ? "الهدر" : "Waste"}</span>
                </div>
                <div className="text-4xl font-black text-white drop-shadow-md">{(systemOverview?.waste?.total_quantity || 0).toFixed(0)}</div>
                <div className="text-sm text-white/80 mt-2 font-semibold">{language === "ar" ? "حبة إجمالي" : "pcs Total"}</div>
                <div className="text-sm text-white/70 mt-1 font-medium">{systemOverview?.waste?.total_events || 0} {language === "ar" ? "حادثة" : "events"}</div>
              </div>

              {/* Donations */}
              <div className="relative overflow-hidden rounded-2xl p-6 transition-all hover:scale-[1.02] shadow-lg"
                style={{ background: "linear-gradient(135deg, #db2777, #ec4899)", border: "none" }}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-20" style={{ background: "#fff", transform: "translate(30%, -30%)" }} />
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.2)" }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                  </div>
                  <span className="text-base font-bold text-white/90">{language === "ar" ? "التبرعات" : "Donations"}</span>
                </div>
                <div className="text-4xl font-black text-white drop-shadow-md">{systemOverview?.donations?.total_count || 0}</div>
                <div className="text-sm text-white/80 mt-2 font-semibold">{language === "ar" ? "تبرع" : "Donations"}</div>
                <div className="text-sm text-white/70 mt-1 font-medium">{systemOverview?.donations?.total_charities || 0} {language === "ar" ? "جمعية خيرية" : "charities"}</div>
              </div>
            </div>

            {/* Row 2: Inventory & Assets */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {[
                { label: language === "ar" ? "المنتجات" : "Products", value: systemOverview?.products?.total || 0, color: "#f59e0b", iconPath: "M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4h2V8a4 4 0 0 0-4-4H6C3.79 4 2 5.79 2 8v4c0 2.21 1.79 4 4 4h14v-4z" },
                { label: language === "ar" ? "الدفعات" : "Batches", value: systemOverview?.products?.total_batches || 0, color: "#3b82f6", iconPath: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" },
                { label: language === "ar" ? "المنشآت" : "Facilities", value: systemOverview?.facilities?.total || 0, color: "#8b5cf6", iconPath: "M3 21h18V9l-9-7-9 7v12zM9 21v-6h6v6" },
                { label: language === "ar" ? "المركبات" : "Vehicles", value: systemOverview?.equipment?.total_vehicles || 0, color: "#06b6d4", iconPath: "M1 3h15v13H1zM16 8h4l3 3v5h-7V8zM5.5 16.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM18.5 16.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z" },
                { label: language === "ar" ? "المستشعرات" : "Sensors", value: systemOverview?.equipment?.total_sensors || 0, color: "#14b8a6", iconPath: "M22 12h-4l-3 9L9 3l-3 9H2" },
                { label: language === "ar" ? "الثلاجات" : "Refrigerators", value: systemOverview?.equipment?.total_refrigeration || 0, color: "#6366f1", iconPath: "M5 2h14a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM8 6v6M8 16h.01" },
              ].map((item, idx) => (
                <div key={idx} className="p-5 rounded-xl text-center transition-all hover:scale-105 hover:shadow-xl"
                  style={{ background: theme === "dark" ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 1)", border: `2px solid ${item.color}40`, boxShadow: `0 4px 15px ${item.color}15` }}>
                  <div className="w-14 h-14 mx-auto mb-3 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${item.color}25, ${item.color}15)` }}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2.5"><path d={item.iconPath} /></svg>
                  </div>
                  <div className="text-3xl font-extrabold" style={{ color: item.color }}>{item.value.toLocaleString("en-US")}</div>
                  <div className={`text-sm mt-2 font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Row 3: Orders & Forecasts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Orders Summary */}
              <div className={`rounded-xl p-5 ${theme === "dark" ? "bg-slate-800/50" : "bg-gradient-to-br from-amber-50 to-orange-50"} border-2 border-amber-500/20`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-amber-500/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>
                  </div>
                  <span className={`font-bold ${textColor}`}>{language === "ar" ? "الطلبات" : "Orders"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-3xl font-bold text-amber-600">{systemOverview?.orders?.total || 0}</div>
                    <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "إجمالي الطلبات" : "Total Orders"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-amber-500">{systemOverview?.orders?.pending || 0}</div>
                    <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "قيد الانتظار" : "Pending"}</div>
                  </div>
                </div>
              </div>

              {/* Batches Status */}
              <div className={`rounded-xl p-5 ${theme === "dark" ? "bg-slate-800/50" : "bg-gradient-to-br from-blue-50 to-indigo-50"} border-2 border-blue-500/20`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-500/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                  </div>
                  <span className={`font-bold ${textColor}`}>{language === "ar" ? "حالة الدفعات" : "Batch Status"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-3xl font-bold text-blue-600">{systemOverview?.products?.active_batches || 0}</div>
                    <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "نشطة" : "Active"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-500">{systemOverview?.products?.expiring_batches || 0}</div>
                    <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "قاربت على الانتهاء" : "Expiring Soon"}</div>
                  </div>
                </div>
              </div>

              {/* Equipment Health */}
              <div className={`rounded-xl p-5 ${theme === "dark" ? "bg-slate-800/50" : "bg-gradient-to-br from-teal-50 to-cyan-50"} border-2 border-teal-500/20`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-teal-500/20">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2"><path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" /></svg>
                  </div>
                  <span className={`font-bold ${textColor}`}>{language === "ar" ? "صحة المعدات" : "Equipment Health"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-3xl font-bold text-teal-600">{systemOverview?.equipment?.total_refrigeration || 0}</div>
                    <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "وحدة تبريد" : "Cooling Units"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-red-500">{systemOverview?.equipment?.high_risk_equipment || 0}</div>
                    <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "عالية الخطورة" : "High Risk"}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="mt-4 p-4 rounded-xl flex items-center gap-3" style={{ background: theme === "dark" ? "rgba(99, 102, 241, 0.1)" : "linear-gradient(135deg, #eef2ff, #e0e7ff)", border: "1px solid rgba(99, 102, 241, 0.2)" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(99, 102, 241, 0.2)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>
              </div>
              <div>
                <p className={`text-sm font-medium ${textColor}`}>
                  {language === "ar"
                    ? "يمكنك تصدير جميع هذه البيانات كتقارير Excel أو PDF احترافية باستخدام أزرار التصدير في أعلى الصفحة"
                    : "You can export all this data as professional Excel or PDF reports using the export buttons at the top of the page"
                  }
                </p>
                <p className={`text-xs ${subTextColor} mt-1`}>
                  {language === "ar"
                    ? `آخر تحديث: ${systemOverview?.generated_at ? new Date(systemOverview.generated_at).toLocaleString("ar-SA") : "الآن"}`
                    : `Last updated: ${systemOverview?.generated_at ? new Date(systemOverview.generated_at).toLocaleString("en-US") : "Now"}`
                  }
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* اتجاه الهدر - Custom CSS Chart */}
      <div className={`rounded-2xl border-2 ${borderClass} ${cardBgClass} p-6 shadow-xl`}>
        <h3 className={`text-xl font-bold ${textColor} mb-6 flex items-center gap-3`}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
          </div>
          {language === "ar" ? "اتجاه الهدر الشهري" : "Monthly Waste Trend"}
        </h3>

        {/* Custom Bar Chart - Using monthlyWasteData from API */}
        <div className="space-y-4">
          {(monthlyWasteData.length > 0 ? monthlyWasteData : wasteTrendData).map((item, idx) => {
            const data = monthlyWasteData.length > 0 ? monthlyWasteData : wasteTrendData;
            const maxWaste = Math.max(...data.map(d => d.total_quantity || d.waste || 1));
            const maxIncidents = Math.max(...data.map(d => d.incident_count || d.incidents || 1));
            const wasteValue = item.total_quantity || item.waste || 0;
            const incidentValue = item.incident_count || item.incidents || 0;
            const wastePercent = (wasteValue / maxWaste) * 100;
            const incidentPercent = (incidentValue / maxIncidents) * 100;
            const monthName = item.month_name_ar ? (language === "ar" ? item.month_name_ar : item.month_name_en) : item.name || item.month;
            return (
              <div key={idx} className="group">
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-bold ${textColor}`}>{monthName}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-red-500 font-bold">{Math.round(wasteValue)} {language === "ar" ? "عبوة" : "units"}</span>
                    <span className="text-amber-500 font-bold">{incidentValue} {language === "ar" ? "حادثة" : "incidents"}</span>
                  </div>
                </div>
                <div className="relative h-8 rounded-lg overflow-hidden" style={{ backgroundColor: theme === "dark" ? "#1e293b" : "#e5e7eb" }}>
                  {/* Waste bar */}
                  <div
                    className="absolute top-0 h-4 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                    style={{
                      width: `${wastePercent}%`,
                      background: "linear-gradient(90deg, #ef4444, #f97316)",
                      boxShadow: "0 2px 10px rgba(239, 68, 68, 0.4)"
                    }}
                  />
                  {/* Incidents bar */}
                  <div
                    className="absolute bottom-0 h-4 rounded-b-lg transition-all duration-500 group-hover:brightness-110"
                    style={{
                      width: `${incidentPercent}%`,
                      background: "linear-gradient(90deg, #f59e0b, #eab308)",
                      boxShadow: "0 2px 10px rgba(245, 158, 11, 0.4)"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-8 mt-6 pt-4 border-t" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: "linear-gradient(90deg, #ef4444, #f97316)" }} />
            <span className={subTextColor}>{language === "ar" ? "الهدر (عبوة)" : "Waste (units)"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ background: "linear-gradient(90deg, #f59e0b, #eab308)" }} />
            <span className={subTextColor}>{language === "ar" ? "عدد الحوادث" : "Incidents"}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* توزيع أسباب الهدر - Custom Donut */}
        <div className={`rounded-2xl border-2 ${borderClass} ${cardBgClass} p-6 shadow-xl`}>
          <h3 className={`text-xl font-bold ${textColor} mb-6 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
            </div>
            {language === "ar" ? "توزيع أسباب الهدر" : "Waste Cause Distribution"}
          </h3>

          <div className="flex items-center gap-6">
            {/* Custom Donut Chart */}
            <div className="relative w-44 h-44 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                {(() => {
                  const total = wasteCauseDistribution.reduce((sum, d) => sum + d.value, 0);
                  let currentAngle = 0;
                  const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
                  return wasteCauseDistribution.map((item, idx) => {
                    const percent = (item.value / total) * 100;
                    const dashArray = `${percent * 2.51} ${251.2 - percent * 2.51}`;
                    const dashOffset = -currentAngle * 2.51;
                    currentAngle += percent;
                    return (
                      <circle
                        key={idx}
                        cx="50" cy="50" r="40"
                        fill="none"
                        stroke={colors[idx % colors.length]}
                        strokeWidth="18"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-500 hover:opacity-80"
                        style={{ filter: `drop-shadow(0 2px 4px ${colors[idx % colors.length]}40)` }}
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={`text-2xl font-bold ${textColor}`}>{wasteCauseDistribution.reduce((sum, d) => sum + d.value, 0)}</span>
                <span className={`text-xs ${subTextColor}`}>{language === "ar" ? "حبة" : "pcs"}</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-3">
              {wasteCauseDistribution.map((item, idx) => {
                const colors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
                const total = wasteCauseDistribution.reduce((sum, d) => sum + d.value, 0);
                const percent = ((item.value / total) * 100).toFixed(0);
                return (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                    <span className={`flex-1 text-sm ${textColor}`}>{item.name}</span>
                    <span className="text-sm font-bold" style={{ color: colors[idx % colors.length] }}>{item.value} ({percent}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* مخاطر المعدات - Custom Bars */}
        <div className={`rounded-2xl border-2 ${borderClass} ${cardBgClass} p-6 shadow-xl`}>
          <h3 className={`text-xl font-bold ${textColor} mb-6 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></svg>
            </div>
            {language === "ar" ? "توزيع مخاطر المعدات" : "Equipment Risk Distribution"}
          </h3>

          <div className="flex items-end justify-around h-48 gap-4">
            {equipmentRiskData.map((item, idx) => {
              const maxVal = Math.max(...equipmentRiskData.map(d => d.value));
              const height = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
              return (
                <div key={idx} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</span>
                  <div
                    className="w-full rounded-t-xl transition-all duration-500 hover:brightness-110 relative overflow-hidden"
                    style={{
                      height: `${Math.max(height, 10)}%`,
                      backgroundColor: item.color,
                      boxShadow: `0 4px 20px ${item.color}50`,
                      minHeight: "40px"
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <span className={`text-sm font-semibold ${textColor}`}>{item.name}</span>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-4 border-t grid grid-cols-3 gap-4" style={{ borderColor: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{equipmentRiskData[0]?.value || 0}</div>
              <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "خطر عالي" : "High Risk"}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-500">{equipmentRiskData[1]?.value || 0}</div>
              <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "متوسط" : "Medium"}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">{equipmentRiskData[2]?.value || 0}</div>
              <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "منخفض" : "Low"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* تم إخفاء قسم احتمالية المرتجع للمنتجات */}

      {/* جداول تفصيلية - تصميم محسن */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* جدول تفاصيل الهدر */}
        <div className={`rounded-2xl border-2 ${borderClass} ${cardBgClass} shadow-xl overflow-hidden`}>
          <div className="px-6 py-4" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              {language === "ar" ? "تفاصيل حوادث الهدر" : "Waste Incidents Details"}
            </h3>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme === "dark" ? "bg-slate-800/50" : "bg-slate-100"}`}>
                  <th className={`px-3 py-3 ${textColor} font-bold text-xs ${language === "ar" ? "text-right" : "text-left"}`}>{language === "ar" ? "التاريخ" : "Date"}</th>
                  <th className={`px-3 py-3 ${textColor} font-bold text-xs ${language === "ar" ? "text-right" : "text-left"}`}>{language === "ar" ? "المنتج" : "Product"}</th>
                  <th className={`px-3 py-3 ${textColor} font-bold text-xs ${language === "ar" ? "text-right" : "text-left"}`}>{language === "ar" ? "السبب" : "Cause"}</th>
                  <th className={`px-3 py-3 ${textColor} font-bold text-xs text-center`}>{language === "ar" ? "الكمية" : "Amount"}</th>
                  <th className={`px-3 py-3 ${textColor} font-bold text-xs text-center`}>{language === "ar" ? "الثقة" : "Conf."}</th>
                </tr>
              </thead>
              <tbody>
                {detailedWasteData.slice(0, 5).map((item, index) => (
                  <tr key={index} className={`border-b ${borderClass} hover:${theme === "dark" ? "bg-slate-800/30" : "bg-slate-50"} transition-colors`}>
                    <td className={`px-3 py-3 ${subTextColor} text-xs`}>{item.date}</td>
                    <td className={`px-3 py-3 ${textColor} text-xs font-medium`}>{item.product}</td>
                    <td className={`px-3 py-3`}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.cause.includes("صلاحية") || item.cause === "Expiry" ? "bg-red-500/20 text-red-500" :
                        item.cause.includes("تخزين") || item.cause === "Storage" ? "bg-amber-500/20 text-amber-500" :
                          "bg-blue-500/20 text-blue-500"
                        }`}>{item.cause}</span>
                    </td>
                    <td className={`px-3 py-3 text-center font-bold ${textColor}`} style={{ fontFamily: "system-ui" }}>{item.amount.toLocaleString("en-US")}</td>
                    <td className={`px-3 py-3 text-center`}>
                      <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full text-xs font-bold ${item.confidence >= 80 ? "bg-emerald-500/20 text-emerald-500" :
                        item.confidence >= 60 ? "bg-amber-500/20 text-amber-500" :
                          "bg-red-500/20 text-red-500"
                        }`} style={{ fontFamily: "system-ui" }}>{item.confidence}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* جدول تفاصيل المرتجعات */}
        <div className={`rounded-2xl border-2 ${borderClass} ${cardBgClass} shadow-xl overflow-hidden`}>
          <div className="px-6 py-4" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
            <h3 className="text-lg font-bold text-white flex items-center gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
              {language === "ar" ? "تفاصيل المرتجعات " : " Returns Details"}
            </h3>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme === "dark" ? "bg-slate-800/50" : "bg-slate-100"}`}>
                  <th className={`px-3 py-3 ${textColor} font-bold text-xs ${language === "ar" ? "text-right" : "text-left"}`}>{language === "ar" ? "المنتج" : "Product"}</th>
                  <th className={`px-3 py-3 ${textColor} font-bold text-xs ${language === "ar" ? "text-right" : "text-left"}`}>{language === "ar" ? "السبب" : "Reason"}</th>
                  <th className={`px-3 py-3 ${textColor} font-bold text-xs text-center`}>{language === "ar" ? "الكمية" : "Qty"}</th>
                </tr>
              </thead>
              <tbody>
                {detailedReturnsData.map((item, index) => (
                  <tr key={index} className={`border-b ${borderClass} hover:${theme === "dark" ? "bg-slate-800/30" : "bg-slate-50"} transition-colors`}>
                    <td className={`px-3 py-3 ${textColor} text-xs font-medium`}>{item.product}</td>
                    <td className={`px-3 py-3`}>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.reason.includes("جودة") || item.reason === "Quality" ? "bg-purple-500/20 text-purple-500" :
                        item.reason.includes("صلاحية") || item.reason === "Expiry" ? "bg-red-500/20 text-red-500" :
                          "bg-blue-500/20 text-blue-500"
                        }`}>{item.reason}</span>
                    </td>
                    
                    <td className={`px-3 py-3 text-center font-bold ${textColor}`} style={{ fontFamily: "system-ui" }}>{item.quantity.toLocaleString("en-US")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ملخص التوصيات + AI Generation Button */}
      <div className={`rounded-xl border ${borderClass} p-6 ${cardBgClass} backdrop-blur-xl`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-semibold ${textColor}`}>
            {language === "ar" ? "التوصيات والإجراءات الموصى بها" : "Recommendations and Suggested Actions"}
          </h3>
          <button
            onClick={handleGenerateAI}
            disabled={aiLoading || !reportData}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${aiLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl"
              }`}
          >
            {aiLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {language === "ar" ? "جاري التحليل..." : "Analyzing..."}
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                {language === "ar" ? "توليد توصيات AI" : "Generate AI Recommendations"}
              </>
            )}
          </button>
        </div>

        {/* AI Generated Content */}
        {aiSummary && !aiSummary.error && (
          <div className={`mb-4 p-4 rounded-lg ${theme === "dark" ? "bg-purple-500/20 border border-purple-500/30" : "bg-purple-50 border border-purple-200"}`}>
            <div className="flex items-center gap-2 mb-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-500">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className={`font-bold ${textColor}`}>{language === "ar" ? "تحليل الذكاء الاصطناعي" : "AI Analysis"}</span>
              {aiSummary.ai_confidence && (
                <span className={`text-xs px-2 py-1 rounded-full ${aiSummary.ai_confidence === "high" ? "bg-emerald-500/20 text-emerald-500" :
                  aiSummary.ai_confidence === "medium" ? "bg-amber-500/20 text-amber-500" :
                    "bg-red-500/20 text-red-500"
                  }`}>
                  {aiSummary.ai_confidence}
                </span>
              )}
            </div>
            {aiSummary.summary && (
              <p className={`text-sm ${subTextColor} mb-3`}>{aiSummary.summary}</p>
            )}
            {aiSummary.key_findings && aiSummary.key_findings.length > 0 && (
              <div className="mb-3">
                <h5 className={`text-sm font-semibold ${textColor} mb-1`}>{language === "ar" ? "النتائج الرئيسية:" : "Key Findings:"}</h5>
                <ul className={`list-disc list-inside text-sm ${subTextColor} space-y-1`}>
                  {aiSummary.key_findings.map((finding, i) => (
                    <li key={i}>{typeof finding === 'string' ? finding : (finding.text || finding.description || JSON.stringify(finding))}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiSummary.recommendations && aiSummary.recommendations.length > 0 && (
              <div>
                <h5 className={`text-sm font-semibold ${textColor} mb-1`}>{language === "ar" ? "التوصيات:" : "Recommendations:"}</h5>
                <ul className={`list-disc list-inside text-sm ${subTextColor} space-y-1`}>
                  {aiSummary.recommendations.map((rec, i) => (
                    <li key={i}>
                      {typeof rec === 'string' ? rec : (rec.action || rec.text || JSON.stringify(rec))}
                      {typeof rec === 'object' && rec.type && (
                        <span className={`text-xs ml-2 px-2 py-0.5 rounded ${rec.type === 'short_term' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-500/20 text-blue-500'
                          }`}>
                          {rec.type === 'short_term' ? (language === "ar" ? "قصير المدى" : "Short Term") : (language === "ar" ? "متوسط المدى" : "Medium Term")}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {aiSummary?.error && (
          <div className={`mb-4 p-4 rounded-lg bg-red-500/20 border border-red-500/30`}>
            <p className="text-red-500 text-sm">{aiSummary.message}</p>
          </div>
        )}

        {/* Default Static Recommendations */}
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-red-500/20 border border-red-500/30" : "bg-red-50 border border-red-200"}`}>
            <h4 className={`font-semibold mb-2 ${textColor}`}>
              {language === "ar" ? "أولوية عالية" : "High Priority"}
            </h4>
            <ul className={`list-disc list-inside space-y-1 ${subTextColor} text-sm`}>
              <li>{language === "ar" ? "تحسين ظروف التخزين في المخازن عالية المخاطر" : "Improve storage conditions in high-risk warehouses"}</li>
              <li>{language === "ar" ? "صيانة فورية للثلاجات ذات مخاطر الفشل العالية" : "Immediate maintenance for refrigerators with high failure risk"}</li>
              <li>{language === "ar" ? "مراقبة المنتجات ذات احتمالية المرتجع العالية" : "Monitor products with high return probability"}</li>
            </ul>
          </div>
          <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-yellow-500/20 border border-yellow-500/30" : "bg-yellow-50 border border-yellow-200"}`}>
            <h4 className={`font-semibold mb-2 ${textColor}`}>
              {language === "ar" ? "أولوية متوسطة" : "Medium Priority"}
            </h4>
            <ul className={`list-disc list-inside space-y-1 ${subTextColor} text-sm`}>
              <li>{language === "ar" ? "تحسين عمليات النقل لتقليل التلف" : "Improve transport operations to reduce damage"}</li>
              <li>{language === "ar" ? "مراجعة كميات الإنتاج لتجنب الإفراط" : "Review production quantities to avoid overproduction"}</li>
              <li>{language === "ar" ? "تحسين إدارة المخزون لمنع انتهاء الصلاحية" : "Improve inventory management to prevent expiry"}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* نافذة اختيار أقسام التقرير */}
      <ReportOptionsModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onGenerate={handleGeneratePDF}
        selectedPeriod={selectedPeriod}
      />
    </div>
  );
}

export default Reports;

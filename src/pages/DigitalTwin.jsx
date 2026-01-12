import { useEffect, useMemo, useState } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useDashboardSection } from "../hooks/useDashboardData.js";
import InteractiveMap from "../components/digitaltwin/InteractiveMap.jsx";
import LocationsList from "../components/digitaltwin/LocationsList.jsx";
import SupplyChainFlow from "../components/digitaltwin/SupplyChainFlow.jsx";
import PerformanceBenchmark from "../components/digitaltwin/PerformanceBenchmark.jsx";
import WhatIfSimulator from "../components/digitaltwin/WhatIfSimulator.jsx";
import DataCard from "../components/shared/DataCard.jsx";

function DigitalTwin() {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  // Poll every 10 seconds for real-time updates
  const { data, loading, error, reload } = useDashboardSection("digital-twin", {
    pollInterval: 10000 // 10 seconds
  });
  const digitalTwinLocations = data?.digitalTwinLocations || [];
  const trackedBatches = data?.trackedBatches || [];
  const earlyWarnings = data?.earlyWarnings || [];
  const flowData = data?.flowData;
  const benchmarkData = data?.benchmarkData;

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeTab, setActiveTab] = useState("flow");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [hoveredLocation, setHoveredLocation] = useState(null);

  useEffect(() => {
    if (!loading && digitalTwinLocations.length > 0 && !selectedLocation) {
      setSelectedLocation(digitalTwinLocations[0]);
    }
  }, [loading, digitalTwinLocations, selectedLocation]);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";

  // إحصائيات سريعة
  const stats = useMemo(() => {
    const totalLocations = digitalTwinLocations.length;
    const totalBatches = trackedBatches.length;
    const highRiskBatches = trackedBatches.filter((b) => b.riskLevel === "high").length;
    const totalWarnings = earlyWarnings.length;
    const efficiency = 92.5; // Example metric

    return {
      totalLocations,
      totalBatches,
      highRiskBatches,
      totalWarnings,
      efficiency,
    };
  }, [digitalTwinLocations, trackedBatches, earlyWarnings]);

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
  };

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsTransitioning(false);
    }, 200);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className="text-lg font-semibold text-[#053F5C] dark:text-white">
          {language === "ar" ? "جاري تحميل بيانات التوأم الرقمي..." : "Loading digital twin data..."}
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
          onClick={reload}
          className="px-6 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          {language === "ar" ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* العنوان */}
      <div className="mb-8 animate-slide-in">
        <h2 className={`text-4xl font-black ${textColor} mb-3 leading-tight tracking-tight`}>
          {language === "ar" ? "مركز تحليل سلسلة التوريد" : "Supply Chain Analytics Center"}
        </h2>
        <p className={`text-xl ${subTextColor} leading-relaxed font-semibold`}>
          {language === "ar"
            ? "نظام التوأم الرقمي للتحليل والمحاكاة المتقدمة"
            : "Digital Twin System for Advanced Analysis & Simulation"}
        </p>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="transform transition-all duration-300 hover:scale-105">
          <DataCard
            title={language === "ar" ? "إجمالي المواقع" : "Total Locations"}
            value={stats.totalLocations}
            subtitle={language === "ar" ? "موقع نشط" : "active locations"}
          />
        </div>
        <div className="transform transition-all duration-300 hover:scale-105">
          <DataCard
            title={language === "ar" ? "إجمالي التدفقات" : "Total Flows"}
            value={stats.totalBatches}
            subtitle={language === "ar" ? "شحنة نشطة" : "active shipments"}
          />
        </div>
        <div className="transform transition-all duration-300 hover:scale-105">
          <DataCard
            title={language === "ar" ? "مواقع عالية الخطورة" : "High Risk Sites"}
            value={stats.highRiskBatches > 0 ? 2 : 0}
            subtitle={language === "ar" ? "تحتاج انتباه" : "need attention"}
            trend="down"
          />
        </div>
        <div className="transform transition-all duration-300 hover:scale-105">
          <DataCard
            title={language === "ar" ? "سيناريوهات نشطة" : "Active Scenarios"}
            value={3} // Static for now as simulation is client-side
            subtitle={language === "ar" ? "محاكاة" : "simulations"}
          />
        </div>
        <div className="transform transition-all duration-300 hover:scale-105">
          <DataCard
            title={language === "ar" ? "الكفاءة العامة" : "Overall Efficiency"}
            value={`${stats.efficiency}%`}
            subtitle={language === "ar" ? "مؤشر الأداء" : "KPI score"}
          />
        </div>
      </div>

      {/* التبويبات */}
      <div className="flex gap-2 border-b-2" style={{ borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(66, 158, 189, 0.2)" }}>
        <button
          onClick={() => handleTabChange("flow")}
          className={`px-8 py-4 font-black text-lg transition-all duration-300 relative ${activeTab === "flow"
            ? theme === "dark"
              ? "text-white"
              : "text-[#053F5C]"
            : theme === "dark"
              ? "text-slate-400 hover:text-white"
              : "text-[#429EBD] hover:text-[#053F5C]"
            }`}
        >
          {language === "ar" ? "تدفق العمليات" : "Process Flow"}
          {activeTab === "flow" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full transition-all duration-300"
              style={{
                backgroundColor: theme === "dark" ? "#ffffff" : "#429EBD",
                boxShadow: theme === "dark"
                  ? "0 -2px 8px rgba(255, 255, 255, 0.5)"
                  : "0 -2px 8px rgba(66, 158, 189, 0.5)",
              }}
            />
          )}
        </button>
        <button
          onClick={() => handleTabChange("map")}
          className={`px-8 py-4 font-black text-lg transition-all duration-300 relative ${activeTab === "map"
            ? theme === "dark"
              ? "text-white"
              : "text-[#053F5C]"
            : theme === "dark"
              ? "text-slate-400 hover:text-white"
              : "text-[#429EBD] hover:text-[#053F5C]"
            }`}
        >
          {language === "ar" ? "الخريطة الجغرافية" : "Geographic Map"}
          {activeTab === "map" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full transition-all duration-300"
              style={{
                backgroundColor: theme === "dark" ? "#ffffff" : "#429EBD",
                boxShadow: theme === "dark"
                  ? "0 -2px 8px rgba(255, 255, 255, 0.5)"
                  : "0 -2px 8px rgba(66, 158, 189, 0.5)",
              }}
            />
          )}
        </button>
        <button
          onClick={() => handleTabChange("benchmark")}
          className={`px-8 py-4 font-black text-lg transition-all duration-300 relative ${activeTab === "benchmark"
            ? theme === "dark"
              ? "text-white"
              : "text-[#053F5C]"
            : theme === "dark"
              ? "text-slate-400 hover:text-white"
              : "text-[#429EBD] hover:text-[#053F5C]"
            }`}
        >
          {language === "ar" ? "مقارنة الأداء" : "Performance Benchmark"}
          {activeTab === "benchmark" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full transition-all duration-300"
              style={{
                backgroundColor: theme === "dark" ? "#ffffff" : "#429EBD",
                boxShadow: theme === "dark"
                  ? "0 -2px 8px rgba(255, 255, 255, 0.5)"
                  : "0 -2px 8px rgba(66, 158, 189, 0.5)",
              }}
            />
          )}
        </button>
        <button
          onClick={() => handleTabChange("simulation")}
          className={`px-8 py-4 font-black text-lg transition-all duration-300 relative ${activeTab === "simulation"
            ? theme === "dark"
              ? "text-white"
              : "text-[#053F5C]"
            : theme === "dark"
              ? "text-slate-400 hover:text-white"
              : "text-[#429EBD] hover:text-[#053F5C]"
            }`}
        >
          {language === "ar" ? "محاكاة السيناريوهات" : "Scenario Simulation"}
          {activeTab === "simulation" && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full transition-all duration-300"
              style={{
                backgroundColor: theme === "dark" ? "#ffffff" : "#429EBD",
                boxShadow: theme === "dark"
                  ? "0 -2px 8px rgba(255, 255, 255, 0.5)"
                  : "0 -2px 8px rgba(66, 158, 189, 0.5)",
              }}
            />
          )}
        </button>
      </div>

      {/* محتوى التبويبات مع مؤثرات الانتقال */}
      <div className="mt-6 relative min-h-[500px]">
        <div
          className={`transition-all duration-300 ${isTransitioning ? "opacity-0 scale-95" : "opacity-100 scale-100"
            }`}
        >
          {activeTab === "flow" && (
            <div className="animate-fade-in full-width-flow">
              <div className={`col-span-1 lg:col-span-3 animate-slide-in`} style={{ animationDelay: "0.2s" }}>
                <SupplyChainFlow data={flowData} />
              </div>
            </div>
          )}

          {activeTab === "map" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* الخريطة */}
                <div className="lg:col-span-2">
                  <InteractiveMap
                    locations={digitalTwinLocations}
                    onLocationClick={handleLocationClick}
                    selectedLocationId={selectedLocation?.id}
                  />
                </div>
                {/* قائمة المواقع */}
                <div className="lg:col-span-1">
                  <LocationsList
                    locations={digitalTwinLocations}
                    selectedLocationId={selectedLocation?.id}
                    onLocationClick={handleLocationClick}
                    onHoverLocation={setHoveredLocation}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "benchmark" && (
            <div className="animate-fade-in">
              <PerformanceBenchmark data={benchmarkData} />
            </div>
          )}

          {activeTab === "simulation" && (
            <div className="animate-fade-in">
              <WhatIfSimulator baseWasteRate={
                benchmarkData && benchmarkData.length > 0
                  ? benchmarkData.reduce((acc, curr) => acc + curr.waste, 0) / benchmarkData.length
                  : 2.5
              } />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DigitalTwin;

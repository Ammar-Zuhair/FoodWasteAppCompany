import { useState, useMemo, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { getFacilitiesHeatmap } from "../utils/api/heatmaps.js";
import { getStoredUser } from "../utils/api/auth.js";

function HeatMaps() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [selectedType, setSelectedType] = useState("all");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const user = getStoredUser();
  const organizationId = user?.organization_id;

  useEffect(() => {
    loadHeatmapData();
    // Refresh every 30 seconds
    const interval = setInterval(loadHeatmapData, 30000);
    return () => clearInterval(interval);
  }, [organizationId]);

  const loadHeatmapData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getFacilitiesHeatmap({
        organizationId: organizationId,
        windowHours: 1,
      });

      if (response && response.facilities) {
        // Group facilities by governorate/branch
        const groupedData = {};
        response.facilities.forEach(facility => {
          const branch = facility.governorate_name || facility.branch || facility.governorate || "Unknown";
          if (!groupedData[branch]) {
            groupedData[branch] = [];
          }

          groupedData[branch].push({
            id: facility.facility_id,
            name: facility.facility_name || facility.name,
            name_ar: facility.name_ar,
            name_en: facility.name_en,
            type: facility.type || facility.facility_type || "warehouse",
            temp: facility.avg_temperature || facility.temperature || facility.temp || 0,
            humidity: facility.avg_humidity || facility.humidity || 75,
            status: facility.status || "normal",
          });
        });

        // Convert to array format
        const dataArray = Object.keys(groupedData).map(branch => ({
          branch: branch,
          facilities: groupedData[branch],
        }));

        setHeatmapData(dataArray);
      } else if (response && Array.isArray(response)) {
        // Handle direct array response
        const groupedData = {};
        response.forEach(facility => {
          const branch = facility.governorate_name || facility.branch || facility.governorate || "Unknown";
          if (!groupedData[branch]) {
            groupedData[branch] = [];
          }

          groupedData[branch].push({
            id: facility.facility_id,
            name: facility.facility_name || facility.name,
            name_ar: facility.name_ar,
            name_en: facility.name_en,
            type: facility.type || facility.facility_type || "warehouse",
            temp: facility.avg_temperature || facility.temperature || facility.temp || 0,
            humidity: facility.avg_humidity || facility.humidity || 75,
            status: facility.status || "normal",
          });
        });

        const dataArray = Object.keys(groupedData).map(branch => ({
          branch: branch,
          facilities: groupedData[branch],
        }));

        setHeatmapData(dataArray);
      } else {
        setHeatmapData([]);
      }
    } catch (err) {
      console.error("Error loading heatmap data:", err);
      setError(err.message || "Error loading heatmap data");
      setHeatmapData([]);
    } finally {
      setLoading(false);
    }
  };

  const textColor = theme === "dark" ? "#ffffff" : "#053F5C";
  const subTextColor = theme === "dark" ? "#94a3b8" : "#429EBD";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  // Use real data from API - no dummy data
  const yemenData = useMemo(() => heatmapData, [heatmapData]);

  // Filter facilities
  const filteredData = useMemo(() => {
    let data = yemenData;
    if (selectedBranch !== "all") {
      data = data.filter(b => b.branch === selectedBranch);
    }
    if (selectedType !== "all") {
      data = data.map(b => ({
        ...b,
        facilities: b.facilities.filter(f => f.type === selectedType)
      })).filter(b => b.facilities.length > 0);
    }
    return data;
  }, [yemenData, selectedBranch, selectedType]);

  // Stats
  const stats = useMemo(() => {
    const allFacilities = yemenData.flatMap(b => b.facilities);
    return {
      total: allFacilities.length,
      normal: allFacilities.filter(f => f.status === "normal").length,
      warning: allFacilities.filter(f => f.status === "warning").length,
      critical: allFacilities.filter(f => f.status === "critical").length,
      avgTemp: (allFacilities.reduce((sum, f) => sum + f.temp, 0) / allFacilities.length).toFixed(1),
      avgHumidity: Math.round(allFacilities.reduce((sum, f) => sum + f.humidity, 0) / allFacilities.length),
    };
  }, [yemenData]);

  const getStatusColor = (status) => {
    if (status === "critical") return "#ef4444";
    if (status === "warning") return "#f59e0b";
    return "#10b981";
  };

  const getHeatLevelColor = (temp, status) => {
    // Priority to status for visual consistency
    if (status === "critical") return "#ef4444";
    if (status === "warning") return "#f59e0b";

    // Normal range visuals
    if (temp <= -10) return "#3b82f6"; // Blue - frozen
    if (temp <= 5) return "#10b981"; // Green - cold
    if (temp <= 10) return "#f59e0b"; // Amber - cool (but if status normal, maybe green?)
    // If status is normal, we should generally show green unless specific visualization desired
    return "#10b981";
  };

  const facilityTypes = [
    { value: "all", label: language === "ar" ? "الكل" : "All" },
    { value: "factory", label: language === "ar" ? "المصانع" : "Factories" },
    { value: "store", label: language === "ar" ? "المخازن" : "Stores" },
    { value: "pos", label: language === "ar" ? "نقاط البيع" : "Points of Sale" },
    { value: "truck", label: language === "ar" ? "الشاحنات" : "Trucks" },
    { value: "customer", label: language === "ar" ? "العملاء" : "Customers" },
  ];

  const branches = [
    { value: "all", label: language === "ar" ? "جميع المواقع" : "All Locations" },
    ...yemenData.map(b => ({ value: b.branch, label: b.branch === "In Transit" && language === "ar" ? "في الطريق (شحنات)" : b.branch }))
  ];

  return (
    <div className="space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-4xl font-bold mb-2" style={{ color: textColor }}>
          {language === "ar" ? "خرائط الحرارة" : "Heat Maps"}
        </h2>
        <p className="text-sm md:text-lg" style={{ color: subTextColor }}>
          {language === "ar" ? "مراقبة درجات الحرارة والرطوبة في جميع المنشآت اليمنية" : "Monitor temperature and humidity across all Yemen facilities"}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} text-center`}>
          <div className="text-2xl font-bold" style={{ color: textColor }}>{stats.total}</div>
          <div className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "منشأة" : "Facilities"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 border-emerald-500/30 ${theme === "dark" ? "bg-emerald-500/10" : "bg-emerald-50"} text-center`}>
          <div className="text-2xl font-bold text-emerald-500">{stats.normal}</div>
          <div className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "طبيعي" : "Normal"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 border-amber-500/30 ${theme === "dark" ? "bg-amber-500/10" : "bg-amber-50"} text-center`}>
          <div className="text-2xl font-bold text-amber-500">{stats.warning}</div>
          <div className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "تحذير" : "Warning"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 border-red-500/30 ${theme === "dark" ? "bg-red-500/10" : "bg-red-50"} text-center`}>
          <div className="text-2xl font-bold text-red-500">{stats.critical}</div>
          <div className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "حرج" : "Critical"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} text-center`}>
          <div className="text-2xl font-bold text-blue-500">{stats.avgTemp}°</div>
          <div className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "متوسط الحرارة" : "Avg Temp"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} text-center`}>
          <div className="text-2xl font-bold text-cyan-500">{stats.avgHumidity}%</div>
          <div className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "متوسط الرطوبة" : "Avg Humidity"}</div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} flex flex-wrap items-center gap-4`}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: subTextColor }}>{language === "ar" ? "الفرع:" : "Branch:"}</span>
          <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${borderClass} ${cardBgClass} focus:ring-2 focus:ring-[#429EBD]`} style={{ color: textColor }}>
            {branches.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold" style={{ color: subTextColor }}>{language === "ar" ? "النوع:" : "Type:"}</span>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${borderClass} ${cardBgClass} focus:ring-2 focus:ring-[#429EBD]`} style={{ color: textColor }}>
            {facilityTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* Heat Map Grid */}
      <div className="space-y-6">
        {filteredData.map((branchData, branchIdx) => (
          <div key={branchIdx} className={`rounded-xl border-2 ${borderClass} ${cardBgClass} overflow-hidden`}>
            {/* Branch Header */}
            <div className={`px-6 py-4 border-b ${borderClass} ${theme === "dark" ? "bg-slate-800/50" : "bg-[#E0F7FA]"}`}>
              <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: textColor }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                {branchData.branch}
                <span className="text-sm font-normal" style={{ color: subTextColor }}>({branchData.facilities.length} {language === "ar" ? "منشأة" : "facilities"})</span>
              </h3>
            </div>

            {/* Facilities Grid */}
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {branchData.facilities.map((facility, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-2 transition-all hover:scale-[1.02] cursor-pointer relative overflow-hidden`}
                  style={{
                    borderColor: getHeatLevelColor(facility.temp, facility.status),
                    backgroundColor: theme === "dark" ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.8)"
                  }}
                >
                  {/* Status indicator */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: getStatusColor(facility.status) }}
                  />

                  {/* Facility name */}
                  <div className="font-bold mb-3 text-sm" style={{ color: textColor }}>{(language === 'ar' ? facility.name_ar : facility.name_en) || facility.name}</div>

                  {/* Temperature & Humidity */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: getHeatLevelColor(facility.temp, facility.status) }}
                      >
                        {facility.temp}°
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-cyan-500">{facility.humidity}%</div>
                      <div className="text-xs" style={{ color: subTextColor }}>{language === "ar" ? "رطوبة" : "humidity"}</div>
                    </div>
                  </div>

                  {/* Mini heat bar */}
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: theme === "dark" ? "#374151" : "#e5e7eb" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, (facility.temp + 25) * 2))}%`,
                        backgroundColor: getHeatLevelColor(facility.temp, facility.status)
                      }}
                    />
                  </div>

                  {/* Status badge */}
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className="text-xs px-2 py-1 rounded-full font-semibold"
                      style={{
                        backgroundColor: `${getStatusColor(facility.status)}20`,
                        color: getStatusColor(facility.status)
                      }}
                    >
                      {facility.status === "normal" ? (language === "ar" ? "طبيعي" : "Normal") :
                        facility.status === "warning" ? (language === "ar" ? "تحذير" : "Warning") :
                          (language === "ar" ? "حرج" : "Critical")}
                    </span>
                    <span className="text-xs" style={{ color: subTextColor }}>
                      {facility.type === "truck" ? (language === "ar" ? "شاحنة" : "Truck") :
                        facility.type === "factory" ? (language === "ar" ? "مصنع" : "Factory") :
                          facility.type === "customer" ? (language === "ar" ? "عميل" : "Customer") :
                            facility.type === "pos" ? (language === "ar" ? "نقطة بيع" : "POS") :
                              (language === "ar" ? "مخزن" : "Store")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Temperature Legend */}
      <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass}`}>
        <h4 className="font-bold mb-3" style={{ color: textColor }}>{language === "ar" ? "مفتاح الألوان" : "Color Legend"}</h4>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#3b82f6" }} />
            <span className="text-sm" style={{ color: subTextColor }}>{language === "ar" ? "مجمد (أقل من -10°م)" : "Frozen (< -10°C)"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#10b981" }} />
            <span className="text-sm" style={{ color: subTextColor }}>{language === "ar" ? "بارد (0 - 5°م)" : "Cold (0-5°C)"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#f59e0b" }} />
            <span className="text-sm" style={{ color: subTextColor }}>{language === "ar" ? "معتدل (5 - 10°م)" : "Cool (5-10°C)"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#ef4444" }} />
            <span className="text-sm" style={{ color: subTextColor }}>{language === "ar" ? "دافئ (أكثر من 10°م)" : "Warm (> 10°C)"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeatMaps;

import { useEffect, useState, useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { getFacilitiesHeatmap } from "../../utils/api/heatmaps.js";

function FacilityHeatMap({ facilityType = null, height = "500px" }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFacility, setSelectedFacility] = useState(null);

  useEffect(() => {
    loadHeatmapData();
    // Refresh every 30 seconds
    const interval = setInterval(loadHeatmapData, 30000);
    return () => clearInterval(interval);
  }, [facilityType]);

  const loadHeatmapData = async () => {
    try {
      setLoading(true);
      const result = await getFacilitiesHeatmap({
        facilityType,
        windowHours: 1,
      });
      
      if (result.status === "success") {
        setData(result.facilities || []);
        setError(null);
      } else {
        setError(result.error || "Failed to load heat map data");
      }
    } catch (err) {
      setError(err.message || "Error loading heat map data");
    } finally {
      setLoading(false);
    }
  };

  const getHeatColor = (heatLevel) => {
    const colors = {
      critical_cold: theme === "dark" ? "#1e40af" : "#3b82f6", // Blue
      cold: theme === "dark" ? "#3b82f6" : "#60a5fa", // Light Blue
      normal: theme === "dark" ? "#10b981" : "#34d399", // Green
      warm: theme === "dark" ? "#f59e0b" : "#fbbf24", // Yellow/Orange
      critical_hot: theme === "dark" ? "#dc2626" : "#ef4444", // Red
      unknown: theme === "dark" ? "#6b7280" : "#9ca3af", // Gray
    };
    return colors[heatLevel] || colors.unknown;
  };

  const getHeatIntensity = (heatLevel) => {
    const intensities = {
      critical_cold: 0.3,
      cold: 0.5,
      normal: 0.7,
      warm: 0.8,
      critical_hot: 1.0,
      unknown: 0.2,
    };
    return intensities[heatLevel] || 0.5;
  };

  // Group facilities by location for grid display
  const gridData = useMemo(() => {
    if (!data.length) return [];
    
    // Create a grid layout (simplified - in real app, use actual coordinates)
    const gridSize = Math.ceil(Math.sqrt(data.length));
    const grid = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = Math.floor(i / gridSize);
      const col = i % gridSize;
      grid.push({
        ...data[i],
        gridRow: row,
        gridCol: col,
      });
    }
    
    return grid;
  }, [data]);

  const bgClass = theme === "dark"
    ? "bg-slate-900/80 backdrop-blur-xl border-white/10"
    : "bg-gradient-to-br from-[#F0FAFC]/95 to-[#E6F7FB]/90 backdrop-blur-xl border-[#9FE7F5]/40";
  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";

  if (loading) {
    return (
      <div className={`${bgClass} rounded-xl border p-8 flex items-center justify-center`} style={{ height }}>
        <p className={`${textColor} font-semibold`}>
          {language === "ar" ? "جاري تحميل خريطة الحرارة..." : "Loading heat map..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${bgClass} rounded-xl border p-8 flex flex-col items-center justify-center space-y-4`} style={{ height }}>
        <p className={`${textColor} font-semibold text-red-500`}>{error}</p>
        <button
          onClick={loadHeatmapData}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          {language === "ar" ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className={`${bgClass} rounded-xl border p-8 flex items-center justify-center`} style={{ height }}>
        <p className={`${textColor} font-semibold`}>
          {language === "ar" ? "لا توجد بيانات متاحة" : "No data available"}
        </p>
      </div>
    );
  }

  return (
    <div className={`${bgClass} rounded-xl border p-6`} dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className={`text-xl font-semibold ${textColor}`}>
          {language === "ar" ? "خريطة الحرارة" : "Heat Map"}
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatColor("critical_cold") }} />
            <span className={subTextColor}>{language === "ar" ? "بارد جداً" : "Very Cold"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatColor("cold") }} />
            <span className={subTextColor}>{language === "ar" ? "بارد" : "Cold"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatColor("normal") }} />
            <span className={subTextColor}>{language === "ar" ? "طبيعي" : "Normal"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatColor("warm") }} />
            <span className={subTextColor}>{language === "ar" ? "دافئ" : "Warm"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatColor("critical_hot") }} />
            <span className={subTextColor}>{language === "ar" ? "حار جداً" : "Very Hot"}</span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(150px, 1fr))`,
          minHeight: height,
        }}
      >
        {gridData.map((facility) => {
          const heatColor = getHeatColor(facility.heat_level);
          const intensity = getHeatIntensity(facility.heat_level);
          
          return (
            <div
              key={facility.facility_id}
              className={`relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                selectedFacility === facility.facility_id ? "ring-2 ring-emerald-500" : ""
              }`}
              style={{
                backgroundColor: heatColor,
                opacity: intensity,
                borderColor: heatColor,
              }}
              onClick={() => setSelectedFacility(
                selectedFacility === facility.facility_id ? null : facility.facility_id
              )}
            >
              <div className="text-white font-semibold text-sm mb-1">
                {facility.facility_name}
              </div>
              {facility.avg_temperature !== undefined && (
                <div className="text-white/90 text-xs">
                  {facility.avg_temperature.toFixed(1)}°C
                </div>
              )}
              {facility.avg_humidity !== undefined && (
                <div className="text-white/80 text-xs">
                  {facility.avg_humidity.toFixed(0)}% RH
                </div>
              )}
              
              {/* Tooltip on hover */}
              {selectedFacility === facility.facility_id && (
                <div className="absolute top-full left-0 mt-2 z-10 bg-slate-900 text-white p-3 rounded-lg shadow-xl min-w-[200px]">
                  <div className="font-semibold mb-2">{facility.facility_name}</div>
                  <div className="text-xs space-y-1">
                    <div>Type: {facility.facility_type}</div>
                    {facility.avg_temperature !== undefined && (
                      <div>
                        Temp: {facility.min_temperature?.toFixed(1)}°C - {facility.max_temperature?.toFixed(1)}°C
                      </div>
                    )}
                    {facility.avg_humidity !== undefined && (
                      <div>
                        Humidity: {facility.min_humidity?.toFixed(0)}% - {facility.max_humidity?.toFixed(0)}%
                      </div>
                    )}
                    <div>Status: {facility.status}</div>
                    <div>Sensors: {facility.sensors?.length || 0}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FacilityHeatMap;


































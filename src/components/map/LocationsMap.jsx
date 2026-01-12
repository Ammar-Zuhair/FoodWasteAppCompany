import { useEffect, useState, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { getFacilitiesHeatmap } from "../../utils/api/heatmaps.js";
import { getRFIDDashboard } from "../../utils/api/rfid.js";

function LocationsMap({ showRFIDTags = true, height = "600px" }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [facilities, setFacilities] = useState([]);
  const [rfidTags, setRfidTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    loadMapData();
    // Refresh every 30 seconds
    const interval = setInterval(loadMapData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadMapData = async () => {
    try {
      setLoading(true);
      
      const [facilitiesResult, rfidResult] = await Promise.all([
        getFacilitiesHeatmap({ windowHours: 1 }),
        showRFIDTags ? getRFIDDashboard() : Promise.resolve(null),
      ]);
      
      if (facilitiesResult.status === "success") {
        setFacilities(facilitiesResult.facilities || []);
      }
      
      if (rfidResult && rfidResult.status === "success" && rfidResult.facility_distribution) {
        setRfidTags(rfidResult.facility_distribution || []);
      }
      
      setError(null);
    } catch (err) {
      setError(err.message || "Error loading map data");
    } finally {
      setLoading(false);
    }
  };

  // Simple grid-based map visualization (can be enhanced with actual map library)
  const bgClass = theme === "dark"
    ? "bg-slate-900/80 backdrop-blur-xl border-white/10"
    : "bg-gradient-to-br from-[#F0FAFC]/95 to-[#E6F7FB]/90 backdrop-blur-xl border-[#9FE7F5]/40";
  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";

  // Group facilities by approximate location (simplified - in real app, use actual coordinates)
  const locations = facilities.filter(f => f.latitude && f.longitude);
  const locationsWithoutCoords = facilities.filter(f => !f.latitude || !f.longitude);

  if (loading) {
    return (
      <div className={`${bgClass} rounded-xl border p-8 flex items-center justify-center`} style={{ height }}>
        <p className={`${textColor} font-semibold`}>
          {language === "ar" ? "جاري تحميل الخريطة..." : "Loading map..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${bgClass} rounded-xl border p-8 flex flex-col items-center justify-center space-y-4`} style={{ height }}>
        <p className={`${textColor} font-semibold text-red-500`}>{error}</p>
        <button
          onClick={loadMapData}
          className="px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          {language === "ar" ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className={`${bgClass} rounded-xl border p-6`} dir={language === "ar" ? "rtl" : "ltr"}>
      <div className="mb-4 flex items-center justify-between">
        <h3 className={`text-xl font-semibold ${textColor}`}>
          {language === "ar" ? "خريطة المواقع" : "Locations Map"}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className={subTextColor}>{language === "ar" ? "منشأة" : "Facility"}</span>
          </div>
          {showRFIDTags && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className={subTextColor}>{language === "ar" ? "علامات RFID" : "RFID Tags"}</span>
            </div>
          )}
        </div>
      </div>

      {/* Map Visualization */}
      <div className="relative" style={{ height, minHeight: "400px" }}>
        {locations.length === 0 && locationsWithoutCoords.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className={subTextColor}>
              {language === "ar" ? "لا توجد مواقع متاحة" : "No locations available"}
            </p>
          </div>
        ) : (
          <>
            {/* Grid-based map for locations with coordinates */}
            {locations.length > 0 && (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 h-full overflow-auto p-4">
                {locations.map((facility) => {
                  const rfidCount = rfidTags.find(f => f.facility_id === facility.facility_id)?.tag_count || 0;
                  
                  return (
                    <div
                      key={facility.facility_id}
                      className={`relative rounded-lg border-2 p-2 cursor-pointer transition-all hover:scale-110 hover:shadow-lg ${
                        selectedLocation === facility.facility_id
                          ? "ring-2 ring-emerald-500"
                          : "border-emerald-500/50"
                      }`}
                      style={{
                        backgroundColor: facility.heat_level === "critical_hot" 
                          ? "#ef4444" 
                          : facility.heat_level === "warm"
                          ? "#fbbf24"
                          : facility.heat_level === "normal"
                          ? "#34d399"
                          : facility.heat_level === "cold"
                          ? "#60a5fa"
                          : "#9ca3af",
                        opacity: 0.8,
                      }}
                      onClick={() => setSelectedLocation(
                        selectedLocation === facility.facility_id ? null : facility.facility_id
                      )}
                    >
                      <div className="text-white text-xs font-semibold truncate">
                        {facility.facility_name}
                      </div>
                      {facility.avg_temperature !== undefined && (
                        <div className="text-white/90 text-[10px]">
                          {facility.avg_temperature.toFixed(1)}°C
                        </div>
                      )}
                      {showRFIDTags && rfidCount > 0 && (
                        <div className="absolute top-1 right-1 bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                          {rfidCount}
                        </div>
                      )}
                      
                      {/* Tooltip */}
                      {selectedLocation === facility.facility_id && (
                        <div className="absolute top-full left-0 mt-2 z-10 bg-slate-900 text-white p-3 rounded-lg shadow-xl min-w-[200px]">
                          <div className="font-semibold mb-2">{facility.facility_name}</div>
                          <div className="text-xs space-y-1">
                            <div>Type: {facility.facility_type}</div>
                            {facility.avg_temperature !== undefined && (
                              <div>Temp: {facility.avg_temperature.toFixed(1)}°C</div>
                            )}
                            {facility.avg_humidity !== undefined && (
                              <div>Humidity: {facility.avg_humidity.toFixed(0)}%</div>
                            )}
                            {facility.latitude && facility.longitude && (
                              <div className="font-mono text-[10px]">
                                {facility.latitude.toFixed(4)}, {facility.longitude.toFixed(4)}
                              </div>
                            )}
                            {showRFIDTags && rfidCount > 0 && (
                              <div>RFID Tags: {rfidCount}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* List for locations without coordinates */}
            {locationsWithoutCoords.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-300 dark:border-slate-700">
                <h4 className={`text-sm font-semibold ${textColor} mb-2`}>
                  {language === "ar" ? "مواقع بدون إحداثيات" : "Locations without coordinates"}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {locationsWithoutCoords.map((facility) => (
                    <div
                      key={facility.facility_id}
                      className={`p-2 rounded border ${
                        theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"
                      }`}
                    >
                      <div className={`text-sm font-semibold ${textColor}`}>
                        {facility.facility_name}
                      </div>
                      <div className={`text-xs ${subTextColor}`}>
                        {facility.facility_type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default LocationsMap;

































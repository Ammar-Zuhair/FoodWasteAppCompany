import { useEffect, useState } from "react";
import { useShipmentTracking } from "../../hooks/useWebSocket.js";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

function ShipmentTrackingMap({ shipmentId }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const { isConnected, location, temperature, alerts } = useShipmentTracking(shipmentId);
  
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const cardBgClass = theme === "dark"
    ? "bg-slate-900/80 backdrop-blur-xl border-white/10"
    : "bg-gradient-to-br from-[#F0FAFC]/95 to-[#E6F7FB]/90 backdrop-blur-xl border-[#9FE7F5]/40 shadow-lg";

  useEffect(() => {
    // Initialize map (using Leaflet if available)
    if (typeof window !== 'undefined' && window.L) {
      const mapInstance = window.L.map('shipment-map').setView([15.3694, 44.1910], 13);
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapInstance);
      
      const markerInstance = window.L.marker([15.3694, 44.1910]).addTo(mapInstance);
      
      setMap(mapInstance);
      setMarker(markerInstance);
    }
  }, []);

  useEffect(() => {
    if (location && map && marker) {
      marker.setLatLng([location.latitude, location.longitude]);
      map.setView([location.latitude, location.longitude], 13);
    }
  }, [location, map, marker]);

  return (
    <div className="space-y-4" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Connection Status */}
      <div className={`${cardBgClass} p-4 rounded-lg border`}>
        <div className="flex items-center gap-3">
          <div className={`h-3 w-3 rounded-full ${isConnected ? "bg-emerald-500" : "bg-red-500"} ${isConnected ? "animate-pulse" : ""}`} />
          <span className={textColor}>
            {isConnected ? "متصل - تتبع فوري نشط" : "غير متصل"}
          </span>
        </div>
      </div>

      {/* Map */}
      <div className={`${cardBgClass} p-4 rounded-lg border`}>
        <h3 className={`text-xl font-semibold ${textColor} mb-4`}>موقع الشحنة</h3>
        <div id="shipment-map" className="w-full h-96 rounded-lg" />
        {location && (
          <div className="mt-4 space-y-2">
            <p className={subTextColor}>
              <span className="font-semibold">Latitude:</span> {location.latitude.toFixed(6)}
            </p>
            <p className={subTextColor}>
              <span className="font-semibold">Longitude:</span> {location.longitude.toFixed(6)}
            </p>
          </div>
        )}
      </div>

      {/* Temperature */}
      {temperature && (
        <div className={`${cardBgClass} p-4 rounded-lg border`}>
          <h3 className={`text-xl font-semibold ${textColor} mb-4`}>درجة الحرارة</h3>
          <div className="space-y-2">
            <p className={subTextColor}>
              <span className="font-semibold">الحالية:</span> {temperature.temperature}°C
            </p>
            <p className={subTextColor}>
              <span className="font-semibold">المتوسطة:</span> {temperature.avg_temperature?.toFixed(2)}°C
            </p>
            {temperature.has_violations && (
              <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p className="text-red-500 font-semibold">⚠️ انتهاكات درجة الحرارة</p>
                <ul className="mt-2 space-y-1">
                  {temperature.violations.map((v, idx) => (
                    <li key={idx} className="text-sm text-red-400">
                      {v.product_name}: {v.temperature}°C (المدى: {v.min_temp}°C - {v.max_temp}°C)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className={`${cardBgClass} p-4 rounded-lg border border-amber-500/50`}>
          <h3 className={`text-xl font-semibold text-amber-500 mb-4`}>التنبيهات</h3>
          <div className="space-y-2">
            {alerts.map((alert, idx) => (
              <div key={idx} className="p-3 bg-amber-500/20 rounded-lg">
                <p className="text-amber-500">{alert.message}</p>
                <p className="text-xs text-amber-400 mt-1">{new Date(alert.timestamp).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ShipmentTrackingMap;







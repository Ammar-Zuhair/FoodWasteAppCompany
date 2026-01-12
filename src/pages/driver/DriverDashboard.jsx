import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { getStoredUser, logout } from "../../utils/api/auth.js";
import { getCurrentDriver } from "../../utils/api/drivers.js";
import { getShipment, getActiveShipments, updateShipmentLocation } from "../../utils/api/shipments.js";
import { useShipmentTracking } from "../../hooks/useWebSocket.js";
import { 
  isNative, 
  watchPosition, 
  requestLocationPermissions,
  showNotification,
  initStatusBar 
} from "../../utils/capacitor.js";

function DriverDashboard() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeShipment, setActiveShipment] = useState(null);
  const [shipmentId, setShipmentId] = useState(null);
  const [availableShipments, setAvailableShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationWatching, setLocationWatching] = useState(false);

  const { isConnected, location, temperature, alerts, disconnect: disconnectWebSocket } = useShipmentTracking(shipmentId);
  
  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      if (disconnectWebSocket) {
        disconnectWebSocket();
      }
    };
  }, [disconnectWebSocket]);

  // Initialize Capacitor on mount
  useEffect(() => {
    if (isNative()) {
      initStatusBar(theme);
      requestLocationPermissions();
    }
  }, [theme]);

  // Watch location if shipment is active
  useEffect(() => {
    if (!shipmentId || !isNative()) return;

    let stopWatching = null;

    const startWatching = async () => {
      try {
        stopWatching = await watchPosition(async (position) => {
          setCurrentLocation(position);
          
          // Auto-update shipment location
          if (shipmentId && position) {
            try {
              await updateShipmentLocation(
                shipmentId,
                position.latitude,
                position.longitude
              );
            } catch (err) {
              console.error("Error updating location:", err);
            }
          }
        });
        setLocationWatching(true);
      } catch (err) {
        console.error("Error watching location:", err);
      }
    };

    startWatching();

    return () => {
      if (stopWatching) {
        stopWatching();
        setLocationWatching(false);
      }
    };
  }, [shipmentId]);

  // Show notifications for alerts
  useEffect(() => {
    if (alerts.length > 0 && isNative()) {
      const lastAlert = alerts[alerts.length - 1];
      showNotification(
        "تنبيه شحنة",
        lastAlert.message,
        lastAlert.data
      );
    }
  }, [alerts]);

  const bgClass = theme === "dark"
    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    : "bg-gradient-to-br from-[#E6F7FB] via-[#F0FAFC] to-[#E6F7FB]";
  const cardBgClass = theme === "dark"
    ? "bg-slate-900/90 backdrop-blur-xl border-white/10 shadow-xl"
    : "bg-white/95 backdrop-blur-xl border-slate-200/50 shadow-xl";
  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const buttonClass = theme === "dark"
    ? "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white"
    : "bg-red-500 hover:bg-red-600 active:bg-red-700 text-white";
  const shipmentButtonClass = theme === "dark"
    ? "bg-slate-800/80 border-white/10 hover:bg-slate-700/80 text-white"
    : "bg-white border-slate-300 hover:bg-slate-50 text-[#053F5C]";

  useEffect(() => {
    const loadData = async () => {
      const storedUser = getStoredUser();
      if (!storedUser) {
        navigate("/");
        return;
      }
      setUser(storedUser);
      
      try {
        // Get driver information
        const driverInfo = await getCurrentDriver();
        const driverId = driverInfo.driver_id;
        
        // Load active shipments for this driver
        const response = await getActiveShipments(driverId);
        setAvailableShipments(response.shipments || []);
        
        // Auto-select first active shipment if available
        if (response.shipments && response.shipments.length > 0) {
          const firstShipment = response.shipments[0];
          setActiveShipment(firstShipment);
          setShipmentId(firstShipment.id);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        // If driver not found, still show the dashboard
        if (err.message.includes("404")) {
          alert("لم يتم العثور على بيانات السائق. تأكد من أن المستخدم مرتبط بسائق في النظام.");
        }
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [navigate]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleStartTracking = async (shipment) => {
    try {
      const shipmentData = await getShipment(shipment.id);
      setActiveShipment(shipmentData);
      setShipmentId(shipment.id);
    } catch (err) {
      alert("خطأ في جلب بيانات الشحنة: " + err.message);
    }
  };

  if (!user) {
    return null;
  }

  // This component is now used within RoleBasedLayout, so we don't need the full page wrapper
  return (
    <div className={`space-y-3`} dir="rtl">

        {/* Connection Status - Mobile Optimized */}
        <div className={`${cardBgClass} rounded-2xl border-2 ${theme === "dark" ? "border-white/10" : "border-slate-200/60"} p-4 shadow-lg`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-4 w-4 rounded-full ${isConnected ? "bg-emerald-500" : "bg-red-500"} ${isConnected ? "animate-pulse" : ""} shadow-lg`} />
              <span className={`text-sm font-bold ${textColor}`}>
                {isConnected ? "متصل" : "غير متصل"}
              </span>
            </div>
            {isConnected && (
              <span className={`text-xs ${subTextColor} font-medium`}>تتبع فوري</span>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className={`${cardBgClass} rounded-2xl border-2 ${theme === "dark" ? "border-white/10" : "border-slate-200/60"} p-8 text-center shadow-lg`}>
            <div className="flex flex-col items-center gap-3">
              <div className={`w-10 h-10 border-3 ${theme === "dark" ? "border-emerald-400" : "border-[#429EBD]"} border-t-transparent rounded-full animate-spin`} />
              <p className={`${textColor} font-bold text-sm`}>جاري التحميل...</p>
            </div>
          </div>
        ) : !activeShipment ? (
          <div className="space-y-3">
            <div className={`${cardBgClass} rounded-2xl border-2 ${theme === "dark" ? "border-white/10" : "border-slate-200/60"} p-6 text-center shadow-lg`}>
              <p className={`${textColor} text-base font-bold mb-1.5`}>لا توجد شحنة نشطة</p>
              <p className={`${subTextColor} text-xs`}>اختر شحنة من القائمة أدناه للبدء</p>
            </div>
            
            {/* Available Shipments - Mobile Optimized */}
            {availableShipments.length > 0 && (
              <div className={`${cardBgClass} rounded-2xl border-2 ${theme === "dark" ? "border-white/10" : "border-slate-200/60"} p-4 shadow-lg`}>
                <h3 className={`text-base font-extrabold ${textColor} mb-3 pb-2 border-b ${theme === "dark" ? "border-white/10" : "border-slate-200/60"}`}>
                  الشحنات المتاحة ({availableShipments.length})
                </h3>
                <div className="space-y-2.5">
                  {availableShipments.map((shipment) => (
                    <button
                      key={shipment.id}
                      onClick={() => handleStartTracking(shipment)}
                      className={`w-full p-3.5 rounded-xl border-2 ${theme === "dark" ? "border-white/10 hover:border-emerald-500/30" : "border-slate-200/60 hover:border-[#429EBD]/40"} text-right transition-all duration-200 ${shipmentButtonClass} active:scale-[0.97] shadow-md hover:shadow-lg touch-manipulation`}
                    >
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex-1 text-right">
                          <p className={`font-extrabold text-sm ${textColor} mb-1`}>{shipment.shipment_number}</p>
                          <p className={`text-xs ${subTextColor} font-medium`}>الحالة: {shipment.status}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap ${
                          shipment.status === "in_transit" 
                            ? "bg-blue-500/20 text-blue-600 border border-blue-500/30"
                            : "bg-amber-500/20 text-amber-600 border border-amber-500/30"
                        }`}>
                          {shipment.status === "in_transit" ? "قيد النقل" : "قيد التحضير"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Shipment Info - Mobile Optimized */}
            <div className={`${cardBgClass} rounded-2xl border-2 ${theme === "dark" ? "border-white/10" : "border-slate-200/60"} p-4 shadow-lg`}>
              <h2 className={`text-base font-extrabold ${textColor} mb-3 pb-2 border-b ${theme === "dark" ? "border-white/10" : "border-slate-200/60"}`}>
                الشحنة: {activeShipment.shipment_number}
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className={`text-sm ${subTextColor}`}>الحالة:</span>
                  <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                    activeShipment.status === "in_transit"
                      ? "bg-blue-500/20 text-blue-600 border border-blue-500/30"
                      : "bg-amber-500/20 text-amber-600 border border-amber-500/30"
                  }`}>
                    {activeShipment.status}
                  </span>
                </div>
                {activeShipment.driver && (
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${subTextColor}`}>السائق:</span>
                    <span className={`text-sm font-semibold ${textColor}`}>{activeShipment.driver.name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location - Mobile Optimized */}
            {(location || currentLocation) && (
              <div className={`${cardBgClass} rounded-2xl border-2 ${theme === "dark" ? "border-white/10" : "border-slate-200/60"} p-4 shadow-lg`}>
                <div className={`flex items-center justify-between mb-3 pb-2 border-b ${theme === "dark" ? "border-white/10" : "border-slate-200/60"}`}>
                  <h3 className={`text-sm font-extrabold ${textColor}`}>الموقع الحالي</h3>
                  {locationWatching && (
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-lg" />
                      <span className="text-xs text-emerald-500 font-medium">GPS نشط</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${subTextColor}`}>خط العرض:</span>
                    <span className={`text-sm font-mono font-semibold ${textColor}`}>
                      {(location?.latitude || currentLocation?.latitude)?.toFixed(6)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-xs ${subTextColor}`}>خط الطول:</span>
                    <span className={`text-sm font-mono font-semibold ${textColor}`}>
                      {(location?.longitude || currentLocation?.longitude)?.toFixed(6)}
                    </span>
                  </div>
                  {currentLocation && (
                    <div className={`mt-3 pt-3 border-t ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-xs ${subTextColor}`}>دقة الموقع:</span>
                        <span className={`text-xs font-semibold ${textColor}`}>
                          ±{currentLocation.accuracy?.toFixed(0)} متر
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Temperature - Mobile Optimized */}
            {temperature && (
              <div className={`${cardBgClass} rounded-2xl border-2 ${temperature.has_violations ? "border-red-500/50" : theme === "dark" ? "border-white/10" : "border-slate-200/60"} p-4 shadow-lg`}>
                <h3 className={`text-sm font-extrabold ${textColor} mb-3`}>درجة الحرارة</h3>
                <div className="text-center">
                  <p className={`text-4xl font-extrabold mb-2 ${temperature.has_violations ? "text-red-500" : theme === "dark" ? "text-emerald-400" : "text-[#429EBD]"}`}>
                    {temperature.temperature}°C
                  </p>
                  {temperature.has_violations && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                      <p className="text-red-500 text-sm font-semibold flex items-center justify-center gap-2">
                        <span>⚠️</span>
                        <span>انتهاك درجة الحرارة</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Alerts - Mobile Optimized */}
            {alerts.length > 0 && (
              <div className={`${cardBgClass} rounded-2xl border-2 border-amber-500/50 p-4 shadow-lg`}>
                <h3 className={`text-sm font-extrabold text-amber-500 mb-3 pb-2 border-b border-amber-500/30`}>
                  التنبيهات ({alerts.length})
                </h3>
                <div className="space-y-2">
                  {alerts.map((alert, idx) => (
                    <div key={idx} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                      <p className={`text-amber-600 ${theme === "dark" ? "dark:text-amber-400" : ""} text-xs font-semibold`}>{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

export default DriverDashboard;


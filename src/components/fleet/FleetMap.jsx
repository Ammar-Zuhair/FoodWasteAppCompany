import { useState, useMemo, useEffect, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// إصلاح أيقونات Leaflet الافتراضية
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// مكون للانتقال إلى موقع المركبة
function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom, { animate: true, duration: 0.5 });
    }
  }, [center, zoom, map]);
  
  return null;
}

function FleetMap({ vehicles, onVehicleClick, selectedVehicleId, focusVehicleId }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const [gpsData, setGpsData] = useState({});
  const [mapCenter, setMapCenter] = useState(null);
  const [mapZoom, setMapZoom] = useState(8);

  const getVFSColor = (vfs) => {
    if (vfs >= 80) return "#10b981";
    if (vfs >= 60) return "#f59e0b";
    return "#ef4444";
  };

  // محاكاة GPS - تحديث الموقع كل ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      const newGpsData = {};
      vehicles.forEach(vehicle => {
        if (vehicle.coordinates && vehicle.speed > 0 && vehicle.currentTrip) {
          const speedKmh = vehicle.speed;
          const speedMs = speedKmh / 3.6;
          const distancePerSecond = speedMs / 111000;
          
          const direction = vehicle.direction || 0;
          const directionRad = (direction * Math.PI) / 180;
          
          const newLat = vehicle.coordinates.lat + (Math.cos(directionRad) * distancePerSecond);
          const newLng = vehicle.coordinates.lng + (Math.sin(directionRad) * distancePerSecond);
          
          newGpsData[vehicle.id] = {
            lat: newLat,
            lng: newLng,
            accuracy: 5,
            timestamp: new Date().toISOString(),
          };
        } else if (vehicle.coordinates) {
          newGpsData[vehicle.id] = {
            lat: vehicle.coordinates.lat,
            lng: vehicle.coordinates.lng,
            accuracy: 3,
            timestamp: new Date().toISOString(),
          };
        }
      });
      setGpsData(newGpsData);
    }, 1000);

    return () => clearInterval(interval);
  }, [vehicles]);

  // حساب المركز والزوم للمركبة المحددة
  useEffect(() => {
    if (selectedVehicleId) {
      const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId && v.coordinates);
      if (selectedVehicle) {
        const gps = gpsData[selectedVehicleId];
        const coords = gps || selectedVehicle.coordinates;
        
        if (selectedVehicle.currentTrip && selectedVehicle.route) {
          // إذا كانت في رحلة، استخدم وسط المسار
          const routeCoords = selectedVehicle.route;
          const avgLat = routeCoords.reduce((sum, p) => sum + p.lat, 0) / routeCoords.length;
          const avgLng = routeCoords.reduce((sum, p) => sum + p.lng, 0) / routeCoords.length;
          setMapCenter([avgLat, avgLng]);
          setMapZoom(10);
        } else {
          setMapCenter([coords.lat, coords.lng]);
          setMapZoom(12);
        }
      }
    } else {
      // إذا لم تكن هناك مركبة محددة، استخدم وسط جميع المركبات
      const vehiclesWithCoords = vehicles.filter(v => v.coordinates && v.coordinates.lat && v.coordinates.lng);
      if (vehiclesWithCoords.length > 0) {
        const allCoords = vehiclesWithCoords.map(v => {
          const gps = gpsData[v.id];
          return gps || v.coordinates;
        });
        const avgLat = allCoords.reduce((sum, c) => sum + c.lat, 0) / allCoords.length;
        const avgLng = allCoords.reduce((sum, c) => sum + c.lng, 0) / allCoords.length;
        setMapCenter([avgLat, avgLng]);
        setMapZoom(8);
      }
    }
  }, [selectedVehicleId, vehicles, gpsData, focusVehicleId]);

  // حساب المركز الافتراضي
  const defaultCenter = useMemo(() => {
    const vehiclesWithCoords = vehicles.filter(v => v.coordinates && v.coordinates.lat && v.coordinates.lng);
    if (vehiclesWithCoords.length === 0) return [15.3694, 44.191]; // صنعاء كافتراضي
    
    const allCoords = vehiclesWithCoords.map(v => {
      const gps = gpsData[v.id];
      return gps || v.coordinates;
    });
    const avgLat = allCoords.reduce((sum, c) => sum + c.lat, 0) / allCoords.length;
    const avgLng = allCoords.reduce((sum, c) => sum + c.lng, 0) / allCoords.length;
    return [avgLat, avgLng];
  }, [vehicles, gpsData]);

  // إنشاء أيقونة مخصصة للمركبة
  const createVehicleIcon = (vehicle, isSelected) => {
    const color = getVFSColor(vehicle.vfs);
    const size = isSelected ? 40 : 32;
    
    return L.divIcon({
      className: "vehicle-marker",
      html: `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border: 3px solid ${theme === "dark" ? "#ffffff" : "#053F5C"};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px ${color}aa;
          position: relative;
        ">
          <div style="
            color: white;
            font-weight: 900;
            font-size: ${isSelected ? "14px" : "12px"};
            text-shadow: 0 2px 4px rgba(0,0,0,0.8);
          ">
            ${vehicle.plateNumber.split(' ')[1] || vehicle.plateNumber.charAt(0)}
          </div>
          ${isSelected ? `
            <div style="
              position: absolute;
              top: -5px;
              right: -5px;
              width: 16px;
              height: 16px;
              background: ${color};
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 10px;
              font-weight: 900;
              color: white;
            ">
              ${vehicle.vfs}
            </div>
          ` : ''}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // المركبات المعروضة
  const displayedVehicles = useMemo(() => {
    if (selectedVehicleId) {
      return vehicles.filter(v => v.id === selectedVehicleId && v.coordinates);
    }
    return vehicles.filter(v => v.coordinates && v.coordinates.lat && v.coordinates.lng);
  }, [vehicles, selectedVehicleId]);

  if (displayedVehicles.length === 0) {
    return (
      <div className="w-full h-[700px] flex items-center justify-center rounded-xl border border-white/10 bg-slate-900/50">
        <p className="text-slate-400">{language === "ar" ? "لا توجد مركبات متاحة" : "No vehicles available"}</p>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-[700px] relative rounded-2xl border-2 overflow-hidden shadow-2xl"
      style={{ 
        borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.25)" : "rgba(66, 158, 189, 0.5)",
      }}
    >
      <MapContainer
        center={mapCenter || defaultCenter}
        zoom={mapZoom}
        style={{ height: "100%", width: "100%", zIndex: 1 }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* طبقة الخريطة - مثل Google Maps */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={theme === "dark" 
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />
        
        {/* التحكم في الخريطة */}
        {mapCenter && <MapController center={mapCenter} zoom={mapZoom} />}
        
        {/* خطوط المسار - فقط للمركبة المحددة */}
        {selectedVehicleId && (() => {
          const vehicle = vehicles.find(v => v.id === selectedVehicleId && v.currentTrip && v.route);
          if (!vehicle) return null;
          
          const routeColor = getVFSColor(vehicle.vfs);
          const routePoints = vehicle.route.map(point => [point.lat, point.lng]);
          
          return (
            <>
              <Polyline
                positions={routePoints}
                color={routeColor}
                weight={6}
                opacity={0.6}
                dashArray="10 5"
              />
              {/* نقطة البداية */}
              {routePoints[0] && (
                <Circle
                  center={routePoints[0]}
                  radius={500}
                  pathOptions={{
                    color: routeColor,
                    fillColor: routeColor,
                    fillOpacity: 0.3,
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-bold text-sm">{vehicle.currentTrip.from}</p>
                      <p className="text-xs text-gray-500">{language === "ar" ? "نقطة البداية" : "Start Point"}</p>
                    </div>
                  </Popup>
                </Circle>
              )}
              {/* نقطة النهاية */}
              {routePoints[routePoints.length - 1] && (
                <Circle
                  center={routePoints[routePoints.length - 1]}
                  radius={500}
                  pathOptions={{
                    color: routeColor,
                    fillColor: routeColor,
                    fillOpacity: 0.3,
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <p className="font-bold text-sm">{vehicle.currentTrip.to}</p>
                      <p className="text-xs text-gray-500">{language === "ar" ? "نقطة النهاية" : "End Point"}</p>
                    </div>
                  </Popup>
                </Circle>
              )}
            </>
          );
        })()}
        
        {/* المركبات */}
        {displayedVehicles.map((vehicle) => {
          const gps = gpsData[vehicle.id];
          const coords = gps || vehicle.coordinates;
          const isSelected = selectedVehicleId === vehicle.id;
          const accuracy = gps?.accuracy || 5;
          
          return (
            <div key={vehicle.id}>
              {/* دائرة دقة GPS */}
              {gps && (
                <Circle
                  key={`circle-${vehicle.id}`}
                  center={[coords.lat, coords.lng]}
                  radius={accuracy}
                  pathOptions={{
                    color: getVFSColor(vehicle.vfs),
                    fillColor: getVFSColor(vehicle.vfs),
                    fillOpacity: 0.1,
                    weight: 1,
                    dashArray: "4 4",
                  }}
                />
              )}
              
              {/* Marker المركبة */}
              <Marker
                key={`marker-${vehicle.id}`}
                position={[coords.lat, coords.lng]}
                icon={createVehicleIcon(vehicle, isSelected)}
                eventHandlers={{
                  click: () => {
                    onVehicleClick && onVehicleClick(vehicle);
                  },
                }}
              >
                <Popup>
                  <div className="p-3 min-w-[200px]">
                    <h3 className="font-black text-lg mb-2">{vehicle.plateNumber}</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-bold">{language === "ar" ? "السائق:" : "Driver:"}</span> {vehicle.driver}</p>
                      <p><span className="font-bold">VFS:</span> <span style={{ color: getVFSColor(vehicle.vfs) }}>{vehicle.vfs}%</span></p>
                      <p><span className="font-bold">{language === "ar" ? "السرعة:" : "Speed:"}</span> {vehicle.speed} km/h</p>
                      <p><span className="font-bold">{language === "ar" ? "الموقع:" : "Location:"}</span> {vehicle.currentLocation}</p>
                      {gps && (
                        <p className="text-xs text-gray-500">
                          GPS: ±{accuracy}m | {new Date(gps.timestamp).toLocaleTimeString()}
                        </p>
                      )}
                      {vehicle.currentTrip && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="font-bold text-xs">{language === "ar" ? "في رحلة إلى:" : "Trip to:"}</p>
                          <p className="text-sm">{vehicle.currentTrip.to}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}

export default FleetMap;

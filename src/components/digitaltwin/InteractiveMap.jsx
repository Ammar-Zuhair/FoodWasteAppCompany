import { useState, useEffect, useRef } from "react";

// Mock Theme & Language Contexts
const useTheme = () => ({ theme: "light" });
const useLanguage = () => ({ language: "ar" });

// Icons
const FactoryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
    <path d="M17 18h1" />
    <path d="M12 18h1" />
    <path d="M7 18h1" />
  </svg>
);

const WarehouseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21c0-2.8 5-4 9-4s9 1.2 9 4v1H3v-1Z" />
    <path d="M12 17v-7" />
    <path d="M5 17V7l7-4 7 4v10" />
  </svg>
);

const BranchIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect width="16" height="16" x="4" y="4" rx="2" />
    <rect width="6" height="6" x="9" y="9" rx="1" />
  </svg>
);

const SupermarketIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>
);

// Sample locations data
const sampleLocations = [
  { id: 1, name: "المخزن الرئيسي - الرياض", type: "warehouse", latitude: 24.7136, longitude: 46.6753, status: "active", capacity: 50000 },
  { id: 2, name: "مصنع جدة", type: "factory", latitude: 21.5433, longitude: 39.1728, status: "active", capacity: 30000 },
  { id: 3, name: "فرع الدمام", type: "branch", latitude: 26.4207, longitude: 50.0888, status: "warning", capacity: 15000 },
  { id: 4, name: "متجر الخبر", type: "supermarket", latitude: 26.2172, longitude: 50.1971, status: "active", capacity: 5000 },
  { id: 5, name: "مخزن مكة", type: "warehouse", latitude: 21.3891, longitude: 39.8579, status: "critical", capacity: 25000 },
  { id: 6, name: "فرع المدينة", type: "branch", latitude: 24.5247, longitude: 39.5692, status: "active", capacity: 12000 },
  { id: 7, name: "مصنع الخرج", type: "factory", latitude: 24.1460, longitude: 47.3340, status: "active", capacity: 35000 },
];

function InteractiveMap({
  locations = sampleLocations,
  onLocationClick = () => { },
  selectedLocationId,
  showRoute = false
}) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);

  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "warehouse": return <WarehouseIcon />;
      case "factory": return <FactoryIcon />;
      case "branch": return <BranchIcon />;
      case "supermarket": return <SupermarketIcon />;
      default: return <BranchIcon />;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      warehouse: language === "ar" ? "مخزن" : "Warehouse",
      factory: language === "ar" ? "مصنع" : "Factory",
      branch: language === "ar" ? "فرع" : "Branch",
      supermarket: language === "ar" ? "متجر تجزئة" : "Retail Store",
    };
    return labels[type?.toLowerCase()] || type;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "active": return { main: "#10b981", glow: "rgba(16, 185, 129, 0.3)" };
      case "warning": return { main: "#f59e0b", glow: "rgba(245, 158, 11, 0.3)" };
      case "critical": return { main: "#ef4444", glow: "rgba(239, 68, 68, 0.3)" };
      default: return { main: "#6b7280", glow: "rgba(107, 114, 128, 0.3)" };
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    let isMounted = true;

    const loadLeaflet = async () => {
      try {
        // Add Leaflet CSS
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
          document.head.appendChild(link);
        }

        // Load Leaflet JS
        if (!window.L) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });
        }

        if (!isMounted || !mapRef.current || mapInstanceRef.current) return;

        // Calculate center and bounds
        let centerLat = 24.7136; // Default to Riyadh
        let centerLng = 46.6753;

        const validLocations = (locations || []).filter(
          loc => loc && loc.latitude != null && loc.longitude != null && !isNaN(Number(loc.latitude)) && !isNaN(Number(loc.longitude))
        );

        if (validLocations.length > 0) {
          const lats = validLocations.map(loc => Number(loc.latitude));
          const lngs = validLocations.map(loc => Number(loc.longitude));
          centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
          centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
        }

        // Check if container already has a map (standard Leaflet cleanup doesn't always clear the internal flag immediately)
        // A better way is to check the ref itself if it has a _leaflet_id or similar, but mapInstanceRef should be enough.
        if (mapRef.current._leaflet_id) return;

        // Initialize map
        const map = window.L.map(mapRef.current, {
          center: [centerLat, centerLng],
          zoom: 6,
          zoomControl: false,
          scrollWheelZoom: true,
          dragging: true,
          touchZoom: true,
          doubleClickZoom: true,
        });

        // Add modern tile layer
        window.L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;
        setIsMapReady(true);

        // Fit bounds to show all markers
        if (validLocations.length > 0) {
          const bounds = window.L.latLngBounds(validLocations.map(loc => [Number(loc.latitude), Number(loc.longitude)]));
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      } catch (err) {
        console.error("Leaflet initialization failed:", err);
      }
    };

    loadLeaflet();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          console.warn("Error during map cleanup:", e);
        }
        mapInstanceRef.current = null;
        setIsMapReady(false);
      }
    };
  }, []);

  // Update markers when locations change
  useEffect(() => {
    if (!isMapReady || !mapInstanceRef.current || !window.L) return;

    // Filter valid locations again to be safe
    const validLocs = (locations || [])
      .map(loc => ({
        ...loc,
        latitude: loc ? Number(loc.latitude) : NaN,
        longitude: loc ? Number(loc.longitude) : NaN
      }))
      .filter(
        loc => !isNaN(loc.latitude) && !isNaN(loc.longitude) &&
          loc.latitude !== 0 && loc.longitude !== 0 &&
          Math.abs(loc.latitude) <= 90 && Math.abs(loc.longitude) <= 180
      );

    try {
      // Clear existing markers
      markersRef.current.forEach(marker => {
        try { marker.remove(); } catch (e) { }
      });
      markersRef.current = [];

      // Add new markers
      validLocs.forEach(loc => {
        const colors = getStatusColor(loc.status);
        const isSelected = selectedLocationId === loc.id;

        // Create custom icon
        const iconHtml = `
          <div style="position: relative;">
            ${isSelected ? `<div style="position: absolute; inset: -8px; background: ${colors.glow}; border-radius: 50%; animation: pulse 2s infinite;"></div>` : ''}
            <div style="
              width: 48px;
              height: 48px;
              background: white;
              border: 3px solid ${colors.main};
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              color: ${colors.main};
              font-size: 20px;
              cursor: pointer;
              transition: all 0.3s;
              ${isSelected ? 'transform: scale(1.2);' : ''}
            ">
              ${getIconSvg(loc.type)}
            </div>
          </div>
        `;

        const icon = window.L.divIcon({
          html: iconHtml,
          className: 'custom-marker',
          iconSize: [48, 48],
          iconAnchor: [24, 24],
        });

        const marker = window.L.marker([loc.latitude, loc.longitude], { icon })
          .addTo(mapInstanceRef.current)
          .on('click', () => onLocationClick(loc))
          .on('mouseover', () => setHoveredLocation(loc))
          .on('mouseout', () => setHoveredLocation(null));

        markersRef.current.push(marker);
      });

      // Add polyline if showRoute is true
      if (showRoute && validLocs.length > 1) {
        if (polylineRef.current) {
          try { polylineRef.current.remove(); } catch (e) { }
        }

        const pathPoints = validLocs.map(loc => [loc.latitude, loc.longitude]);
        const polyline = window.L.polyline(pathPoints, {
          color: '#429EBD',
          weight: 4,
          opacity: 0.8,
          dashArray: '10, 10',
          lineJoin: 'round',
          className: 'route-polyline'
        });

        // Add safety check before adding to map
        if (polyline && polyline.getLatLngs().length > 0) {
          polyline.addTo(mapInstanceRef.current);
          polylineRef.current = polyline;

          // Optionally fit bounds to the polyline
          const bounds = polyline.getBounds();
          if (bounds.isValid()) {
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      } else {
        if (polylineRef.current) {
          try { polylineRef.current.remove(); } catch (e) { }
          polylineRef.current = null;
        }
      }
    } catch (err) {
      console.error("Leaflet Error during update:", err);
    }
  }, [isMapReady, locations, selectedLocationId, showRoute]);

  const getIconSvg = (type) => {
    const icons = {
      warehouse: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c0-2.8 5-4 9-4s9 1.2 9 4v1H3v-1Z"/><path d="M12 17v-7"/><path d="M5 17V7l7-4 7 4v10"/></svg>',
      factory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/></svg>',
      branch: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/></svg>',
      supermarket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>',
    };
    return icons[type?.toLowerCase()] || icons.branch;
  };

  const isDark = theme === "dark";

  return (
    <div className="w-full h-[700px] rounded-2xl overflow-hidden shadow-2xl relative" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div className="absolute top-6 left-6 right-6 z-[1000] bg-white/95 backdrop-blur-md rounded-xl shadow-lg p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                {language === "ar" ? "شبكة التوريد الذكية" : "Smart Supply Network"}
              </h3>
              <p className="text-sm text-gray-500">
                {locations.length} {language === "ar" ? "منشأة متصلة" : "Connected Facilities"}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            {[
              { color: "#10b981", label: language === "ar" ? "نشط" : "Active" },
              { color: "#f59e0b", label: language === "ar" ? "تنبيه" : "Warning" },
              { color: "#ef4444", label: language === "ar" ? "حرج" : "Critical" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: item.color }}></div>
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Hover Tooltip */}
      {hoveredLocation && (
        <div className="absolute bottom-6 right-6 z-[1000] bg-white/95 backdrop-blur-md rounded-xl shadow-2xl p-5 border border-gray-200 max-w-sm animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: getStatusColor(hoveredLocation.status).main }}>
              {getIcon(hoveredLocation.type)}
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-800 mb-1">{hoveredLocation.name}</h4>
              <p className="text-sm text-gray-500">{getTypeLabel(hoveredLocation.type)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">{language === "ar" ? "السعة" : "Capacity"}</p>
              <p className="text-lg font-bold text-gray-800">{hoveredLocation.capacity?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">{language === "ar" ? "الحالة" : "Status"}</p>
              <p className="text-lg font-bold capitalize" style={{ color: getStatusColor(hoveredLocation.status).main }}>
                {hoveredLocation.status}
              </p>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-400 font-mono text-center">
            {Number(hoveredLocation.latitude || 0).toFixed(4)}°, {Number(hoveredLocation.longitude || 0).toFixed(4)}°
          </div>
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-6 left-6 z-[1000] flex flex-col gap-2">
        <button
          onClick={() => mapInstanceRef.current?.zoomIn()}
          className="w-12 h-12 bg-white hover:bg-gray-50 rounded-lg shadow-lg border border-gray-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={() => mapInstanceRef.current?.zoomOut()}
          className="w-12 h-12 bg-white hover:bg-gray-50 rounded-lg shadow-lg border border-gray-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={() => {
            if (mapInstanceRef.current && locations.length > 0) {
              const bounds = window.L.latLngBounds(locations.map(loc => [loc.latitude, loc.longitude]));
              mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
            }
          }}
          className="w-12 h-12 bg-white hover:bg-gray-50 rounded-lg shadow-lg border border-gray-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-xs font-bold text-gray-700"
        >
          ⟲
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.1); }
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .leaflet-container {
          background: #f8fafc !important;
        }
        .route-polyline {
          filter: drop-shadow(0 0 4px rgba(66, 158, 189, 0.5));
          animation: dash-flow 20s linear infinite;
        }
        @keyframes dash-flow {
          to { stroke-dashoffset: -200; }
        }
      `}</style>
    </div>
  );
}

export default InteractiveMap;
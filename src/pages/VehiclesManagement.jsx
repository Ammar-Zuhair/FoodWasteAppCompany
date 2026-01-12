import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import StatusBadge from "../components/shared/StatusBadge.jsx";
import { getVehicles, createVehicle, updateVehicle, deleteVehicle, getVehicleSuitability } from "../utils/api/vehicles.js";
import { getStoredUser } from "../utils/api/auth.js";

function VehiclesManagement() {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const user = getStoredUser();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [saving, setSaving] = useState(false);
  const [suitabilityData, setSuitabilityData] = useState({});

  // Vehicle types
  const vehicleTypes = [
    { value: "refrigerated_truck", label: language === "ar" ? "شاحنة مبردة" : "Refrigerated Truck" },
    { value: "delivery_van", label: language === "ar" ? "فان توصيل" : "Delivery Van" },
    { value: "pickup", label: language === "ar" ? "بيك أب" : "Pickup" },
    { value: "truck", label: language === "ar" ? "شاحنة عادية" : "Regular Truck" },
    { value: "tanker", label: language === "ar" ? "صهريج" : "Tanker" },
  ];

  // Branches - fetched from database
  const [branches, setBranches] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const initialFormState = {
    plate_number: "",
    vehicle_type: "refrigerated_truck",
    driver_name: "",
    driver_phone: "",
    driver_id: "",
    branch: "",
    branch_id: null,
    capacity: 0,
    temperature_min: -5,
    temperature_max: 8,
    mileage: 0,
    status: "active",
  };
  const [formData, setFormData] = useState(initialFormState);


  useEffect(() => {
    loadVehicles();
    loadBranchesFromAPI();
    loadDriversFromAPI();
  }, []);

  const loadBranchesFromAPI = async () => {
    try {
      const { API_CONFIG } = await import('../config/api.config.js');
      const { getAuthHeaders } = await import('../utils/api/auth.js');

      const response = await fetch(`${API_CONFIG.baseURL}/api/v1/facilities`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const facilityList = data.facilities || [];
        setBranches(facilityList.map(f => ({
          value: f.id,
          code: f.code,
          label: f.name || f.name_ar || f.name_en,
        })));
      }
    } catch (err) {
      console.error('Error loading facilities:', err);
    }
  };

  const loadDriversFromAPI = async () => {
    try {
      const { API_CONFIG } = await import('../config/api.config.js');
      const { getAuthHeaders } = await import('../utils/api/auth.js');

      const response = await fetch(`${API_CONFIG.baseURL}/api/v1/drivers`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const driverList = data.drivers || [];
        setDrivers(driverList.map(d => ({
          value: d.id,
          label: d.name,
          phone: d.phone
        })));
      }
    } catch (err) {
      console.error('Error loading drivers:', err);
    }
  };

  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getVehicles({ organization_id: user?.organization_id });
      // Handle both array and object response formats
      const data = Array.isArray(response) ? response : (response?.vehicles || []);
      setVehicles(data);

      // Load suitability for each vehicle
      data.forEach(async (v) => {
        try {
          const suitability = await getVehicleSuitability(v.id);
          if (suitability && suitability.recommendations) {
            setSuitabilityData(prev => ({
              ...prev,
              [v.id]: suitability.recommendations[0] // Get top one
            }));
          }
        } catch (err) {
          console.error(`Error loading suitability for ${v.id}:`, err);
        }
      });

      if (data.length === 0) {
        setError(language === "ar" ? "لا توجد مركبات متاحة" : "No vehicles available");
      }
    } catch (err) {
      console.error("Error loading vehicles:", err);
      setError(err.message || (language === "ar" ? "فشل تحميل البيانات" : "Failed to load data"));
      setVehicles([]); // Don't use dummy data
    } finally {
      setLoading(false);
    }
  };

  const displayVehicles = useMemo(() => {
    let result = vehicles;

    if (searchTerm) {
      result = result.filter(v =>
        v.plate_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== "all") {
      result = result.filter(v => v.vehicle_type === filterType);
    }

    if (filterStatus !== "all") {
      result = result.filter(v => v.status === filterStatus);
    }

    return result;
  }, [vehicles, searchTerm, filterType, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const allVehicles = vehicles;
    return {
      total: allVehicles.length,
      active: allVehicles.filter(v => v.status === "active").length,
      inTransit: allVehicles.filter(v => v.status === "in_transit").length,
      maintenance: allVehicles.filter(v => v.status === "maintenance").length,
      totalCapacity: allVehicles.reduce((sum, v) => sum + (v.capacity || 0), 0),
      refrigerated: allVehicles.filter(v => v.vehicle_type === "refrigerated_truck").length,
    };
  }, [vehicles]);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";
  const inputClass = `w-full px-4 py-3 rounded-xl border-2 ${borderClass} ${cardBgClass} ${textColor} focus:outline-none focus:ring-2 focus:ring-[#429EBD]/50 transition-all`;

  const getVehicleTypeLabel = (type) => {
    const found = vehicleTypes.find(t => t.value === type);
    return found ? found.label : type;
  };

  const getBranchLabel = (vehicle) => {
    const branchVal = vehicle.branch;

    // Try to find by ID/Value match first (String coercion)
    if (branchVal || vehicle.branch_id) {
      const idToMatch = String(vehicle.branch_id || branchVal);
      const branch = branches.find(b => String(b.value) === idToMatch || b.code === idToMatch);
      if (branch) return branch.label;
    }

    // Fallback: if it's a string and looks like a name (not just a short ID), return it
    if (typeof branchVal === 'string' && isNaN(parseInt(branchVal)) && branchVal.length > 2) {
      return branchVal;
    }

    return "-";
  };

  const getVehicleIcon = (type) => {
    const iconColor = theme === "dark" ? "#94a3b8" : "#429EBD";
    const icons = {
      refrigerated_truck: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
          <circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" />
          <path d="M5 8h4" stroke="#22d3ee" strokeWidth="1.5" />
        </svg>
      ),
      delivery_van: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
          <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
          <path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
          <circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" />
        </svg>
      ),
      pickup: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
          <path d="M10 17h4V6H4v11h2" /><path d="M20 17h1a1 1 0 0 0 1-1v-5l-3-4h-4v10h2" />
          <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
      ),
      truck: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
          <path d="M10 17h4V6H4v11h2" /><path d="M20 17h1a1 1 0 0 0 1-1v-5l-3-4h-4v10h2" />
          <circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
        </svg>
      ),
      tanker: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
          <ellipse cx="12" cy="10" rx="9" ry="5" /><path d="M3 10v4c0 2.76 4.03 5 9 5s9-2.24 9-5v-4" />
          <circle cx="6" cy="19" r="2" /><circle cx="18" cy="19" r="2" />
        </svg>
      ),
    };
    return icons[type] || icons.truck;
  };

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      plate_number: vehicle.plate_number || "",
      vehicle_type: vehicle.vehicle_type || "refrigerated_truck",
      driver_name: vehicle.driver_name || "",
      driver_phone: vehicle.driver_phone || "",
      driver_id: vehicle.driver_id || "",
      branch: vehicle.branch || "",
      capacity: vehicle.capacity || 0,
      temperature_min: vehicle.temperature_min || -5,
      temperature_max: vehicle.temperature_max || 8,
      mileage: vehicle.mileage || 0,
      status: vehicle.status || "active",
    });
    setShowModal(true);
  };

  const openDeleteModal = (vehicle) => {
    setDeletingVehicle(vehicle);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Ensure numeric values are valid
    const payload = {
      ...formData,
      capacity: formData.capacity === '' ? 0 : parseInt(formData.capacity),
      driver_id: formData.driver_id ? parseInt(formData.driver_id) : null,
    };

    try {
      if (editingVehicle) {
        try {
          await updateVehicle(editingVehicle.id, payload);
          await loadVehicles();
        } catch (err) {
          setVehicles(prev => prev.map(v => v.id === editingVehicle.id ? { ...v, ...payload } : v));
        }
      } else {
        const newVehicle = {
          id: `veh-${Date.now()}`,
          ...payload,
          temperature_current: payload.temperature_min !== null ? Math.round((payload.temperature_min + payload.temperature_max) / 2) : null,
          last_trip: "-",
          last_maintenance: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString().split('T')[0],
        };
        try {
          await createVehicle(payload);
          await loadVehicles();
        } catch (err) {
          setVehicles(prev => [...prev, newVehicle]);
        }
      }
      setShowModal(false);
      setFormData(initialFormState);
      setEditingVehicle(null);
    } catch (err) {
      console.error(err);
      alert(language === "ar" ? "حدث خطأ أثناء الحفظ" : "Error saving vehicle");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingVehicle) return;

    setSaving(true);
    try {
      try {
        await deleteVehicle(deletingVehicle.id);
        await loadVehicles();
      } catch (err) {
        setVehicles(prev => prev.filter(v => v.id !== deletingVehicle.id));
      }
      setShowDeleteModal(false);
      setDeletingVehicle(null);
    } catch (err) {
      alert(language === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting vehicle");
    } finally {
      setSaving(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#429EBD] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg font-semibold ${textColor}`}>
            {language === "ar" ? "جاري تحميل الشاحنات..." : "Loading vehicles..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className={`text-2xl md:text-4xl font-bold ${textColor} mb-2`}>
            {language === "ar" ? "إدارة الشاحنات والمركبات" : "Vehicles Management"}
          </h2>
          <p className={`text-sm md:text-lg ${subTextColor}`}>
            {language === "ar" ? "إضافة وتعديل وحذف الشاحنات والمركبات وتتبع حالتها" : "Add, edit and delete vehicles and track their status"}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14m-7-7h14" />
          </svg>
          {language === "ar" ? "إضافة مركبة" : "Add Vehicle"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} text-center hover:scale-105 transition-transform`}>
          <div className={`text-2xl font-bold ${textColor}`}>{stats.total}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "إجمالي" : "Total"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 border-emerald-500/30 ${theme === "dark" ? "bg-emerald-500/10" : "bg-emerald-50"} text-center hover:scale-105 transition-transform`}>
          <div className="text-2xl font-bold text-emerald-500">{stats.active}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "نشط" : "Active"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 border-blue-500/30 ${theme === "dark" ? "bg-blue-500/10" : "bg-blue-50"} text-center hover:scale-105 transition-transform`}>
          <div className="text-2xl font-bold text-blue-500">{stats.inTransit}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "في الطريق" : "In Transit"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 border-orange-500/30 ${theme === "dark" ? "bg-orange-500/10" : "bg-orange-50"} text-center hover:scale-105 transition-transform`}>
          <div className="text-2xl font-bold text-orange-500">{stats.maintenance}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "صيانة" : "Maintenance"}</div>
        </div>

        <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} text-center hover:scale-105 transition-transform`}>
          <div className={`text-2xl font-bold text-cyan-500`}>{stats.refrigerated}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "مبردة" : "Refrigerated"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} text-center hover:scale-105 transition-transform`}>
          <div className={`text-xl font-bold text-purple-500`}>{(stats.totalCapacity / 1000).toFixed(1)}K</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "سعة (كجم)" : "Capacity"}</div>
        </div>

      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <svg className={`absolute top-1/2 ${language === "ar" ? "right-4" : "left-4"} transform -translate-y-1/2 ${subTextColor}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder={language === "ar" ? "البحث برقم اللوحة أو اسم السائق..." : "Search by plate or driver..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputClass} ${language === "ar" ? "pr-12" : "pl-12"}`}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={inputClass}
          style={{ width: "auto", minWidth: "150px" }}
        >
          <option value="all">{language === "ar" ? "جميع الأنواع" : "All Types"}</option>
          {vehicleTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={inputClass}
          style={{ width: "auto", minWidth: "150px" }}
        >
          <option value="all">{language === "ar" ? "جميع الحالات" : "All Statuses"}</option>
          <option value="active">{language === "ar" ? "نشط" : "Active"}</option>
          <option value="in_transit">{language === "ar" ? "في الطريق" : "In Transit"}</option>
          <option value="maintenance">{language === "ar" ? "صيانة" : "Maintenance"}</option>

          <option value="inactive">{language === "ar" ? "متوقف" : "Inactive"}</option>
        </select>
      </div>

      {/* Vehicle Cards - Mobile First */}
      <div className="grid grid-cols-1 gap-4">
        {displayVehicles.length === 0 ? (
          <div className={`text-center py-20 ${cardBgClass} rounded-[32px] border-2 border-dashed ${borderClass} opacity-60`}>
            <div className="text-5xl mb-4">🚛</div>
            <p className="font-black text-xl">{language === "ar" ? "لا توجد مركبات" : "No vehicles found"}</p>
            <p className="text-sm">{language === "ar" ? "جرب البحث برقم لوحة آخر" : "Try searching with a different plate"}</p>
          </div>
        ) : (
          displayVehicles.map((vehicle) => {
            const suitability = suitabilityData[vehicle.id];
            return (
              <div key={vehicle.id} className={`group relative rounded-[32px] border-2 ${borderClass} ${cardBgClass} p-5 shadow-xl transition-all duration-300 active:scale-[0.97] overflow-hidden`}>
                {/* Status Indicator Sidebar */}
                <div className={`absolute top-0 bottom-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-1.5 ${vehicle.status === 'active' ? 'bg-emerald-500' :
                    vehicle.status === 'in_transit' ? 'bg-blue-500' :
                      vehicle.status === 'maintenance' ? 'bg-orange-500' : 'bg-slate-400'
                  }`} />

                {/* Card Header: Plate & Type */}
                <div className="relative z-10 flex justify-between items-start mb-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${theme === "dark" ? "bg-slate-800" : "bg-white"} border ${borderClass} shadow-sm group-hover:scale-110 transition-transform`}>
                      {getVehicleIcon(vehicle.vehicle_type)}
                    </div>
                    <div>
                      <h4 className={`text-xl font-black ${textColor} mb-0.5`}>{vehicle.plate_number}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-wider ${subTextColor}`}>
                          {getVehicleTypeLabel(vehicle.vehicle_type)}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span className={`text-[10px] font-bold ${subTextColor}`}>
                          {getBranchLabel(vehicle)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="scale-90 origin-top-right">
                    <StatusBadge status={vehicle.status || "active"} />
                  </div>
                </div>

                {/* Tech Specs Grid */}
                <div className="relative z-10 grid grid-cols-2 gap-4 mb-5">
                  {/* Capacity & Temp */}
                  <div className={`p-4 rounded-2xl ${theme === "dark" ? "bg-white/5" : "bg-slate-50"} border ${borderClass}`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                          </div>
                          <span className={`text-xs font-bold ${textColor}`}>{language === "ar" ? "السعة" : "Capacity"}</span>
                        </div>
                        <span className={`text-xs font-black ${textColor}`}>{(vehicle.capacity || 0).toLocaleString()} <span className="opacity-50 font-medium">kg</span></span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20m0-20l-7 7m7-7l7 7" /></svg>
                          </div>
                          <span className={`text-xs font-bold ${textColor}`}>{language === "ar" ? "حرارة" : "Temp"}</span>
                        </div>
                        <span className={`text-xs font-black ${vehicle.temperature_current < 0 ? 'text-cyan-500' : textColor}`}>
                          {vehicle.temperature_current !== null ? `${vehicle.temperature_current}°C` : '—'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Suitability */}
                  <div className={`p-4 rounded-2xl ${theme === "dark" ? "bg-purple-500/5" : "bg-purple-50"} border ${theme === "dark" ? "border-purple-500/20" : "border-purple-200"} relative overflow-hidden`}>
                    {suitability ? (
                      <>
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[10px] font-black uppercase text-purple-600 tracking-tighter`}>
                            {language === "ar" ? "ملاءمة الذكاء الاصطناعي" : "AI Suitability"}
                          </span>
                          <span className="text-purple-600 font-black text-xs">{Math.round(suitability.score * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-purple-200 dark:bg-purple-900/40 rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-purple-600 rounded-full transition-all duration-1000" style={{ width: `${Math.round(suitability.score * 100)}%` }} />
                        </div>
                        <p className="text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase truncate">
                          {t('vps_' + suitability.category)}
                        </p>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full opacity-40">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-pulse mb-1"><path d="m5 16 7-7 7 7" /></svg>
                        <span className="text-[9px] font-black">{language === 'ar' ? 'تحليل...' : 'Analyzing...'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer: Driver & Actions */}
                <div className="relative z-10 flex items-center justify-between pt-5 border-t-2 border-dashed ${borderClass}">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-lg shadow-inner overflow-hidden">
                      {vehicle.driver_name?.charAt(0) || '👤'}
                    </div>
                    <div>
                      <span className={`text-[9px] font-black uppercase tracking-widest ${subTextColor}`}>{language === "ar" ? "السائق" : "Driver"}</span>
                      <p className={`text-xs font-black ${textColor}`}>{vehicle.driver_name || '—'}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(vehicle)}
                      className={`w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white active:scale-90 transition-all border border-blue-500/20`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button
                      onClick={() => openDeleteModal(vehicle)}
                      className={`w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white active:scale-90 transition-all border border-red-500/20`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
              onClick={() => setShowModal(false)}
            ></div>

            <div className={`relative transform overflow-hidden rounded-2xl ${theme === "dark" ? "bg-slate-900 border border-white/10" : "bg-white"} p-0 text-right shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl animate-scale-in flex flex-col max-h-[90vh]`}>
              {/* Header */}
              <div className={`p-6 border-b ${borderClass} flex items-center justify-between`}>
                <h3 className={`text-2xl font-bold ${textColor}`}>
                  {editingVehicle
                    ? (language === "ar" ? "تعديل المركبة" : "Edit Vehicle")
                    : (language === "ar" ? "إضافة مركبة جديدة" : "Add New Vehicle")
                  }
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className={`text-2xl ${subTextColor} hover:${textColor} transition-colors`}
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <form id="vehicle-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                  {/* Plate Number */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "رقم اللوحة" : "Plate Number"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.plate_number}
                      onChange={(e) => setFormData({ ...formData, plate_number: e.target.value })}
                      placeholder={language === "ar" ? "مثال: صنعاء-1234" : "e.g., SAN-1234"}
                      className={inputClass}
                    />
                  </div>

                  {/* Vehicle Type */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "نوع المركبة" : "Vehicle Type"} <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.vehicle_type}
                      onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                      className={inputClass}
                    >
                      {vehicleTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Driver Selection */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "السائق" : "Driver"}
                    </label>
                    <select
                      value={formData.driver_id}
                      onChange={(e) => {
                        const selectedDriver = drivers.find(d => String(d.value) === e.target.value);
                        setFormData({
                          ...formData,
                          driver_id: e.target.value,
                          driver_name: selectedDriver ? selectedDriver.label : "",
                          driver_phone: selectedDriver ? selectedDriver.phone : ""
                        });
                      }}
                      className={inputClass}
                    >
                      <option value="">{language === "ar" ? "اختر السائق..." : "Select driver..."}</option>
                      {drivers.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Driver Phone (Read Only) */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "هاتف السائق" : "Driver Phone"}
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={formData.driver_phone}
                      className={`${inputClass} opacity-70 cursor-not-allowed`}
                      dir="ltr"
                    />
                  </div>

                  {/* Facility */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "المنشأة" : "Facility"} <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">{language === "ar" ? "اختر المنشأة..." : "Select facility..."}</option>
                      {branches.map(branch => (
                        <option key={branch.value} value={branch.value}>{branch.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "السعة (كجم)" : "Capacity (kg)"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.capacity}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, capacity: val === '' ? '' : parseInt(val) })
                      }}
                      className={inputClass}
                    />
                  </div>

                  {/* Temperature Range (for refrigerated) */}
                  {["refrigerated_truck", "delivery_van"].includes(formData.vehicle_type) && (
                    <div className="md:col-span-2">
                      <label className={`block ${textColor} mb-2 font-medium`}>
                        {language === "ar" ? "نطاق الحرارة (°C)" : "Temperature Range (°C)"}
                      </label>
                      <div className="flex gap-4 items-center">
                        <div className="flex-1">
                          <input
                            type="number"
                            value={formData.temperature_min}
                            onChange={(e) => setFormData({ ...formData, temperature_min: parseInt(e.target.value) || 0 })}
                            className={`${inputClass} text-center`}
                            placeholder={language === "ar" ? "من" : "Min"}
                          />
                        </div>
                        <span className={subTextColor}>~</span>
                        <div className="flex-1">
                          <input
                            type="number"
                            value={formData.temperature_max}
                            onChange={(e) => setFormData({ ...formData, temperature_max: parseInt(e.target.value) || 0 })}
                            className={`${inputClass} text-center`}
                            placeholder={language === "ar" ? "إلى" : "Max"}
                          />
                        </div>
                      </div>
                    </div>
                  )}



                  {/* Mileage */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "عداد المسافة (كم)" : "Mileage (km)"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
                      className={inputClass}
                    />
                  </div>

                  {/* Status */}
                  <div className="md:col-span-2">
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "الحالة" : "Status"}
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { value: "active", label: language === "ar" ? "نشط" : "Active", color: "emerald" },
                        { value: "in_transit", label: language === "ar" ? "في الطريق" : "In Transit", color: "blue" },
                        { value: "maintenance", label: language === "ar" ? "صيانة" : "Maintenance", color: "orange" },

                        { value: "inactive", label: language === "ar" ? "متوقف" : "Inactive", color: "gray" },
                      ].map(status => (
                        <label
                          key={status.value}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${formData.status === status.value
                            ? `border-${status.color}-500 bg-${status.color}-500/20 shadow-sm`
                            : `${borderClass} ${cardBgClass} hover:border-amber-500/40`
                            }`}
                        >
                          <input
                            type="radio"
                            name="status"
                            value={status.value}
                            checked={formData.status === status.value}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="sr-only"
                          />
                          <span className={`w-3 h-3 rounded-full bg-${status.color}-500`}></span>
                          <span className={textColor}>{status.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div className={`p-6 border-t ${borderClass} flex gap-3`}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 ${borderClass} ${textColor} hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold`}
                >
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  form="vehicle-form"
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-bold"
                >
                  {saving
                    ? (language === "ar" ? "جاري الحفظ..." : "Saving...")
                    : (editingVehicle
                      ? (language === "ar" ? "حفظ التعديلات" : "Save Changes")
                      : (language === "ar" ? "إضافة المركبة" : "Add Vehicle")
                    )
                  }
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingVehicle && createPortal(
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
              onClick={() => setShowDeleteModal(false)}
            ></div>

            <div className={`relative transform overflow-hidden rounded-2xl ${theme === "dark" ? "bg-slate-900 border border-white/10" : "bg-white"} p-0 text-right shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-md animate-scale-in`}>
              <div className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <h3 className={`text-2xl font-bold ${textColor} mb-3`}>
                  {language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
                </h3>
                <p className={`${subTextColor} text-lg leading-relaxed`}>
                  {language === "ar"
                    ? `هل أنت متأكد من حذف المركبة "${deletingVehicle.plate_number}"؟ لا يمكن التراجع عن هذا الإجراء.`
                    : `Are you sure you want to delete vehicle "${deletingVehicle.plate_number}"? This action cannot be undone.`
                  }
                </p>

                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className={`flex-1 px-4 py-3 rounded-xl border-2 ${borderClass} ${textColor} hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold`}
                  >
                    {language === "ar" ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-xl disabled:opacity-50 transition-all font-bold"
                  >
                    {saving
                      ? (language === "ar" ? "جاري الحذف..." : "Deleting...")
                      : (language === "ar" ? "نعم، احذف" : "Yes, Delete")
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default VehiclesManagement;

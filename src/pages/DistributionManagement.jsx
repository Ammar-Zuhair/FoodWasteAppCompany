import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useOrders } from "../hooks/useOrders.js";
import {
  useDistributeOrder,
  useOptimizeRoute,
} from "../hooks/useDistribution.js";
import StatusBadge from "../components/shared/StatusBadge.jsx";
import { getStoredUser } from "../utils/api/auth.js";
import { getGovernorates } from "../utils/api/data.js";
import InteractiveMap from "../components/digitaltwin/InteractiveMap.jsx";

function DistributionManagement({ user: propUser }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const storedUser = getStoredUser();
  const user = propUser || (storedUser ? {
    id: storedUser.id,
    organization_id: storedUser.organization_id,
    role: storedUser.role,
  } : null);

  const [expandedOrderId, setExpandedOrderId] = useState(null); // For dropdown

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [distributionMode, setDistributionMode] = useState("auto");
  const [showMap, setShowMap] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [governorates, setGovernorates] = useState([]);

  const { orders: realOrders, loading, error, reload } = useOrders({
    organization_id: user?.organization_id,
  });

  const { distribute, loading: distributing } = useDistributeOrder();
  const { optimize, loading: optimizing } = useOptimizeRoute();

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const govList = await getGovernorates();
        setGovernorates(govList);
      } catch (err) {
        console.error("Failed to fetch governorates", err);
      }
    };
    fetchLookups();
  }, []);

  // Status mapping for viewing
  const getStatusCategory = (status) => {
    const code = status?.code || status;
    if (["delivered", "completed"].includes(code)) return "delivered";
    if (["in_transit", "dispatched", "shipped"].includes(code)) return "in_transit";
    return "not_delivered"; // pending, confirmed, allocated, processing, etc.
  };

  const getStatusLabel = (category) => {
    if (category === "delivered") return language === "ar" ? "تم التسليم" : "Delivered";
    if (category === "in_transit") return language === "ar" ? "في الطريق" : "In Transit";
    return language === "ar" ? "لم يتم التسليم" : "Not Delivered";
  };

  // Filter orders based on state
  const filteredOrders = useMemo(() => {
    return (realOrders || []).filter((order) => {
      const matchesSearch =
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.facility?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const category = getStatusCategory(order.status);
      const matchesStatus = selectedStatus === "all" || category === selectedStatus;

      // City filtering - check facility governorate (both AR and EN) or extra_data
      const govAr = (order.facility?.governorate?.name_ar || "").trim().toLowerCase();
      const govEn = (order.facility?.governorate?.name_en || "").trim().toLowerCase();
      const extraCity = (order.facility?.extra_data?.city || "").trim().toLowerCase();
      const target = (selectedCity || "").trim().toLowerCase();

      const matchesCity = selectedCity === "all" ||
        govAr === target ||
        govEn === target ||
        extraCity === target ||
        govAr.includes(target) ||
        govEn.includes(target) ||
        extraCity.includes(target);

      return matchesSearch && matchesStatus && matchesCity;
    });
  }, [realOrders, searchTerm, selectedStatus, selectedCity]);

  // Extract unique cities from lookups if available, otherwise from orders
  const cities = useMemo(() => {
    if (governorates.length > 0) {
      return governorates.map(g => language === "ar" ? g.name_ar : g.name_en);
    }
    const citySet = new Set();
    (realOrders || []).forEach(o => {
      const city = o.facility?.governorate?.name_ar || o.facility?.extra_data?.city;
      if (city) citySet.add(city);
    });
    return Array.from(citySet);
  }, [realOrders, governorates, language]);

  // Stats
  const stats = useMemo(() => {
    const data = realOrders || [];
    return {
      total: data.length,
      not_delivered: data.filter(o => getStatusCategory(o.status) === "not_delivered").length,
      in_transit: data.filter(o => getStatusCategory(o.status) === "in_transit").length,
      delivered: data.filter(o => getStatusCategory(o.status) === "delivered").length,
      urgent: data.filter(o => o.priority === "urgent" || o.priority?.code === "urgent").length,
      totalValue: data.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
    };
  }, [realOrders]);

  const handleDistribute = async (orderId) => {
    try {
      const result = await distribute(orderId, distributionMode);
      alert(language === "ar" ? "تم التوزيع بنجاح" : `Order distributed: ${result.message || "Success"}`);
      reload();
    } catch (err) {
      alert(err.message || "Error distributing order");
    }
  };

  const handleOptimizeRoute = async () => {
    if (selectedOrders.length === 0) {
      alert(language === "ar" ? "يرجى اختيار الطلبات أولاً" : "Please select orders to optimize route");
      return;
    }
    try {
      const result = await optimize(selectedOrders);
      if (!result || !result.route || result.route.length === 0) {
        alert(language === "ar" ? "لم يتم العثور على مسار صالح لهذه الطلبات" : "No valid route found for these orders");
        return;
      }
      setOptimizationResult(result);
      setShowMap(true);
    } catch (err) {
      alert(err.message || "Error optimizing route");
    }
  };

  const toggleOrderSelection = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Toggle row expansion
  const toggleRow = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const mapLocations = useMemo(() => {
    if (!optimizationResult || !optimizationResult.route) return [];
    return optimizationResult.route.map(stop => ({
      id: stop.id,
      name: stop.name,
      type: stop.type === "source" ? "warehouse" : "supermarket",
      latitude: stop.lat,
      longitude: stop.lng,
      status: stop.type === "source" ? "active" : "warning",
      capacity: stop.type === "source" ? 10000 : 500
    }));
  }, [optimizationResult]);

  return (
    <div className={`space-y-4 sm:space-y-5 md:space-y-6`} dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold ${textColor} tracking-tight`}>
            {language === "ar" ? "إدارة التوزيع وتحسين المسار" : "Distribution & Route Optimization"}
          </h2>
          <p className={`text-xs sm:text-sm ${subTextColor} font-medium mt-1`}>
            {language === "ar" ? "إدارة ذكية لعمليات التوزيع وتتبع المسارات" : "Smart distribution management and route tracking"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMap(!showMap)}
            className={`px-4 py-2.5 rounded-xl border-2 flex items-center gap-2 transition-all duration-300 font-bold ${showMap ? 'bg-[#429EBD] text-white border-[#429EBD]' : `${cardBgClass} ${textColor} ${borderClass} hover:border-[#429EBD]`
              }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            {language === "ar" ? "عرض الخريطة" : "Show Map"}
          </button>
          <button
            onClick={reload}
            className={`p-2.5 rounded-xl border-2 ${borderClass} ${cardBgClass} ${textColor} hover:border-[#429EBD] transition-all duration-300`}
          >
            <svg className={loading ? "animate-spin" : ""} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 12a9 9 0 1 1-6.219-8.56" /><path d="M20 4v5h-5" /></svg>
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: language === "ar" ? "الإجمالي" : "Total", value: stats.total, color: "blue", icon: "M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" },
          { label: language === "ar" ? "لم يتم التسليم" : "Not Delivered", value: stats.not_delivered, color: "amber", icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
          { label: language === "ar" ? "في الطريق" : "In Transit", value: stats.in_transit, color: "purple", icon: "M10 17h4m-2 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM2 3h16l4 7v8a2 2 0 0 1-2 2h-1M5 17h2" },
          { label: language === "ar" ? "تم التسليم" : "Delivered", value: stats.delivered, color: "emerald", icon: "M20 6 9 17l-5-5" },
          { label: language === "ar" ? "عاجل" : "Urgent", value: stats.urgent, color: "red", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" },
          { label: language === "ar" ? "إجمالي القيمة" : "Value", value: stats.totalValue.toLocaleString(), color: "sky", icon: "M12 1v22m5-18H8.5a4.5 4.5 0 0 0 0 9h7a4.5 4.5 0 0 1 0 9H7" }
        ].map((s, i) => (
          <div key={i} className={`p-4 rounded-2xl border-2 ${borderClass} ${cardBgClass} flex items-center gap-4 group hover:scale-[1.02] transition-transform`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-${s.color}-500/10 text-${s.color}-500`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d={s.icon} /></svg>
            </div>
            <div>
              <div className={`text-2xl font-black ${textColor}`}>{s.value}</div>
              <div className={`text-xs font-bold ${subTextColor}`}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Map Integration */}
      {showMap && (
        <div className={`rounded-2xl border-2 ${borderClass} overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300`}>
          <div className={`px-6 py-4 border-b ${borderClass} ${cardBgClass} flex items-center justify-between`}>
            <div>
              <h3 className={`text-lg font-bold ${textColor}`}>
                {language === "ar" ? "تتبع وتحسين المسارات" : "Route Tracking & Optimization"}
              </h3>
              {optimizationResult && (
                <p className="text-xs text-emerald-500 font-bold">
                  {language === "ar" ? `المسافة الإجمالية: ${optimizationResult.total_distance_km} كم` : `Total Distance: ${optimizationResult.total_distance_km} km`}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowMap(false)}
              className={`p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors`}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="h-[600px] relative">
            <InteractiveMap
              locations={mapLocations}
              showRoute={!!optimizationResult}
              onLocationClick={(loc) => console.log("Clicked:", loc)}
            />
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className={`p-4 rounded-2xl border-2 ${borderClass} ${cardBgClass} flex flex-wrap items-center gap-4 backdrop-blur-md`}>
        <div className="flex gap-2">
          <button onClick={handleOptimizeRoute} disabled={selectedOrders.length === 0 || optimizing}
            className="px-6 py-3 bg-gradient-to-r from-[#429EBD] to-[#2d7a9a] text-white rounded-xl hover:shadow-lg disabled:opacity-50 font-black flex items-center gap-2 transform active:scale-95 transition-all">
            <svg className={optimizing ? "animate-spin" : ""} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /></svg>
            {language === "ar" ? "تحسين المسار" : "Optimize Route"}
            {selectedOrders.length > 0 && <span className="bg-white text-[#053F5C] px-2 py-0.5 rounded-full text-xs">{selectedOrders.length}</span>}
          </button>
        </div>

        <div className="h-8 w-[2px] bg-slate-400/20 hidden md:block" />

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)}
              className={`pl-10 pr-4 py-2.5 rounded-xl border-2 ${borderClass} ${cardBgClass} ${textColor} font-bold appearance-none focus:border-[#429EBD] transition-all outline-none`}>
              <option value="all">{language === "ar" ? "كل المدن" : "All Cities"}</option>
              {cities.map(city => <option key={city} value={city}>{city}</option>)}
            </select>
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${subTextColor}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
          </div>

          <div className="relative">
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
              className={`pl-10 pr-4 py-2.5 rounded-xl border-2 ${borderClass} ${cardBgClass} ${textColor} font-bold appearance-none focus:border-[#429EBD] outline-none`}>
              <option value="all">{language === "ar" ? "كل الحالات" : "All Status"}</option>
              <option value="not_delivered">{language === "ar" ? "لم يتم التسليم" : "Not Delivered"}</option>
              <option value="in_transit">{language === "ar" ? "في الطريق" : "In Transit"}</option>
              <option value="delivered">{language === "ar" ? "تم التسليم" : "Delivered"}</option>
            </select>
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 ${subTextColor}`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <input type="text" placeholder={language === "ar" ? "بحث برقم الطلب أو المتجر..." : "Search ID or Store..."}
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-12 pr-4 py-2.5 rounded-xl border-2 ${borderClass} ${cardBgClass} ${textColor} font-bold focus:border-[#429EBD] outline-none transition-all placeholder:text-slate-400`} />
          <svg className={`absolute left-4 top-1/2 -translate-y-1/2 ${subTextColor}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
        </div>
      </div>

      {/* Orders Table */}
      <div className={`rounded-2xl border-2 ${borderClass} ${cardBgClass} overflow-hidden shadow-xl`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${theme === "dark" ? "bg-slate-800/50" : "bg-slate-100/50"}`}>
                <th className="px-6 py-4 text-center w-12">
                  <input type="checkbox" checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                    onChange={(e) => setSelectedOrders(e.target.checked ? filteredOrders.map(o => o.id) : [])}
                    className="w-5 h-5 rounded-md border-2 border-slate-300 text-[#429EBD] focus:ring-[#429EBD]" />
                </th>
                <th className={`px-6 py-4 text-right ${textColor} font-black text-xs uppercase tracking-wider`}>{language === "ar" ? "رقم الطلب" : "Order ID"}</th>
                {/* استبدلنا اسم المنتج بموعد التسليم */}
                <th className={`px-6 py-4 text-right ${textColor} font-black text-xs uppercase tracking-wider`}>{language === "ar" ? "موعد التسليم المتوقع" : "Exp. Delivery"}</th>
                <th className={`px-6 py-4 text-right ${textColor} font-black text-xs uppercase tracking-wider`}>{language === "ar" ? "الوجهة" : "Destination"}</th>
                <th className={`px-6 py-4 text-center ${textColor} font-black text-xs uppercase tracking-wider`}>{language === "ar" ? "الأولوية" : "Priority"}</th>
                <th className={`px-6 py-4 text-center ${textColor} font-black text-xs uppercase tracking-wider`}>{language === "ar" ? "عدد العناصر" : "Items Count"}</th>
                <th className={`px-6 py-4 text-right ${textColor} font-black text-xs uppercase tracking-wider`}>{language === "ar" ? "المبلغ" : "Amount"}</th>
                <th className={`px-6 py-4 text-center ${textColor} font-black text-xs uppercase tracking-wider`}>{language === "ar" ? "الحالة" : "Status"}</th>
                <th className={`px-6 py-4 text-center ${textColor} font-black text-xs uppercase tracking-wider`}>{language === "ar" ? "إجراء" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-400/10">
              {loading ? (
                <tr><td colSpan={9} className={`px-6 py-12 text-center ${subTextColor} font-bold animate-pulse`}>{language === "ar" ? "جاري تحميل البيانات..." : "Loading data..."}</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={9} className={`px-6 py-12 text-center ${subTextColor} font-bold`}>{language === "ar" ? "لا توجد طلبات مطابقة" : "No orders found"}</td></tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedOrders.includes(order.id);
                  const isUrgent = order.priority === "urgent" || order.priority?.code === "urgent";
                  const isExpanded = expandedOrderId === order.id;

                  return (
                    <React.Fragment key={order.id}>
                      <tr
                        className={`group hover:${theme === "dark" ? "bg-white/5" : "bg-slate-50"} transition-all cursor-pointer ${isSelected ? (theme === "dark" ? "bg-[#429EBD]/10" : "bg-[#429EBD]/5") : ""}`}
                        onClick={() => toggleRow(order.id)}
                      >
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" checked={isSelected} onChange={() => toggleOrderSelection(order.id)}
                            className="w-5 h-5 rounded-md border-2 border-slate-300 text-[#429EBD] focus:ring-[#429EBD]" />
                        </td>
                        <td className="px-6 py-4">
                          <div className={`font-mono text-sm font-black flex items-center gap-2 ${textColor}`}>
                            <span className={`transform transition-transform ${isExpanded ? "rotate-90 text-[#429EBD]" : "text-slate-400"}`}>▶</span>
                            #{order.order_number}
                          </div>
                          <div className={`text-[10px] ${subTextColor} uppercase font-bold`}>{new Date(order.order_date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}</div>
                        </td>
                        {/* عمود موعد التسليم بدلاً من المنتج */}
                        <td className="px-6 py-4">
                          <div className={`text-sm font-bold ${textColor}`}>
                            {order.requested_delivery_date ? new Date(order.requested_delivery_date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US") : "-"}
                          </div>
                          <div className={`text-xs ${subTextColor}`}>
                            {order.requested_delivery_date ? (language === "ar" ? "حسب الطلب" : "Requested") : ""}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`font-bold ${textColor}`}>
                            {order.facility?.name || (language === "ar" ? "غير معروف" : "Unknown")}
                          </div>
                          <div className={`text-xs ${subTextColor}`}>
                            {order.facility?.governorate?.name_ar || order.facility?.governorate?.name_en || order.facility?.extra_data?.city || (language === "ar" ? "غير محدد" : "N/A")}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isUrgent ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-blue-500/10 text-blue-500 border border-blue-500/20"}`}>
                            {isUrgent ? (language === "ar" ? "عاجل" : "Urgent") : (language === "ar" ? "عادي" : "Normal")}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className={`font-bold ${textColor} text-lg`}>{order.items?.length || 0}</div>
                          <div className={`text-[10px] ${subTextColor}`}>{language === "ar" ? "منتج" : "Items"}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`font-black ${textColor}`}>{(parseFloat(order.total_amount) || 0).toLocaleString()}</div>
                          <div className={`text-[10px] ${subTextColor} uppercase`}>{language === "ar" ? "ر.ي" : "YER"}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {/* عرض الحالة المبسطة */}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusCategory(order.status) === "delivered" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" :
                            getStatusCategory(order.status) === "in_transit" ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                              "bg-amber-500/10 text-amber-500 border-amber-500/20"
                            }`}>
                            {getStatusLabel(getStatusCategory(order.status))}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDistribute(order.id)}
                              className="p-2 rounded-lg bg-[#429EBD] text-white hover:bg-[#2d7a9a] transition-colors" title={language === "ar" ? "توزيع الطلب" : "Distribute"}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* الصف المنسدل لتفاصيل المنتجات */}
                      {isExpanded && (
                        <tr className={`${theme === "dark" ? "bg-slate-800/30" : "bg-slate-50"} animate-in fade-in`}>
                          <td colSpan="9" className="p-4 cursor-default">
                            <div className={`rounded-xl border ${borderClass} p-4 ${theme === "dark" ? "bg-slate-900/50" : "bg-white/80"}`} onClick={(e) => e.stopPropagation()}>
                              <h4 className={`font-bold ${textColor} mb-4 flex items-center gap-2 text-sm`}>
                                📦 {language === "ar" ? "قائمة المنتجات المطلوبة" : "Requested Products List"}
                                <span className="text-xs font-normal text-slate-400">({order.items?.length || 0})</span>
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {order.items?.map((item, idx) => (
                                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border ${borderClass} ${theme === "dark" ? "bg-slate-800" : "bg-white"}`}>
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${theme === "dark" ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                                      {idx + 1}
                                    </div>
                                    <div className="flex-1">
                                      <div className={`font-bold text-sm ${textColor}`}>{item.product_name}</div>
                                      <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "سعر الوحدة:" : "Unit Price:"} {item.unit_price}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-emerald-500 font-black text-lg">{item.quantity}</div>
                                      <div className={`text-[10px] ${subTextColor}`}>{language === "ar" ? "الكمية" : "Qty"}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DistributionManagement;


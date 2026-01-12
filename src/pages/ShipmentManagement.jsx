import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useShipments, useCreateShipment } from "../hooks/useShipments.js";
import { getShipment, checkDeliveryReadiness } from "../utils/api/shipments.js";
import { checkVehicleOrderCompatibility, getVehicles } from "../utils/api/vehicles.js";
import { getOrganizations } from "../utils/api/organizations.js";
import { getFacilities } from "../utils/api/facilities.js";
import { getDrivers } from "../utils/api/drivers.js";
import { getOrders, getOrder } from "../utils/api/orders.js";
import StatusBadge from "../components/shared/StatusBadge.jsx";
import { getStoredUser } from "../utils/api/auth.js";
import SearchableSelect from "../components/shared/SearchableSelect.jsx";


function ShipmentManagement({ user: propUser }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const storedUser = getStoredUser();
  const user = propUser || (storedUser ? {
    id: storedUser.id,
    organization_id: storedUser.organization_id,
    role: storedUser.role,
  } : null);

  const { shipments, loading, error, reload } = useShipments({}, { autoLoad: true });
  const { create, loading: creating } = useCreateShipment();
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false); // Changed from Modal to Inline Form
  const [localError, setLocalError] = useState(null);
  const [checkingDelivery, setCheckingDelivery] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [itemsModal, setItemsModal] = useState({ open: false, loading: false, shipment: null });
  const [mapModal, setMapModal] = useState({ open: false, lat: null, lng: null, driver: null, from: null, to: null });
  const [compatibility, setCompatibility] = useState({ result: null, loading: false });

  // Data Lists State
  const [organizations, setOrganizations] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [orders, setOrders] = useState([]);
  const [listsLoading, setListsLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    organizationId: "",
    fromFacilityId: "",
    toFacilityId: "",
    driverId: "",
    vehicleId: "",
    orderIds: [], // Changed to array
    items: [], // Auto-filled from orders
  });

  const [selectedOrdersList, setSelectedOrdersList] = useState([]); // To display selected orders

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  // Fetch Lists
  useEffect(() => {
    const fetchData = async () => {
      setListsLoading(true);
      try {
        // Only admin might need organizations, but good to fetch
        if (user?.role === 'ADMIN') {
          const orgs = await getOrganizations();
          setOrganizations(orgs);
        }

        const facilitiesData = await getFacilities({ organization_id: user?.organization_id });
        setFacilities(facilitiesData);

        const driversData = await getDrivers({ organization_id: user?.organization_id });
        setDrivers(driversData);

        const vehiclesData = await getVehicles({ organization_id: user?.organization_id });
        setVehicles(vehiclesData);

        const ordersData = await getOrders({ organization_id: user?.organization_id, status: 'confirmed' }); // Only confirmed/allocated orders
        setOrders(ordersData.orders || []);
      } catch (err) {
        console.error("Error fetching form data:", err);
      } finally {
        setListsLoading(false);
      }
    };

    if (showCreateForm) {
      fetchData();
    }
  }, [showCreateForm, user]);

  // Handle Order Addition
  const handleAddOrder = async (orderId) => {
    if (!orderId) return;
    if (formData.orderIds.includes(orderId)) return; // Already added

    try {
      setListsLoading(true);
      // Fetch full order details to get items/batches
      const order = await getOrders({}).then(res => res.orders.find(o => o.id === orderId)); // Or use getOrder(id) if available and imported
      // Actually we need getOrder(id) to get batch allocations if list doesn't have them
      // But let's assume getOrders list has enough info or fetch via getOrder if imported. 
      // I need to import getOrder. 
      // For now, let's just add it to list and rely on backend resolving items? 
      // No, create_shipment requires `items` list with batch_id.
      // So I MUST fetch order details.

      // Fetch full order details to get items/batches
      // We use getOrder(id) imported above to get batch allocations
      const fullOrder = await getOrder(orderId);

      if (!fullOrder) return;

      // Extract items from batch_allocations
      const newItems = [];
      fullOrder.items?.forEach(item => {
        if (item.batch_allocations) {
          item.batch_allocations.forEach(alloc => {
            newItems.push({
              batchId: alloc.batch_id,
              quantity: alloc.quantity,
              // inventoryPositionId is auto-resolved by backend now
            });
          });
        }
      });

      if (newItems.length === 0) {
        alert(language === "ar" ? "هذا الطلب لا يحتوي على دفعات مخصصة." : "This order has no allocated batches.");
        return;
      }

      setSelectedOrdersList([...selectedOrdersList, fullOrder]);
      setFormData(prev => ({
        ...prev,
        orderIds: [...prev.orderIds, orderId],
        items: [...prev.items, ...newItems]
      }));

    } catch (err) {
      console.error("Error adding order:", err);
      setLocalError("Failed to add order");
    } finally {
      setListsLoading(false);
    }
  };

  const handleRemoveOrder = (orderId) => {
    const orderToRemove = selectedOrdersList.find(o => o.id === orderId);
    if (!orderToRemove) return;

    // Remove items associated with this order... wait, how do we know which items?
    // We didn't link items to orderId in formData.items.
    // Simplest way: Re-generate items from remaining orders.
    const newOrdersList = selectedOrdersList.filter(o => o.id !== orderId);

    // Re-aggregate items
    const reAggregatedItems = [];
    newOrdersList.forEach(order => {
      order.items?.forEach(item => {
        item.batch_allocations?.forEach(alloc => {
          reAggregatedItems.push({
            batchId: alloc.batch_id,
            quantity: alloc.quantity
          });
        });
      });
    });

    setSelectedOrdersList(newOrdersList);
    setFormData(prev => ({
      ...prev,
      orderIds: prev.orderIds.filter(id => id !== orderId),
      items: reAggregatedItems
    }));
  };

  // Check compatibility (using first order for now or sum?)
  useEffect(() => {
    const checkSuitability = async () => {
      if (formData.vehicleId && formData.orderIds.length > 0) {
        setCompatibility({ result: null, loading: true });
        try {
          // Check against the first order as proxy
          const res = await checkVehicleOrderCompatibility(formData.vehicleId, formData.orderIds[0]);
          setCompatibility({ result: res, loading: false });
        } catch (err) {
          console.error("Compatibility check failed:", err);
          setCompatibility({ result: null, loading: false });
        }
      } else {
        setCompatibility({ result: null, loading: false });
      }
    };

    const timer = setTimeout(checkSuitability, 500);
    return () => clearTimeout(timer);
  }, [formData.vehicleId, formData.orderIds]);

  // Stats - use real API data
  const stats = useMemo(() => {
    if (!shipments || shipments.length === 0) {
      return {
        total: 0,
        pending: 0,
        inTransit: 0,
        delivered: 0,
        totalItems: 0,
        totalDistance: 0,
      };
    }
    return {
      total: shipments.length,
      pending: shipments.filter(s => s.status === "pending").length,
      inTransit: shipments.filter(s => s.status === "in_transit").length,
      delivered: shipments.filter(s => s.status === "delivered").length,
      totalItems: shipments.reduce((sum, s) => sum + (s.items_count || s.items?.length || 0), 0),
      totalDistance: shipments.reduce((sum, s) => sum + (s.distance || 0), 0),
    };
  }, [shipments]);

  // Filtered shipments - use real API data
  const filteredShipments = useMemo(() => {
    if (!shipments || shipments.length === 0) return [];
    return shipments.filter(s => {
      const matchesSearch = s.shipment_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.from_facility?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.to_facility?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [shipments, searchTerm, statusFilter]);

  const handleCreateShipment = async (e) => {
    e.preventDefault();
    setLocalError(null);

    try {
      const items = formData.items.map(item => ({
        batch_id: item.batchId,
        // inventory_position_id: item.inventoryPositionId, // Optional now
        quantity: parseFloat(item.quantity),
      }));

      if (items.length === 0) {
        throw new Error(language === "ar" ? "يجب اختيار طلب يحتوي على عناصر" : "Must select an order with items");
      }

      const result = await create({
        organizationId: formData.organizationId || user?.organization_id,
        fromFacilityId: formData.fromFacilityId,
        toFacilityId: formData.toFacilityId,
        driverId: formData.driverId || null,
        vehicleId: formData.vehicleId || null,
        orderIds: formData.orderIds, // Send list
        items: items,
      });

      alert(`تم إنشاء الشحنة بنجاح!\nرقم الشحنة: ${result.shipment_number}`);

      setShowCreateForm(false);
      setFormData({
        organizationId: "",
        fromFacilityId: "",
        toFacilityId: "",
        driverId: "",
        vehicleId: "",
        orderIds: [],
        items: [],
      });
      setSelectedOrdersList([]);

      await reload(); // Refresh shipments list
    } catch (err) {
      setLocalError(err.message || "حدث خطأ أثناء إنشاء الشحنة");
      console.error("Error creating shipment:", err);
    }
  };



  const handleViewShipment = async (shipmentId) => {
    try {
      setItemsModal({ open: true, loading: true, shipment: null });
      const shipment = await getShipment(shipmentId);
      setItemsModal({ open: true, loading: false, shipment });
    } catch (err) {
      setLocalError(err.message || "حدث خطأ أثناء جلب بيانات الشحنة");
      setItemsModal({ open: false, loading: false, shipment: null });
    }
  };

  const handleCheckDelivery = async (shipmentId) => {
    try {
      setCheckingDelivery(true);
      const result = await checkDeliveryReadiness(shipmentId);

      if (result.can_deliver) {
        alert(`✅ الشحنة جاهزة للتسليم\nالعناصر: ${result.items_count}\nالتحذيرات: ${result.warnings_count}`);
      } else {
        alert(`❌ الشحنة غير جاهزة للتسليم\nالعناصر المرفوضة: ${result.rejected_count}\nالتحذيرات: ${result.warnings_count}`);
      }
    } catch (err) {
      setLocalError(err.message || "حدث خطأ أثناء فحص جاهزية التسليم");
    } finally {
      setCheckingDelivery(false);
    }
  };

  return (
    <div className={`space-y-4 sm:space-y-5 md:space-y-6`} dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className={`text-2xl md:text-4xl font-bold ${textColor} mb-2`}>
              {language === "ar" ? "إدارة الشحنات" : "Shipment Management"}
            </h2>
            <p className={`text-sm md:text-lg ${subTextColor}`}>
              {language === "ar" ? "إنشاء وتتبع الشحنات" : "Create and track shipments"}
            </p>
          </div>
          <button onClick={() => setShowCreateForm(!showCreateForm)}
            className={`px-5 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-[#429EBD] to-[#2d7a9a] text-white hover:opacity-90 flex items-center gap-2 transition-all ${showCreateForm ? 'ring-2 ring-offset-2 ring-[#429EBD]' : ''}`}>
            {showCreateForm ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            )}
            {showCreateForm ? (language === "ar" ? "إلغاء" : "Cancel") : (language === "ar" ? "شحنة جديدة" : "New Shipment")}
          </button>
        </div>

        {/* Inline Create Form */}
        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showCreateForm ? 'max-h-[2000px] opacity-100 mt-6' : 'max-h-0 opacity-0'}`}>
          <div className={`${cardBgClass} rounded-xl border-2 ${borderClass} p-6 shadow-xl`}>
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
              <h3 className={`text-xl font-bold ${textColor}`}>
                {t("createNewShipment") || "إنشاء شحنة جديدة"}
              </h3>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {user?.role === 'ADMIN' && (
                  <div>
                    <SearchableSelect
                      label={language === "ar" ? "المنظمة" : "Organization"}
                      items={organizations}
                      value={formData.organizationId}
                      onChange={(val) => setFormData({ ...formData, organizationId: val })}
                      placeholder={language === "ar" ? "اختر المنظمة..." : "Select Organization..."}
                      required
                      loading={listsLoading}
                    />
                  </div>
                )}

                <div>
                  <SearchableSelect
                    label={language === "ar" ? "من المنشأة" : "From Facility"}
                    items={facilities}
                    value={formData.fromFacilityId}
                    onChange={(val) => setFormData({ ...formData, fromFacilityId: val })}
                    placeholder={language === "ar" ? "ابحث عن المنشأة..." : "Search Facility..."}
                    required
                    loading={listsLoading}
                  />
                </div>

                <div>
                  <SearchableSelect
                    label={language === "ar" ? "إلى المنشأة" : "To Facility"}
                    items={facilities}
                    value={formData.toFacilityId}
                    onChange={(val) => setFormData({ ...formData, toFacilityId: val })}
                    placeholder={language === "ar" ? "ابحث عن المنشأة..." : "Search Facility..."}
                    required
                    loading={listsLoading}
                  />
                </div>

                <div>
                  <SearchableSelect
                    label={language === "ar" ? "السائق (اختياري)" : "Driver (Optional)"}
                    items={drivers}
                    value={formData.driverId}
                    onChange={(val) => setFormData({ ...formData, driverId: val })}
                    placeholder={language === "ar" ? "ابحث عن السائق..." : "Search Driver..."}
                    loading={listsLoading}
                  />
                </div>

                <div>
                  <SearchableSelect
                    label={language === "ar" ? "المركبة (اختياري)" : "Vehicle (Optional)"}
                    items={vehicles}
                    value={formData.vehicleId}
                    onChange={(val) => setFormData({ ...formData, vehicleId: val })}
                    displayKey="plate_number" // Assuming vehicle has plate_number
                    placeholder={language === "ar" ? "ابحث عن المركبة..." : "Search Vehicle..."}
                    loading={listsLoading}
                  />
                </div>

                <div className="md:col-span-2 lg:col-span-1 space-y-2">
                  <SearchableSelect
                    label={language === "ar" ? "أضف طلبات إلى الشحنة" : "Add Orders to Shipment"}
                    items={orders.map(o => ({ ...o, displayName: `${o.order_number} (${o.status}) - ${new Date(o.order_date).toLocaleDateString()}` }))}
                    value={null} // Always reset
                    onChange={(val) => handleAddOrder(val)}
                    displayKey="displayName"
                    placeholder={language === "ar" ? "اختر طلب لإضافته..." : "Select Order to add..."}
                    loading={listsLoading}
                  />

                  {/* Selected Orders List */}
                  {selectedOrdersList.length > 0 && (
                    <div className="space-y-2 mt-2">
                      <label className={`block text-sm font-medium ${subTextColor}`}>
                        {language === "ar" ? "الطلبات المختارة:" : "Selected Orders:"}
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedOrdersList.map(order => (
                          <div key={order.id} className={`flex items-center justify-between p-2 rounded-lg border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div>
                              <div className={`font-bold text-sm ${textColor}`}>{order.order_number}</div>
                              <div className={`text-xs ${subTextColor}`}>{order.items?.length || 0} {language === "ar" ? "عناصر" : "items"}</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveOrder(order.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Compatibility Result */}
              {(formData.vehicleId && formData.orderIds.length > 0) && (
                <div className={`p-4 rounded-xl border-2 ${compatibility.loading ? 'border-blue-500/30' : (compatibility.result?.can_transport_all ? 'border-emerald-500/30' : 'border-amber-500/30')} ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className={`font-bold flex items-center gap-2 ${textColor}`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16V12" /><path d="M12 8h.01" /></svg>
                      {language === "ar" ? "توافق الذكاء الاصطناعي" : "AI Compatibility Check"}
                    </h4>
                    {compatibility.loading ? (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    ) : compatibility.result && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${compatibility.result.can_transport_all ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                        {compatibility.result.can_transport_all
                          ? (language === "ar" ? "متوافق تماماً" : "fully compatible")
                          : (language === "ar" ? "تحذير عدم توافق" : "compatibility warning")}
                      </span>
                    )}
                  </div>
                  {!compatibility.loading && compatibility.result && (
                    <div className="space-y-1">
                      {compatibility.result.category_details?.map((detail, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className={subTextColor}>
                            {t('vps_' + detail.model_category) || detail.category}
                          </span>
                          <span className={`font-bold ${detail.is_suitable ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {Math.round(detail.suitability_score * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {!compatibility.loading && !compatibility.result && (
                    <p className={`text-xs ${subTextColor}`}>
                      {language === "ar" ? "جاري التحقق من ملاءمة المركبة لهذا الطلب..." : "Analyzing vehicle suitability for this order..."}
                    </p>
                  )}
                </div>
              )}

              {/* Items Section (Only if needed manually) */}


              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${theme === "dark"
                    ? "bg-slate-700 hover:bg-slate-600 text-white"
                    : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                    }`}
                >
                  {t("cancel") || "إلغاء"}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all duration-200 ${theme === "dark"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-600"
                    : "bg-[#429EBD] hover:bg-[#2E7A94] text-white disabled:bg-slate-400"
                    } shadow-md hover:shadow-lg`}
                >
                  {creating ? (t("creating") || "جاري الإنشاء...") : (t("createShipment") || "إنشاء شحنة")}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} text-center`}>
          <div className={`text-2xl font-bold ${textColor}`}>{stats.total}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "إجمالي" : "Total"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 border-amber-500/30 ${theme === "dark" ? "bg-amber-500/10" : "bg-amber-50"} text-center`}>
          <div className="text-2xl font-bold text-amber-500">{stats.pending}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "انتظار" : "Pending"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 border-purple-500/30 ${theme === "dark" ? "bg-purple-500/10" : "bg-purple-50"} text-center`}>
          <div className="text-2xl font-bold text-purple-500">{stats.inTransit}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "في الطريق" : "In Transit"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 border-emerald-500/30 ${theme === "dark" ? "bg-emerald-500/10" : "bg-emerald-50"} text-center`}>
          <div className="text-2xl font-bold text-emerald-500">{stats.delivered}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "تم التسليم" : "Delivered"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} text-center`}>
          <div className={`text-2xl font-bold ${textColor}`}>{stats.totalItems}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "منتج" : "Items"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} text-center`}>
          <div className={`text-xl font-bold text-[#429EBD]`}>{stats.totalDistance} <span className="text-xs">{language === "ar" ? "كم" : "km"}</span></div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "مسافة" : "Distance"}</div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} flex flex-wrap items-center gap-3`}>
        <input type="text" placeholder={language === "ar" ? "بحث..." : "Search..."} value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${borderClass} ${cardBgClass} ${textColor} focus:ring-2 focus:ring-[#429EBD] w-48`} />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border ${borderClass} ${cardBgClass} ${textColor} focus:ring-2 focus:ring-[#429EBD]`}>
          <option value="all">{language === "ar" ? "الكل" : "All"}</option>
          <option value="pending">{language === "ar" ? "انتظار" : "Pending"}</option>
          <option value="in_transit">{language === "ar" ? "في الطريق" : "In Transit"}</option>
          <option value="delivered">{language === "ar" ? "تم التسليم" : "Delivered"}</option>
        </select>
        <div className="flex-1" />
        <span className={`text-sm ${subTextColor}`}>{filteredShipments.length} {language === "ar" ? "شحنة" : "shipments"}</span>
      </div>

      {/* Error */}
      {(error || localError) && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
          {error || localError}
        </div>
      )}

      {/* Shipment Cards - Mobile First */}
      <div className="space-y-4">
        {filteredShipments.length === 0 ? (
          <div className={`text-center py-20 ${cardBgClass} rounded-2xl border-2 border-dashed ${borderClass} opacity-60`}>
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /></svg>
            </div>
            <p className="font-bold text-lg">{language === "ar" ? "لا توجد شحنات" : "No shipments found"}</p>
          </div>
        ) : (
          filteredShipments.map((shipment) => {
            const statusColors = {
              pending: "border-l-amber-500",
              in_transit: "border-l-purple-500",
              delivered: "border-l-emerald-500",
              cancelled: "border-l-red-500",
            };

            return (
              <div key={shipment.id} className={`group relative rounded-2xl border-2 ${borderClass} ${cardBgClass} overflow-hidden shadow-md transition-all active:scale-[0.98]`}>
                {/* Status Indicator Sidebar */}
                <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${statusColors[shipment.status] || "bg-slate-300"}`} />

                <div className="p-4 sm:p-5">
                  {/* Top Row: Shipment Info & Status */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#429EBD] to-[#053F5C] flex items-center justify-center text-white shadow-lg">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /></svg>
                      </div>
                      <div>
                        <h4 className={`text-lg font-black ${textColor} leading-tight`}>{shipment.shipment_number}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold uppercase ${subTextColor}`}>{language === "ar" ? "تعريف الشحنة" : "Shipment ID"}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className={`text-[10px] font-mono font-bold ${subTextColor}`}>{shipment.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="scale-90 origin-top-right">
                      <StatusBadge status={shipment.status} />
                    </div>
                  </div>

                  {/* Middle Row: Route */}
                  <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} border ${borderClass} mb-4 relative overflow-hidden`}>
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                        <div className="w-0.5 h-8 border-l-2 border-dotted border-slate-300 dark:border-slate-600" />
                        <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-500/20" />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <div className="mb-4">
                          <span className={`text-[10px] font-black uppercase ${subTextColor} block mb-0.5`}>{language === "ar" ? "من" : "Origin"}</span>
                          <p className={`text-sm font-bold ${textColor} truncate`}>{shipment.from_facility?.name || "—"}</p>
                        </div>
                        <div>
                          <span className={`text-[10px] font-black uppercase ${subTextColor} block mb-0.5`}>{language === "ar" ? "إلى" : "Destination"}</span>
                          <p className={`text-sm font-bold ${textColor} truncate`}>{shipment.to_facility?.name || "—"}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="mb-4">
                          <span className={`text-[10px] font-black uppercase ${subTextColor} block mb-0.5`}>{language === "ar" ? "المسافة" : "Distance"}</span>
                          <p className={`text-sm font-black ${textColor}`}>{shipment.distance?.toFixed(0) || "—"} <span className="text-[10px] opacity-60">km</span></p>
                        </div>
                        {shipment.gps_latitude && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMapModal({
                                open: true,
                                lat: shipment.gps_latitude,
                                lng: shipment.gps_longitude,
                                driver: shipment.driver?.name,
                                from: shipment.from_facility?.name,
                                to: shipment.to_facility?.name
                              });
                            }}
                            className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all ml-auto"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bottom Row: Driver & Items */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-lg shadow-inner overflow-hidden shrink-0">
                        {shipment.driver?.name?.charAt(0) || "👤"}
                      </div>
                      <div className="min-w-0">
                        <span className={`text-[9px] font-black uppercase tracking-wider ${subTextColor} block`}>{language === "ar" ? "السائق" : "Driver"}</span>
                        <p className={`text-xs font-bold ${textColor} truncate`}>{shipment.driver?.name || (language === "ar" ? "غير محدد" : "Unassigned")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleViewShipment(shipment.id); }}
                        className={`px-3 py-2 rounded-xl border ${borderClass} ${theme === "dark" ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-700"} text-xs font-bold flex items-center gap-2 hover:scale-105 transition-all`}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                        {shipment.items_count || 1} {language === "ar" ? "صنف" : "Items"}
                      </button>
                      {shipment.status !== 'delivered' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCheckDelivery(shipment.id); }}
                          disabled={checkingDelivery}
                          className={`w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all disabled:opacity-50 border border-emerald-500/20`}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>



      {/* Modal عرض البضاعة */}
      {itemsModal.open && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
              onClick={() => setItemsModal({ open: false, loading: false, shipment: null })}
            ></div>

            <div className={`relative transform overflow-hidden rounded-2xl ${theme === "dark" ? "bg-slate-900 border border-white/10" : "bg-white"} p-0 text-right shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-4xl animate-scale-in flex flex-col max-h-[90vh]`}>
              {/* Header */}
              <div className={`px-6 py-4 border-b ${theme === "dark" ? "border-slate-700 bg-gradient-to-r from-purple-900/50 to-slate-800" : "border-slate-200 bg-gradient-to-r from-purple-100 to-white"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${textColor}`}>{language === "ar" ? "بضاعة الشحنة" : "Shipment Items"}</h3>
                      <p className={`text-sm ${subTextColor}`}>
                        {itemsModal.shipment?.from_facility?.name} → {itemsModal.shipment?.to_facility?.name}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setItemsModal({ open: false, loading: false, shipment: null })} className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto flex-1">
                {itemsModal.loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : itemsModal.shipment?.items?.length > 0 ? (
                  <div className="space-y-4">
                    {itemsModal.shipment.items.map((item, idx) => (
                      <div key={item.id || idx} className={`p-4 rounded-xl ${theme === "dark" ? "bg-slate-700/50" : "bg-slate-50"} border ${theme === "dark" ? "border-slate-600" : "border-slate-200"}`}>
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                            {idx + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className={`font-bold text-lg ${textColor}`}>
                                  {item.product?.name || item.product?.name_ar || (language === "ar" ? "منتج غير محدد" : "Unknown Product")}
                                </h4>
                                <p className={`text-sm ${subTextColor} font-mono`}>{item.batch_code || "—"}</p>
                              </div>
                              <div className="text-right">
                                <span className={`text-2xl font-bold ${theme === "dark" ? "text-purple-400" : "text-purple-600"}`}>{item.quantity}</span>
                                <span className={`text-sm ${subTextColor} mr-1`}> {item.product?.unit || (language === "ar" ? "وحدة" : "unit")}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-right">
                              <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-slate-600/50" : "bg-white"} border border-black/5`}>
                                <span className={`text-[10px] uppercase font-bold ${subTextColor}`}>{language === "ar" ? "تاريخ الإنتاج" : "Production"}</span>
                                <p className={`font-semibold text-xs ${textColor}`}>{item.production_date ? new Date(item.production_date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US") : "—"}</p>
                              </div>
                              <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-slate-600/50" : "bg-white"} border border-black/5`}>
                                <span className={`text-[10px] uppercase font-bold ${subTextColor}`}>{language === "ar" ? "تاريخ الانتهاء" : "Expiry"}</span>
                                <p className={`font-semibold text-xs ${item.expiry_date && new Date(item.expiry_date) < new Date() ? "text-red-500" : textColor}`}>
                                  {item.expiry_date ? new Date(item.expiry_date).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US") : "—"}
                                </p>
                              </div>
                              <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-slate-600/50" : "bg-white"} border border-black/5`}>
                                <span className={`text-[10px] uppercase font-bold ${subTextColor}`}>{language === "ar" ? "التصنيف" : "Category"}</span>
                                <p className={`font-semibold text-xs ${textColor}`}>{item.product?.category || "—"}</p>
                              </div>
                              <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-slate-600/50" : "bg-white"} border border-black/5`}>
                                <span className={`text-[10px] uppercase font-bold ${subTextColor}`}>{language === "ar" ? "SKU" : "SKU"}</span>
                                <p className={`font-semibold font-mono text-xs ${textColor}`}>{item.product?.sku || "—"}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={`text-center py-12 ${subTextColor}`}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mx-auto mb-4 opacity-50"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                    <p>{language === "ar" ? "لا توجد بضاعة" : "No items"}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={`px-6 py-4 border-t ${theme === "dark" ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex items-center justify-between">
                  <div className={`text-sm ${subTextColor}`}>
                    {language === "ar" ? "إجمالي الأصناف:" : "Total Items:"} <span className="font-bold">{itemsModal.shipment?.items?.length || 0}</span>
                  </div>
                  <button onClick={() => setItemsModal({ open: false, loading: false, shipment: null })}
                    className="px-6 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors">
                    {language === "ar" ? "إغلاق" : "Close"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal عرض الموقع على الخريطة */}
      {mapModal.open && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
              onClick={() => setMapModal({ open: false, lat: null, lng: null, driver: null, from: null, to: null })}
            ></div>

            <div className={`relative transform overflow-hidden rounded-2xl ${theme === "dark" ? "bg-slate-900 border border-white/10" : "bg-white"} p-0 text-right shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-3xl animate-scale-in flex flex-col max-h-[90vh]`}>
              {/* Header */}
              <div className={`px-6 py-4 border-b ${theme === "dark" ? "border-slate-700 bg-gradient-to-r from-emerald-900/50 to-slate-800" : "border-slate-200 bg-gradient-to-r from-emerald-100 to-white"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${textColor}`}>{language === "ar" ? "موقع الشحنة الحالي" : "Current Shipment Location"}</h3>
                      <p className={`text-sm ${subTextColor}`}>
                        {mapModal.driver && `${language === "ar" ? "السائق:" : "Driver:"} ${mapModal.driver}`}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setMapModal({ open: false, lat: null, lng: null, driver: null, from: null, to: null })}
                    className={`p-2 rounded-lg ${theme === "dark" ? "hover:bg-slate-700" : "hover:bg-slate-100"}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              {/* Map Body */}
              <div className="relative h-96 w-full flex-1">
                <iframe
                  title="Shipment Location"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapModal.lng - 0.02}%2C${mapModal.lat - 0.02}%2C${mapModal.lng + 0.02}%2C${mapModal.lat + 0.02}&layer=mapnik&marker=${mapModal.lat}%2C${mapModal.lng}`}
                  allowFullScreen
                />
              </div>

              {/* Footer */}
              <div className={`px-6 py-4 border-t ${theme === "dark" ? "border-slate-700 bg-slate-800/50" : "border-slate-200 bg-slate-50"}`}>
                <div className="flex flex-wrap items-center justify-between gap-4 text-right">
                  <div className="flex items-center gap-6">
                    <div>
                      <span className={`text-xs ${subTextColor}`}>{language === "ar" ? "خط العرض" : "Latitude"}</span>
                      <p className={`font-mono font-bold ${textColor}`}>{mapModal.lat?.toFixed(6)}</p>
                    </div>
                    <div>
                      <span className={`text-xs ${subTextColor}`}>{language === "ar" ? "خط الطول" : "Longitude"}</span>
                      <p className={`font-mono font-bold ${textColor}`}>{mapModal.lng?.toFixed(6)}</p>
                    </div>
                    {mapModal.from && mapModal.to && (
                      <div className={`text-sm ${subTextColor}`}>
                        <span className="text-emerald-500">●</span> {mapModal.from} → <span className="text-red-500">●</span> {mapModal.to}
                      </div>
                    )}
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${mapModal.lat},${mapModal.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                    {language === "ar" ? "فتح في Google Maps" : "Open in Google Maps"}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ShipmentManagement;






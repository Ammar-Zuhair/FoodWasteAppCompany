import React, { useState, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  useOrders,
  useCreateOrder,
  useUpdateOrder,
  useDistributeOrder,
  useOrderStats,
  useAllocateBatches,
  useWasteReductionStats,
} from "../hooks/useOrders.js";
import { useMerchants } from "../hooks/useMerchants.js";
import { useProducts } from "../hooks/useProducts.js";
import StatusBadge from "../components/shared/StatusBadge.jsx";
import SearchableSelect from "../components/shared/SearchableSelect.jsx";
import { getStoredUser } from "../utils/api/auth.js";

function OrderManagement({ user: propUser }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const storedUser = getStoredUser();
  const user = propUser || (storedUser ? {
    id: storedUser.id,
    organization_id: storedUser.organization_id,
    role: storedUser.role,
  } : null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [showDateFilter, setShowDateFilter] = useState(false);

  // تاريخ افتراضي: آخر 30 يوم
  const getDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return {
      start_date: thirtyDaysAgo.toISOString().split('T')[0],
      end_date: today.toISOString().split('T')[0],
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  const { orders, loading, error, reload } = useOrders({
    organization_id: user?.organization_id,
    start_date: dateRange.start_date,
    end_date: dateRange.end_date + 'T23:59:59',
  });
  const { stats } = useOrderStats({
    organization_id: user?.organization_id,
  });
  const { create, loading: creating } = useCreateOrder();
  const { update, loading: updating } = useUpdateOrder();
  const { distribute, loading: distributing } = useDistributeOrder();
  const { stats: wasteStats } = useWasteReductionStats({
    organization_id: user?.organization_id,
  });

  // Form state
  const [formData, setFormData] = useState({
    facility_id: "",
    branch_id: "",
    order_date: new Date().toISOString().split('T')[0],
    requested_delivery_date: "",
    distribution_mode: "auto",
    priority: "normal", // normal, urgent
    items: [{ product_id: "", quantity: "", unit_price: "" }],
  });

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  // Filter orders - use real API data
  const filteredOrders = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    return orders.filter((order) => {
      const matchesSearch = order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.facility?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.branch?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, selectedStatus]);

  // Statistics - use real API stats or calculate from orders
  const orderStats = useMemo(() => {
    // If stats from API, extract status_counts properly
    if (stats && stats.status_counts) {
      return {
        total_orders: stats.total_orders || 0,
        pending: stats.status_counts.pending || 0,
        confirmed: stats.status_counts.confirmed || 0,
        shipped: stats.status_counts.shipped || 0,
        delivered: stats.status_counts.delivered || 0,
        cancelled: stats.status_counts.cancelled || 0,
        allocated: stats.status_counts.allocated || 0,
        urgent: 0,
        totalValue: 0,
      };
    }
    // Calculate from orders if no API stats
    if (!orders || orders.length === 0) {
      return {
        total_orders: 0,
        pending: 0,
        confirmed: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        urgent: 0,
        totalValue: 0,
      };
    }
    return {
      total_orders: orders.length,
      pending: orders.filter((o) => o.status === "pending" || o.status === "processing").length,
      confirmed: orders.filter((o) => o.status === "confirmed").length,
      shipped: orders.filter((o) => o.status === "shipped").length,
      delivered: orders.filter((o) => o.status === "delivered").length,
      cancelled: orders.filter((o) => o.status === "cancelled").length,
      urgent: orders.filter((o) => o.priority === "urgent").length,
      totalValue: orders.reduce((sum, o) => sum + (o.total_value || o.total_amount || 0), 0),
    };
  }, [orders, stats]);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      await create({
        organization_id: user?.organization_id,
        ...formData,
        branch_id: formData.branch_id || null,
        priority: formData.priority || "normal",
        order_date: new Date(formData.order_date).toISOString(),
        requested_delivery_date: formData.requested_delivery_date
          ? new Date(formData.requested_delivery_date).toISOString()
          : null,
        items: formData.items
          .filter((item) => item.product_id && item.quantity)
          .map((item) => ({
            product_id: item.product_id,
            quantity: parseFloat(item.quantity),
            unit_price: item.unit_price ? parseFloat(item.unit_price) : null,
          })),
      });
      setShowCreateModal(false);
      setFormData({
        facility_id: "",
        branch_id: "",
        order_date: new Date().toISOString().split('T')[0],
        requested_delivery_date: "",
        distribution_mode: "auto",
        priority: "normal",
        items: [{ product_id: "", quantity: "", unit_price: "" }],
      });
      reload();
    } catch (err) {
      alert(err.message || "حدث خطأ أثناء إنشاء الطلب");
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await update(orderId, { status });
      reload();
    } catch (err) {
      alert(err.message || "حدث خطأ أثناء تحديث الطلب");
    }
  };

  // تأكيد وإرسال للتوزيع معاً
  const handleConfirmAndDistribute = async (orderId) => {
    try {
      await distribute(orderId, "auto");
      const msg = language === "ar"
        ? "تم تأكيد الطلب وإرساله للتوزيع بنجاح"
        : "Order confirmed and sent to distribution";
      alert(msg);
      reload();
    } catch (err) {
      alert(err.message || "حدث خطأ أثناء التأكيد");
    }
  };



  const getStatusLabel = (status) => {
    const statusMap = {
      pending: language === "ar" ? "قيد الانتظار" : "Pending",
      processing: language === "ar" ? "قيد المعالجة" : "Processing",
      allocated: language === "ar" ? "تم تخصيص الدفعات" : "Batches Allocated",
      confirmed: language === "ar" ? "مؤكد" : "Confirmed",
      dispatched: language === "ar" ? "تم الإرسال" : "Dispatched",
      in_transit: language === "ar" ? "في الطريق" : "In Transit",
      shipped: language === "ar" ? "تم الشحن" : "Shipped",
      delivered: language === "ar" ? "تم التسليم" : "Delivered",
      partially_delivered: language === "ar" ? "تسليم جزئي" : "Partially Delivered",
      cancelled: language === "ar" ? "ملغي" : "Cancelled",
      returned: language === "ar" ? "مرتجع" : "Returned",
      expired_pre_dlv: language === "ar" ? "انتهت الصلاحية ❗" : "Expired Before Delivery",
    };
    return statusMap[status] || status;
  };

  if (loading && (!orders || orders.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className={`text-lg font-semibold ${textColor}`}>
          {language === "ar" ? "جاري تحميل بيانات الطلبات..." : "Loading orders data..."}
        </p>
      </div>
    );
  }

  // --- Inline Create Form Component -> Refactored to Modal ---
  const CreateOrderForm = () => {
    // Fetch Data for Dropdowns
    const { merchants, loading: merchantsLoading } = useMerchants();
    const { products, loading: productsLoading } = useProducts();

    // Local lookup for displaying names/details based on selection
    const getProductDetails = (productId) => {
      return products.find(p => String(p.id) === String(productId));
    };

    return (
      <div className="fixed inset-0 z-[99999] overflow-y-auto" dir={language === "ar" ? "rtl" : "ltr"}>
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setShowCreateModal(false)}
          ></div>

          <div className={`relative transform overflow-hidden rounded-2xl ${theme === "dark" ? "bg-slate-900 border border-white/10 shadow-2xl" : "bg-white shadow-2xl"} p-0 text-right transition-all sm:my-8 sm:w-full sm:max-w-4xl animate-scale-in flex flex-col max-h-[90vh]`}>
            {/* Header */}
            <div className={`p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between`}>
              <h3 className={`text-2xl font-bold ${textColor}`}>
                {language === "ar" ? "إضافة طلب جديد" : "New Order"}
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className={`text-2xl ${subTextColor} hover:${textColor} transition-colors`}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <form id="create-order-form" onSubmit={handleCreateOrder} className="space-y-6">
                {/* Order Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Merchant Selection */}
                  <div className="lg:col-span-1">
                    <SearchableSelect
                      label={language === "ar" ? "السوبر ماركت" : "Supermarket"}
                      items={merchants}
                      value={formData.facility_id}
                      onChange={(val) => setFormData({ ...formData, facility_id: val })}
                      displayKey={language === "ar" ? "name_ar" : "name"}
                      valueKey="id"
                      placeholder={language === "ar" ? "ابحث عن عميل..." : "Search merchant..."}
                      loading={merchantsLoading}
                      required
                      className="w-full"
                    />
                  </div>

                  {/* Dates & Priority */}
                  <div>
                    <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                      {language === "ar" ? "تاريخ الطلب" : "Order Date"}
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.order_date}
                      onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                      className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                      {language === "ar" ? "تاريخ التسليم" : "Delivery Date"}
                    </label>
                    <input
                      type="date"
                      value={formData.requested_delivery_date}
                      onChange={(e) => setFormData({ ...formData, requested_delivery_date: e.target.value })}
                      className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                      {language === "ar" ? "الأولوية" : "Priority"}
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="normal">{language === "ar" ? "عادي" : "Normal"}</option>
                      <option value="urgent">{language === "ar" ? "عاجل" : "Urgent"}</option>
                    </select>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-4`}>
                    {language === "ar" ? "عناصر الطلب" : "Order Items"}
                  </label>
                  <div className="space-y-4">
                    {formData.items.map((item, index) => {
                      const productDetail = getProductDetails(item.product_id);
                      return (
                        <div key={index} className={`p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 ${theme === "dark" ? "bg-slate-800/50" : "bg-gray-50/50"} grid grid-cols-1 md:grid-cols-12 gap-4 items-end transition-all hover:border-blue-500/30`}>

                          {/* Product Search */}
                          <div className="md:col-span-4">
                            <SearchableSelect
                              label={index === 0 ? (language === "ar" ? "المنتج" : "Product") : ""}
                              items={products}
                              value={item.product_id}
                              onChange={(val) => {
                                const newItems = [...formData.items];
                                newItems[index].product_id = val;
                                setFormData({ ...formData, items: newItems });
                              }}
                              displayKey={language === "ar" ? "name_ar" : "name"}
                              valueKey="id"
                              placeholder={language === "ar" ? "ابحث عن منتج..." : "Search product..."}
                              loading={productsLoading}
                              required
                            />
                          </div>

                          {/* Product Name (Read Only) */}
                          <div className="md:col-span-3">
                            <label className={`block text-xs font-semibold ${subTextColor} mb-1`}>
                              {index === 0 ? (language === "ar" ? "اسم المنتج" : "Product Name") : ""}
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={productDetail ? (language === "ar" ? productDetail.name_ar : (productDetail.name || productDetail.name_en)) : ""}
                              placeholder="-"
                              className={`w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent ${textColor} opacity-70 cursor-not-allowed`}
                            />
                          </div>

                          {/* Product ID */}
                          <div className="md:col-span-1">
                            <label className={`block text-xs font-semibold ${subTextColor} mb-1`}>
                              {index === 0 ? "ID" : ""}
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={item.product_id || ""}
                              className={`w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-transparent ${textColor} opacity-70 cursor-not-allowed text-center`}
                            />
                          </div>

                          {/* Quantity */}
                          <div className="md:col-span-2">
                            <label className={`block text-xs font-semibold ${subTextColor} mb-1`}>
                              {index === 0 ? (language === "ar" ? "الكمية" : "Qty") : ""}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const newItems = [...formData.items];
                                newItems[index].quantity = e.target.value;
                                setFormData({ ...formData, items: newItems });
                              }}
                              className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-white"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                          </div>

                          {/* Delete Button */}
                          <div className="md:col-span-2">
                            {formData.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    items: formData.items.filter((_, i) => i !== index),
                                  });
                                }}
                                className={`w-full px-3 py-2 rounded-xl font-semibold transition-colors ${theme === "dark"
                                  ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
                                  : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                  } flex items-center justify-center gap-2`}
                              >
                                <span>🗑️</span> {language === "ar" ? "حذف" : "Del"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        items: [...formData.items, { product_id: "", quantity: "", unit_price: "" }],
                      });
                    }}
                    className={`mt-4 px-4 py-2 rounded-xl font-semibold transition-colors border-2 border-dashed ${theme === "dark"
                      ? "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      : "border-emerald-500/30 text-emerald-700 hover:bg-emerald-50"
                      }`}
                  >
                    {language === "ar" ? "+ إضافة منتج آخر" : "+ Add Another Product"}
                  </button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className={`p-6 border-t border-gray-200 dark:border-gray-700 flex gap-4`}>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                }}
                className={`flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 ${textColor} hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-bold`}
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="submit"
                form="create-order-form"
                disabled={creating}
                className={`flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {creating
                  ? (language === "ar" ? "جاري الحفظ..." : "Saving...")
                  : (language === "ar" ? "حفظ الطلب" : "Save Order")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return (
    <div className="space-y-6 pb-20" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Premium Header */}
      <div className={`relative overflow-hidden rounded-[32px] p-6 shadow-xl mb-4`} style={{
        background: theme === "dark"
          ? "linear-gradient(135deg, #1e1b4b 0%, #0c4a6e 100%)"
          : "linear-gradient(135deg, #429EBD 0%, #053F5C 100%)"
      }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32 blur-3xl opacity-50" />
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 uppercase tracking-tight">
                {language === "ar" ? "إدارة الطلبات" : "Orders Dashboard"}
              </h2>
              <p className="text-white/70 text-sm font-medium">
                {language === "ar" ? "تتبع التوزيع الذكي وتقليل الهدر" : "Track smart distribution & waste reduction"}
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-12 h-12 rounded-2xl bg-white text-blue-600 flex items-center justify-center shadow-xl active:scale-95 transition-all"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          {/* Quick Stats Grid */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {[
              { label: language === "ar" ? "الكل" : "Total", value: orderStats.total_orders, icon: "📊" },
              { label: language === "ar" ? "انتظار" : "Pending", value: orderStats.pending, icon: "⏳" },
              { label: language === "ar" ? "مؤكد" : "Confirmed", value: orderStats.confirmed, icon: "✅" },
              { label: language === "ar" ? "شحن" : "Shipped", value: orderStats.shipped, icon: "🚚" },
            ].map((s, i) => (
              <div key={i} className="min-w-[90px] flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex flex-col items-center">
                <span className="text-lg mb-1">{s.icon}</span>
                <div className="text-lg font-black text-white">{s.value}</div>
                <div className="text-[9px] font-black uppercase text-white/50">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Waste Reduction KPI Card */}
      {wasteStats && (
        <div className={`mx-1 p-5 rounded-[32px] border-2 ${borderClass} ${cardBgClass} shadow-lg relative overflow-hidden group`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex-1">
              <h3 className={`text-sm font-black uppercase tracking-widest ${subTextColor} mb-4 flex items-center gap-2`}>
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                {language === "ar" ? "كفاءة تقليل الهدر" : "Waste Reduction Efficiency"}
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{wasteStats.fefo_efficiency_percentage || 0}%</div>
                  <div className="text-[10px] font-bold uppercase opacity-50">FEFO Rate</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{wasteStats.avg_days_to_expiry_at_allocation || 0}</div>
                  <div className="text-[10px] font-bold uppercase opacity-50">{language === 'ar' ? 'أيام الصلاحية' : 'Expiry Days'}</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-amber-500">{wasteStats.near_expiry_allocations || 0}</div>
                  <div className="text-[10px] font-bold uppercase opacity-50">{language === 'ar' ? 'قريب الانتهاء' : 'Near Expiry'}</div>
                </div>
              </div>
            </div>
            <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 flex items-center justify-center relative">
              <div className="text-xl">🎯</div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-purple-500" strokeDasharray="175" strokeDashoffset={175 - (175 * (wasteStats.fefo_efficiency_percentage || 0) / 100)} />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col gap-3 px-1">
        {/* Date Range Filter */}
        <div className={`rounded-2xl border-2 ${borderClass} ${cardBgClass} p-4`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={subTextColor}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className={`font-bold text-sm ${textColor}`}>
                {language === "ar" ? "فلترة حسب التاريخ" : "Filter by Date"}
              </span>
            </div>
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`p-2 rounded-xl ${theme === "dark" ? "bg-white/10" : "bg-slate-100"} transition-all`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform ${showDateFilter ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>

          {/* Quick Date Buttons */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: language === "ar" ? "اليوم" : "Today", days: 0 },
              { label: language === "ar" ? "آخر 7 أيام" : "Last 7 days", days: 7 },
              { label: language === "ar" ? "آخر 30 يوم" : "Last 30 days", days: 30 },
              { label: language === "ar" ? "آخر 90 يوم" : "Last 90 days", days: 90 },
              { label: language === "ar" ? "الكل" : "All", days: 365 },
            ].map((option) => (
              <button
                key={option.days}
                onClick={() => {
                  const today = new Date();
                  const startDate = new Date(today);
                  startDate.setDate(startDate.getDate() - option.days);
                  setDateRange({
                    start_date: startDate.toISOString().split('T')[0],
                    end_date: today.toISOString().split('T')[0],
                  });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${theme === "dark"
                    ? "bg-white/10 hover:bg-white/20 text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Custom Date Range */}
          {showDateFilter && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-bold ${subTextColor} mb-2`}>
                  {language === "ar" ? "من تاريخ" : "From"}
                </label>
                <input
                  type="date"
                  value={dateRange.start_date}
                  onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border-2 ${borderClass} ${cardBgClass} ${textColor} text-sm focus:ring-2 focus:ring-blue-500 outline-none`}
                />
              </div>
              <div>
                <label className={`block text-xs font-bold ${subTextColor} mb-2`}>
                  {language === "ar" ? "إلى تاريخ" : "To"}
                </label>
                <input
                  type="date"
                  value={dateRange.end_date}
                  onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                  className={`w-full px-3 py-2 rounded-xl border-2 ${borderClass} ${cardBgClass} ${textColor} text-sm focus:ring-2 focus:ring-blue-500 outline-none`}
                />
              </div>
            </div>
          )}

          {/* Current Range Display */}
          <div className={`mt-3 text-xs ${subTextColor} flex items-center gap-2`}>
            <span>📅</span>
            <span>
              {language === "ar"
                ? `عرض الطلبات من ${dateRange.start_date} إلى ${dateRange.end_date}`
                : `Showing orders from ${dateRange.start_date} to ${dateRange.end_date}`
              }
            </span>
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            placeholder={language === "ar" ? "البحث برقم الطلب أو المتجر..." : "Search order # or outlet..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full h-14 px-12 rounded-2xl border-2 ${borderClass} ${cardBgClass} ${textColor} text-base font-medium shadow-sm focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none`}
          />
          <div className={`absolute top-1/2 -translate-y-1/2 ${language === "ar" ? "right-4" : "left-4"} ${subTextColor}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {['all', 'pending', 'allocated', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-2xl border-2 font-black text-xs uppercase transition-all ${selectedStatus === status
                ? 'bg-[#429EBD] border-[#429EBD] text-white shadow-lg shadow-blue-500/20'
                : `${cardBgClass} ${borderClass} ${subTextColor} hover:border-blue-300`
                }`}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4 px-1">
        {filteredOrders.length === 0 ? (
          <div className={`text-center py-20 ${cardBgClass} rounded-[32px] border-2 border-dashed ${borderClass} opacity-60`}>
            <div className="text-5xl mb-4">📦</div>
            <p className="font-black text-xl">{language === "ar" ? "لا توجد طلبات" : "No orders found"}</p>
            <p className="text-sm">{language === "ar" ? "جرب تغيير الفلتر" : "Try changing the filter"}</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isExpanded = expandedOrderId === order.id;
            const isUrgent = order.priority === "urgent";
            const statusColors = {
              pending: "bg-amber-500",
              processing: "bg-teal-500",
              allocated: "bg-purple-500",
              confirmed: "bg-emerald-500",
              shipped: "bg-blue-500",
              delivered: "bg-emerald-600",
              cancelled: "bg-red-500",
            };

            return (
              <div key={order.id} className="group relative">
                {/* Order Card */}
                <div
                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                  className={`relative rounded-[32px] border-2 ${borderClass} ${cardBgClass} p-5 shadow-xl transition-all duration-300 active:scale-[0.97] overflow-hidden ${isExpanded ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {/* Status Sidebar */}
                  <div className={`absolute top-0 bottom-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-1.5 ${statusColors[order.status] || 'bg-slate-300'}`} />

                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${isUrgent ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500'}`}>
                          {order.order_number}
                        </span>
                        {isUrgent && <span className="animate-pulse">🔥</span>}
                      </div>
                      <h4 className={`text-xl font-black ${textColor} truncate`}>{order.facility?.name || "-"}</h4>
                      <p className={`text-xs font-bold ${subTextColor}`}>{order.branch?.name}</p>
                    </div>
                    <div className="scale-90 origin-top-right">
                      <StatusBadge status={getStatusLabel(order.status)} />
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} border ${borderClass}`}>
                      <div className="text-[10px] font-black uppercase text-slate-500 mb-1">{language === 'ar' ? 'التاريخ' : 'Date'}</div>
                      <div className={`text-xs font-black ${textColor}`}>📅 {new Date(order.order_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB')}</div>
                    </div>
                    <div className={`p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} border ${borderClass}`}>
                      <div className="text-[10px] font-black uppercase text-slate-500 mb-1">{language === 'ar' ? 'القيمة' : 'Total'}</div>
                      <div className={`text-xs font-black text-emerald-600`}>💰 {order.total_amount?.toLocaleString()} <span className="text-[9px] opacity-60">YER</span></div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-4 border-t-2 border-dashed ${borderClass}">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xs font-black">
                        {order.items?.length || 0}
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>{language === 'ar' ? 'أصناف' : 'Items'}</span>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {['pending', 'processing'].includes(order.status) && (
                        <button
                          onClick={() => handleConfirmAndDistribute(order.id)}
                          className="h-10 px-4 rounded-xl bg-emerald-500 text-white font-black text-xs uppercase shadow-lg shadow-emerald-500/20 active:scale-90 transition-all"
                        >
                          {language === 'ar' ? 'تأكيد وتوزيع' : 'Process'}
                        </button>
                      )}
                      {['confirmed', 'allocated'].includes(order.status) && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "shipped")}
                          className="h-10 px-4 rounded-xl bg-blue-500 text-white font-black text-xs uppercase shadow-lg shadow-blue-500/20 active:scale-90 transition-all"
                        >
                          {language === 'ar' ? 'بدء الشحن' : 'Ship'}
                        </button>
                      )}
                      {order.status === "shipped" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "delivered")}
                          className="h-10 px-4 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase shadow-lg shadow-emerald-600/20 active:scale-90 transition-all"
                        >
                          {language === 'ar' ? 'تم التسليم' : 'Complete'}
                        </button>
                      )}
                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className={`w-10 h-10 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'} ${textColor} flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6" /></svg>
                      </button>
                    </div>
                  </div>

                  {/* Expanded Items */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 space-y-2 animate-in slide-in-from-top-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className={`flex justify-between items-center p-3 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'}`}>
                          <div>
                            <div className={`text-xs font-black ${textColor}`}>{item.product_name}</div>
                            <div className="text-[10px] font-bold text-slate-500">Qty: {item.quantity} × {item.unit_price?.toLocaleString()}</div>
                          </div>
                          <div className="text-xs font-black text-emerald-600">{(item.quantity * (item.unit_price || 0)).toLocaleString()}</div>
                        </div>
                      ))}
                      <div className="flex justify-between items-center px-2 py-2">
                        <span className={`text-[10px] font-black uppercase text-slate-500`}>{language === 'ar' ? 'تاريخ التسليم المتوقع' : 'Target Delivery'}</span>
                        <span className={`text-[10px] font-black ${textColor}`}>{order.requested_delivery_date ? new Date(order.requested_delivery_date).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCreateModal && <CreateOrderForm />}
    </div>
  );
};

export default OrderManagement;


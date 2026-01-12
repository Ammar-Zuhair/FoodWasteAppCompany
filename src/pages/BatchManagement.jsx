import { useState, useMemo, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  useBatches,
  useBatchesFIFO,
  useBatchesFEFO,
  useCreateBatch,
  useUpdateBatch,
  useShipBatch,
  useBatchAllocations,
} from "../hooks/useBatches.js";
import StatusBadge from "../components/shared/StatusBadge.jsx";
import { getStoredUser } from "../utils/api/auth.js";
import { getProducts } from "../utils/api/products.js";

function BatchManagement({ user: propUser }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const storedUser = getStoredUser();
  const user = propUser || (storedUser ? {
    id: storedUser.id,
    organization_id: storedUser.organization_id,
    role: storedUser.role,
    facility_id: storedUser.facility_id,
  } : null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [viewMode, setViewMode] = useState("location"); // "all", "fifo", "fefo", "location"

  // Load batches based on view mode
  const allBatchesHook = useBatches({
    organization_id: user?.organization_id,
    facility_id: user?.facility_id,
  });
  const fifoBatchesHook = useBatchesFIFO({
    organization_id: user?.organization_id,
    facility_id: user?.facility_id,
    status: selectedStatus === "all" ? "in_stock" : selectedStatus,
  });
  const fefoBatchesHook = useBatchesFEFO({
    organization_id: user?.organization_id,
    facility_id: user?.facility_id,
    status: selectedStatus === "all" ? "in_stock" : selectedStatus,
  });
  const allocationsHook = useBatchAllocations({
    organization_id: user?.organization_id,
  });

  // Select the appropriate hook based on view mode
  const getCurrentBatches = () => {
    if (viewMode === "fifo") return fifoBatchesHook;
    if (viewMode === "fefo") return fefoBatchesHook;
    if (viewMode === "location") return {
      batches: allocationsHook.allocations,
      loading: allocationsHook.loading,
      error: allocationsHook.error,
      reload: allocationsHook.reload
    };
    // For "all" and "expired" modes, use regular batches
    return allBatchesHook;
  };

  const { batches, loading, error, reload } = getCurrentBatches();
  const { create, loading: creating } = useCreateBatch();
  const { update, loading: updating } = useUpdateBatch();
  const { ship, loading: shipping } = useShipBatch();

  const [formData, setFormData] = useState({
    product_id: "",
    facility_id: user?.facility_id || "",
    batch_code: "",
    quantity: "",
    unit: "unit",
    production_date: "",
    expiry_date: "",
    status: "in_storage",
  });

  // Load products from API
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      if (!user?.organization_id) return;
      try {
        setLoadingProducts(true);
        const products = await getProducts({
          organization_id: user.organization_id,
          limit: 1000
        });
        setAvailableProducts(products);
      } catch (err) {
        console.error("Error loading products:", err);
        setAvailableProducts([]); // Empty array instead of dummy data
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, [user?.organization_id]);

  // Generate batch code automatically
  const generateBatchCode = (productId) => {
    const product = availableProducts.find(p => p.id === productId || p.id === String(productId));
    if (!product) return "";
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const productName = product.name || product.name_en || product.name_ar || product.sku || "PROD";
    const prefix = productName.substring(0, 3).toUpperCase().replace(/\s/g, '');
    return `${prefix}-${dateStr}-${random}`;
  };

  // Handle product selection
  const handleProductSelect = (productId) => {
    const product = availableProducts.find(p => p.id === productId || p.id === String(productId));
    if (product) {
      const batchCode = generateBatchCode(productId);
      const today = new Date().toISOString().split('T')[0];
      const expiryDate = new Date();
      // Use shelf_life_days from product, default to 30 if not available
      const shelfLifeDays = product.shelf_life_days || 30;
      expiryDate.setDate(expiryDate.getDate() + shelfLifeDays);

      setFormData({
        ...formData,
        product_id: productId,
        batch_code: batchCode,
        unit: product.unit || "unit",
        production_date: today,
        expiry_date: expiryDate.toISOString().split('T')[0],
      });
    } else {
      setFormData({ ...formData, product_id: productId });
    }
  };

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  // Dummy batches data - Yemen
  const dummyBatches = useMemo(() => {
    const today = new Date();
    return [
      {
        id: "batch-001",
        batch_code: "MLK-20241210-001",
        product_name: language === "ar" ? "حليب طازج" : "Fresh Milk",
        quantity: 500,
        unit: "l",
        production_date: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "in_storage",
        priority: 1,
        days_until_expiry: 5,
        shelf_life: { remaining_days: 5, status: "warning" },
        location: language === "ar" ? "صنعاء" : "Sana'a",
      },
      {
        id: "batch-002",
        batch_code: "MNG-20241208-015",
        product_name: language === "ar" ? "عصير مانجو" : "Mango Juice",
        quantity: 300,
        unit: "l",
        production_date: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(today.getTime() + 24 * 24 * 60 * 60 * 1000).toISOString(),
        status: "in_storage",
        priority: 2,
        days_until_expiry: 24,
        shelf_life: { remaining_days: 24, status: "good" },
        location: language === "ar" ? "عدن" : "Aden",
      },
      {
        id: "batch-003",
        batch_code: "YGT-20241205-008",
        product_name: language === "ar" ? "زبادي" : "Yogurt",
        quantity: 200,
        unit: "unit",
        production_date: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: "in_storage",
        priority: 3,
        days_until_expiry: 5,
        shelf_life: { remaining_days: 5, status: "warning" },
        location: language === "ar" ? "تعز" : "Taiz",
      },
      {
        id: "batch-004",
        batch_code: "CHS-20241201-022",
        product_name: language === "ar" ? "جبنة بلدي" : "Local Cheese",
        quantity: 50,
        unit: "kg",
        production_date: new Date(today.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        status: "in_storage",
        priority: 4,
        days_until_expiry: 8,
        shelf_life: { remaining_days: 8, status: "caution" },
        location: language === "ar" ? "الحديدة" : "Hodeidah",
      },
      {
        id: "batch-005",
        batch_code: "LBN-20241212-003",
        product_name: language === "ar" ? "لبن" : "Laban",
        quantity: 150,
        unit: "l",
        production_date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(),
        status: "in_storage",
        priority: 5,
        days_until_expiry: 9,
        shelf_life: { remaining_days: 9, status: "good" },
        location: language === "ar" ? "إب" : "Ibb",
      },
      {
        id: "batch-006",
        batch_code: "HNY-20241207-011",
        product_name: language === "ar" ? "عسل يمني" : "Yemeni Honey",
        quantity: 100,
        unit: "kg",
        production_date: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: "in_transit",
        priority: 6,
        days_until_expiry: 365,
        shelf_life: { remaining_days: 365, status: "good" },
        location: language === "ar" ? "حضرموت" : "Hadhramaut",
      },
      {
        id: "batch-007",
        batch_code: "SMN-20241213-002",
        product_name: language === "ar" ? "سمن بلدي" : "Local Ghee",
        quantity: 80,
        unit: "kg",
        production_date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        status: "in_storage",
        priority: 7,
        days_until_expiry: 60,
        shelf_life: { remaining_days: 60, status: "good" },
        location: language === "ar" ? "ذمار" : "Dhamar",
      },
      {
        id: "batch-008",
        batch_code: "BTR-20241115-005",
        product_name: language === "ar" ? "زبدة" : "Butter",
        quantity: 100,
        unit: "g",
        production_date: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(today.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString(),
        status: "in_storage",
        priority: 7,
        days_until_expiry: 31,
        shelf_life: { remaining_days: 31, status: "good" },
      },
      {
        id: "batch-009",
        batch_code: "MLK-20241205-018",
        product_name: language === "ar" ? "حليب طازج" : "Fresh Milk",
        quantity: 200,
        unit: "l",
        production_date: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        status: "wasted",
        priority: 0,
        days_until_expiry: -1,
        shelf_life: { remaining_days: -1, status: "expired" },
      },
      {
        id: "batch-010",
        batch_code: "YGT-20241210-012",
        product_name: language === "ar" ? "زبادي" : "Yogurt",
        quantity: 150,
        unit: "unit",
        production_date: new Date(today.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        expiry_date: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        status: "sold_out",
        priority: 0,
        days_until_expiry: 10,
        shelf_life: { remaining_days: 10, status: "good" },
      },
    ];
  }, [language]);

  const filteredBatches = useMemo(() => {
    if (!batches) return [];

    return batches.filter((batch) => {
      const code = batch.batch_code || "";
      const name = batch.product_name || "";
      const loc = batch.location_name || "";

      const matchesSearch =
        code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loc.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = selectedStatus === "all" ||
        batch.status === selectedStatus ||
        batch.location_type === selectedStatus;

      // Calculate if batch is expired
      // Prioritize date calculation to match UI rendering, as min_shelf_life_days might be stale
      let isExpired = false;

      const expiryDateStr = batch.actual_expiry || batch.expiry_date || batch.earliest_expiry_date;

      if (expiryDateStr) {
        const expiryDate = new Date(expiryDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        isExpired = expiryDate < today;
      } else if (batch.min_shelf_life_days !== undefined && batch.min_shelf_life_days !== null) {
        isExpired = batch.min_shelf_life_days <= 0;
      } else if (batch.days_until_expiry !== undefined && batch.days_until_expiry !== null) {
        isExpired = batch.days_until_expiry <= 0;
      }

      // Filter logic based on view mode
      if (viewMode === "expired") {
        // Expired tab: ONLY show expired batches
        return matchesSearch && matchesStatus && isExpired;
      } else if (viewMode === "all") {
        // All Batches tab: show ALL batches (expired and non-expired)
        return matchesSearch && matchesStatus;
      } else if (viewMode === "location") {
        // Location Tracking: ONLY show non-expired batches (exclude expired)
        // Explicitly check status !== 'expired' to handle the case where matchesStatus is true (e.g. 'all')
        return matchesSearch && matchesStatus && (!isExpired && batch.status !== 'expired');
      } else {
        // Other tabs (fifo, fefo): ONLY show non-expired batches
        return matchesSearch && matchesStatus && (!isExpired && batch.status !== 'expired');
      }
    }).sort((a, b) => {
      if (viewMode === "fifo") {
        return new Date(a.production_date) - new Date(b.production_date);
      }
      if (viewMode === "fefo") {
        return new Date(a.actual_expiry || a.expiry_date) - new Date(b.actual_expiry || b.expiry_date);
      }
      if (viewMode === "location") {
        return (a.min_shelf_life_days || 999) - (b.min_shelf_life_days || 999);
      }
      return 0;
    });
  }, [batches, searchTerm, selectedStatus, viewMode]);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      await create({
        ...formData,
        quantity: parseFloat(formData.quantity),
      });
      setShowCreateModal(false);
      setFormData({
        product_id: "",
        facility_id: user?.facility_id || "",
        batch_code: "",
        quantity: "",
        unit: "unit",
        production_date: "",
        expiry_date: "",
        status: "in_storage",
      });
      reload();
    } catch (err) {
      alert(err.message || "Error creating batch");
    }
  };

  const handleUpdateBatch = async (batchId, updates) => {
    try {
      await update(batchId, updates);
      reload();
    } catch (err) {
      alert(err.message || "Error updating batch");
    }
  };

  const handleShipBatch = async (batchId, targetFacilityId) => {
    try {
      await ship(batchId, { target_facility_id: targetFacilityId });
      reload();
    } catch (err) {
      alert(err.message || "Error shipping batch");
    }
  };

  const getShelfLifeColor = (shelfLife) => {
    if (!shelfLife || !shelfLife.status) return "text-gray-500";
    const status = shelfLife.status;
    if (status === "expired" || status === "critical") return "text-red-500";
    if (status === "warning") return "text-yellow-500";
    if (status === "caution") return "text-orange-500";
    return "text-green-500";
  };

  return (
    <div className="space-y-6 pb-20" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Premium Header */}
      <div className={`relative overflow-hidden rounded-[32px] p-6 shadow-xl mb-4`} style={{
        background: theme === "dark"
          ? "linear-gradient(135deg, #064e3b 0%, #065f46 100%)"
          : "linear-gradient(135deg, #429EBD 0%, #053F5C 100%)"
      }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32 blur-3xl opacity-50" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 uppercase tracking-tight">
                {language === "ar" ? "إدارة الدفعات" : "Batch Ledger"}
              </h2>
              <p className="text-white/70 text-sm font-medium">
                {language === "ar" ? "تتبع الإنتاج وتحليل الصلاحية الذكي" : "Track production & intelligent shelf-life analysis"}
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center backdrop-blur-md border border-white/20 active:scale-90 transition-all"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {[
              { label: language === "ar" ? "الكل" : "Total", value: filteredBatches.length, color: "white" },
              { label: language === "ar" ? "خطر" : "Risk", value: filteredBatches.filter(b => (b.min_shelf_life_days || b.days_until_expiry) <= 3).length, color: "red-400" },
              { label: language === "ar" ? "قريب" : "Soon", value: filteredBatches.filter(b => (b.min_shelf_life_days || b.days_until_expiry) <= 7 && (b.min_shelf_life_days || b.days_until_expiry) > 3).length, color: "amber-400" },
            ].map((s, i) => (
              <div key={i} className="min-w-[80px] flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
                <div className="text-lg font-black text-white">{s.value}</div>
                <div className={`text-[9px] font-black uppercase tracking-widest text-${s.color} opacity-80`}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modern Filter Tabs */}
      <div className="flex flex-col gap-3 px-1">
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {[
            { id: 'location', label: language === 'ar' ? 'المواقع' : 'Locations', color: '#429EBD' },
            { id: 'fefo', label: 'FEFO', color: '#10b981' },
            { id: 'all', label: language === 'ar' ? 'الكل' : 'Store', color: '#6366f1' },
            { id: 'expired', label: language === 'ar' ? 'المنتهية' : 'Expired', color: '#ef4444' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-2xl border-2 font-black text-xs uppercase transition-all ${viewMode === tab.id
                  ? 'text-white'
                  : `${cardBgClass} ${borderClass} ${subTextColor}`
                }`}
              style={{ backgroundColor: viewMode === tab.id ? tab.color : 'transparent', borderColor: viewMode === tab.id ? tab.color : '' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative group">
          <input
            type="text"
            placeholder={language === "ar" ? "البحث بالكود أو المنتج..." : "Search code or product..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full h-14 px-12 rounded-2xl border-2 ${borderClass} ${cardBgClass} ${textColor} text-base font-medium shadow-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none`}
          />
          <div className={`absolute top-1/2 -translate-y-1/2 ${language === "ar" ? "right-4" : "left-4"} ${subTextColor}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>
        </div>
      </div>

      {/* Batch Cards List */}
      <div className="space-y-4 px-1">
        {filteredBatches.length === 0 ? (
          <div className={`text-center py-20 ${cardBgClass} rounded-[32px] border-2 border-dashed ${borderClass} opacity-60`}>
            <div className="text-5xl mb-4">🧪</div>
            <p className="font-black text-xl">{language === "ar" ? "لا توجد دفعات" : "No batches found"}</p>
          </div>
        ) : (
          filteredBatches.map((batch, idx) => {
            const daysLeft = batch.min_shelf_life_days || batch.days_until_expiry;
            const isExpired = daysLeft < 0;
            const status = isExpired ? "expired" : daysLeft <= 3 ? "critical" : daysLeft <= 7 ? "warning" : "good";
            const colors = {
              expired: "bg-red-600 border-red-600 shadow-red-500/10",
              critical: "bg-red-500 border-red-500 shadow-red-500/10",
              warning: "bg-amber-500 border-amber-500 shadow-amber-500/10",
              good: "bg-emerald-500 border-emerald-500 shadow-emerald-500/10"
            };

            return (
              <div key={batch.id} className="group relative">
                <div className={`relative rounded-[32px] border-2 ${borderClass} ${cardBgClass} p-5 shadow-xl transition-all duration-300 active:scale-[0.97] overflow-hidden`}>
                  {/* Status Accent Sidebar */}
                  <div className={`absolute top-0 bottom-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-1.5 ${colors[status].split(' ')[0]}`} />

                  {/* Header Row */}
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black font-mono tracking-tighter px-2.5 py-1 rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 border border-black/5 uppercase">
                          {batch.batch_code}
                        </span>
                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase text-white ${colors[status].split(' ')[0]}`}>
                          {isExpired ? (language === 'ar' ? 'منتهي' : 'Expired') : (language === 'ar' ? `${daysLeft} يوم متبقي` : `${daysLeft}d left`)}
                        </div>
                      </div>
                      <h4 className={`text-xl font-black ${textColor} truncate mb-0.5`}>{batch.product_name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>{batch.location_name || "Main Warehouse"}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-2xl font-black ${textColor}`}>{batch.cartons?.toLocaleString()}</div>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>{language === 'ar' ? 'كرتون' : 'Cartons'}</div>
                    </div>
                  </div>

                  {/* Tech Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} border ${borderClass}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">{language === 'ar' ? 'تاريخ الإنتاج' : 'Mfg Date'}</span>
                        <span className={`text-xs font-black ${textColor}`}>{new Date(batch.production_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-full opacity-50" />
                      </div>
                    </div>
                    <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} border ${borderClass}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9px] font-black uppercase text-slate-500 tracking-tighter">{language === 'ar' ? 'تاريخ الانتهاء' : 'Exp Date'}</span>
                        <span className={`text-xs font-black ${status === 'expired' ? 'text-red-500 font-black' : textColor}`}>{new Date(batch.expiry_date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${status === 'good' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${Math.max(10, Math.min(100, (daysLeft / 30) * 100))}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-4 border-t-2 border-dashed ${borderClass}">
                    <div className="flex items-center gap-3">
                      {(viewMode === 'fifo' || viewMode === 'fefo') && (
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-black text-sm">
                          #{idx + 1}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className={`text-[9px] font-black tracking-widest uppercase ${subTextColor}`}>{language === 'ar' ? 'خوارزمية الذكاء الاصطناعي' : 'AI Health'}</span>
                        <span className={`text-xs font-black ${batch.ai_spoilage_status === 'Good' ? 'text-emerald-500' : 'text-red-500'}`}>
                          {batch.ai_spoilage_status || 'Analyzed'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedBatch(batch); setShowEditModal(true); }} className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center active:scale-90 transition-all border border-blue-500/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button onClick={() => { setSelectedBatch(batch); setShowReviewModal(batch.id); }} className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center active:scale-90 transition-all border border-emerald-500/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
              onClick={() => setShowCreateModal(false)}
            ></div>

            <div className={`relative transform overflow-hidden rounded-2xl ${theme === "dark" ? "bg-slate-900 border border-white/10" : "bg-white"} p-0 text-right shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg animate-scale-in flex flex-col max-h-[90vh]`}>
              {/* Modal Header */}
              <div className={`p-6 border-b ${borderClass} flex items-center justify-between`}>
                <h3 className={`text-2xl font-bold ${textColor}`}>
                  {t("createBatch") || "إنشاء دفعة جديدة"}
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className={`text-2xl ${subTextColor} hover:${textColor} transition-colors`}
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex-1">
                <form id="batch-form" onSubmit={handleCreateBatch} className="space-y-4 text-right" dir={language === "ar" ? "rtl" : "ltr"}>
                  {/* Product Selection */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {t("selectProduct") || "اختر المنتج"} <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.product_id}
                      onChange={(e) => handleProductSelect(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border-2 ${borderClass} ${textColor} ${cardBgClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]/50 transition-all`}
                    >
                      <option value="">{language === "ar" ? "-- اختر المنتج --" : "-- Select Product --"}</option>
                      {availableProducts.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} ({product.category})
                        </option>
                      ))}
                    </select>
                    {/* Removed: <p className={`text-xs mt-1 ${subTextColor}`}>
                    {language === "ar" ? "سيتم إنشاء رمز الدفعة وتاريخ الانتهاء تلقائياً" : "Batch code and expiry date will be generated automatically"}
                  </p> */}
                  </div>

                  {/* Selected Product Info */}
                  {formData.product_id && (
                    <div className={`p-4 rounded-lg border ${borderClass} ${theme === "dark" ? "bg-slate-800/50" : "bg-[#E0F7FA]/50"}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme === "dark" ? "#10b981" : "#059669"} strokeWidth="2">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        <span className={`font-semibold ${textColor}`}>
                          {availableProducts.find(p => p.id === formData.product_id)?.name}
                        </span>
                      </div>
                      <div className={`text-sm ${subTextColor}`}>
                        {language === "ar" ? "الفئة:" : "Category:"} {availableProducts.find(p => p.id === formData.product_id)?.category}
                      </div>
                    </div>
                  )}

                  {/* Batch Code */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {t("batchCode") || "رمز الدفعة"} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={formData.batch_code}
                        onChange={(e) => setFormData({ ...formData, batch_code: e.target.value })}
                        /* Removed: placeholder={language === "ar" ? "سيتم إنشاؤه تلقائياً" : "Auto-generated"} */
                        className={`flex-1 px-4 py-3 rounded-lg border-2 ${borderClass} ${textColor} ${cardBgClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]/50 transition-all`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.product_id) {
                            setFormData({ ...formData, batch_code: generateBatchCode(formData.product_id) });
                          }
                        }}
                        disabled={!formData.product_id}
                        className={`px-4 py-3 rounded-lg transition-all ${formData.product_id
                          ? "bg-[#429EBD] text-white hover:bg-[#2d7a9a]"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                          }`}
                      /* Removed: title={language === "ar" ? "إنشاء رمز جديد" : "Generate new code"} */
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                          <path d="M3 21v-5h5" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {t("quantity") || "الكمية"} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        step="0.01"
                        min="0.01"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        /* Removed: placeholder={t("enterQuantity") || "أدخل الكمية"} */
                        className={`flex-1 px-4 py-3 rounded-lg border-2 ${borderClass} ${textColor} ${cardBgClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]/50 transition-all`}
                      />
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        className={`px-4 py-3 rounded-lg border-2 ${borderClass} ${textColor} ${cardBgClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]/50`}
                      >
                        <option value="unit">{t("unit") || "وحدة"}</option>
                        <option value="kg">{t("kg") || "كجم"}</option>
                        <option value="g">{t("g") || "جرام"}</option>
                        <option value="l">{t("liter") || "لتر"}</option>
                        <option value="ml">{t("ml") || "مل"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Dates Row */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Production Date */}
                    <div>
                      <label className={`block ${textColor} mb-2 font-medium`}>
                        {t("productionDate") || "تاريخ الإنتاج"}
                      </label>
                      <input
                        type="date"
                        value={formData.production_date}
                        onChange={(e) => setFormData({ ...formData, production_date: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                        className={`w-full px-4 py-3 rounded-lg border-2 ${borderClass} ${textColor} ${cardBgClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]/50 transition-all`}
                      />
                    </div>

                    {/* Expiry Date */}
                    <div>
                      <label className={`block ${textColor} mb-2 font-medium`}>
                        {t("expiryDate") || "تاريخ الانتهاء"} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        /* Removed: min={formData.production_date || new Date().toISOString().split('T')[0]} */
                        className={`w-full px-4 py-3 rounded-lg border-2 ${borderClass} ${textColor} ${cardBgClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]/50 transition-all`}
                      />
                    </div>
                  </div>

                  {/* Shelf Life Preview */}
                  {formData.expiry_date && formData.production_date && (
                    <div className={`p-4 rounded-lg border ${borderClass} ${theme === "dark" ? "bg-emerald-900/20" : "bg-emerald-50"}`}>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm ${subTextColor}`}>
                          {language === "ar" ? "مدة الصلاحية:" : "Shelf Life:"}
                        </span>
                        <span className={`font-bold ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}>
                          {Math.ceil((new Date(formData.expiry_date) - new Date(formData.production_date)) / (1000 * 60 * 60 * 24))} {language === "ar" ? "يوم" : "days"}
                        </span>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Modal Footer */}
              <div className={`p-6 border-t ${borderClass} flex gap-3`}>
                <button
                  type="submit"
                  form="batch-form"
                  disabled={creating || !formData.batch_code || !formData.product_id || !formData.quantity || !formData.expiry_date}
                  className="flex-1 px-6 py-3 bg-[#429EBD] text-white rounded-lg hover:bg-[#2d7a9a] disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-lg"
                >
                  {creating ? (t("creating") || "جاري الإنشاء...") : (t("create") || "إنشاء")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      product_id: "",
                      facility_id: user?.facility_id || "",
                      batch_code: "",
                      quantity: "",
                      unit: "unit",
                      production_date: "",
                      expiry_date: "",
                      status: "in_storage",
                    });
                  }}
                  className={`px-6 py-3 rounded-lg border-2 ${borderClass} ${textColor} hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-semibold`}
                >
                  {t("cancel") || "إلغاء"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BatchManagement;

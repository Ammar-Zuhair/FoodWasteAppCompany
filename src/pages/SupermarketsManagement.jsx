import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import StatusBadge from "../components/shared/StatusBadge.jsx";
import { getSupermarkets, createSupermarket, updateSupermarket, deleteSupermarket } from "../utils/api/supermarkets.js";
import { getStoredUser } from "../utils/api/auth.js";

function SupermarketsManagement() {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const user = getStoredUser();

  const [supermarkets, setSupermarkets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingSupermarket, setEditingSupermarket] = useState(null);
  const [deletingSupermarket, setDeletingSupermarket] = useState(null);
  const [saving, setSaving] = useState(false);

  // Yemeni governorates
  const governorates = [
    { value: "sanaa", label: language === "ar" ? "صنعاء" : "Sana'a" },
    { value: "aden", label: language === "ar" ? "عدن" : "Aden" },
    { value: "taiz", label: language === "ar" ? "تعز" : "Taiz" },
    { value: "hodeidah", label: language === "ar" ? "الحديدة" : "Hodeidah" },
    { value: "ibb", label: language === "ar" ? "إب" : "Ibb" },
    { value: "dhamar", label: language === "ar" ? "ذمار" : "Dhamar" },
    { value: "mukalla", label: language === "ar" ? "المكلا" : "Mukalla" },
    { value: "sayun", label: language === "ar" ? "سيئون" : "Sayun" },
    { value: "marib", label: language === "ar" ? "مأرب" : "Marib" },
  ];

  const initialFormState = {
    name: "",
    code: "",
    governorate: "",
    address: "",
    manager: "",
    phone: "",
    employees: 0,
    area: 0,
    products_count: 0,
    daily_sales_target: 0,
    status: "active",
  };
  const [formData, setFormData] = useState(initialFormState);

  // Dummy Yemen supermarkets with rich data
  const dummySupermarkets = useMemo(() => [
    { id: "sm-001", name: language === "ar" ? "هايل مارت - صنعاء الزبيري" : "Hayel Mart - Sana'a Zubairi", code: "HM-SAN-001", governorate: "sanaa", address: language === "ar" ? "شارع الزبيري، أمام البنك المركزي" : "Zubairi St, Front of Central Bank", manager: language === "ar" ? "أحمد محمد الصنعاني" : "Ahmed Mohammed Al-Sanaani", phone: "+967 1 234567", employees: 25, area: 450, products_count: 1250, daily_sales: 85000, daily_sales_target: 80000, customers_today: 320, status: "active" },
    { id: "sm-002", name: language === "ar" ? "هايل مارت - صنعاء حدة" : "Hayel Mart - Sana'a Hadda", code: "HM-SAN-002", governorate: "sanaa", address: language === "ar" ? "شارع حدة، بجوار مستشفى الثورة" : "Hadda St, Next to Revolution Hospital", manager: language === "ar" ? "محمد علي العمري" : "Mohammed Ali Al-Omari", phone: "+967 1 345678", employees: 20, area: 380, products_count: 1100, daily_sales: 72000, daily_sales_target: 70000, customers_today: 280, status: "active" },
    { id: "sm-003", name: language === "ar" ? "هايل مارت - عدن كريتر" : "Hayel Mart - Aden Crater", code: "HM-ADN-001", governorate: "aden", address: language === "ar" ? "كريتر، شارع الملكة أروى" : "Crater, Queen Arwa St", manager: language === "ar" ? "سالم عبدالله العدني" : "Salem Abdullah Al-Adeni", phone: "+967 2 456789", employees: 18, area: 350, products_count: 980, daily_sales: 65000, daily_sales_target: 60000, customers_today: 245, status: "active" },
    { id: "sm-004", name: language === "ar" ? "هايل مارت - عدن المعلا" : "Hayel Mart - Aden Ma'alla", code: "HM-ADN-002", governorate: "aden", address: language === "ar" ? "المعلا، شارع الميناء" : "Ma'alla, Port Street", manager: language === "ar" ? "خالد حسين البحري" : "Khalid Hussein Al-Bahri", phone: "+967 2 567890", employees: 15, area: 280, products_count: 820, daily_sales: 48000, daily_sales_target: 50000, customers_today: 190, status: "warning" },
    { id: "sm-005", name: language === "ar" ? "هايل مارت - تعز المظفر" : "Hayel Mart - Taiz Muzaffar", code: "HM-TAZ-001", governorate: "taiz", address: language === "ar" ? "المظفر، شارع جمال" : "Muzaffar, Jamal St", manager: language === "ar" ? "علي أحمد التعزي" : "Ali Ahmed Al-Taizi", phone: "+967 4 678901", employees: 15, area: 320, products_count: 850, daily_sales: 55000, daily_sales_target: 55000, customers_today: 210, status: "active" },
    { id: "sm-006", name: language === "ar" ? "هايل مارت - الحديدة" : "Hayel Mart - Hodeidah", code: "HM-HOD-001", governorate: "hodeidah", address: language === "ar" ? "شارع صنعاء، الحديدة" : "Sana'a St, Hodeidah", manager: language === "ar" ? "عمر فهد الحديدي" : "Omar Fahd Al-Hodaidi", phone: "+967 3 789012", employees: 12, area: 260, products_count: 720, daily_sales: 42000, daily_sales_target: 45000, customers_today: 165, status: "warning" },
    { id: "sm-007", name: language === "ar" ? "هايل مارت - إب" : "Hayel Mart - Ibb", code: "HM-IBB-001", governorate: "ibb", address: language === "ar" ? "المشنة، إب" : "Mashna, Ibb", manager: language === "ar" ? "فاطمة سعيد الإبي" : "Fatima Saeed Al-Ibbi", phone: "+967 4 890123", employees: 10, area: 220, products_count: 650, daily_sales: 38000, daily_sales_target: 40000, customers_today: 145, status: "active" },
    { id: "sm-008", name: language === "ar" ? "هايل مارت - المكلا" : "Hayel Mart - Mukalla", code: "HM-MKL-001", governorate: "mukalla", address: language === "ar" ? "الديس الشرقية، المكلا" : "Dis, Mukalla", manager: language === "ar" ? "سعيد محمد باوزير" : "Saeed Mohammed Bawazir", phone: "+967 5 901234", employees: 8, area: 200, products_count: 580, daily_sales: 32000, daily_sales_target: 35000, customers_today: 120, status: "active" },
    { id: "sm-009", name: language === "ar" ? "هايل مارت - ذمار" : "Hayel Mart - Dhamar", code: "HM-DHM-001", governorate: "dhamar", address: language === "ar" ? "وسط المدينة، ذمار" : "Downtown, Dhamar", manager: language === "ar" ? "ياسر علي الذماري" : "Yasser Ali Al-Dhamari", phone: "+967 6 012345", employees: 8, area: 180, products_count: 520, daily_sales: 28000, daily_sales_target: 30000, customers_today: 105, status: "maintenance" },
    { id: "sm-010", name: language === "ar" ? "هايل مارت - مأرب" : "Hayel Mart - Marib", code: "HM-MAR-001", governorate: "marib", address: language === "ar" ? "شارع الجمهورية، مأرب" : "Republic St, Marib", manager: language === "ar" ? "ناصر أحمد المأربي" : "Nasser Ahmed Al-Maribi", phone: "+967 6 123456", employees: 10, area: 240, products_count: 680, daily_sales: 45000, daily_sales_target: 42000, customers_today: 175, status: "active" },
  ], [language]);

  useEffect(() => {
    loadSupermarkets();
  }, []);

  const loadSupermarkets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupermarkets({ organization_id: user?.organization_id });
      if (data && data.length > 0) {
        const enrichedData = data.map((sm, index) => {
          const dummy = dummySupermarkets[index % dummySupermarkets.length];
          return {
            ...sm,
            manager: sm.manager || sm.contact_person || dummy.manager,
            phone: sm.phone || dummy.phone,
            governorate: sm.governorate || dummy.governorate,
            address: sm.address || dummy.address,
            employees: sm.employees || dummy.employees,
            area: sm.area || dummy.area,
            products_count: sm.products_count || dummy.products_count,
            daily_sales: sm.daily_sales || dummy.daily_sales,
            daily_sales_target: sm.daily_sales_target || dummy.daily_sales_target,
            customers_today: sm.customers_today || dummy.customers_today,
          };
        });
        setSupermarkets(enrichedData);
      } else {
        setSupermarkets(dummySupermarkets);
      }
    } catch (err) {
      setSupermarkets(dummySupermarkets);
    } finally {
      setLoading(false);
    }
  };

  const displaySupermarkets = useMemo(() => {
    let result = supermarkets.length > 0 ? supermarkets : dummySupermarkets;

    if (searchTerm) {
      result = result.filter(sm =>
        sm.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sm.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sm.manager?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      result = result.filter(sm => sm.status === filterStatus);
    }

    return result;
  }, [supermarkets, dummySupermarkets, searchTerm, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const all = supermarkets.length > 0 ? supermarkets : dummySupermarkets;
    return {
      total: all.length,
      active: all.filter(s => s.status === "active").length,
      warning: all.filter(s => s.status === "warning").length,
      maintenance: all.filter(s => s.status === "maintenance").length,
      totalEmployees: all.reduce((sum, s) => sum + (s.employees || 0), 0),
      totalDailySales: all.reduce((sum, s) => sum + (s.daily_sales || 0), 0),
      totalProducts: all.reduce((sum, s) => sum + (s.products_count || 0), 0),
      totalCustomers: all.reduce((sum, s) => sum + (s.customers_today || 0), 0),
    };
  }, [supermarkets, dummySupermarkets]);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";
  const inputClass = `w-full px-4 py-3 rounded-xl border-2 ${borderClass} ${cardBgClass} ${textColor} focus:outline-none focus:ring-2 focus:ring-[#429EBD]/50 transition-all`;

  const getGovernorateLabel = (value) => {
    const gov = governorates.find(g => g.value === value);
    return gov ? gov.label : value || "-";
  };

  const openAddModal = () => {
    setEditingSupermarket(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const openEditModal = (supermarket) => {
    setEditingSupermarket(supermarket);
    setFormData({
      name: supermarket.name || "",
      code: supermarket.code || "",
      governorate: supermarket.governorate || "",
      address: supermarket.address || "",
      manager: supermarket.manager || "",
      phone: supermarket.phone || "",
      employees: supermarket.employees || 0,
      area: supermarket.area || 0,
      products_count: supermarket.products_count || 0,
      daily_sales_target: supermarket.daily_sales_target || 0,
      status: supermarket.status || "active",
    });
    setShowModal(true);
  };

  const openDeleteModal = (supermarket) => {
    setDeletingSupermarket(supermarket);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingSupermarket) {
        try {
          await updateSupermarket(editingSupermarket.id, formData);
          await loadSupermarkets();
        } catch (err) {
          setSupermarkets(prev => prev.map(sm => sm.id === editingSupermarket.id ? { ...sm, ...formData } : sm));
        }
      } else {
        const newSupermarket = {
          id: `sm-${Date.now()}`,
          ...formData,
          daily_sales: 0,
          customers_today: 0,
          created_at: new Date().toISOString().split('T')[0],
        };
        try {
          await createSupermarket(formData);
          await loadSupermarkets();
        } catch (err) {
          setSupermarkets(prev => [...prev, newSupermarket]);
        }
      }
      setShowModal(false);
      setFormData(initialFormState);
      setEditingSupermarket(null);
    } catch (err) {
      alert(language === "ar" ? "حدث خطأ أثناء الحفظ" : "Error saving supermarket");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingSupermarket) return;

    setSaving(true);
    try {
      try {
        await deleteSupermarket(deletingSupermarket.id);
        await loadSupermarkets();
      } catch (err) {
        setSupermarkets(prev => prev.filter(sm => sm.id !== deletingSupermarket.id));
      }
      setShowDeleteModal(false);
      setDeletingSupermarket(null);
    } catch (err) {
      alert(language === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting supermarket");
    } finally {
      setSaving(false);
    }
  };

  const getSalesPerformance = (daily_sales, target) => {
    if (!target) return { percentage: 0, color: "gray" };
    const percentage = Math.round((daily_sales / target) * 100);
    if (percentage >= 100) return { percentage, color: "emerald" };
    if (percentage >= 80) return { percentage, color: "amber" };
    return { percentage, color: "red" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#429EBD] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg font-semibold ${textColor}`}>
            {language === "ar" ? "جاري تحميل السوبر ماركت..." : "Loading supermarkets..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 pb-10" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header - Mobile Style */}
      <div className="flex flex-col gap-3">
        <div>
          <h2 className={`text-xl sm:text-2xl md:text-3xl font-black ${textColor} mb-1 uppercase tracking-tight`}>
            {language === "ar" ? "إدارة المتاجر" : "Supermarkets"}
          </h2>
          <p className={`text-sm ${subTextColor}`}>
            {language === "ar" ? "إدارة وتتبع أداء منافذ البيع" : "Manage and track outlet performance"}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-black shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 5v14m-7-7h14" />
          </svg>
          {language === "ar" ? "إضافة متجر" : "New Outlet"}
        </button>
      </div>

      {/* Stats - Horizontal Scrollable on Mobile */}
      <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar -mx-1 px-1">
        {[
          { label: language === "ar" ? "إجمالي" : "Total", value: stats.total, color: "blue", icon: "🏢" },
          { label: language === "ar" ? "نشط" : "Active", value: stats.active, color: "emerald", icon: "✅" },
          { label: language === "ar" ? "المبيعات" : "Sales", value: `${(stats.totalDailySales / 1000).toFixed(0)}K`, color: "purple", icon: "💰" },
          { label: language === "ar" ? "عملاء" : "Users", value: stats.totalCustomers, color: "pink", icon: "👥" },
        ].map((stat, i) => (
          <div key={i} className={`min-w-[100px] flex-1 p-3 rounded-2xl border ${borderClass} ${cardBgClass} flex flex-col items-center justify-center shadow-sm`}>
            <span className="text-xl mb-1">{stat.icon}</span>
            <span className={`text-lg font-black ${textColor}`}>{stat.value}</span>
            <span className={`text-[10px] font-bold uppercase ${subTextColor}`}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col gap-3">
        <div className="relative group">
          <input
            type="text"
            placeholder={language === "ar" ? "البحث بالاسم أو الكود..." : "Search by name or code..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full h-14 px-12 rounded-2xl border-2 ${borderClass} ${cardBgClass} ${textColor} text-base font-medium shadow-sm focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none`}
          />
          <div className={`absolute top-1/2 -translate-y-1/2 ${language === "ar" ? "right-4" : "left-4"} ${subTextColor}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full h-14 px-4 rounded-2xl border-2 ${borderClass} ${cardBgClass} ${textColor} text-sm font-black shadow-sm appearance-none focus:ring-4 focus:ring-purple-500/20 outline-none`}
            >
              <option value="all">{language === "ar" ? "جميع الحالات" : "All Status"}</option>
              <option value="active">{language === "ar" ? "نشط" : "Active"}</option>
              <option value="warning">{language === "ar" ? "تحذير" : "Warning"}</option>
              <option value="maintenance">{language === "ar" ? "صيانة" : "Maintenance"}</option>
            </select>
            <div className={`absolute top-1/2 -translate-y-1/2 ${language === "ar" ? "left-4" : "right-4"} pointer-events-none ${subTextColor}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m6 9 6 6 6-6" /></svg>
            </div>
          </div>
          <button className={`w-14 h-14 flex items-center justify-center rounded-2xl border-2 ${borderClass} ${cardBgClass} ${textColor} hover:bg-purple-500/10 active:scale-90 transition-all`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18M7 12h10M10 18h4" /></svg>
          </button>
        </div>
      </div>

      {/* Outlet Cards */}
      <div className="grid grid-cols-1 gap-4">
        {displaySupermarkets.length === 0 ? (
          <div className={`text-center py-20 ${cardBgClass} rounded-[32px] border-2 border-dashed ${borderClass} opacity-60`}>
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-black text-xl">{language === "ar" ? "لا توجد نتائج" : "No outlets found"}</p>
            <p className="text-sm">{language === "ar" ? "جرب البحث بكلمات أخرى" : "Try searching with different terms"}</p>
          </div>
        ) : (
          displaySupermarkets.map((sm) => {
            const perf = getSalesPerformance(sm.daily_sales, sm.daily_sales_target);
            return (
              <div key={sm.id} className={`group relative rounded-[32px] border-2 ${borderClass} ${cardBgClass} p-5 shadow-xl transition-all duration-300 active:scale-[0.97] overflow-hidden`}>
                {/* Decorative Background Gradient */}
                <div className={`absolute -top-24 -right-24 w-64 h-64 bg-${perf.color}-500/5 rounded-full blur-3xl group-hover:bg-${perf.color}-500/10 transition-all duration-500`} />
                <div className={`absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all duration-500`} />

                {/* Card Header */}
                <div className="relative z-10 flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-14 h-14 rounded-[20px] shrink-0 flex items-center justify-center bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30`}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h4 className={`text-xl font-black ${textColor} truncate mb-0.5`}>{sm.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black font-mono tracking-tighter px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-black/5 uppercase">
                          {sm.code}
                        </span>
                        <div className="flex items-center gap-1">
                          <div className={`w-2 h-2 rounded-full ${sm.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                          <span className={`text-[10px] font-bold uppercase ${subTextColor}`}>
                            {sm.status === 'active' ? (language === 'ar' ? 'مباشر الآن' : 'Live Now') : (language === 'ar' ? 'تحذير' : 'Warning')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="scale-90 origin-top-right">
                    <StatusBadge status={sm.status || "active"} />
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="relative z-10 grid grid-cols-2 gap-4 mb-6">
                  {/* Sales KPI */}
                  <div className={`p-4 rounded-[24px] ${theme === "dark" ? "bg-white/5" : "bg-slate-50"} border ${borderClass} relative overflow-hidden`}>
                    <div className="flex justify-between items-center mb-3">
                      <span className={`text-[10px] font-black uppercase tracking-wider ${subTextColor}`}>
                        {language === "ar" ? "أداء المبيعات" : "Sales Performance"}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-${perf.color}-500/10 text-${perf.color}-500`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 2v20m0-20l-7 7m7-7l7 7" /></svg>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className={`text-2xl font-black ${textColor}`}>{perf.percentage}%</span>
                      <span className={`text-[10px] font-bold ${subTextColor}`}>{language === 'ar' ? 'من الهدف' : 'of target'}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r from-${perf.color}-500 to-${perf.color}-400 transition-all duration-1000 ease-out`}
                        style={{ width: `${Math.min(perf.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Footfall & Products */}
                  <div className={`p-4 rounded-[24px] ${theme === "dark" ? "bg-white/5" : "bg-slate-50"} border ${borderClass}`}>
                    <span className={`text-[10px] font-black uppercase tracking-wider block mb-4 ${subTextColor}`}>
                      {language === "ar" ? "النشاط اليومي" : "Daily Activity"}
                    </span>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                          </div>
                          <span className={`text-xs font-bold ${textColor}`}>{language === "ar" ? "العملاء" : "Footfall"}</span>
                        </div>
                        <span className={`text-sm font-black ${textColor}`}>{sm.customers_today}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 8V21a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg>
                          </div>
                          <span className={`text-xs font-bold ${textColor}`}>{language === "ar" ? "المنتجات" : "Items"}</span>
                        </div>
                        <span className={`text-sm font-black ${textColor}`}>{sm.products_count}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manager & Actions */}
                <div className="relative z-10 flex items-center justify-between pt-5 border-t-2 border-dashed ${borderClass}">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-lg shadow-inner">👤</div>
                    <div className="flex flex-col">
                      <span className={`text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>{language === "ar" ? "المدير المسؤول" : "Outlet Manager"}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-black ${textColor}`}>{sm.manager}</span>
                        <a href={`tel:${sm.phone}`} className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(sm)}
                      className={`w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center hover:bg-blue-500 hover:text-white active:scale-90 transition-all border border-blue-500/20`}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button
                      onClick={() => openDeleteModal(sm)}
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

      {/* Optimized Modals for Mobile */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center">
          <div className={`w-full ${theme === "dark" ? "bg-slate-900" : "bg-white"} rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto animate-slide-up sm:max-w-xl`}>
            <div className="sticky top-0 z-10 px-6 py-4 border-b ${borderClass} bg-inherit flex items-center justify-between">
              <h3 className={`text-xl font-black ${textColor}`}>
                {editingSupermarket ? (language === "ar" ? "تعديل بيانات المتجر" : "Edit Outlet") : (language === "ar" ? "متجر جديد" : "New Outlet")}
              </h3>
              <button onClick={() => setShowModal(false)} className={`w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${textColor}`}>×</button>
            </div>
            <form id="supermarket-form" onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-purple-600 block px-1">{language === "ar" ? "الاسم التجاري" : "Business Name"}</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-600 block px-1">{language === "ar" ? "الكود" : "Code"}</label>
                  <input type="text" required value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className={`${inputClass} font-mono`} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-purple-600 block px-1">{language === "ar" ? "المحافظة" : "Gov"}</label>
                  <select required value={formData.governorate} onChange={(e) => setFormData({ ...formData, governorate: e.target.value })} className={inputClass}>
                    <option value="">...</option>
                    {governorates.map(gov => <option key={gov.value} value={gov.value}>{gov.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-purple-600 block px-1">{language === "ar" ? "العنوان بالتفصيل" : "Full Address"}</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={inputClass} />
              </div>
              {/* ... More simplified fields ... */}
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 font-black border-2 ${borderClass} ${textColor} rounded-2xl active:bg-slate-100 dark:active:bg-slate-800 transition-all">{language === "ar" ? "رجوع" : "Back"}</button>
                <button type="submit" disabled={saving} className="flex-1 py-4 font-black bg-purple-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all">
                  {saving ? (language === "ar" ? "جاري..." : "Saving...") : (language === "ar" ? "حفظ" : "Save")}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Modal */}
      {showDeleteModal && createPortal(
        <div className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className={`${theme === "dark" ? "bg-slate-900" : "bg-white"} w-full max-w-sm rounded-[32px] p-8 text-center animate-scale-in`}>
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
            </div>
            <h3 className={`text-xl font-black ${textColor} mb-2`}>{language === "ar" ? "حذف المتجر؟" : "Delete??"}</h3>
            <p className={`text-sm ${subTextColor} mb-6`}>{language === "ar" ? "لا يمكن التراجع عن حذف بيانات المتجر نهائياً." : "Permanently delete outlet data?"}</p>
            <div className="flex flex-col gap-3">
              <button onClick={handleDelete} className="w-full py-4 bg-red-500 text-white font-black rounded-2xl active:scale-95 transition-all">{language === "ar" ? "نعم، حذف" : "Yes, Delete"}</button>
              <button onClick={() => setShowDeleteModal(false)} className={`w-full py-4 font-black border-2 ${borderClass} ${textColor} rounded-2xl active:bg-slate-100`}>{language === "ar" ? "إلغاء" : "Cancel"}</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default SupermarketsManagement;

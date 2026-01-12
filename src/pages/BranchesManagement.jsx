import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import StatusBadge from "../components/shared/StatusBadge.jsx";
import { getBranches, createBranch, updateBranch, deleteBranch } from "../utils/api/branches.js";
import { getStoredUser } from "../utils/api/auth.js";

function BranchesManagement() {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const user = getStoredUser();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [deletingBranch, setDeletingBranch] = useState(null);
  const [saving, setSaving] = useState(false);

  const initialFormState = {
    name: "",
    code: "",
    address: "",
    governorate: "",
    manager: "",
    phone: "",
    employees: 0,
    facilities: 0,
    status: "active",
  };
  const [formData, setFormData] = useState(initialFormState);

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
    { value: "hajjah", label: language === "ar" ? "حجة" : "Hajjah" },
  ];


  useEffect(() => {
    loadBranches();
  }, []);

  const loadBranches = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getBranches({ organization_id: user?.organization_id });
      // Handle both array and object response formats
      const data = Array.isArray(response) ? response : (response?.branches || []);
      setBranches(data);
      if (data.length === 0) {
        setError(language === "ar" ? "لا توجد فروع متاحة" : "No branches available");
      }
    } catch (err) {
      console.error("Error loading branches:", err);
      setError(err.message || (language === "ar" ? "فشل تحميل البيانات" : "Failed to load data"));
      setBranches([]); // Don't use dummy data
    } finally {
      setLoading(false);
    }
  };

  const displayBranches = useMemo(() => {
    let result = branches;

    // Filter by search
    if (searchTerm) {
      result = result.filter(b =>
        b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.manager?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter(b => b.status === statusFilter);
    }

    return result;
  }, [branches, searchTerm, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const allBranches = branches;
    return {
      total: allBranches.length,
      active: allBranches.filter(b => b.status === "active").length,
      warning: allBranches.filter(b => b.status === "warning").length,
      inactive: allBranches.filter(b => b.status === "inactive").length,
      employees: allBranches.reduce((sum, b) => sum + (b.employees || 0), 0),
      facilities: allBranches.reduce((sum, b) => sum + (b.facilities || 0), 0),
      totalSales: allBranches.reduce((sum, b) => sum + (b.sales || 0), 0),
    };
  }, [branches]);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";
  const inputClass = `w-full px-4 py-3 rounded-xl border-2 ${borderClass} ${cardBgClass} ${textColor} focus:outline-none focus:ring-2 focus:ring-[#429EBD]/50 transition-all`;

  const openAddModal = () => {
    setEditingBranch(null);
    setFormData(initialFormState);
    setShowModal(true);
  };

  const openEditModal = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || "",
      code: branch.code || "",
      address: branch.address || "",
      governorate: branch.governorate || "",
      manager: branch.manager || "",
      phone: branch.phone || "",
      employees: branch.employees || 0,
      facilities: branch.facilities || 0,
      status: branch.status || "active",
    });
    setShowModal(true);
  };

  const openDeleteModal = (branch) => {
    setDeletingBranch(branch);
    setShowDeleteModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingBranch) {
        // Update existing branch
        try {
          await updateBranch(editingBranch.id, formData);
        } catch (err) {
          // Update locally if API fails
          setBranches(prev => prev.map(b => b.id === editingBranch.id ? { ...b, ...formData } : b));
        }
      } else {
        // Create new branch
        const newBranch = {
          id: `br-${Date.now()}`,
          ...formData,
          sales: 0,
          created_at: new Date().toISOString().split('T')[0],
        };
        try {
          await createBranch(formData);
          await loadBranches();
        } catch (err) {
          // Add locally if API fails
          setBranches(prev => [...prev, newBranch]);
        }
      }
      setShowModal(false);
      setFormData(initialFormState);
      setEditingBranch(null);
    } catch (err) {
      alert(language === "ar" ? "حدث خطأ أثناء الحفظ" : "Error saving branch");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingBranch) return;

    setSaving(true);
    try {
      try {
        await deleteBranch(deletingBranch.id);
        await loadBranches();
      } catch (err) {
        // Delete locally if API fails
        setBranches(prev => prev.filter(b => b.id !== deletingBranch.id));
      }
      setShowDeleteModal(false);
      setDeletingBranch(null);
    } catch (err) {
      alert(language === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting branch");
    } finally {
      setSaving(false);
    }
  };

  const getGovernorateLabel = (value) => {
    const gov = governorates.find(g => g.value === value);
    return gov ? gov.label : value || "-";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#429EBD] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className={`text-lg font-semibold ${textColor}`}>
            {language === "ar" ? "جاري تحميل الفروع..." : "Loading branches..."}
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
            {language === "ar" ? "إدارة الفروع" : "Branches Management"}
          </h2>
          <p className={`text-sm md:text-lg ${subTextColor}`}>
            {language === "ar" ? "إضافة وتعديل وحذف فروع الشركة في اليمن" : "Add, edit and delete company branches in Yemen"}
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 5v14m-7-7h14" />
          </svg>
          {language === "ar" ? "إضافة فرع" : "Add Branch"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} text-center hover:scale-105 transition-transform`}>
          <div className={`text-2xl font-bold ${textColor}`}>{stats.total}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "إجمالي الفروع" : "Total Branches"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 border-emerald-500/30 ${theme === "dark" ? "bg-emerald-500/10" : "bg-emerald-50"} text-center hover:scale-105 transition-transform`}>
          <div className="text-2xl font-bold text-emerald-500">{stats.active}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "نشط" : "Active"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 border-amber-500/30 ${theme === "dark" ? "bg-amber-500/10" : "bg-amber-50"} text-center hover:scale-105 transition-transform`}>
          <div className="text-2xl font-bold text-amber-500">{stats.warning}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "تحذير" : "Warning"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 border-red-500/30 ${theme === "dark" ? "bg-red-500/10" : "bg-red-50"} text-center hover:scale-105 transition-transform`}>
          <div className="text-2xl font-bold text-red-500">{stats.inactive}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "غير نشط" : "Inactive"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} text-center hover:scale-105 transition-transform`}>
          <div className={`text-2xl font-bold text-blue-500`}>{stats.employees}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "موظف" : "Employees"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} text-center hover:scale-105 transition-transform`}>
          <div className={`text-2xl font-bold text-purple-500`}>{stats.facilities}</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "منشأة" : "Facilities"}</div>
        </div>
        <div className={`p-4 rounded-xl border-2 ${borderClass} ${cardBgClass} text-center hover:scale-105 transition-transform`}>
          <div className={`text-xl font-bold text-[#429EBD]`}>{(stats.totalSales / 1000000).toFixed(1)}M</div>
          <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "مبيعات (ر.ي)" : "Sales (YER)"}</div>
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
            placeholder={language === "ar" ? "البحث في الفروع..." : "Search branches..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputClass} ${language === "ar" ? "pr-12" : "pl-12"}`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={inputClass}
          style={{ width: "auto", minWidth: "150px" }}
        >
          <option value="all">{language === "ar" ? "جميع الحالات" : "All Statuses"}</option>
          <option value="active">{language === "ar" ? "نشط" : "Active"}</option>
          <option value="warning">{language === "ar" ? "تحذير" : "Warning"}</option>
          <option value="inactive">{language === "ar" ? "غير نشط" : "Inactive"}</option>
        </select>
      </div>

      {/* Branches Table */}
      <div className={`rounded-xl border-2 ${borderClass} ${cardBgClass} overflow-hidden shadow-lg`}>
        <div className={`px-6 py-4 border-b ${borderClass} ${theme === "dark" ? "bg-slate-800/50" : "bg-[#E0F7FA]"} flex items-center justify-between`}>
          <h3 className={`text-lg font-bold ${textColor} flex items-center gap-2`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
            {language === "ar" ? "قائمة الفروع" : "Branches List"}
            <span className={`text-sm font-normal ${subTextColor}`}>({displayBranches.length})</span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme === "dark" ? "bg-slate-800/30" : "bg-slate-50"}`}>
              <tr>
                <th className={`text-right py-4 px-4 ${textColor} font-bold text-sm`}>
                  {language === "ar" ? "الفرع" : "Branch"}
                </th>
                <th className={`text-right py-3 px-4 ${textColor} font-semibold`}>
                  {language === "ar" ? "الكود" : "Code"}
                </th>
                <th className={`text-right py-3 px-4 ${textColor} font-semibold`}>
                  {language === "ar" ? "المحافظة" : "Governorate"}
                </th>
                <th className={`text-right py-3 px-4 ${textColor} font-semibold`}>
                  {language === "ar" ? "المدير" : "Manager"}
                </th>
                <th className={`text-right py-3 px-4 ${textColor} font-semibold`}>
                  {language === "ar" ? "الموظفين" : "Employees"}
                </th>
                <th className={`text-right py-3 px-4 ${textColor} font-semibold`}>
                  {language === "ar" ? "المنشآت" : "Facilities"}
                </th>
                <th className={`text-right py-3 px-4 ${textColor} font-semibold`}>
                  {language === "ar" ? "الحالة" : "Status"}
                </th>
                <th className={`text-center py-3 px-4 ${textColor} font-semibold`}>
                  {language === "ar" ? "الإجراءات" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody>
              {displayBranches.length === 0 ? (
                <tr>
                  <td colSpan="8" className={`text-center py-12 ${subTextColor}`}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-3 opacity-50">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    {language === "ar" ? "لا توجد فروع مطابقة للبحث" : "No branches match your search"}
                  </td>
                </tr>
              ) : (
                displayBranches.map((branch) => (
                  <tr key={branch.id} className={`border-b ${borderClass} hover:${theme === "dark" ? "bg-white/5" : "bg-black/5"} transition-colors`}>
                    <td className={`py-4 px-4`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme === "dark" ? "bg-[#429EBD]/20" : "bg-[#429EBD]/10"}`}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#429EBD" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <p className={`font-semibold ${textColor}`}>{branch.name}</p>
                          <p className={`text-xs ${subTextColor}`}>{branch.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className={`py-3 px-4`}>
                      <span className={`px-2 py-1 rounded-lg text-xs font-mono ${theme === "dark" ? "bg-slate-700" : "bg-slate-100"} ${textColor}`}>
                        {branch.code || "-"}
                      </span>
                    </td>
                    <td className={`py-3 px-4 ${textColor}`}>{getGovernorateLabel(branch.governorate)}</td>
                    <td className={`py-3 px-4`}>
                      <div>
                        <p className={`${textColor} text-sm`}>{branch.manager || "-"}</p>
                        <p className={`text-xs ${subTextColor}`}>{branch.phone || ""}</p>
                      </div>
                    </td>
                    <td className={`py-3 px-4 text-center`}>
                      <span className={`font-semibold text-blue-500`}>{branch.employees || 0}</span>
                    </td>
                    <td className={`py-3 px-4 text-center`}>
                      <span className={`font-semibold text-purple-500`}>{branch.facilities || 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={branch.status || "active"} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(branch)}
                          className="p-2 rounded-lg bg-blue-500/20 text-blue-500 hover:bg-blue-500/30 transition-colors"
                          title={language === "ar" ? "تعديل" : "Edit"}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => openDeleteModal(branch)}
                          className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                          title={language === "ar" ? "حذف" : "Delete"}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
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
                  {editingBranch
                    ? (language === "ar" ? "تعديل الفرع" : "Edit Branch")
                    : (language === "ar" ? "إضافة فرع جديد" : "Add New Branch")
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
              <form id="branch-form" onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                  {/* Branch Name */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "اسم الفرع" : "Branch Name"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={language === "ar" ? "مثال: فرع صنعاء الرئيسي" : "e.g., Main Sana'a Branch"}
                      className={inputClass}
                    />
                  </div>

                  {/* Branch Code */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "كود الفرع" : "Branch Code"} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder={language === "ar" ? "مثال: SAN-001" : "e.g., SAN-001"}
                      className={`${inputClass} font-mono`}
                    />
                  </div>

                  {/* Governorate */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "المحافظة" : "Governorate"} <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.governorate}
                      onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">{language === "ar" ? "اختر المحافظة..." : "Select governorate..."}</option>
                      {governorates.map(gov => (
                        <option key={gov.value} value={gov.value}>{gov.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Address */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "العنوان" : "Address"}
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder={language === "ar" ? "العنوان التفصيلي" : "Detailed address"}
                      className={inputClass}
                    />
                  </div>

                  {/* Manager */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "مدير الفرع" : "Branch Manager"}
                    </label>
                    <input
                      type="text"
                      value={formData.manager}
                      onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                      placeholder={language === "ar" ? "اسم المدير" : "Manager name"}
                      className={inputClass}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "رقم الهاتف" : "Phone Number"}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+967 X XXXXXX"
                      className={inputClass}
                      dir="ltr"
                    />
                  </div>

                  {/* Employees */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "عدد الموظفين" : "Employees Count"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.employees}
                      onChange={(e) => setFormData({ ...formData, employees: parseInt(e.target.value) || 0 })}
                      className={inputClass}
                    />
                  </div>

                  {/* Facilities */}
                  <div>
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "عدد المنشآت" : "Facilities Count"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.facilities}
                      onChange={(e) => setFormData({ ...formData, facilities: parseInt(e.target.value) || 0 })}
                      className={inputClass}
                    />
                  </div>

                  {/* Status */}
                  <div className="md:col-span-2">
                    <label className={`block ${textColor} mb-2 font-medium`}>
                      {language === "ar" ? "الحالة" : "Status"}
                    </label>
                    <div className="flex gap-4">
                      {[
                        { value: "active", label: language === "ar" ? "نشط" : "Active", color: "emerald" },
                        { value: "warning", label: language === "ar" ? "تحذير" : "Warning", color: "amber" },
                        { value: "inactive", label: language === "ar" ? "غير نشط" : "Inactive", color: "red" },
                      ].map(status => (
                        <label
                          key={status.value}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer transition-all ${formData.status === status.value
                              ? `border-${status.color}-500 bg-${status.color}-500/20 shadow-sm`
                              : `${borderClass} ${cardBgClass} hover:border-[#429EBD]/40`
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
                  form="branch-form"
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-[#429EBD] to-[#053F5C] text-white rounded-xl hover:shadow-lg disabled:opacity-50 transition-all font-bold"
                >
                  {saving
                    ? (language === "ar" ? "جاري الحفظ..." : "Saving...")
                    : (editingBranch
                      ? (language === "ar" ? "حفظ التعديلات" : "Save Changes")
                      : (language === "ar" ? "إضافة الفرع" : "Add Branch")
                    )
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingBranch && (
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
                    ? `هل أنت متأكد من حذف فرع "${deletingBranch.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
                    : `Are you sure you want to delete "${deletingBranch.name}"? This action cannot be undone.`
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
        </div>
      )}
    </div>
  );
}

export default BranchesManagement;

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useDonations, useDonationStats, useCreateDonation, useUpdateDonation, useDeleteDonation, useCharities, usePotentialDonations, useDonationImpact, useCreateCharity } from "../hooks/useCharity.js";
import StatusBadge from "../components/shared/StatusBadge.jsx";
import { getStoredUser } from "../utils/api/auth.js";

function CharityIntegration({ user: propUser }) {
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
  const [editingDonation, setEditingDonation] = useState(null);

  const { donations, loading, error, reload } = useDonations({
    organization_id: user?.organization_id,
  });
  const { stats } = useDonationStats({
    organization_id: user?.organization_id,
  });
  const { create, loading: creating } = useCreateDonation();
  const { update, loading: updating } = useUpdateDonation();
  const { delete: deleteDonation, loading: deleting } = useDeleteDonation();

  // New Hooks
  const { charities, reload: reloadCharities } = useCharities({ organization_id: user?.organization_id });
  const { suggestions, fetchSuggestions } = usePotentialDonations(user?.organization_id);
  const { report: impactReport } = useDonationImpact('month');

  // Trigger fetchSuggestions on mount
  useEffect(() => {
    if (user?.organization_id) fetchSuggestions();
  }, [user?.organization_id]);

  const { create: createCharityHook, loading: creatingCharity } = useCreateCharity();
  const [showAddCharityModal, setShowAddCharityModal] = useState(false);
  const [charityFormData, setCharityFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
  });

  const handleCreateCharity = async (e) => {
    e.preventDefault();
    try {
      await createCharityHook({
        organization_id: user?.organization_id,
        ...charityFormData,
        preferred_categories: [], // Default empty
        status_id: 1 // Default Active
      });
      setShowAddCharityModal(false);
      setCharityFormData({ name: "", contact_person: "", phone: "", email: "", address: "" });
      reloadCharities();
    } catch (err) {
      alert(err.message || "Failed to create charity");
    }
  };


  // Form state
  const [formData, setFormData] = useState({
    batch_id: "",
    charity_id: "",
    charity_organization: "",
    charity_contact: "",
    quantity: "",
    donation_date: new Date().toISOString().split('T')[0],
    status: "Pending", // Default strict status
    food_safety_check_passed: false,
  });

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  // Filter donations
  const filteredDonations = useMemo(() => {
    if (!donations || !Array.isArray(donations)) return [];

    return donations.filter((donation) => {
      const matchesSearch =
        donation.charity_organization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.batch?.batch_code?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === "all" || donation.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [donations, searchTerm, selectedStatus]);

  // Statistics
  const donationStats = useMemo(() => {
    if (!stats) {
      return {
        total_donations: filteredDonations.length,
        total_quantity: filteredDonations.reduce((sum, d) => sum + (d.quantity || 0), 0),
        pending: filteredDonations.filter((d) => d.status === "pending").length,
        confirmed: filteredDonations.filter((d) => d.status === "confirmed").length,
        delivered: filteredDonations.filter((d) => d.status === "delivered").length,
      };
    }
    return {
      total_donations: stats.total_donations || filteredDonations.length,
      total_quantity: stats.total_quantity || filteredDonations.reduce((sum, d) => sum + (d.quantity || 0), 0),
      pending: stats.status_counts?.pending || 0,
      confirmed: stats.status_counts?.confirmed || 0,
      delivered: stats.status_counts?.delivered || 0,
    };
  }, [stats, filteredDonations]);

  const handleCreateDonation = async (e) => {
    e.preventDefault();
    try {
      await create({
        organization_id: user?.organization_id,
        ...formData,
        quantity: parseFloat(formData.quantity),
        donation_date: new Date(formData.donation_date).toISOString(),
      });
      setShowCreateModal(false);
      setFormData({
        batch_id: "",
        charity_id: "",
        charity_organization: "",
        charity_contact: "",
        quantity: "",
        donation_date: new Date().toISOString().split('T')[0],
        status: "Pending",
        food_safety_check_passed: false,
      });
      reload();
    } catch (err) {
      alert(err.message || "حدث خطأ أثناء إنشاء التبرع");
    }
  };

  const handleUpdateDonation = async (donationId, status) => {
    try {
      await update(donationId, { status });
      reload();
    } catch (err) {
      alert(err.message || "حدث خطأ أثناء تحديث التبرع");
    }
  };

  const handleDeleteDonation = async (donationId) => {
    if (!confirm("هل أنت متأكد من حذف هذا التبرع؟")) return;
    try {
      await deleteDonation(donationId);
      reload();
    } catch (err) {
      alert(err.message || "حدث خطأ أثناء حذف التبرع");
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      Pending: language === "ar" ? "قيد الانتظار" : "Pending",
      Sent: language === "ar" ? "تم الإرسال" : "Sent",
      Received: language === "ar" ? "تم الاستلام" : "Received",
      pending: language === "ar" ? "قيد الانتظار" : "Pending",
      confirmed: language === "ar" ? "مؤكد" : "Confirmed",
      delivered: language === "ar" ? "تم التسليم" : "Delivered",
    };
    return statusMap[status] || status;
  };

  if (loading && (!donations || donations.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className={`text-lg font-semibold ${textColor}`}>
          {language === "ar" ? "جاري تحميل بيانات التبرعات..." : "Loading donations data..."}
        </p>
      </div>
    );
  }

  if (error && (!donations || donations.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
        <p className={`text-lg font-semibold text-red-500`}>
          {language === "ar" ? "حدث خطأ أثناء تحميل البيانات" : "Failed to load data"}
        </p>
        <button
          onClick={reload}
          className="px-6 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          {language === "ar" ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="relative space-y-4" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header - Mobile Friendly */}
      <div className="mb-4">
        <div className="flex flex-col gap-3">
          <div>
            <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold ${textColor} mb-1`}>
              {t("charityIntegration") || "الجمعيات الخيرية"}
            </h2>
            <p className={`text-sm ${subTextColor}`}>
              {language === "ar"
                ? "إدارة التبرعات للجمعيات"
                : "Manage donations"}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${theme === "dark"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-[#429EBD] hover:bg-[#053F5C] text-white"
                } shadow-md text-sm`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {language === "ar" ? "تبرع" : "Donate"}
            </button>
            <button
              onClick={() => setShowAddCharityModal(true)}
              className={`px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${theme === "dark"
                ? "bg-slate-700 hover:bg-slate-600 text-white"
                : "bg-slate-200 hover:bg-slate-300 text-[#053F5C]"
                } shadow-md text-sm`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {language === "ar" ? "جمعية" : "Charity"}
            </button>
          </div>
        </div>
      </div>

      {/* Impact Report Section - Mobile Compact */}
      {impactReport && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`${cardBgClass} rounded-xl p-4 border ${borderClass}`}>
            <h3 className={`text-sm font-bold ${textColor} mb-2`}>
              {language === "ar" ? "معدل التحويل" : "Diversion Rate"}
            </h3>
            <div className="text-3xl font-bold text-emerald-500">
              {(impactReport.waste_diversion_rate || 0).toFixed(1)}%
            </div>
            <div className={`text-xs ${subTextColor} mt-1`}>
              {language === "ar"
                ? `${(impactReport.total_donated_value || 0).toFixed(0)} ر`
                : `SAR ${(impactReport.total_donated_value || 0).toFixed(0)}`}
            </div>
          </div>

          <div className={`${cardBgClass} rounded-xl p-4 border ${borderClass}`}>
            <h3 className={`text-sm font-bold ${textColor} mb-2`}>
              {language === "ar" ? "أفضل الجمعيات" : "Top Charities"}
            </h3>
            <div className="space-y-1">
              {impactReport.top_charities.slice(0, 2).map((charity, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className={`${textColor} truncate flex-1`}>{charity.charity_name}</span>
                  <span className="text-emerald-500 font-bold">{(charity.total_value || 0).toFixed(0)}</span>
                </div>
              ))}
              {impactReport.top_charities.length === 0 && (
                <div className={`text-xs ${subTextColor}`}>
                  {language === "ar" ? "لا توجد بيانات" : "No data"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suggested Donations - Mobile Horizontal Scroll */}
      {suggestions.length > 0 && (
        <div className="mb-4">
          <h3 className={`text-base font-bold ${textColor} mb-3 flex items-center gap-2`}>
            💡 {language === "ar" ? "فرص تبرع" : "Suggestions"}
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
            {suggestions.slice(0, 5).map((item, idx) => (
              <div key={idx} className={`${cardBgClass} border border-amber-200/50 rounded-xl p-3 min-w-[200px] flex-shrink-0`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                    {item.suggestion_reason === "Expiring Soon" ? "⏰" : "📦"}
                  </span>
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, batch_id: item.batch_id, quantity: item.quantity }));
                      setShowCreateModal(true);
                    }}
                    className="text-emerald-500 font-bold text-xs"
                  >
                    {language === "ar" ? "تبرع" : "Donate"}
                  </button>
                </div>
                <div className={`${textColor} font-semibold text-sm truncate`}>{item.product_name || item.batch_code}</div>
                <div className={`${subTextColor} text-xs mt-1`}>
                  {item.quantity} {language === "ar" ? "وحدة" : "units"}
                </div>
                <div className="text-xs text-red-400 mt-1">
                  {new Date(item.expiry_date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Cards - Mobile Compact */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className={`${cardBgClass} rounded-xl p-3 border ${borderClass}`}>
          <div className={`text-xs ${subTextColor} truncate`}>
            {language === "ar" ? "الإجمالي" : "Total"}
          </div>
          <div className={`text-xl font-bold ${textColor}`}>
            {donationStats.total_donations}
          </div>
        </div>
        <div className={`${cardBgClass} rounded-xl p-3 border ${borderClass}`}>
          <div className={`text-xs ${subTextColor} truncate`}>
            {language === "ar" ? "الكمية" : "Qty"}
          </div>
          <div className={`text-xl font-bold text-blue-500`}>
            {(donationStats.total_quantity || 0).toFixed(0)}
          </div>
        </div>
        <div className={`${cardBgClass} rounded-xl p-3 border ${borderClass}`}>
          <div className={`text-xs ${subTextColor} truncate`}>
            {language === "ar" ? "انتظار" : "Pending"}
          </div>
          <div className={`text-xl font-bold text-amber-500`}>
            {donationStats.pending}
          </div>
        </div>
        <div className={`${cardBgClass} rounded-xl p-3 border ${borderClass}`}>
          <div className={`text-xs ${subTextColor} truncate`}>
            {language === "ar" ? "تسليم" : "Delivered"}
          </div>
          <div className={`text-xl font-bold text-emerald-500`}>
            {donationStats.delivered}
          </div>
        </div>
      </div>

      {/* Filters - Mobile */}
      <div className={`${cardBgClass} rounded-xl p-3 border ${borderClass} flex flex-col sm:flex-row gap-2 mb-4`}>
        <input
          type="text"
          placeholder={language === "ar" ? "بحث..." : "Search..."}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`flex-1 px-4 py-2.5 rounded-lg border ${borderClass} ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-[#053F5C]"
            } focus:outline-none focus:ring-2 focus:ring-[#429EBD] text-base`}
        />
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className={`px-4 py-2.5 rounded-lg border ${borderClass} ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-[#053F5C]"
            } focus:outline-none focus:ring-2 focus:ring-[#429EBD] text-base`}
        >
          <option value="all">{language === "ar" ? "الكل" : "All"}</option>
          <option value="Pending">{language === "ar" ? "انتظار" : "Pending"}</option>
          <option value="Sent">{language === "ar" ? "إرسال" : "Sent"}</option>
          <option value="Received">{language === "ar" ? "استلام" : "Received"}</option>
        </select>
      </div>

      {/* Donations List - Mobile Cards */}
      <div className={`${cardBgClass} rounded-xl border ${borderClass} overflow-hidden`}>
        {/* Header */}
        <div className={`px-4 py-3 border-b ${borderClass} ${theme === "dark" ? "bg-slate-800/50" : "bg-[#E0F7FA]"}`}>
          <div className="flex items-center justify-between">
            <h3 className={`text-base font-bold ${textColor}`}>
              {language === "ar" ? "التبرعات" : "Donations"}
            </h3>
            <span className={`text-sm font-bold px-2.5 py-1 rounded-full ${theme === "dark" ? "bg-slate-700" : "bg-slate-200"} ${subTextColor}`}>
              {filteredDonations.length}
            </span>
          </div>
        </div>

        {/* Donations Cards */}
        <div className="p-3 space-y-4">
          {filteredDonations.length === 0 ? (
            <div className="text-center py-12">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={theme === "dark" ? "#64748b" : "#94a3b8"} strokeWidth="1.5" className="mx-auto mb-4">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              <p className={`${subTextColor}`}>
                {language === "ar" ? "لا توجد تبرعات" : "No donations found"}
              </p>
            </div>
          ) : (
            filteredDonations.map((donation) => {
              const statusColors = {
                Pending: "border-l-amber-500",
                Sent: "border-l-blue-500",
                Received: "border-l-emerald-500",
              };

              return (
                <div
                  key={donation.id}
                  className={`rounded-xl border ${borderClass} ${theme === "dark" ? "bg-slate-800/50" : "bg-white"} p-4 border-l-4 ${statusColors[donation.status] || "border-l-slate-300"}`}
                >
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold ${textColor} text-base truncate`}>{donation.charity_organization}</h4>
                      {donation.charity_contact && (
                        <p className={`text-sm ${subTextColor} truncate`}>{donation.charity_contact}</p>
                      )}
                    </div>
                    <StatusBadge status={getStatusLabel(donation.status)} />
                  </div>

                  {/* Info Row */}
                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className={`${subTextColor}`}>
                      📦 {donation.batch?.batch_code || "-"}
                    </div>
                    <div className={`font-bold ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}>
                      {donation.quantity} {language === "ar" ? "وحدة" : "units"}
                    </div>
                    <div className={`${subTextColor}`}>
                      📅 {new Date(donation.donation_date).toLocaleDateString("en-GB", { day: '2-digit', month: 'short' })}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex gap-2 flex-wrap">
                    {donation.status === "Pending" && (
                      <button
                        onClick={() => handleUpdateDonation(donation.id, "Sent")}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${theme === "dark"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-blue-50 text-blue-700"
                          }`}
                      >
                        🚚 {language === "ar" ? "إرسال" : "Send"}
                      </button>
                    )}
                    {donation.status === "Sent" && (
                      <button
                        onClick={() => handleUpdateDonation(donation.id, "Received")}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold ${theme === "dark"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-emerald-50 text-emerald-700"
                          }`}
                      >
                        ✅ {language === "ar" ? "استلام" : "Received"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDonation(donation.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold ${theme === "dark"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-red-50 text-red-700"
                        }`}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Definitions */}
      {showCreateModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setShowCreateModal(false)}
          ></div>

          <div className={`relative w-full max-w-md ${theme === "dark" ? "bg-slate-900 border border-white/10" : "bg-white"} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in`}>
            {/* Modal Header */}
            <div className={`p-6 border-b ${borderClass}`}>
              <h3 className={`text-2xl font-bold ${textColor}`}>
                {language === "ar" ? "إضافة تبرع جديد" : "New Donation"}
              </h3>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <form id="donation-form" onSubmit={handleCreateDonation} className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    {language === "ar" ? "رقم الدفعة" : "Batch ID"}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.batch_id}
                    onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-[#053F5C]"
                      } focus:outline-none focus:ring-2 focus:ring-[#429EBD]`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    {language === "ar" ? "الكمية" : "Quantity"}
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-[#053F5C]"
                      } focus:outline-none focus:ring-2 focus:ring-[#429EBD]`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    {language === "ar" ? "تاريخ التبرع" : "Donation Date"}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.donation_date}
                    onChange={(e) => setFormData({ ...formData, donation_date: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-[#053F5C]"
                      } focus:outline-none focus:ring-2 focus:ring-[#429EBD]`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    {language === "ar" ? "الجمعية" : "Charity"}
                  </label>
                  <select
                    value={formData.charity_id}
                    onChange={(e) => {
                      const selectedCharity = charities.find(c => c.id === parseInt(e.target.value));
                      setFormData({
                        ...formData,
                        charity_id: e.target.value,
                        charity_organization: selectedCharity ? selectedCharity.name : "",
                        charity_contact: selectedCharity ? selectedCharity.contact_person || "" : ""
                      });
                    }}
                    className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-[#053F5C]"
                      } focus:outline-none focus:ring-2 focus:ring-[#429EBD]`}
                  >
                    <option value="">{language === "ar" ? "اختر جمعية..." : "Select Charity..."}</option>
                    {charities.map(charity => (
                      <option key={charity.id} value={charity.id}>{charity.name}</option>
                    ))}
                    <option value="other">{language === "ar" ? "أخرى (إدخال يدوي)" : "Other (Manual Entry)"}</option>
                  </select>
                </div>

                {(formData.charity_id === "other" || (!formData.charity_id && formData.charity_organization)) && (
                  <div className="animate-fade-in">
                    <input
                      type="text"
                      placeholder={language === "ar" ? "اسم الجمعية" : "Charity Name"}
                      required
                      value={formData.charity_organization}
                      onChange={(e) => setFormData({ ...formData, charity_organization: e.target.value })}
                      className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-[#053F5C]"
                        } focus:outline-none focus:ring-2 focus:ring-[#429EBD] mt-2`}
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="safetyCheck"
                    required
                    checked={formData.food_safety_check_passed}
                    onChange={(e) => setFormData({ ...formData, food_safety_check_passed: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500"
                  />
                  <label htmlFor="safetyCheck" className={`text-sm ${textColor}`}>
                    {language === "ar" ? "تم التحقق من سلامة الأغذية" : "Food safety check passed"}
                  </label>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className={`p-6 border-t ${borderClass} flex gap-3`}>
              <button
                type="submit"
                form="donation-form"
                disabled={creating}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${theme === "dark"
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-[#429EBD] hover:bg-[#053F5C] text-white"
                  } disabled:opacity-50`}
              >
                {creating
                  ? language === "ar"
                    ? "جاري الحفظ..."
                    : "Saving..."
                  : language === "ar"
                    ? "حفظ"
                    : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    batch_id: "",
                    charity_id: "",
                    charity_organization: "",
                    charity_contact: "",
                    quantity: "",
                    donation_date: new Date().toISOString().split('T')[0],
                    status: "Pending",
                    food_safety_check_passed: false,
                  });
                }}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-slate-200 hover:bg-slate-300 text-[#053F5C]"
                  }`}
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showAddCharityModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setShowAddCharityModal(false)}
          ></div>

          <div className={`relative w-full max-w-md ${theme === "dark" ? "bg-slate-900 border border-white/10" : "bg-white"} rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in`}>
            {/* Header */}
            <div className={`p-6 border-b ${borderClass}`}>
              <h3 className={`text-2xl font-bold ${textColor}`}>
                {language === "ar" ? "إضافة جمعية خيرية" : "Add Charity"}
              </h3>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">
              <form id="charity-form" onSubmit={handleCreateCharity} className="space-y-4">
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    {language === "ar" ? "اسم الجمعية" : "Charity Name"}
                  </label>
                  <input
                    type="text"
                    required
                    value={charityFormData.name}
                    onChange={(e) => setCharityFormData({ ...charityFormData, name: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-[#053F5C]"
                      } focus:outline-none focus:ring-2 focus:ring-[#429EBD]`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    {language === "ar" ? "الشخص المسؤول" : "Contact Person"}
                  </label>
                  <input
                    type="text"
                    value={charityFormData.contact_person}
                    onChange={(e) => setCharityFormData({ ...charityFormData, contact_person: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-[#053F5C]"
                      } focus:outline-none focus:ring-2 focus:ring-[#429EBD]`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-semibold ${textColor} mb-2`}>
                    {language === "ar" ? "رقم الهاتف" : "Phone"}
                  </label>
                  <input
                    type="tel"
                    value={charityFormData.phone}
                    onChange={(e) => setCharityFormData({ ...charityFormData, phone: e.target.value })}
                    className={`w-full px-4 py-2 rounded-lg border ${borderClass} ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-[#053F5C]"
                      } focus:outline-none focus:ring-2 focus:ring-[#429EBD]`}
                  />
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className={`p-6 border-t ${borderClass} flex gap-3`}>
              <button
                type="submit"
                form="charity-form"
                disabled={creatingCharity}
                className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-colors ${theme === "dark"
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-[#429EBD] hover:bg-[#053F5C] text-white"
                  } disabled:opacity-50`}
              >
                {creatingCharity ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "حفظ" : "Save")}
              </button>
              <button
                type="button"
                onClick={() => setShowAddCharityModal(false)}
                className={`px-6 py-3 rounded-lg font-semibold transition-colors ${theme === "dark"
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-slate-200 hover:bg-slate-300 text-[#053F5C]"
                  }`}
              >
                {language === "ar" ? "إلغاء" : "Cancel"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default CharityIntegration;

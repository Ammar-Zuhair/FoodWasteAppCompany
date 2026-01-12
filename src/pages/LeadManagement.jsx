import { useState, useEffect, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import StatusBadge from "../components/shared/StatusBadge.jsx";
import { getStoredUser } from "../utils/api/auth.js";
import * as leadsAPI from "../utils/api/leads.js";
import * as usersAPI from "../utils/api/users.js";

function LeadManagement({ user: propUser }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const storedUser = getStoredUser();
  const user = propUser || (storedUser ? {
    id: storedUser.id,
    organization_id: storedUser.organization_id,
    role: storedUser.role,
  } : null);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSource, setSelectedSource] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [users, setUsers] = useState([]);
  const [statistics, setStatistics] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    assigned_to_id: "",
    name: "",
    company: "",
    email: "",
    phone: "",
    source: "other",
    value: "",
    probability: "",
    expected_close_date: "",
    next_followup_date: "",
    notes: "",
    tags: [],
  });

  // Load leads
  useEffect(() => {
    loadLeads();
    loadUsers();
    loadStatistics();
  }, [selectedStatus, selectedSource]);

  const loadLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedStatus !== "all") params.status = selectedStatus;
      if (selectedSource !== "all") params.source = selectedSource;
      const data = await leadsAPI.getLeads(params);
      setLeads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading leads:", err);
      setError(err.message || "Failed to load leads");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await usersAPI.getUsers({ organization_id: user?.organization_id });
      setUsers(Array.isArray(data) ? data : (data.users || []));
    } catch (err) {
      console.error("Error loading users:", err);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await leadsAPI.getLeadStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error("Error loading statistics:", err);
    }
  };

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = !searchTerm ||
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [leads, searchTerm]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await leadsAPI.createLead({
        ...formData,
        assigned_to_id: formData.assigned_to_id || null,
        value: formData.value ? parseFloat(formData.value) : null,
        probability: formData.probability ? parseInt(formData.probability) : null,
        expected_close_date: formData.expected_close_date || null,
        next_followup_date: formData.next_followup_date || null,
      });
      setShowCreateModal(false);
      resetForm();
      loadLeads();
      loadStatistics();
    } catch (err) {
      console.error("Error creating lead:", err);
      alert(err.message || "Failed to create lead");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await leadsAPI.updateLead(editingLead.id, {
        ...formData,
        value: formData.value ? parseFloat(formData.value) : null,
        probability: formData.probability ? parseInt(formData.probability) : null,
        expected_close_date: formData.expected_close_date || null,
        next_followup_date: formData.next_followup_date || null,
        last_contact_date: formData.last_contact_date || null,
      });
      setEditingLead(null);
      resetForm();
      loadLeads();
      loadStatistics();
    } catch (err) {
      console.error("Error updating lead:", err);
      alert(err.message || "Failed to update lead");
    }
  };

  const handleDelete = async (leadId) => {
    if (!confirm(t("confirmDelete") || "Are you sure you want to delete this lead?")) {
      return;
    }
    try {
      await leadsAPI.deleteLead(leadId);
      loadLeads();
      loadStatistics();
    } catch (err) {
      console.error("Error deleting lead:", err);
      alert(err.message || "Failed to delete lead");
    }
  };

  const handleStatusChange = async (lead, newStatus) => {
    try {
      await leadsAPI.updateLead(lead.id, { status: newStatus });
      loadLeads();
      loadStatistics();
    } catch (err) {
      console.error("Error updating lead status:", err);
      alert(err.message || "Failed to update lead status");
    }
  };

  const handleRecordContact = async (leadId) => {
    try {
      await leadsAPI.recordContact(leadId);
      loadLeads();
      loadStatistics();
    } catch (err) {
      console.error("Error recording contact:", err);
      alert(err.message || "Failed to record contact");
    }
  };

  const resetForm = () => {
    setFormData({
      assigned_to_id: "",
      name: "",
      company: "",
      email: "",
      phone: "",
      source: "other",
      value: "",
      probability: "",
      expected_close_date: "",
      next_followup_date: "",
      notes: "",
      tags: [],
    });
  };

  const openEditModal = (lead) => {
    setEditingLead(lead);
    setFormData({
      assigned_to_id: lead.assigned_to_id || "",
      name: lead.name,
      company: lead.company || "",
      email: lead.email || "",
      phone: lead.phone || "",
      source: lead.source || "other",
      value: lead.value || "",
      probability: lead.probability || "",
      expected_close_date: lead.expected_close_date ? lead.expected_close_date.split('T')[0] : "",
      next_followup_date: lead.next_followup_date ? lead.next_followup_date.split('T')[0] : "",
      notes: lead.notes || "",
      tags: lead.tags || [],
    });
    setShowCreateModal(true);
  };

  const getStatusColor = (status) => {
    const colors = {
      new: "blue",
      contacted: "amber",
      qualified: "green",
      proposal: "purple",
      negotiation: "orange",
      won: "emerald",
      lost: "red",
    };
    return colors[status] || "gray";
  };

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const bgColor = theme === "dark" ? "bg-slate-800" : "bg-white";
  const borderColor = theme === "dark" ? "border-slate-700" : "border-gray-200";

  return (
    <div className={`space-y-4 sm:space-y-5 md:space-y-6 ${bgColor} min-h-screen p-4 sm:p-5 md:p-6`} dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="mb-4 sm:mb-5 md:mb-8">
        <h2 className={`text-xl sm:text-2xl md:text-4xl font-semibold ${textColor} mb-1 sm:mb-1.5 md:mb-3`}>
          {t("leadManagement") || "Lead Management"}
        </h2>
        <p className={`text-xs sm:text-sm md:text-lg ${subTextColor}`}>
          {t("leadManagementDescription") || "Manage and track your sales leads"}
        </p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 sm:gap-4 mb-4 sm:mb-5 md:mb-6">
          <div className={`${bgColor} ${borderColor} border rounded-lg p-3 sm:p-4`}>
            <div className={`text-xs sm:text-sm ${subTextColor}`}>{t("total") || "Total"}</div>
            <div className={`text-lg sm:text-xl md:text-2xl font-bold ${textColor}`}>{statistics.total}</div>
          </div>
          <div className={`${bgColor} ${borderColor} border rounded-lg p-3 sm:p-4`}>
            <div className={`text-xs sm:text-sm ${subTextColor}`}>{t("new") || "New"}</div>
            <div className={`text-lg sm:text-xl md:text-2xl font-bold text-blue-500`}>{statistics.new}</div>
          </div>
          <div className={`${bgColor} ${borderColor} border rounded-lg p-3 sm:p-4`}>
            <div className={`text-xs sm:text-sm ${subTextColor}`}>{t("won") || "Won"}</div>
            <div className={`text-lg sm:text-xl md:text-2xl font-bold text-green-500`}>{statistics.won}</div>
          </div>
          <div className={`${bgColor} ${borderColor} border rounded-lg p-3 sm:p-4`}>
            <div className={`text-xs sm:text-sm ${subTextColor}`}>{t("totalValue") || "Total Value"}</div>
            <div className={`text-lg sm:text-xl md:text-2xl font-bold ${textColor}`}>
              {statistics.total_value?.toLocaleString() || "0"}
            </div>
          </div>
        </div>
      )}

      {/* Filters and Actions */}
      <div className={`${bgColor} ${borderColor} border rounded-lg p-4 sm:p-5 md:p-6`}>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          {/* Search */}
          <input
            type="text"
            placeholder={t("searchLeads") || "Search leads..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`flex-1 px-3 sm:px-4 py-2 rounded-lg ${bgColor} ${borderColor} border ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />

          {/* Create Button */}
          <button
            onClick={() => {
              resetForm();
              setEditingLead(null);
              setShowCreateModal(true);
            }}
            className="px-4 sm:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            {t("createLead") || "Create Lead"}
          </button>
        </div>

        {/* Status and Source Filters */}
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`px-3 sm:px-4 py-2 rounded-lg ${bgColor} ${borderColor} border ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">{t("allStatuses") || "All Statuses"}</option>
            <option value="new">{t("new") || "New"}</option>
            <option value="contacted">{t("contacted") || "Contacted"}</option>
            <option value="qualified">{t("qualified") || "Qualified"}</option>
            <option value="proposal">{t("proposal") || "Proposal"}</option>
            <option value="negotiation">{t("negotiation") || "Negotiation"}</option>
            <option value="won">{t("won") || "Won"}</option>
            <option value="lost">{t("lost") || "Lost"}</option>
          </select>

          <select
            value={selectedSource}
            onChange={(e) => setSelectedSource(e.target.value)}
            className={`px-3 sm:px-4 py-2 rounded-lg ${bgColor} ${borderColor} border ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="all">{t("allSources") || "All Sources"}</option>
            <option value="website">{t("website") || "Website"}</option>
            <option value="referral">{t("referral") || "Referral"}</option>
            <option value="cold_call">{t("coldCall") || "Cold Call"}</option>
            <option value="event">{t("event") || "Event"}</option>
            <option value="other">{t("other") || "Other"}</option>
          </select>
        </div>
      </div>

      {/* Leads List */}
      {loading ? (
        <div className={`${bgColor} ${borderColor} border rounded-lg p-8 text-center`}>
          <div className={`${textColor}`}>{t("loading") || "Loading..."}</div>
        </div>
      ) : error ? (
        <div className={`${bgColor} ${borderColor} border rounded-lg p-8 text-center`}>
          <div className="text-red-500">{error}</div>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className={`${bgColor} ${borderColor} border rounded-lg p-8 text-center`}>
          <div className={`${textColor}`}>{t("noLeadsFound") || "No leads found"}</div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {filteredLeads.map((lead) => (
            <div
              key={lead.id}
              className={`${bgColor} ${borderColor} border rounded-lg p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <h3 className={`text-base sm:text-lg md:text-xl font-semibold ${textColor} flex-1`}>
                      {lead.name}
                    </h3>
                    <StatusBadge status={lead.status} />
                    {lead.value && (
                      <span className={`px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800`}>
                        {lead.value.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {lead.company && (
                    <p className={`text-sm ${subTextColor} mb-1`}>{lead.company}</p>
                  )}
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    {lead.email && <span>{lead.email}</span>}
                    {lead.phone && <span>{lead.phone}</span>}
                    {lead.source && (
                      <span>
                        {t("source") || "Source"}: {lead.source}
                      </span>
                    )}
                    {lead.probability && (
                      <span>
                        {t("probability") || "Probability"}: {lead.probability}%
                      </span>
                    )}
                    {lead.next_followup_date && (
                      <span>
                        {t("nextFollowup") || "Next Follow-up"}: {new Date(lead.next_followup_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(lead)}
                    className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    {t("edit") || "Edit"}
                  </button>
                  {lead.status !== "won" && lead.status !== "lost" && (
                    <button
                      onClick={() => handleRecordContact(lead.id)}
                      className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                    >
                      {t("recordContact") || "Record Contact"}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(lead.id)}
                    className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    {t("delete") || "Delete"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
              onClick={() => {
                setShowCreateModal(false);
                setEditingLead(null);
                resetForm();
              }}
            ></div>

            <div className={`relative transform overflow-hidden rounded-2xl ${theme === "dark" ? "bg-slate-900 border border-white/10 shadow-2xl" : "bg-white shadow-2xl"} p-0 text-right transition-all sm:my-8 sm:w-full sm:max-w-2xl animate-scale-in flex flex-col max-h-[90vh]`}>
              {/* Header */}
              <div className={`p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between`}>
                <h3 className={`text-2xl font-bold ${textColor}`}>
                  {editingLead ? (t("editLead") || "Edit Lead") : (t("createLead") || "Create Lead")}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingLead(null);
                    resetForm();
                  }}
                  className={`text-2xl ${subTextColor} hover:${textColor} transition-colors`}
                >
                  ×
                </button>
              </div>

              {/* Body */}
              <form id="lead-form" onSubmit={editingLead ? handleUpdate : handleCreate} className="p-6 overflow-y-auto flex-1 space-y-4 text-right">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-bold ${textColor} mb-1`}>
                      {t("name") || "Name"} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold ${textColor} mb-1`}>
                      {t("company") || "Company"}
                    </label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-bold ${textColor} mb-1`}>
                      {t("email") || "Email"}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold ${textColor} mb-1`}>
                      {t("phone") || "Phone"}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={`block text-sm font-bold ${textColor} mb-1`}>
                      {t("source") || "Source"}
                    </label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                      className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="website">{t("website") || "Website"}</option>
                      <option value="referral">{t("referral") || "Referral"}</option>
                      <option value="cold_call">{t("coldCall") || "Cold Call"}</option>
                      <option value="event">{t("event") || "Event"}</option>
                      <option value="other">{t("other") || "Other"}</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-bold ${textColor} mb-1`}>
                      {t("value") || "Value"}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-bold ${textColor} mb-1`}>
                      {t("probability") || "Probability"} (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.probability}
                      onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                      className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                </div>

                {(user?.role === "admin" || user?.role === "manager") && (
                  <div>
                    <label className={`block text-sm font-bold ${textColor} mb-1`}>
                      {t("assignTo") || "Assign To"}
                    </label>
                    <select
                      value={formData.assigned_to_id}
                      onChange={(e) => setFormData({ ...formData, assigned_to_id: e.target.value })}
                      className={`w-full px-4 py-2 rounded-xl ${theme === "dark" ? "bg-slate-800" : "bg-gray-50"} border-2 border-gray-200 dark:border-gray-700 ${textColor} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      <option value="">{t("selectUser") || "Select User"}</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.full_name} ({u.role})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </form>

              {/* Footer */}
              <div className={`p-6 border-t border-gray-200 dark:border-gray-700 flex gap-4`}>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingLead(null);
                    resetForm();
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 ${textColor} hover:bg-gray-100 dark:hover:bg-slate-800 transition-all font-bold`}
                >
                  {t("cancel") || "Cancel"}
                </button>
                <button
                  form="lead-form"
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-xl transition-all font-bold"
                >
                  {editingLead ? (t("update") || "Update") : (t("create") || "Create")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LeadManagement;






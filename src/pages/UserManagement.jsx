import { useState, useMemo, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import StatusBadge from "../components/shared/StatusBadge.jsx";
import { useUsers, useUserStats, useCreateUser, useUpdateUser, useDeleteUser } from "../hooks/useUsers.js";
import { getStoredUser, getToken, isAuthenticated } from "../utils/api/auth.js";
import { API_CONFIG } from "../config/api.config.js";

function UserManagement({ user: propUser }) {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const storedUser = getStoredUser();
  const user = propUser || (storedUser ? {
    id: storedUser.id,
    organization_id: storedUser.organization_id,
    role: storedUser.role,
  } : null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null);

  // Lookups state
  const [lookups, setLookups] = useState({
    roles: [],
    facilities: [],
    merchants: [],
    departments: []
  });
  const [loadingLookups, setLoadingLookups] = useState(false);

  const { users: apiUsers, loading, error, reload } = useUsers({
    organization_id: user?.organization_id,
    search: searchTerm || undefined,
    role: selectedRole !== "all" ? selectedRole : undefined,
  });
  const { stats: apiStats } = useUserStats({
    organization_id: user?.organization_id,
  });
  const { create, loading: creating } = useCreateUser();
  const { update, loading: updating } = useUpdateUser();
  const { delete: deleteUserFn, loading: deleting } = useDeleteUser();

  // Initial Form State
  const initialFormState = {
    username: "",
    email: "",
    phone: "",
    password: "",
    full_name: "",
    role: "",
    department: "",
    facility_id: "",
    merchant_id: "",
    branch_id: "",
    is_active: true,
  };
  const [formData, setFormData] = useState(initialFormState);

  // Fetch lookups
  useEffect(() => {
    const fetchLookups = async () => {
      if (!user?.organization_id) return;
      setLoadingLookups(true);
      try {
        if (!isAuthenticated()) return;
        const token = getToken();
        if (!token) return;

        const response = await fetch(
          `${API_CONFIG.baseURL}/api/v1/users/lookups?organization_id=${user.organization_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setLookups({
            roles: data.roles || [],
            facilities: data.facilities || [],
            merchants: data.merchants || [],
            departments: data.departments || []
          });
        }
      } catch (err) {
        console.error("Error fetching lookups:", err);
      } finally {
        setLoadingLookups(false);
      }
    };

    fetchLookups();
  }, [user?.organization_id]);

  // Load editing user data
  useEffect(() => {
    if (editingUser) {
      setFormData({
        username: editingUser.username || "",
        email: editingUser.email || "",
        phone: editingUser.phone || "",
        full_name: editingUser.full_name || editingUser.name || "",
        role: editingUser.role || "",
        department: editingUser.department || "",
        facility_id: editingUser.facility_id || "",
        merchant_id: editingUser.merchant_id || "",
        branch_id: editingUser.branch_id || "",
        is_active: editingUser.is_active !== undefined ? editingUser.is_active : true,
        password: "",
      });
    } else {
      setFormData(initialFormState);
    }
  }, [editingUser]);

  // Styles - Mobile Optimized with Cyan Theme
  const textColor = theme === "dark" ? "text-white" : "text-slate-800";
  const headingColor = theme === "dark" ? "text-white" : "text-slate-800";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-slate-500";
  const borderClass = theme === "dark" ? "border-white/10" : "border-slate-200";
  const cardBgClass = theme === "dark"
    ? "bg-gradient-to-br from-slate-900/95 to-slate-800/95"
    : "bg-gradient-to-br from-white/95 to-slate-50/95";
  const inputClass = `w-full px-4 py-3 rounded-xl border ${borderClass} ${theme === "dark" ? "bg-slate-800/80 text-white placeholder-slate-500" : "bg-white text-slate-800 placeholder-slate-400"} focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-base`;

  // Map users
  const users = useMemo(() => {
    const dataSource = apiUsers || [];
    return dataSource.map((u) => ({
      id: u.id,
      name: u.full_name,
      email: u.email || "-",
      role: u.role,
      status: u.is_active ? "active" : "inactive",
      ...u,
    }));
  }, [apiUsers]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = selectedRole === "all" || u.role === selectedRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, selectedRole]);

  // Stats
  const stats = useMemo(() => {
    if (apiStats) {
      return {
        total: apiStats.total_users || users.length,
        active: apiStats.active_users || users.filter((u) => u.is_active).length,
        inactive: apiStats.inactive_users || users.filter((u) => !u.is_active).length,
        admins: apiStats.role_counts?.admin || apiStats.role_counts?.ADMIN || 0,
      };
    }
    return {
      total: users.length,
      active: users.filter((u) => u.is_active).length,
      inactive: users.filter((u) => !u.is_active).length,
      admins: users.filter((u) => u.role?.toLowerCase() === "admin").length,
    };
  }, [apiStats, users]);

  // Role helpers
  const rolesMap = useMemo(() => {
    const map = {};
    lookups.roles.forEach(r => {
      map[r.code] = language === "ar" ? r.name_ar : r.name_en;
    });
    // Fallback
    if (!map.admin) map.admin = language === "ar" ? "مدير" : "Admin";
    if (!map.manager) map.manager = language === "ar" ? "مدير قسم" : "Manager";
    if (!map.operator) map.operator = language === "ar" ? "مشغل" : "Operator";
    return map;
  }, [lookups.roles, language]);

  const getRoleLabel = (roleCode) => rolesMap[roleCode?.toLowerCase()] || rolesMap[roleCode] || roleCode || "-";

  const getRoleColor = (roleCode) => {
    const code = roleCode?.toLowerCase();
    const colors = {
      admin: "from-cyan-500 to-blue-600",
      manager: "from-blue-500 to-cyan-600",
      staff: "from-emerald-500 to-teal-600",
      driver: "from-orange-500 to-amber-600",
      supermarket: "from-teal-500 to-cyan-600",
      operator: "from-slate-500 to-slate-600",
    };
    return colors[code] || "from-slate-500 to-slate-600";
  };

  // Handlers
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await create({
        ...formData,
        organization_id: user?.organization_id,
      });
      setShowAddModal(false);
      setFormData(initialFormState);
      reload();
    } catch (err) {
      alert(err.message || (language === "ar" ? "خطأ في الإنشاء" : "Creation failed"));
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;
      await update(editingUser.id, payload);
      setEditingUser(null);
      setShowAddModal(false);
      reload();
    } catch (err) {
      alert(err.message || (language === "ar" ? "خطأ في التحديث" : "Update failed"));
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await deleteUserFn(deletingUser.id);
      setShowDeleteModal(false);
      setDeletingUser(null);
      reload();
    } catch (err) {
      alert(err.message || (language === "ar" ? "خطأ في الحذف" : "Delete failed"));
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await update(userId, { is_active: !currentStatus });
      reload();
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const openDeleteModal = (userItem) => {
    setDeletingUser(userItem);
    setShowDeleteModal(true);
  };

  // Loading State - Mobile friendly
  if (loading && (!users || users.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] pt-safe pb-safe">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin"></div>
          </div>
          <p className={`text-lg ${subTextColor}`}>
            {language === "ar" ? "جاري التحميل..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Premium Header */}
      <div className={`relative overflow-hidden rounded-[32px] p-6 shadow-xl mb-4`} style={{
        background: theme === "dark"
          ? "linear-gradient(135deg, #0c4a6e 0%, #0f172a 100%)"
          : "linear-gradient(135deg, #429EBD 0%, #053F5C 100%)"
      }}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32 blur-3xl opacity-50" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-1 uppercase tracking-tight">
                {language === "ar" ? "إدارة المستخدمين" : "User Roster"}
              </h2>
              <p className="text-white/70 text-sm font-medium">
                {language === "ar" ? "إدارة صلاحيات الفريق والأدوار" : "Manage team permissions & hierarchical roles"}
              </p>
            </div>
            <button
              onClick={() => { setFormData(initialFormState); setEditingUser(null); setShowAddModal(true); }}
              className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center backdrop-blur-md border border-white/20 active:scale-90 transition-all"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
            {[
              { label: language === "ar" ? "الكل" : "Total", value: stats.total, color: "white" },
              { label: language === "ar" ? "نشط" : "Active", value: stats.active, color: "emerald-400" },
              { label: language === "ar" ? "مدراء" : "Admins", value: stats.admins, color: "cyan-400" },
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
            { id: 'all', label: language === 'ar' ? 'الكل' : 'Everyone', color: '#6366f1' },
            { id: 'admin', label: language === 'ar' ? 'مدراء' : 'Admins', color: '#0ea5e9' },
            { id: 'manager', label: language === 'ar' ? 'مدير قسم' : 'Managers', color: '#10b981' },
            { id: 'driver', label: language === 'ar' ? 'سائقين' : 'Drivers', color: '#f59e0b' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedRole(tab.id)}
              className={`whitespace-nowrap px-6 py-2.5 rounded-2xl border-2 font-black text-xs uppercase transition-all ${selectedRole === tab.id
                  ? 'text-white'
                  : `${cardBgClass} ${borderClass} ${subTextColor}`
                }`}
              style={{ backgroundColor: selectedRole === tab.id ? tab.color : 'transparent', borderColor: selectedRole === tab.id ? tab.color : '' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative group">
          <input
            type="text"
            placeholder={language === "ar" ? "البحث بالاسم أو البريد..." : "Search name or email..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full h-14 px-12 rounded-2xl border-2 ${borderClass} ${cardBgClass} ${textColor} text-base font-medium shadow-sm focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none`}
          />
          <div className={`absolute top-1/2 -translate-y-1/2 ${language === "ar" ? "right-4" : "left-4"} ${subTextColor}`}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
          </div>
        </div>
      </div>

      {/* User Cards List */}
      <div className="space-y-4 px-1">
        {filteredUsers.length === 0 ? (
          <div className={`text-center py-20 ${cardBgClass} rounded-[32px] border-2 border-dashed ${borderClass} opacity-60`}>
            <div className="text-5xl mb-4">👥</div>
            <p className="font-black text-xl">{language === "ar" ? "لا يوجد مستخدمين" : "No users found"}</p>
          </div>
        ) : (
          filteredUsers.map((userItem) => {
            const roleColor = getRoleColor(userItem.role).split(' ')[1].replace('to-', 'bg-');
            return (
              <div key={userItem.id} className="group relative">
                <div className={`relative rounded-[32px] border-2 ${borderClass} ${cardBgClass} p-5 shadow-xl transition-all duration-300 active:scale-[0.97] overflow-hidden`}>
                  {/* Status Sidebar */}
                  <div className={`absolute top-0 bottom-0 ${language === 'ar' ? 'right-0' : 'left-0'} w-1.5 ${userItem.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />

                  {/* Header Row */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black text-white shadow-lg ${getRoleColor(userItem.role)}`}>
                      {userItem.full_name?.charAt(0).toUpperCase() || "U"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className={`text-xl font-black ${textColor} truncate`}>{userItem.full_name}</h4>
                        <div className={`w-2 h-2 rounded-full ${userItem.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${subTextColor}`}>@{userItem.username}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span className={`text-[10px] font-black uppercase text-cyan-500`}>{getRoleLabel(userItem.role)}</span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${userItem.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {userItem.is_active ? (language === 'ar' ? 'نشط' : 'Active') : (language === 'ar' ? 'معطل' : 'Disabled')}
                      </div>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} border ${borderClass}`}>
                      <span className={`text-[9px] font-black uppercase tracking-tight text-slate-400 block mb-1`}>{language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</span>
                      <p className={`text-xs font-bold ${textColor} truncate`}>{userItem.email || '—'}</p>
                    </div>
                    <div className={`p-4 rounded-2xl ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} border ${borderClass}`}>
                      <span className={`text-[9px] font-black uppercase tracking-tight text-slate-400 block mb-1`}>{language === 'ar' ? 'المنشأة' : 'Assignment'}</span>
                      <p className={`text-xs font-bold ${textColor} truncate`}>{userItem.facility_name || userItem.branch_id || 'Global'}</p>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-4 border-t-2 border-dashed ${borderClass}">
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className={`text-[9px] font-black tracking-widest uppercase ${subTextColor}`}>{language === 'ar' ? 'آخر دخول' : 'Last Login'}</span>
                        <span className={`text-[11px] font-bold ${textColor}`}>Today, 10:45 AM</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingUser(userItem); setShowAddModal(true); }} className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center active:scale-90 transition-all border border-blue-500/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button onClick={() => handleToggleStatus(userItem.id, userItem.is_active)} className={`w-11 h-11 rounded-xl ${userItem.is_active ? 'bg-orange-500/10 text-orange-600' : 'bg-emerald-500/10 text-emerald-600'} flex items-center justify-center active:scale-90 transition-all border ${userItem.is_active ? 'border-orange-500/20' : 'border-emerald-500/20'}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>
                      </button>
                      <button onClick={() => openDeleteModal(userItem)} className="w-11 h-11 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center active:scale-90 transition-all border border-red-500/20">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add/Edit Modal - Full Screen on Mobile */}
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div
            className={`w-full max-w-lg ${theme === "dark" ? "bg-slate-900" : "bg-white"} rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 p-4 border-b border-slate-200 dark:border-slate-700" style={{
              background: theme === "dark"
                ? "linear-gradient(135deg, #0c4a6e 0%, #0f172a 100%)"
                : "linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)"
            }}>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">
                  {editingUser
                    ? (language === "ar" ? "تعديل المستخدم" : "Edit User")
                    : (language === "ar" ? "إضافة مستخدم" : "New User")
                  }
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUser(null);
                  }}
                  className="w-9 h-9 rounded-lg bg-white/20 active:bg-white/30 text-white flex items-center justify-center"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="p-4 space-y-4">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-1.5`}>
                    {language === "ar" ? "اسم المستخدم" : "Username"} *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingUser}
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className={`${inputClass} ${editingUser ? "opacity-60" : ""}`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-1.5`}>
                    {language === "ar" ? "الاسم الكامل" : "Full Name"} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${textColor} mb-1.5`}>
                  {language === "ar" ? "البريد الإلكتروني" : "Email"}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium ${textColor} mb-1.5`}>
                  {language === "ar" ? "رقم الهاتف" : "Phone"}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className={inputClass}
                  dir="ltr"
                />
              </div>

              {!editingUser && (
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-1.5`}>
                    {language === "ar" ? "كلمة المرور" : "Password"} *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={inputClass}
                  />
                </div>
              )}

              <div>
                <label className={`block text-sm font-medium ${textColor} mb-1.5`}>
                  {language === "ar" ? "الدور الوظيفي" : "Role"} *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={loadingLookups}
                  className={inputClass}
                >
                  <option value="">{language === "ar" ? "اختر..." : "Select..."}</option>
                  {lookups.roles.length > 0 ? (
                    lookups.roles.map((role) => (
                      <option key={role.id} value={role.code}>
                        {language === "ar" ? role.name_ar : role.name_en}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="admin">{language === "ar" ? "مدير" : "Admin"}</option>
                      <option value="manager">{language === "ar" ? "مدير قسم" : "Manager"}</option>
                      <option value="operator">{language === "ar" ? "مشغل" : "Operator"}</option>
                    </>
                  )}
                </select>
              </div>

              {formData.role && formData.role.toLowerCase() !== "admin" && (
                <div>
                  <label className={`block text-sm font-medium ${textColor} mb-1.5`}>
                    {language === "ar" ? "المنشأة" : "Facility"}
                  </label>
                  <select
                    value={formData.facility_id || ""}
                    onChange={(e) => setFormData({ ...formData, facility_id: e.target.value })}
                    className={inputClass}
                  >
                    <option value="">{language === "ar" ? "اختر..." : "Select..."}</option>
                    {lookups.facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {language === "ar" ? f.name_ar || f.name : f.name_en || f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={`flex items-center gap-3 p-3 rounded-xl ${theme === "dark" ? "bg-slate-800/50" : "bg-slate-50"}`}>
                <input
                  type="checkbox"
                  id="is_active_mobile"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="is_active_mobile" className={`${textColor} font-medium`}>
                  {language === "ar" ? "حساب نشط" : "Active Account"}
                </label>
              </div>

              <div className="flex gap-3 pt-2" style={{ paddingBottom: 'env(safe-area-inset-bottom, 10px)' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUser(null);
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 ${borderClass} ${textColor} active:bg-slate-100 dark:active:bg-slate-800 font-bold transition-all`}
                >
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={creating || updating}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl font-bold disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  {creating || updating
                    ? (language === "ar" ? "جاري الحفظ..." : "Saving...")
                    : (language === "ar" ? "حفظ" : "Save")
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div className={`w-full max-w-sm ${theme === "dark" ? "bg-slate-900" : "bg-white"} rounded-2xl overflow-hidden`}>
            <div className="p-6 text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-red-900/30" : "bg-red-50"
                }`}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className={`text-xl font-bold ${textColor} mb-2`}>
                {language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
              </h3>
              <p className={`${subTextColor} mb-5 text-sm`}>
                {language === "ar"
                  ? `حذف "${deletingUser.full_name}"؟`
                  : `Delete "${deletingUser.full_name}"?`
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className={`flex-1 px-4 py-3 rounded-xl border-2 ${borderClass} ${textColor} active:bg-slate-100 dark:active:bg-slate-800 font-bold transition-all`}
                >
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl font-bold disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  {deleting
                    ? (language === "ar" ? "جاري الحذف..." : "Deleting...")
                    : (language === "ar" ? "حذف" : "Delete")
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;

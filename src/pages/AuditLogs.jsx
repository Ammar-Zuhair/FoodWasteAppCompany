import { useState, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { SearchIcon, FilterIcon, DownloadIcon } from "../components/shared/Icons.jsx";

function AuditLogs() {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAction, setSelectedAction] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [dateRange, setDateRange] = useState("7d");

  // Mock data - سيتم استبدالها بـ API call
  const auditLogs = [
    {
      id: "1",
      timestamp: new Date().toISOString(),
      user: "أحمد محمد",
      action: "create",
      resource: "Batch",
      resourceId: "BATCH-001",
      details: "تم إنشاء دفعة جديدة",
      ipAddress: "192.168.1.100",
      status: "success",
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: "سارة علي",
      action: "update",
      resource: "Facility",
      resourceId: "FAC-002",
      details: "تم تحديث معلومات المنشأة",
      ipAddress: "192.168.1.101",
      status: "success",
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      user: "محمد خالد",
      action: "delete",
      resource: "User",
      resourceId: "USER-003",
      details: "تم حذف مستخدم",
      ipAddress: "192.168.1.102",
      status: "success",
    },
  ];

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  const getActionLabel = (action) => {
    const labels = {
      create: language === "ar" ? "إنشاء" : "Create",
      update: language === "ar" ? "تحديث" : "Update",
      delete: language === "ar" ? "حذف" : "Delete",
      view: language === "ar" ? "عرض" : "View",
      login: language === "ar" ? "تسجيل دخول" : "Login",
      logout: language === "ar" ? "تسجيل خروج" : "Logout",
    };
    return labels[action] || action;
  };

  const getStatusColor = (status) => {
    if (status === "success") {
      return theme === "dark" ? "text-emerald-400" : "text-emerald-600";
    }
    return theme === "dark" ? "text-red-400" : "text-red-600";
  };

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        searchTerm === "" ||
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAction = selectedAction === "all" || log.action === selectedAction;
      const matchesUser = selectedUser === "all" || log.user === selectedUser;

      return matchesSearch && matchesAction && matchesUser;
    });
  }, [auditLogs, searchTerm, selectedAction, selectedUser]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className={`space-y-4 sm:space-y-5 md:space-y-6`} dir={language === "ar" ? "rtl" : "ltr"}>
      {/* عنوان الصفحة */}
      <div className="mb-4 sm:mb-5 md:mb-8 animate-slide-in">
        <h2 className={`text-xl sm:text-2xl md:text-4xl font-semibold ${textColor} mb-1 sm:mb-1.5 md:mb-3 leading-tight tracking-tight`}>
          {t("auditLogs") || "سجلات التدقيق"}
        </h2>
        <p className={`text-xs sm:text-sm md:text-lg ${subTextColor} leading-relaxed font-normal`}>
          {t("auditLogsDescription") || "عرض جميع سجلات الأنشطة والعمليات في النظام"}
        </p>
      </div>

      {/* Filters */}
      <div className={`${cardBgClass} ${borderClass} border rounded-xl p-4 sm:p-5 md:p-6 backdrop-blur-sm`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium ${textColor} mb-2`}>
              {t("search") || "بحث"}
            </label>
            <div className="relative">
              <SearchIcon className={`absolute ${language === "ar" ? "right" : "left"}-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${subTextColor}`} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={language === "ar" ? "ابحث في السجلات..." : "Search logs..."}
                className={`w-full ${language === "ar" ? "pr-10" : "pl-10"} py-2 px-4 rounded-lg ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-[#053F5C]"} border ${borderClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]`}
              />
            </div>
          </div>

          {/* Action Filter */}
          <div>
            <label className={`block text-sm font-medium ${textColor} mb-2`}>
              {t("action") || "الإجراء"}
            </label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className={`w-full py-2 px-4 rounded-lg ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-[#053F5C]"} border ${borderClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]`}
            >
              <option value="all">{language === "ar" ? "الكل" : "All"}</option>
              <option value="create">{language === "ar" ? "إنشاء" : "Create"}</option>
              <option value="update">{language === "ar" ? "تحديث" : "Update"}</option>
              <option value="delete">{language === "ar" ? "حذف" : "Delete"}</option>
              <option value="view">{language === "ar" ? "عرض" : "View"}</option>
            </select>
          </div>

          {/* Date Range */}
          <div>
            <label className={`block text-sm font-medium ${textColor} mb-2`}>
              {t("dateRange") || "الفترة"}
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`w-full py-2 px-4 rounded-lg ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-[#053F5C]"} border ${borderClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]`}
            >
              <option value="7d">{language === "ar" ? "آخر 7 أيام" : "Last 7 days"}</option>
              <option value="30d">{language === "ar" ? "آخر 30 يوم" : "Last 30 days"}</option>
              <option value="90d">{language === "ar" ? "آخر 90 يوم" : "Last 90 days"}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className={`${cardBgClass} ${borderClass} border rounded-xl overflow-hidden backdrop-blur-sm`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme === "dark" ? "bg-slate-800" : "bg-[#E6F7FB]"} ${textColor}`}>
              <tr>
                <th className="px-4 py-3 text-right text-sm font-semibold">{t("timestamp") || "الوقت"}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">{t("user") || "المستخدم"}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">{t("action") || "الإجراء"}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">{t("resource") || "المورد"}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">{t("details") || "التفاصيل"}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">{t("ipAddress") || "عنوان IP"}</th>
                <th className="px-4 py-3 text-right text-sm font-semibold">{t("status") || "الحالة"}</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="7" className={`px-4 py-8 text-center ${subTextColor}`}>
                    {language === "ar" ? "لا توجد سجلات" : "No logs found"}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`${theme === "dark" ? "border-slate-700 hover:bg-slate-800" : "border-[#9FE7F5]/20 hover:bg-[#E6F7FB]/50"} border-t transition-colors`}
                  >
                    <td className={`px-4 py-3 text-sm ${textColor}`}>{formatDate(log.timestamp)}</td>
                    <td className={`px-4 py-3 text-sm ${textColor}`}>{log.user}</td>
                    <td className={`px-4 py-3 text-sm ${textColor}`}>{getActionLabel(log.action)}</td>
                    <td className={`px-4 py-3 text-sm ${textColor}`}>
                      {log.resource} ({log.resourceId})
                    </td>
                    <td className={`px-4 py-3 text-sm ${textColor}`}>{log.details}</td>
                    <td className={`px-4 py-3 text-sm ${subTextColor}`}>{log.ipAddress}</td>
                    <td className={`px-4 py-3 text-sm ${getStatusColor(log.status)}`}>
                      {log.status === "success" ? (language === "ar" ? "نجح" : "Success") : (language === "ar" ? "فشل" : "Failed")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditLogs;



































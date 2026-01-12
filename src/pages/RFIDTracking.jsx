import { useEffect, useState, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { getRFIDTags, getRFIDDashboard, getRFIDTagHistory } from "../utils/api/rfid.js";

function RFIDTracking() {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [tags, setTags] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: null,
    facilityId: null,
  });
  const [selectedTag, setSelectedTag] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, tags, activity
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadData();
    // Refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tagsResult, dashboardResult] = await Promise.all([
        getRFIDTags(filters),
        getRFIDDashboard(),
      ]);

      // Handle tags response
      if (tagsResult && tagsResult.status === "success") {
        const mappedTags = (tagsResult.tags || []).map(tag => ({
          id: tag.tag_id || tag.id,
          tag_uid: tag.tag_uid || tag.tag_id,
          product: tag.batch?.product?.name || tag.product || "Unknown",
          batch: tag.batch?.batch_code || tag.batch_code || tag.batch_id || "N/A",
          batch_data: tag.batch,
          status: tag.status || "inactive",
          facility: tag.last_seen_facility?.name || tag.last_seen_facility?.name_en || tag.facility || "Unknown",
          facility_ar: tag.last_seen_facility?.name_ar,
          facility_id: tag.last_seen_facility_id || tag.facility_id,
          last_seen: tag.last_seen_at || tag.last_seen,
          temperature: tag.extra_data?.temperature || tag.temperature || null,
          signal_strength: tag.extra_data?.signal_strength || null,
          extra_data: tag.extra_data || {},
          last_seen_facility: tag.last_seen_facility,
        }));
        setTags(mappedTags);

        // Generate recent activity from latest tags
        const sortedByTime = [...mappedTags]
          .filter(t => t.last_seen)
          .sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen))
          .slice(0, 10);
        setRecentActivity(sortedByTime);
      } else if (tagsResult && tagsResult.tags) {
        const mappedTags = tagsResult.tags.map(tag => ({
          id: tag.tag_id || tag.id,
          tag_uid: tag.tag_uid || tag.tag_id,
          product: tag.batch?.product?.name || tag.product || "Unknown",
          batch: tag.batch?.batch_code || tag.batch_code || tag.batch_id || "N/A",
          batch_data: tag.batch,
          status: tag.status || "inactive",
          facility: tag.last_seen_facility?.name || tag.last_seen_facility?.name_en || tag.facility || "Unknown",
          facility_ar: tag.last_seen_facility?.name_ar,
          facility_id: tag.last_seen_facility_id || tag.facility_id,
          last_seen: tag.last_seen_at || tag.last_seen,
          temperature: tag.extra_data?.temperature || tag.temperature || null,
          signal_strength: tag.extra_data?.signal_strength || null,
          extra_data: tag.extra_data || {},
          last_seen_facility: tag.last_seen_facility,
        }));
        setTags(mappedTags);
      } else {
        setTags([]);
      }

      // Handle dashboard response
      if (dashboardResult && dashboardResult.status === "success") {
        setDashboard(dashboardResult);
      } else if (dashboardResult) {
        setDashboard(dashboardResult);
      }

      setError(null);
    } catch (err) {
      console.error("Error loading RFID data:", err);
      setError(err.message || "Error loading RFID tracking data");
      setTags([]);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";
  const bgClass = theme === "dark"
    ? "bg-slate-900/80 backdrop-blur-xl border-white/10"
    : "bg-gradient-to-br from-[#F0FAFC]/95 to-[#E6F7FB]/90 backdrop-blur-xl border-[#9FE7F5]/40";

  // Calculate stats
  const stats = useMemo(() => {
    if (dashboard?.statistics) {
      return dashboard.statistics;
    }
    // Calculate from tags if no dashboard
    const tagsWithTemp = tags.filter(t => t.temperature != null);
    return {
      total_tags: tags.length,
      active_tags: tags.filter(t => t.status === "active").length,
      inactive_tags: tags.filter(t => t.status === "inactive").length,
      lost_tags: tags.filter(t => t.status === "lost").length,
      recent_tags_24h: tags.filter(t => {
        if (!t.last_seen) return false;
        const hours = (Date.now() - new Date(t.last_seen).getTime()) / (1000 * 60 * 60);
        return hours < 24;
      }).length,
      avg_temperature: tagsWithTemp.length > 0
        ? (tagsWithTemp.reduce((sum, t) => sum + (t.temperature || 0), 0) / tagsWithTemp.length).toFixed(1)
        : 0,
    };
  }, [dashboard, tags]);

  const getStatusColor = (status) => {
    const colors = {
      active: theme === "dark" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border-emerald-300",
      inactive: theme === "dark" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-amber-100 text-amber-700 border-amber-300",
      lost: theme === "dark" ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-red-100 text-red-700 border-red-300",
    };
    return colors[status] || colors.inactive;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>;
      case 'inactive': return <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>;
      case 'lost': return <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>;
      default: return <span className="w-3 h-3 rounded-full bg-slate-400 inline-block"></span>;
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return language === "ar" ? "لم يتم رصده" : "Never seen";
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return language === "ar" ? "الآن" : "Just now";
    } else if (diffMins < 60) {
      return language === "ar" ? `منذ ${diffMins} دقيقة` : `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return language === "ar" ? `منذ ${diffHours} ساعة` : `${diffHours}h ago`;
    } else {
      return language === "ar" ? `منذ ${diffDays} يوم` : `${diffDays}d ago`;
    }
  };

  const formatDateTime = (timeString) => {
    if (!timeString) return "-";
    const date = new Date(timeString);
    return date.toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short'
    });
  };

  // Filter tags based on status filter
  const filteredTags = useMemo(() => {
    if (!filters.status) return tags;
    return tags.filter(tag => tag.status === filters.status);
  }, [tags, filters.status]);

  if (loading && !tags.length) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className={`${textColor} font-semibold`}>
            {language === "ar" ? "جاري تحميل بيانات RFID..." : "Loading RFID tracking data..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
        <p className={`${textColor} font-semibold text-red-500`}>{error}</p>
        <button
          onClick={loadData}
          className="px-6 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
        >
          {language === "ar" ? "إعادة المحاولة" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="mb-8 animate-slide-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className={`text-4xl font-semibold ${textColor} mb-3 leading-tight tracking-tight`}>
              {language === "ar" ? "تتبع RFID" : "RFID Tracking"}
            </h2>
            <p className={`text-lg ${subTextColor} leading-relaxed font-normal`}>
              {language === "ar"
                ? "تتبع ومراقبة جميع علامات RFID في الوقت الفعلي"
                : "Real-time tracking and monitoring of all RFID tags"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm ${subTextColor}`}>
              {language === "ar" ? "آخر تحديث:" : "Last update:"}
            </span>
            <span className={`text-sm font-medium ${textColor}`}>
              {new Date().toLocaleTimeString(language === "ar" ? "ar-SA" : "en-US")}
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Statistics Cards - Always Show */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className={`${bgClass} rounded-xl border p-4 hover:shadow-lg transition-shadow`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <span className={`text-sm ${subTextColor}`}>
              {language === "ar" ? "إجمالي العلامات" : "Total Tags"}
            </span>
          </div>
          <div className={`text-3xl font-bold ${textColor}`}>
            {stats.total_tags || 0}
          </div>
        </div>

        <div className={`${bgClass} rounded-xl border p-4 hover:shadow-lg transition-shadow`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className={`text-sm ${subTextColor}`}>
              {language === "ar" ? "نشطة" : "Active"}
            </span>
          </div>
          <div className="text-3xl font-bold text-emerald-500">
            {stats.active_tags || 0}
          </div>
        </div>

        <div className={`${bgClass} rounded-xl border p-4 hover:shadow-lg transition-shadow`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className={`text-sm ${subTextColor}`}>
              {language === "ar" ? "غير نشطة" : "Inactive"}
            </span>
          </div>
          <div className="text-3xl font-bold text-amber-500">
            {stats.inactive_tags || 0}
          </div>
        </div>

        <div className={`${bgClass} rounded-xl border p-4 hover:shadow-lg transition-shadow`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className={`text-sm ${subTextColor}`}>
              {language === "ar" ? "مفقودة" : "Lost"}
            </span>
          </div>
          <div className="text-3xl font-bold text-red-500">
            {stats.lost_tags || 0}
          </div>
        </div>

        <div className={`${bgClass} rounded-xl border p-4 hover:shadow-lg transition-shadow`}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className={`text-sm ${subTextColor}`}>
              {language === "ar" ? "آخر 24 ساعة" : "Last 24h"}
            </span>
          </div>
          <div className={`text-3xl font-bold ${textColor}`}>
            {stats.recent_tags_24h || 0}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${bgClass} rounded-xl border p-2`}>
        <div className="flex gap-2">
          {[
            { id: 'overview', label: language === 'ar' ? 'نظرة عامة' : 'Overview', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
            { id: 'tags', label: language === 'ar' ? 'العلامات' : 'Tags', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
            { id: 'activity', label: language === 'ar' ? 'النشاط الحي' : 'Live Activity', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                ? 'bg-emerald-500 text-white shadow-lg'
                : theme === 'dark'
                  ? 'text-slate-400 hover:bg-slate-800'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Facility Distribution */}
          <div className={`${bgClass} rounded-xl border p-6`}>
            <h3 className={`text-xl font-semibold ${textColor} mb-4 flex items-center gap-2`}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              {language === "ar" ? "توزيع العلامات حسب الموقع" : "Tag Distribution by Location"}
            </h3>
            {dashboard?.facility_distribution && dashboard.facility_distribution.length > 0 ? (
              <div className="space-y-3">
                {dashboard.facility_distribution.map((facility, idx) => (
                  <div
                    key={facility.facility_id || idx}
                    className={`p-4 rounded-lg border ${theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-semibold ${textColor}`}>
                          {language === 'ar' ? facility.facility_name_ar || facility.facility_name : facility.facility_name}
                        </div>
                        {facility.latitude && facility.longitude && (
                          <div className={`text-xs ${subTextColor} mt-1 font-mono flex items-center gap-1`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {facility.latitude?.toFixed(4)}, {facility.longitude?.toFixed(4)}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-emerald-500">
                          {facility.tag_count}
                        </div>
                        <div className={`text-xs ${subTextColor}`}>
                          {language === "ar" ? "علامة" : "tags"}
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min((facility.tag_count / (stats.total_tags || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`text-center py-8 ${subTextColor}`}>
                {language === "ar" ? "لا توجد بيانات توزيع" : "No distribution data available"}
              </div>
            )}
          </div>

          {/* Recent Activity Preview */}
          <div className={`${bgClass} rounded-xl border p-6`}>
            <h3 className={`text-xl font-semibold ${textColor} mb-4 flex items-center gap-2`}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              {language === "ar" ? "آخر الحركات" : "Recent Activity"}
            </h3>
            <div className="space-y-2">
              {recentActivity.slice(0, 5).map((tag, idx) => (
                <div
                  key={tag.id || idx}
                  className={`p-3 rounded-lg border ${theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <span>{getStatusIcon(tag.status)}</span>
                    <div>
                      <div className={`font-mono text-sm ${textColor}`}>{tag.tag_uid}</div>
                      <div className={`text-xs ${subTextColor}`}>
                        {language === 'ar' ? tag.facility_ar || tag.facility : tag.facility}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs ${subTextColor}`}>
                    {formatTime(tag.last_seen)}
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className={`text-center py-8 ${subTextColor}`}>
                  {language === "ar" ? "لا توجد حركات حديثة" : "No recent activity"}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tags' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className={`${bgClass} rounded-xl border p-4`}>
            <div className="flex items-center gap-4 flex-wrap">
              <label className={`${textColor} font-semibold`}>
                {language === "ar" ? "الحالة:" : "Status:"}
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) => setFilters({ ...filters, status: e.target.value || null })}
                className={`px-4 py-2 rounded-lg border ${theme === "dark"
                  ? "bg-slate-800 border-slate-700 text-white"
                  : "bg-white border-[#429EBD]/40 text-[#053F5C]"
                  } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              >
                <option value="">{language === "ar" ? "الكل" : "All"}</option>
                <option value="active">{language === "ar" ? "نشطة" : "Active"}</option>
                <option value="inactive">{language === "ar" ? "غير نشطة" : "Inactive"}</option>
                <option value="lost">{language === "ar" ? "مفقودة" : "Lost"}</option>
              </select>
              <div className={`text-sm ${subTextColor}`}>
                {language === "ar"
                  ? `عرض ${filteredTags.length} من ${tags.length} علامة`
                  : `Showing ${filteredTags.length} of ${tags.length} tags`}
              </div>
            </div>
          </div>

          {/* Tags Table */}
          <div className={`${bgClass} rounded-xl border overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={theme === "dark" ? "bg-slate-800" : "bg-slate-100"}>
                  <tr>
                    <th className={`px-4 py-3 text-${language === 'ar' ? 'right' : 'left'} ${textColor} font-semibold`}>
                      {language === "ar" ? "العلامة" : "Tag"}
                    </th>
                    <th className={`px-4 py-3 text-${language === 'ar' ? 'right' : 'left'} ${textColor} font-semibold`}>
                      {language === "ar" ? "الحالة" : "Status"}
                    </th>
                    <th className={`px-4 py-3 text-${language === 'ar' ? 'right' : 'left'} ${textColor} font-semibold`}>
                      {language === "ar" ? "الدفعة" : "Batch"}
                    </th>
                    <th className={`px-4 py-3 text-${language === 'ar' ? 'right' : 'left'} ${textColor} font-semibold`}>
                      {language === "ar" ? "الموقع" : "Location"}
                    </th>
                    <th className={`px-4 py-3 text-${language === 'ar' ? 'right' : 'left'} ${textColor} font-semibold`}>
                      {language === "ar" ? "الحرارة" : "Temp"}
                    </th>
                    <th className={`px-4 py-3 text-${language === 'ar' ? 'right' : 'left'} ${textColor} font-semibold`}>
                      {language === "ar" ? "آخر رصد" : "Last Seen"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTags.map((tag, idx) => (
                    <tr
                      key={tag.id || idx}
                      className={`border-t ${theme === "dark" ? "border-slate-700 hover:bg-slate-800/50" : "border-slate-200 hover:bg-slate-50"} cursor-pointer transition-colors`}
                      onClick={() => setSelectedTag(selectedTag === tag.id ? null : tag.id)}
                    >
                      <td className="px-4 py-3">
                        <span className={`font-mono text-sm ${textColor}`}>{tag.tag_uid}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getStatusColor(tag.status)}`}>
                          {getStatusIcon(tag.status)} {tag.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${textColor}`}>{tag.batch}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${textColor}`}>
                          {language === 'ar' ? tag.facility_ar || tag.facility : tag.facility}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {tag.temperature ? (
                          <span className={`text-sm font-medium ${tag.temperature < 0 ? 'text-blue-500' :
                            tag.temperature > 8 ? 'text-red-500' : 'text-emerald-500'
                            }`}>
                            {tag.temperature}°C
                          </span>
                        ) : (
                          <span className={subTextColor}>-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm ${subTextColor}`}>{formatTime(tag.last_seen)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredTags.length === 0 && (
              <div className={`text-center py-12 ${subTextColor}`}>
                {language === "ar" ? "لا توجد علامات" : "No tags found"}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'activity' && (
        <div className={`${bgClass} rounded-xl border p-6`}>
          <h3 className={`text-xl font-semibold ${textColor} mb-4 flex items-center gap-2`}>
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
            {language === "ar" ? "النشاط الحي" : "Live Activity Feed"}
            <span className={`text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-500`}>
              {language === "ar" ? "مباشر" : "LIVE"}
            </span>
          </h3>
          <div className="space-y-3">
            {recentActivity.map((tag, idx) => (
              <div
                key={tag.id || idx}
                className={`p-4 rounded-lg border ${theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"} animate-fade-in`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{getStatusIcon(tag.status)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-semibold ${textColor}`}>{tag.tag_uid}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(tag.status)}`}>
                          {tag.status}
                        </span>
                      </div>
                      <div className={`text-sm ${subTextColor} mt-1 flex items-center gap-1`}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        {language === 'ar' ? tag.facility_ar || tag.facility : tag.facility}
                        {tag.batch && tag.batch !== 'N/A' && (
                          <span className="mx-2">•</span>
                        )}
                        {tag.batch && tag.batch !== 'N/A' && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            {tag.batch}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${textColor}`}>
                      {formatDateTime(tag.last_seen)}
                    </div>
                    <div className={`text-xs ${subTextColor}`}>
                      {formatTime(tag.last_seen)}
                    </div>
                  </div>
                </div>
                {tag.temperature && (
                  <div className={`mt-2 pt-2 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'} flex gap-4 text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-700'}`}>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                      {tag.temperature}°C
                    </span>
                    {tag.signal_strength && <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>
                      {tag.signal_strength}%
                    </span>}
                  </div>
                )}
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className={`text-center py-12 ${subTextColor}`}>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                </div>
                {language === "ar" ? "في انتظار البيانات..." : "Waiting for data..."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default RFIDTracking;

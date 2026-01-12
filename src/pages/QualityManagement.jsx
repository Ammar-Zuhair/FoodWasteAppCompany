import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  useQualityStats,
  useBatchesForInspection,
  usePassBatch,
  useFailBatch,
  useApprovedBatches,
  useGenerateQualityReport,
  useLatestQualityReports,
} from "../hooks/useQuality.js";
import StatusBadge from "../components/shared/StatusBadge.jsx";
import { getStoredUser } from "../utils/api/auth.js";

function QualityManagement({ user: propUser }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const storedUser = getStoredUser();
  const user = propUser || (storedUser ? {
    id: storedUser.id,
    organization_id: storedUser.organization_id,
    role: storedUser.role,
  } : null);

  const [activeTab, setActiveTab] = useState("pendingBatches");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportType, setReportType] = useState("weekly");
  const [generatedReport, setGeneratedReport] = useState(null);

  // Approved batches from view (replaces old approvals)
  const { batches: approvedBatches, count: approvedCount, loading: approvalsLoading, reload: reloadApprovals } = useApprovedBatches({
    organization_id: user?.organization_id,
  });

  // AI Reports
  const { reports: aiReports, loading: reportsLoading, reload: reloadReports } = useLatestQualityReports({
    organization_id: user?.organization_id,
  });
  const { generate: generateAIReport, loading: generatingReport } = useGenerateQualityReport();

  const { stats } = useQualityStats({
    organization_id: user?.organization_id,
  });

  // Pending batches for quality inspection
  const { batches: pendingBatches, count: pendingCount, loading: pendingLoading, reload: reloadPendingBatches } = useBatchesForInspection({
    organization_id: user?.organization_id,
  });
  const { pass: passBatch, loading: passingBatch } = usePassBatch();
  const { fail: failBatch, loading: failingBatch } = useFailBatch();
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";

  // Statistics
  const qualityStats = useMemo(() => {
    return {
      total_inspections: stats?.total_inspections || pendingCount || 0,
      passed: stats?.status_counts?.passed || 0,
      failed: stats?.status_counts?.failed || 0,
      pending: stats?.status_counts?.pending || pendingCount || 0,
      pass_rate: stats?.pass_rate || 0,
    };
  }, [stats, pendingCount]);

  // Handlers for batch quality inspection
  const handlePassBatch = async (batchId) => {
    if (!confirm(language === "ar" ? "هل أنت متأكد من اعتماد هذه الدفعة؟" : "Are you sure you want to pass this batch?")) {
      return;
    }
    try {
      await passBatch(batchId, {
        notes: "Passed via Quality Management interface",
        session_id: sessionId,
      });
      reloadPendingBatches();
      alert(language === "ar" ? "تم اعتماد الدفعة بنجاح" : "Batch approved successfully");
    } catch (err) {
      alert(err.message || "Error passing batch");
    }
  };

  const handleFailBatch = async (batchId) => {
    const reason = prompt(language === "ar" ? "أدخل سبب الرفض:" : "Enter rejection reason:");
    if (!reason) return;

    const resolution = prompt(language === "ar" ? "نوع المعالجة (destroyed/donated/returned_to_supplier):" : "Resolution type (destroyed/donated/returned_to_supplier):", "destroyed");
    if (!resolution) return;

    try {
      await failBatch(batchId, {
        reason,
        resolution_type: resolution,
        session_id: sessionId,
      });
      reloadPendingBatches();
      alert(language === "ar" ? "تم رفض الدفعة وإنشاء حدث هدر" : "Batch rejected and waste event created");
    } catch (err) {
      alert(err.message || "Error failing batch");
    }
  };

  if (pendingLoading && (!pendingBatches || pendingBatches.length === 0)) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <p className={`text-lg font-semibold ${textColor}`}>
          {language === "ar" ? "جاري تحميل بيانات الجودة..." : "Loading quality data..."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="mb-8 animate-slide-in">
        <div className="flex justify-between items-center">
          <div>
            <h2 className={`text-4xl font-semibold ${textColor} mb-3 leading-tight tracking-tight`}>
              {t("qualityManagement") || "إدارة الجودة وسلامة الغذاء"}
            </h2>
            <p className={`text-lg ${subTextColor} leading-relaxed font-normal`}>
              {language === "ar"
                ? "إدارة فحوصات الجودة والمعايير والموافقات"
                : "Manage quality inspections, standards, and approvals"}
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${cardBgClass} rounded-xl p-6 border ${borderClass} hover:shadow-lg transition-shadow`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div className={`text-sm ${subTextColor} mb-1`}>
                {language === "ar" ? "إجمالي الفحوصات" : "Total Inspections"}
              </div>
              <div className={`text-3xl font-bold ${textColor}`}>
                {qualityStats.total_inspections}
              </div>
            </div>
          </div>
        </div>
        <div className={`${cardBgClass} rounded-xl p-6 border ${borderClass} hover:shadow-lg transition-shadow`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className={`text-sm ${subTextColor} mb-1`}>
                {language === "ar" ? "نجح" : "Passed"}
              </div>
              <div className="text-3xl font-bold text-emerald-500">
                {qualityStats.passed}
              </div>
            </div>
          </div>
        </div>
        <div className={`${cardBgClass} rounded-xl p-6 border ${borderClass} hover:shadow-lg transition-shadow`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className={`text-sm ${subTextColor} mb-1`}>
                {language === "ar" ? "فشل" : "Failed"}
              </div>
              <div className="text-3xl font-bold text-red-500">
                {qualityStats.failed}
              </div>
            </div>
          </div>
        </div>
        <div className={`${cardBgClass} rounded-xl p-6 border ${borderClass} hover:shadow-lg transition-shadow`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <div className={`text-sm ${subTextColor} mb-1`}>
                {language === "ar" ? "معدل النجاح" : "Pass Rate"}
              </div>
              <div className="text-3xl font-bold text-purple-500">
                {qualityStats.pass_rate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - removed inspections and standards */}
      <div className={`${cardBgClass} rounded-xl border ${borderClass} p-1`}>
        <div className="flex gap-2">
          {["pendingBatches", "approvals", "reports"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${activeTab === tab
                ? theme === "dark"
                  ? "bg-emerald-500 text-white"
                  : "bg-[#429EBD] text-white"
                : theme === "dark"
                  ? "text-slate-400 hover:text-white"
                  : "text-[#429EBD] hover:text-[#053F5C]"
                }`}
            >
              {language === "ar"
                ? tab === "pendingBatches"
                  ? `دفعات قيد الفحص (${pendingCount})`
                  : tab === "approvals"
                    ? `الموافقات (${approvedCount})`
                    : "التقارير"
                : tab === "pendingBatches"
                  ? `Pending Batches (${pendingCount})`
                  : tab === "approvals"
                    ? `Approvals (${approvedCount})`
                    : "Reports"}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Batches Tab Content */}
      {activeTab === "pendingBatches" && (
        <div className={`${cardBgClass} rounded-xl border ${borderClass} p-6`}>
          <div className="mb-4 flex justify-between items-center">
            <h3 className={`text-xl font-semibold ${textColor}`}>
              {language === "ar" ? "دفعات تنتظر فحص الجودة" : "Batches Awaiting Quality Inspection"}
            </h3>
            <button
              onClick={reloadPendingBatches}
              className={`px-4 py-2 rounded-lg ${theme === "dark" ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-100 hover:bg-slate-200"} ${textColor}`}
            >
              {language === "ar" ? "تحديث" : "Refresh"}
            </button>
          </div>

          {pendingLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
              <p className={`mt-4 ${subTextColor}`}>{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
            </div>
          ) : pendingBatches.length === 0 ? (
            <div className={`text-center py-12 ${subTextColor}`}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-xl font-semibold">{language === "ar" ? "لا توجد دفعات تنتظر الفحص" : "No batches pending inspection"}</p>
              <p className="mt-2 opacity-70">{language === "ar" ? "جميع الدفعات تم فحصها" : "All batches have been inspected"}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingBatches.map((batch) => (
                <div
                  key={batch.id}
                  className={`${theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"} border rounded-xl p-5 hover:shadow-lg transition-all`}
                >
                  {/* Batch Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className={`font-bold text-lg ${textColor}`}>{batch.batch_code}</div>
                      <div className={`text-sm ${subTextColor}`}>{batch.product?.name || "-"}</div>
                    </div>
                    {batch.is_locked && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded text-xs flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        {batch.locked_by}
                      </span>
                    )}
                  </div>

                  {/* Batch Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className={subTextColor}>{language === "ar" ? "المستودع:" : "Warehouse:"}</span>
                      <span className={textColor}>{batch.facility?.name || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={subTextColor}>{language === "ar" ? "المنطقة:" : "Zone:"}</span>
                      {batch.zone?.code ? (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 rounded font-bold flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {batch.zone.code}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-500 rounded text-sm flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-500"></span>
                          {language === "ar" ? "لم يُحدد" : "No Location"}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className={subTextColor}>{language === "ar" ? "الكمية:" : "Quantity:"}</span>
                      <span className={textColor}>{batch.quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={subTextColor}>{language === "ar" ? "تاريخ الإنتاج:" : "Production:"}</span>
                      <span className={textColor}>{batch.production_date ? new Date(batch.production_date).toLocaleDateString() : "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={subTextColor}>{language === "ar" ? "انتهاء الصلاحية:" : "Expiry:"}</span>
                      <span className={`${textColor} ${batch.expiry_date && new Date(batch.expiry_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? "text-red-500 font-bold" : ""}`}>
                        {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePassBatch(batch.id)}
                      disabled={passingBatch || batch.is_locked}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {language === "ar" ? "اعتماد" : "Pass"}
                    </button>
                    <button
                      onClick={() => handleFailBatch(batch.id)}
                      disabled={failingBatch || batch.is_locked}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-50 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-md"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      {language === "ar" ? "رفض" : "Fail"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Approvals Tab - Shows approved batches from vw_approved_batches */}
      {activeTab === "approvals" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-2xl font-semibold ${textColor}`}>
              {language === "ar" ? "الدفعات المعتمدة" : "Approved Batches"}
            </h3>
            <button
              onClick={reloadApprovals}
              className={`px-4 py-2 rounded-lg ${theme === "dark" ? "bg-slate-700 hover:bg-slate-600" : "bg-slate-100 hover:bg-slate-200"} ${textColor}`}
            >
              {language === "ar" ? "تحديث" : "Refresh"}
            </button>
          </div>

          {approvalsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
            </div>
          ) : approvedBatches.length === 0 ? (
            <div className={`${cardBgClass} rounded-xl border ${borderClass} p-12 text-center ${subTextColor}`}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-xl font-semibold">{language === "ar" ? "لا توجد دفعات معتمدة بعد" : "No approved batches yet"}</p>
            </div>
          ) : (
            <div className={`${cardBgClass} rounded-xl border ${borderClass} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${theme === "dark" ? "bg-slate-800" : "bg-slate-50"}`}>
                    <tr>
                      <th className={`px-6 py-4 text-right ${textColor} font-semibold`}>
                        {language === "ar" ? "كود الدفعة" : "Batch Code"}
                      </th>
                      <th className={`px-6 py-4 text-right ${textColor} font-semibold`}>
                        {language === "ar" ? "المنتج" : "Product"}
                      </th>
                      <th className={`px-6 py-4 text-right ${textColor} font-semibold`}>
                        {language === "ar" ? "المنشأة" : "Facility"}
                      </th>
                      <th className={`px-6 py-4 text-right ${textColor} font-semibold`}>
                        {language === "ar" ? "المنطقة" : "Zone"}
                      </th>
                      <th className={`px-6 py-4 text-right ${textColor} font-semibold`}>
                        {language === "ar" ? "تاريخ الاعتماد" : "Approved At"}
                      </th>
                      <th className={`px-6 py-4 text-right ${textColor} font-semibold`}>
                        {language === "ar" ? "الفاحص" : "Inspector"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedBatches.map((batch) => (
                      <tr
                        key={batch.batch_id}
                        className={`border-t ${borderClass} hover:${theme === "dark" ? "bg-slate-800/50" : "bg-slate-50/50"} transition-colors`}
                      >
                        <td className={`px-6 py-4 ${textColor} font-bold`}>{batch.batch_code}</td>
                        <td className={`px-6 py-4 ${textColor}`}>
                          {language === "ar" ? batch.product_name : (batch.product_name_en || batch.product_name)}
                        </td>
                        <td className={`px-6 py-4 ${textColor}`}>{batch.facility_name || "-"}</td>
                        <td className="px-6 py-4">
                          {batch.zone?.code ? (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-500 rounded font-bold">
                              {batch.zone.code}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-red-500/20 text-red-500 rounded text-sm">
                              {language === "ar" ? "لم يُحدد" : "No Location"}
                            </span>
                          )}
                        </td>
                        <td className={`px-6 py-4 ${textColor}`}>
                          {batch.approved_at ? new Date(batch.approved_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US") : "-"}
                        </td>
                        <td className={`px-6 py-4 ${textColor}`}>{batch.inspector_name || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI Quality Reports Tab */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-2xl font-semibold ${textColor}`}>
              {language === "ar" ? "تقارير الجودة الذكية" : "AI Quality Reports"}
            </h3>
            <button
              onClick={() => setShowReportModal(true)}
              disabled={generatingReport}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${theme === "dark"
                ? "bg-emerald-500 hover:bg-emerald-600 text-white disabled:bg-emerald-500/50"
                : "bg-[#429EBD] hover:bg-[#053F5C] text-white disabled:bg-[#429EBD]/50"
                }`}
            >
              {generatingReport
                ? (language === "ar" ? "جاري التوليد..." : "Generating...")
                : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {language === "ar" ? "توليد تقرير ذكي" : "Generate AI Report"}
                  </span>
                )}
            </button>
          </div>

          {reportsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
            </div>
          ) : aiReports.length === 0 ? (
            <div className={`${cardBgClass} rounded-xl border ${borderClass} p-12 text-center`}>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className={`text-xl font-semibold ${textColor}`}>{language === "ar" ? "لا توجد تقارير بعد" : "No reports yet"}</p>
              <p className={`${subTextColor} mt-2`}>
                {language === "ar"
                  ? "اضغط على 'توليد تقرير ذكي' لإنشاء أول تقرير"
                  : "Click 'Generate AI Report' to create your first report"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {aiReports.map((report) => (
                <div
                  key={report.id}
                  className={`${cardBgClass} rounded-xl border ${borderClass} p-6`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className={`text-xl font-bold ${textColor}`}>
                        {language === "ar" ? report.title_ar : report.title_en}
                      </h4>
                      <p className={`${subTextColor} text-sm`}>
                        {report.created_at ? new Date(report.created_at).toLocaleString(language === "ar" ? "ar-SA" : "en-US") : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          const currentDate = new Date().toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          });
                          // Function to remove emojis from text while preserving line breaks
                          const removeEmojis = (text) => {
                            if (!text) return '';
                            // Remove emojis but keep newlines
                            return text
                              .replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{E0020}-\u{E007F}]|[\u{FE00}-\u{FE0F}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{231A}-\u{231B}]|[\u{23E9}-\u{23F3}]|[\u{23F8}-\u{23FA}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]|[\u{2934}-\u{2935}]|[\u{2B05}-\u{2B07}]|[\u{2B1B}-\u{2B1C}]|[\u{2B50}]|[\u{2B55}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]|[📊✅⚠️💡🔍📋🤖❌✓✗🔒•]/gu, '')
                              .replace(/^[ \t]+|[ \t]+$/gm, '') // Trim spaces at start/end of lines only
                              .replace(/\n\n+/g, '\n\n'); // Normalize multiple newlines to double
                          };
                          const printContent = `
                            <!DOCTYPE html>
                            <html dir="${language === 'ar' ? 'rtl' : 'ltr'}" lang="${language === 'ar' ? 'ar' : 'en'}">
                              <head>
                                <meta charset="UTF-8">
                                <title>${removeEmojis(language === "ar" ? report.title_ar : report.title_en)}</title>
                                <style>
                                  * { margin: 0; padding: 0; box-sizing: border-box; }
                                  body { 
                                    font-family: 'Segoe UI', 'Arial', sans-serif; 
                                    padding: 30px 40px; 
                                    direction: ${language === 'ar' ? 'rtl' : 'ltr'}; 
                                    background: #fff;
                                    color: #1e293b;
                                    line-height: 1.5;
                                    font-size: 14px;
                                  }
                                  .header {
                                    border-bottom: 2px solid #429EBD;
                                    padding-bottom: 12px;
                                    margin-bottom: 15px;
                                  }
                                  .header-top {
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: flex-start;
                                    margin-bottom: 10px;
                                  }
                                  .logo-section {
                                    display: flex;
                                    align-items: center;
                                    gap: 15px;
                                  }
                                  .logo-icon {
                                    width: 36px;
                                    height: 36px;
                                    background: linear-gradient(135deg, #429EBD 0%, #053F5C 100%);
                                    border-radius: 8px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: white;
                                    font-weight: bold;
                                    font-size: 14px;
                                  }
                                  .company-name {
                                    font-size: 11px;
                                    color: #64748b;
                                  }
                                  .report-badge {
                                    background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
                                    color: white;
                                    padding: 6px 16px;
                                    border-radius: 20px;
                                    font-size: 12px;
                                    font-weight: 600;
                                  }
                                  h1 { 
                                    color: #053F5C; 
                                    font-size: 20px;
                                    margin-top: 10px;
                                    font-weight: 700;
                                  }
                                  .report-meta {
                                    color: #64748b;
                                    font-size: 11px;
                                    margin-top: 5px;
                                  }
                                  .stats-grid { 
                                    display: grid;
                                    grid-template-columns: repeat(4, 1fr);
                                    gap: 10px; 
                                    margin: 15px 0; 
                                  }
                                  .stat-card { 
                                    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                                    padding: 12px; 
                                    border-radius: 8px; 
                                    text-align: center;
                                    border: 1px solid #e2e8f0;
                                  }
                                  .stat-icon {
                                    width: 28px;
                                    height: 28px;
                                    border-radius: 6px;
                                    margin: 0 auto 6px;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                  }
                                  .stat-icon.blue { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
                                  .stat-icon.green { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
                                  .stat-icon.red { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
                                  .stat-icon.purple { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
                                  .stat-value { font-size: 26px; font-weight: 700; margin-bottom: 2px; }
                                  .stat-value.green { color: #10b981; }
                                  .stat-value.red { color: #ef4444; }
                                  .stat-value.blue { color: #3b82f6; }
                                  .stat-value.purple { color: #8b5cf6; }
                                  .stat-label { font-size: 12px; color: #64748b; font-weight: 500; }
                                  .section { 
                                    margin: 14px 0; 
                                    padding: 14px 18px; 
                                    background: #f8fafc; 
                                    border-radius: 8px;
                                    border-${language === 'ar' ? 'right' : 'left'}: 3px solid #429EBD;
                                  }
                                  .section-title { 
                                    font-weight: 700; 
                                    margin-bottom: 8px; 
                                    color: #053F5C;
                                    font-size: 15px;
                                    display: flex;
                                    align-items: center;
                                    gap: 8px;
                                  }
                                  .section-title::before {
                                    content: '';
                                    width: 6px;
                                    height: 6px;
                                    background: #429EBD;
                                    border-radius: 50%;
                                  }
                                  .section p {
                                    color: #475569;
                                    font-size: 13px;
                                    white-space: pre-wrap;
                                    line-height: 1.6;
                                  }
                                  .recommendations {
                                    border-${language === 'ar' ? 'right' : 'left'}-color: #10b981;
                                    background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
                                  }
                                  .footer { 
                                    margin-top: 20px; 
                                    padding-top: 12px;
                                    border-top: 1px solid #e2e8f0;
                                    display: flex;
                                    justify-content: space-between;
                                    align-items: center;
                                    color: #94a3b8; 
                                    font-size: 10px; 
                                  }
                                  .footer-logo {
                                    display: flex;
                                    align-items: center;
                                    gap: 6px;
                                  }
                                  .footer-logo-icon {
                                    width: 18px;
                                    height: 18px;
                                    background: #429EBD;
                                    border-radius: 4px;
                                    color: white;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 9px;
                                    font-weight: bold;
                                  }
                                  @media print {
                                    body { padding: 15px; }
                                    .section { break-inside: avoid; page-break-inside: avoid; }
                                  }
                                </style>
                              </head>
                              <body>
                                <div class="header">
                                  <div class="header-top">
                                    <div class="logo-section">
                                      <div class="logo-icon">QM</div>
                                      <div class="company-name">${language === "ar" ? "نظام إدارة الجودة" : "Quality Management System"}</div>
                                    </div>
                                    <div class="report-badge">${language === "ar" ? "تقرير ذكي" : "AI Report"}</div>
                                  </div>
                                  <h1>${language === "ar" ? report.title_ar : report.title_en}</h1>
                                  <div class="report-meta">
                                    ${language === "ar" ? "تاريخ الإنشاء:" : "Created:"} ${report.created_at ? new Date(report.created_at).toLocaleString(language === "ar" ? "ar-SA" : "en-US") : ""}
                                    &nbsp;&nbsp;|&nbsp;&nbsp;
                                    ${language === "ar" ? "تاريخ الطباعة:" : "Printed:"} ${currentDate}
                                  </div>
                                </div>
                                
                                ${report.aggregated_data ? `
                                  <div class="stats-grid">
                                    <div class="stat-card">
                                      <div class="stat-icon blue">
                                        <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                                      </div>
                                      <div class="stat-value blue">${report.aggregated_data.total_inspections || 0}</div>
                                      <div class="stat-label">${language === "ar" ? "إجمالي الفحوصات" : "Total Inspections"}</div>
                                    </div>
                                    <div class="stat-card">
                                      <div class="stat-icon green">
                                        <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                      </div>
                                      <div class="stat-value green">${report.aggregated_data.passed || 0}</div>
                                      <div class="stat-label">${language === "ar" ? "ناجح" : "Passed"}</div>
                                    </div>
                                    <div class="stat-card">
                                      <div class="stat-icon red">
                                        <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                                      </div>
                                      <div class="stat-value red">${report.aggregated_data.failed || 0}</div>
                                      <div class="stat-label">${language === "ar" ? "فاشل" : "Failed"}</div>
                                    </div>
                                    <div class="stat-card">
                                      <div class="stat-icon purple">
                                        <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                                      </div>
                                      <div class="stat-value purple">${report.aggregated_data.pass_rate || 0}%</div>
                                      <div class="stat-label">${language === "ar" ? "معدل النجاح" : "Pass Rate"}</div>
                                    </div>
                                  </div>
                                ` : ''}
                                
                                <div class="section">
                                  <div class="section-title">${language === "ar" ? "ملخص التقرير" : "Report Summary"}</div>
                                  <p>${removeEmojis(language === "ar" ? report.description_ar : report.description_en)}</p>
                                </div>
                                
                                ${(report.reasoning_ar || report.reasoning_en) ? `
                                  <div class="section recommendations">
                                    <div class="section-title">${language === "ar" ? "التحليل والتوصيات" : "Analysis & Recommendations"}</div>
                                    <p>${removeEmojis(language === "ar" ? report.reasoning_ar : report.reasoning_en)}</p>
                                  </div>
                                ` : ''}
                                
                                <div class="footer">
                                  <div class="footer-logo">
                                    <div class="footer-logo-icon">QM</div>
                                    <span>${language === "ar" ? "تم إنشاء هذا التقرير بواسطة نظام إدارة الجودة الذكي" : "Generated by AI Quality Management System"}</span>
                                  </div>
                                  <span>${language === "ar" ? "صفحة 1 من 1" : "Page 1 of 1"}</span>
                                </div>
                              </body>
                            </html>
                          `;
                          const printWindow = window.open('', '_blank');
                          printWindow.document.write(printContent);
                          printWindow.document.close();
                          printWindow.print();
                        }}
                        className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "bg-slate-700 hover:bg-slate-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                        title={language === "ar" ? "طباعة التقرير" : "Print Report"}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </button>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-500 rounded-lg text-sm font-bold">
                        AI Generated
                      </span>
                    </div>
                  </div>

                  {/* Stats Summary */}
                  {report.aggregated_data && (
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div className={`${theme === "dark" ? "bg-slate-700" : "bg-slate-100"} rounded-lg p-3 text-center`}>
                        <div className={`text-2xl font-bold ${textColor}`}>{report.aggregated_data.total_inspections || 0}</div>
                        <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "إجمالي الفحوصات" : "Total"}</div>
                      </div>
                      <div className={`${theme === "dark" ? "bg-slate-700" : "bg-slate-100"} rounded-lg p-3 text-center`}>
                        <div className="text-2xl font-bold text-emerald-500">{report.aggregated_data.passed || 0}</div>
                        <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "ناجح" : "Passed"}</div>
                      </div>
                      <div className={`${theme === "dark" ? "bg-slate-700" : "bg-slate-100"} rounded-lg p-3 text-center`}>
                        <div className="text-2xl font-bold text-red-500">{report.aggregated_data.failed || 0}</div>
                        <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "فاشل" : "Failed"}</div>
                      </div>
                      <div className={`${theme === "dark" ? "bg-slate-700" : "bg-slate-100"} rounded-lg p-3 text-center`}>
                        <div className="text-2xl font-bold text-blue-500">{report.aggregated_data.pass_rate || 0}%</div>
                        <div className={`text-xs ${subTextColor}`}>{language === "ar" ? "معدل النجاح" : "Pass Rate"}</div>
                      </div>
                    </div>
                  )}

                  <div className={`${textColor} leading-relaxed whitespace-pre-wrap`}>
                    {language === "ar" ? report.description_ar : report.description_en}
                  </div>

                  {(report.reasoning_ar || report.reasoning_en) && (
                    <div className={`mt-4 p-4 rounded-lg ${theme === "dark" ? "bg-slate-700/50" : "bg-slate-50"}`}>
                      <h5 className={`font-bold ${textColor} mb-2`}>
                        {language === "ar" ? "التحليل والتوصيات:" : "Analysis & Recommendations:"}
                      </h5>
                      <div className={`${subTextColor} text-sm whitespace-pre-wrap`}>
                        {language === "ar" ? report.reasoning_ar : report.reasoning_en}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* AI Report Generation Modal */}
      {showReportModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
            onClick={() => setShowReportModal(false)}
          ></div>

          <div className={`relative transform overflow-hidden rounded-2xl ${theme === "dark" ? "bg-slate-900 border border-white/10" : "bg-white"} p-0 text-right shadow-2xl transition-all w-full max-w-md animate-scale-in flex flex-col max-h-[90vh]`}>
            {/* Header */}
            <div className={`p-6 border-b ${borderClass} flex items-center justify-between`}>
              <h3 className={`text-xl font-bold ${textColor}`}>
                {language === "ar" ? "توليد تقرير جودة ذكي" : "Generate AI Quality Report"}
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className={`text-2xl ${subTextColor} hover:${textColor} transition-colors`}
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className={`block ${textColor} mb-2 font-semibold`}>
                  {language === "ar" ? "نوع التقرير" : "Report Type"}
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border ${borderClass} ${theme === "dark" ? "bg-slate-800 text-white" : "bg-white text-[#053F5C]"} focus:ring-2 focus:ring-[#429EBD] outline-none transition-all`}
                >
                  <option value="daily">{language === "ar" ? "يومي" : "Daily"}</option>
                  <option value="weekly">{language === "ar" ? "أسبوعي" : "Weekly"}</option>
                  <option value="monthly">{language === "ar" ? "شهري" : "Monthly"}</option>
                  <option value="violations">{language === "ar" ? "مخالفات" : "Violations"}</option>
                </select>
              </div>

              <div className={`p-4 rounded-lg ${theme === "dark" ? "bg-slate-700/50" : "bg-blue-50"} border ${theme === "dark" ? "border-slate-600" : "border-blue-100"}`}>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-md flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className={`text-sm ${theme === "dark" ? "text-slate-300" : "text-blue-700"} leading-relaxed`}>
                    {language === "ar"
                      ? "سيتم تحليل بيانات الجودة وتوليد تقرير احترافي باللغتين العربية والإنجليزية باستخدام محرك الذكاء الاصطناعي الخاص بنا."
                      : "Quality data will be analyzed and a professional report will be generated in Arabic and English using our AI engine."}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`p-6 border-t ${borderClass} flex gap-3`}>
              <button
                onClick={async () => {
                  try {
                    const result = await generateAIReport({ report_type: reportType }, user?.organization_id);
                    setGeneratedReport(result);
                    setShowReportModal(false);
                    reloadReports();
                    alert(language === "ar" ? "تم توليد التقرير بنجاح!" : "Report generated successfully!");
                  } catch (err) {
                    alert(err.message || "Error generating report");
                  }
                }}
                disabled={generatingReport}
                className={`flex-1 px-4 py-3 rounded-lg font-bold transition-all ${theme === "dark"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-[#429EBD] hover:bg-[#2E7A94] text-white"
                  } disabled:opacity-50 shadow-lg`}
              >
                {generatingReport
                  ? (language === "ar" ? "جاري التوليد..." : "Generating...")
                  : (language === "ar" ? "توليد التقرير" : "Generate Report")}
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className={`px-4 py-3 rounded-lg font-semibold border-2 ${borderClass} ${textColor} hover:bg-slate-100 dark:hover:bg-slate-800 transition-all`}
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

export default QualityManagement;

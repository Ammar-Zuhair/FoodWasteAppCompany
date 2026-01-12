import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useReturns, useReturnsRecommendations } from "../hooks/useReturns.js";
import {
  FaSearch, FaFilter, FaArrowLeft, FaArrowRight, FaEye,
  FaCheckCircle, FaTimesCircle, FaRobot, FaExclamationTriangle,
  FaBoxOpen
} from "react-icons/fa";
import StatusBadge from "../components/shared/StatusBadge.jsx"; // Assuming this exists or I'll create generic badge

// Helper components
const InsightCard = ({ title, value, icon: Icon, colorClass }) => (
  <div className={`p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 bg-white dark:bg-slate-800 flex items-center justify-between`}>
    <div>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-1">{title}</p>
      <h3 className="text-2xl font-bold dark:text-white">{value}</h3>
    </div>
    <div className={`p-3 rounded-full ${colorClass} bg-opacity-20`}>
      <Icon className={`w-6 h-6 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
  </div>
);

function ReturnsManagement({ user }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ limit: 10, offset: 0, search: "", status: "" });

  // Hooks
  const { returns, pagination, loading, error, reload, updateStatus } = useReturns(filters);
  const { recommendations, fetchRecommendations, loading: aiLoading } = useReturnsRecommendations({ autoLoad: false });

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";

  // --- Handlers ---
  const handlePageChange = (newPage) => {
    setPage(newPage);
    setFilters(prev => ({ ...prev, offset: (newPage - 1) * prev.limit }));
  };

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value, offset: 0 }));
    setPage(1);
  };

  const handleStatusFilter = (e) => {
    setFilters(prev => ({ ...prev, status: e.target.value, offset: 0 }));
    setPage(1);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    if (confirm("Are you sure you want to update status?")) {
      await updateStatus(id, newStatus, "Updated via UI");
    }
  };

  // --- Render ---

  // Calculate simple insights from current page data (or fetch from API later)
  const totalValue = returns.reduce((acc, r) => acc + (r.total_value || 0), 0);
  const pendingCount = returns.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6 pb-20" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-in">
        <div>
          <h2 className={`text-4xl font-semibold ${textColor} mb-2`}>
            {t("returnsManagement", "Returns Management")}
          </h2>
          <p className={`${subTextColor}`}>
            {language === "ar" ? "إدارة ومراقبة المرتجعات وتحليل الأسباب" : "Manage returns, track status, and analyze insights"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {/* AI Button - Guarded by Role if needed, but UI shows lock if not allowed or just hidden */}
          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
            <button
              onClick={() => { setIsAIModalOpen(true); fetchRecommendations(); }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200 dark:shadow-none"
            >
              <FaRobot />
              {language === "ar" ? "توصيات الذكاء الاصطناعي" : "AI Insights"}
            </button>
          )}

          {/* New Return Button (TODO) */}
        </div>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <InsightCard
          title={language === "ar" ? "إجمالي قيمة المرتجعات (الصفحة)" : "Total Returns Value (Page)"}
          value={`$${totalValue.toLocaleString()}`}
          icon={FaBoxOpen}
          colorClass="bg-red-500 text-red-500"
        />
        <InsightCard
          title={language === "ar" ? "المرتجعات المعلقة" : "Pending Returns"}
          value={pendingCount}
          icon={FaExclamationTriangle}
          colorClass="bg-yellow-500 text-yellow-500"
        />
        {/* Add more insights */}
      </div>

      {/* Filters & Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 rtl:right-3 rtl:left-auto" />
            <input
              type="text"
              placeholder={language === "ar" ? "بحث عن رقم، عميل، مورد..." : "Search by number, customer, supplier..."}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 rtl:pr-10 rtl:pl-4"
              onChange={handleSearch}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-slate-700 dark:text-white focus:outline-none"
              onChange={handleStatusFilter}
            >
              <option value="">{language === "ar" ? "كل الحالات" : "All Statuses"}</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Loading...</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-slate-700/50 text-xs uppercase text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-3">{language === "ar" ? "الرقم" : "Return #"}</th>
                  <th className="px-6 py-3">{language === "ar" ? "التاريخ" : "Date"}</th>
                  <th className="px-6 py-3">{language === "ar" ? "العميل / المورد" : "Customer / Supplier"}</th>
                  <th className="px-6 py-3">{language === "ar" ? "المنتجات" : "Items"}</th>
                  <th className="px-6 py-3">{language === "ar" ? "الحالة" : "Status"}</th>
                  <th className="px-6 py-3 text-right">{language === "ar" ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => setSelectedReturn(selectedReturn === ret.id ? null : ret.id)}>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{ret.return_number}</td>
                    <td className="px-6 py-4">{ret.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 dark:text-gray-200">{ret.customer || '-'}</span>
                        <span className="text-xs text-gray-500">{ret.supplier || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={ret.items_summary}>
                      {ret.items_summary || <span className="italic text-gray-400">No items</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                        ${ret.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          ret.status === 'approved' ? 'bg-green-100 text-green-800' :
                            ret.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {ret.status_label || ret.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                        {/* Action Buttons based on Status */}
                        {ret.status === 'pending' && (
                          <>
                            <button onClick={() => handleStatusUpdate(ret.id, 'approved')} className="text-green-600 hover:bg-green-50 p-1 rounded" title="Approve">
                              <FaCheckCircle className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleStatusUpdate(ret.id, 'rejected')} className="text-red-600 hover:bg-red-50 p-1 rounded" title="Reject">
                              <FaTimesCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                        <button className="text-blue-600 hover:bg-blue-50 p-1 rounded" title="View Details">
                          <FaEye className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            {language === "ar" ? `صفحة ${page} من ${pagination.totalPages}` : `Page ${page} of ${pagination.totalPages}`}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-slate-700"
            >
              <FaArrowLeft className={language === "ar" ? "rotate-180" : ""} />
            </button>
            <button
              disabled={page >= pagination.totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="p-2 rounded-lg border border-gray-200 disabled:opacity-50 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-slate-700"
            >
              <FaArrowRight className={language === "ar" ? "rotate-180" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* AI Modal */}
      {isAIModalOpen && (
        <div className="fixed inset-0 z-[99999] overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity"
              onClick={() => setIsAIModalOpen(false)}
            ></div>

            <div className={`relative transform overflow-hidden rounded-2xl ${theme === "dark" ? "bg-slate-900 border border-white/10 shadow-2xl" : "bg-white shadow-2xl"} p-0 text-right transition-all sm:my-8 sm:w-full sm:max-w-2xl animate-scale-in flex flex-col max-h-[90vh]`}>
              {/* Header */}
              <div className={`p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between`}>
                <div>
                  <h3 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                    <FaRobot className="text-purple-600" />
                    {language === "ar" ? "تحليل الذكاء الاصطناعي" : "AI Recommendations"}
                  </h3>
                  <p className="text-sm text-gray-500">Powered by OpenAI</p>
                </div>
                <button
                  onClick={() => setIsAIModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FaTimesCircle className="w-8 h-8" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1 text-right">
                {aiLoading ? (
                  <div className="py-20 text-center flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-lg font-medium text-gray-500">
                      {language === "ar" ? "جاري التفكير..." : "Thinking..."}
                    </span>
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.map((rec, idx) => (
                      <div key={idx} className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-bold text-xl text-purple-900 dark:text-purple-100">
                            {language === "ar" ? rec.title : rec.title_en || rec.title}
                          </h4>
                          <span className="text-xs px-3 py-1 bg-white dark:bg-purple-800 rounded-full border border-purple-200 text-purple-600 dark:text-purple-200 font-bold uppercase tracking-wider">
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-base text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                          {language === "ar" ? rec.description : rec.description_en || rec.description}
                        </p>
                        {rec.savings > 0 && (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold text-lg">
                            <FaCheckCircle className="w-5 h-5" />
                            <span>
                              {language === "ar" ? "توفير متوقع: " : "Expected Savings: "}${rec.savings}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FaBoxOpen className="text-gray-400 text-3xl" />
                    </div>
                    <p className="text-lg text-gray-500">
                      {language === "ar" ? "لا توجد توصيات حالياً." : "No recommendations generated yet."}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={`p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end`}>
                <button
                  onClick={() => setIsAIModalOpen(false)}
                  className={`px-8 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 transition-all font-bold`}
                >
                  {language === "ar" ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default ReturnsManagement;

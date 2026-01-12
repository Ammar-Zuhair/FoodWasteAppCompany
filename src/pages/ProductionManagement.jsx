import { useState, useMemo, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import {
  useProductionBatches,
  useProductionStats,
} from "../hooks/useProduction.js";
import StatusBadge from "../components/shared/StatusBadge.jsx";
import { getStoredUser } from "../utils/api/auth.js";

// --- Components ---

const DeviationIndicator = ({ deviation, theme }) => {
  if (!deviation || deviation.status === "No Plan") return <span className="text-gray-400">-</span>;

  const { status, ratio, planned, actual } = deviation;
  const percentage = Math.min(Math.round(ratio * 100), 100); // Cap visual at 100% for bar inside

  // Colors
  let colorClass = "bg-green-500";
  let textClass = "text-green-500";

  if (status === "Delayed") {
    colorClass = "bg-red-500";
    textClass = "text-red-500";
  } else if (status === "Overproduction") {
    colorClass = "bg-amber-500";
    textClass = "text-amber-500";
  }

  return (
    <div className="w-full max-w-[140px]">
      <div className="flex justify-between text-xs mb-1">
        <span className={theme === "dark" ? "text-gray-300" : "text-gray-600"}>
          {actual} / {planned}
        </span>
        <span className={`font-bold ${textClass}`}>{status}</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700">
        <div
          className={`h-full ${colorClass} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const QualityStatusCell = ({ qualityInfo, theme }) => {
  if (!qualityInfo) return <span className="text-gray-400">-</span>;

  const { status, is_blocked, is_pending, audit } = qualityInfo;

  let bgClass = "bg-green-100 text-green-800 border-green-200";
  let icon = "✓";

  if (is_blocked) {
    bgClass = "bg-red-100 text-red-800 border-red-200";
    icon = "⛔"; // Stop sign
  } else if (is_pending) {
    bgClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
    icon = "⏳";
  }

  return (
    <div className="relative group cursor-help inline-flex items-center">
      <span className={`px-2 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${bgClass}`}>
        <span>{icon}</span>
        {status}
      </span>

      {/* Audit Tooltip */}
      {audit && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black/90 text-white text-xs rounded p-2 z-50">
          <p className="font-bold border-b border-gray-600 pb-1 mb-1">Audit Trail</p>
          <p>Inspector: {audit.inspector}</p>
          <p>Date: {audit.date}</p>
          {audit.notes && <p className="italic mt-1 text-gray-400">"{audit.notes}"</p>}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/90"></div>
        </div>
      )}
    </div>
  );
};

function ProductionManagement({ user: propUser }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const storedUser = getStoredUser();
  const user = propUser || (storedUser ? {
    id: storedUser.id,
    organization_id: storedUser.organization_id,
    role: storedUser.role,
  } : null);

  // State
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]); // Default Today

  // Hooks
  const { batches: apiBatches, loading, error, reload } = useProductionBatches({
    organization_id: user?.organization_id,
    date: dateFilter
  });

  const { stats: apiStats } = useProductionStats({
    organization_id: user?.organization_id,
  });

  // Data Processing
  const batches = apiBatches || [];

  // Grouping Logic - Always show City Index
  const groupedBatches = useMemo(() => {
    // Group by City -> Facility -> Product
    const groups = {};

    batches.forEach(batch => {
      // Use Arabic or English based on language
      const city = language === 'ar'
        ? (batch.facility_city_ar || batch.facility_city || "مدينة غير معروفة")
        : (batch.facility_city_en || batch.facility_city || "Unknown City");
      const facility = language === 'ar'
        ? (batch.facility_name_ar || batch.facility_name || "منشأة غير معروفة")
        : (batch.facility_name_en || batch.facility_name || "Unknown Facility");
      const product = language === 'ar'
        ? (batch.product_name_ar || batch.product_name || "منتج غير معروف")
        : (batch.product_name_en || batch.product_name || "Unknown Product");

      if (!groups[city]) groups[city] = {};
      if (!groups[city][facility]) groups[city][facility] = {};
      if (!groups[city][facility][product]) groups[city][facility][product] = [];

      groups[city][facility][product].push(batch);
    });

    return groups;
  }, [batches, language]);


  // Styles
  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";
  const headerBg = theme === "dark" ? "bg-slate-800" : "bg-[#E0F7FA]";
  const expandedBg = theme === "dark" ? "bg-slate-800/50" : "bg-blue-50/50";

  // --- Render Helpers ---

  const renderTable = (data) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className={`${headerBg} ${textColor}`}>
          <tr>
            <th className="px-4 py-3 text-left">{language === 'ar' ? 'رمز الدفعة' : 'Batch Code'}</th>
            <th className="px-4 py-3 text-left">{language === 'ar' ? 'الكمية' : 'Quantity'}</th>
            <th className="px-4 py-3 text-left">{language === 'ar' ? 'مدة الصلاحية' : 'Shelf Life'}</th>
            <th className="px-4 py-3 text-left">{language === 'ar' ? 'حالة الجودة' : 'Quality Status'}</th>
            <th className="px-4 py-3 text-left">{language === 'ar' ? 'خطة الإنتاج' : 'Production Plan'}</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan="5" className="p-4 text-center op-50">{language === 'ar' ? 'لا توجد بيانات' : 'No Data'}</td></tr>
          ) : data.map((batch) => (
            <tr key={batch.id} className={`border-t ${borderClass} hover:bg-black/5`}>
              <td className={`px-4 py-3 font-medium ${textColor}`}>{batch.batch_code}</td>
              <td className={`px-4 py-3 ${textColor}`}>{batch.quantity} {batch.unit}</td>
              <td className={`px-4 py-3 ${textColor}`}>
                {batch.shelf_life?.remaining_days} days
              </td>
              <td className="px-4 py-3">
                <QualityStatusCell qualityInfo={batch.quality_info} theme={theme} />
              </td>
              <td className="px-4 py-3">
                <DeviationIndicator deviation={batch.deviation} theme={theme} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Accordion Component for Factory
  const FactoryGroup = ({ name, products }) => {
    const [expanded, setExpanded] = useState(false);

    // Calculate totals for quick view
    const productCount = Object.keys(products).length;
    const totalBatches = Object.values(products).reduce((acc, curr) => acc + curr.length, 0);

    return (
      <div className={`rounded-lg border ${borderClass} ${expanded ? expandedBg : 'hover:bg-black/5'} transition-all`}>
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">{expanded ? "🏭" : "🏢"}</span>
            <div>
              <h4 className={`font-bold ${textColor} text-lg`}>{name}</h4>
              <p className={`text-xs ${subTextColor}`}>{productCount} Products • {totalBatches} Batches</p>
            </div>
          </div>
          <div className={`${textColor} transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}>
            ▼
          </div>
        </button>

        {/* Products List (Dropdown) */}
        {expanded && (
          <div className="p-4 pt-0 border-t border-gray-200/10 space-y-2 animation-expand">
            {Object.entries(products).map(([productName, batches]) => (
              <ProductDropdown key={productName} name={productName} batches={batches} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Accordion Component for Product
  const ProductDropdown = ({ name, batches }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className={`rounded border ${borderClass} bg-white/5`}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 text-left hover:bg-black/5 transition"
        >
          <div className="flex items-center gap-2">
            <span className="text-emerald-500">📦</span>
            <span className={`font-medium ${textColor}`}>{name}</span>
            <span className="text-xs bg-gray-500/10 px-2 py-0.5 rounded text-gray-500">
              {batches.length}
            </span>
          </div>
          <span className={`text-xs ${subTextColor}`}>{isOpen ? "Hide" : "Show"}</span>
        </button>

        {isOpen && (
          <div className="border-t border-gray-200/10">
            {renderTable(batches)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`space-y-6 max-w-7xl mx-auto`} dir={language === "ar" ? "rtl" : "ltr"}>

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-3xl font-bold ${textColor} mb-1`}>
            {t("productionManagement") || "Production Management"}
          </h2>
          <p className={`text-sm ${subTextColor}`}>
            {t("dailyProduction") || "Daily Production Tracking & Quality Control"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${borderClass} ${cardBgClass} ${textColor}`}
          />
        </div>
      </div>

      {/* Stats Summary (Simplified) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`${cardBgClass} rounded-lg p-5 border ${borderClass} shadow-sm`}>
          <p className={`text-sm ${subTextColor} uppercase tracking-wider`}>{language === 'ar' ? 'إجمالي الدفعات اليوم' : 'Total Batches Today'}</p>
          <p className={`text-3xl font-bold ${textColor} mt-1`}>{batches.length}</p>
        </div>
        <div className={`${cardBgClass} rounded-lg p-5 border ${borderClass} shadow-sm`}>
          <p className={`text-sm ${subTextColor} uppercase tracking-wider`}>{language === 'ar' ? 'إجمالي الكمية المنتجة' : 'Total Quantity Produced'}</p>
          <p className={`text-3xl font-bold ${textColor} mt-1`}>
            {batches.reduce((acc, curr) => acc + (parseFloat(curr.quantity) || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${cardBgClass} rounded-xl border ${borderClass} shadow-lg overflow-hidden min-h-[400px]`}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#429EBD]"></div>
          </div>
        ) : (
          <div className="p-4 space-y-8">
            {Object.entries(groupedBatches).map(([city, facilities]) => (
              <div key={city} className="space-y-4 animation-fade-in">
                {/* Level 1: City Key */}
                <div className="flex items-center gap-3 pb-2 border-b border-gray-200/20">
                  <span className="text-3xl">🏙️</span>
                  <div>
                    <h3 className={`text-2xl font-bold ${textColor}`}>{city}</h3>
                    <p className={`text-xs ${subTextColor}`}>{Object.keys(facilities).length} {language === 'ar' ? 'منشآت' : 'Factories'}</p>
                  </div>
                </div>

                {/* Level 2: Facilities List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(facilities).map(([facilityName, products]) => (
                    <FactoryGroup
                      key={facilityName}
                      name={facilityName}
                      products={products}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductionManagement;

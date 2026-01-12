import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { useAlerts } from "../../hooks/useAlerts.js";
import { useOrders } from "../../hooks/useOrders.js";
import { useProductionSuggestions } from "../../hooks/usePlanning.js";
import { BellIcon, LightningIcon, FactoryIcon, ShoppingCartIcon } from "../shared/Icons.jsx";
import { useEffect, useState } from "react";

function ImportantDataCards({ user }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  // Get unreviewed alerts
  const { alerts: allAlerts, loading: alertsLoading } = useAlerts({ status: "open" });
  const unreviewedAlerts = useMemo(() => {
    if (!allAlerts || allAlerts.length === 0) return [];
    return allAlerts.filter(alert => !alert.reviewed_at);
  }, [allAlerts]);

  // Get orders count
  const { orders, loading: ordersLoading } = useOrders({}, { autoLoad: true });
  const ordersCount = useMemo(() => {
    if (!orders) return 0;
    return orders.length;
  }, [orders]);

  // Get production suggestions
  const { suggestions, loading: suggestionsLoading, load: loadSuggestions } = useProductionSuggestions();
  const [suggestionsCount, setSuggestionsCount] = useState(0);

  useEffect(() => {
    // Load production suggestions for today
    const today = new Date().toISOString().split('T')[0];
    loadSuggestions({ date: today }).catch(() => {
      // Ignore errors, will show 0
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  useEffect(() => {
    if (suggestions) {
      const count = Array.isArray(suggestions) ? suggestions.length : (suggestions.count || 0);
      setSuggestionsCount(count);
    }
  }, [suggestions]);

  const cards = useMemo(() => {
    const unreviewedCount = unreviewedAlerts.length;
    const pendingOrders = orders?.filter(order =>
      order.status === "pending" || order.status === "processing"
    ).length || 0;

    return [
      {
        title: language === "ar" ? "التنبيهات غير المراجعة" : "Unreviewed Alerts",
        value: unreviewedCount.toString(),
        subtitle: language === "ar" ? "تتطلب مراجعة" : "Require review",
        tag: unreviewedCount > 0 ? (language === "ar" ? "جديد" : "New") : (language === "ar" ? "لا توجد" : "None"),
        gradient: theme === "dark" ? "from-red-500 to-red-600" : "from-red-400 to-red-500",
        icon: "alerts",
        loading: alertsLoading,
      },
      {
        title: language === "ar" ? "اقتراحات الإنتاج لليوم" : "Today's Production Suggestions",
        value: suggestionsCount.toString(),
        subtitle: language === "ar" ? "اقتراحات جديدة" : "New suggestions",
        tag: language === "ar" ? "إنتاج" : "Production",
        gradient: theme === "dark" ? "from-emerald-500 to-emerald-600" : "from-[#429EBD] to-[#429EBD]",
        icon: "production",
        loading: suggestionsLoading,
      },
      {
        title: language === "ar" ? "إجمالي الطلبات" : "Total Orders",
        value: ordersCount.toString(),
        subtitle: language === "ar" ? `${pendingOrders} قيد المعالجة` : `${pendingOrders} processing`,
        tag: language === "ar" ? "طلبات" : "Orders",
        gradient: theme === "dark" ? "from-blue-500 to-blue-600" : "from-[#053F5C] to-[#429EBD]",
        icon: "orders",
        loading: ordersLoading,
      },
      {
        title: language === "ar" ? "الطلبات المعلقة" : "Pending Orders",
        value: pendingOrders.toString(),
        subtitle: language === "ar" ? "تحتاج متابعة" : "Need follow-up",
        tag: language === "ar" ? "معلق" : "Pending",
        gradient: theme === "dark" ? "from-amber-500 to-amber-600" : "from-[#F7AD19] to-[#F7AD19]",
        icon: "pending",
        loading: ordersLoading,
      },
    ];
  }, [unreviewedAlerts.length, suggestionsCount, ordersCount, orders, theme, language, alertsLoading, suggestionsLoading, ordersLoading]);

  const bgClass = theme === "dark"
    ? "bg-slate-800/50 backdrop-blur-sm border-slate-700/50"
    : "bg-gradient-to-br from-[#F0FAFC]/90 to-[#E6F7FB]/80 backdrop-blur-sm border-[#9FE7F5]/40 shadow-sm";
  const hoverBorderClass = theme === "dark"
    ? "hover:border-slate-600/50"
    : "hover:border-[#429EBD]/50";
  const textClass = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const tagBgClass = theme === "dark"
    ? "bg-slate-700/50 border-slate-600/50"
    : "bg-[#9FE7F5]/40 border-[#429EBD]/40";

  return (
    <div className="grid gap-2 grid-cols-2 sm:grid-cols-2 md:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`group relative overflow-hidden rounded-xl ${bgClass} border p-3 sm:p-4 md:p-6 transition-all duration-300 hover:scale-[1.01] ${hoverBorderClass} hover:shadow-lg ${theme === "dark" ? "hover:shadow-emerald-500/10" : "hover:shadow-[#429EBD]/15"} animate-slide-in`}
          style={{ animationDelay: `${(index + 3) * 0.1}s` }}
        >
          {/* تأثير توهج خلفي */}
          <div className={`absolute -inset-1 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`} />

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                {card.icon === "alerts" && <BellIcon className={`w-4 h-4 sm:w-5 md:w-6 md:h-6 ${theme === "dark" ? "text-red-400" : "text-red-500"}`} />}
                {card.icon === "production" && <FactoryIcon className={`w-4 h-4 sm:w-5 md:w-6 md:h-6 ${theme === "dark" ? "text-emerald-400" : "text-[#429EBD]"}`} />}
                {card.icon === "orders" && <ShoppingCartIcon className={`w-4 h-4 sm:w-5 md:w-6 md:h-6 ${theme === "dark" ? "text-blue-400" : "text-blue-500"}`} />}
                {card.icon === "pending" && <LightningIcon className={`w-4 h-4 sm:w-5 md:w-6 md:h-6 ${theme === "dark" ? "text-amber-400" : "text-[#F7AD19]"}`} />}
              </div>
              <span className={`text-[8px] sm:text-xs font-bold ${textClass} ${tagBgClass} rounded-full px-1.5 py-0.5 border`}>
                {card.tag}
              </span>
            </div>
            <div className="mb-0">
              <div className={`text-[10px] sm:text-xs md:text-sm font-bold ${textClass} mb-1 uppercase tracking-wider leading-tight truncate`}>
                {card.title}
              </div>
              {card.loading ? (
                <div className={`text-xl sm:text-2xl md:text-5xl font-bold bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent leading-tight`}>
                  ...
                </div>
              ) : (
                <div className={`text-xl sm:text-2xl md:text-5xl font-bold bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent leading-tight`}>
                  {card.value}
                </div>
              )}
              <div className={`text-[9px] sm:text-xs md:text-sm ${textClass} mt-1 opacity-75 truncate`}>
                {card.subtitle}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ImportantDataCards;


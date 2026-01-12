import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { UsersIcon, FactoryIcon, LockIcon } from "../shared/Icons.jsx";
import { useDashboard } from "../../hooks/useDashboard.js";

function AdminCards() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { kpis, loading } = useDashboard();

  const cards = useMemo(() => {
    // Use real KPIs if available, otherwise show 0
    const activeUsers = kpis?.activeUsers !== undefined ? kpis.activeUsers.toString() : "0";
    const factoriesBranches = kpis?.factoriesBranches !== undefined
      ? kpis.factoriesBranches.toString()
      : (kpis?.totalFacilities !== undefined ? kpis.totalFacilities.toString() : "0");
    const permissionsRoles = kpis?.permissionsRoles !== undefined ? kpis.permissionsRoles.toString() : "0";

    return [
      {
        title: t("activeUsers"),
        value: activeUsers,
        tag: t("systemPermissions"),
        gradient: theme === "dark" ? "from-emerald-500 to-emerald-600" : "from-[#429EBD] to-[#429EBD]",
        icon: "users",
      },
      {
        title: t("factoriesBranches"),
        value: factoriesBranches,
        tag: t("operationalSites"),
        gradient: theme === "dark" ? "from-amber-500 to-amber-600" : "from-[#F7AD19] to-[#F7AD19]",
        icon: "factory",
      },
      {
        title: t("permissionsRoles"),
        value: permissionsRoles,
        tag: t("organizationalStructures"),
        gradient: theme === "dark" ? "from-blue-500 to-blue-600" : "from-[#053F5C] to-[#429EBD]",
        icon: "lock",
      },
    ];
  }, [theme, t, kpis]);

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
    <div className="grid gap-2 grid-cols-2 sm:grid-cols-2 md:grid-cols-3">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`group relative overflow-hidden rounded-xl ${bgClass} border p-3 sm:p-4 md:p-6 transition-all duration-300 hover:scale-[1.01] ${hoverBorderClass} hover:shadow-lg ${theme === "dark" ? "hover:shadow-emerald-500/10" : "hover:shadow-[#429EBD]/15"} animate-slide-in ${index === 2 ? 'col-span-2 sm:col-span-1' : ''}`}
          style={{ animationDelay: `${(index + 3) * 0.1}s` }}
        >
          {/* تأثير توهج خلفي */}
          <div className={`absolute -inset-1 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300`} />

          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                {card.icon === "users" && <UsersIcon className="w-4 h-4 sm:w-5 md:w-6 md:h-6 text-blue-500" />}
                {card.icon === "factory" && <FactoryIcon className="w-4 h-4 sm:w-5 md:w-6 md:h-6 text-amber-500" />}
                {card.icon === "lock" && <LockIcon className="w-4 h-4 sm:w-5 md:w-6 md:h-6 text-blue-600" />}
              </div>
              <span className={`text-[8px] sm:text-xs font-bold ${textClass} ${tagBgClass} rounded-full px-1.5 py-0.5 border`}>
                {card.tag}
              </span>
            </div>
            <div className="mb-0">
              <div className={`text-[10px] sm:text-xs md:text-sm font-bold ${textClass} mb-1 uppercase tracking-wider leading-tight truncate`}>
                {card.title}
              </div>
              <div className={`text-xl sm:text-2xl md:text-5xl font-bold bg-gradient-to-br ${card.gradient} bg-clip-text text-transparent leading-tight`}>
                {card.value}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default AdminCards;

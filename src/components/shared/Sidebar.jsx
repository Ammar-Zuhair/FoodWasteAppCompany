import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { getMenuItems } from "../../utils/permissions.js";

function Sidebar({ role, user }) {
  const { theme } = useTheme();
  const { language, t } = useLanguage();
  const location = useLocation();
  
  const menuItems = useMemo(() => {
    // Get user info for personalized menu
    const userInfo = user ? {
      account_type: user.account_type,
      department: user.department,
      job_title: user.job_title,
      is_distributor: user.is_distributor,
      branch_id: user.branch_id,
    } : {};
    
    // Get menu items based on role and user info
    const roleMenuItems = getMenuItems(role, userInfo);
    
    // Map to format with translations
    return roleMenuItems.map(item => ({
      label: t(item.label) || item.label,
      path: item.path,
      icon: item.icon,
    }));
  }, [role, user, t]);

  const bgClass = theme === "dark"
    ? "bg-slate-900/80 backdrop-blur-xl border-white/5"
    : "bg-[#F0FAFC]/80 backdrop-blur-xl border-[#9FE7F5]/40 shadow-sm";
  const textClass = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextClass = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/5" : "border-[#9FE7F5]/40";
  const activeClass = theme === "dark"
    ? "bg-gradient-to-r from-emerald-500/20 to-amber-500/20 text-white border-emerald-500/30"
    : "bg-gradient-to-r from-[#429EBD]/15 to-[#F7AD19]/15 text-[#053F5C] border-[#429EBD]/30 shadow-sm";
  const hoverClass = theme === "dark"
    ? "hover:bg-slate-800/50 hover:text-white"
    : "hover:bg-[#9FE7F5]/30 hover:text-[#053F5C]";
  const inactiveTextClass = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";

  return (
    <aside 
      className={`fixed top-0 ${language === "ar" ? "right-0" : "left-0"} h-screen w-64 ${bgClass} backdrop-blur-xl border-l ${borderClass} flex flex-col z-50 transition-colors duration-300`}
      id="main-sidebar" 
      dir={language === "ar" ? "rtl" : "ltr"} 
      style={{ 
        position: "fixed", 
        top: 0, 
        bottom: 0,
        height: "100vh",
        width: "16rem",
        [language === "ar" ? "right" : "left"]: 0,
        zIndex: 10000,
        pointerEvents: "auto"
      }}
    >
      <div className={`px-5 py-5 border-b ${borderClass} flex-shrink-0`}>
        <div className={`text-[11px] ${subTextClass} mb-1.5 uppercase tracking-wider`}>
          {t("currentRole")}
        </div>
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${theme === "dark" ? "bg-emerald-400" : "bg-[#429EBD]"} animate-pulse`} />
          <span className={`text-sm font-semibold ${textClass}`}>{role}</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto overscroll-contain">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={index}
              to={item.path}
              className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all duration-200 ${
                isActive
                  ? `${activeClass} shadow-lg ${theme === "dark" ? "shadow-emerald-500/10" : "shadow-[#429EBD]/10"}`
                  : `${inactiveTextClass} ${hoverClass}`
              }`}
            >
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <span className={`h-2 w-2 rounded-full ${theme === "dark" ? "bg-emerald-400" : "bg-[#429EBD]"} animate-pulse`} />
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default Sidebar;

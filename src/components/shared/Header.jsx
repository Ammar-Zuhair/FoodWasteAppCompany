import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import Logo from "./Logo.jsx";
import { SunIcon, MoonIcon } from "./Icons.jsx";
import RoleBadge from "./RoleBadge.jsx";
import { getRoleDisplayInfo, isReadOnly } from "../../utils/permissions.js";

function Header({ user, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const menuRef = useRef(null);

  // Notification settings state
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    alerts: true,
    reports: true,
    updates: false,
  });

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowUserMenu(false);
        setShowNotificationSettings(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setShowUserMenu(false);
    if (onLogout) {
      onLogout();
    }
  };

  const bgClass = theme === "dark"
    ? "bg-slate-900/80 backdrop-blur-xl border-white/5"
    : "border-slate-800/50 backdrop-blur-sm bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-md";
  const textClass = theme === "dark" ? "text-white" : "text-white";
  const subTextClass = theme === "dark" ? "text-slate-400" : "text-white/90";

  const menuBgClass = theme === "dark"
    ? "bg-slate-800/95 border-slate-700/50"
    : "bg-slate-800/95 border-slate-600/50";

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getRoleLabel = () => {
    if (user.account_type === "supermarket" && user.supermarket_name) {
      return user.supermarket_name;
    }

    // Use permissions system to get role display name
    const roleDisplay = getRoleDisplayInfo(user.role);
    if (roleDisplay) {
      return language === "ar" ? roleDisplay.ar : roleDisplay.en;
    }

    // Fallback for legacy roles
    const roles = {
      admin: language === "ar" ? "مدير النظام" : "Admin",
      manager: language === "ar" ? "مدير" : "Manager",
      operator: language === "ar" ? "مشغل" : "Operator",
      viewer: language === "ar" ? "مشاهد" : "Viewer",
    };
    return roles[user.role] || user.role || (language === "ar" ? "مستخدم" : "User");
  };

  return (
    <header
      className={`fixed top-0 ${language === "ar" ? "right-64" : "left-64"} ${bgClass} backdrop-blur-xl border-b px-6 py-4 flex items-center justify-between z-50 transition-colors duration-300`}
      id="main-header"
      dir={language === "ar" ? "rtl" : "ltr"}
      style={{
        width: `calc(100% - 16rem)`,
        position: "fixed",
        top: 0,
        left: language === "ar" ? "auto" : "16rem",
        right: language === "ar" ? "16rem" : "auto",
        zIndex: 10000,
        pointerEvents: "auto"
      }}
    >
      {/* Logo & Title */}
      <div className="flex items-center gap-4">
        <Logo />
        <div>
          <h1 className={`text-base font-semibold ${textClass} leading-tight`}>
            {t("platformTitle")}
          </h1>
          <p className={`text-xs ${subTextClass} mt-0.5 leading-relaxed`}>
            {t("operationalDashboard")}
          </p>
        </div>
      </div>

      {/* User Section */}
      <div className="flex items-center gap-3 relative" ref={menuRef}>
        {/* User Avatar & Info - Clickable */}
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 ${showUserMenu
            ? "bg-white/10 ring-2 ring-[#429EBD]/50"
            : "hover:bg-white/5"
            }`}
        >
          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#429EBD] to-[#053F5C] flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {getInitials(user.name)}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-800 animate-pulse" />
          </div>

          {/* User Info */}
          <div className={language === "ar" ? "text-right" : "text-left"}>
            <div className={`text-sm font-semibold ${textClass} leading-tight`}>{user.name}</div>
            <div className={`text-xs ${subTextClass} mt-0.5`}>{getRoleLabel()}</div>
          </div>

          {/* Arrow */}
          <svg
            className={`w-4 h-4 ${subTextClass} transition-transform duration-300 ${showUserMenu ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {showUserMenu && (
          <div
            className={`absolute top-full ${language === "ar" ? "left-0" : "right-0"} mt-2 w-80 rounded-2xl ${menuBgClass} border shadow-2xl overflow-hidden z-50`}
            style={{
              animation: "slideDown 0.2s ease-out",
            }}
          >
            {/* User Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-[#429EBD]/20 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#429EBD] to-[#053F5C] flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {getInitials(user.name)}
                </div>
                <div>
                  <p className="text-white font-semibold text-base">{user.name}</p>
                  <p className="text-slate-400 text-sm">{user.email || "user@example.com"}</p>
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-[#429EBD]/20 text-[#429EBD] text-xs font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {getRoleLabel()}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              {/* Profile Settings */}
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate("/profile");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div className={language === "ar" ? "text-right" : "text-left"}>
                  <p className="font-medium text-sm">{language === "ar" ? "الملف الشخصي" : "Profile Settings"}</p>
                  <p className="text-xs text-slate-400">{language === "ar" ? "إدارة معلوماتك الشخصية" : "Manage your personal info"}</p>
                </div>
              </button>

              {/* Divider */}
              <div className="my-2 border-t border-white/10" />

              {/* System Settings Section */}
              <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {language === "ar" ? "إعدادات النظام" : "System Settings"}
              </p>

              {/* Language Toggle */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  </div>
                  <div className={language === "ar" ? "text-right" : "text-left"}>
                    <p className="font-medium text-sm text-white">{language === "ar" ? "اللغة" : "Language"}</p>
                    <p className="text-xs text-slate-400">{language === "ar" ? "العربية" : "English"}</p>
                  </div>
                </div>
                <button
                  onClick={toggleLanguage}
                  className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-semibold hover:bg-purple-500/30 transition-colors"
                >
                  {language === "ar" ? "EN" : "عربي"}
                </button>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${theme === "dark" ? "bg-amber-500/20" : "bg-slate-500/20"}`}>
                    {theme === "dark" ? (
                      <SunIcon className="w-5 h-5 text-amber-400" />
                    ) : (
                      <MoonIcon className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className={language === "ar" ? "text-right" : "text-left"}>
                    <p className="font-medium text-sm text-white">{language === "ar" ? "المظهر" : "Appearance"}</p>
                    <p className="text-xs text-slate-400">
                      {theme === "dark"
                        ? (language === "ar" ? "الوضع الداكن" : "Dark Mode")
                        : (language === "ar" ? "الوضع الفاتح" : "Light Mode")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`relative w-12 h-6 rounded-full transition-colors ${theme === "dark" ? "bg-amber-500/30" : "bg-slate-600"}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${theme === "dark" ? "left-7" : "left-1"
                      }`}
                  />
                </button>
              </div>

              {/* Notification Settings */}
              <button
                onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-500/20 flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2">
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                  </div>
                  <div className={language === "ar" ? "text-right" : "text-left"}>
                    <p className="font-medium text-sm text-white">{language === "ar" ? "الإشعارات" : "Notifications"}</p>
                    <p className="text-xs text-slate-400">{language === "ar" ? "إدارة التنبيهات" : "Manage alerts"}</p>
                  </div>
                </div>
                <svg
                  className={`w-4 h-4 text-slate-400 transition-transform ${showNotificationSettings ? "rotate-180" : ""}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {/* Notification Settings Submenu */}
              {showNotificationSettings && (
                <div className="mx-4 mb-2 p-3 rounded-xl bg-white/5 space-y-2">
                  {[
                    { key: "email", label: language === "ar" ? "إشعارات البريد" : "Email Notifications", icon: "📧" },
                    { key: "push", label: language === "ar" ? "الإشعارات الفورية" : "Push Notifications", icon: "🔔" },
                    { key: "sms", label: language === "ar" ? "رسائل SMS" : "SMS Alerts", icon: "📱" },
                    { key: "alerts", label: language === "ar" ? "تنبيهات النظام" : "System Alerts", icon: "⚠️" },
                    { key: "reports", label: language === "ar" ? "التقارير اليومية" : "Daily Reports", icon: "📊" },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-1">
                      <span className="text-sm text-slate-300">{item.label}</span>
                      <button
                        onClick={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                        className={`relative w-10 h-5 rounded-full transition-colors ${notifications[item.key] ? "bg-emerald-500" : "bg-slate-600"}`}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${notifications[item.key] ? "left-5" : "left-0.5"
                            }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Divider */}
              <div className="my-2 border-t border-white/10" />

              {/* System Settings Link */}
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  navigate("/settings/system");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-slate-500/20 flex items-center justify-center group-hover:bg-slate-500/30 transition-colors">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </div>
                <div className={language === "ar" ? "text-right" : "text-left"}>
                  <p className="font-medium text-sm">{language === "ar" ? "إعدادات النظام" : "System Settings"}</p>
                  <p className="text-xs text-slate-400">{language === "ar" ? "التكامل والإعدادات المتقدمة" : "Integration & advanced settings"}</p>
                </div>
              </button>
            </div>

            {/* Logout Button */}
            <div className="p-2 border-t border-white/10 bg-red-500/5">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500/20 to-red-600/20 text-red-400 hover:from-red-500/30 hover:to-red-600/30 transition-all font-medium group"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:translate-x-1 transition-transform">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {language === "ar" ? "تسجيل الخروج" : "Sign Out"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add animation keyframes */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </header>
  );
}

export default Header;

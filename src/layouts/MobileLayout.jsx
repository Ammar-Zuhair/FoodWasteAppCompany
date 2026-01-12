import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/shared/Logo.jsx";
import { getMenuItems } from "../utils/permissions.js";
import { isNative, initStatusBar, openCamera } from "../utils/capacitor.js";
import { useDevice } from "../hooks/useDevice.js";

// Icons mapping
const getIcon = (iconName) => {
  const icons = {
    home: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    production: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    batches: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    ai: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    quality: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    waste: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
    refrigeration: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0h6m2 0h2a2 2 0 002-2v-3a2 2 0 00-2-2h-2a2 2 0 00-2 2v3a2 2 0 002 2z" />
      </svg>
    ),
    alerts: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    shipments: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    reports: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    track: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    chatbot: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    inventory: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    users: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    facilities: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    vehicles: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
    supermarkets: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    charity: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    orders: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    distribution: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
      </svg>
    ),
    heatmaps: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    rfid: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
      </svg>
    ),
    digitalTwin: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
    default: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    ),
  };
  return icons[iconName] || icons.default;
};

function MobileLayout({ user, children, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const { isTablet } = useDevice();

  // Notification settings state
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    alerts: true,
    reports: true,
    updates: false,
  });

  // Pull to Refresh state - باستخدام refs لتقليل إعادة الرسم
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const mainRef = useRef(null);
  const startY = useRef(0);
  const initialScrollTop = useRef(0);
  const isPullingRef = useRef(false);
  const canPullRef = useRef(false);
  const touchStartScrollTop = useRef(0);
  const PULL_THRESHOLD = 80;
  const SCROLL_TOLERANCE = 2; // التسامح للتمرير

  // Pull to Refresh handlers - محسّنة للأداء
  const handleTouchStart = useCallback((e) => {
    isPullingRef.current = false;
    canPullRef.current = false;

    if (mainRef.current) {
      touchStartScrollTop.current = mainRef.current.scrollTop;
      initialScrollTop.current = touchStartScrollTop.current;

      // فقط عند التمرير في أعلى الصفحة تماماً (scrollTop <= 2)
      if (touchStartScrollTop.current <= SCROLL_TOLERANCE) {
        startY.current = e.touches[0].clientY;
        canPullRef.current = true;
      }
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    // إذا لم نبدأ من أعلى الصفحة، لا تفعل شيء
    if (!canPullRef.current || !mainRef.current) return;

    const currentScrollTop = mainRef.current.scrollTop;

    // إذا تحرك المحتوى لأسفل (scrollTop > tolerance)، أوقف pull-to-refresh فوراً
    if (currentScrollTop > SCROLL_TOLERANCE) {
      canPullRef.current = false;
      setPullDistance(0);
      isPullingRef.current = false;
      return;
    }

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    // فقط عند السحب للأسفل (diff > 20 لتجنب التفعيل العرضي)
    // ويجب أن يكون scrollTop في الأعلى
    if (diff > 20 && currentScrollTop <= SCROLL_TOLERANCE && touchStartScrollTop.current <= SCROLL_TOLERANCE) {
      isPullingRef.current = true;
      const newDistance = Math.min(diff * 0.3, 100);
      setPullDistance(prev => {
        if (Math.abs(prev - newDistance) > 8) return newDistance;
        return prev;
      });
    } else if (diff < -5) {
      // المستخدم يسحب للأعلى (للتمرير للمحتوى)، أوقف pull-to-refresh
      canPullRef.current = false;
      setPullDistance(0);
      isPullingRef.current = false;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    // تحقق إضافي صارم: يجب أن نكون في أعلى الصفحة عند الإفلات
    const currentScrollTop = mainRef.current?.scrollTop || 0;
    const atTop = currentScrollTop <= SCROLL_TOLERANCE;

    if (isPullingRef.current && pullDistance >= PULL_THRESHOLD && !isRefreshing && atTop && touchStartScrollTop.current <= SCROLL_TOLERANCE) {
      setIsRefreshing(true);
      window.dispatchEvent(new CustomEvent('refreshPageData'));

      setTimeout(() => {
        setIsRefreshing(false);
      }, 1500);
    }
    setPullDistance(0);
    isPullingRef.current = false;
    canPullRef.current = false;
  }, [pullDistance, isRefreshing]);

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Get role label
  const getRoleLabel = () => {
    const roles = {
      admin: language === "ar" ? "مدير النظام" : "System Administrator",
      manager: language === "ar" ? "مدير" : "Manager",
      operator: language === "ar" ? "مشغل" : "Operator",
      viewer: language === "ar" ? "مشاهد" : "Viewer",
    };
    return roles[user.role] || user.role || (language === "ar" ? "مستخدم" : "User");
  };

  const menuItems = getMenuItems(user.role);

  // تحديد إذا كانت الصفحة الحالية صفحة تفاصيل (ليست من الأزرار السفلية)
  const bottomNavPaths = menuItems.filter(item => item.isBottomNav).map(item => item.path);
  const isDetailPage = !bottomNavPaths.includes(location.pathname) && location.pathname !== '/';

  // الحصول على اسم الصفحة الحالية
  const getCurrentPageTitle = () => {
    const currentItem = menuItems.find(item => item.path === location.pathname);
    if (currentItem) {
      return t(currentItem.label) || currentItem.label;
    }
    return t('appName') || 'تقليل هدر الطعام';
  };

  // Initialize StatusBar for mobile - CRITICAL for proper safe area handling
  useEffect(() => {
    if (isNative()) {
      // Initialize immediately and retry if needed
      const initializeStatusBar = async () => {
        await initStatusBar(theme);
        // Retry after a short delay to ensure it's applied
        setTimeout(async () => {
          await initStatusBar(theme);
        }, 100);
      };
      initializeStatusBar();
    }
  }, [theme]);

  const bgClass = theme === "dark"
    ? "bg-slate-950"
    : "bg-white";
  const cardBgClass = theme === "dark"
    ? "bg-slate-900 backdrop-blur-xl border-slate-800 shadow-2xl"
    : "bg-white backdrop-blur-xl border-slate-200 shadow-xl";
  const textColor = theme === "dark" ? "text-white" : "text-slate-900";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-slate-500";
  const borderClass = theme === "dark" ? "border-slate-800" : "border-slate-200";

  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className={`min-h-dvh flex flex-col ${bgClass} relative overflow-hidden transition-colors duration-300`}
      style={{
        marginTop: '0',
        paddingTop: '0',
        top: '0'
      }}
    >
      {/* Background - Clean and simple matching App_Android_Customers */}

      {/* Header - أكبر وأوضح مع دعم صفحات التفاصيل */}
      <header
        className={`fixed left-0 right-0 z-20 border-b ${borderClass} flex items-center justify-between shadow-lg`}
        style={{
          top: 0,
          paddingLeft: `max(1rem, env(safe-area-inset-left))`,
          paddingRight: `max(1rem, env(safe-area-inset-right))`,
          paddingTop: `calc(0.75rem + env(safe-area-inset-top))`,
          paddingBottom: '0.75rem',
          height: `calc(${isTablet ? '4.5rem' : '4rem'} + env(safe-area-inset-top))`,
          minHeight: `calc(${isTablet ? '4.5rem' : '4rem'} + env(safe-area-inset-top))`,
          backgroundColor: theme === "dark" ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)'
        }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* زر القائمة أو الرجوع */}
          {isDetailPage ? (
            // زر الرجوع في صفحات التفاصيل
            <button
              onClick={() => navigate('/dashboard')}
              className={`shrink-0 p-2 rounded-xl ${theme === "dark" ? "bg-slate-800/80 hover:bg-slate-700/80 text-white" : "bg-slate-100/90 hover:bg-slate-200/90 text-[#053F5C]"} transition-all duration-200 active:scale-95 shadow-sm`}
              aria-label="Back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={language === "ar" ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
              </svg>
            </button>
          ) : (
            // زر القائمة الجانبية في الصفحات الرئيسية
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`shrink-0 p-2 rounded-xl ${theme === "dark" ? "bg-slate-800/80 hover:bg-slate-700/80 text-white" : "bg-slate-100/90 hover:bg-slate-200/90 text-[#053F5C]"} transition-all duration-200 active:scale-95 shadow-sm`}
              aria-label="Menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          {/* اسم الصفحة أو اللوجو */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isDetailPage ? (
              // عنوان الصفحة في صفحات التفاصيل
              <h1 className={`text-lg font-bold ${textColor} truncate`}>
                {getCurrentPageTitle()}
              </h1>
            ) : (
              // اللوجو واسم التطبيق في الصفحات الرئيسية
              <>
                <div className="shrink-0 h-9">
                  <Logo className="h-full w-auto" />
                </div>
                <div className="min-w-0">
                  <div className={`text-lg font-bold ${textColor}`}>
                    {language === "ar" ? "ترشيد" : "Tarsheed"}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side - زر خاص حسب الصفحة */}
        <div className="flex items-center gap-2 shrink-0">
          {location.pathname === '/chatbot' ? (
            // زر تاريخ المحادثات في صفحة الشات
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openChatHistory'))}
              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-slate-700/80 hover:bg-slate-600/80 text-white" : "bg-slate-200/90 hover:bg-slate-300/90 text-[#053F5C]"} transition-all duration-200 active:scale-95 shadow-sm`}
              aria-label="Chat History"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          ) : (
            // زر المستخدم في باقي الصفحات
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-slate-700/80 hover:bg-slate-600/80 text-white" : "bg-slate-200/90 hover:bg-slate-300/90 text-[#053F5C]"} transition-all duration-200 active:scale-95 shadow-sm`}
              aria-label="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Hamburger Menu - Slide in from side */}
      {
        isMenuOpen && (
          <>
            {/* Overlay - يبدأ بعد شريط الحالة */}
            <div
              className={`fixed z-40 ${theme === "dark" ? "bg-black/70" : "bg-white/70"} backdrop-blur-sm transition-opacity duration-300`}
              onClick={() => setIsMenuOpen(false)}
              style={{
                top: 'env(safe-area-inset-top)',
                left: 0,
                right: 0,
                bottom: 0,
                paddingLeft: `max(0, env(safe-area-inset-left))`,
                paddingRight: `max(0, env(safe-area-inset-right))`,
                paddingBottom: `max(0, env(safe-area-inset-bottom))`
              }}
            />
            {/* Menu Panel - يبدأ بعد الـ Header مباشرة (بعد شريط الحالة + Header) */}
            <div
              className={`fixed ${language === "ar" ? "right-0" : "left-0"} bottom-0 w-80 ${cardBgClass} border-l ${borderClass} shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
              style={{
                top: `calc(env(safe-area-inset-top) + ${isTablet ? '3.5rem' : '3rem'})`,
                paddingTop: 0,
                paddingLeft: `max(0, env(safe-area-inset-left))`,
                paddingRight: `max(0, env(safe-area-inset-right))`,
                paddingBottom: `max(0, env(safe-area-inset-bottom))`,
                maxHeight: `calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - ${isTablet ? '3.5rem' : '3rem'})`,
                height: `calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - ${isTablet ? '3.5rem' : '3rem'})`
              }}
            >
              {/* Header Section - محسّن ومنسق مع احترام safe area - يبدأ بعد الـ Header الرئيسي */}
              <div
                className={`border-b ${borderClass} ${theme === "dark" ? "bg-slate-900/50" : "bg-slate-50/50"}`}
                style={{
                  paddingTop: '1.25rem',
                  paddingBottom: '0.875rem',
                  paddingLeft: `max(1rem, env(safe-area-inset-left))`,
                  paddingRight: `max(1rem, env(safe-area-inset-right))`,
                  marginTop: 0,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  backgroundColor: theme === "dark" ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)'
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${theme === "dark" ? "bg-slate-800" : "bg-slate-200"}`}>
                      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[10px] ${subTextColor} mb-0.5 uppercase tracking-wider font-medium`}>
                        {t("currentRole") || "الدور الحالي"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${theme === "dark" ? "bg-emerald-400" : "bg-[#429EBD]"} animate-pulse`} />
                        <span className={`text-sm font-bold ${textColor} truncate`}>{user.role}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className={`shrink-0 p-1.5 rounded-lg ${theme === "dark" ? "bg-slate-800/80 hover:bg-slate-700/80" : "bg-slate-200/80 hover:bg-slate-300/80"} transition-colors ${textColor}`}
                    aria-label="Close menu"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Menu Items - فقط العناصر غير الموجودة في الـ Bottom Nav */}
              <nav
                className="px-2.5 py-3 space-y-1.5 overflow-y-auto"
                style={{
                  maxHeight: 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 100px)',
                  paddingLeft: `max(0.625rem, env(safe-area-inset-left))`,
                  paddingRight: `max(0.625rem, env(safe-area-inset-right))`,
                  paddingBottom: `max(0.75rem, env(safe-area-inset-bottom))`
                }}
              >
                {menuItems.filter(item => !item.isBottomNav).map((item, index) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        navigate(item.path);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-lg transition-all duration-200 ${isActive
                        ? `${theme === "dark" ? "bg-emerald-500/20 text-white shadow-sm" : "bg-[#429EBD]/20 text-[#053F5C] shadow-sm"} border ${theme === "dark" ? "border-emerald-500/40" : "border-[#429EBD]/40"}`
                        : `${subTextColor} ${theme === "dark" ? "hover:bg-slate-800/60 hover:text-white" : "hover:bg-slate-100/80 hover:text-[#053F5C]"}`
                        } active:scale-[0.98]`}
                    >
                      <span className={`shrink-0 ${isActive ? (theme === "dark" ? "text-emerald-400" : "text-[#429EBD]") : ""}`}>
                        {getIcon(item.icon)}
                      </span>
                      <span className={`font-medium text-sm flex-1 ${language === "ar" ? "text-right" : "text-left"} ${isActive ? textColor : ""}`}>
                        {t(item.label) || item.label}
                      </span>
                      {isActive && (
                        <span className={`shrink-0 h-1.5 w-1.5 rounded-full ${theme === "dark" ? "bg-emerald-400" : "bg-[#429EBD]"} animate-pulse`} />
                      )}
                      {!isActive && (
                        <svg className="w-3.5 h-3.5 shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={language === "ar" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </>
        )
      }

      {/* Main Content - Optimized for mobile - يبدأ بعد Header الثابت */}
      <main
        ref={mainRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 relative overflow-y-auto overscroll-contain"
        style={{
          paddingLeft: `max(1rem, env(safe-area-inset-left))`,
          paddingRight: `max(1rem, env(safe-area-inset-right))`,
          paddingTop: `calc(${isTablet ? '5rem' : '4.5rem'} + env(safe-area-inset-top) + 0.5rem)`,
          paddingBottom: `max(${menuItems.length > 0 && menuItems.length <= 5 ? '6.5rem' : '1rem'}, calc(env(safe-area-inset-bottom) + 5rem))`,
          marginTop: '0',
          WebkitOverflowScrolling: 'touch', // تمرير سلس على iOS
        }}
      >
        {/* Pull to Refresh Indicator - تصميم جميل */}
        {(pullDistance > 0 || isRefreshing) && (
          <div
            className="fixed left-0 right-0 flex justify-center pointer-events-none z-10"
            style={{
              top: `calc(${isTablet ? '5rem' : '4.5rem'} + env(safe-area-inset-top) + 8px)`,
              opacity: Math.min(pullDistance / 50, 1),
            }}
          >
            <div
              className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl backdrop-blur-lg border
                ${theme === "dark"
                  ? "bg-gradient-to-r from-emerald-900/90 to-teal-900/90 border-emerald-500/30 text-white"
                  : "bg-gradient-to-r from-[#429EBD]/95 to-[#9FE7F5]/95 border-white/50 text-white"
                }`}
              style={{
                transform: `scale(${Math.min(0.8 + pullDistance / 200, 1)})`,
                transition: 'transform 0.2s ease-out'
              }}
            >
              {/* أيقونة التحديث */}
              <div
                className={`w-6 h-6 flex items-center justify-center`}
                style={{
                  transform: `rotate(${pullDistance * 4}deg)`,
                  animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none',
                  transition: isRefreshing ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>

              {/* النص */}
              <span className="text-sm font-semibold">
                {isRefreshing
                  ? (language === "ar" ? "جاري التحديث..." : "Refreshing...")
                  : pullDistance >= PULL_THRESHOLD
                    ? (language === "ar" ? "✓ اترك للتحديث" : "✓ Release")
                    : (language === "ar" ? "↓ اسحب للأسفل" : "↓ Pull down")
                }
              </span>

              {/* شريط التقدم */}
              {!isRefreshing && (
                <div className="w-12 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-100"
                    style={{ width: `${Math.min((pullDistance / PULL_THRESHOLD) * 100, 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}
        <div className="max-w-full mx-auto h-full">
          {children}
        </div>
      </main>

      {/* Settings Menu - Slide in from side */}
      {
        isSettingsOpen && (
          <>
            {/* Overlay */}
            <div
              className={`fixed z-40 ${theme === "dark" ? "bg-black/70" : "bg-white/70"} backdrop-blur-sm transition-opacity duration-300`}
              onClick={() => setIsSettingsOpen(false)}
              style={{
                top: 'env(safe-area-inset-top)',
                left: 0,
                right: 0,
                bottom: 0,
                paddingLeft: `max(0, env(safe-area-inset-left))`,
                paddingRight: `max(0, env(safe-area-inset-right))`,
                paddingBottom: `max(0, env(safe-area-inset-bottom))`
              }}
            />
            {/* Settings Panel */}
            <div
              className={`fixed ${language === "ar" ? "right-0" : "left-0"} bottom-0 w-80 ${cardBgClass} border-l ${borderClass} shadow-2xl z-50 transform transition-transform duration-300 overflow-y-auto`}
              onClick={(e) => e.stopPropagation()}
              style={{
                top: `calc(env(safe-area-inset-top) + ${isTablet ? '3.5rem' : '3rem'})`,
                paddingTop: 0,
                paddingLeft: `max(0, env(safe-area-inset-left))`,
                paddingRight: `max(0, env(safe-area-inset-right))`,
                paddingBottom: `max(0, env(safe-area-inset-bottom))`,
                maxHeight: `calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - ${isTablet ? '3.5rem' : '3rem'})`,
                height: `calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - ${isTablet ? '3.5rem' : '3rem'})`
              }}
            >
              {/* User Header */}
              <div
                className={`border-b ${borderClass} ${theme === "dark" ? "bg-slate-900/50" : "bg-slate-50/50"}`}
                style={{
                  paddingTop: '1.25rem',
                  paddingBottom: '1rem',
                  paddingLeft: `max(1rem, env(safe-area-inset-left))`,
                  paddingRight: `max(1rem, env(safe-area-inset-right))`,
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  backgroundColor: theme === "dark" ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)'
                }}
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${theme === "dark" ? "bg-gradient-to-br from-[#429EBD] to-[#053F5C]" : "bg-gradient-to-br from-[#429EBD] to-[#053F5C]"}`}>
                      {getInitials(user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-base ${textColor} truncate`}>{user.name}</p>
                      <p className={`text-xs ${subTextColor} truncate`}>{user.email || "user@example.com"}</p>
                      <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full ${theme === "dark" ? "bg-[#429EBD]/20 text-[#429EBD]" : "bg-[#429EBD]/20 text-[#429EBD]"} text-xs font-medium`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${theme === "dark" ? "bg-emerald-400" : "bg-emerald-500"} animate-pulse`} />
                        {getRoleLabel()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsSettingsOpen(false)}
                    className={`shrink-0 p-1.5 rounded-lg ${theme === "dark" ? "bg-slate-800/80 hover:bg-slate-700/80" : "bg-slate-200/80 hover:bg-slate-300/80"} transition-colors ${textColor}`}
                    aria-label="Close settings"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Settings Content */}
              <div className="p-2 space-y-1">
                {/* Profile Settings */}
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    navigate("/profile");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${theme === "dark" ? "text-white hover:bg-white/10" : "text-slate-900 hover:bg-slate-100"} transition-all group`}
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className={language === "ar" ? "text-right" : "text-left"} style={{ flex: 1 }}>
                    <p className={`font-medium text-sm ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{language === "ar" ? "الملف الشخصي" : "Profile Settings"}</p>
                    <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{language === "ar" ? "إدارة معلوماتك الشخصية" : "Manage your personal info"}</p>
                  </div>
                </button>

                {/* Divider */}
                <div className={`my-2 border-t ${theme === "dark" ? "border-white/10" : "border-slate-200"}`} />

                {/* System Settings Header */}
                <p className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {language === "ar" ? "إعدادات النظام" : "System Settings"}
                </p>

                {/* Language Toggle */}
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-slate-100"} transition-all`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                      </svg>
                    </div>
                    <div className={language === "ar" ? "text-right" : "text-left"}>
                      <p className={`font-medium text-sm ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{language === "ar" ? "اللغة" : "Language"}</p>
                      <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{language === "ar" ? "العربية" : "English"}</p>
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
                <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-slate-100"} transition-all`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${theme === "dark" ? "bg-amber-500/20" : "bg-slate-500/20"}`}>
                      {theme === "dark" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2">
                          <circle cx="12" cy="12" r="5" />
                          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                      )}
                    </div>
                    <div className={language === "ar" ? "text-right" : "text-left"}>
                      <p className={`font-medium text-sm ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{language === "ar" ? "المظهر" : "Appearance"}</p>
                      <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>
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

                <button
                  onClick={() => setShowNotificationSettings(!showNotificationSettings)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-slate-100"} transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-500/20 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                      </svg>
                    </div>
                    <div className={language === "ar" ? "text-right" : "text-left"}>
                      <p className={`font-medium text-sm ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{language === "ar" ? "الإشعارات" : "Notifications"}</p>
                      <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{language === "ar" ? "إدارة التنبيهات" : "Manage alerts"}</p>
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
                  <div className={`mx-4 mb-2 p-3 rounded-xl ${theme === "dark" ? "bg-white/5" : "bg-slate-100"} space-y-2`}>
                    {[
                      { key: "email", label: language === "ar" ? "إشعارات البريد" : "Email Notifications" },
                      { key: "push", label: language === "ar" ? "الإشعارات الفورية" : "Push Notifications" },
                      { key: "sms", label: language === "ar" ? "رسائل SMS" : "SMS Alerts" },
                      { key: "alerts", label: language === "ar" ? "تنبيهات النظام" : "System Alerts" },
                      { key: "reports", label: language === "ar" ? "التقارير اليومية" : "Daily Reports" },
                    ].map(item => (
                      <div key={item.key} className="flex items-center justify-between py-1">
                        <span className={`text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-700"}`}>{item.label}</span>
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
                <div className={`my-2 border-t ${theme === "dark" ? "border-white/10" : "border-slate-200"}`} />

                {/* System Settings Link */}
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    navigate("/settings/system");
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${theme === "dark" ? "text-white hover:bg-white/10" : "text-slate-900 hover:bg-slate-100"} transition-all group`}
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-500/20 flex items-center justify-center group-hover:bg-slate-500/30 transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                  </div>
                  <div className={language === "ar" ? "text-right" : "text-left"} style={{ flex: 1 }}>
                    <p className={`font-medium text-sm ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{language === "ar" ? "إعدادات النظام" : "System Settings"}</p>
                    <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}>{language === "ar" ? "التكامل والإعدادات المتقدمة" : "Integration & advanced settings"}</p>
                  </div>
                </button>
              </div>

              {/* Logout Button */}
              <div className={`p-2 border-t ${theme === "dark" ? "border-white/10 bg-red-500/5" : "border-slate-200 bg-red-50"}`} style={{ marginTop: 'auto' }}>
                <button
                  onClick={() => {
                    setIsSettingsOpen(false);
                    onLogout();
                  }}
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
          </>
        )
      }

      {/* Bottom Navigation - يظهر فقط في الصفحات الرئيسية */}
      {!isDetailPage && (
        <nav className={`fixed bottom-0 left-0 right-0 ${cardBgClass} border-t ${borderClass} z-30 shadow-xl backdrop-blur-xl`} style={{
          paddingBottom: `max(0.5rem, env(safe-area-inset-bottom))`,
          paddingTop: '0.5rem',
          paddingLeft: `max(0.75rem, env(safe-area-inset-left))`,
          paddingRight: `max(0.75rem, env(safe-area-inset-right))`
        }}>
          <div className="flex items-center justify-around px-1">
            {menuItems.filter(item => item.isBottomNav).map((item, index) => {
              const isActive = location.pathname === item.path;
              let accentColor = "";

              if (isActive) {
                accentColor = theme === "dark" ? "text-emerald-400" : "text-[#429EBD]";
              }

              return (
                <button
                  key={index}
                  onClick={() => navigate(item.path)}
                  className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 flex-1 ${isActive
                    ? `${accentColor}`
                    : `${subTextColor}`
                    } active:scale-95`}
                >
                  {/* أيقونة */}
                  <div className={`relative ${isActive ? "scale-105" : ""} transition-transform duration-200`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={isActive ? 2.5 : 1.8}>
                      {item.icon === 'home' && <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />}
                      {item.icon === 'reports' && <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
                      {item.icon === 'rfid' && <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />}
                      {item.icon === 'users' && <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />}
                      {!['home', 'reports', 'rfid', 'users'].includes(item.icon) && <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />}
                    </svg>
                  </div>
                  {/* نص */}
                  <span className={`text-[10px] font-semibold leading-tight ${isActive ? "opacity-100" : "opacity-60"}`}>
                    {t(item.label) || item.label}
                  </span>
                  {/* مؤشر نشط */}
                  {isActive && (
                    <span className={`absolute -bottom-0.5 h-0.5 w-8 rounded-full ${theme === "dark" ? "bg-emerald-400" : "bg-[#429EBD]"}`} />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

    </div >
  );
}

export default MobileLayout;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { SunIcon, MoonIcon } from "../components/shared/Icons.jsx";
import Logo from "../components/shared/Logo.jsx";
import { login } from "../utils/api/auth.js";
import { useDevice } from "../hooks/useDevice.js";
import { initStatusBar } from "../utils/capacitor.js";
import { API_CONFIG, POSSIBLE_IPS, testConnection, findWorkingIP } from "../config/api.config.js";

function LoginPage({ onLogin, onBack }) {
  const { theme, toggleTheme } = useTheme();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const { isMobile, isNative: isNativeDevice } = useDevice();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showIPSettings, setShowIPSettings] = useState(false);
  const [customIP, setCustomIP] = useState("");
  const [isTestingIP, setIsTestingIP] = useState(false);
  const [currentIP, setCurrentIP] = useState("");
  //hello
  // Initialize StatusBar for mobile
  useEffect(() => {
    if (isNativeDevice) {
      initStatusBar(theme);
    }
  }, [theme, isNativeDevice]);

  // Get current IP on mount
  useEffect(() => {
    if (isNativeDevice) {
      const savedIP = localStorage.getItem('backend_ip') || POSSIBLE_IPS[0];
      const baseURL = API_CONFIG.baseURL.replace('http://', '').replace(':8000', '');
      setCurrentIP(savedIP || baseURL);
    }
  }, [isNativeDevice]);

  // Handle IP change
  const handleIPChange = async (newIP) => {
    if (!newIP || !newIP.trim()) {
      setError("يرجى إدخال عنوان IP صحيح");
      return;
    }

    setIsTestingIP(true);
    setError("");

    try {
      const isValid = await testConnection(newIP.trim());
      if (isValid) {
        localStorage.setItem('backend_ip', newIP.trim());
        setCurrentIP(newIP.trim());
        setCustomIP("");
        setShowIPSettings(false);
        setError("");
        // Reload page to apply new IP
        window.location.reload();
      } else {
        setError(`لا يمكن الاتصال بـ ${newIP.trim()}:8000. تأكد من أن Backend يعمل`);
      }
    } catch (err) {
      setError(`خطأ في الاتصال: ${err.message}`);
    } finally {
      setIsTestingIP(false);
    }
  };

  // Auto-detect working IP
  const handleAutoDetect = async () => {
    setIsTestingIP(true);
    setError("جاري البحث عن IP صحيح...");

    try {
      const workingIP = await findWorkingIP();
      if (workingIP) {
        setCurrentIP(workingIP);
        setCustomIP("");
        setShowIPSettings(false);
        setError("");
        // Reload page to apply new IP
        window.location.reload();
      } else {
        setError("لم يتم العثور على IP صحيح. تأكد من أن Backend يعمل وأنك على نفس الشبكة");
      }
    } catch (err) {
      setError(`خطأ في البحث: ${err.message}`);
    } finally {
      setIsTestingIP(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Login form submitted");

    if (!username || !password) {
      setError(t("pleaseEnterCredentials") || "يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    console.log("Starting login process...");
    setError("");
    setIsLoading(true);

    try {
      console.log("Calling login API...");
      const response = await login(username, password);
      console.log("Login API response received:", response);

      // Map role to display format
      const roleMap = {
        "ADMIN": "ADMIN",
        "WAREHOUSE_MANAGER": "WAREHOUSE_MANAGER",
        "PRODUCTION_MANAGER": "PRODUCTION_MANAGER",
        "SALES_MANAGER": "SALES_MANAGER",
        "DISTRIBUTION_MANAGER": "DISTRIBUTION_MANAGER",
        "BRANCH_MANAGER": "BRANCH_MANAGER",
        "SUPERMARKET_MANAGER": "SUPERMARKET_MANAGER",
        "DRIVER": "DRIVER",
        "BRANCH_OPERATOR": "BRANCH_OPERATOR",
        "SUPERMARKET_OPERATOR": "SUPERMARKET_OPERATOR",
        "WAREHOUSE_OPERATOR": "WAREHOUSE_OPERATOR",
      };

      // Store full user object with all fields
      const fullUserData = {
        id: response.user.id,
        full_name: response.user.full_name || response.user.name,
        name: response.user.full_name || response.user.name,
        role: roleMap[response.user.role] || response.user.role,
        email: response.user.email,
        organization_id: response.user.organization_id,
        organizationId: response.user.organization_id, // Keep for backward compatibility
        account_type: response.user.account_type,
        department: response.user.department,
        job_title: response.user.job_title,
        is_distributor: response.user.is_distributor,
        branch_id: response.user.branch_id,
        branch_name: response.user.branch_name,
      };

      // Save full user data to localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('user', JSON.stringify(fullUserData));
      }

      const user = {
        id: fullUserData.id,
        name: fullUserData.name,
        role: fullUserData.role,
        email: fullUserData.email,
        organizationId: fullUserData.organization_id,
        organization_id: fullUserData.organization_id,
        account_type: fullUserData.account_type,
        department: fullUserData.department,
        job_title: fullUserData.job_title,
        is_distributor: fullUserData.is_distributor,
        branch_id: fullUserData.branch_id,
        branch_name: fullUserData.branch_name,
        facility_id: fullUserData.facility_id,
        facility_name: fullUserData.facility_name,
      };

      console.log("Login successful, user:", user);

      // Update user state first
      if (onLogin) {
        console.log("Calling onLogin callback");
        onLogin(user);
      }

      setIsLoading(false);

      // Navigate using React Router (no page reload)
      setTimeout(() => {
        console.log("Navigating to dashboard");
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (err) {
      console.error("Login error:", err);
      console.error("Error details:", {
        message: err.message,
        stack: err.stack,
        name: err.name
      });

      // Show user-friendly error message
      let errorMessage = "اسم المستخدم أو كلمة المرور غير صحيحة";
      if (err.message.includes("Failed to fetch") || err.message.includes("ERR_FAILED") || err.message.includes("لا يمكن الاتصال")) {
        const currentIP = localStorage.getItem('backend_ip') || POSSIBLE_IPS[0];
        errorMessage = `لا يمكن الاتصال بالخادم. تأكد من أن Backend يعمل على http://${currentIP}:8000`;
        // Show IP settings for mobile apps
        if (isNativeDevice) {
          setShowIPSettings(true);
        }
      } else if (err.message.includes("timeout") || err.message.includes("انتهت مهلة")) {
        errorMessage = "انتهت مهلة الاتصال. حاول مرة أخرى";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  // ألوان ديناميكية حسب الوضع - ألوان ناعمة ومنسقة للوضع الفاتح
  const bgClass = theme === "dark"
    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    : "bg-gradient-to-br from-[#E6F7FB] via-[#F0FAFC] to-[#E6F7FB]";
  const headerBgClass = theme === "dark"
    ? "border-white/5 backdrop-blur-sm bg-slate-900/30"
    : "border-slate-800/50 backdrop-blur-sm bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 shadow-md";
  const textClass = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextClass = theme === "dark" ? "text-slate-300" : "text-[#429EBD]";
  const subSubTextClass = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const cardBgClass = theme === "dark"
    ? "bg-slate-900/80 backdrop-blur-xl border-white/10"
    : "bg-gradient-to-br from-[#F0FAFC]/95 to-[#E6F7FB]/90 backdrop-blur-xl border-[#9FE7F5]/40 shadow-lg";
  const inputBgClass = theme === "dark"
    ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500"
    : "bg-[#9FE7F5]/30 border-[#429EBD]/40 text-[#053F5C] font-semibold placeholder:text-[#429EBD]/60";
  const labelClass = theme === "dark" ? "text-slate-200" : "text-[#053F5C]";
  const borderDividerClass = theme === "dark" ? "border-slate-700/50" : "border-[#9FE7F5]/40";
  const badgeBgClass = theme === "dark"
    ? "bg-white/5 border-white/10"
    : "bg-[#9FE7F5]/40 border-[#429EBD]/40 shadow-sm";
  const infoCardBgClass = theme === "dark"
    ? "bg-white/5 border-white/10"
    : "bg-gradient-to-br from-[#9FE7F5]/30 to-[#E0F7FA]/20 border-[#429EBD]/30 shadow-sm";

  // Mobile-optimized layout - Beautiful and Modern
  if (isMobile || isNativeDevice) {
    return (
      <div
        dir={language === "ar" ? "rtl" : "ltr"}
        className={`min-h-dvh flex items-center justify-center p-4 sm:p-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] ${bgClass} relative overflow-hidden transition-colors duration-300`}
      >
        {/* Safe Area Top Cover - Status Bar Area */}
        {isNativeDevice && (
          <div
            className="absolute top-0 left-0 right-0 z-50"
            style={{
              height: 'env(safe-area-inset-top)',
              minHeight: 'env(safe-area-inset-top)',
              backgroundColor: theme === "dark" ? '#0f172a' : '#ffffff'
            }}
          />
        )}

        {/* Background Effects - Subtle for mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className={`absolute top-0 right-0 w-64 h-64 ${theme === "dark" ? "bg-emerald-500/5" : "bg-[#429EBD]/5"} rounded-full blur-3xl`} />
          <div className={`absolute bottom-0 left-0 w-56 h-56 ${theme === "dark" ? "bg-amber-500/5" : "bg-[#F7AD19]/5"} rounded-full blur-3xl`} />
        </div>

        <div className={`${cardBgClass} rounded-2xl sm:rounded-3xl border-2 ${theme === "dark" ? "border-white/10" : "border-[#429EBD]/20"} p-5 sm:p-6 w-full max-w-sm mx-auto relative z-10 shadow-2xl`}>
          {/* Logo and Title */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-emerald-500/10" : "bg-[#429EBD]/10"}`}>
                <Logo />
              </div>
            </div>
            <h1 className={`text-2xl font-extrabold ${textClass} mb-1.5`}>
              {t("loginTitle") || "تسجيل الدخول"}
            </h1>
            <p className={`text-xs ${subTextClass} font-medium`}>
              {t("loginDescription") || "سجل دخولك للوصول إلى النظام"}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl animate-slide-in">
              <p className="text-red-500 text-xs text-center font-semibold">{error}</p>
            </div>
          )}

          {/* IP Settings for Mobile */}
          {isNativeDevice && (
            <div className="mb-4">
              <button
                type="button"
                onClick={() => setShowIPSettings(!showIPSettings)}
                className={`w-full text-xs ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"} hover:underline mb-2`}
              >
                {showIPSettings ? "إخفاء إعدادات الاتصال" : "إعدادات الاتصال"}
              </button>

              {showIPSettings && (
                <div className={`p-3 rounded-xl border ${theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-[#9FE7F5]/20 border-[#429EBD]/30"}`}>
                  <p className={`text-xs ${theme === "dark" ? "text-slate-300" : "text-[#053F5C]"} mb-2 font-semibold`}>
                    IP الحالي: {currentIP}
                  </p>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={customIP}
                      onChange={(e) => setCustomIP(e.target.value)}
                      placeholder="أدخل IP جديد"
                      className={`flex-1 px-3 py-2 rounded-lg text-xs ${inputBgClass} focus:outline-none focus:ring-1 focus:ring-[#429EBD]`}
                    />
                    <button
                      type="button"
                      onClick={() => handleIPChange(customIP)}
                      disabled={isTestingIP || !customIP.trim()}
                      className="px-3 py-2 bg-[#429EBD] text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                    >
                      {isTestingIP ? "..." : "تطبيق"}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoDetect}
                    disabled={isTestingIP}
                    className={`w-full px-3 py-2 rounded-lg text-xs font-semibold ${theme === "dark" ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-500/10 text-emerald-700"} disabled:opacity-50`}
                  >
                    {isTestingIP ? "جاري البحث..." : "البحث التلقائي عن IP"}
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={`block ${textClass} mb-2 text-xs font-bold uppercase tracking-wide`}>
                {t("username") || "اسم المستخدم"}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${inputBgClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]/50 focus:border-[#429EBD] text-base font-medium`}
                placeholder={t("username") || "أدخل اسم المستخدم"}
                required
                disabled={isLoading}
                autoComplete="username"
                inputMode="text"
              />
            </div>

            <div>
              <label className={`block ${textClass} mb-2 text-xs font-bold uppercase tracking-wide`}>
                {t("password") || "كلمة المرور"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all duration-200 ${inputBgClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]/50 focus:border-[#429EBD] text-base font-medium`}
                placeholder={t("password") || "أدخل كلمة المرور"}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full px-6 py-4 rounded-xl font-bold text-base transition-all duration-200 bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 text-slate-950 shadow-xl hover:shadow-2xl active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] touch-manipulation`}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  <span className="font-semibold">{t("verifying") || "جاري تسجيل الدخول..."}</span>
                </span>
              ) : (
                <span className="font-bold">{t("enterDashboard") || "تسجيل الدخول"}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div
      dir={language === "ar" ? "rtl" : "ltr"}
      className={`min-h-screen relative overflow-hidden ${bgClass} transition-colors duration-300`}
    >
      {/* خلفية متحركة مع تأثيرات */}
      <div className="absolute inset-0 overflow-hidden">
        {/* دوائر متوهجة متحركة */}
        <div className={`absolute top-0 right-0 w-96 h-96 ${theme === "dark" ? "bg-emerald-500/20" : "bg-[#429EBD]/8"} rounded-full blur-3xl animate-float`} />
        <div className={`absolute bottom-0 left-0 w-80 h-80 ${theme === "dark" ? "bg-amber-500/20" : "bg-[#F7AD19]/8"} rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] ${theme === "dark" ? "bg-emerald-400/10" : "bg-[#9FE7F5]/6"} rounded-full blur-3xl animate-pulse-glow`} />

        {/* خطوط متوهجة */}
        <div className={`absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent ${theme === "dark" ? "via-emerald-400/50" : "via-[#429EBD]/25"} to-transparent animate-pulse`} />
        <div className={`absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-transparent ${theme === "dark" ? "via-amber-400/50" : "via-[#F7AD19]/25"} to-transparent animate-pulse`} />
      </div>

      {/* شريط علوي احترافي */}
      <header className={`relative z-20 flex items-center justify-between px-6 py-5 border-b ${headerBgClass} transition-colors duration-300`}>
        <div className="flex items-center gap-3">
          <Logo />
          <div>
            <p className={`text-xs uppercase tracking-wider ${theme === "dark" ? subSubTextClass : "text-white"} font-bold leading-tight`}>
              HSA GROUP
            </p>
            <p className={`text-xs ${theme === "dark" ? subTextClass : "text-white/90"} font-semibold mt-0.5 leading-relaxed`}>
              {t("platformTitle")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* زر الرجوع */}
          {onBack && (
            <button
              onClick={onBack}
              className={`px-4 py-2 rounded-lg ${theme === "dark" ? "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800 hover:border-slate-600" : "bg-slate-700/50 border-slate-600/50 text-white hover:bg-slate-700 hover:border-slate-500 shadow-sm"} border text-sm font-semibold transition-all duration-200`}
            >
              {t("back")}
            </button>
          )}
          {/* زر تبديل الوضع */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-lg ${theme === "dark" ? "bg-slate-800/50 border-slate-700/50" : "bg-slate-700/50 border-slate-600/50 shadow-sm"} border hover:opacity-80 transition-all duration-200`}
            title={theme === "dark" ? t("switchToLight") : t("switchToDark")}
          >
            {theme === "dark" ? (
              <SunIcon className="w-5 h-5" />
            ) : (
              <MoonIcon className="w-5 h-5" />
            )}
          </button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${theme === "dark" ? badgeBgClass : "bg-slate-700/50 border-slate-600/50"} border`}>
            <span className={`h-2 w-2 rounded-full ${theme === "dark" ? "bg-emerald-400" : "bg-emerald-400"} animate-pulse`} />
            <span className={`text-[11px] ${theme === "dark" ? subTextClass : "text-white"} font-medium`}>{t("trialVersion")}</span>
          </div>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center animate-slide-in">
          {/* القسم الأيسر - معلومات النظام */}
          <section className="hidden lg:block space-y-6">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${theme === "dark" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-gradient-to-r from-[#9FE7F5]/40 to-[#E0F7FA]/30 border-[#429EBD]/40 shadow-sm"} border backdrop-blur-sm`}>
              <span className={`h-2 w-2 rounded-full ${theme === "dark" ? "bg-emerald-400" : "bg-[#429EBD]"} animate-pulse`} />
              <span className={`text-xs ${theme === "dark" ? "text-emerald-300" : "text-[#053F5C]"} font-bold`}>
                {language === "ar" ? "منصة مركزية لإدارة المخزون والهدر" : "Central platform for inventory and waste management"}
              </span>
            </div>

            <h1 className={`text-4xl font-bold leading-tight ${theme === "dark" ? textClass : "text-[#053F5C]"} tracking-tight`}>
              {language === "ar" ? "admin" : "Dashboard"}{" "}
              <span className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 bg-clip-text text-transparent font-extrabold">
                {t("modernInteractive")}
              </span>{" "}
              {language === "ar" ? "لمتابعة الهدر الغذائي" : "for food waste monitoring"}
            </h1>

            <p className={`text-base ${theme === "dark" ? subTextClass : "text-[#053F5C]"} leading-relaxed max-w-lg font-semibold`}>
              {language === "ar"
                ? "راقب مستويات المخزون، تواريخ الصلاحية، والفاقد في المصانع والمخازن، مع تنبيهات مبكرة ولوحات مؤشرات مخصصة للإدارة العليا."
                : "Monitor inventory levels, expiry dates, and waste in factories and warehouses, with early alerts and custom dashboards for senior management."}
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${infoCardBgClass} border backdrop-blur-sm`}>
                <div className={`h-2 w-2 rounded-full ${theme === "dark" ? "bg-emerald-400" : "bg-[#429EBD]"} animate-pulse`} />
                <span className={`text-xs ${theme === "dark" ? subTextClass : "text-[#053F5C]"} font-bold`}>
                  {language === "ar" ? "الوقت الفعلي" : "Real-time data"}
                </span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${infoCardBgClass} border backdrop-blur-sm`}>
                <div className={`h-2 w-2 rounded-full ${theme === "dark" ? "bg-amber-400" : "bg-[#F7AD19]"} animate-pulse`} />
                <span className={`text-xs ${theme === "dark" ? subTextClass : "text-[#053F5C]"} font-bold`}>
                  {language === "ar" ? "تكامل مع أنظمة الشركة" : "Company systems integration"}
                </span>
              </div>
            </div>
          </section>

          {/* القسم الأيمن - نموذج تسجيل الدخول */}
          <section className="relative w-full max-w-md mx-auto">
            {/* تأثير توهج خلف البطاقة */}
            <div className={`absolute -inset-1 bg-gradient-to-br ${theme === "dark" ? "from-emerald-400/50 via-amber-400/50 to-emerald-600/50" : "from-[#429EBD]/30 via-[#F7AD19]/30 to-[#429EBD]/30"} rounded-2xl blur-xl ${theme === "dark" ? "opacity-60" : "opacity-40"} animate-pulse-glow`} />

            {/* البطاقة الرئيسية */}
            <div className={`relative rounded-2xl ${cardBgClass} border shadow-2xl p-8 transition-colors duration-300`}>
              <div className="mb-8">
                <h2 className={`text-2xl font-bold ${theme === "dark" ? textClass : "text-[#053F5C]"} mb-2 leading-tight`}>
                  {t("loginTitle")}
                </h2>
                <p className={`text-sm ${theme === "dark" ? subSubTextClass : "text-[#053F5C]"} leading-relaxed font-semibold`}>
                  {t("loginDescription")}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label className={`block text-xs font-bold ${theme === "dark" ? labelClass : "text-[#053F5C]"} uppercase tracking-wide mb-1.5`}>
                    {t("username")}
                  </label>
                  <input
                    type="text"
                    className={`w-full px-4 py-3.5 rounded-lg ${inputBgClass} focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-200 text-base`}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="example@hsa-group.com"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className={`block text-xs font-bold ${theme === "dark" ? labelClass : "text-[#053F5C]"} uppercase tracking-wide mb-1.5`}>
                    {t("password")}
                  </label>
                  <input
                    type="password"
                    className={`w-full px-4 py-3.5 rounded-lg ${inputBgClass} focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all duration-200 text-base`}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                  />
                </div>

                {error && (
                  <div className={`px-4 py-3 rounded-lg ${theme === "dark" ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-red-50 border-red-200 text-red-700"} border text-sm animate-slide-in leading-relaxed`}>
                    {error}
                  </div>
                )}

                {/* IP Settings for Mobile (Desktop view) */}
                {isNativeDevice && (
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setShowIPSettings(!showIPSettings)}
                      className={`w-full text-xs ${theme === "dark" ? "text-slate-400" : "text-[#429EBD]"} hover:underline text-left`}
                    >
                      {showIPSettings ? "إخفاء إعدادات الاتصال" : "إعدادات الاتصال"}
                    </button>

                    {showIPSettings && (
                      <div className={`p-4 rounded-lg border ${theme === "dark" ? "bg-slate-800/50 border-slate-700" : "bg-[#9FE7F5]/20 border-[#429EBD]/30"}`}>
                        <p className={`text-xs ${theme === "dark" ? "text-slate-300" : "text-[#053F5C]"} mb-3 font-semibold`}>
                          IP الحالي: {currentIP}
                        </p>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={customIP}
                            onChange={(e) => setCustomIP(e.target.value)}
                            placeholder="أدخل IP جديد (مثال: 192.168.1.100)"
                            className={`flex-1 px-3 py-2 rounded-lg text-sm ${inputBgClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]`}
                          />
                          <button
                            type="button"
                            onClick={() => handleIPChange(customIP)}
                            disabled={isTestingIP || !customIP.trim()}
                            className="px-4 py-2 bg-[#429EBD] text-white rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-[#053F5C] transition-colors"
                          >
                            {isTestingIP ? "..." : "تطبيق"}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={handleAutoDetect}
                          disabled={isTestingIP}
                          className={`w-full px-3 py-2 rounded-lg text-sm font-semibold ${theme === "dark" ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30" : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20"} disabled:opacity-50 transition-colors`}
                        >
                          {isTestingIP ? "جاري البحث..." : "🔍 البحث التلقائي عن IP"}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative overflow-hidden px-6 py-3.5 rounded-lg bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 text-slate-950 font-semibold text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      {t("verifying") || "جاري التحقق..."}
                    </span>
                  ) : (
                    t("enterDashboard") || "دخول إلى لوحة التحكم"
                  )}
                </button>

                <div className={`pt-4 border-t ${borderDividerClass}`}>
                  <div className={`flex items-center justify-between text-xs ${theme === "dark" ? subSubTextClass : "text-[#053F5C]"} font-semibold`}>
                    <span>{t("forgotPassword")}</span>
                    <span className={`${theme === "dark" ? "text-emerald-400 hover:text-emerald-300" : "text-[#429EBD] hover:text-[#053F5C] font-bold"} cursor-pointer transition-colors`}>
                      {t("itSupport")}
                    </span>
                  </div>
                </div>
              </form>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;

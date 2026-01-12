import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { login } from "../../utils/api/auth.js";
import Logo from "../../components/shared/Logo.jsx";
import { isNative, initStatusBar } from "../../utils/capacitor.js";

function DriverLogin() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  // Initialize StatusBar for mobile
  useEffect(() => {
    if (isNative()) {
      initStatusBar(theme);
    }
  }, [theme]);
  const [username, setUserءname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const bgClass = theme === "dark"
    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    : "bg-gradient-to-br from-[#E6F7FB] via-[#F0FAFC] to-[#E6F7FB]";
  const cardBgClass = theme === "dark"
    ? "bg-slate-900/90 backdrop-blur-xl border-white/10 shadow-2xl"
    : "bg-white/95 backdrop-blur-xl border-[#9FE7F5]/50 shadow-2xl";
  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const inputBgClass = theme === "dark"
    ? "bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-500 focus:border-[#429EBD]"
    : "bg-slate-50 border-slate-300 text-[#053F5C] placeholder:text-slate-400 focus:border-[#429EBD]";
  const buttonClass = theme === "dark"
    ? "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white disabled:bg-slate-600 disabled:text-slate-400"
    : "bg-[#429EBD] hover:bg-[#2E7A94] active:bg-[#1E5A6F] text-white disabled:bg-slate-300 disabled:text-slate-500";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const response = await login(username, password);
      
      // Check if user is a driver
      if (response.user.role !== "DRIVER" && response.user.role !== "ADMIN") {
        setError("هذا الحساب ليس حساب سائق");
        setIsLoading(false);
        return;
      }

      // Navigate to driver dashboard
      navigate("/driver/dashboard");
    } catch (err) {
      setError(err.message || "اسم المستخدم أو كلمة المرور غير صحيحة");
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-dvh flex items-center justify-center p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] ${bgClass} relative overflow-hidden`} dir="rtl">
      {/* Safe Area Top Cover - Status Bar Area with black color */}
      <div className="absolute top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-black z-50" style={{ minHeight: 'env(safe-area-inset-top)' }} />
      
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-0 right-0 w-96 h-96 ${theme === "dark" ? "bg-emerald-500/10" : "bg-[#429EBD]/8"} rounded-full blur-3xl animate-float`} />
        <div className={`absolute bottom-0 left-0 w-80 h-80 ${theme === "dark" ? "bg-amber-500/10" : "bg-[#F7AD19]/8"} rounded-full blur-3xl animate-[float_8s_ease-in-out_infinite]`} />
      </div>

      <div className={`${cardBgClass} rounded-2xl border p-5 sm:p-6 md:p-8 w-full max-w-md mx-4 relative z-10 animate-fade-in`}>
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <h1 className={`text-2xl sm:text-3xl font-bold ${textColor} mb-2`}>
            تطبيق السائقين
          </h1>
          <p className={`text-sm sm:text-base ${subTextColor}`}>
            تسجيل الدخول لتتبع الشحنات
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg animate-slide-in">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={`block ${textColor} mb-2 text-sm font-semibold`}>
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-200 ${inputBgClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]/50 focus:shadow-lg text-base`}
              placeholder="أدخل اسم المستخدم"
              required
              disabled={isLoading}
              autoComplete="username"
              inputMode="text"
            />
          </div>

          <div>
            <label className={`block ${textColor} mb-2 text-sm font-semibold`}>
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3.5 rounded-xl border transition-all duration-200 ${inputBgClass} focus:outline-none focus:ring-2 focus:ring-[#429EBD]/50 focus:shadow-lg text-base`}
              placeholder="أدخل كلمة المرور"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-6 py-4 rounded-xl font-semibold text-base transition-all duration-200 ${buttonClass} shadow-lg hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:shadow-none min-h-[48px] touch-manipulation`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري تسجيل الدخول...
              </span>
            ) : (
              "تسجيل الدخول"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default DriverLogin;



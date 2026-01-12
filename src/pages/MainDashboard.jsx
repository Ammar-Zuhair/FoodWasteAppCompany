import { useEffect, useState } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import CommonAlerts from "../components/dashboard/CommonAlerts.jsx";
import AdminCards from "../components/dashboard/AdminCards.jsx";
import ImportantDataCards from "../components/dashboard/ImportantDataCards.jsx";

function MainDashboard({ user }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Listen for pull-to-refresh event
  useEffect(() => {
    const handleRefresh = () => {
      setRefreshKey(prev => prev + 1);
    };
    window.addEventListener('refreshPageData', handleRefresh);
    return () => window.removeEventListener('refreshPageData', handleRefresh);
  }, []);

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";

  return (
    <div className={`space-y-4 sm:space-y-5 md:space-y-6 ${isLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-500`} dir={language === "ar" ? "rtl" : "ltr"}>
      {/* عنوان الصفحة */}
      <div className="mb-4 sm:mb-5 md:mb-8 animate-slide-in">
        <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold ${textColor} mb-2 sm:mb-2.5 md:mb-3 leading-tight tracking-tight`}>
          {t("mainDashboard")}
        </h2>
        <p className={`text-sm sm:text-base md:text-lg ${subTextColor} leading-relaxed font-medium`}>
          {t("dashboardOverview")}
        </p>
      </div>

      {/* التنبيهات */}
      <CommonAlerts key={`alerts-${refreshKey}`} />

      {/* كروت الإدارة (للمدير فقط - ليس للمستخدمين من نوع supermarket) */}
      {user.role === "admin" && user.account_type !== "supermarket" && (
        <div className="animate-slide-in mt-4 sm:mt-5 md:mt-8" style={{ animationDelay: "0.3s" }}>
          <h3 className={`text-base sm:text-lg md:text-2xl font-semibold ${textColor} mb-3 sm:mb-4 md:mb-5 leading-tight`}>
            {t("systemOverview")}
          </h3>
          <AdminCards key={`admin-${refreshKey}`} />
        </div>
      )}

      {/* البيانات المهمة */}
      <div className="animate-slide-in mt-6 sm:mt-8 md:mt-10" style={{ animationDelay: "0.5s" }}>
        <h3 className={`text-base sm:text-lg md:text-2xl font-semibold ${textColor} mb-4 sm:mb-5 md:mb-6 leading-tight`}>
          {language === "ar" ? "البيانات المهمة" : "Important Data"}
        </h3>
        <ImportantDataCards key={`data-${refreshKey}`} user={user} />
      </div>

      {/* واجهة مخصصة للمستخدمين من نوع supermarket */}
      {user.account_type === "supermarket" && (
        <div className="animate-slide-in mt-4 sm:mt-5 md:mt-8" style={{ animationDelay: "0.3s" }}>
          <h3 className={`text-base sm:text-lg md:text-2xl font-semibold ${textColor} mb-3 sm:mb-4 md:mb-5 leading-tight`}>
            {language === "ar" ? "نظرة عامة على السوبر ماركت" : "Supermarket Overview"}
          </h3>
          <p className={`text-sm ${subTextColor} mb-4`}>
            {language === "ar"
              ? `عرض البيانات الخاصة بسوبر ماركت: ${user.supermarket_name || user.facility_name || user.facility_id || "غير محدد"}`
              : `Showing data for supermarket: ${user.supermarket_name || user.facility_name || user.facility_id || "Not specified"}`}
          </p>
        </div>
      )}
    </div>
  );
}

export default MainDashboard;

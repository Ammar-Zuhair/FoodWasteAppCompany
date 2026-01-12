import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

function StatusBadge({ status, size = "md" }) {
  const { theme } = useTheme();
  const { language } = useLanguage();

  // Get translated status label
  const getStatusLabel = (status) => {
    // Handle status as object (with code property) or string
    const statusStr = typeof status === 'object' ? (status?.code || status?.name_en || '') : (status || '');
    const statusLower = statusStr.toLowerCase();

    // Batch statuses
    if (statusLower === "in_storage") {
      return language === "ar" ? "في المخزن" : "In Storage";
    }
    if (statusLower === "in_transit") {
      return language === "ar" ? "في الطريق" : "In Transit";
    }
    if (statusLower === "sold_out" || statusLower === "sold") {
      return language === "ar" ? "تم البيع" : "Sold Out";
    }
    if (statusLower === "wasted" || statusLower === "expired") {
      return language === "ar" ? "مهدر" : "Wasted";
    }
    if (statusLower === "delivered") {
      return language === "ar" ? "تم التسليم" : "Delivered";
    }
    if (statusLower === "pending") {
      return language === "ar" ? "قيد الانتظار" : "Pending";
    }
    if (statusLower === "processing") {
      return language === "ar" ? "قيد المعالجة" : "Processing";
    }
    if (statusLower === "completed") {
      return language === "ar" ? "مكتمل" : "Completed";
    }
    if (statusLower === "cancelled") {
      return language === "ar" ? "ملغي" : "Cancelled";
    }
    if (statusLower === "active") {
      return language === "ar" ? "نشط" : "Active";
    }
    if (statusLower === "inactive") {
      return language === "ar" ? "غير نشط" : "Inactive";
    }

    // Vehicle statuses
    if (statusLower === "available") {
      return language === "ar" ? "متاح" : "Available";
    }
    if (statusLower === "maintenance") {
      return language === "ar" ? "صيانة" : "Maintenance";
    }
    if (statusLower === "low_fuel") {
      return language === "ar" ? "وقود منخفض" : "Low Fuel";
    }
    if (statusLower === "busy" || statusLower === "occupied") {
      return language === "ar" ? "مشغول" : "Busy";
    }
    if (statusLower === "out_of_service") {
      return language === "ar" ? "خارج الخدمة" : "Out of Service";
    }

    // Order statuses
    if (statusLower === "confirmed") {
      return language === "ar" ? "مؤكد" : "Confirmed";
    }
    if (statusLower === "shipped") {
      return language === "ar" ? "تم الشحن" : "Shipped";
    }

    // Alert/Priority statuses
    if (statusLower === "urgent") {
      return language === "ar" ? "عاجل" : "Urgent";
    }
    if (statusLower === "open") {
      return language === "ar" ? "مفتوح" : "Open";
    }
    if (statusLower === "closed" || statusLower === "resolved") {
      return language === "ar" ? "مغلق" : "Closed";
    }

    // Quality statuses
    if (statusLower === "passed") {
      return language === "ar" ? "ناجح" : "Passed";
    }
    if (statusLower === "failed") {
      return language === "ar" ? "فاشل" : "Failed";
    }
    if (statusLower === "approved") {
      return language === "ar" ? "موافق عليه" : "Approved";
    }
    if (statusLower === "rejected") {
      return language === "ar" ? "مرفوض" : "Rejected";
    }

    // Risk/Quality statuses
    if (statusLower.includes("خطر") || statusLower.includes("danger") || statusLower.includes("high") || statusLower.includes("critical")) {
      return language === "ar" ? "خطر عالي" : "High Risk";
    }
    if (statusLower.includes("تحذير") || statusLower.includes("warning") || statusLower.includes("medium")) {
      return language === "ar" ? "تحذير" : "Warning";
    }
    if (statusLower.includes("منخفض") || statusLower.includes("low")) {
      return language === "ar" ? "منخفض" : "Low";
    }
    if (statusLower.includes("ممتاز") || statusLower.includes("excellent")) {
      return language === "ar" ? "ممتاز" : "Excellent";
    }
    if (statusLower.includes("جيد") || statusLower.includes("good") || statusLower.includes("normal")) {
      return language === "ar" ? "جيد" : "Good";
    }

    // Return original if no translation found
    return status;
  };

  const getStatusConfig = (status) => {
    // Handle status as object (with code property) or string
    const statusStr = typeof status === 'object' ? (status?.code || status?.name_en || '') : (status || '');
    const statusLower = statusStr.toLowerCase();

    // Red statuses
    if (statusLower === "wasted" || statusLower === "expired" || statusLower === "cancelled" ||
      statusLower === "failed" || statusLower === "rejected" || statusLower === "low_fuel" ||
      statusLower === "out_of_service" || statusLower === "urgent" ||
      statusLower.includes("خطر") || statusLower.includes("danger") || statusLower.includes("high") || statusLower.includes("critical")) {
      return {
        bg: theme === "dark" ? "bg-red-500/20" : "bg-red-50",
        text: theme === "dark" ? "text-red-400" : "text-red-700",
        border: theme === "dark" ? "border-red-500/30" : "border-red-200",
        dot: "bg-red-500",
      };
    }

    // Orange statuses
    if (statusLower === "maintenance") {
      return {
        bg: theme === "dark" ? "bg-orange-500/20" : "bg-orange-50",
        text: theme === "dark" ? "text-orange-400" : "text-orange-700",
        border: theme === "dark" ? "border-orange-500/30" : "border-orange-200",
        dot: "bg-orange-500",
      };
    }

    // Amber statuses
    if (statusLower === "in_transit" || statusLower === "pending" || statusLower === "processing" ||
      statusLower === "busy" || statusLower === "occupied" ||
      statusLower.includes("تحذير") || statusLower.includes("warning") || statusLower.includes("medium")) {
      return {
        bg: theme === "dark" ? "bg-amber-500/20" : "bg-amber-50",
        text: theme === "dark" ? "text-amber-400" : "text-amber-700",
        border: theme === "dark" ? "border-amber-500/30" : "border-amber-200",
        dot: "bg-amber-500",
      };
    }

    // Blue statuses
    if (statusLower === "sold_out" || statusLower === "sold" || statusLower === "delivered" ||
      statusLower === "completed" || statusLower === "shipped" || statusLower === "confirmed") {
      return {
        bg: theme === "dark" ? "bg-blue-500/20" : "bg-blue-50",
        text: theme === "dark" ? "text-blue-400" : "text-blue-700",
        border: theme === "dark" ? "border-blue-500/30" : "border-blue-200",
        dot: "bg-blue-500",
      };
    }

    // Green statuses
    if (statusLower === "in_storage" || statusLower === "active" || statusLower === "available" ||
      statusLower === "passed" || statusLower === "approved" || statusLower === "closed" || statusLower === "resolved" ||
      statusLower.includes("ممتاز") || statusLower.includes("excellent") ||
      statusLower.includes("جيد") || statusLower.includes("good") || statusLower.includes("normal")) {
      return {
        bg: theme === "dark" ? "bg-emerald-500/20" : "bg-emerald-50",
        text: theme === "dark" ? "text-emerald-400" : "text-emerald-700",
        border: theme === "dark" ? "border-emerald-500/30" : "border-emerald-200",
        dot: "bg-emerald-500",
      };
    }

    // Purple statuses
    if (statusLower === "open") {
      return {
        bg: theme === "dark" ? "bg-purple-500/20" : "bg-purple-50",
        text: theme === "dark" ? "text-purple-400" : "text-purple-700",
        border: theme === "dark" ? "border-purple-500/30" : "border-purple-200",
        dot: "bg-purple-500",
      };
    }

    // Default: gray
    return {
      bg: theme === "dark" ? "bg-slate-500/20" : "bg-slate-100",
      text: theme === "dark" ? "text-slate-300" : "text-slate-700",
      border: theme === "dark" ? "border-slate-500/30" : "border-slate-300",
      dot: "bg-slate-500",
    };
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };

  const config = getStatusConfig(status);
  const label = getStatusLabel(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} font-semibold whitespace-nowrap`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {label}
    </span>
  );
}

export default StatusBadge;

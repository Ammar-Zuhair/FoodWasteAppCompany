import { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";
import { getOrderDetails } from "../../utils/api/orders.js";

export default function OrderDetailsModal({ orderId, isOpen, onClose }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { theme } = useTheme();
  const { language, t } = useLanguage();

  useEffect(() => {
    if (isOpen && orderId) {
      loadOrderDetails();
    } else {
      // Reset state when modal closes
      setOrder(null);
      setLoading(true);
      setError(null);
    }
  }, [isOpen, orderId]);

  const loadOrderDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getOrderDetails(orderId);
      setOrder(data);
    } catch (err) {
      console.error('Error loading order details:', err);
      setError(err.message || (language === "ar" ? "حدث خطأ في تحميل تفاصيل الطلب" : "Error loading order details"));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const bgClass = theme === "dark" ? "bg-slate-900" : "bg-white";
  const textColor = theme === "dark" ? "text-white" : "text-gray-800";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-gray-600";
  const borderClass = theme === "dark" ? "border-slate-700" : "border-gray-200";
  const cardBgClass = theme === "dark" ? "bg-slate-800" : "bg-gray-50";

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '-';
    return new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US", {
      style: 'currency',
      currency: 'SAR',
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative ${bgClass} rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        <div className={`sticky top-0 ${bgClass} border-b ${borderClass} p-4 flex items-center justify-between z-10`}>
          <h2 className={`text-xl font-bold ${textColor}`}>
            {language === "ar" ? "تفاصيل الطلب" : "Order Details"}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-slate-800 text-slate-400 hover:text-white" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"}`}
            aria-label={language === "ar" ? "إغلاق" : "Close"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className={`ml-3 ${textColor}`}>
                {language === "ar" ? "جاري التحميل..." : "Loading..."}
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <p className={`${textColor} mb-4`}>{error}</p>
              <button
                onClick={loadOrderDetails}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {language === "ar" ? "إعادة المحاولة" : "Retry"}
              </button>
            </div>
          ) : order ? (
            <div className="space-y-4">
              {/* Order Info */}
              <div>
                <h3 className={`text-sm font-semibold ${subTextColor} mb-2 uppercase tracking-wide`}>
                  {language === "ar" ? "معلومات الطلب" : "Order Information"}
                </h3>
                <div className={`${cardBgClass} rounded-lg p-3 space-y-2`}>
                  <div className="flex justify-between items-center">
                    <span className={subTextColor}>{language === "ar" ? "رقم الطلب" : "Order ID"}:</span>
                    <span className={`${textColor} font-semibold`}>#{order.id || order.order_id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={subTextColor}>{language === "ar" ? "الحالة" : "Status"}:</span>
                    <span className={`${textColor} font-medium`}>
                      {order.status || (language === "ar" ? "غير محدد" : "Unknown")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={subTextColor}>{language === "ar" ? "تاريخ الإنشاء" : "Created Date"}:</span>
                    <span className={textColor}>{formatDate(order.created_at || order.order_date)}</span>
                  </div>
                  {order.requested_delivery_date && (
                    <div className="flex justify-between items-center">
                      <span className={subTextColor}>{language === "ar" ? "تاريخ التسليم المطلوب" : "Requested Delivery"}:</span>
                      <span className={textColor}>{formatDate(order.requested_delivery_date)}</span>
                    </div>
                  )}
                  {order.priority && (
                    <div className="flex justify-between items-center">
                      <span className={subTextColor}>{language === "ar" ? "الأولوية" : "Priority"}:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.priority === 'urgent' 
                          ? 'bg-red-500/20 text-red-500' 
                          : 'bg-blue-500/20 text-blue-500'
                      }`}>
                        {order.priority === 'urgent' 
                          ? (language === "ar" ? "عاجل" : "Urgent")
                          : (language === "ar" ? "عادي" : "Normal")
                        }
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items */}
              {order.items && order.items.length > 0 && (
                <div>
                  <h3 className={`text-sm font-semibold ${subTextColor} mb-2 uppercase tracking-wide`}>
                    {language === "ar" ? "المنتجات" : "Items"} ({order.items.length})
                  </h3>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className={`${cardBgClass} rounded-lg p-3`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <p className={`${textColor} font-semibold`}>
                              {item.product_name || item.name || `Item ${index + 1}`}
                            </p>
                            {item.product_id && (
                              <p className={`${subTextColor} text-xs mt-1`}>
                                ID: {item.product_id}
                              </p>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className={`${textColor} font-semibold`}>
                              {item.quantity || 0} {item.unit || ''}
                            </p>
                            {item.unit_price && (
                              <p className={`${subTextColor} text-xs mt-1`}>
                                {formatCurrency(item.unit_price)} / {item.unit || 'unit'}
                              </p>
                            )}
                          </div>
                        </div>
                        {item.unit_price && item.quantity && (
                          <div className={`pt-2 border-t ${borderClass} flex justify-between`}>
                            <span className={subTextColor}>{language === "ar" ? "المجموع" : "Total"}:</span>
                            <span className={`${textColor} font-semibold`}>
                              {formatCurrency(item.unit_price * item.quantity)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total */}
              {order.total_amount && (
                <div className={`${cardBgClass} rounded-lg p-4 border-2 ${theme === "dark" ? "border-blue-500/30" : "border-blue-500/20"}`}>
                  <div className="flex justify-between items-center">
                    <span className={`${textColor} font-bold text-lg`}>
                      {language === "ar" ? "المجموع الكلي" : "Total Amount"}
                    </span>
                    <span className={`${textColor} font-bold text-lg`}>
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>
              )}

              {/* Additional Info */}
              {(order.facility_name || order.branch_name || order.notes) && (
                <div>
                  <h3 className={`text-sm font-semibold ${subTextColor} mb-2 uppercase tracking-wide`}>
                    {language === "ar" ? "معلومات إضافية" : "Additional Information"}
                  </h3>
                  <div className={`${cardBgClass} rounded-lg p-3 space-y-2`}>
                    {order.facility_name && (
                      <div className="flex justify-between">
                        <span className={subTextColor}>{language === "ar" ? "المنشأة" : "Facility"}:</span>
                        <span className={textColor}>{order.facility_name}</span>
                      </div>
                    )}
                    {order.branch_name && (
                      <div className="flex justify-between">
                        <span className={subTextColor}>{language === "ar" ? "الفرع" : "Branch"}:</span>
                        <span className={textColor}>{order.branch_name}</span>
                      </div>
                    )}
                    {order.notes && (
                      <div>
                        <span className={subTextColor}>{language === "ar" ? "ملاحظات" : "Notes"}:</span>
                        <p className={`${textColor} mt-1`}>{order.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className={textColor}>{language === "ar" ? "لم يتم العثور على الطلب" : "Order not found"}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`border-t ${borderClass} p-4 flex gap-2`}>
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
              theme === "dark" 
                ? "bg-slate-800 text-white hover:bg-slate-700" 
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {language === "ar" ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}







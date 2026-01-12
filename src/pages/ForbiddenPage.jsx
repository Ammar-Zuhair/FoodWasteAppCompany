/**
 * ForbiddenPage - Standalone 403 Error Page
 * 
 * IMPORTANT: This page is completely standalone:
 * - No API calls
 * - No protected layout
 * - No components that might require authentication
 */

function ForbiddenPage() {
    return (
        <div
            className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
            dir="rtl"
        >
            <div className="text-center p-8 max-w-md">
                {/* Error Icon */}
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
                    <svg
                        className="w-12 h-12 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                    </svg>
                </div>

                {/* Error Code */}
                <h1 className="text-7xl font-bold text-red-500 mb-4">403</h1>

                {/* Error Title */}
                <h2 className="text-2xl font-semibold text-white mb-4">
                    غير مصرح لك بالوصول
                </h2>

                {/* Error Description */}
                <p className="text-slate-400 mb-8 leading-relaxed">
                    ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة.
                    <br />
                    إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع مدير النظام.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a
                        href="/dashboard"
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
                    >
                        العودة للرئيسية
                    </a>
                    <a
                        href="/"
                        className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-all duration-200"
                    >
                        تسجيل الخروج
                    </a>
                </div>

                {/* Security Notice */}
                <p className="text-xs text-slate-500 mt-8">
                    تم تسجيل محاولة الوصول هذه في سجلات النظام
                </p>
            </div>
        </div>
    );
}

export default ForbiddenPage;

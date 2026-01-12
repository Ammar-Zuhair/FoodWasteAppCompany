import { useState, useEffect, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { LanguageProvider } from "./contexts/LanguageContext.jsx";
import { getStoredUser, isAuthenticated, logout as authLogout } from "./utils/api/auth.js";
import { hasPermission } from "./utils/permissions.js";
import { useDevice } from "./hooks/useDevice.js";
import { isNative as isNativePlatform, initStatusBar } from "./utils/capacitor.js";
import { startNetworkWatcher, stopNetworkWatcher, autoDiscoverIP } from "./utils/networkIPDiscovery.js";
import LoginPage from "./pages/LoginPage.jsx";
import MobileLayout from "./layouts/MobileLayout.jsx";
import MainDashboard from "./pages/MainDashboard.jsx";
import SplashScreen from "./components/shared/SplashScreen.jsx";
import RefrigerationManagement from "./pages/RefrigerationManagement.jsx";
import AIDashboard from "./pages/AIDashboard.jsx";
import ProductionPlanning from "./pages/ProductionPlanning.jsx";
import BatchManagement from "./pages/BatchManagement.jsx";
import WasteAnalysis from "./pages/WasteAnalysis.jsx";
import ShipmentManagement from "./pages/ShipmentManagement.jsx";
import AlertCenter from "./pages/AlertCenter.jsx";
import Reports from "./pages/Reports.jsx";
import QualityManagement from "./pages/QualityManagement.jsx";
import DriverDashboard from "./pages/driver/DriverDashboard.jsx";
import Profile from "./pages/Profile.jsx";
import SystemSettings from "./pages/SystemSettings.jsx";
import AlertSettings from "./pages/AlertSettings.jsx";
import ThemeSettings from "./pages/ThemeSettings.jsx";
import Chatbot from "./pages/Chatbot.jsx";
import InventoryManagement from "./pages/InventoryManagement.jsx";
import FacilitiesManagement from "./pages/FacilitiesManagement.jsx";
import VehiclesManagement from "./pages/VehiclesManagement.jsx";
import SupermarketsManagement from "./pages/SupermarketsManagement.jsx";
import UserManagement from "./pages/UserManagement.jsx";
import CharityIntegration from "./pages/CharityIntegration.jsx";
import OrderManagement from "./pages/OrderManagement.jsx";
import DistributionManagement from "./pages/DistributionManagement.jsx";
import HeatMaps from "./pages/HeatMaps.jsx";
import RFIDTracking from "./pages/RFIDTracking.jsx";
import DigitalTwin from "./pages/DigitalTwin.jsx";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const { isMobile, isNative: isNativeDevice } = useDevice();

  useEffect(() => {
    if (isNativePlatform()) {
      initStatusBar('dark').catch(err => {
        console.warn('Failed to initialize status bar:', err);
      });

      // بدء اكتشاف IP تلقائياً عند بدء التطبيق (بعد تأخير بسيط)
      setTimeout(() => {
        autoDiscoverIP().then((ip) => {
          if (ip) {
            console.log(`[App] Auto-discovered IP: ${ip}`);
            // لا نحتاج لإعادة تحميل - API_CONFIG يتم تحديثه تلقائياً
          }
        });
      }, 1000);

      // بدء مراقبة تغييرات الشبكة
      startNetworkWatcher((newIP) => {
        console.log(`[App] Network changed, new IP: ${newIP}`);
        // API_CONFIG يتم تحديثه تلقائياً في networkIPDiscovery
        // يمكن إظهار إشعار للمستخدم إذا لزم الأمر
      });
    }

    // Cleanup عند إغلاق التطبيق
    return () => {
      if (isNativePlatform()) {
        stopNetworkWatcher();
      }
    };
  }, []);

  useEffect(() => {
    document.title = "HSA - تقليل الهدر الغذائي";
  }, []);

  const handleLogout = useCallback(() => {
    authLogout();
    setUser(null);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }, 100);
  }, []);

  useEffect(() => {
    if (isAuthenticated()) {
      const storedUser = getStoredUser();
      if (storedUser) {
        setUser({
          id: storedUser.id,
          name: storedUser.full_name || storedUser.name,
          role: storedUser.role ? storedUser.role.toUpperCase() : null,
          email: storedUser.email,
          organization_id: storedUser.organization_id,
        });
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => {
      console.log('Authentication expired - logging out...');
      handleLogout();
    };

    window.addEventListener('auth:expired', handleAuthExpired);

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
    };
  }, [handleLogout]);

  if (showSplash) {
    return (
      <LanguageProvider>
        <ThemeProvider>
          <SplashScreen
            onComplete={() => {
              setShowSplash(false);
            }}
          />
        </ThemeProvider>
      </LanguageProvider>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-semibold">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <LanguageProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route
                path="/"
                element={
                  !user ? (
                    <LoginPage onLogin={setUser} />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )
                }
              />
              <Route
                path="/dashboard"
                element={
                  (() => {
                    const storedUser = isAuthenticated() ? getStoredUser() : null;
                    const currentUser = user || (storedUser ? {
                      id: storedUser.id,
                      name: storedUser.full_name || storedUser.name,
                      role: storedUser.role,
                      email: storedUser.email,
                      organizationId: storedUser.organization_id,
                    } : null);

                    if (!currentUser) {
                      return <Navigate to="/" replace />;
                    }

                    if (!hasPermission(currentUser.role, "/dashboard")) {
                      return <Navigate to="/" replace />;
                    }

                    return (
                      <MobileLayout user={currentUser} onLogout={handleLogout}>
                        <MainDashboard user={currentUser} />
                      </MobileLayout>
                    );
                  })()
                }
              />
              {user && (
                <>
                  <Route
                    path="/refrigeration"
                    element={
                      hasPermission(user.role, "/refrigeration") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <RefrigerationManagement />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/ai"
                    element={
                      hasPermission(user.role, "/ai") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <AIDashboard />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/production"
                    element={
                      hasPermission(user.role, "/production") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <ProductionPlanning user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/batches"
                    element={
                      hasPermission(user.role, "/batches") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <BatchManagement user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/waste-analysis"
                    element={
                      hasPermission(user.role, "/waste-analysis") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <WasteAnalysis user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/shipments"
                    element={
                      hasPermission(user.role, "/shipments") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <ShipmentManagement user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/shipments/track"
                    element={
                      hasPermission(user.role, "/shipments/track") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <DriverDashboard />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/alerts"
                    element={
                      hasPermission(user.role, "/alerts") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <AlertCenter user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/reports"
                    element={
                      hasPermission(user.role, "/reports") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <Reports user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/quality"
                    element={
                      hasPermission(user.role, "/quality") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <QualityManagement user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <MobileLayout user={user} onLogout={handleLogout}>
                        <Profile />
                      </MobileLayout>
                    }
                  />
                  <Route
                    path="/settings/system"
                    element={
                      hasPermission(user.role, "/admin/system-settings") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <SystemSettings />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/settings/alerts"
                    element={
                      hasPermission(user.role, "/admin/alert-settings") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <AlertSettings />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/settings/theme"
                    element={
                      <MobileLayout user={user} onLogout={handleLogout}>
                        <ThemeSettings />
                      </MobileLayout>
                    }
                  />
                  <Route
                    path="/chatbot"
                    element={
                      hasPermission(user.role, "/chatbot") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <Chatbot user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/inventory"
                    element={
                      hasPermission(user.role, "/inventory") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <InventoryManagement user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/facilities"
                    element={
                      hasPermission(user.role, "/facilities") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <FacilitiesManagement user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/vehicles"
                    element={
                      hasPermission(user.role, "/vehicles") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <VehiclesManagement user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/supermarkets"
                    element={
                      hasPermission(user.role, "/supermarkets") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <SupermarketsManagement user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/users"
                    element={
                      hasPermission(user.role, "/users") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <UserManagement user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/charity"
                    element={
                      hasPermission(user.role, "/charity") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <CharityIntegration user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/orders"
                    element={
                      hasPermission(user.role, "/orders") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <OrderManagement user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/distribution"
                    element={
                      hasPermission(user.role, "/distribution") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <DistributionManagement user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/heatmaps"
                    element={
                      hasPermission(user.role, "/heatmaps") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <HeatMaps user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/rfid-tracking"
                    element={
                      hasPermission(user.role, "/rfid-tracking") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <RFIDTracking user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                  <Route
                    path="/digital-twin"
                    element={
                      hasPermission(user.role, "/digital-twin") ? (
                        <MobileLayout user={user} onLogout={handleLogout}>
                          <DigitalTwin user={user} />
                        </MobileLayout>
                      ) : (
                        <Navigate to="/dashboard" replace />
                      )
                    }
                  />
                </>
              )}
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </LanguageProvider>
    );
  } catch (error) {
    console.error('App Error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4" dir="rtl">
        <div className="bg-slate-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-white text-xl font-bold mb-2">حدث خطأ في التطبيق</h2>
          <p className="text-slate-400 text-sm mb-4">
            {error?.message || 'حدث خطأ غير متوقع'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold transition-colors"
          >
            إعادة تحميل
          </button>
        </div>
      </div>
    );
  }
}

export default App;

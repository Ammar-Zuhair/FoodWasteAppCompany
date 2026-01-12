@echo off
chcp 65001 >nul
title إعادة بناء التطبيق بعد تحديث IP
color 0B

cd /d "%~dp0"

echo.
echo ========================================
echo   إعادة بناء التطبيق بعد تحديث IP
echo ========================================
echo.
echo [INFO] IP الجديد: 192.168.8.184
echo [INFO] Backend URL: http://192.168.8.184:8000
echo.

echo [STEP 1] جاري بناء التطبيق...
echo هذا قد يستغرق بضع دقائق...
echo.

call npm run build
if errorlevel 1 (
    echo.
    echo [ERROR] فشل في بناء التطبيق
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] تم بناء التطبيق بنجاح!
echo.

echo [STEP 2] جاري مزامنة Capacitor...
echo.

call npm run cap:sync
if errorlevel 1 (
    echo.
    echo [ERROR] فشل في مزامنة Capacitor
    echo.
    pause
    exit /b 1
)

echo.
echo [OK] تم مزامنة Capacitor بنجاح!
echo.

echo ========================================
echo    تم بنجاح! ✓
echo ========================================
echo.
echo الخطوات التالية:
echo.
echo 1. تأكد من أن Backend يعمل على:
echo    http://192.168.8.184:8000
echo.
echo 2. افتح Android Studio:
echo    - npm run cap:open:android
echo    - أو انقر نقراً مزدوجاً على: android\app
echo.
echo 3. ابني APK جديد:
echo    - Build → Build Bundle(s) / APK(s) → Build APK(s)
echo.
echo 4. ثبّت APK على الجوال
echo.
echo ========================================
echo.
pause









@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo.
echo ========================================
echo    إنشاء أيقونات Android
echo ========================================
echo.

echo [INFO] جاري إنشاء جميع أحجام الأيقونات...
echo هذا قد يستغرق بضع دقائق...
echo.

call npx @capacitor/assets generate

if errorlevel 1 (
    echo.
    echo [ERROR] فشل في إنشاء الأيقونات
    echo.
    pause
    exit /b 1
)

echo.
echo [INFO] جاري مزامنة Capacitor...
echo.

call npm run cap:sync

echo.
echo ========================================
echo    تم إنشاء الأيقونات بنجاح!
echo ========================================
echo.
echo الآن يمكنك:
echo 1. فتح Android Studio
echo 2. بناء APK جديد
echo 3. ستظهر الأيقونة الجديدة
echo.
pause










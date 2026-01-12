@echo off
chcp 65001 >nul
cd /d %~dp0

echo ========================================
echo إعداد أيقونة التطبيق بالكامل
echo ========================================
echo.

REM إنشاء مجلد resources
if not exist "resources" (
    mkdir resources
    echo [OK] تم إنشاء مجلد resources
)

REM نسخ الصورة
if exist "..\image\logo.png" (
    copy /Y "..\image\logo.png" "resources\icon.png" >nul
    copy /Y "..\image\logo.png" "resources\splash.png" >nul
    echo [OK] تم نسخ الصورة بنجاح
) else (
    echo [ERROR] لم يتم العثور على الصورة: ..\image\logo.png
    pause
    exit /b 1
)

echo.
echo [INFO] جاري إنشاء الأيقونات...
echo.

REM تشغيل npm script
call npm run setup:icon
if errorlevel 1 (
    echo [ERROR] فشل في نسخ الصورة عبر npm
    pause
    exit /b 1
)

echo.
echo [INFO] جاري إنشاء جميع أحجام الأيقونات...
echo.

REM إنشاء الأيقونات
call npx @capacitor/assets generate
if errorlevel 1 (
    echo [WARNING] فشل في إنشاء الأيقونات تلقائياً
    echo يمكنك استخدام موقع online مثل: https://www.appicon.co/
    pause
    exit /b 1
)

echo.
echo [INFO] جاري مزامنة Capacitor...
echo.

REM مزامنة Capacitor
call npm run cap:sync

echo.
echo ========================================
echo تم إعداد الأيقونة بنجاح!
echo ========================================
echo.
echo الآن يمكنك:
echo 1. فتح Android Studio
echo 2. بناء APK جديد
echo 3. ستظهر الأيقونة الجديدة
echo.
pause










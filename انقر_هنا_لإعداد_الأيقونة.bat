@echo off
chcp 65001 >nul
title إعداد أيقونة التطبيق
color 0A

cd /d "%~dp0"

echo.
echo ========================================
echo    إعداد أيقونة التطبيق
echo ========================================
echo.

REM إنشاء مجلد resources
if not exist "resources" (
    mkdir resources
    echo [OK] تم إنشاء مجلد resources
)

REM نسخ الصورة
if exist "..\image\logo.png" (
    copy /Y "..\image\logo.png" "resources\icon.png" >nul 2>&1
    copy /Y "..\image\logo.png" "resources\splash.png" >nul 2>&1
    echo [OK] تم نسخ الصورة بنجاح
    echo.
) else (
    echo [ERROR] لم يتم العثور على الصورة: ..\image\logo.png
    echo.
    pause
    exit /b 1
)

echo [INFO] جاري إنشاء جميع أحجام الأيقونات...
echo هذا قد يستغرق بضع دقائق...
echo.

REM إنشاء الأيقونات
call npx @capacitor/assets generate
if errorlevel 1 (
    echo.
    echo [WARNING] فشل في إنشاء الأيقونات تلقائياً
    echo يمكنك استخدام موقع online مثل: https://www.appicon.co/
    echo.
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
echo    تم إعداد الأيقونة بنجاح!
echo ========================================
echo.
echo الآن يمكنك:
echo 1. فتح Android Studio
echo 2. بناء APK جديد
echo 3. ستظهر الأيقونة الجديدة على الجوال
echo.
pause










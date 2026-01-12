@echo off
chcp 65001 >nul
title تحديث أيقونة التطبيق
color 0B

cd /d "%~dp0"

echo.
echo ========================================
echo    تحديث أيقونة التطبيق
echo ========================================
echo.

REM التحقق من وجود الصورة
if not exist "resources\icon.png" (
    echo [INFO] نسخ الصورة من مجلد image...
    if not exist "resources" mkdir resources
    if exist "..\image\logo.png" (
        copy /Y "..\image\logo.png" "resources\icon.png" >nul
        copy /Y "..\image\logo.png" "resources\splash.png" >nul
        echo [OK] تم نسخ الصورة
    ) else (
        echo [ERROR] لم يتم العثور على الصورة: ..\image\logo.png
        pause
        exit /b 1
    )
) else (
    echo [OK] الصورة موجودة في resources\icon.png
)

echo.
echo [INFO] جاري إنشاء جميع أحجام الأيقونات...
echo هذا قد يستغرق بضع دقائق...
echo.

REM إنشاء الأيقونات
call npx @capacitor/assets generate --iconBackgroundColor "#000000" --splashBackgroundColor "#000000"

if errorlevel 1 (
    echo.
    echo [WARNING] قد تكون هناك مشكلة في إنشاء الأيقونات
    echo جاري المحاولة بدون خيارات إضافية...
    echo.
    call npx @capacitor/assets generate
    if errorlevel 1 (
        echo [ERROR] فشل في إنشاء الأيقونات
        echo يمكنك استخدام موقع online مثل: https://www.appicon.co/
        pause
        exit /b 1
    )
)

echo.
echo [INFO] جاري مزامنة Capacitor...
echo.

call npm run cap:sync

echo.
echo ========================================
echo    تم تحديث الأيقونة بنجاح!
echo ========================================
echo.
echo الآن يمكنك:
echo 1. فتح Android Studio: npm run cap:open:android
echo 2. بناء APK جديد
echo 3. ستظهر الأيقونة الجديدة على الجوال
echo.
pause










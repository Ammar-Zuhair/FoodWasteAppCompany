@echo off
cd /d "%~dp0"

echo ========================================
echo إعداد أيقونة التطبيق
echo ========================================
echo.

REM إنشاء مجلد resources إذا لم يكن موجوداً
if not exist "resources" (
    mkdir resources
    echo [OK] تم إنشاء مجلد resources
)

REM نسخ الصورة
if exist "..\image\logo.png" (
    copy /Y "..\image\logo.png" "resources\icon.png" >nul
    copy /Y "..\image\logo.png" "resources\splash.png" >nul
    echo [OK] تم نسخ الصورة بنجاح
    echo.
    echo ========================================
    echo الآن قم بتشغيل:
    echo   npm run generate:icons
    echo ========================================
) else (
    echo [ERROR] لم يتم العثور على الصورة: ..\image\logo.png
    pause
    exit /b 1
)

echo.
pause


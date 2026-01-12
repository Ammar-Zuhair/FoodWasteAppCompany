@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo إعداد أيقونة التطبيق
echo ========================================
echo.

if not exist "resources" (
    mkdir resources
    echo [OK] تم إنشاء مجلد resources
)

if exist "..\image\logo.png" (
    copy /Y "..\image\logo.png" "resources\icon.png" >nul
    copy /Y "..\image\logo.png" "resources\splash.png" >nul
    echo [OK] تم نسخ الصورة بنجاح
    echo.
    echo ========================================
    echo الآن قم بتشغيل:
    echo   npm run generate:icons
    echo ========================================
    echo.
    echo أو افتح Android Studio وانسخ الأيقونات يدوياً
    echo.
) else (
    echo [ERROR] لم يتم العثور على الصورة: ..\image\logo.png
    echo.
    pause
    exit /b 1
)

pause










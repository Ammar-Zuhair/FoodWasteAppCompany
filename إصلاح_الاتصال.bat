@echo off
chcp 65001 >nul
title إصلاح مشكلة الاتصال
color 0B

cd /d "%~dp0"

echo.
echo ========================================
echo    إصلاح مشكلة الاتصال بالخادم
echo ========================================
echo.

REM معرفة IP الكمبيوتر
echo [INFO] جاري معرفة IP الكمبيوتر...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4"') do (
    set IP=%%a
    set IP=!IP:~1!
    echo [OK] تم العثور على IP: !IP!
    goto :found
)

:found
if "%IP%"=="" (
    echo [ERROR] لم يتم العثور على IP
    echo يرجى إدخال IP يدوياً:
    set /p IP="IP: "
)

echo.
echo [INFO] IP المستخدم: %IP%
echo.

REM تحديث ملف api.config.js
echo [INFO] جاري تحديث إعدادات API...
powershell -Command "(Get-Content 'src\config\api.config.js') -replace '192\.168\.1\.3', '%IP%' -replace '192\.168\.8\.184', '%IP%' | Set-Content 'src\config\api.config.js'"
if errorlevel 1 (
    echo [WARNING] فشل في تحديث api.config.js تلقائياً
    echo يرجى تحديث IP يدوياً في: src\config\api.config.js
) else (
    echo [OK] تم تحديث api.config.js
)

echo.
echo [INFO] جاري بناء التطبيق...
echo هذا قد يستغرق بضع دقائق...
echo.

call npm run build
if errorlevel 1 (
    echo [ERROR] فشل في بناء التطبيق
    pause
    exit /b 1
)

echo.
echo [INFO] جاري مزامنة Capacitor...
echo.

call npm run cap:sync

echo.
echo ========================================
echo    تم إصلاح المشكلة بنجاح!
echo ========================================
echo.
echo الآن:
echo 1. تأكد من أن Backend يعمل على: http://%IP%:8000
echo 2. افتح Android Studio: npm run cap:open:android
echo 3. ابني APK جديد
echo 4. ثبّت التطبيق على الجوال
echo.
echo للتحقق من Backend، افتح المتصفح على:
echo http://%IP%:8000/api/v1/health
echo.
pause










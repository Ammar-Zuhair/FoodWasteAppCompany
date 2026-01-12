@echo off
chcp 65001 >nul
title بناء وإصلاح التطبيق
color 0A

cd /d "%~dp0"

echo.
echo ========================================
echo    بناء وإصلاح التطبيق
echo ========================================
echo.
echo [INFO] IP المستخدم: 192.168.1.3
echo [INFO] Backend URL: http://192.168.1.3:8000
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
echo [OK] تم بناء التطبيق بنجاح!
echo.

echo [INFO] جاري مزامنة Capacitor...
echo.

call npm run cap:sync

echo.
echo ========================================
echo    تم بنجاح!
echo ========================================
echo.
echo الآن:
echo 1. تأكد من أن Backend يعمل:
echo    cd ..\backend
echo    python start_server.py
echo.
echo 2. افتح Android Studio:
echo    npm run cap:open:android
echo.
echo 3. ابني APK جديد وثبّته على الجوال
echo.
pause










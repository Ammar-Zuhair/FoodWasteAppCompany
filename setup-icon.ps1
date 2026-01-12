# إعداد أيقونة التطبيق
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "إعداد أيقونة التطبيق" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# إنشاء مجلد resources
$resourcesDir = Join-Path $scriptPath "resources"
if (-not (Test-Path $resourcesDir)) {
    New-Item -ItemType Directory -Path $resourcesDir | Out-Null
    Write-Host "[OK] تم إنشاء مجلد resources" -ForegroundColor Green
}

# نسخ الصورة
$sourceImage = Join-Path (Split-Path -Parent $scriptPath) "image\logo.png"
$iconPath = Join-Path $resourcesDir "icon.png"
$splashPath = Join-Path $resourcesDir "splash.png"

if (Test-Path $sourceImage) {
    Copy-Item $sourceImage -Destination $iconPath -Force
    Copy-Item $sourceImage -Destination $splashPath -Force
    Write-Host "[OK] تم نسخ الصورة بنجاح" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "الآن قم بتشغيل:" -ForegroundColor Yellow
    Write-Host "  npm run generate:icons" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Cyan
} else {
    Write-Host "[ERROR] لم يتم العثور على الصورة: $sourceImage" -ForegroundColor Red
    exit 1
}

Write-Host ""










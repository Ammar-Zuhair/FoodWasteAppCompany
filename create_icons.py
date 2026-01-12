#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import shutil
import sys
from pathlib import Path

# المسارات
script_dir = Path(__file__).parent.absolute()
project_root = script_dir
source_image = project_root.parent / "image" / "logo.png"
resources_dir = project_root / "resources"
android_res_dir = project_root / "android" / "app" / "src" / "main" / "res"

print(f"المجلد الحالي: {script_dir}")
print(f"الصورة المصدر: {source_image}")
print(f"مجلد resources: {resources_dir}")

# إنشاء مجلد resources
resources_dir.mkdir(exist_ok=True)
print(f"✓ تم إنشاء/التحقق من مجلد resources")

# نسخ الصورة إلى resources
if source_image.exists():
    shutil.copy2(source_image, resources_dir / "icon.png")
    shutil.copy2(source_image, resources_dir / "splash.png")
    print(f"✓ تم نسخ الصورة إلى {resources_dir}")
else:
    print(f"✗ لم يتم العثور على الصورة: {source_image}")
    sys.exit(1)

# إنشاء مجلدات mipmap للأيقونات
mipmap_sizes = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

for mipmap_name, size in mipmap_sizes.items():
    mipmap_dir = android_res_dir / mipmap_name
    mipmap_dir.mkdir(parents=True, exist_ok=True)
    print(f"✓ تم إنشاء/التحقق من {mipmap_name}")

print("\n" + "="*50)
print("تم إعداد الملفات بنجاح!")
print("="*50)
print("\nالآن قم بتشغيل:")
print("  npx @capacitor/assets generate")
print("\nأو استخدم الأداة online:")
print("  https://www.appicon.co/")


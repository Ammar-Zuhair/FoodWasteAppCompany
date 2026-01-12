# إعداد أيقونة التطبيق

## الطريقة السريعة:

1. **نسخ الصورة:**
   - افتح مجلد `App_android`
   - أنشئ مجلد `resources` إذا لم يكن موجوداً
   - انسخ `logo.png` من مجلد `image` إلى `App_android/resources/icon.png`
   - انسخ نفس الصورة إلى `App_android/resources/splash.png`

2. **إنشاء الأيقونات:**
   ```bash
   npm run generate:icons
   ```

   أو يدوياً:
   ```bash
   npm run setup:icon
   npx @capacitor/assets generate
   ```

3. **مزامنة Capacitor:**
   ```bash
   npm run cap:sync
   ```

## ملاحظات:

- الصورة يجب أن تكون PNG
- الحجم الموصى به: 1024x1024 بكسل
- بعد إنشاء الأيقونات، سيتم تحديث ملفات Android تلقائياً

## الطريقة البديلة (يدوياً):

إذا لم تعمل الأداة، يمكنك:
1. استخدام موقع online مثل: https://www.appicon.co/
2. رفع `logo.png`
3. تحميل الأيقونات بأحجام مختلفة
4. نسخها إلى مجلدات `android/app/src/main/res/mipmap-*/`










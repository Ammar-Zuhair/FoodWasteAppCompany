# 📱 تطبيق HSA - تقليل الهدر الغذائي

تطبيق Android مبني بـ React + Capacitor

## 🚀 البدء السريع

### 1. تثبيت التبعيات
```bash
npm install
```

### 2. التطوير (في Cursor)
```bash
npm run dev
```
افتح المتصفح على `http://localhost:5174`

### 3. إعداد Backend URL
افتح `src/config/api.config.js` وعدّل IP:
```javascript
const possibleIPs = [
  'YOUR_IP_HERE',  // غيّر هذا
];
```

### 4. بناء التطبيق
```bash
npm run build
```

### 5. إضافة Android Platform (مرة واحدة فقط)
```bash
npm run cap:add:android
```

### 6. فتح في Android Studio (لبناء APK)
```bash
npm run cap:open:android
```

في Android Studio:
- File > Sync Project with Gradle Files
- Build > Build APK(s)

## 📝 ملاحظات

- **التطوير**: كل الكود في Cursor، لا تحتاج Android Studio
- **بناء APK**: Android Studio فقط لبناء APK النهائي
- **الخادم**: تأكد من تشغيل Backend على `http://YOUR_IP:8000`

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = __dirname;
const sourceImage = path.join(projectRoot, '..', 'image', 'logo.png');
const resourcesDir = path.join(projectRoot, 'resources');
const iconPath = path.join(resourcesDir, 'icon.png');
const splashPath = path.join(resourcesDir, 'splash.png');

// إنشاء مجلد resources
if (!fs.existsSync(resourcesDir)) {
  fs.mkdirSync(resourcesDir, { recursive: true });
  console.log('✓ تم إنشاء مجلد resources');
}

// نسخ الصورة
if (fs.existsSync(sourceImage)) {
  fs.copyFileSync(sourceImage, iconPath);
  fs.copyFileSync(sourceImage, splashPath);
  console.log('✓ تم نسخ الصورة بنجاح');
  console.log(`  من: ${sourceImage}`);
  console.log(`  إلى: ${iconPath}`);
} else {
  console.error(`✗ لم يتم العثور على الصورة: ${sourceImage}`);
  process.exit(1);
}

console.log('\n' + '='.repeat(50));
console.log('تم إعداد الملفات بنجاح!');
console.log('='.repeat(50));
console.log('\nالآن قم بتشغيل:');
console.log('  npm run generate:icons');


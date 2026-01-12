/**
 * إعدادات API
 */

const isNative = typeof window !== 'undefined' &&
  window.Capacitor !== undefined &&
  typeof window.Capacitor.isNativePlatform === 'function' &&
  window.Capacitor.isNativePlatform();

// قائمة IPs محتملة - يمكنك تعديلها حسب شبكتك
export const POSSIBLE_IPS = [
  '192.168.8.184',  // IP الحالي على Wi-Fi (PRIMARY)
  '192.168.126.1',  // IP إضافي من ipconfig
  '192.168.245.1',  // IP إضافي من ipconfig
  '192.168.1.3',    // IP سابق (fallback)
  '192.168.1.100',
  '192.168.0.100',
  '192.168.1.1',
  '192.168.0.1',
  '192.168.43.1',   // Hotspot من الجوال
  '192.168.137.1',  // Hotspot من الجوال (بديل)
  '10.0.2.2'        // Android Emulator
];

// متغير لتخزين IP الحالي (يتم تحديثه ديناميكياً)
let currentIP = null;

/**
 * تحديث IP الحالي
 */
export function updateCurrentIP(ip) {
  currentIP = ip;
  if (ip) {
    try {
      localStorage.setItem('backend_ip', ip);
    } catch (e) {
      // تجاهل الأخطاء
    }
  }
}

/**
 * الحصول على IP الحالي
 */
export function getCurrentIP() {
  if (currentIP) {
    return currentIP;
  }

  try {
    const savedIP = localStorage.getItem('backend_ip');
    if (savedIP) {
      currentIP = savedIP;
      return savedIP;
    }
  } catch (e) {
    // تجاهل الأخطاء
  }

  return POSSIBLE_IPS[0];
}

function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  if (isNative) {
    // استخدام IP الحالي (يتم تحديثه تلقائياً)
    const ip = getCurrentIP();

    if (import.meta.env.DEV && !window.__API_WARNING_SHOWN) {
      console.info('ℹ️ Native app detected. Using IP:', ip);
      console.info('💡 IP will be auto-discovered when network changes');
      window.__API_WARNING_SHOWN = true;
    }

    return `http://${ip}:8000`;
  }

  return 'https://srv1265534.hstgr.cloud';
}

/**
 * اختبار الاتصال بـ IP معين (محسّن - مع retry)
 * @param {string} ip - عنوان IP للاختبار
 * @param {number} retries - عدد المحاولات
 * @returns {Promise<boolean>} true إذا كان الاتصال ناجحاً
 */
export async function testConnection(ip, retries = 2) {
  const url = `https://srv1265534.hstgr.cloud/health/`;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 ثواني (أطول)

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
        // لا نستخدم mode: 'cors' لأنها قد تسبب مشاكل مع localhost
        // mode: 'no-cors' يمنع قراءة response
        // نتركه افتراضي (same-origin أو cors حسب المتصفح)
      });

      clearTimeout(timeoutId);

      // التحقق من status code
      if (response.ok || response.status === 200) {
        // محاولة قراءة response للتأكد
        try {
          const data = await response.json();
          console.log(`[Connection Test] ✅ ${ip}:8000 is reachable`, data);
          return true;
        } catch (e) {
          // حتى لو لم نستطع قراءة JSON، إذا كان status ok فهو يعمل
          console.log(`[Connection Test] ✅ ${ip}:8000 is reachable (status: ${response.status})`);
          return true;
        }
      } else {
        console.log(`[Connection Test] ⚠️ ${ip}:8000 returned status: ${response.status}`);
      }
    } catch (error) {
      const errorMsg = error.message || error.toString();
      console.log(`[Connection Test] ❌ ${ip}:8000 attempt ${attempt + 1}/${retries} failed: ${errorMsg}`);

      if (attempt < retries - 1) {
        // انتظر قليلاً قبل المحاولة التالية
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
    }
  }

  return false;
}

/**
 * البحث عن IP صحيح من القائمة (محسّن - مع أولوية)
 * @returns {Promise<string|null>} IP صحيح أو null
 */
export async function findWorkingIP() {
  console.log('[IP Discovery] Starting search...');

  // أولاً، جرب IP المحفوظ
  try {
    const savedIP = localStorage.getItem('backend_ip');
    if (savedIP) {
      console.log(`[IP Discovery] Testing saved IP: ${savedIP}`);
      if (await testConnection(savedIP, 2)) {
        console.log(`[IP Discovery] ✅ Saved IP works: ${savedIP}`);
        return savedIP;
      }
      console.log(`[IP Discovery] ❌ Saved IP failed: ${savedIP}`);
    }
  } catch (e) {
    console.error('[IP Discovery] Error testing saved IP:', e);
  }

  // جرب IPs بالترتيب (أول IPs في القائمة لها أولوية)
  console.log(`[IP Discovery] Testing ${POSSIBLE_IPS.length} IPs...`);

  for (const ip of POSSIBLE_IPS) {
    console.log(`[IP Discovery] Testing: ${ip}`);
    if (await testConnection(ip, 2)) {
      console.log(`[IP Discovery] ✅ Found working IP: ${ip}`);
      // احفظ IP الناجح
      try {
        localStorage.setItem('backend_ip', ip);
      } catch (e) {
        console.error('[IP Discovery] Error saving IP:', e);
      }
      return ip;
    }
  }

  console.warn('[IP Discovery] ❌ No working IP found');
  return null;
}

function getLlamaUrl() {
  if (import.meta.env.VITE_LLAMA_URL) {
    return import.meta.env.VITE_LLAMA_URL;
  }

  if (isNative) {
    const apiUrl = getApiBaseUrl();
    return apiUrl.replace(':8000', ':8001');
  }

  return 'https://srv1265534.hstgr.cloud';
}

// إنشاء API_CONFIG ديناميكي
function createAPIConfig() {
  return {
    baseURL: getApiBaseUrl(),
    llamaURL: getLlamaUrl(),
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
  };
}

export let API_CONFIG = createAPIConfig();

/**
 * تحديث API_CONFIG عند تغيير IP
 */
export function refreshAPIConfig() {
  // تحديث IP الحالي
  const savedIP = localStorage.getItem('backend_ip');
  if (savedIP) {
    currentIP = savedIP;
  }

  // إعادة إنشاء API_CONFIG
  API_CONFIG = createAPIConfig();

  console.log('[API Config] Refreshed with IP:', API_CONFIG.baseURL);
}

if (import.meta.env.DEV && !window.__API_CONFIG_LOGGED) {
  console.log('🔌 API Config:', {
    isNative,
    baseURL: API_CONFIG.baseURL,
    llamaURL: API_CONFIG.llamaURL,
  });
  window.__API_CONFIG_LOGGED = true;
}

export const AVAILABLE_MODELS = {
  DEMAND_FORECASTING: 'demand_forecasting',
  PRODUCT_EXPIRY: 'product_expiry',
  FOOD_VALUE: 'food_value',
  SENSOR_ANOMALY: 'sensor_anomaly',
  SENSOR_FAIL: 'sensor_fail',
  FRIDGE_FAIL: 'fridge_fail',
  ENERGY_ANOMALY: 'energy_anomaly',
  RETURN_PRODUCT: 'return_product',
  VPS: 'vps',
  HIGH_DANGEROUS: 'high_dangerous',
};

export const MODEL_NAMES = {
  [AVAILABLE_MODELS.DEMAND_FORECASTING]: 'توقع الطلب',
  [AVAILABLE_MODELS.PRODUCT_EXPIRY]: 'توقع انتهاء الصلاحية',
  [AVAILABLE_MODELS.FOOD_VALUE]: 'تقييم جودة الطعام',
  [AVAILABLE_MODELS.SENSOR_ANOMALY]: 'اكتشاف شذوذ الحساسات',
  [AVAILABLE_MODELS.SENSOR_FAIL]: 'توقع أعطال الحساسات',
  [AVAILABLE_MODELS.FRIDGE_FAIL]: 'توقع أعطال التبريد',
  [AVAILABLE_MODELS.ENERGY_ANOMALY]: 'اكتشاف شذوذ الطاقة',
  [AVAILABLE_MODELS.RETURN_PRODUCT]: 'توقع الإرجاعات',
  [AVAILABLE_MODELS.VPS]: 'تحليل VPS',
  [AVAILABLE_MODELS.HIGH_DANGEROUS]: 'تحديد المنتجات عالية الخطورة',
};

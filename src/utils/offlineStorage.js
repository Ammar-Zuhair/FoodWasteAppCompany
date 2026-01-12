/**
 * Offline Storage Utility
 * لتخزين البيانات محلياً للعمل بدون اتصال
 */

const STORAGE_PREFIX = 'offline_';

/**
 * حفظ بيانات محلياً
 * @param {string} key - المفتاح
 * @param {any} data - البيانات
 * @param {number} ttl - وقت الصلاحية بالثواني (اختياري)
 * @returns {Promise<boolean>}
 */
export async function saveOfflineData(key, data, ttl = null) {
  try {
    const dataObj = {
      data,
      timestamp: Date.now(),
      ttl: ttl ? Date.now() + (ttl * 1000) : null,
    };
    
    const dataStr = JSON.stringify(dataObj);
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, dataStr);
    return true;
  } catch (error) {
    console.error('Error saving offline data:', error);
    return false;
  }
}

/**
 * جلب بيانات محلية
 * @param {string} key - المفتاح
 * @returns {Promise<any|null>}
 */
export async function getOfflineData(key) {
  try {
    const dataStr = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (!dataStr) return null;
    
    const dataObj = JSON.parse(dataStr);
    
    // التحقق من انتهاء الصلاحية
    if (dataObj.ttl && Date.now() > dataObj.ttl) {
      await clearOfflineData(key);
      return null;
    }
    
    return dataObj.data;
  } catch (error) {
    console.error('Error getting offline data:', error);
    return null;
  }
}

/**
 * حذف بيانات محلية
 * @param {string} key - المفتاح
 * @returns {Promise<boolean>}
 */
export async function clearOfflineData(key) {
  try {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    return true;
  } catch (error) {
    console.error('Error clearing offline data:', error);
    return false;
  }
}

/**
 * حذف جميع البيانات المحلية
 * @returns {Promise<boolean>}
 */
export async function clearAllOfflineData() {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error('Error clearing all offline data:', error);
    return false;
  }
}

/**
 * الحصول على جميع المفاتيح المحفوظة
 * @returns {Promise<string[]>}
 */
export async function getAllOfflineKeys() {
  try {
    const keys = Object.keys(localStorage);
    return keys
      .filter(key => key.startsWith(STORAGE_PREFIX))
      .map(key => key.replace(STORAGE_PREFIX, ''));
  } catch (error) {
    console.error('Error getting offline keys:', error);
    return [];
  }
}

/**
 * التحقق من وجود بيانات محلية
 * @param {string} key - المفتاح
 * @returns {Promise<boolean>}
 */
export async function hasOfflineData(key) {
  try {
    const data = await getOfflineData(key);
    return data !== null;
  } catch (error) {
    return false;
  }
}







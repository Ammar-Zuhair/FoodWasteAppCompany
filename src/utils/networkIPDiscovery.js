/**
 * Network IP Discovery Utility
 * يكتشف IP تلقائياً عند تغيير الشبكة
 */
import { getNetworkStatus, watchNetworkStatus } from './capacitor.js';
import { testConnection, findWorkingIP, POSSIBLE_IPS, updateCurrentIP, refreshAPIConfig } from '../config/api.config.js';

let networkWatcher = null;
let lastKnownIP = null;
let isDiscovering = false;

/**
 * اكتشاف IP تلقائياً عند بدء التطبيق
 * @returns {Promise<string|null>} IP صحيح أو null
 */
export async function autoDiscoverIP() {
  if (isDiscovering) {
    console.log('[Network Discovery] Already discovering, skipping...');
    return null;
  }

  isDiscovering = true;
  console.log('[Network Discovery] Starting auto-discovery...');

  try {
    // التحقق من حالة الشبكة أولاً
    const networkStatus = await getNetworkStatus();
    if (!networkStatus.connected) {
      console.warn('[Network Discovery] No network connection');
      isDiscovering = false;
      return null;
    }

    // جرب IP المحفوظ أولاً
    const savedIP = localStorage.getItem('backend_ip');
    if (savedIP) {
      console.log(`[Network Discovery] Testing saved IP: ${savedIP}`);
      if (await testConnection(savedIP)) {
        console.log(`[Network Discovery] Saved IP works: ${savedIP}`);
        lastKnownIP = savedIP;
        
        // تحديث IP في API_CONFIG
        updateCurrentIP(savedIP);
        refreshAPIConfig();
        
        isDiscovering = false;
        return savedIP;
      } else {
        console.log(`[Network Discovery] Saved IP failed, searching for new IP...`);
      }
    }

    // البحث عن IP جديد
    const workingIP = await findWorkingIP();
    if (workingIP) {
      console.log(`[Network Discovery] Found working IP: ${workingIP}`);
      lastKnownIP = workingIP;
      localStorage.setItem('backend_ip', workingIP);
      
      // تحديث IP في API_CONFIG
      updateCurrentIP(workingIP);
      refreshAPIConfig();
      
      isDiscovering = false;
      return workingIP;
    }

    console.warn('[Network Discovery] No working IP found');
    isDiscovering = false;
    return null;
  } catch (error) {
    console.error('[Network Discovery] Error during discovery:', error);
    isDiscovering = false;
    return null;
  }
}

/**
 * بدء مراقبة تغييرات الشبكة
 * @param {Function} onIPChanged - Callback عند تغيير IP
 */
export function startNetworkWatcher(onIPChanged) {
  if (networkWatcher) {
    console.log('[Network Discovery] Watcher already running');
    return;
  }

  console.log('[Network Discovery] Starting network watcher...');

  // اكتشاف أولي
  autoDiscoverIP().then((ip) => {
    if (ip && onIPChanged) {
      onIPChanged(ip);
    }
  });

  // مراقبة تغييرات الشبكة
  networkWatcher = watchNetworkStatus(async (status) => {
    console.log('[Network Discovery] Network status changed:', status);

    if (status.connected) {
      // عند الاتصال بالشبكة، اكتشف IP جديد
      const newIP = await autoDiscoverIP();
      
      if (newIP && newIP !== lastKnownIP) {
        console.log(`[Network Discovery] IP changed from ${lastKnownIP} to ${newIP}`);
        lastKnownIP = newIP;
        
        // تحديث IP في API_CONFIG
        updateCurrentIP(newIP);
        refreshAPIConfig();
        
        if (onIPChanged) {
          onIPChanged(newIP);
        }

        // إرسال event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('backend-ip-changed', { 
            detail: { ip: newIP } 
          }));
        }
      }
    } else {
      console.warn('[Network Discovery] Network disconnected');
    }
  });
}

/**
 * إيقاف مراقبة تغييرات الشبكة
 */
export function stopNetworkWatcher() {
  if (networkWatcher) {
    networkWatcher();
    networkWatcher = null;
    console.log('[Network Discovery] Network watcher stopped');
  }
}

/**
 * الحصول على آخر IP معروف
 * @returns {string|null}
 */
export function getLastKnownIP() {
  return lastKnownIP || localStorage.getItem('backend_ip');
}

/**
 * تحديث IP يدوياً
 * @param {string} ip - IP جديد
 */
export async function updateIP(ip) {
  if (await testConnection(ip)) {
    localStorage.setItem('backend_ip', ip);
    lastKnownIP = ip;
    
    // تحديث IP في API_CONFIG
    updateCurrentIP(ip);
    refreshAPIConfig();
    
    // إرسال event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('backend-ip-changed', { 
        detail: { ip } 
      }));
    }
    
    return true;
  }
  return false;
}


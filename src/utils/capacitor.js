/**
 * Capacitor utilities for mobile app
 */
import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Network } from '@capacitor/network';

/**
 * Check if running on native platform
 */
export const isNative = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Check if running on Android
 */
export const isAndroid = () => {
  return Capacitor.getPlatform() === 'android';
};

/**
 * Check if running on iOS
 */
export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};

/**
 * Get current GPS location
 */
export async function getCurrentLocation() {
  try {
    if (!isNative()) {
      // Fallback for web
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
              });
            },
            reject
          );
        } else {
          reject(new Error('Geolocation not supported'));
        }
      });
    }

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
}

/**
 * Watch GPS position
 */
export async function watchPosition(callback) {
  try {
    if (!isNative()) {
      // Fallback for web
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          callback({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }

    const watchId = await Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
      (position, err) => {
        if (err) {
          console.error('Geolocation error:', err);
          return;
        }
        callback({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      }
    );

    return () => {
      Geolocation.clearWatch({ id: watchId });
    };
  } catch (error) {
    console.error('Error watching position:', error);
    throw error;
  }
}

/**
 * Request location permissions
 */
export async function requestLocationPermissions() {
  try {
    if (!isNative()) {
      return true; // Web doesn't need explicit permission
    }

    const status = await Geolocation.checkPermissions();
    if (status.location === 'granted') {
      return true;
    }

    const result = await Geolocation.requestPermissions();
    return result.location === 'granted';
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
}

/**
 * Show local notification
 */
export async function showNotification(title, body, data = {}) {
  try {
    if (!isNative()) {
      // Fallback for web
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, data });
      }
      return;
    }

    await LocalNotifications.requestPermissions();

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Date.now(),
          schedule: { at: new Date(Date.now() + 1000) },
          sound: 'default',
          attachments: undefined,
          actionTypeId: '',
          extra: data,
        },
      ],
    });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

/**
 * Open camera and take photo
 */
export async function openCamera() {
  try {
    if (!isNative()) {
      // Fallback for web - use file input
      return new Promise((resolve, reject) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              resolve({
                dataUrl: reader.result,
                format: 'jpeg',
                path: file.name,
              });
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          } else {
            reject(new Error('No file selected'));
          }
        };
        input.click();
      });
    }

    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: 'base64',
      source: 'CAMERA',
    });

    return {
      dataUrl: `data:image/${image.format};base64,${image.base64String}`,
      format: image.format,
      path: image.path,
    };
  } catch (error) {
    console.error('Error opening camera:', error);
    throw error;
  }
}

/**
 * Initialize status bar for APK
 * @param {string} theme - 'light' or 'dark'
 */
export async function initStatusBar(theme = 'light') {
  try {
    if (isNative()) {
      // CRITICAL: Set overlay FIRST before any other status bar operations
      // This removes the black space above the header
      await StatusBar.setOverlaysWebView({ overlay: true });

      // Small delay to ensure overlay is set
      await new Promise(resolve => setTimeout(resolve, 100));

      if (theme === 'dark') {
        // Dark theme - match header background exactly (slate-900)
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setBackgroundColor({ color: '#0f172a' }); // slate-950
      } else {
        // Light theme - match header background exactly (white)
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
      }

      // Ensure overlay is still enabled after color changes
      await StatusBar.setOverlaysWebView({ overlay: true });

      // Force remove any padding/margin from body/html
      if (typeof document !== 'undefined') {
        document.documentElement.style.paddingTop = '0';
        document.documentElement.style.marginTop = '0';
        document.body.style.paddingTop = '0';
        document.body.style.marginTop = '0';
        const root = document.getElementById('root');
        if (root) {
          root.style.paddingTop = '0';
          root.style.marginTop = '0';
        }
      }
    }
  } catch (error) {
    console.error('Error initializing status bar:', error);
    // Retry once if it fails
    try {
      if (isNative()) {
        await StatusBar.setOverlaysWebView({ overlay: true });
        // Force remove padding/margin
        if (typeof document !== 'undefined') {
          document.documentElement.style.paddingTop = '0';
          document.documentElement.style.marginTop = '0';
          document.body.style.paddingTop = '0';
          document.body.style.marginTop = '0';
          const root = document.getElementById('root');
          if (root) {
            root.style.paddingTop = '0';
            root.style.marginTop = '0';
          }
        }
      }
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    }
  }
}

/**
 * Get current network status
 * @returns {Promise<Object>} Network status
 */
export async function getNetworkStatus() {
  try {
    if (!isNative()) {
      // Fallback for web
      return {
        connected: navigator.onLine,
        connectionType: 'wifi',
      };
    }

    const status = await Network.getStatus();
    return {
      connected: status.connected,
      connectionType: status.connectionType,
    };
  } catch (error) {
    console.error('Error getting network status:', error);
    return {
      connected: true, // Assume connected on error
      connectionType: 'unknown',
    };
  }
}

/**
 * Watch network status changes
 * @param {Function} callback - Callback function when network changes
 * @returns {Function} Unsubscribe function
 */
export function watchNetworkStatus(callback) {
  try {
    if (!isNative()) {
      // Fallback for web
      const handleOnline = () => callback({ connected: true, connectionType: 'wifi' });
      const handleOffline = () => callback({ connected: false, connectionType: 'none' });

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    const listener = Network.addListener('networkStatusChange', (status) => {
      callback({
        connected: status.connected,
        connectionType: status.connectionType,
      });
    });

    return () => {
      listener.remove();
    };
  } catch (error) {
    console.error('Error watching network status:', error);
    return () => { }; // Return empty function on error
  }
}

/**
 * Share content using Web Share API (for mobile)
 * @param {Object} options - Share options
 * @returns {Promise<boolean>} Success status
 */
export async function shareContent(options = {}) {
  const { title, text, url, files } = options;

  try {
    if (navigator.share) {
      const shareData = { title, text };

      if (url) shareData.url = url;

      // Check if file sharing is supported
      if (files && files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
        shareData.files = files;
      }

      await navigator.share(shareData);
      return true;
    } else {
      // Fallback - copy to clipboard
      const textToCopy = text + (url ? '\n' + url : '');
      await navigator.clipboard.writeText(textToCopy);
      return true;
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error sharing:', error);
    }
    return false;
  }
}

/**
 * Print report - uses native print on web, share on mobile
 * @param {string} reportType - Type of report
 * @param {Object} data - Report data
 * @param {string} language - Language code
 */
export async function printReport(reportType = 'comprehensive', data = {}, language = 'ar') {
  try {
    if (isNative()) {
      // On mobile, use share functionality
      const title = language === 'ar' ? 'تقرير ترشيد' : 'Tarsheed Report';
      const text = language === 'ar'
        ? `تقرير ${reportType} - ${new Date().toLocaleDateString('ar-SA')}`
        : `${reportType} Report - ${new Date().toLocaleDateString('en-US')}`;

      await shareContent({
        title,
        text,
        url: window.location.href
      });
    } else {
      // On web, use browser print
      window.print();
    }
  } catch (error) {
    console.error('Error printing report:', error);
    // Fallback to window.print
    window.print();
  }
}

/**
 * Download file from blob
 * @param {Blob} blob - File blob
 * @param {string} filename - File name
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Share PDF file on mobile
 * @param {Blob} pdfBlob - PDF blob
 * @param {string} filename - File name
 * @param {string} title - Share title
 */
export async function sharePDF(pdfBlob, filename, title) {
  try {
    if (navigator.share && navigator.canShare) {
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: title
        });
        return true;
      }
    }

    // Fallback - download the file
    downloadBlob(pdfBlob, filename);
    return true;
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('Error sharing PDF:', error);
      // Fallback - download
      downloadBlob(pdfBlob, filename);
    }
    return false;
  }
}


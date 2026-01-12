import { useState, useEffect } from 'react';

/**
 * Hook للكشف عن نوع الجهاز (Desktop/Mobile)
 * @returns {{isMobile: boolean, isNative: boolean, isTablet: boolean}}
 */
export function useDevice() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isNative: false,
    screenWidth: 0,
    screenHeight: 0,
    orientation: 'portrait',
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      // Use Capacitor.isNativePlatform() for accurate detection
      const isNative = typeof window !== 'undefined' && 
        window.Capacitor !== undefined && 
        typeof window.Capacitor.isNativePlatform === 'function' &&
        window.Capacitor.isNativePlatform();
      
      // Mobile: < 768px
      // Tablet: 768px - 1024px
      // Desktop: > 1024px
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const orientation = width > height ? 'landscape' : 'portrait';
      
      setDeviceInfo({
        isMobile,
        isTablet,
        isNative,
        screenWidth: width,
        screenHeight: height,
        orientation,
      });
    };
    
    // Check immediately
    checkDevice();
    
    // Listen for resize events
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return deviceInfo;
}



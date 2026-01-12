import { useEffect, useState } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";

function SplashScreen({ onComplete }) {
  const { theme } = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [logoScale, setLogoScale] = useState(0);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Animation sequence
    const timeline = setTimeout(() => {
      // Fade in logo
      setOpacity(1);
      setLogoScale(1);
    }, 100);

    // Start fade out and scale down animation before hiding
    const fadeOutTimeout = setTimeout(() => {
      setLogoScale(0.8);
      setOpacity(0);
    }, 2200); // Start fade out at 2.2 seconds

    // Hide splash after animation
    const hideTimeout = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onComplete) onComplete();
      }, 400); // Wait for fade out animation to complete
    }, 2500); // Total display time: 2.5 seconds

    return () => {
      clearTimeout(timeline);
      clearTimeout(fadeOutTimeout);
      clearTimeout(hideTimeout);
    };
  }, [onComplete]);

  if (!isVisible && opacity === 0) return null;

  const bgClass = theme === "dark"
    ? "bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
    : "bg-gradient-to-br from-[#E6F7FB] via-[#F0FAFC] to-[#E6F7FB]";

  return (
    <div
      className={`fixed inset-0 z-50 ${bgClass} flex items-center justify-center transition-all duration-500 ease-in-out ${
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
      style={{ pointerEvents: isVisible ? "auto" : "none" }}
    >
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${theme === "dark" ? "bg-emerald-500/10" : "bg-[#429EBD]/10"} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 ${theme === "dark" ? "bg-amber-500/10" : "bg-[#F7AD19]/10"} rounded-full blur-3xl animate-pulse`} style={{ animationDelay: "1s" }} />
      </div>

      {/* Logo container with animations */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Logo with scale and fade animation */}
        <div
          className="transition-all duration-500 ease-in-out"
          style={{
            transform: `scale(${logoScale}) translateY(${opacity < 1 && logoScale < 1 ? '20px' : '0px'})`,
            opacity: opacity,
          }}
        >
          <div className="relative">
            {/* Glow effect behind logo */}
            <div className={`absolute inset-0 ${theme === "dark" ? "bg-emerald-500/20" : "bg-[#429EBD]/20"} blur-2xl rounded-full -z-10 animate-pulse`} />
            
            {/* Logo image */}
            <img
              src="/logo.png"
              alt="HSA Logo"
              className="h-32 md:h-48 lg:h-56 w-auto object-contain drop-shadow-2xl"
              style={{
                filter: "drop-shadow(0 10px 30px rgba(16, 185, 129, 0.3))",
              }}
              onError={(e) => {
                e.target.style.display = "none";
                e.target.nextSibling.style.display = "block";
              }}
            />
            
            {/* Fallback text if image doesn't load */}
            <div className="hidden text-5xl md:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-emerald-500 to-amber-500 bg-clip-text text-transparent">
              HSA
            </div>
          </div>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2 mt-8" style={{ opacity: opacity }}>
          <div
            className={`w-2 h-2 rounded-full ${theme === "dark" ? "bg-emerald-400" : "bg-[#429EBD]"} animate-bounce`}
            style={{ animationDelay: "0s" }}
          />
          <div
            className={`w-2 h-2 rounded-full ${theme === "dark" ? "bg-emerald-400" : "bg-[#429EBD]"} animate-bounce`}
            style={{ animationDelay: "0.2s" }}
          />
          <div
            className={`w-2 h-2 rounded-full ${theme === "dark" ? "bg-emerald-400" : "bg-[#429EBD]"} animate-bounce`}
            style={{ animationDelay: "0.4s" }}
          />
        </div>
      </div>
    </div>
  );
}

export default SplashScreen;


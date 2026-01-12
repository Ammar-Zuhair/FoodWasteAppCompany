function Logo({ className = "" }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img 
        src="/logo.png" 
        alt="HSA Logo" 
        className="h-12 md:h-14 w-auto object-contain drop-shadow-lg"
        onError={(e) => {
          // Fallback if image doesn't load
          e.target.style.display = 'none';
          e.target.nextSibling.style.display = 'block';
        }}
      />
      {/* Fallback text if image doesn't load */}
      <div className="hidden text-lg font-bold bg-gradient-to-r from-emerald-500 to-amber-500 bg-clip-text text-transparent">
        HSA
      </div>
    </div>
  );
}

export default Logo;

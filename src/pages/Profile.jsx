import { useState, useEffect, useRef } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import { getStoredUser } from "../utils/api/auth.js";

function Profile() {
  const { theme } = useTheme();
  const { language } = useLanguage();
  const user = getStoredUser();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Image states
  const [profileImage, setProfileImage] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [imageHover, setImageHover] = useState({ profile: false, cover: false });
  
  // Refs for file inputs
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "user@example.com",
    phone: user?.phone || "+967 7XX XXX XXX",
    job_title: user?.job_title || (language === "ar" ? "مدير النظام" : "System Admin"),
    department: user?.department || (language === "ar" ? "تقنية المعلومات" : "IT Department"),
    bio: user?.bio || "",
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Security settings
  const [securitySettings, setSecuritySettings] = useState({
    two_factor: false,
    login_alerts: true,
    session_timeout: 30,
  });

  const textColor = theme === "dark" ? "text-white" : "text-[#053F5C]";
  const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#429EBD]";
  const borderClass = theme === "dark" ? "border-white/10" : "border-[#9FE7F5]/40";
  const cardBgClass = theme === "dark" ? "bg-slate-900/80" : "bg-white/50";
  const inputClass = `w-full px-4 py-3 rounded-xl border-2 ${borderClass} ${cardBgClass} ${textColor} focus:outline-none focus:ring-2 focus:ring-[#429EBD]/50 transition-all`;

  // Get user initials for avatar
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Handle profile image selection
  const handleProfileImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(language === "ar" ? "حجم الملف كبير جداً (الحد الأقصى 5 ميجابايت)" : "File too large (max 5MB)");
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cover image selection
  const handleCoverImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert(language === "ar" ? "حجم الملف كبير جداً (الحد الأقصى 10 ميجابايت)" : "File too large (max 10MB)");
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove profile image
  const handleRemoveProfileImage = () => {
    setProfileImage(null);
    setProfileImagePreview(null);
    if (profileInputRef.current) {
      profileInputRef.current.value = "";
    }
  };

  // Remove cover image
  const handleRemoveCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSaving(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert(language === "ar" ? "كلمة المرور الجديدة غير متطابقة" : "New passwords don't match");
      return;
    }
    
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
    setSaving(false);
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);
  };

  const tabs = [
    { id: "profile", label: language === "ar" ? "الملف الشخصي" : "Profile", icon: "user" },
    { id: "security", label: language === "ar" ? "الأمان" : "Security", icon: "shield" },
    { id: "activity", label: language === "ar" ? "النشاط" : "Activity", icon: "activity" },
  ];

  const recentActivity = [
    { action: language === "ar" ? "تسجيل دخول" : "Login", time: "2024-12-15 09:30", device: "Chrome / Windows", location: language === "ar" ? "صنعاء، اليمن" : "Sana'a, Yemen", status: "success" },
    { action: language === "ar" ? "تعديل إعدادات" : "Settings Update", time: "2024-12-14 15:45", device: "Mobile App", location: language === "ar" ? "صنعاء، اليمن" : "Sana'a, Yemen", status: "success" },
    { action: language === "ar" ? "تسجيل دخول" : "Login", time: "2024-12-14 08:00", device: "Firefox / MacOS", location: language === "ar" ? "عدن، اليمن" : "Aden, Yemen", status: "success" },
    { action: language === "ar" ? "تغيير كلمة المرور" : "Password Change", time: "2024-12-10 11:20", device: "Chrome / Windows", location: language === "ar" ? "صنعاء، اليمن" : "Sana'a, Yemen", status: "success" },
    { action: language === "ar" ? "محاولة تسجيل دخول فاشلة" : "Failed Login Attempt", time: "2024-12-08 22:15", device: "Unknown", location: language === "ar" ? "موقع غير معروف" : "Unknown Location", status: "failed" },
  ];

  return (
    <div className="space-y-6" dir={language === "ar" ? "rtl" : "ltr"}>
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-xl bg-emerald-500 text-white font-medium shadow-lg flex items-center gap-2 animate-bounce">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
          {language === "ar" ? "تم الحفظ بنجاح!" : "Saved successfully!"}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h2 className={`text-2xl md:text-4xl font-bold ${textColor} mb-2`}>
          {language === "ar" ? "إعدادات الحساب" : "Account Settings"}
        </h2>
        <p className={`text-sm md:text-lg ${subTextColor}`}>
          {language === "ar" ? "إدارة ملفك الشخصي وإعدادات الأمان" : "Manage your profile and security settings"}
        </p>
      </div>

      {/* Profile Card */}
      <div className={`rounded-2xl border-2 ${borderClass} ${cardBgClass} overflow-hidden shadow-lg`}>
        {/* Cover Image */}
        <div 
          className="relative h-48 md:h-56 cursor-pointer group"
          onMouseEnter={() => setImageHover({ ...imageHover, cover: true })}
          onMouseLeave={() => setImageHover({ ...imageHover, cover: false })}
          onClick={() => coverInputRef.current?.click()}
        >
          {/* Cover Background */}
          {coverImagePreview ? (
            <img 
              src={coverImagePreview} 
              alt="Cover" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#429EBD] via-[#053F5C] to-[#429EBD] relative overflow-hidden">
              {/* Animated Pattern */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%">
                  <pattern id="coverGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                    <circle cx="15" cy="15" r="2" fill="white" opacity="0.4"/>
                    <path d="M0 15 L30 15 M15 0 L15 30" stroke="white" strokeWidth="0.3" opacity="0.2"/>
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#coverGrid)"/>
                </svg>
              </div>
              {/* Floating shapes */}
              <div className="absolute top-4 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
              <div className="absolute bottom-4 right-20 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
            </div>
          )}
          
          {/* Cover Overlay on Hover */}
          <div className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-all duration-300 ${imageHover.cover ? "opacity-100" : "opacity-0"}`}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30 hover:scale-110 transition-transform">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
              <p className="text-white font-medium text-sm">
                {language === "ar" ? "تغيير صورة الغلاف" : "Change Cover Photo"}
              </p>
            </div>
          </div>
          
          {/* Remove Cover Button */}
          {coverImagePreview && (
            <button
              onClick={(e) => { e.stopPropagation(); handleRemoveCoverImage(); }}
              className="absolute top-3 left-3 p-2 rounded-full bg-red-500/80 hover:bg-red-600 text-white transition-all hover:scale-110 shadow-lg"
              title={language === "ar" ? "إزالة صورة الغلاف" : "Remove cover"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
          
          {/* Hidden File Input */}
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverImageChange}
            className="hidden"
          />
        </div>
        
        <div className="relative px-6 pb-6">
          {/* Profile Picture */}
          <div 
            className="absolute -top-16 right-6 transform cursor-pointer group"
            onMouseEnter={() => setImageHover({ ...imageHover, profile: true })}
            onMouseLeave={() => setImageHover({ ...imageHover, profile: false })}
            onClick={() => profileInputRef.current?.click()}
          >
            <div className="relative w-28 h-28 rounded-2xl shadow-2xl border-4 border-slate-800 overflow-hidden transition-transform duration-300 hover:scale-105">
              {profileImagePreview ? (
                <img 
                  src={profileImagePreview} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#429EBD] to-[#053F5C] flex items-center justify-center text-white text-3xl font-bold">
                  {getInitials(user?.name)}
                </div>
              )}
              
              {/* Profile Hover Overlay */}
              <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-all duration-300 ${imageHover.profile ? "opacity-100" : "opacity-0"}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
              </div>
            </div>
            
            {/* Camera Badge */}
            <div className="absolute -bottom-1 -left-1 w-8 h-8 rounded-full bg-[#429EBD] flex items-center justify-center shadow-lg border-2 border-slate-800 hover:scale-110 transition-transform">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
            
            {/* Remove Profile Image Button */}
            {profileImagePreview && (
              <button
                onClick={(e) => { e.stopPropagation(); handleRemoveProfileImage(); }}
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-all hover:scale-110 shadow-lg border-2 border-slate-800"
                title={language === "ar" ? "إزالة الصورة" : "Remove photo"}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
            
            {/* Hidden File Input */}
            <input
              ref={profileInputRef}
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="hidden"
            />
          </div>

          {/* User Info */}
          <div className="pt-20">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <h3 className={`text-2xl font-bold ${textColor}`}>{user?.name || "User"}</h3>
                <p className={subTextColor}>{user?.email || "user@example.com"}</p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#429EBD]/20 text-[#429EBD] text-sm font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {user?.role === "admin" ? (language === "ar" ? "مدير النظام" : "Admin") : (user?.role || "User")}
                  </span>
                  <span className={`text-sm ${subTextColor}`}>
                    {language === "ar" ? "عضو منذ يناير 2024" : "Member since Jan 2024"}
                  </span>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="flex gap-4">
                <div className="text-center px-4 py-2 rounded-xl bg-white/5">
                  <p className={`text-xl font-bold ${textColor}`}>127</p>
                  <p className={`text-xs ${subTextColor}`}>{language === "ar" ? "المهام" : "Tasks"}</p>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-white/5">
                  <p className={`text-xl font-bold ${textColor}`}>45</p>
                  <p className={`text-xs ${subTextColor}`}>{language === "ar" ? "التقارير" : "Reports"}</p>
                </div>
                <div className="text-center px-4 py-2 rounded-xl bg-white/5">
                  <p className={`text-xl font-bold ${textColor}`}>12</p>
                  <p className={`text-xs ${subTextColor}`}>{language === "ar" ? "المشاريع" : "Projects"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 rounded-xl bg-slate-800/50 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.id 
                ? "bg-[#429EBD] text-white shadow-lg" 
                : `${textColor} hover:bg-white/10`
            }`}
          >
            {tab.icon === "user" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            )}
            {tab.icon === "shield" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            )}
            {tab.icon === "activity" && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            )}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className={`rounded-2xl border-2 ${borderClass} ${cardBgClass} p-6 shadow-lg`}>
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <h4 className={`text-lg font-bold ${textColor} mb-4`}>
              {language === "ar" ? "المعلومات الشخصية" : "Personal Information"}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block ${textColor} mb-2 font-medium`}>
                  {language === "ar" ? "الاسم الكامل" : "Full Name"}
                </label>
                <input
                  type="text"
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`block ${textColor} mb-2 font-medium`}>
                  {language === "ar" ? "البريد الإلكتروني" : "Email"}
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`block ${textColor} mb-2 font-medium`}>
                  {language === "ar" ? "رقم الهاتف" : "Phone"}
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  className={inputClass}
                  dir="ltr"
                />
              </div>
              <div>
                <label className={`block ${textColor} mb-2 font-medium`}>
                  {language === "ar" ? "المسمى الوظيفي" : "Job Title"}
                </label>
                <input
                  type="text"
                  value={profileData.job_title}
                  onChange={(e) => setProfileData({ ...profileData, job_title: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={`block ${textColor} mb-2 font-medium`}>
                  {language === "ar" ? "القسم" : "Department"}
                </label>
                <input
                  type="text"
                  value={profileData.department}
                  onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="md:col-span-2">
                <label className={`block ${textColor} mb-2 font-medium`}>
                  {language === "ar" ? "نبذة شخصية" : "Bio"}
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className={`${inputClass} resize-none`}
                  rows={3}
                  placeholder={language === "ar" ? "اكتب نبذة قصيرة عنك..." : "Write a short bio about yourself..."}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-[#429EBD] to-[#053F5C] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
              >
                {saving ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "حفظ التغييرات" : "Save Changes")}
              </button>
            </div>
          </form>
        )}

        {/* Security Tab */}
        {activeTab === "security" && (
          <div className="space-y-8">
            {/* Change Password */}
            <div>
              <h4 className={`text-lg font-bold ${textColor} mb-4 flex items-center gap-2`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                {language === "ar" ? "تغيير كلمة المرور" : "Change Password"}
              </h4>
              
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className={`block ${textColor} mb-2 font-medium`}>
                    {language === "ar" ? "كلمة المرور الحالية" : "Current Password"}
                  </label>
                  <input
                    type="password"
                    value={passwordData.current_password}
                    onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={`block ${textColor} mb-2 font-medium`}>
                    {language === "ar" ? "كلمة المرور الجديدة" : "New Password"}
                  </label>
                  <input
                    type="password"
                    value={passwordData.new_password}
                    onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={`block ${textColor} mb-2 font-medium`}>
                    {language === "ar" ? "تأكيد كلمة المرور" : "Confirm Password"}
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirm_password}
                    onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                    className={inputClass}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {saving ? (language === "ar" ? "جاري التحديث..." : "Updating...") : (language === "ar" ? "تحديث كلمة المرور" : "Update Password")}
                </button>
              </form>
            </div>

            {/* Security Settings */}
            <div className="border-t border-white/10 pt-6">
              <h4 className={`text-lg font-bold ${textColor} mb-4 flex items-center gap-2`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                {language === "ar" ? "إعدادات الأمان" : "Security Settings"}
              </h4>
              
              <div className="space-y-4 max-w-md">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className={`font-medium ${textColor}`}>{language === "ar" ? "المصادقة الثنائية" : "Two-Factor Auth"}</p>
                    <p className={`text-sm ${subTextColor}`}>{language === "ar" ? "إضافة طبقة أمان إضافية" : "Add extra security layer"}</p>
                  </div>
                  <button
                    onClick={() => setSecuritySettings({ ...securitySettings, two_factor: !securitySettings.two_factor })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${securitySettings.two_factor ? "bg-emerald-500" : "bg-slate-600"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${securitySettings.two_factor ? "left-7" : "left-1"}`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className={`font-medium ${textColor}`}>{language === "ar" ? "تنبيهات تسجيل الدخول" : "Login Alerts"}</p>
                    <p className={`text-sm ${subTextColor}`}>{language === "ar" ? "إشعار عند تسجيل دخول جديد" : "Notify on new login"}</p>
                  </div>
                  <button
                    onClick={() => setSecuritySettings({ ...securitySettings, login_alerts: !securitySettings.login_alerts })}
                    className={`relative w-12 h-6 rounded-full transition-colors ${securitySettings.login_alerts ? "bg-emerald-500" : "bg-slate-600"}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${securitySettings.login_alerts ? "left-7" : "left-1"}`} />
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <p className={`font-medium ${textColor}`}>{language === "ar" ? "مهلة الجلسة" : "Session Timeout"}</p>
                    <span className={`text-sm ${subTextColor}`}>{securitySettings.session_timeout} {language === "ar" ? "دقيقة" : "min"}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={securitySettings.session_timeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, session_timeout: parseInt(e.target.value) })}
                    className="w-full h-2 rounded-full appearance-none bg-slate-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div>
            <h4 className={`text-lg font-bold ${textColor} mb-4 flex items-center gap-2`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              {language === "ar" ? "سجل النشاط الأخير" : "Recent Activity"}
            </h4>
            
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-4 rounded-xl ${theme === "dark" ? "bg-slate-800/50" : "bg-slate-100"} hover:bg-white/10 transition-all`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activity.status === "success" ? "bg-emerald-500/20" : "bg-red-500/20"
                    }`}>
                      {activity.status === "success" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                          <path d="M20 6 9 17l-5-5"/>
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className={`font-medium ${textColor}`}>{activity.action}</p>
                      <p className={`text-sm ${subTextColor}`}>{activity.device} - {activity.location}</p>
                    </div>
                  </div>
                  <div className={`text-sm ${subTextColor}`}>{activity.time}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;


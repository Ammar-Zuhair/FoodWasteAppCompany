import { useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext.jsx";
import { useLanguage } from "../contexts/LanguageContext.jsx";
import Logo from "../components/shared/Logo.jsx";

function LandingPage({ onEnter, onVisitDashboard }) {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  
  const capabilities = useMemo(() => [
    {
      title: t("unifiedDashboard"),
      desc: t("unifiedDashboardDesc"),
    },
    {
      title: t("governancePermissions"),
      desc: t("governancePermissionsDesc"),
    },
    {
      title: t("analyticsScenarios"),
      desc: t("analyticsScenariosDesc"),
    },
  ], [t]);

  const stories = useMemo(() => [
    {
      title: t("reduceWaste28"),
      detail: t("reduceWaste28Desc"),
    },
    {
      title: t("increaseDonations3x"),
      detail: t("increaseDonations3xDesc"),
    },
    {
      title: t("improveForecasting"),
      detail: t("improveForecastingDesc"),
    },
  ], [t]);

  const useCases = useMemo(() => [
    t("factoryWarehouse"),
    t("distributorsAgents"),
    t("charities"),
    t("seniorManagement"),
  ], [t]);

  const palette = useMemo(() => {
    const isDark = theme === "dark";
    return {
      pageBg: isDark ? "bg-slate-950 text-white" : "bg-white text-[#0f1d2b]",
      headerBg: isDark
        ? "bg-slate-900/80 border-white/5 backdrop-blur-xl"
        : "bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-slate-800/50 shadow-xl backdrop-blur",
      headerText: "text-white",
      navTint: isDark ? "text-white/70" : "text-white/80",
      toggleBtn: isDark
        ? "bg-slate-800/60 border-white/10 text-white hover:bg-slate-800/80"
        : "bg-white/10 text-white border-white/20 hover:bg-white/20",
      heroPanel: isDark ? "bg-[#0d1520]" : "bg-gradient-to-r from-[#CDE8F6] via-[#E4F6F8] to-[#FDE8C2]",
      heroAccent: isDark
        ? "from-emerald-400/60 via-emerald-300/40 to-amber-300/40"
        : "from-white/40 via-white/30 to-white/20",
      heroCardBorder: isDark ? "border-white/10" : "border-[#C5D7E3]",
      heroCardText: isDark ? "text-white" : "text-[#053F5C]",
      heroCardBoxBg: isDark ? "bg-white/5" : "bg-white/75",
      heroCardBoxBorder: isDark ? "border-white/10" : "border-white",
      heroCardNote: isDark ? "text-white/80" : "text-[#2f3f52]",
      subText: isDark ? "text-slate-300" : "text-[#3f5b74]",
      divider: isDark ? "border-white/10" : "border-slate-200",
      sectionBg: isDark ? "bg-[#101b2b]" : "bg-[#f8fafc]",
      cardBg: isDark ? "bg-[#141f30] border-white/5" : "bg-white border-slate-200",
      pill: isDark ? "bg-white/10 text-white" : "bg-[#E6F7FB] text-[#053F5C]",
      primaryBtn:
        "bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 text-slate-950",
      outlineBtn: isDark
        ? "border-white/30 text-white hover:bg-white/10"
        : "border-[#053F5C]/30 text-[#053F5C] hover:bg-[#E6F7FB]",
      navLink: isDark ? "text-white/80" : "text-[#f2f4f7]/80",
    };
  }, [theme]);

  const companies = ["HSA Factories", "HSA Logistics", "HSA Trading", "Charity Partners"];

  const companyText = theme === "dark" ? "text-white/70" : "text-[#46596d]";
  const storyCardClass =
    theme === "dark"
      ? "bg-white/5 border-white/10"
      : "bg-white border-[#e2e8f0] shadow-sm";

  // Mobile check
  const isMobile = window.innerWidth < 768;

  return (
    <div dir={language === "ar" ? "rtl" : "ltr"} className={`min-h-screen ${palette.pageBg} font-["Cairo"] font-semibold`}>
      <header className={`border-b ${palette.headerBg}`}>
        <div className={`w-full ${isMobile ? "px-4 py-4" : "px-8 md:px-16 py-6"} flex flex-wrap items-center justify-between gap-4 md:gap-8`}>
          <div className="flex items-center gap-2 md:gap-4">
            <Logo />
            <div className="hidden sm:block">
              <p className={`${isMobile ? "text-[10px]" : "text-sm"} uppercase tracking-[0.35em] text-white/80`}>{t("hsaGroup")}</p>
              <p className={`${isMobile ? "text-sm" : "text-lg"} font-bold text-white leading-tight`}>{t("platformTitle")}</p>
            </div>
          </div>
          <div className="flex-1 hidden lg:flex items-center justify-center">
            <nav className={`flex items-center gap-8 lg:gap-16 xl:gap-28 ${isMobile ? "text-xs" : "text-lg"} font-bold tracking-[0.25em] uppercase`}>
              <span className={`${palette.navTint} hover:text-white transition`}>{t("systemVision")}</span>
              <span className={`${palette.navTint} hover:text-white transition`}>{t("solutions")}</span>
              <span className={`${palette.navTint} hover:text-white transition`}>{t("successStories")}</span>
              <span className={`${palette.navTint} hover:text-white transition`}>{t("support")}</span>
            </nav>
          </div>
          <div className={`flex items-center gap-2 md:gap-3 lg:gap-5 ${language === "ar" ? "flex-row-reverse" : ""}`}>
            <button
              onClick={toggleLanguage}
              className={`${isMobile ? "text-xs px-3 py-1.5" : "text-sm px-5 py-2.5"} rounded-full border transition ${palette.toggleBtn}`}
            >
              {language === "ar" ? "EN" : "AR"}
            </button>
            <button
              onClick={toggleTheme}
              className={`${isMobile ? "text-xs px-3 py-1.5 hidden sm:block" : "text-sm px-5 py-2.5"} rounded-full border transition ${palette.toggleBtn}`}
            >
              {theme === "dark" ? t("lightMode") : t("darkMode")}
            </button>
            <a
              href="mailto:it@hsa-group.com"
              className={`${isMobile ? "text-xs px-3 py-1.5 hidden sm:block" : "text-sm px-6 py-2.5"} font-semibold text-[#0d0d0d] bg-white rounded-full hover:bg-[#f5f5f5] transition`}
            >
              {t("contactManagement")}
            </a>
            <button
              onClick={onEnter}
              className={`${isMobile ? "text-xs px-4 py-2" : "text-sm px-6 py-2.5"} font-semibold rounded-full bg-white/15 border border-white/30 text-white hover:bg-white/25 transition`}
            >
              {t("login")}
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className={`inline-flex px-4 py-1.5 rounded-full text-xs font-semibold ${palette.pill}`}>
              {t("trustedSolution")}
            </div>
            <h1 className="text-4xl lg:text-[56px] font-black leading-tight tracking-tight">
              {t("heroTitle")} {t("heroTitle2")}
              <span className="block text-2xl lg:text-3xl mt-3 text-[#429EBD]">
                {t("heroSubtitle")}
              </span>
            </h1>
            <p className={`text-xl leading-relaxed font-semibold ${palette.subText}`}>
              {t("heroDescription")}
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={onVisitDashboard || onEnter}
                className={`px-8 py-3.5 rounded-full text-lg font-black shadow-lg hover:shadow-xl transition ${palette.primaryBtn}`}
              >
                {t("visitDashboard")}
              </button>
              <a
                href="mailto:it@hsa-group.com"
                className={`px-6 py-3 rounded-full text-sm font-semibold border transition ${palette.outlineBtn}`}
              >
                {t("requestAccess")}
              </a>
            </div>
          </div>
          <div className={`rounded-[36px] border ${palette.heroCardBorder} ${palette.heroPanel} p-10 relative overflow-hidden`}>
            <div className={`absolute inset-0 rounded-[36px] bg-gradient-to-br ${palette.heroAccent}`} />
            <div className={`relative space-y-8 ${palette.heroCardText}`}>
              <div className={`flex items-start justify-between ${palette.heroCardText}`}>
                <div>
                  <p className="text-xs uppercase tracking-[0.45em]">{t("liveOverview")}</p>
                  <h3 className="text-3xl font-black mt-3">{t("dailyOperations")}</h3>
                </div>
              </div>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-5 ${palette.heroCardText}`}>
                <div className={`rounded-[24px] p-6 border ${palette.heroCardBoxBorder} ${palette.heroCardBoxBg} shadow-inner`}>
                  <p className="text-sm mb-2">{t("productionCapacity")}</p>
                  <p className="text-5xl font-black">92%</p>
                  <p className="text-xs mt-3">{t("lastUpdated")}</p>
                </div>
                <div className={`rounded-[24px] p-6 border ${palette.heroCardBoxBorder} ${palette.heroCardBoxBg} shadow-inner`}>
                  <p className="text-sm mb-2">{t("wasteUnderMonitoring")}</p>
                  <p className="text-4xl font-black">14 {language === "ar" ? "دفعة" : "batches"}</p>
                  <p className="text-xs mt-3">{t("forDonation")} · {t("forDisposal")}</p>
                </div>
              </div>
              <div className={`rounded-[20px] border ${palette.heroCardBoxBorder} ${palette.heroCardBoxBg} text-sm leading-relaxed ${palette.heroCardNote} p-5`}>
                {t("integrationNote")}
              </div>
            </div>
          </div>
        </section>

        {/* Companies */}
        <section className="border-y border-slate-200/20">
          <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-base font-bold">
            {companies.map((name) => (
              <div key={name} className={`uppercase tracking-widest ${companyText}`}>{name}</div>
            ))}
          </div>
        </section>

        {/* Capabilities */}
        <section className="max-w-6xl mx-auto px-6 py-16 space-y-10">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold">{t("designedForAllSectors")}</h2>
            <p className={`text-base ${palette.subText}`}>
              {t("governanceExperience")}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {capabilities.map((cap) => (
              <div key={cap.title} className={`rounded-3xl border px-6 py-8 space-y-3 ${palette.cardBg}`}>
                <h3 className="text-xl font-bold">{cap.title}</h3>
                <p className={`text-sm leading-relaxed ${palette.subText}`}>{cap.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Stories */}
        <section className={`${palette.sectionBg} py-16`}>
          <div className="max-w-6xl mx-auto px-6 space-y-10">
            <div className="space-y-3 text-center">
              <h2 className="text-3xl font-bold">{t("howTeamsUse")}</h2>
              <p className={`text-base ${palette.subText}`}>
                {t("realCases")}
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {stories.map((story) => (
                <div key={story.title} className={`rounded-3xl px-6 py-6 space-y-3 ${storyCardClass}`}>
                  <h3 className="text-lg font-bold leading-tight">{story.title}</h3>
                  <p className={`text-sm leading-relaxed ${palette.subText}`}>{story.detail}</p>
                  <button className="text-xs font-semibold underline underline-offset-4 text-[#F7AD19]">
                    {t("learnMore")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="max-w-5xl mx-auto px-6 py-16 space-y-6">
          <div className="text-center space-y-2">
            <p className={`text-xs tracking-[0.5em] ${palette.subText}`}>{t("primaryAccess")}</p>
            <h2 className="text-3xl font-bold">{t("accessPortals")}</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4 text-base font-bold">
            {useCases.map((item) => (
              <div
                key={item}
                className={`text-center rounded-2xl border px-4 py-6 tracking-wide ${palette.cardBg}`}
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className={`${palette.headerBg} text-white border-t`}>
        <div className={`w-full px-5 md:px-10 py-6 flex flex-wrap items-center justify-between gap-4 text-sm md:text-base font-bold ${language === "ar" ? "flex-row-reverse" : ""}`}>
          <div className={language === "ar" ? "text-right" : "text-left"}>
            © {new Date().getFullYear()} {t("hsaGroup")} · {t("allRightsReserved")}
          </div>
          <div className={`flex items-center gap-5 ${language === "ar" ? "flex-row-reverse" : ""}`}>
            <a href="mailto:it@hsa-group.com" className="underline underline-offset-4 hover:text-[#F7AD19] transition">
              {t("technicalSupport")}
            </a>
            <a href="#" className="underline underline-offset-4 hover:text-[#F7AD19] transition">
              {t("policiesGovernance")}
            </a>
            <span>{t("trialVersion")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;


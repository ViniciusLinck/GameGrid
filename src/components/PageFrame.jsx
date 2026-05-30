import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { CalendarDays, Home, ShieldCheck, Trophy } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import IntroKickoff from "./IntroKickoff";
import WorldBackground from "./WorldBackground";
import Footer from "./Footer";
import PrivacyBanner from "./PrivacyBanner";
import { BackgroundMoodContext } from "../hooks/useBackgroundMood";
import { useMotionPreferences } from "../hooks/useMotionPreferences";
import { motionTokens } from "../animations/motionTokens";
import { useLanguage } from "../context/LanguageContext";
import { translateTeamName } from "../utils/teamNames";
import brandLogo from "../images/Logo.jpeg";

const languageFlags = {
  "pt-BR": "🇧🇷",
  en: "🇺🇸",
  es: "🇪🇸",
};

Object.assign(languageFlags, {
  "pt-BR": "\u{1F1E7}\u{1F1F7}",
  en: "\u{1F1FA}\u{1F1F8}",
  es: "\u{1F1EA}\u{1F1F8}",
});

function decodeSegment(value = "") {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function buildCrumbs(pathname, uiText) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = [{ to: "/", label: uiText.navigation.home }];

  if (segments[0] === "time" && segments[1]) {
    const teamName = decodeSegment(segments[1]);
    crumbs.push({ label: `${uiText.navigation.team}: ${teamName}` });
    return crumbs;
  }

  if (segments[0] === "privacidade") {
    crumbs.push({ label: uiText.navigation.privacy });
    return crumbs;
  }

  return crumbs;
}

export default function PageFrame() {
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(() => location.pathname === "/");
  const [mood, setMood] = useState("idle");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const isHomeRoute = location.pathname === "/";
  const pageRef = useRef(null);
  const overlayRef = useRef(null);
  const { shouldAnimate } = useMotionPreferences();
  const { language, options, setLanguage, uiText } = useLanguage();

  const crumbs = useMemo(
    () => {
      const baseCrumbs = buildCrumbs(location.pathname, uiText);

      if (location.pathname.startsWith("/time/")) {
        const teamSlug = decodeSegment(location.pathname.split("/")[2] ?? "");
        const teamLabel = translateTeamName(teamSlug, language);
        return [
          { to: "/", label: uiText.navigation.home },
          { label: `${uiText.navigation.team}: ${teamLabel}` },
        ];
      }

      return baseCrumbs;
    },
    [language, location.pathname, uiText]
  );
  const currentLanguageFlag = languageFlags[language] ?? "\u{1F310}";

  useEffect(() => {
    document.documentElement.dataset.theme = "dark";
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > 520);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    if (!shouldAnimate || !pageRef.current || !overlayRef.current) {
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        overlayRef.current,
        { autoAlpha: 0, clipPath: "circle(0% at 50% 50%)" },
        {
          autoAlpha: 1,
          clipPath: "circle(100% at 50% 50%)",
          duration: 0.28,
          ease: motionTokens.ease.soft,
          yoyo: true,
          repeat: 1,
          repeatDelay: 0,
        }
      );

      gsap.fromTo(
        pageRef.current,
        { autoAlpha: 0, y: motionTokens.distance.sm },
        {
          autoAlpha: 1,
          y: 0,
          duration: motionTokens.duration.medium,
          ease: motionTokens.ease.enter,
          clearProps: "all",
        }
      );
    }, pageRef);

    return () => context.revert();
  }, [location.key, shouldAnimate]);

  return (
    <div className="app-shell">
      <WorldBackground mood={mood} />
      <div className="grain-layer" />

      <a href="#conteudo-principal" className="skip-link">
        {uiText.navigation.skipToContent}
      </a>

      <header className="site-header" aria-label={uiText.navigation.mainAria}>
        <div className="global-nav-row">
          <Link to="/" className="brand-link" aria-label="GameGrid">
            <img src={brandLogo} alt="GameGrid" className="brand-logo" />
            <span className="brand-wordmark" aria-hidden="true">
              <span>Game</span>
              <strong>Grid</strong>
            </span>
          </Link>

          <nav className="primary-nav" aria-label="GameGrid">
            <Link to="/">
              <Home aria-hidden="true" />
              <span>Inicio</span>
            </Link>
            <Link to="/#jogos-copa">
              <CalendarDays aria-hidden="true" />
              <span>Partidas</span>
            </Link>
            <Link to="/">
              <Trophy aria-hidden="true" />
              <span>Grupos</span>
            </Link>
            <Link to="/privacidade">
              <ShieldCheck aria-hidden="true" />
              <span>Privacidade</span>
            </Link>
          </nav>

          <div className="global-nav-controls">
            <div className="language-switcher">
              <label htmlFor="language-select" className="language-switcher-label">
                {uiText.language.label}
              </label>
              <span className="language-current-flag" aria-hidden="true">
                {currentLanguageFlag}
              </span>
              <select
                id="language-select"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                aria-label={uiText.language.aria}
                className="language-select"
              >
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {(languageFlags[option.value] ?? "🌐") + " " + option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      <nav className="breadcrumbs" aria-label={uiText.navigation.breadcrumbsAria}>
        {crumbs.map((crumb, index) => (
          <span key={`${crumb.label}-${index}`} className="breadcrumb-item">
            {crumb.to ? <Link to={crumb.to}>{crumb.label}</Link> : <strong>{crumb.label}</strong>}
          </span>
        ))}
      </nav>

      <PrivacyBanner />

      {showIntro && isHomeRoute ? <IntroKickoff onFinish={() => setShowIntro(false)} /> : null}
      <div className="route-transition-layer" ref={overlayRef} />

      <BackgroundMoodContext.Provider
        value={{
          mood,
          setBackgroundMood: setMood,
        }}
      >
        <main className="page-content" ref={pageRef} id="conteudo-principal">
          <Outlet />
        </main>
        <Footer />
      </BackgroundMoodContext.Provider>

      <button
        type="button"
        className={`back-to-top ${showBackToTop ? "visible" : ""}`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label={uiText.common.backToTop}
      >
        {uiText.common.backToTop}
      </button>
    </div>
  );
}

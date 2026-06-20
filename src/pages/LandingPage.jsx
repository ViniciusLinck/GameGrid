import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import MatchCard, { MatchCardSkeleton } from "../components/MatchCard";
import { useBackgroundMood } from "../hooks/useBackgroundMood";
import { seoDefaults, useSeo } from "../hooks/useSeo";
import { useWorldCup2026Matches } from "../hooks/useWorldCup2026Matches";
import { useLanguage } from "../context/LanguageContext";
import {
  formatDayHeading,
  getFeaturedMatchState,
  groupMatchesByDay,
  getMatchStatus,
} from "../utils/matchUtils";
import logo from "../images/Logo.jpeg";

export default function LandingPage() {
  const { matches, isLoading } = useWorldCup2026Matches();
  const { language, locale, uiText } = useLanguage();
  const { setBackgroundMood } = useBackgroundMood();

  useEffect(() => {
    setBackgroundMood("idle");
    return () => setBackgroundMood("transition");
  }, [setBackgroundMood]);

  const upcomingMatches = useMemo(
    () => matches.filter((match) => getMatchStatus(match) === "upcoming"),
    [matches]
  );
  const featuredMatchState = useMemo(
    () => getFeaturedMatchState(upcomingMatches),
    [upcomingMatches]
  );
  const matchesByDay = useMemo(() => groupMatchesByDay(upcomingMatches), [upcomingMatches]);

  useSeo({
    title: "GameGrid | Inicio",
    description: "Partida em destaque e proximas partidas da Copa do Mundo 2026.",
    path: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "GameGrid",
      url: `${seoDefaults.siteUrl}/`,
      inLanguage: locale,
    },
  });

  return (
    <div>
      <header className="hero" id="inicio-copa">
        <div className="hero-brand-panel">
          <div className="hero-brand-copy">
            <img src={logo} alt="GameGrid" className="hero-logo" />
            <div>
              <h1 className="hero-title">
                <span>Game</span>
                <strong>Grid</strong>
              </h1>
              <p className="hero-tagline">A Copa do Mundo, na sua tela.</p>
            </div>
          </div>
        </div>
        <p className="hero-subtitle">
          Confira as partidas que ainda vao acontecer na Copa do Mundo 2026.
        </p>

        <nav className="hero-shortcuts" aria-label={uiText.home.shortcutsAria}>
          <Link to="/partidas">Partidas</Link>
          <Link to="/grupos">Grupos</Link>
        </nav>
      </header>

      {featuredMatchState.match ? (
        <section className="featured-match-section page-card" aria-label={uiText.home.featuredMatch}>
          <div className="featured-match-copy">
            <span className="featured-match-kicker">
              {uiText.home.upcomingMatch}
            </span>
            <h2>{uiText.home.featuredMatch}</h2>
          </div>
          <MatchCard match={featuredMatchState.match} featured />
        </section>
      ) : isLoading ? (
        <MatchCardSkeleton featured />
      ) : null}

      <main className="calendar" id="inicio-partidas">
        {matchesByDay.length === 0 ? (
          isLoading ? (
            <section className="day-group" aria-label={uiText.common.loadingMatches}>
              <div className="day-group-header skeleton-card">
                <div className="skeleton-row w-60" />
                <div className="skeleton-row w-70" />
              </div>
              <div className="match-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <MatchCardSkeleton key={`home-skeleton-${index}`} featured={index === 0} />
                ))}
              </div>
            </section>
          ) : null
        ) : (
          matchesByDay.map((day) => (
            <section className="day-group" key={day.date}>
              <div className="day-group-header">
                <h2>{formatDayHeading(day.date, locale)}</h2>
                <span>{uiText.home.matchCount(day.matches.length)}</span>
              </div>

              <div className="match-grid">
                {day.matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      <section className="page-card home-summary-strip">
        <p>
          {matches.length > 0
            ? `${upcomingMatches.length} proximas partidas. Na tela Partidas voce encontra todos os jogos.`
            : uiText.common.loadingMatches}
        </p>
        <Link to="/partidas" className="match-action-watch">
          Ver todas
        </Link>
      </section>
    </div>
  );
}

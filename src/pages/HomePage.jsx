import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import MatchCard from "../components/MatchCard";
import { FALLBACK_MATCHES_2026 } from "../data/matches2026";
import { uiText } from "../data/uiText";
import { motionTokens } from "../animations/motionTokens";
import { captureRects, playFlip } from "../animations/flip";
import { useMotionPreferences } from "../hooks/useMotionPreferences";
import { useBackgroundMood } from "../hooks/useBackgroundMood";
import { seoDefaults, useSeo } from "../hooks/useSeo";
import { fetchWorldCupMatches2026 } from "../services/worldCupApi";
import logo from "../../assets/logo.svg";

const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  weekday: "long",
});

function formatDayHeading(dateISO) {
  const formatted = dayFormatter.format(new Date(`${dateISO}T12:00:00`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getNextMatchLabel(match) {
  const date = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${match.date}T12:00:00`));

  return `Jogo ${match.id} | ${date} ${match.kickoff}`;
}

export default function HomePage() {
  const [selectedStage, setSelectedStage] = useState(uiText.home.allStages);
  const [teamQuery, setTeamQuery] = useState("");
  const [matches, setMatches] = useState(FALLBACK_MATCHES_2026);
  const [displayedTotal, setDisplayedTotal] = useState(FALLBACK_MATCHES_2026.length);
  const [displayedNext, setDisplayedNext] = useState("N/D");
  const appRef = useRef(null);
  const heroRef = useRef(null);
  const listRef = useRef(null);
  const previousRectsRef = useRef(new Map());
  const previousTotalRef = useRef(FALLBACK_MATCHES_2026.length);
  const { shouldAnimate } = useMotionPreferences();
  const { setBackgroundMood } = useBackgroundMood();

  useEffect(() => {
    setBackgroundMood(selectedStage === uiText.home.allStages ? "idle" : "focus");
  }, [selectedStage, setBackgroundMood]);

  useEffect(() => () => setBackgroundMood("transition"), [setBackgroundMood]);

  useEffect(() => {
    let mounted = true;

    const loadMatches = ({ force = false } = {}) => {
      if (!force && (document.hidden || !navigator.onLine)) {
        return;
      }

      fetchWorldCupMatches2026().then((result) => {
        if (!mounted) {
          return;
        }
        setMatches(result.matches);
      });
    };

    loadMatches({ force: true });

    // Adiciona jitter para reduzir picos simultaneos de requisicoes em larga escala.
    const jitterMs = Math.floor(Math.random() * 20000);
    const intervalId = window.setInterval(loadMatches, 300000 + jitterMs);
    const onVisibility = () => {
      if (!document.hidden) {
        loadMatches({ force: true });
      }
    };
    const onOnline = () => loadMatches({ force: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  const stageOptions = useMemo(() => {
    const allStages = new Set(matches.map((match) => match.stage));
    return [uiText.home.allStages, ...Array.from(allStages)];
  }, [matches]);

  const filteredMatches = useMemo(() => {
    const normalizedQuery = teamQuery.trim().toLowerCase();

    return matches.filter((match) => {
      const matchesStage =
        selectedStage === uiText.home.allStages ? true : match.stage === selectedStage;
      const matchesTeam =
        normalizedQuery.length === 0
          ? true
          : `${match.homeTeam.name} ${match.awayTeam.name}`.toLowerCase().includes(normalizedQuery);

      return matchesStage && matchesTeam;
    });
  }, [matches, selectedStage, teamQuery]);

  const matchesByDay = useMemo(() => {
    const grouped = new Map();
    for (const match of filteredMatches) {
      if (!grouped.has(match.date)) {
        grouped.set(match.date, []);
      }
      grouped.get(match.date).push(match);
    }

    return Array.from(grouped.entries()).map(([date, groupMatches]) => ({
      date,
      matches: groupMatches,
    }));
  }, [filteredMatches]);

  const nextMatch = useMemo(() => {
    const now = new Date();
    return (
      matches.find((match) => {
        const kickoffDate = new Date(`${match.date}T${match.kickoff}:00`);
        return kickoffDate >= now;
      }) ?? matches[matches.length - 1]
    );
  }, [matches]);

  useSeo({
    title: "GameGrid | Calendário da Copa do Mundo 2026",
    description: `Veja os ${matches.length} jogos da Copa de 2026 com filtros por fase, locais e horários atualizados.`,
    path: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Calendário da Copa do Mundo 2026",
      description:
        "Calendário interativo da Copa de 2026 com detalhes de times, jogadores, estádios e horários.",
      url: `${seoDefaults.siteUrl}/`,
      inLanguage: "pt-BR",
      mainEntity: {
        "@type": "ItemList",
        itemListElement: matches.slice(0, 15).map((match, index) => ({
          "@type": "SportsEvent",
          position: index + 1,
          name: `${match.homeTeam.name} x ${match.awayTeam.name}`,
          startDate: `${match.date}T${match.kickoff}:00`,
          location: {
            "@type": "Place",
            name: match.venue.stadium,
            address: match.venue.city,
          },
        })),
      },
    },
  });

  useEffect(() => {
    const nextLabel = nextMatch ? getNextMatchLabel(nextMatch) : "N/D";
    setDisplayedNext(nextLabel);

    if (!shouldAnimate) {
      setDisplayedTotal(matches.length);
      previousTotalRef.current = matches.length;
      return;
    }

    const proxy = { value: previousTotalRef.current };
    const tween = gsap.to(proxy, {
      value: matches.length,
      duration: motionTokens.duration.medium,
      ease: motionTokens.ease.soft,
      onUpdate: () => {
        const value = Math.round(proxy.value);
        previousTotalRef.current = value;
        setDisplayedTotal(value);
      },
    });

    return () => tween.kill();
  }, [matches.length, nextMatch, shouldAnimate]);

  useEffect(() => {
    if (!heroRef.current || !shouldAnimate) {
      return undefined;
    }

    const hero = heroRef.current;

    const onMove = (event) => {
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      gsap.to(".hero-logo", {
        x: x * 16,
        y: y * 12,
        duration: 0.35,
        ease: motionTokens.ease.soft,
      });
      gsap.to(".hero-title", {
        x: x * 10,
        y: y * 8,
        duration: 0.35,
        ease: motionTokens.ease.soft,
      });
      gsap.to(".hero-subtitle", {
        x: x * 8,
        y: y * 6,
        duration: 0.35,
        ease: motionTokens.ease.soft,
      });
    };

    const onLeave = () => {
      gsap.to(".hero-logo, .hero-title, .hero-subtitle", {
        x: 0,
        y: 0,
        duration: 0.35,
        ease: motionTokens.ease.soft,
      });
    };

    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);

    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
    };
  }, [shouldAnimate]);

  useLayoutEffect(() => {
    if (!shouldAnimate) {
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        [".hero-logo", ".hero-title", ".hero-subtitle"],
        { opacity: 0, y: motionTokens.distance.md },
        {
          opacity: 1,
          y: 0,
          duration: motionTokens.duration.slow,
          stagger: motionTokens.stagger.regular,
          ease: motionTokens.ease.enter,
        }
      );

      gsap.fromTo(
        ".dashboard-bar",
        { opacity: 0, y: motionTokens.distance.sm },
        {
          opacity: 1,
          y: 0,
          duration: motionTokens.duration.medium,
          delay: 0.15,
          ease: motionTokens.ease.soft,
        }
      );
    }, appRef);

    return () => context.revert();
  }, [shouldAnimate]);

  useLayoutEffect(() => {
    if (!listRef.current || !shouldAnimate) {
      previousRectsRef.current = captureRects(listRef.current, "[data-flip-key]");
      return undefined;
    }

    playFlip(listRef.current, "[data-flip-key]", previousRectsRef.current, {
      duration: motionTokens.duration.medium,
      ease: motionTokens.ease.soft,
    });

    const context = gsap.context(() => {
      const days = gsap.utils.toArray(".day-group");
      days.forEach((day, dayIndex) => {
        const header = day.querySelector(".day-group-header");
        const cards = day.querySelectorAll(".match-card");

        gsap.fromTo(
          header,
          { opacity: 0, y: motionTokens.distance.sm },
          {
            opacity: 1,
            y: 0,
            duration: motionTokens.duration.fast,
            ease: motionTokens.ease.soft,
            delay: dayIndex * 0.04,
          }
        );

        gsap.fromTo(
          cards,
          { opacity: 0, y: motionTokens.distance.sm },
          {
            opacity: 1,
            y: 0,
            duration: motionTokens.duration.fast,
            ease: motionTokens.ease.soft,
            stagger: motionTokens.stagger.tight,
            delay: dayIndex * 0.04 + 0.05,
            clearProps: "all",
          }
        );
      });
    }, listRef);

    previousRectsRef.current = captureRects(listRef.current, "[data-flip-key]");

    return () => context.revert();
  }, [filteredMatches, selectedStage, shouldAnimate, teamQuery]);

  const hasActiveFilters =
    selectedStage !== uiText.home.allStages || teamQuery.trim().length > 0;

  function clearFilters() {
    setSelectedStage(uiText.home.allStages);
    setTeamQuery("");
  }

  return (
    <div ref={appRef}>
      <header className="hero" ref={heroRef} id="resumo-copa">
        <img src={logo} alt="Logo do GameGrid" className="hero-logo" />
        <h1 className="hero-title">{uiText.home.title}</h1>
        <p className="hero-subtitle">{uiText.home.subtitle}</p>

        <div className="dashboard-bar">
          <div className="dashboard-row dashboard-row-top">
            <div className="dashboard-item dashboard-kpi">
              {uiText.home.totalMatches(displayedTotal)}
            </div>
            <div className="dashboard-item dashboard-kpi">{uiText.home.nextMatch(displayedNext)}</div>

            <div className="dashboard-item dashboard-control">
              <label htmlFor="stage-select" className="dashboard-label">
                {uiText.home.stage}
              </label>
              <select
                id="stage-select"
                value={selectedStage}
                onChange={(event) => setSelectedStage(event.target.value)}
              >
                {stageOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="dashboard-row dashboard-row-bottom">
            <div className="dashboard-item dashboard-control dashboard-search">
              <label htmlFor="team-search" className="dashboard-label">
                {uiText.home.searchTeam}
              </label>
              <input
                id="team-search"
                type="search"
                value={teamQuery}
                placeholder={uiText.home.searchPlaceholder}
                onChange={(event) => setTeamQuery(event.target.value)}
              />
            </div>

            <div className="dashboard-item dashboard-action">
              <button
                type="button"
                className="dashboard-clear-btn"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
              >
                {uiText.home.clearSearch}
              </button>
            </div>
          </div>
        </div>

        <nav className="hero-shortcuts" aria-label="Atalhos da pagina">
          <a href="#resumo-copa">Resumo</a>
          <a href="#jogos-copa">Jogos</a>
        </nav>
      </header>

      <main className="calendar" ref={listRef} id="jogos-copa">
        {matchesByDay.length === 0 ? (
          <section className="page-card">
            {hasActiveFilters ? uiText.home.noMatchesWithFilter : uiText.common.loadingMatches}
          </section>
        ) : null}

        {matchesByDay.map((day) => (
          <section className="day-group" key={day.date} data-flip-key={`dia-${day.date}`}>
            <div className="day-group-header">
              <h2>{formatDayHeading(day.date)}</h2>
              <span>{day.matches.length} jogos</span>
            </div>

            <div className="match-grid">
              {day.matches.map((match) => (
                <div key={match.id} data-flip-key={`jogo-${match.id}`}>
                  <MatchCard match={match} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

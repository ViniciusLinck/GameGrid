import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MatchCard, { MatchCardSkeleton } from "../components/MatchCard";
import { uiText } from "../data/uiText";
import { motionTokens } from "../animations/motionTokens";
import { captureRects, playFlip } from "../animations/flip";
import { useMotionPreferences } from "../hooks/useMotionPreferences";
import { useBackgroundMood } from "../hooks/useBackgroundMood";
import { seoDefaults, useSeo } from "../hooks/useSeo";
import { fetchWorldCupMatches2026 } from "../services/worldCupApi";
import { getFlagByTeamName, normalizeTeamName, normalizeText } from "../utils/flags";
import logo from "../../assets/logo.svg";

const dayFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  weekday: "long",
});

gsap.registerPlugin(ScrollTrigger);

function formatDayHeading(dateISO) {
  const formatted = dayFormatter.format(new Date(`${dateISO}T12:00:00`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getSourceSummary(sourceLabel) {
  switch (sourceLabel) {
    case "fifa-official":
      return "Fonte oficial: API de calendario da FIFA";
    case "local":
      return "Fonte: calendario local de contingencia";
    default:
      return "Fonte: calendario sincronizado";
  }
}

function teamKeyFromName(teamName) {
  return normalizeTeamName(teamName);
}

function getNextMatchLabel(match) {
  const startDate = getMatchStartDate(match);
  if (!startDate) {
    const date = new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    }).format(new Date(`${match.date}T12:00:00`));
    return `Jogo ${match.id} | ${date} ${match.kickoff}`;
  }

  const label = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(startDate);

  return `Jogo ${match.id} | ${label.replace(",", "")}`;
}

function getMatchStartDate(match) {
  if (match?.kickoffUtc) {
    const startDate = new Date(match.kickoffUtc);
    if (!Number.isNaN(startDate.getTime())) {
      return startDate;
    }
  }

  const fallbackDate = new Date(`${match?.date}T${match?.kickoff ?? "00:00"}:00`);
  return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
}

function MatchFiltersBar({
  idPrefix,
  stageOptions,
  selectedStage,
  onStageChange,
  dayOptions,
  selectedDay,
  onDayChange,
  teamOptions,
  selectedTeamKey,
  onTeamToggle,
  teamQuery,
  onTeamQueryChange,
  hasActiveFilters,
  onClear,
  filteredCount,
  sourceSummary,
  compact = false,
}) {
  return (
    <>
      <div className={`dashboard-row ${compact ? "dashboard-row-compact" : "dashboard-row-bottom"}`}>
        <div className="dashboard-item dashboard-control">
          <label htmlFor={`${idPrefix}-stage-select`} className="dashboard-label">
            {uiText.home.stage}
          </label>
          <select
            id={`${idPrefix}-stage-select`}
            value={selectedStage}
            onChange={(event) => onStageChange(event.target.value)}
          >
            {stageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="dashboard-item dashboard-control">
          <label htmlFor={`${idPrefix}-day-select`} className="dashboard-label">
            {uiText.home.day}
          </label>
          <select
            id={`${idPrefix}-day-select`}
            value={selectedDay}
            onChange={(event) => onDayChange(event.target.value)}
          >
            {dayOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="dashboard-item dashboard-control dashboard-search">
          <label htmlFor={`${idPrefix}-team-search`} className="dashboard-label">
            {uiText.home.searchTeam}
          </label>
          <input
            id={`${idPrefix}-team-search`}
            type="search"
            value={teamQuery}
            placeholder={uiText.home.searchPlaceholder}
            onChange={(event) => onTeamQueryChange(event.target.value)}
          />
        </div>

        <div className="dashboard-item dashboard-action">
          <button
            type="button"
            className="dashboard-clear-btn"
            onClick={onClear}
            disabled={!hasActiveFilters}
          >
            {uiText.home.clearSearch}
          </button>
        </div>
      </div>

      <div className="dashboard-meta-row">
        <p className="dashboard-source-note">{sourceSummary}</p>
        <p className="dashboard-filtered-note">{uiText.home.visibleMatches(filteredCount)}</p>
      </div>

      <div className={`team-filter-strip ${compact ? "team-filter-strip-compact" : ""}`}>
        {teamOptions.map((team) => {
          const flagSrc = team.flagSrc || getFlagByTeamName(team.name);
          const isActive = selectedTeamKey === team.key;

          return (
            <button
              key={team.key}
              type="button"
              className={`team-filter-chip ${isActive ? "active" : ""}`}
              onClick={() => onTeamToggle(team.key)}
              aria-pressed={isActive}
              title={`${isActive ? "Remover filtro de" : "Filtrar por"} ${team.name}`}
            >
              <span className="team-filter-flag" aria-hidden="true">
                {flagSrc ? <img src={flagSrc} alt="" loading="lazy" /> : <span>{team.shortName}</span>}
              </span>
              <span className="team-filter-name">{team.name}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export default function HomePage() {
  const [selectedStage, setSelectedStage] = useState(uiText.home.allStages);
  const [selectedDay, setSelectedDay] = useState(uiText.home.allDays);
  const [selectedTeamKey, setSelectedTeamKey] = useState("");
  const [teamQuery, setTeamQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [matchesSource, setMatchesSource] = useState("local");
  const [displayedTotal, setDisplayedTotal] = useState(0);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [displayedNext, setDisplayedNext] = useState("N/D");
  const [showStickyNav, setShowStickyNav] = useState(false);
  const appRef = useRef(null);
  const heroRef = useRef(null);
  const heroSentinelRef = useRef(null);
  const listRef = useRef(null);
  const previousRectsRef = useRef(new Map());
  const previousTotalRef = useRef(0);
  const hasLoadedMatchesRef = useRef(false);
  const hasInitRevealRef = useRef(false);
  const { shouldAnimate } = useMotionPreferences();
  const { setBackgroundMood } = useBackgroundMood();
  const sourceSummary = useMemo(() => getSourceSummary(matchesSource), [matchesSource]);
  const hasActiveFilters =
    selectedStage !== uiText.home.allStages ||
    selectedDay !== uiText.home.allDays ||
    selectedTeamKey.length > 0 ||
    teamQuery.trim().length > 0;

  useEffect(() => {
    setBackgroundMood(hasActiveFilters ? "focus" : "idle");
  }, [hasActiveFilters, setBackgroundMood]);

  useEffect(() => () => setBackgroundMood("transition"), [setBackgroundMood]);

  useEffect(() => {
    const sentinel = heroSentinelRef.current;
    if (!sentinel) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyNav(!entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadMatches = ({ force = false } = {}) => {
      if (!force && (document.hidden || !navigator.onLine)) {
        return;
      }

      if (!hasLoadedMatchesRef.current) {
        setIsLoadingMatches(true);
      }

      fetchWorldCupMatches2026().then((result) => {
        if (!mounted) {
          return;
        }
        setMatches(result.matches);
        setMatchesSource(result.sourceLabel ?? "local");
        if (!hasLoadedMatchesRef.current) {
          setIsLoadingMatches(false);
          hasLoadedMatchesRef.current = true;
        }
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

  const dayOptions = useMemo(
    () => [
      { value: uiText.home.allDays, label: uiText.home.allDays },
      ...Array.from(new Set(matches.map((match) => match.date))).map((date) => ({
        value: date,
        label: formatDayHeading(date),
      })),
    ],
    [matches]
  );

  const teamOptions = useMemo(() => {
    const uniqueTeams = new Map();

    for (const match of matches) {
      for (const team of [match.homeTeam, match.awayTeam]) {
        if (!team?.name || team.isPlaceholder) {
          continue;
        }

        const key = teamKeyFromName(team.name);
        if (!key || uniqueTeams.has(key)) {
          continue;
        }

        uniqueTeams.set(key, {
          key,
          name: team.name,
          shortName: team.name.slice(0, 2).toUpperCase(),
          flagSrc: team.flagSrc ?? "",
        });
      }
    }

    return Array.from(uniqueTeams.values()).sort((left, right) =>
      left.name.localeCompare(right.name, "pt-BR")
    );
  }, [matches]);

  const filteredMatches = useMemo(() => {
    const rawQuery = normalizeText(teamQuery);
    const canonicalQuery = normalizeTeamName(teamQuery);
    const queryTerms = Array.from(new Set([rawQuery, canonicalQuery].filter(Boolean)));

    return matches.filter((match) => {
      const matchesStage =
        selectedStage === uiText.home.allStages ? true : match.stage === selectedStage;
      const matchesDay = selectedDay === uiText.home.allDays ? true : match.date === selectedDay;
      const matchesSelectedTeam =
        selectedTeamKey.length === 0
          ? true
          : [match.homeTeam.name, match.awayTeam.name].some(
              (teamName) => teamKeyFromName(teamName) === selectedTeamKey
            );
      const matchesTeam =
        queryTerms.length === 0
          ? true
          : [match.homeTeam.name, match.awayTeam.name].some((teamName) => {
              const teamTerms = Array.from(
                new Set([normalizeText(teamName), normalizeTeamName(teamName)].filter(Boolean))
              );

              return queryTerms.some((queryTerm) =>
                teamTerms.some((teamTerm) => teamTerm.includes(queryTerm))
              );
            });

      return matchesStage && matchesDay && matchesSelectedTeam && matchesTeam;
    });
  }, [matches, selectedDay, selectedStage, selectedTeamKey, teamQuery]);

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
        const kickoffDate = getMatchStartDate(match);
        return kickoffDate ? kickoffDate >= now : false;
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
          startDate:
            getMatchStartDate(match)?.toISOString() ?? `${match.date}T${match.kickoff}:00`,
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
    if (!listRef.current) {
      return undefined;
    }

    if (!shouldAnimate) {
      previousRectsRef.current = captureRects(listRef.current, "[data-flip-key]");
      return undefined;
    }

    playFlip(listRef.current, "[data-flip-key]", previousRectsRef.current, {
      duration: motionTokens.duration.medium,
      ease: motionTokens.ease.soft,
    });

    previousRectsRef.current = captureRects(listRef.current, "[data-flip-key]");
    return undefined;
  }, [filteredMatches, selectedDay, selectedStage, selectedTeamKey, shouldAnimate, teamQuery]);

  useLayoutEffect(() => {
    if (!listRef.current || !shouldAnimate || hasInitRevealRef.current || matchesByDay.length === 0) {
      return undefined;
    }

    hasInitRevealRef.current = true;

    const context = gsap.context(() => {
      const days = gsap.utils.toArray(".day-group[data-flip-key]");
      days.forEach((day) => {
        const header = day.querySelector(".day-group-header");
        const cards = day.querySelectorAll('[data-flip-key^="jogo-"]');

        if (header) {
          gsap.set(header, { autoAlpha: 0, y: motionTokens.distance.sm });
        }
        if (cards.length > 0) {
          gsap.set(cards, { autoAlpha: 0, y: motionTokens.distance.sm });
        }

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: day,
            start: "top 80%",
            once: true,
          },
        });

        if (header) {
          timeline.to(header, {
            autoAlpha: 1,
            y: 0,
            duration: motionTokens.duration.fast,
            ease: motionTokens.ease.soft,
            clearProps: "transform,opacity",
          });
        }

        if (cards.length > 0) {
          timeline.to(
            cards,
            {
              autoAlpha: 1,
              y: 0,
              duration: motionTokens.duration.fast,
              ease: motionTokens.ease.soft,
              stagger: motionTokens.stagger.tight,
              clearProps: "transform,opacity",
            },
            header ? 0.05 : 0
          );
        }
      });
    }, listRef);

    ScrollTrigger.refresh();

    return () => context.revert();
  }, [matchesByDay.length, shouldAnimate]);

  function clearFilters() {
    setSelectedStage(uiText.home.allStages);
    setSelectedDay(uiText.home.allDays);
    setSelectedTeamKey("");
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
          </div>

          <MatchFiltersBar
            idPrefix="hero"
            stageOptions={stageOptions}
            selectedStage={selectedStage}
            onStageChange={setSelectedStage}
            dayOptions={dayOptions}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            teamOptions={teamOptions}
            selectedTeamKey={selectedTeamKey}
            onTeamToggle={(teamKey) => {
              setSelectedTeamKey((current) => (current === teamKey ? "" : teamKey));
              setTeamQuery("");
            }}
            teamQuery={teamQuery}
            onTeamQueryChange={(value) => {
              setTeamQuery(value);
              if (value.trim()) {
                setSelectedTeamKey("");
              }
            }}
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
            filteredCount={filteredMatches.length}
            sourceSummary={sourceSummary}
          />
        </div>

        <nav className="hero-shortcuts" aria-label="Atalhos da pagina">
          <a href="#resumo-copa">Resumo</a>
          <a href="#jogos-copa">Jogos</a>
        </nav>
      </header>
      <div ref={heroSentinelRef} className="hero-sentinel" aria-hidden="true" />

      {showStickyNav ? (
        <div className="home-sticky-nav" aria-label="Navegacao rapida">
          <MatchFiltersBar
            idPrefix="sticky"
            stageOptions={stageOptions}
            selectedStage={selectedStage}
            onStageChange={setSelectedStage}
            dayOptions={dayOptions}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            teamOptions={teamOptions}
            selectedTeamKey={selectedTeamKey}
            onTeamToggle={(teamKey) => {
              setSelectedTeamKey((current) => (current === teamKey ? "" : teamKey));
              setTeamQuery("");
            }}
            teamQuery={teamQuery}
            onTeamQueryChange={(value) => {
              setTeamQuery(value);
              if (value.trim()) {
                setSelectedTeamKey("");
              }
            }}
            hasActiveFilters={hasActiveFilters}
            onClear={clearFilters}
            filteredCount={filteredMatches.length}
            sourceSummary={sourceSummary}
            compact
          />
          <nav className="hero-shortcuts hero-shortcuts-compact" aria-label="Atalhos rapidos">
            <a href="#resumo-copa">Resumo</a>
            <a href="#jogos-copa">Jogos</a>
          </nav>
        </div>
      ) : null}

      <main className="calendar" ref={listRef} id="jogos-copa">
        {matchesByDay.length === 0 ? (
          hasActiveFilters ? (
            <section className="page-card">{uiText.home.noMatchesWithFilter}</section>
          ) : isLoadingMatches ? (
            <section className="day-group" aria-label="Carregando jogos">
              <div className="day-group-header skeleton-card">
                <div className="skeleton-row w-60" />
                <div className="skeleton-row w-70" />
              </div>
              <div className="match-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <MatchCardSkeleton
                    key={`skeleton-${index}`}
                    featured={index === 0}
                  />
                ))}
              </div>
            </section>
          ) : (
            <section className="page-card">{uiText.common.loadingMatches}</section>
          )
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

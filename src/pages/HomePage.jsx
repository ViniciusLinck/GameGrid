import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MatchCard, { MatchCardSkeleton } from "../components/MatchCard";
import { motionTokens } from "../animations/motionTokens";
import { captureRects, playFlip } from "../animations/flip";
import { useMotionPreferences } from "../hooks/useMotionPreferences";
import { useBackgroundMood } from "../hooks/useBackgroundMood";
import { seoDefaults, useSeo } from "../hooks/useSeo";
import { fetchWorldCupMatches2026 } from "../services/worldCupApi";
import { normalizeTeamName, normalizeText } from "../utils/flags";
import { useLanguage } from "../context/LanguageContext";
import logo from "../../assets/logo.svg";

const ALL_STAGES = "all";
const ALL_DAYS = "all";
const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;

gsap.registerPlugin(ScrollTrigger);

function formatDayHeading(dateISO, locale) {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    weekday: "long",
  });
  const formatted = formatter.format(new Date(`${dateISO}T12:00:00`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function getSourceSummary(sourceLabel, uiText) {
  switch (sourceLabel) {
    case "fifa-official":
      return uiText.home.sourceOfficial;
    case "local":
      return uiText.home.sourceFallback;
    default:
      return uiText.home.sourceSynced;
  }
}

function teamKeyFromName(teamName) {
  return normalizeTeamName(teamName);
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

function getNextMatchLabel(match, locale, uiText) {
  const startDate = getMatchStartDate(match);
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
  });

  if (!startDate) {
    const date = dateFormatter.format(new Date(`${match.date}T12:00:00`));
    return `${uiText.match.matchNumber(match.id)} | ${date} ${match.kickoff}`;
  }

  const label = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(startDate);

  return `${uiText.match.matchNumber(match.id)} | ${label.replace(",", "")}`;
}

function getFeaturedMatchState(matches) {
  const now = new Date();
  const liveMatch = matches.find((match) => {
    const kickoffDate = getMatchStartDate(match);
    if (!kickoffDate) {
      return false;
    }

    const startTime = kickoffDate.getTime();
    return now.getTime() >= startTime && now.getTime() < startTime + MATCH_DURATION_MS;
  });

  if (liveMatch) {
    return { match: liveMatch, mode: "live" };
  }

  const nextMatch = matches.find((match) => {
    const kickoffDate = getMatchStartDate(match);
    return kickoffDate ? kickoffDate >= now : false;
  });

  if (nextMatch) {
    return { match: nextMatch, mode: "upcoming" };
  }

  return { match: matches[0] ?? null, mode: "upcoming" };
}

function MatchFiltersBar({
  idPrefix,
  locale,
  uiText,
  stageOptions,
  selectedStageKey,
  onStageChange,
  dayOptions,
  selectedDay,
  onDayChange,
  teamOptions,
  selectedTeamKey,
  onTeamChange,
  teamQuery,
  onTeamQueryChange,
  hasActiveFilters,
  onClear,
  filteredCount,
  sourceSummary,
  compact = false,
}) {
  const [showRefinedSearch, setShowRefinedSearch] = useState(() => !compact);

  useEffect(() => {
    if (!compact) {
      setShowRefinedSearch(true);
    }
  }, [compact]);

  useEffect(() => {
    if (teamQuery.trim()) {
      setShowRefinedSearch(true);
    }
  }, [teamQuery]);

  return (
    <section className={`dashboard-filters ${compact ? "dashboard-filters-compact" : ""}`}>
      <div className="dashboard-filters-head">
        <div>
          <p className="dashboard-filters-kicker">{uiText.home.filtersTitle}</p>
          {!compact ? <p className="dashboard-filters-copy">{uiText.home.filtersSubtitle}</p> : null}
        </div>

        <button
          type="button"
          className="dashboard-search-toggle"
          onClick={() => setShowRefinedSearch((value) => !value)}
          aria-expanded={showRefinedSearch}
          aria-controls={`${idPrefix}-refined-search`}
        >
          {showRefinedSearch ? uiText.home.searchToggleClose : uiText.home.searchToggleOpen}
        </button>
      </div>

      <div className={`dashboard-row ${compact ? "dashboard-row-compact" : "dashboard-row-bottom"} dashboard-row-primary`}>
        <div className="dashboard-item dashboard-control dashboard-item-priority">
          <label htmlFor={`${idPrefix}-stage-select`} className="dashboard-label">
            {uiText.home.stage}
          </label>
          <select
            id={`${idPrefix}-stage-select`}
            value={selectedStageKey}
            onChange={(event) => onStageChange(event.target.value)}
          >
            {stageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="dashboard-item dashboard-control dashboard-item-priority">
          <label htmlFor={`${idPrefix}-team-select`} className="dashboard-label">
            {uiText.home.team}
          </label>
          <select
            id={`${idPrefix}-team-select`}
            value={selectedTeamKey}
            onChange={(event) => onTeamChange(event.target.value)}
          >
            <option value="">{uiText.home.allTeams}</option>
            {teamOptions.map((team) => (
              <option key={team.key} value={team.key}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div className="dashboard-item dashboard-control dashboard-item-priority">
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

      <div
        id={`${idPrefix}-refined-search`}
        className={`dashboard-refined-search ${showRefinedSearch ? "is-open" : ""}`}
      >
        <div className="dashboard-row dashboard-row-refined">
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
              lang={locale}
            />
          </div>
        </div>
      </div>

      <div className="dashboard-meta-row">
        <p className="dashboard-source-note">{sourceSummary}</p>
        <p className="dashboard-filtered-note">{uiText.home.visibleMatches(filteredCount)}</p>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [selectedStageKey, setSelectedStageKey] = useState(ALL_STAGES);
  const [selectedDay, setSelectedDay] = useState(ALL_DAYS);
  const [selectedTeamKey, setSelectedTeamKey] = useState("");
  const [teamQuery, setTeamQuery] = useState("");
  const [matches, setMatches] = useState([]);
  const [matchesSource, setMatchesSource] = useState("local");
  const [displayedTotal, setDisplayedTotal] = useState(0);
  const [isLoadingMatches, setIsLoadingMatches] = useState(true);
  const [displayedNext, setDisplayedNext] = useState("N/D");
  const [showStickyNav, setShowStickyNav] = useState(false);
  const appRef = useRef(null);
  const heroSentinelRef = useRef(null);
  const listRef = useRef(null);
  const previousRectsRef = useRef(new Map());
  const previousTotalRef = useRef(0);
  const hasInitRevealRef = useRef(false);
  const { shouldAnimate } = useMotionPreferences();
  const { setBackgroundMood } = useBackgroundMood();
  const { apiLanguage, locale, uiText } = useLanguage();

  const sourceSummary = useMemo(() => getSourceSummary(matchesSource, uiText), [matchesSource, uiText]);
  const hasActiveFilters =
    selectedStageKey !== ALL_STAGES ||
    selectedDay !== ALL_DAYS ||
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

      setIsLoadingMatches(true);

      fetchWorldCupMatches2026(apiLanguage).then((result) => {
        if (!mounted) {
          return;
        }
        setMatches(result.matches);
        setMatchesSource(result.sourceLabel ?? "local");
        setIsLoadingMatches(false);
      });
    };

    loadMatches({ force: true });

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
  }, [apiLanguage]);

  const stageOptions = useMemo(() => {
    const values = new Map();
    matches.forEach((match) => {
      if (!values.has(match.stageKey)) {
        values.set(match.stageKey, match.stage);
      }
    });

    return [
      { value: ALL_STAGES, label: uiText.home.allStages },
      ...Array.from(values.entries()).map(([value, label]) => ({ value, label })),
    ];
  }, [matches, uiText]);

  const dayOptions = useMemo(
    () => [
      { value: ALL_DAYS, label: uiText.home.allDays },
      ...Array.from(new Set(matches.map((match) => match.date))).map((date) => ({
        value: date,
        label: formatDayHeading(date, locale),
      })),
    ],
    [locale, matches, uiText]
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
        });
      }
    }

    return Array.from(uniqueTeams.values()).sort((left, right) =>
      left.name.localeCompare(right.name, locale)
    );
  }, [locale, matches]);

  const filteredMatches = useMemo(() => {
    const rawQuery = normalizeText(teamQuery);
    const canonicalQuery = normalizeTeamName(teamQuery);
    const queryTerms = Array.from(new Set([rawQuery, canonicalQuery].filter(Boolean)));

    return matches.filter((match) => {
      const matchesStage = selectedStageKey === ALL_STAGES ? true : match.stageKey === selectedStageKey;
      const matchesDay = selectedDay === ALL_DAYS ? true : match.date === selectedDay;
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
  }, [matches, selectedDay, selectedStageKey, selectedTeamKey, teamQuery]);

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

  const featuredMatchState = useMemo(() => {
    const pool = filteredMatches.length > 0 ? filteredMatches : matches;
    return getFeaturedMatchState(pool);
  }, [filteredMatches, matches]);

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
    title: `GameGrid | ${uiText.home.collectionTitle}`,
    description: uiText.home.pageDescription(matches.length),
    path: "/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: uiText.home.collectionTitle,
      description: uiText.home.collectionDescription,
      url: `${seoDefaults.siteUrl}/`,
      inLanguage: locale,
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
    const nextLabel = nextMatch ? getNextMatchLabel(nextMatch, locale, uiText) : uiText.common.notAvailable;
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
  }, [locale, matches.length, nextMatch, shouldAnimate, uiText]);

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
  }, [filteredMatches, selectedDay, selectedStageKey, selectedTeamKey, shouldAnimate, teamQuery]);

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
    setSelectedStageKey(ALL_STAGES);
    setSelectedDay(ALL_DAYS);
    setSelectedTeamKey("");
    setTeamQuery("");
  }

  return (
    <div ref={appRef}>
      <header className="hero" id="resumo-copa">
        <img src={logo} alt="GameGrid" className="hero-logo" />
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
            locale={locale}
            uiText={uiText}
            stageOptions={stageOptions}
            selectedStageKey={selectedStageKey}
            onStageChange={setSelectedStageKey}
            dayOptions={dayOptions}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            teamOptions={teamOptions}
            selectedTeamKey={selectedTeamKey}
            onTeamChange={(teamKey) => {
              setSelectedTeamKey(teamKey);
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

        <nav className="hero-shortcuts" aria-label={uiText.home.shortcutsAria}>
          <a href="#resumo-copa">{uiText.home.summaryShortcut}</a>
          <a href="#jogos-copa">{uiText.home.matchesShortcut}</a>
        </nav>
      </header>
      <div ref={heroSentinelRef} className="hero-sentinel" aria-hidden="true" />

      {showStickyNav ? (
        <div className="home-sticky-nav" aria-label={uiText.home.stickyAria}>
          <MatchFiltersBar
            idPrefix="sticky"
            locale={locale}
            uiText={uiText}
            stageOptions={stageOptions}
            selectedStageKey={selectedStageKey}
            onStageChange={setSelectedStageKey}
            dayOptions={dayOptions}
            selectedDay={selectedDay}
            onDayChange={setSelectedDay}
            teamOptions={teamOptions}
            selectedTeamKey={selectedTeamKey}
            onTeamChange={(teamKey) => {
              setSelectedTeamKey(teamKey);
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
          <nav className="hero-shortcuts hero-shortcuts-compact" aria-label={uiText.home.stickyShortcutsAria}>
            <a href="#resumo-copa">{uiText.home.summaryShortcut}</a>
            <a href="#jogos-copa">{uiText.home.matchesShortcut}</a>
          </nav>
        </div>
      ) : null}

      {featuredMatchState.match ? (
        <section className="featured-match-section page-card" aria-label={uiText.home.featuredMatch}>
          <div className="featured-match-copy">
            <span className="featured-match-kicker">
              {featuredMatchState.mode === "live" ? uiText.home.liveNow : uiText.home.upcomingMatch}
            </span>
            <h2>{uiText.home.featuredMatch}</h2>
          </div>
          <MatchCard match={featuredMatchState.match} featured />
        </section>
      ) : null}

      <main className="calendar" ref={listRef} id="jogos-copa">
        {matchesByDay.length === 0 ? (
          hasActiveFilters ? (
            <section className="page-card empty-state-card">
              <h2>{uiText.home.noMatchesWithFilter}</h2>
              <p>{uiText.home.noMatchesDescription}</p>
            </section>
          ) : isLoadingMatches ? (
            <section className="day-group" aria-label={uiText.common.loadingMatches}>
              <div className="day-group-header skeleton-card">
                <div className="skeleton-row w-60" />
                <div className="skeleton-row w-70" />
              </div>
              <div className="match-grid">
                {Array.from({ length: 6 }).map((_, index) => (
                  <MatchCardSkeleton key={`skeleton-${index}`} featured={index === 0} />
                ))}
              </div>
            </section>
          ) : (
            <section className="page-card empty-state-card">
              <h2>{uiText.common.loadingMatches}</h2>
            </section>
          )
        ) : null}

        {matchesByDay.map((day) => (
          <section className="day-group" key={day.date} data-flip-key={`dia-${day.date}`}>
            <div className="day-group-header">
              <h2>{formatDayHeading(day.date, locale)}</h2>
              <span>{uiText.home.matchCount(day.matches.length)}</span>
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

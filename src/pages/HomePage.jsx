import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { gsap } from "gsap";
import MatchCard from "../components/MatchCard";
import { FALLBACK_MATCHES_2026 } from "../data/matches2026";
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
  const [selectedStage, setSelectedStage] = useState("Todas as fases");
  const [matches, setMatches] = useState(FALLBACK_MATCHES_2026);
  const [sourceLabel, setSourceLabel] = useState("local");
  const appRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    fetchWorldCupMatches2026().then((result) => {
      if (!mounted) {
        return;
      }
      setMatches(result.matches);
      setSourceLabel(result.sourceLabel);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const stageOptions = useMemo(() => {
    const allStages = new Set(matches.map((match) => match.stage));
    return ["Todas as fases", ...Array.from(allStages)];
  }, [matches]);

  const filteredMatches = useMemo(() => {
    if (selectedStage === "Todas as fases") {
      return matches;
    }

    return matches.filter((match) => match.stage === selectedStage);
  }, [matches, selectedStage]);

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

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.from(".hero-logo, .hero-title, .hero-subtitle", {
        opacity: 0,
        y: 28,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
      });

      gsap.from(".dashboard-bar", {
        opacity: 0,
        y: 18,
        duration: 0.8,
        delay: 0.2,
        ease: "power2.out",
      });
    }, appRef);

    return () => context.revert();
  }, []);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.fromTo(
        ".match-card",
        { opacity: 0, y: 22 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.014,
          duration: 0.45,
          ease: "power2.out",
          clearProps: "all",
        }
      );
    }, listRef);

    return () => context.revert();
  }, [selectedStage, matches]);

  return (
    <div ref={appRef}>
      <header className="hero">
        <img src={logo} alt="GameGrid logo" className="hero-logo" />
        <h1 className="hero-title">Copa do Mundo Masculina 2026</h1>
        <p className="hero-subtitle">
          Calendario interativo com 104 jogos, filtros por fase e detalhes de
          times e jogadores.
        </p>

        <div className="dashboard-bar">
          <span>{matches.length} jogos no total</span>
          <span>Proximo: {nextMatch ? getNextMatchLabel(nextMatch) : "N/A"}</span>

          <label htmlFor="stage-select">
            Fase:
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
          </label>
        </div>

        <small className="source-note">
          Fonte de jogos:{" "}
          {sourceLabel === "api+local"
            ? "API TheSportsDB + calendário base"
            : "calendário base local"}
        </small>
      </header>

      <main className="calendar" ref={listRef}>
        {matchesByDay.map((day) => (
          <section className="day-group" key={day.date}>
            <div className="day-group-header">
              <h2>{formatDayHeading(day.date)}</h2>
              <span>{day.matches.length} jogos</span>
            </div>

            <div className="match-grid">
              {day.matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

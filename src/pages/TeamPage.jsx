import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Link, useParams } from "react-router-dom";
import { getFlagByTeamName } from "../utils/flags";
import { fetchTeamDetails } from "../services/worldCupApi";
import { motionTokens } from "../animations/motionTokens";
import { useMotionPreferences } from "../hooks/useMotionPreferences";
import { useBackgroundMood } from "../hooks/useBackgroundMood";
import { uiText } from "../data/uiText";
import { seoDefaults, useSeo } from "../hooks/useSeo";

function decodeRouteTeam(routeValue) {
  try {
    return decodeURIComponent(routeValue ?? "");
  } catch {
    return routeValue ?? "";
  }
}

function translatePosition(position) {
  const value = (position ?? "").trim().toLowerCase();
  const map = {
    goalkeeper: "Goleiro",
    defender: "Defensor",
    "centre-back": "Zagueiro",
    "center-back": "Zagueiro",
    "right-back": "Lateral direito",
    "left-back": "Lateral esquerdo",
    midfielder: "Meio-campista",
    "defensive midfield": "Volante",
    "central midfield": "Meio-campista central",
    forward: "Atacante",
    "centre-forward": "Centroavante",
    "right winger": "Ponta direita",
    "left winger": "Ponta esquerda",
    striker: "Centroavante",
    manager: "Técnico",
  };

  return map[value] ?? position ?? "Posição não informada";
}

function TeamSkeleton() {
  return (
    <section className="page-card skeleton-card" aria-label="Carregando time">
      <div className="skeleton-row" />
      <div className="skeleton-row w-70" />
      <div className="skeleton-grid">
        <div className="skeleton-box" />
        <div className="skeleton-box" />
        <div className="skeleton-box" />
      </div>
      <div className="skeleton-row" />
      <div className="skeleton-row w-90" />
    </section>
  );
}

export default function TeamPage() {
  const { teamName: routeTeamName } = useParams();
  const teamName = decodeRouteTeam(routeTeamName);
  const [teamDetails, setTeamDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(null);
  const { shouldAnimate } = useMotionPreferences();
  const { setBackgroundMood } = useBackgroundMood();

  useEffect(() => {
    setBackgroundMood("focus");
    return () => setBackgroundMood("transition");
  }, [setBackgroundMood]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchTeamDetails(teamName).then((payload) => {
      if (!mounted) {
        return;
      }
      setTeamDetails(payload);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [teamName]);

  useLayoutEffect(() => {
    if (!shouldAnimate) {
      return undefined;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        ".team-hero",
        { opacity: 0, y: motionTokens.distance.md },
        {
          opacity: 1,
          y: 0,
          duration: motionTokens.duration.medium,
          ease: motionTokens.ease.enter,
        }
      );

      gsap.fromTo(
        ".player-grid .player-preview-card",
        { opacity: 0, y: motionTokens.distance.sm, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: motionTokens.duration.medium,
          stagger: motionTokens.stagger.tight,
          ease: motionTokens.ease.soft,
          clearProps: "all",
        }
      );
    }, pageRef);

    return () => context.revert();
  }, [shouldAnimate, teamDetails]);

  useEffect(() => {
    if (!pageRef.current || !shouldAnimate) {
      return undefined;
    }

    const cards = pageRef.current.querySelectorAll(".player-preview-card");

    const onMove = (event) => {
      const target = event.currentTarget;
      const rect = target.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * -8;
      target.style.setProperty("--tiltX", `${y.toFixed(2)}deg`);
      target.style.setProperty("--tiltY", `${x.toFixed(2)}deg`);
      target.classList.add("tilt-active");
    };

    const onLeave = (event) => {
      const target = event.currentTarget;
      target.style.setProperty("--tiltX", "0deg");
      target.style.setProperty("--tiltY", "0deg");
      target.classList.remove("tilt-active");
    };

    cards.forEach((card) => {
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
    });

    return () => {
      cards.forEach((card) => {
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
      });
    };
  }, [shouldAnimate, teamDetails]);

  const flagSrc = getFlagByTeamName(teamName);
  const profile = teamDetails?.profile;
  const historyLabels = ["2006", "2010", "2014", "2018", "2022"];

  useSeo({
    title: `${teamDetails?.teamName ?? teamName} | GameGrid`,
    description: `Perfil da seleção ${teamDetails?.teamName ?? teamName}: histórico de Copas, elenco principal e desempenho recente.`,
    path: `/time/${encodeURIComponent(teamName)}`,
    type: "profile",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SportsTeam",
      name: teamDetails?.teamName ?? teamName,
      sport: "Futebol",
      url: `${seoDefaults.siteUrl}/time/${encodeURIComponent(teamName)}`,
      member: (teamDetails?.players ?? []).slice(0, 11).map((player) => ({
        "@type": "Person",
        name: player.name,
      })),
    },
  });

  if (loading) {
    return (
      <>
        <TeamSkeleton />
        <TeamSkeleton />
      </>
    );
  }

  if (!teamDetails) {
    return (
      <section className="page-card">
        <h2>{uiText.team.loadError}</h2>
        <Link to="/" className="text-link">
          {uiText.team.backToCalendar}
        </Link>
      </section>
    );
  }

  return (
    <section ref={pageRef}>
      <nav className="section-nav" aria-label="Atalhos da pagina do time">
        <a href="#time-resumo">{uiText.team.quickNavSummary}</a>
        <a href="#time-elenco">{uiText.team.quickNavSquad}</a>
      </nav>

      <article className="page-card team-hero" id="time-resumo">
        <Link to="/" className="text-link">
          {uiText.team.backToMatches}
        </Link>

        <div className="team-headline">
          {flagSrc ? (
            <img className="team-main-flag" src={flagSrc} alt={`Bandeira de ${teamName}`} />
          ) : (
            <div className="team-main-flag fallback">?</div>
          )}

          <div>
            <h1>{teamDetails.teamName}</h1>
            <p>
              {teamDetails.country} | {uiText.team.founded} {teamDetails.founded}
            </p>
            <p>
              {uiText.team.stadium} {teamDetails.stadium}
            </p>
          </div>
        </div>

        <div className="team-stats-grid">
          <article className="team-stat-card">
            <span>Copas do Mundo</span>
            <strong>{profile?.worldCups ?? uiText.common.notAvailable}</strong>
          </article>
          <article className="team-stat-card">
            <span>Melhor campanha</span>
            <strong>{profile?.bestFinish ?? uiText.common.notAvailable}</strong>
          </article>
          <article className="team-stat-card">
            <span>Ranking FIFA</span>
            <strong>#{profile?.fifaRank ?? uiText.common.notAvailable}</strong>
          </article>
        </div>

        <div className="world-cup-history">
          <h3>Últimas 5 Copas</h3>
          <div className="history-track">
            {historyLabels.map((label, index) => (
              <div className="history-item" key={label}>
                <small>{label}</small>
                <strong>{profile?.last5WorldCups?.[index] ?? "-"}</strong>
              </div>
            ))}
          </div>
        </div>

        <p className="team-description">{teamDetails.description}</p>
      </article>

      <article className="page-card" id="time-elenco">
        <header className="squad-header">
          <h2 className="squad-title">11 Jogadores Principais</h2>
          <p className="players-hint squad-subtitle">
            Clique em um jogador para abrir os detalhes completos.
          </p>
        </header>

        <div className="player-grid squad-grid">
          {teamDetails.players.slice(0, 11).map((player) => (
            <Link
              to={`/jogador/${encodeURIComponent(player.id)}?team=${encodeURIComponent(
                teamDetails.teamName
              )}`}
              state={{ player }}
              className="player-preview-card"
              key={player.id}
            >
              <div className="player-card-media">
                {player.image ? (
                  <img src={player.image} alt={player.name} loading="lazy" />
                ) : (
                  <div className="player-card-fallback">{player.name.slice(0, 2).toUpperCase()}</div>
                )}
              </div>

              <section className="player-card-content">
                <h3>{player.name}</h3>
                <p>{translatePosition(player.position)}</p>
                <div className="player-card-meta">
                  <span className="player-card-tag">Jogador</span>
                  <span className="player-card-action">Abrir perfil</span>
                </div>
              </section>
            </Link>
          ))}
        </div>
      </article>
    </section>
  );
}

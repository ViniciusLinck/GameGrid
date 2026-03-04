import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Link, useParams } from "react-router-dom";
import { getFlagByTeamName } from "../utils/flags";
import { fetchTeamDetails } from "../services/worldCupApi";

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
    manager: "Tecnico",
  };

  return map[value] ?? position ?? "Posicao nao informada";
}

export default function TeamPage() {
  const { teamName: routeTeamName } = useParams();
  const teamName = decodeRouteTeam(routeTeamName);
  const [teamDetails, setTeamDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const pageRef = useRef(null);

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
    const context = gsap.context(() => {
      gsap.from(".team-hero, .player-grid .player-preview-card", {
        opacity: 0,
        y: 20,
        duration: 0.5,
        stagger: 0.05,
        ease: "power2.out",
      });
    }, pageRef);
    return () => context.revert();
  }, [teamDetails]);

  const flagSrc = getFlagByTeamName(teamName);
  const profile = teamDetails?.profile;
  const historyLabels = ["2006", "2010", "2014", "2018", "2022"];

  if (loading) {
    return <section className="page-card">Carregando detalhes do time...</section>;
  }

  if (!teamDetails) {
    return (
      <section className="page-card">
        <h2>Nao foi possivel carregar os detalhes do time.</h2>
        <Link to="/" className="text-link">
          Voltar ao calendario
        </Link>
      </section>
    );
  }

  return (
    <section ref={pageRef}>
      <article className="page-card team-hero">
        <Link to="/" className="text-link">
          ← Voltar para jogos
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
              {teamDetails.country} | Fundado em: {teamDetails.founded}
            </p>
            <p>Estadio: {teamDetails.stadium}</p>
          </div>
        </div>

        <div className="team-stats-grid">
          <article className="team-stat-card">
            <span>Copas do Mundo</span>
            <strong>{profile?.worldCups ?? "N/A"}</strong>
          </article>
          <article className="team-stat-card">
            <span>Melhor campanha</span>
            <strong>{profile?.bestFinish ?? "N/A"}</strong>
          </article>
          <article className="team-stat-card">
            <span>Ranking FIFA</span>
            <strong>#{profile?.fifaRank ?? "N/A"}</strong>
          </article>
        </div>

        <div className="world-cup-history">
          <h3>Ultimas 5 Copas</h3>
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

      <article className="page-card">
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
                  <span className="player-card-action">Abrir card</span>
                </div>
              </section>
            </Link>
          ))}
        </div>
      </article>
    </section>
  );
}

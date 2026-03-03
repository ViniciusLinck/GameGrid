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

  if (loading) {
    return <section className="page-card">Carregando detalhes do time...</section>;
  }

  if (!teamDetails) {
    return (
      <section className="page-card">
        <h2>Não foi possível carregar o time.</h2>
        <Link to="/" className="text-link">
          Voltar ao calendário
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
            <p>Estádio: {teamDetails.stadium}</p>
          </div>
        </div>

        <p className="team-description">{teamDetails.description}</p>
      </article>

      <article className="page-card">
        <h2>11 jogadores principais</h2>
        <p className="players-hint">Clique em um jogador para abrir o card completo.</p>

        <div className="player-grid">
          {teamDetails.players.slice(0, 11).map((player) => (
            <Link
              to={`/jogador/${encodeURIComponent(player.id)}?team=${encodeURIComponent(
                teamDetails.teamName
              )}`}
              state={{ player }}
              className="player-preview-card"
              key={player.id}
            >
              <div className="player-avatar">
                {player.image ? (
                  <img src={player.image} alt={player.name} loading="lazy" />
                ) : (
                  <span>{player.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>

              <div>
                <h3>{player.name}</h3>
                <p>{player.position}</p>
              </div>
            </Link>
          ))}
        </div>
      </article>
    </section>
  );
}

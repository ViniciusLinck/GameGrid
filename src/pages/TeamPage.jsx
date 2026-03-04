import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  const profile = teamDetails?.profile;
  const squadCards = useMemo(() => {
    if (!teamDetails) {
      return [];
    }

    const players = teamDetails.players.slice(0, 11).map((player) => ({
      ...player,
      cardType: "player",
    }));

    const coach = {
      id: teamDetails.coach?.id ?? `coach-${teamDetails.teamName}`,
      name: teamDetails.coach?.name ?? `Tecnico de ${teamDetails.teamName}`,
      role: teamDetails.coach?.role ?? "Tecnico",
      image: teamDetails.coach?.image ?? "",
      cardType: "coach",
    };

    return [...players, coach];
  }, [teamDetails]);

  const historyLabels = ["2006", "2010", "2014", "2018", "2022"];

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

        <div className="team-stats-grid">
          <article className="team-stat-card">
            <span>Copas do mundo</span>
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
          <h3>Ultimas 5 copas</h3>
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
          <h2 className="squad-title">Titulares e Comando Tecnico</h2>
          <p className="players-hint squad-subtitle">
            11 jogadores principais + tecnico. Clique em um jogador para abrir o card
            completo.
          </p>
        </header>

        <div className="player-grid squad-grid">
          {squadCards.map((member) => {
            const cardContent = (
              <>
                <div className={`player-card-media${member.cardType === "coach" ? " coach" : ""}`}>
                  {member.image ? (
                    <img src={member.image} alt={member.name} loading="lazy" />
                  ) : (
                    <div className="player-card-fallback">
                      {member.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <section className="player-card-content">
                  <h3>{member.name}</h3>
                  <p>{member.cardType === "coach" ? member.role : member.position}</p>
                  <div className="player-card-meta">
                    <span className="player-card-tag">
                      {member.cardType === "coach" ? "Comissao tecnica" : "Jogador"}
                    </span>
                    <span className="player-card-action">
                      {member.cardType === "coach" ? "Tecnico" : "Abrir card"}
                    </span>
                  </div>
                </section>
              </>
            );

            if (member.cardType === "coach") {
              return (
                <article className="player-preview-card coach-preview-card" key={member.id}>
                  {cardContent}
                </article>
              );
            }

            return (
              <Link
                to={`/jogador/${encodeURIComponent(member.id)}?team=${encodeURIComponent(
                  teamDetails.teamName
                )}`}
                state={{ player: member }}
                className="player-preview-card"
                key={member.id}
              >
                {cardContent}
              </Link>
            );
          })}
        </div>
      </article>
    </section>
  );
}

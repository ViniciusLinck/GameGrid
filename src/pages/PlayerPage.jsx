import { useEffect, useLayoutEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { fetchPlayerById, fetchTeamDetails } from "../services/worldCupApi";
import { normalizeTeamName } from "../utils/flags";

function formatLabelDate(rawDate) {
  if (!rawDate || rawDate === "Nao informado") {
    return "Nao informado";
  }

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return rawDate;
  }
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function shorten(text) {
  const cleaned = (text ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return "Sem resumo disponivel para este jogador.";
  }
  return cleaned.length > 260 ? `${cleaned.slice(0, 260)}...` : cleaned;
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

function buildDefaultCoachCard(teamName) {
  if (normalizeTeamName(teamName) === "brazil") {
    return {
      name: "Carlo Ancelotti",
      team: "Brazil",
      role: "Manager",
    };
  }

  return {
    name: `Tecnico de ${teamName}`,
    team: teamName,
    role: "Tecnico",
  };
}

export default function PlayerPage() {
  const { playerId: routePlayerId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [player, setPlayer] = useState(location.state?.player ?? null);
  const [loading, setLoading] = useState(!location.state?.player);
  const [coachCard, setCoachCard] = useState(() => buildDefaultCoachCard("Brazil"));
  const pageRef = useRef(null);

  const playerId = decodeURIComponent(routePlayerId ?? "");
  const teamName = searchParams.get("team") ?? "Time";

  useEffect(() => {
    if (location.state?.player) {
      return;
    }

    let mounted = true;
    setLoading(true);
    fetchPlayerById(playerId, teamName).then((payload) => {
      if (!mounted) {
        return;
      }
      setPlayer(payload);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [location.state, playerId, teamName]);

  useEffect(() => {
    let mounted = true;
    setCoachCard(buildDefaultCoachCard(teamName));

    fetchTeamDetails(teamName)
      .then((teamPayload) => {
        if (!mounted || !teamPayload) {
          return;
        }

        const teamLabel = teamPayload.teamName ?? teamName;
        const isBrazil = normalizeTeamName(teamLabel) === "brazil";

        if (isBrazil) {
          setCoachCard({
            name: "Carlo Ancelotti",
            team: "Brazil",
            role: "Manager",
          });
          return;
        }

        setCoachCard({
          name: teamPayload.coach?.name ?? `Tecnico de ${teamLabel}`,
          team: teamLabel,
          role: teamPayload.coach?.role ?? "Tecnico",
        });
      })
      .catch(() => {
        // Mantem o fallback local do tecnico.
      });

    return () => {
      mounted = false;
    };
  }, [teamName]);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.from(".player-detail-card, .coach-spotlight-card", {
        opacity: 0,
        y: 22,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
      });
    }, pageRef);
    return () => context.revert();
  }, [player, coachCard]);

  if (loading) {
    return <section className="page-card">Carregando detalhes do jogador...</section>;
  }

  if (!player) {
    return (
      <section className="page-card">
        <h2>Jogador nao encontrado.</h2>
        <Link to="/" className="text-link">
          Voltar para a pagina inicial
        </Link>
      </section>
    );
  }

  return (
    <section ref={pageRef}>
      <article className="page-card">
        <Link to={`/time/${encodeURIComponent(teamName)}`} className="text-link">
          ← Voltar ao time
        </Link>

        <div className="player-detail-card">
          <div className="player-detail-top">
            <div className="player-avatar large">
              {player.image ? (
                <img src={player.image} alt={player.name} />
              ) : (
                <span>{player.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1>{player.name}</h1>
              <p>{player.team}</p>
              <p>{translatePosition(player.position)}</p>
            </div>
          </div>

          <div className="player-detail-grid">
            <div>
              <span>Nacionalidade</span>
              <strong>{player.nationality}</strong>
            </div>
            <div>
              <span>Nascimento</span>
              <strong>{formatLabelDate(player.birth)}</strong>
            </div>
            <div>
              <span>Altura</span>
              <strong>{player.height}</strong>
            </div>
            <div>
              <span>Peso</span>
              <strong>{player.weight}</strong>
            </div>
          </div>

          <p className="player-description">{shorten(player.description)}</p>
        </div>

        <article className="coach-spotlight-card" aria-label="Card do tecnico">
          <h3>{coachCard.name}</h3>
          <p>{coachCard.team}</p>
          <span>{coachCard.role}</span>
        </article>
      </article>
    </section>
  );
}

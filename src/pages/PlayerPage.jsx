import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  fetchPersonAchievementsByName,
  fetchPlayerById,
  fetchTeamDetails,
} from "../services/worldCupApi";
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

function getInitials(name) {
  const initials = (name ?? "")
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return initials || "??";
}

function buildDefaultCoach(teamName) {
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

  const playerId = decodeURIComponent(routePlayerId ?? "");
  const teamName = searchParams.get("team") ?? "Time";

  const [player, setPlayer] = useState(location.state?.player ?? null);
  const [loading, setLoading] = useState(!location.state?.player);
  const [playerAchievements, setPlayerAchievements] = useState(
    location.state?.player?.achievements ?? []
  );
  const [coach, setCoach] = useState(() => buildDefaultCoach(teamName));
  const [coachAchievements, setCoachAchievements] = useState([]);
  const pageRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    fetchPlayerById(playerId, teamName).then((payload) => {
      if (!mounted) {
        return;
      }

      setLoading(false);
      if (!payload) {
        return;
      }

      setPlayer(payload);
      setPlayerAchievements(payload.achievements ?? []);
    });

    return () => {
      mounted = false;
    };
  }, [playerId, teamName]);

  useEffect(() => {
    let mounted = true;
    const defaultCoach = buildDefaultCoach(teamName);

    const loadCoach = async () => {
      setCoach(defaultCoach);
      setCoachAchievements([]);

      try {
        const teamPayload = await fetchTeamDetails(teamName);
        if (!mounted || !teamPayload) {
          return;
        }

        const teamLabel = teamPayload.teamName ?? teamName;
        let coachName = teamPayload.coach?.name ?? defaultCoach.name;
        let coachRole = teamPayload.coach?.role ?? defaultCoach.role;

        if (normalizeTeamName(teamLabel) === "brazil" && /^tecnico de /i.test(coachName)) {
          coachName = "Carlo Ancelotti";
          coachRole = "Manager";
        }

        const nextCoach = {
          name: coachName,
          team: teamLabel,
          role: coachRole,
        };

        setCoach(nextCoach);

        const achievements = await fetchPersonAchievementsByName(coachName, teamLabel);
        if (!mounted) {
          return;
        }
        setCoachAchievements(achievements);
      } catch {
        const achievements = await fetchPersonAchievementsByName(
          defaultCoach.name,
          defaultCoach.team
        );
        if (!mounted) {
          return;
        }
        setCoachAchievements(achievements);
      }
    };

    loadCoach();

    return () => {
      mounted = false;
    };
  }, [teamName]);

  useLayoutEffect(() => {
    const context = gsap.context(() => {
      gsap.from(".player-detail-card, .achievement-card", {
        opacity: 0,
        y: 22,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
      });
    }, pageRef);
    return () => context.revert();
  }, [player, playerAchievements, coach, coachAchievements]);

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
                <span>{getInitials(player.name)}</span>
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

        <section aria-label="Lista de conquistas do jogador e tecnico">
          <header className="squad-header">
            <h3 className="squad-title">Conquistas</h3>
            <p className="players-hint squad-subtitle">
              Lista de titulos e premiacoes registradas para jogador e tecnico.
            </p>
          </header>

          <div className="achievements-grid">
            <article className="achievement-card">
              <h4>{player.name}</h4>
              <p className="achievement-summary">
                {playerAchievements.length} conquistas registradas
              </p>

              {playerAchievements.length > 0 ? (
                <ul className="achievement-list" aria-label="Conquistas do jogador">
                  {playerAchievements.map((achievement) => (
                    <li className="achievement-item" key={achievement.id}>
                      <strong>{achievement.title}</strong>
                      <span>{achievement.team}</span>
                      <small>{achievement.season}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="achievement-empty">Sem conquistas disponiveis na API.</p>
              )}
            </article>

            <article className="achievement-card">
              <h4>{coach.name}</h4>
              <p className="achievement-summary">
                {coach.role} | {coachAchievements.length} conquistas registradas
              </p>

              {coachAchievements.length > 0 ? (
                <ul className="achievement-list" aria-label="Conquistas do tecnico">
                  {coachAchievements.map((achievement) => (
                    <li className="achievement-item" key={achievement.id}>
                      <strong>{achievement.title}</strong>
                      <span>{achievement.team}</span>
                      <small>{achievement.season}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="achievement-empty">Sem conquistas disponiveis na API.</p>
              )}
            </article>
          </div>
        </section>
      </article>
    </section>
  );
}

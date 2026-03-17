import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  fetchPersonAchievementsByName,
  fetchPlayerById,
  fetchTeamDetails,
} from "../services/worldCupApi";
import { normalizeTeamName } from "../utils/flags";
import { motionTokens } from "../animations/motionTokens";
import { useMotionPreferences } from "../hooks/useMotionPreferences";
import { useBackgroundMood } from "../hooks/useBackgroundMood";
import { uiText } from "../data/uiText";
import { seoDefaults, useSeo } from "../hooks/useSeo";

function formatLabelDate(rawDate) {
  if (!rawDate || rawDate === "Nao informado") {
    return "NÃ£o informado";
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
    return "Sem resumo disponÃ­vel para este jogador.";
  }
  return cleaned.length > 300 ? `${cleaned.slice(0, 300)}...` : cleaned;
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
    manager: "TÃ©cnico",
  };

  return map[value] ?? position ?? "PosiÃ§Ã£o nÃ£o informada";
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
      team: "Brasil",
      role: "TÃ©cnico",
    };
  }

  return {
    name: `TÃ©cnico de ${teamName}`,
    team: teamName,
    role: "TÃ©cnico",
  };
}

function PlayerSkeleton() {
  return (
    <section className="page-card skeleton-card" aria-label="Carregando jogador">
      <div className="skeleton-row" />
      <div className="skeleton-row w-60" />
      <div className="skeleton-grid">
        <div className="skeleton-box" />
        <div className="skeleton-box" />
      </div>
      <div className="skeleton-row" />
      <div className="skeleton-row w-80" />
    </section>
  );
}

export default function PlayerPage() {
  const { playerId: routePlayerId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const playerId = decodeURIComponent(routePlayerId ?? "");
  const teamName = searchParams.get("team") ?? "Time";

  const [player, setPlayer] = useState(location.state?.player ?? null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("jogador-perfil");
  const [playerAchievements, setPlayerAchievements] = useState(
    location.state?.player?.achievements ?? []
  );
  const [playerCount, setPlayerCount] = useState(0);
  const [coach, setCoach] = useState(() => buildDefaultCoach(teamName));
  const [coachAchievements, setCoachAchievements] = useState([]);
  const [coachCount, setCoachCount] = useState(0);
  const previousPlayerCountRef = useRef(0);
  const previousCoachCountRef = useRef(0);
  const pageRef = useRef(null);
  const { shouldAnimate } = useMotionPreferences();
  const { setBackgroundMood } = useBackgroundMood();

  useEffect(() => {
    setBackgroundMood("focus");
    return () => setBackgroundMood("transition");
  }, [setBackgroundMood]);

  useEffect(() => {
    let mounted = true;

    fetchPlayerById(playerId, teamName).then((payload) => {
      if (!mounted) {
        return;
      }

      setLoading(false);
      if (!payload && !location.state?.player) {
        setPlayer(null);
        return;
      }

      if (!payload && location.state?.player) {
        setPlayer((previous) =>
          previous
            ? {
                ...previous,
                description: "DescriÃ§Ã£o em portuguÃªs indisponÃ­vel no momento.",
              }
            : previous
        );
        return;
      }

      if (payload) {
        setPlayer(payload);
        setPlayerAchievements(payload.achievements ?? []);
      }
    });

    return () => {
      mounted = false;
    };
  }, [location.state, playerId, teamName]);

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
          coachRole = "TÃ©cnico";
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

  useEffect(() => {
    if (!shouldAnimate) {
      setPlayerCount(playerAchievements.length);
      setCoachCount(coachAchievements.length);
      previousPlayerCountRef.current = playerAchievements.length;
      previousCoachCountRef.current = coachAchievements.length;
      return;
    }

    const playerProxy = { value: previousPlayerCountRef.current };
    const coachProxy = { value: previousCoachCountRef.current };

    const playerTween = gsap.to(playerProxy, {
      value: playerAchievements.length,
      duration: motionTokens.duration.medium,
      ease: motionTokens.ease.soft,
      onUpdate: () => {
        const value = Math.round(playerProxy.value);
        previousPlayerCountRef.current = value;
        setPlayerCount(value);
      },
    });

    const coachTween = gsap.to(coachProxy, {
      value: coachAchievements.length,
      duration: motionTokens.duration.medium,
      ease: motionTokens.ease.soft,
      onUpdate: () => {
        const value = Math.round(coachProxy.value);
        previousCoachCountRef.current = value;
        setCoachCount(value);
      },
    });

    return () => {
      playerTween.kill();
      coachTween.kill();
    };
  }, [coachAchievements.length, playerAchievements.length, shouldAnimate]);

  useLayoutEffect(() => {
    if (!shouldAnimate || !pageRef.current) {
      return undefined;
    }

    const sections = pageRef.current.querySelectorAll("[data-reveal]");
    if (sections.length === 0) {
      return undefined;
    }

    const context = gsap.context(() => {
      sections.forEach((section) => {
        const revealType = section.getAttribute("data-reveal");
        if (revealType === "achievements") {
          gsap.set(section.querySelectorAll(".achievement-card"), {
            autoAlpha: 0,
            y: motionTokens.distance.md,
          });
        } else {
          gsap.set(section, { autoAlpha: 0, y: motionTokens.distance.md });
        }
      });
    }, pageRef);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          const target = entry.target;
          const revealType = target.getAttribute("data-reveal");

          if (revealType === "achievements") {
            gsap.to(target.querySelectorAll(".achievement-card"), {
              autoAlpha: 1,
              y: 0,
              duration: motionTokens.duration.medium,
              stagger: motionTokens.stagger.regular,
              ease: motionTokens.ease.enter,
              clearProps: "all",
            });
          } else {
            gsap.to(target, {
              autoAlpha: 1,
              y: 0,
              duration: motionTokens.duration.medium,
              ease: motionTokens.ease.enter,
              clearProps: "all",
            });
          }

          observer.unobserve(target);
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      observer.disconnect();
      context.revert();
    };
  }, [coach, coachAchievements, player, playerAchievements, shouldAnimate]);

  useEffect(() => {
    if (!pageRef.current) {
      return undefined;
    }

    const sections = pageRef.current.querySelectorAll("[data-section]");
    if (sections.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const nextSection = entry.target.getAttribute("data-section");
            if (nextSection) {
              setActiveSection(nextSection);
            }
          }
        });
      },
      { threshold: 0.4, rootMargin: "-20% 0px -50% 0px" }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [player, coach]);

  useSeo({
    title: `${player?.name ?? "Jogador"} | GameGrid`,
    description: `Detalhes de ${player?.name ?? "jogador"}: posiÃ§Ã£o, nacionalidade, dados fÃ­sicos e conquistas.`,
    path: `/jogador/${encodeURIComponent(playerId)}?team=${encodeURIComponent(teamName)}`,
    type: "profile",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Person",
      name: player?.name ?? "Jogador",
      nationality: player?.nationality ?? undefined,
      memberOf: {
        "@type": "SportsTeam",
        name: player?.team ?? teamName,
      },
      url: `${seoDefaults.siteUrl}/jogador/${encodeURIComponent(playerId)}?team=${encodeURIComponent(
        teamName
      )}`,
    },
  });

  if (loading) {
    return (
      <>
        <PlayerSkeleton />
        <PlayerSkeleton />
      </>
    );
  }

  if (!player) {
    return (
      <section className="page-card">
        <h2>{uiText.player.notFound}</h2>
        <Link to="/" className="text-link">
          {uiText.player.backHome}
        </Link>
      </section>
    );
  }

  return (
    <section ref={pageRef}>
      <nav className="section-nav section-nav-sticky" aria-label="Atalhos da pÃ¡gina do jogador">
        <a href="#jogador-perfil" className={activeSection === "jogador-perfil" ? "active" : ""}>
          {uiText.player.quickNavProfile}
        </a>
        <a href="#jogador-conquistas" className={activeSection === "jogador-conquistas" ? "active" : ""}>
          {uiText.player.quickNavAchievements}
        </a>
      </nav>

      <article className="page-card">
        <Link to={`/time/${encodeURIComponent(teamName)}`} className="text-link">
          {uiText.player.backTeam}
        </Link>

        <div
          className="player-detail-card section-anchor"
          id="jogador-perfil"
          data-section="jogador-perfil"
          data-reveal="profile"
        >
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

        <section
          className="section-anchor"
          aria-label="Lista de conquistas do jogador e tÃ©cnico"
          id="jogador-conquistas"
          data-section="jogador-conquistas"
          data-reveal="achievements"
        >
          <header className="squad-header">
            <h3 className="squad-title">Conquistas</h3>
            <p className="players-hint squad-subtitle">
              Lista de tÃ­tulos e premiaÃ§Ãµes registradas para jogador e tÃ©cnico.
            </p>
          </header>

          <div className="achievements-grid">
            <article className="achievement-card">
              <h4>{player.name}</h4>
              <p className="achievement-summary">{playerCount} conquistas registradas</p>

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
                <p className="achievement-empty">{uiText.player.noAchievements}</p>
              )}
            </article>

            <article className="achievement-card">
              <h4>{coach.name}</h4>
              <p className="achievement-summary">
                {coach.role} | {coachCount} conquistas registradas
              </p>

              {coachAchievements.length > 0 ? (
                <ul className="achievement-list" aria-label="Conquistas do tÃ©cnico">
                  {coachAchievements.map((achievement) => (
                    <li className="achievement-item" key={achievement.id}>
                      <strong>{achievement.title}</strong>
                      <span>{achievement.team}</span>
                      <small>{achievement.season}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="achievement-empty">{uiText.player.noAchievements}</p>
              )}
            </article>
          </div>
        </section>
      </article>
    </section>
  );
}




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
import { seoDefaults, useSeo } from "../hooks/useSeo";
import { useLanguage } from "../context/LanguageContext";
import { translatePosition } from "../utils/footballText";
import ProfileShowcaseCard from "../components/ProfileShowcaseCard";

function formatLabelDate(rawDate, locale, fallback) {
  if (!rawDate) {
    return fallback;
  }

  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return rawDate;
  }

  return new Intl.DateTimeFormat(locale).format(date);
}

function shorten(text, fallback) {
  const cleaned = (text ?? "").replace(/\s+/g, " ").trim();
  if (!cleaned) {
    return fallback;
  }
  return cleaned.length > 300 ? `${cleaned.slice(0, 300)}...` : cleaned;
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

function buildDefaultCoach(teamName, uiText) {
  if (normalizeTeamName(teamName) === "brazil") {
    return {
      name: "Carlo Ancelotti",
      team: teamName,
      role: uiText.player.coachRole,
      image: "",
    };
  }

  return {
    name: uiText.player.defaultCoachName(teamName),
    team: teamName,
    role: uiText.player.coachRole,
    image: "",
  };
}

function PlayerSkeleton({ label }) {
  return (
    <section className="page-card skeleton-card" aria-label={label}>
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
  const teamName = searchParams.get("team") ?? "Team";
  const [player, setPlayer] = useState(location.state?.player ?? null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("jogador-perfil");
  const [playerAchievements, setPlayerAchievements] = useState(
    location.state?.player?.achievements ?? []
  );
  const [playerCount, setPlayerCount] = useState(0);
  const [coach, setCoach] = useState(null);
  const [coachAchievements, setCoachAchievements] = useState([]);
  const [coachCount, setCoachCount] = useState(0);
  const previousPlayerCountRef = useRef(0);
  const previousCoachCountRef = useRef(0);
  const pageRef = useRef(null);
  const { shouldAnimate } = useMotionPreferences();
  const { setBackgroundMood } = useBackgroundMood();
  const { language, locale, apiLanguage, uiText } = useLanguage();

  useEffect(() => {
    setBackgroundMood("focus");
    return () => setBackgroundMood("transition");
  }, [setBackgroundMood]);

  useEffect(() => {
    let mounted = true;

    fetchPlayerById(playerId, teamName, apiLanguage).then((payload) => {
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
                description: uiText.player.noDescriptionNow,
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
  }, [apiLanguage, location.state, playerId, teamName, uiText.player.noDescriptionNow]);

  useEffect(() => {
    let mounted = true;
    const defaultCoach = buildDefaultCoach(teamName, uiText);

    const loadCoach = async () => {
      setCoach(defaultCoach);
      setCoachAchievements([]);

      try {
        const teamPayload = await fetchTeamDetails(teamName, apiLanguage);
        if (!mounted || !teamPayload) {
          return;
        }

        const teamLabel = teamPayload.teamName ?? teamName;
        let coachName = teamPayload.coach?.name ?? defaultCoach.name;
        let coachRole = teamPayload.coach?.role ?? defaultCoach.role;

        if (normalizeTeamName(teamLabel) === "brazil" && /^tecnico de |^coach of |^entrenador de /i.test(coachName)) {
          coachName = "Carlo Ancelotti";
          coachRole = uiText.player.coachRole;
        }

        const nextCoach = {
          name: coachName,
          team: teamLabel,
          role: coachRole,
          image: teamPayload.coach?.image ?? "",
        };

        setCoach(nextCoach);

        const achievements = await fetchPersonAchievementsByName(
          coachName,
          teamLabel,
          apiLanguage
        );
        if (!mounted) {
          return;
        }
        setCoachAchievements(achievements);
      } catch {
        const achievements = await fetchPersonAchievementsByName(
          defaultCoach.name,
          defaultCoach.team,
          apiLanguage
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
  }, [apiLanguage, teamName, uiText]);

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
    title: `${player?.name ?? uiText.player.defaultPlayerName} | GameGrid`,
    description: uiText.player.pageDescription(player?.name ?? uiText.player.defaultPlayerName),
    path: `/jogador/${encodeURIComponent(playerId)}?team=${encodeURIComponent(teamName)}`,
    type: "profile",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Person",
      name: player?.name ?? uiText.player.defaultPlayerName,
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
        <PlayerSkeleton label={uiText.common.loadingPlayer} />
        <PlayerSkeleton label={uiText.common.loadingPlayer} />
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
      <nav className="section-nav section-nav-sticky" aria-label={uiText.player.quickNavAria}>
        <a href="#jogador-perfil" className={activeSection === "jogador-perfil" ? "active" : ""}>
          {uiText.player.quickNavProfile}
        </a>
        <a
          href="#jogador-conquistas"
          className={activeSection === "jogador-conquistas" ? "active" : ""}
        >
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
              {player.image ? <img src={player.image} alt={player.name} /> : <span>{getInitials(player.name)}</span>}
            </div>
            <div>
              <h1>{player.name}</h1>
              <p>{player.team}</p>
              <p>{translatePosition(player.position, language)}</p>
            </div>
          </div>

          <div className="player-detail-grid">
            <div>
              <span>{uiText.common.labels.nationality}</span>
              <strong>{player.nationality}</strong>
            </div>
            <div>
              <span>{uiText.common.labels.birth}</span>
              <strong>
                {formatLabelDate(player.birth, locale, uiText.common.notAvailable)}
              </strong>
            </div>
            <div>
              <span>{uiText.common.labels.height}</span>
              <strong>{player.height}</strong>
            </div>
            <div>
              <span>{uiText.common.labels.weight}</span>
              <strong>{player.weight}</strong>
            </div>
          </div>

          <p className="player-description">
            {shorten(player.description, uiText.player.noSummary)}
          </p>
        </div>

        <section
          className="section-anchor"
          aria-label={uiText.player.achievementsAria}
          id="jogador-conquistas"
          data-section="jogador-conquistas"
          data-reveal="achievements"
        >
          <header className="squad-header">
            <h3 className="squad-title">{uiText.player.achievementsTitle}</h3>
            <p className="players-hint squad-subtitle">{uiText.player.achievementsSubtitle}</p>
          </header>

          <div className="achievements-grid">
            <ProfileShowcaseCard
              variant="panel"
              className="achievement-card"
              title={player.name}
              subtitle={player.team}
              eyebrow={uiText.player.playerEyebrow}
              badge={translatePosition(player.position, language)}
              description={uiText.player.playerDescription}
              metricValue={String(playerCount)}
              metricLabel={uiText.player.recordedAchievements}
              image={player.image}
              imageAlt={player.name}
            >
              {playerAchievements.length > 0 ? (
                <ul className="achievement-list" aria-label={uiText.player.achievementsPlayerAria}>
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
            </ProfileShowcaseCard>

            <ProfileShowcaseCard
              variant="panel"
              className="achievement-card"
              title={coach?.name ?? uiText.player.defaultCoachName(teamName)}
              subtitle={coach?.team ?? teamName}
              eyebrow={uiText.player.coachEyebrow}
              badge={coach?.role ?? uiText.player.coachRole}
              description={uiText.player.coachDescription}
              metricValue={String(coachCount)}
              metricLabel={uiText.player.recordedAchievements}
              image={coach?.image ?? ""}
              imageAlt={coach?.name ?? uiText.player.defaultCoachName(teamName)}
              mediaClassName="profile-showcase-media-coach"
            >
              {coachAchievements.length > 0 ? (
                <ul className="achievement-list" aria-label={uiText.player.achievementsCoachAria}>
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
            </ProfileShowcaseCard>
          </div>
        </section>
      </article>
    </section>
  );
}

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Link, useParams } from "react-router-dom";
import { getFlagByTeamName } from "../utils/flags";
import { fetchTeamDetails } from "../services/worldCupApi";
import { motionTokens } from "../animations/motionTokens";
import { useMotionPreferences } from "../hooks/useMotionPreferences";
import { useBackgroundMood } from "../hooks/useBackgroundMood";
import { seoDefaults, useSeo } from "../hooks/useSeo";
import { useLanguage } from "../context/LanguageContext";
import { translateBestFinish, translatePosition } from "../utils/footballText";
import ProfileShowcaseCard from "../components/ProfileShowcaseCard";

function decodeRouteTeam(routeValue) {
  try {
    return decodeURIComponent(routeValue ?? "");
  } catch {
    return routeValue ?? "";
  }
}

function TeamSkeleton({ label }) {
  return (
    <section className="page-card skeleton-card" aria-label={label}>
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
  const [activeSection, setActiveSection] = useState("time-resumo");
  const pageRef = useRef(null);
  const { shouldAnimate } = useMotionPreferences();
  const { setBackgroundMood } = useBackgroundMood();
  const { language, apiLanguage, uiText } = useLanguage();

  useEffect(() => {
    setBackgroundMood("focus");
    return () => setBackgroundMood("transition");
  }, [setBackgroundMood]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    fetchTeamDetails(teamName, apiLanguage).then((payload) => {
      if (!mounted) {
        return;
      }
      setTeamDetails(payload);
      setLoading(false);
    });

    return () => {
      mounted = false;
    };
  }, [apiLanguage, teamName]);

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
        if (revealType === "squad") {
          const spotlight = section.querySelector(".coach-spotlight-card");
          if (spotlight) {
            gsap.set(spotlight, {
              autoAlpha: 0,
              y: motionTokens.distance.md,
              scale: 0.98,
            });
          }
          gsap.set(section.querySelectorAll(".player-preview-card"), {
            autoAlpha: 0,
            y: motionTokens.distance.sm,
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

          if (revealType === "squad") {
            const spotlight = target.querySelector(".coach-spotlight-card");
            const cards = target.querySelectorAll(".player-preview-card");

            const timeline = gsap.timeline();

            if (spotlight) {
              timeline.to(spotlight, {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: motionTokens.duration.slow,
                ease: motionTokens.ease.emphasis,
                clearProps: "all",
              });
            }

            timeline.to(
              cards,
              {
                autoAlpha: 1,
                y: 0,
                duration: motionTokens.duration.medium,
                ease: motionTokens.ease.soft,
                stagger: motionTokens.stagger.tight,
                clearProps: "all",
              },
              spotlight ? 0.08 : 0
            );
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
  }, [shouldAnimate, teamDetails]);

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
  }, [teamDetails]);

  useEffect(() => {
    if (!pageRef.current || !shouldAnimate) {
      return undefined;
    }

    const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!supportsHover) {
      return undefined;
    }

    const cards = pageRef.current.querySelectorAll(".player-preview-card");

    const onMove = (event) => {
      const target = event.currentTarget;
      const rect = target.getBoundingClientRect();
      const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 8.5;
      const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -7.5;
      const media = target.querySelector(".player-card-media > img, .player-card-fallback");
      const content = target.querySelector(".player-card-content");
      const sheen = target.querySelector(".player-card-sheen");

      gsap.to(target, {
        rotateX,
        rotateY,
        y: -8,
        duration: 0.28,
        ease: motionTokens.ease.soft,
        overwrite: true,
      });

      if (media) {
        gsap.to(media, {
          x: rotateY * 1.35,
          y: rotateX * -1.15,
          scale: 1.05,
          duration: 0.3,
          ease: motionTokens.ease.soft,
          overwrite: true,
        });
      }

      if (content) {
        gsap.to(content, {
          x: rotateY * 0.8,
          y: -6 + rotateX * 0.25,
          duration: 0.3,
          ease: motionTokens.ease.soft,
          overwrite: true,
        });
      }

      if (sheen) {
        gsap.to(sheen, {
          xPercent: 22 + rotateY * 8,
          opacity: 0.92,
          duration: 0.32,
          ease: motionTokens.ease.soft,
          overwrite: true,
        });
      }
    };

    const onLeave = (event) => {
      const target = event.currentTarget;
      const media = target.querySelector(".player-card-media > img, .player-card-fallback");
      const content = target.querySelector(".player-card-content");
      const sheen = target.querySelector(".player-card-sheen");

      gsap.to(target, {
        rotateX: 0,
        rotateY: 0,
        y: 0,
        duration: 0.6,
        ease: "back.out(1.6)",
        overwrite: true,
      });

      if (media) {
        gsap.to(media, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: motionTokens.ease.soft,
          overwrite: true,
        });
      }

      if (content) {
        gsap.to(content, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: motionTokens.ease.soft,
          overwrite: true,
        });
      }

      if (sheen) {
        gsap.to(sheen, {
          xPercent: -42,
          opacity: 0,
          duration: 0.38,
          ease: motionTokens.ease.exit,
          overwrite: true,
        });
      }
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
    description: uiText.team.pageDescription(teamDetails?.teamName ?? teamName),
    path: `/time/${encodeURIComponent(teamName)}`,
    type: "profile",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SportsTeam",
      name: teamDetails?.teamName ?? teamName,
      sport: "Football",
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
        <TeamSkeleton label={uiText.common.loadingTeam} />
        <TeamSkeleton label={uiText.common.loadingTeam} />
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
      <nav className="section-nav section-nav-sticky" aria-label={uiText.team.quickNavAria}>
        <a href="#time-resumo" className={activeSection === "time-resumo" ? "active" : ""}>
          {uiText.team.quickNavSummary}
        </a>
        <a href="#time-elenco" className={activeSection === "time-elenco" ? "active" : ""}>
          {uiText.team.quickNavSquad}
        </a>
      </nav>

      <article
        className="page-card team-hero section-anchor"
        id="time-resumo"
        data-section="time-resumo"
        data-reveal="hero"
      >
        <Link to="/" className="text-link">
          {uiText.team.backToMatches}
        </Link>

        <div className="team-headline">
          {flagSrc ? (
            <img className="team-main-flag" src={flagSrc} alt={teamName} />
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
            <span>{uiText.team.worldCups}</span>
            <strong>{profile?.worldCups ?? uiText.common.notAvailable}</strong>
          </article>
          <article className="team-stat-card">
            <span>{uiText.team.bestCampaign}</span>
            <strong>
              {profile?.bestFinish
                ? translateBestFinish(profile.bestFinish, language)
                : uiText.common.notAvailable}
            </strong>
          </article>
          <article className="team-stat-card">
            <span>{uiText.team.fifaRank}</span>
            <strong>
              {profile?.fifaRank ? `#${profile.fifaRank}` : uiText.common.notAvailable}
            </strong>
          </article>
        </div>

        <div className="world-cup-history">
          <h3>{uiText.team.lastFiveWorldCups}</h3>
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

      <article
        className="page-card section-anchor"
        id="time-elenco"
        data-section="time-elenco"
        data-reveal="squad"
      >
        <header className="squad-header">
          <h2 className="squad-title">{uiText.team.mainPlayers}</h2>
          <p className="players-hint squad-subtitle">{uiText.team.clickPlayerHint}</p>
        </header>

        <ProfileShowcaseCard
          variant="spotlight"
          className="coach-spotlight-card"
          title={teamDetails.coach?.name ?? uiText.team.coachCommand}
          subtitle={`${teamDetails.teamName} | ${
            teamDetails.coach?.role ?? uiText.player.coachRole
          }`}
          eyebrow={uiText.team.coachCommand}
          badge={teamDetails.coach?.role ?? uiText.player.coachRole}
          description={uiText.team.coachDescription}
          image={teamDetails.coach?.image ?? ""}
          imageAlt={teamDetails.coach?.name ?? uiText.team.coachCommand}
          mediaClassName="profile-showcase-media-coach"
          showAura
        >
          <div className="coach-spotlight-meta">
            <div>
              <span>{uiText.team.selectionLabel}</span>
              <strong>{teamDetails.teamName}</strong>
            </div>
            <div>
              <span>{uiText.team.baseLabel}</span>
              <strong>{teamDetails.stadium}</strong>
            </div>
          </div>
        </ProfileShowcaseCard>

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
              <div className="player-card-sheen" aria-hidden="true" />
              <div className="player-card-media">
                {player.image ? (
                  <img src={player.image} alt={player.name} loading="lazy" />
                ) : (
                  <div className="player-card-fallback">{player.name.slice(0, 2).toUpperCase()}</div>
                )}
              </div>

              <section className="player-card-content">
                <span className="player-card-kicker">{uiText.team.mainSelection}</span>
                <h3>{player.name}</h3>
                <p>{translatePosition(player.position, language)}</p>
                <div className="player-card-meta">
                  <span className="player-card-tag">{uiText.team.playerTag}</span>
                  <span className="player-card-action">{uiText.team.openProfile}</span>
                </div>
              </section>
            </Link>
          ))}
        </div>
      </article>
    </section>
  );
}

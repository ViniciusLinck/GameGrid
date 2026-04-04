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

const SQUAD_GROUP_ORDER = ["goalkeeper", "defense", "midfield", "attack"];
const HISTORY_YEARS = ["2006", "2010", "2014", "2018", "2022"];
const FEATURED_QUOTAS = {
  goalkeeper: 1,
  defense: 4,
  midfield: 3,
  attack: 3,
};

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

function normalizePositionGroup(position) {
  const value = String(position ?? "").trim().toLowerCase();

  if (
    value.includes("goalkeeper") ||
    value.includes("keeper") ||
    value.includes("goleiro") ||
    value.includes("portero")
  ) {
    return "goalkeeper";
  }

  if (
    value.includes("back") ||
    value.includes("defender") ||
    value.includes("defensa") ||
    value.includes("zague") ||
    value.includes("lateral")
  ) {
    return "defense";
  }

  if (
    value.includes("midfield") ||
    value.includes("meio") ||
    value.includes("medio") ||
    value.includes("centro") ||
    value.includes("volante")
  ) {
    return "midfield";
  }

  return "attack";
}

function uniqueMedia(items) {
  const seen = new Set();
  return (items ?? []).filter((item) => {
    if (!item || seen.has(item)) {
      return false;
    }
    seen.add(item);
    return true;
  });
}

function splitParagraphs(text) {
  return String(text ?? "")
    .split(/\n{2,}/)
    .map((part) => part.replace(/\s+/g, " ").trim())
    .filter(Boolean);
}

function buildSquadGroups(players, uiText) {
  const groupedPlayers = players.reduce(
    (accumulator, player) => {
      const groupKey = normalizePositionGroup(player.position);
      accumulator[groupKey].push(player);
      return accumulator;
    },
    {
      goalkeeper: [],
      defense: [],
      midfield: [],
      attack: [],
    }
  );

  return SQUAD_GROUP_ORDER.map((groupKey) => ({
    key: groupKey,
    label: uiText.team.positionGroups[groupKey],
    players: groupedPlayers[groupKey],
  })).filter((group) => group.players.length > 0);
}

function sortPlayersForLineup(players) {
  return [...players].sort((left, right) => {
    const leftHasImage = left.image ? 1 : 0;
    const rightHasImage = right.image ? 1 : 0;
    if (leftHasImage !== rightHasImage) {
      return rightHasImage - leftHasImage;
    }

    return String(left.name ?? "").localeCompare(String(right.name ?? ""));
  });
}

function buildFeaturedSquad(players) {
  const groupedPlayers = players.reduce(
    (accumulator, player) => {
      const groupKey = normalizePositionGroup(player.position);
      accumulator[groupKey].push(player);
      return accumulator;
    },
    {
      goalkeeper: [],
      defense: [],
      midfield: [],
      attack: [],
    }
  );

  SQUAD_GROUP_ORDER.forEach((groupKey) => {
    groupedPlayers[groupKey] = sortPlayersForLineup(groupedPlayers[groupKey]);
  });

  const selectedIds = new Set();
  const featuredPlayers = [];

  SQUAD_GROUP_ORDER.forEach((groupKey) => {
    const quota = FEATURED_QUOTAS[groupKey];
    groupedPlayers[groupKey].slice(0, quota).forEach((player) => {
      featuredPlayers.push(player);
      selectedIds.add(player.id);
    });
  });

  if (featuredPlayers.length < 11) {
    sortPlayersForLineup(players)
      .filter((player) => !selectedIds.has(player.id))
      .slice(0, 11 - featuredPlayers.length)
      .forEach((player) => {
        featuredPlayers.push(player);
        selectedIds.add(player.id);
      });
  }

  const remainingPlayers = sortPlayersForLineup(players).filter((player) => !selectedIds.has(player.id));

  return {
    featuredPlayers,
    remainingPlayers,
  };
}

export default function TeamPage() {
  const { teamName: routeTeamName } = useParams();
  const teamName = decodeRouteTeam(routeTeamName);
  const [teamDetails, setTeamDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("time-resumo");
  const [showFullSquad, setShowFullSquad] = useState(false);
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
      setShowFullSquad(false);
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
  const teamPlayers = teamDetails?.players ?? [];
  const { featuredPlayers, remainingPlayers } = buildFeaturedSquad(teamPlayers);
  const squadGroups = buildSquadGroups(featuredPlayers, uiText);
  const fullSquadGroups = buildSquadGroups(teamPlayers, uiText);
  const historyTrack = HISTORY_YEARS.map((label, index) => ({
    label,
    result: profile?.last5WorldCups?.[index] ?? "-",
  }));
  const teamSummary = teamDetails?.summary || teamDetails?.description || uiText.common.notAvailable;
  const descriptionParagraphs = splitParagraphs(teamDetails?.description || teamSummary);
  const teamStory = descriptionParagraphs.length > 0 ? descriptionParagraphs : [teamSummary];
  const coachGallery = uniqueMedia([teamDetails?.coach?.image, ...(teamDetails?.coach?.gallery ?? [])]).slice(0, 4);
  const identityItems = [
    {
      label: uiText.team.selectionLabel,
      value: teamDetails?.country ?? uiText.common.notAvailable,
    },
    {
      label: uiText.team.founded,
      value: teamDetails?.founded ?? uiText.common.notAvailable,
    },
    {
      label: uiText.team.stadium,
      value: teamDetails?.stadium ?? uiText.common.notAvailable,
    },
    {
      label: uiText.team.fifaRank,
      value: profile?.fifaRank ? `#${profile.fifaRank}` : uiText.common.notAvailable,
    },
  ];

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
      member: featuredPlayers.map((player) => ({
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

        <div className="team-hero-shell">
          <div className="team-hero-primary">
            <div className="team-brand-stack" aria-hidden="true">
              <div className="team-brand-badge">
                {teamDetails.badge ? (
                  <img src={teamDetails.badge} alt="" loading="lazy" />
                ) : flagSrc ? (
                  <img className="team-brand-fallback-flag" src={flagSrc} alt="" loading="lazy" />
                ) : (
                  <span>{teamDetails.teamName.slice(0, 2).toUpperCase()}</span>
                )}
              </div>

              {flagSrc ? (
                <img className="team-main-flag" src={flagSrc} alt={teamName} />
              ) : (
                <div className="team-main-flag fallback">?</div>
              )}
            </div>

            <div className="team-headline-copy">
              <p className="team-headline-kicker">{uiText.team.heroEyebrow}</p>
              <h1>{teamDetails.teamName}</h1>
              <p className="team-headline-summary">{teamSummary}</p>

              <div className="team-identity-grid" aria-label={uiText.team.identityTitle}>
                {identityItems.map((item) => (
                  <article className="team-identity-card" key={item.label}>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <aside className="team-hero-aside">
            <header className="team-section-intro">
              <p className="team-section-kicker">{uiText.team.identityTitle}</p>
              <h2>{uiText.team.summaryTitle}</h2>
              <p>{uiText.team.identitySubtitle}</p>
            </header>

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
          </aside>
        </div>

        <div className="team-hero-secondary">
          <section className="world-cup-history">
            <h3>{uiText.team.lastFiveWorldCups}</h3>
            <div className="history-track">
              {historyTrack.map((entry) => (
                <div className="history-item" key={entry.label}>
                  <small>{entry.label}</small>
                  <strong>{entry.result}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="team-summary-panel">
            <h3>{uiText.team.summaryTitle}</h3>
            <div className="team-description">
              {teamStory.map((paragraph, index) => (
                <p key={`${paragraph.slice(0, 18)}-${index}`}>{paragraph}</p>
              ))}
            </div>
          </section>
        </div>
      </article>

      <article
        className="page-card section-anchor"
        id="time-elenco"
        data-section="time-elenco"
        data-reveal="squad"
      >
        <header className="squad-header">
          <p className="team-section-kicker">{uiText.team.squadFocus}</p>
          <h2 className="squad-title">{uiText.team.mainPlayers}</h2>
          <p className="players-hint squad-subtitle">
            {uiText.team.clickPlayerHint}
            {remainingPlayers.length > 0 ? ` ${uiText.team.fullSquadSubtitle}` : ""}
          </p>
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
        >
          <div className="coach-spotlight-stack">
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

            {coachGallery.length > 1 ? (
              <div className="coach-gallery-block">
                <span className="coach-gallery-label">{uiText.team.coachGalleryTitle}</span>
                <div className="coach-gallery-strip" aria-label={uiText.team.coachGalleryAria}>
                  {coachGallery.map((image, index) => (
                    <div className="coach-gallery-thumb" key={`${image}-${index}`}>
                      <img
                        src={image}
                        alt={`${teamDetails.coach?.name ?? uiText.team.coachCommand} ${index + 1}`}
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </ProfileShowcaseCard>

        <div className="squad-groups">
          {squadGroups.map((group) => (
            <section className="squad-group" key={group.key}>
              <header className="squad-group-header">
                <div>
                  <p className="squad-group-kicker">{uiText.team.squadFocus}</p>
                  <h3>{group.label}</h3>
                </div>
                <span>{uiText.team.groupCount(group.players.length)}</span>
              </header>

              <div className="player-grid squad-grid">
                {group.players.map((player) => (
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
                        <div className="player-card-fallback">
                          {player.name.slice(0, 2).toUpperCase()}
                        </div>
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
            </section>
          ))}
        </div>

        {remainingPlayers.length > 0 ? (
          <section className="full-squad-panel">
            <header className="full-squad-header">
              <div>
                <p className="team-section-kicker">{uiText.team.fullSquadTitle}</p>
                <h3>{uiText.team.fullSquadTitle}</h3>
                <p>{uiText.team.fullSquadSubtitle}</p>
              </div>

              <button
                type="button"
                className="squad-toggle-button"
                onClick={() => setShowFullSquad((value) => !value)}
              >
                {showFullSquad
                  ? uiText.team.hideFullSquad
                  : uiText.team.showFullSquad(teamPlayers.length)}
              </button>
            </header>

            {showFullSquad ? (
              <div className="squad-groups squad-groups-full">
                {fullSquadGroups.map((group) => (
                  <section className="squad-group squad-group-full" key={`full-${group.key}`}>
                    <header className="squad-group-header">
                      <div>
                        <p className="squad-group-kicker">{uiText.team.fullSquadTitle}</p>
                        <h3>{group.label}</h3>
                      </div>
                      <span>{uiText.team.groupCount(group.players.length)}</span>
                    </header>

                    <div className="player-grid squad-grid">
                      {group.players.map((player) => (
                        <Link
                          to={`/jogador/${encodeURIComponent(player.id)}?team=${encodeURIComponent(
                            teamDetails.teamName
                          )}`}
                          state={{ player }}
                          className="player-preview-card"
                          key={`full-${player.id}`}
                        >
                          <div className="player-card-sheen" aria-hidden="true" />
                          <div className="player-card-media">
                            {player.image ? (
                              <img src={player.image} alt={player.name} loading="lazy" />
                            ) : (
                              <div className="player-card-fallback">
                                {player.name.slice(0, 2).toUpperCase()}
                              </div>
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
                  </section>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}
      </article>
    </section>
  );
}

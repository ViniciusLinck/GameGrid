import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { gsap } from "gsap"
import { Link, useParams } from "react-router-dom"
import { fetchTeamDetails } from "../services/worldCupApi"
import { motionTokens } from "../animations/motionTokens"
import { useMotionPreferences } from "../hooks/useMotionPreferences"
import { useBackgroundMood } from "../hooks/useBackgroundMood"
import { seoDefaults, useSeo } from "../hooks/useSeo"
import { useLanguage } from "../context/LanguageContext"
import { translatePosition } from "../utils/footballText"
import { translateTeamName } from "../utils/teamNames"
import ProfileShowcaseCard from "../components/ProfileShowcaseCard"

const SQUAD_GROUP_ORDER = ["goalkeeper", "defense", "midfield", "attack"]
const STARTING_LINEUP_LIMITS = {
  goalkeeper: 1,
  defense: 4,
  midfield: 3,
  attack: 3,
}
const POSITION_FILTERS = ["all", ...SQUAD_GROUP_ORDER]

function decodeRouteTeam(routeValue) {
  try {
    return decodeURIComponent(routeValue ?? "")
  } catch {
    return routeValue ?? ""
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
  )
}

function normalizePositionGroup(position) {
  const value = String(position ?? "")
    .trim()
    .toLowerCase()

  if (
    value.includes("goalkeeper") ||
    value.includes("keeper") ||
    value.includes("goleiro") ||
    value.includes("portero")
  ) {
    return "goalkeeper"
  }

  if (
    value.includes("back") ||
    value.includes("defender") ||
    value.includes("defensa") ||
    value.includes("zague") ||
    value.includes("lateral")
  ) {
    return "defense"
  }

  if (
    value.includes("midfield") ||
    value.includes("meio") ||
    value.includes("medio") ||
    value.includes("centro") ||
    value.includes("volante")
  ) {
    return "midfield"
  }

  return "attack"
}

function uniqueMedia(items) {
  const seen = new Set()
  return (items ?? []).filter((item) => {
    if (!item || seen.has(item)) {
      return false
    }
    seen.add(item)
    return true
  })
}

function playerKey(player) {
  return String(player?.id ?? `${player?.name ?? ""}|${player?.position ?? ""}`)
    .trim()
    .toLowerCase()
}

function orderPlayersWithStarters(players, starterKeys) {
  const starters = []
  const others = []

  for (const player of players) {
    if (starterKeys.has(playerKey(player))) {
      starters.push(player)
    } else {
      others.push(player)
    }
  }

  return [...starters, ...others]
}

function selectStartingEleven(players) {
  const groupedPlayers = players.reduce(
    (accumulator, player) => {
      const groupKey = normalizePositionGroup(player.position)
      accumulator[groupKey].push(player)
      return accumulator
    },
    {
      goalkeeper: [],
      defense: [],
      midfield: [],
      attack: [],
    },
  )

  const selectedPlayers = []
  const selectedIds = new Set()

  for (const groupKey of SQUAD_GROUP_ORDER) {
    const limit = STARTING_LINEUP_LIMITS[groupKey] ?? 0
    for (const player of groupedPlayers[groupKey].slice(0, limit)) {
      if (selectedIds.has(player.id)) {
        continue
      }
      selectedIds.add(player.id)
      selectedPlayers.push(player)
    }
  }

  for (const player of players) {
    if (selectedPlayers.length >= 11) {
      break
    }
    if (selectedIds.has(player.id)) {
      continue
    }
    selectedIds.add(player.id)
    selectedPlayers.push(player)
  }

  return selectedPlayers.slice(0, 11)
}

export default function TeamPage() {
  const { teamName: routeTeamName } = useParams()
  const teamName = decodeRouteTeam(routeTeamName)
  const [teamDetails, setTeamDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activePositionGroup, setActivePositionGroup] = useState("all")
  const pageRef = useRef(null)
  const { shouldAnimate } = useMotionPreferences()
  const { setBackgroundMood } = useBackgroundMood()
  const { language, apiLanguage, uiText } = useLanguage()
  const displayedTeamName = useMemo(
    () => teamDetails?.displayName ?? translateTeamName(teamDetails?.teamName ?? teamName, language),
    [language, teamDetails?.displayName, teamDetails?.teamName, teamName],
  )

  useEffect(() => {
    setBackgroundMood("focus")
    return () => setBackgroundMood("transition")
  }, [setBackgroundMood])

  useEffect(() => {
    let mounted = true
    setLoading(true)

    fetchTeamDetails(teamName, apiLanguage).then((payload) => {
      if (!mounted) {
        return
      }
      setTeamDetails(payload)
      setLoading(false)
    })

    return () => {
      mounted = false
    }
  }, [apiLanguage, teamName])

  useLayoutEffect(() => {
    if (!shouldAnimate || !pageRef.current) {
      return undefined
    }

    const sections = pageRef.current.querySelectorAll("[data-reveal]")
    if (sections.length === 0) {
      return undefined
    }

    const context = gsap.context(() => {
      sections.forEach((section) => {
        const revealType = section.getAttribute("data-reveal")
        if (revealType === "squad") {
          const spotlight = section.querySelector(".coach-spotlight-card")
          if (spotlight) {
            gsap.set(spotlight, {
              autoAlpha: 0,
              y: motionTokens.distance.md,
              scale: 0.98,
            })
          }
          gsap.set(section.querySelectorAll(".player-preview-card"), {
            autoAlpha: 0,
            y: motionTokens.distance.sm,
          })
        }
      })
    }, pageRef)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return
          }

          const target = entry.target
          const revealType = target.getAttribute("data-reveal")

          if (revealType === "squad") {
            const spotlight = target.querySelector(".coach-spotlight-card")
            const cards = target.querySelectorAll(".player-preview-card")

            const timeline = gsap.timeline()

            if (spotlight) {
              timeline.to(spotlight, {
                autoAlpha: 1,
                y: 0,
                scale: 1,
                duration: motionTokens.duration.slow,
                ease: motionTokens.ease.emphasis,
                clearProps: "all",
              })
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
              spotlight ? 0.08 : 0,
            )
          }

          observer.unobserve(target)
        })
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    )

    sections.forEach((section) => observer.observe(section))

    return () => {
      observer.disconnect()
      context.revert()
    }
  }, [shouldAnimate, teamDetails, activePositionGroup])

  useEffect(() => {
    if (!pageRef.current || !shouldAnimate) {
      return undefined
    }

    const supportsHover = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    ).matches
    if (!supportsHover) {
      return undefined
    }

    const cards = pageRef.current.querySelectorAll(".player-preview-card")

    const onMove = (event) => {
      const target = event.currentTarget
      const rect = target.getBoundingClientRect()
      const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 8.5
      const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -7.5
      const media = target.querySelector(
        ".player-card-media > img, .player-card-fallback",
      )
      const content = target.querySelector(".player-card-content")
      const sheen = target.querySelector(".player-card-sheen")

      gsap.to(target, {
        rotateX,
        rotateY,
        y: -8,
        duration: 0.28,
        ease: motionTokens.ease.soft,
        overwrite: true,
      })

      if (media) {
        gsap.to(media, {
          x: rotateY * 1.35,
          y: rotateX * -1.15,
          scale: 1.05,
          duration: 0.3,
          ease: motionTokens.ease.soft,
          overwrite: true,
        })
      }

      if (content) {
        gsap.to(content, {
          x: rotateY * 0.8,
          y: -6 + rotateX * 0.25,
          duration: 0.3,
          ease: motionTokens.ease.soft,
          overwrite: true,
        })
      }

      if (sheen) {
        gsap.to(sheen, {
          xPercent: 22 + rotateY * 8,
          opacity: 0.92,
          duration: 0.32,
          ease: motionTokens.ease.soft,
          overwrite: true,
        })
      }
    }

    const onLeave = (event) => {
      const target = event.currentTarget
      const media = target.querySelector(
        ".player-card-media > img, .player-card-fallback",
      )
      const content = target.querySelector(".player-card-content")
      const sheen = target.querySelector(".player-card-sheen")

      gsap.to(target, {
        rotateX: 0,
        rotateY: 0,
        y: 0,
        duration: 0.6,
        ease: "back.out(1.6)",
        overwrite: true,
      })

      if (media) {
        gsap.to(media, {
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.5,
          ease: motionTokens.ease.soft,
          overwrite: true,
        })
      }

      if (content) {
        gsap.to(content, {
          x: 0,
          y: 0,
          duration: 0.5,
          ease: motionTokens.ease.soft,
          overwrite: true,
        })
      }

      if (sheen) {
        gsap.to(sheen, {
          xPercent: -42,
          opacity: 0,
          duration: 0.38,
          ease: motionTokens.ease.exit,
          overwrite: true,
        })
      }
    }

    cards.forEach((card) => {
      card.addEventListener("pointermove", onMove)
      card.addEventListener("pointerleave", onLeave)
    })

    return () => {
      cards.forEach((card) => {
        card.removeEventListener("pointermove", onMove)
        card.removeEventListener("pointerleave", onLeave)
      })
    }
  }, [shouldAnimate, teamDetails, activePositionGroup])

  const squadPlayers = teamDetails?.players ?? []
  const startingEleven = selectStartingEleven(squadPlayers)
  const starterKeys = useMemo(() => new Set(startingEleven.map(playerKey)), [startingEleven])
  const positionCounts = useMemo(
    () =>
      squadPlayers.reduce(
        (accumulator, player) => {
          const groupKey = normalizePositionGroup(player.position)
          accumulator[groupKey] += 1
          accumulator.all += 1
          return accumulator
        },
        {
          all: 0,
          goalkeeper: 0,
          defense: 0,
          midfield: 0,
          attack: 0,
        },
      ),
    [squadPlayers],
  )
  const visiblePlayers = useMemo(() => {
    const subset =
      activePositionGroup === "all"
        ? squadPlayers
        : squadPlayers.filter((player) => normalizePositionGroup(player.position) === activePositionGroup)

    return orderPlayersWithStarters(subset, starterKeys)
  }, [activePositionGroup, squadPlayers, starterKeys])
  const coachGallery = uniqueMedia([
    teamDetails?.coach?.image,
    ...(teamDetails?.coach?.gallery ?? []),
  ]).slice(0, 4)

  useSeo({
    title: `${displayedTeamName} | GameGrid`,
    description: uiText.team.pageDescription(displayedTeamName),
    path: `/time/${encodeURIComponent(teamName)}`,
    type: "profile",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "SportsTeam",
      name: displayedTeamName,
      sport: "Football",
      url: `${seoDefaults.siteUrl}/time/${encodeURIComponent(teamName)}`,
      member: squadPlayers.map((player) => ({
        "@type": "Person",
        name: player.name,
      })),
    },
  })

  if (loading) {
    return (
      <>
        <TeamSkeleton label={uiText.common.loadingTeam} />
        <TeamSkeleton label={uiText.common.loadingTeam} />
      </>
    )
  }

  if (!teamDetails) {
    return (
      <section className="page-card">
        <h2>{uiText.team.loadError}</h2>
        <Link to="/" className="text-link">
          {uiText.team.backToCalendar}
        </Link>
      </section>
    )
  }

  return (
    <section ref={pageRef}>
      <article
        className="page-card section-anchor"
        id="time-elenco"
        data-section="time-elenco"
        data-reveal="squad"
      >
        <header className="squad-header">
          <Link to="/" className="text-link">
            {uiText.team.backToMatches}
          </Link>
          <p className="team-section-kicker" style={{ marginTop: "1.5rem" }}>
            {uiText.team.squadFocus}
          </p>
          <h1 className="squad-title">{displayedTeamName}</h1>
        </header>

        <ProfileShowcaseCard
          variant="spotlight"
          className="coach-spotlight-card"
          title={teamDetails.coach?.name ?? uiText.team.coachCommand}
          subtitle={`${displayedTeamName} | ${
            teamDetails.coach?.role ?? uiText.team.coachRole
          }`}
          eyebrow={uiText.team.coachCommand}
          badge={teamDetails.coach?.role ?? uiText.team.coachRole}
          image={teamDetails.coach?.image ?? ""}
          imageAlt={teamDetails.coach?.name ?? uiText.team.coachCommand}
          mediaClassName="profile-showcase-media-coach"
        >
          <div className="coach-spotlight-stack">
            <div className="coach-spotlight-meta">
              <div>
                <span>{uiText.team.selectionLabel}</span>
                <strong>{displayedTeamName}</strong>
              </div>
              <div>
                <span>{uiText.team.baseLabel}</span>
                <strong>{teamDetails.stadium}</strong>
              </div>
            </div>

            {coachGallery.length > 1 ? (
              <div className="coach-gallery-block">
                <span className="coach-gallery-label">
                  {uiText.team.coachGalleryTitle}
                </span>
                <div
                  className="coach-gallery-strip"
                  aria-label={uiText.team.coachGalleryAria}
                >
                  {coachGallery.map((image, index) => (
                    <div
                      className="coach-gallery-thumb"
                      key={`${image}-${index}`}
                    >
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
          <section className="squad-group">
            <header className="squad-group-header">
              <div>
                <p className="squad-group-kicker">{uiText.team.squadFocus}</p>
                <h3>{uiText.team.fullSquadTitle}</h3>
              </div>
              <span>{uiText.team.groupCount(visiblePlayers.length)}</span>
            </header>

            <div className="squad-filter-bar" role="toolbar" aria-label={uiText.team.positionFilterLabel}>
              {POSITION_FILTERS.map((groupKey) => {
                const isActive = activePositionGroup === groupKey
                const label =
                  groupKey === "all"
                    ? uiText.team.allPositions
                    : uiText.team.positionGroups[groupKey]
                const count = positionCounts[groupKey] ?? positionCounts.all

                return (
                  <button
                    key={groupKey}
                    type="button"
                    className={`squad-filter-chip ${isActive ? "is-active" : ""}`}
                    onClick={() => setActivePositionGroup(groupKey)}
                    aria-pressed={isActive}
                  >
                    <span>{label}</span>
                    <small>{count}</small>
                  </button>
                )
              })}
            </div>

            <div className="player-grid squad-grid">
              {visiblePlayers.map((player) => {
                const isStarter = starterKeys.has(playerKey(player))

                return (
                  <article
                    className={`player-preview-card ${isStarter ? "player-preview-card-starter" : ""}`}
                    key={playerKey(player)}
                  >
                    <div className="player-card-sheen" aria-hidden="true" />
                    {isStarter ? (
                      <span className="player-card-badge">{uiText.team.starterBadge}</span>
                    ) : null}
                    <div className="player-card-media">
                      {player.image || player.gallery?.[0] ? (
                        <img
                          src={player.image || player.gallery?.[0]}
                          alt={player.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="player-card-fallback">
                          {player.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <section className="player-card-content">
                      <span className="player-card-kicker">
                        {uiText.team.mainSelection}
                      </span>
                      <h3>{player.name}</h3>
                      <p>{translatePosition(player.position, language)}</p>
                    </section>
                  </article>
                )
              })}
            </div>
          </section>
        </div>
      </article>
    </section>
  )
}

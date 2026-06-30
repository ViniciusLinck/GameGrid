import { useEffect, useMemo, useState } from "react";
import { getCazetvWatchUrl } from "../data/cazetvStreams";
import { getFlagByTeamName } from "../utils/flags";
import { useLanguage } from "../context/LanguageContext";
import { usePrivacy } from "../context/PrivacyContext";
import { translateTeamName } from "../utils/teamNames";
import { getMatchStatus } from "../utils/matchUtils";
import TeamBadge from "./TeamBadge";
import { PollWidget } from "./poll";

function formatCountdown(targetDate, now) {
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs <= 0) {
    return "0m 0s";
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m ${seconds}s`;
}

function buildMapsUrl(venue) {
  const query = `${venue.stadium}, ${venue.city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function getReferencedMatchNumber(teamName) {
  const directMatch = String(teamName ?? "").match(
    /(?:vencedor|perdedor|winner|loser|ganador)\s+(?:do\s+|del\s+|of\s+)?(?:jogo|match|partido)\s+(\d+)/i
  );

  return directMatch ? Number(directMatch[1]) : null;
}

function getSemifinalReference(teamName) {
  const match = String(teamName ?? "").match(
    /(?:vencedor|perdedor|winner|loser|ganador)\s+(?:da\s+|de\s+la\s+|of\s+)?(?:semifinal|semi-final)\s+(\d+)/i
  );

  return match ? Number(match[1]) : null;
}

function resolveReferencedMatch(teamName, allMatches = []) {
  const referencedMatchNumber = getReferencedMatchNumber(teamName);
  if (referencedMatchNumber) {
    return allMatches.find((candidate) => Number(candidate.id) === referencedMatchNumber) ?? null;
  }

  const semifinalIndex = getSemifinalReference(teamName);
  if (semifinalIndex) {
    const semifinalMatches = allMatches
      .filter((candidate) => candidate.stageKey === "semi_final")
      .sort((left, right) => Number(left.id) - Number(right.id));
    return semifinalMatches[semifinalIndex - 1] ?? null;
  }

  return null;
}

function buildReferenceTooltip(referencedMatch, language, uiText) {
  if (!referencedMatch) {
    return null;
  }

  const homeTeamName = translateTeamName(referencedMatch.homeTeam.name, language);
  const awayTeamName = translateTeamName(referencedMatch.awayTeam.name, language);
  const homeFlagSrc =
    referencedMatch.homeTeam.flagSrc ||
    getFlagByTeamName(referencedMatch.homeTeam.name) ||
    getFlagByTeamName(homeTeamName);
  const awayFlagSrc =
    referencedMatch.awayTeam.flagSrc ||
    getFlagByTeamName(referencedMatch.awayTeam.name) ||
    getFlagByTeamName(awayTeamName);

  return (
    <span className="team-reference-tooltip" aria-label={`${uiText.match.matchNumber(referencedMatch.id)}: ${homeTeamName} x ${awayTeamName}`}>
      <span className="team-reference-team">
        {homeFlagSrc ? <img src={homeFlagSrc} alt="" loading="lazy" /> : <span>{homeTeamName.slice(0, 2).toUpperCase()}</span>}
        <strong>{homeTeamName}</strong>
      </span>
      <span className="team-reference-versus">x</span>
      <span className="team-reference-team">
        {awayFlagSrc ? <img src={awayFlagSrc} alt="" loading="lazy" /> : <span>{awayTeamName.slice(0, 2).toUpperCase()}</span>}
        <strong>{awayTeamName}</strong>
      </span>
    </span>
  );
}

function TeamSide({ team, displayName, tooltip = null, tooltipId = "" }) {
  const resolvedFlagSrc = team.flagSrc || getFlagByTeamName(team.name) || getFlagByTeamName(displayName);
  const content = (
    <TeamBadge
      name={displayName}
      flagSrc={resolvedFlagSrc}
      tooltip={tooltip}
      tooltipId={tooltipId}
    />
  );

  return <div className="team-link team-link-static">{content}</div>;
}

function resolveMatchStart(match) {
  if (match?.kickoffUtc) {
    const startDate = new Date(match.kickoffUtc);
    if (!Number.isNaN(startDate.getTime())) {
      return startDate;
    }
  }

  const fallbackDate = new Date(`${match?.date}T${(match?.kickoff || "00:00").slice(0, 5)}:00`);
  return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
}

export default function MatchCard({ match, featured = false, allMatches = [] }) {
  const [showPoll, setShowPoll] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const { language, locale, pollLanguage, uiText } = useLanguage();
  const { preferences } = usePrivacy();
  const mapsUrl = match.mapsUrl ?? buildMapsUrl(match.venue);
  const startsAt = resolveMatchStart(match);
  const startsAtIso = startsAt?.toISOString() ?? "";
  const matchStatus = getMatchStatus(match, now);
  const isLive = matchStatus === "live";
  const isFinished = matchStatus === "finished";
  const hasScore = match.homeScore != null && match.awayScore != null;
  const countdownLabel = featured && startsAt && matchStatus === "upcoming" ? formatCountdown(startsAt, now) : null;
  const pollMode =
    import.meta.env.VITE_POLL_MODE === "local" || !preferences.allowRemotePoll
      ? "local"
      : "remote";

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
      }),
    [locale]
  );

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
    [locale]
  );

  const displayDate = startsAt
    ? dateFormatter.format(startsAt).replace(".", "").toUpperCase()
    : dateFormatter
        .format(new Date(`${match.date}T12:00:00`))
        .replace(".", "")
        .toUpperCase();
  const displayTime = startsAt ? timeFormatter.format(startsAt) : match.kickoff;
  const homeTeamName = translateTeamName(match.homeTeam.name, language);
  const awayTeamName = translateTeamName(match.awayTeam.name, language);
  const homeTooltip = buildReferenceTooltip(
    resolveReferencedMatch(match.homeTeam.name, allMatches),
    language,
    uiText
  );
  const awayTooltip = buildReferenceTooltip(
    resolveReferencedMatch(match.awayTeam.name, allMatches),
    language,
    uiText
  );
  const watchUrl = getCazetvWatchUrl(match.homeTeam.name, match.awayTeam.name);
  const scoreLabel = hasScore ? `${match.homeScore} - ${match.awayScore}` : "x";

  useEffect(() => {
    if (!featured) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [featured]);

  return (
    <article id={`match-${match.id}`} className={`match-card ${featured ? "match-card-featured" : ""}`}>
      <div className="match-header">
        <p>{uiText.match.matchNumber(match.id)}</p>
        <span>{match.group ? `${match.stage} | ${match.group}` : match.stage}</span>
      </div>
      {featured && isLive ? <p className="match-live-badge">{uiText.match.liveBadge}</p> : null}
      {isLive && match.matchTime ? <p className="match-live-badge">{match.matchTime}</p> : null}
      {isFinished ? <p className="match-result-badge">Finalizado</p> : null}
      {countdownLabel ? <p className="match-countdown">{uiText.match.startsIn(countdownLabel)}</p> : null}

      <div className="match-sides">
        <TeamSide
          team={match.homeTeam}
          displayName={homeTeamName}
          tooltip={homeTooltip}
          tooltipId={`match-${match.id}-home-reference`}
        />

        <span className={`versus ${hasScore ? "match-score" : ""}`}>{scoreLabel}</span>

        <TeamSide
          team={match.awayTeam}
          displayName={awayTeamName}
          tooltip={awayTooltip}
          tooltipId={`match-${match.id}-away-reference`}
        />
      </div>

      <div className="match-footer">
        <p>{displayDate}</p>
        <p>{displayTime}</p>
        <p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="venue-link"
            title={uiText.match.mapsTitle(match.venue.stadium)}
          >
            {match.venue.stadium}
            <br />
            {match.venue.city}
          </a>
        </p>
      </div>

      <div className="match-actions">
        <button
          type="button"
          className="rounded-full border border-[#8dcfff5e] px-3 py-1 text-[0.7rem] text-[#d3e8ff]"
          onClick={() => setShowPoll((current) => !current)}
          aria-expanded={showPoll}
          aria-controls={`poll-widget-${match.id}`}
        >
          {showPoll ? uiText.match.hidePrediction : uiText.match.crowdPrediction}
        </button>

        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="match-action-watch"
          title={uiText.match.watchTitle}
        >
          {uiText.match.watch}
        </a>
      </div>

      {showPoll ? (
        <div id={`poll-widget-${match.id}`}>
          <PollWidget
            matchId={match.id}
            homeName={homeTeamName}
            awayName={awayTeamName}
            startsAtUtc={startsAtIso}
            venue={match.venue}
            mode={pollMode}
            lang={pollLanguage}
          />
        </div>
      ) : null}
    </article>
  );
}

export function MatchCardSkeleton({ featured = false }) {
  return (
    <article
      className={`match-card ${featured ? "match-card-featured" : ""} skeleton-card`}
      aria-hidden="true"
    >
      <div className="skeleton-row w-60" />
      <div className="skeleton-row w-80" />
      <div className="skeleton-grid">
        <div className="skeleton-box" />
        <div className="skeleton-box" />
        <div className="skeleton-box" />
      </div>
      <div className="skeleton-row w-70" />
      <div className="skeleton-row w-90" />
      <div className="skeleton-row w-60" />
    </article>
  );
}

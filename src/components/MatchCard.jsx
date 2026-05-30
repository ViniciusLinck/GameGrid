import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getCazetvWatchUrl } from "../data/cazetvStreams";
import { useLanguage } from "../context/LanguageContext";
import { usePrivacy } from "../context/PrivacyContext";
import { translateTeamName } from "../utils/teamNames";
import TeamBadge from "./TeamBadge";
import { PollWidget } from "./poll";

const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;

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

function teamRoute(teamName) {
  return `/time/${encodeURIComponent(teamName)}`;
}

function TeamSide({ team, displayName }) {
  const content = <TeamBadge name={displayName} flagSrc={team.flagSrc} />;

  if (team?.isPlaceholder) {
    return <div className="team-link team-link-static">{content}</div>;
  }

  return (
    <Link to={teamRoute(team.name)} className="team-link">
      {content}
    </Link>
  );
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

export default function MatchCard({ match, featured = false }) {
  const [showPoll, setShowPoll] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const { language, locale, pollLanguage, uiText } = useLanguage();
  const { preferences } = usePrivacy();
  const mapsUrl = match.mapsUrl ?? buildMapsUrl(match.venue);
  const startsAt = resolveMatchStart(match);
  const startsAtIso = startsAt?.toISOString() ?? "";
  const isLive =
    startsAt &&
    now.getTime() >= startsAt.getTime() &&
    now.getTime() < startsAt.getTime() + MATCH_DURATION_MS;
  const countdownLabel = featured && startsAt && !isLive ? formatCountdown(startsAt, now) : null;
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
  const watchUrl = getCazetvWatchUrl(match.homeTeam.name, match.awayTeam.name);

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
      {countdownLabel ? <p className="match-countdown">{uiText.match.startsIn(countdownLabel)}</p> : null}

      <div className="match-sides">
        <TeamSide team={match.homeTeam} displayName={homeTeamName} />

        <span className="versus">x</span>

        <TeamSide team={match.awayTeam} displayName={awayTeamName} />
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

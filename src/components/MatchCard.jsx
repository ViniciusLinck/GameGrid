import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TeamBadge from "./TeamBadge";
import { PollWidget } from "./poll";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatCountdown(targetDate, now) {
  const diffMs = targetDate.getTime() - now.getTime();
  if (diffMs <= 0) {
    return "Já começou";
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

function formatDateLabel(dateISO) {
  return dateFormatter
    .format(new Date(`${dateISO}T12:00:00`))
    .replace(".", "")
    .toUpperCase();
}

function buildMapsUrl(venue) {
  const query = `${venue.stadium}, ${venue.city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function teamRoute(teamName) {
  return `/time/${encodeURIComponent(teamName)}`;
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

const CAZETV_YOUTUBE_URL = "https://www.youtube.com/@CazeTV";

export default function MatchCard({ match }) {
  const [showPoll, setShowPoll] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const mapsUrl = match.mapsUrl ?? buildMapsUrl(match.venue);
  const isFeatured = match.id === 1;
  const startsAt = resolveMatchStart(match);
  const startsAtIso = startsAt?.toISOString() ?? "";
  const countdownLabel = isFeatured && startsAt ? formatCountdown(startsAt, now) : null;
  const displayDate = startsAt ? formatDateLabel(startsAtIso.slice(0, 10)) : formatDateLabel(match.date);
  const displayTime = startsAt ? timeFormatter.format(startsAt) : match.kickoff;

  useEffect(() => {
    if (!isFeatured) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isFeatured]);

  return (
    <article id={`match-${match.id}`} className={`match-card ${isFeatured ? "match-card-featured" : ""}`}>
      <div className="match-header">
        <p>Jogo {match.id}</p>
        <span>{match.stage}</span>
      </div>
      {countdownLabel ? <p className="match-countdown">Começa em {countdownLabel}</p> : null}

      <div className="match-sides">
        <Link to={teamRoute(match.homeTeam.name)} className="team-link">
          <TeamBadge name={match.homeTeam.name} />
        </Link>

        <span className="versus">x</span>

        <Link to={teamRoute(match.awayTeam.name)} className="team-link">
          <TeamBadge name={match.awayTeam.name} />
        </Link>
      </div>

      <div className="match-footer">
        <p>{displayDate}</p>
        <p>{displayTime}</p>
        <p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="venue-link"
            title={`Abrir ${match.venue.stadium} no Google Maps`}
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
          {showPoll ? "Ocultar previsao" : "Previsao da torcida"}
        </button>

        <a
          href={CAZETV_YOUTUBE_URL}
          target="_blank"
          rel="noreferrer"
          className="match-action-watch"
          title="Assistir na CazeTV"
        >
          Assistir
        </a>
      </div>

      {showPoll ? (
        <div id={`poll-widget-${match.id}`}>
          <PollWidget
            matchId={match.id}
            homeName={match.homeTeam.name}
            awayName={match.awayTeam.name}
            startsAtUtc={startsAtIso}
            venue={match.venue}
            mode={import.meta.env.VITE_POLL_MODE === "remote" ? "remote" : "local"}
            lang={(import.meta.env.VITE_POLL_LANG || "pt").slice(0, 2)}
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

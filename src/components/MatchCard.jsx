import { useState } from "react";
import { Link } from "react-router-dom";
import TeamBadge from "./TeamBadge";
import { PollWidget } from "./poll";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  day: "2-digit",
  month: "2-digit",
});

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

const CAZETV_YOUTUBE_URL = "https://www.youtube.com/@CazeTV";

export default function MatchCard({ match }) {
  const [showPoll, setShowPoll] = useState(false);
  const mapsUrl = match.mapsUrl ?? buildMapsUrl(match.venue);
  const isFeatured = match.id === 1;
  const startsAtUtc = `${match.date}T${(match.kickoff || "00:00").slice(0, 5)}:00Z`;

  return (
    <article className={`match-card ${isFeatured ? "match-card-featured" : ""}`}>
      <div className="match-header">
        <p>Jogo {match.id}</p>
        <span>{match.stage}</span>
      </div>

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
        <p>{formatDateLabel(match.date)}</p>
        <p>{match.kickoff}</p>
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
          className="rounded-full border border-[#8dcfff5e] px-2 py-1 text-[0.72rem] text-[#d3e8ff]"
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
          className="rounded-full border border-[#ff5a7d88] px-3 py-1 text-[0.72rem] font-semibold text-[#ffd7e1] no-underline"
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
            startsAtUtc={startsAtUtc}
            venue={match.venue}
            mode={import.meta.env.VITE_POLL_MODE === "remote" ? "remote" : "local"}
            lang={(import.meta.env.VITE_POLL_LANG || "pt").slice(0, 2)}
          />
        </div>
      ) : null}
    </article>
  );
}

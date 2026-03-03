import { Link } from "react-router-dom";
import TeamBadge from "./TeamBadge";

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

export default function MatchCard({ match }) {
  const mapsUrl = match.mapsUrl ?? buildMapsUrl(match.venue);
  const isFeatured = match.id === 1;

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

        <span className="versus">VS</span>

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
    </article>
  );
}

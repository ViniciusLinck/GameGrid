import { buildMapsUrlFromVenue } from "../../services/mapsHelper";
import { formatMatchTimeToUserZone } from "../../utils/timezone";

export default function GameCard({
  match,
  isFavorite = false,
  onToggleFavorite,
  onOpenDetails,
  locale = "pt-BR",
}) {
  const kickoff = formatMatchTimeToUserZone(match.date, match.time || match.kickoff, locale);
  const mapsUrl = buildMapsUrlFromVenue(match.venue);

  return (
    <article className="rounded-xl border border-[#73b8ff42] bg-[#070d1dd1] p-4">
      <header className="flex items-center justify-between gap-2">
        <p className="text-sm text-ink-300">{match.stage}</p>
        <button
          type="button"
          className="rounded-full border border-[#ffd06173] px-3 py-1 text-xs text-[#ffe7a5]"
          onClick={() => onToggleFavorite?.(match)}
        >
          {isFavorite ? "Favorito" : "Favoritar"}
        </button>
      </header>

      <h3 className="mt-3 text-lg font-semibold text-white">
        {match.homeTeam.name} x {match.awayTeam.name}
      </h3>

      <div className="mt-3 space-y-1 text-sm text-ink-300">
        <p>
          {kickoff.dateLabel} as {kickoff.timeLabel}
        </p>
        <p>Timezone detectado: {kickoff.timeZone}</p>
        <p>
          {match.venue.stadium} - {match.venue.city}
        </p>
      </div>

      <footer className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-full border border-[#8dcfff5e] px-3 py-1 text-xs text-[#d3e8ff]"
          onClick={() => onOpenDetails?.(match)}
        >
          Ver detalhes
        </button>
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-[#8dcfff5e] px-3 py-1 text-xs text-[#d3e8ff] no-underline"
        >
          Abrir mapa
        </a>
      </footer>
    </article>
  );
}

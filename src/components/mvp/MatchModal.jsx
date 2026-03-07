import { buildMapsUrlFromVenue } from "../../services/mapsHelper";
import { formatMatchTimeToUserZone } from "../../utils/timezone";

function shareUrl(baseText) {
  return encodeURIComponent(baseText);
}

export default function MatchModal({ match, isOpen, onClose }) {
  if (!isOpen || !match) {
    return null;
  }

  const kickoff = formatMatchTimeToUserZone(match.date, match.time || match.kickoff);
  const text = `${match.homeTeam.name} x ${match.awayTeam.name} | ${kickoff.dateLabel} ${kickoff.timeLabel}`;
  const mapsUrl = buildMapsUrlFromVenue(match.venue);
  const wa = `https://wa.me/?text=${shareUrl(text)}`;
  const x = `https://twitter.com/intent/tweet?text=${shareUrl(text)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712c7] p-4">
      <section className="w-full max-w-xl rounded-2xl border border-[#73b8ff42] bg-[#070d1df5] p-5">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {match.homeTeam.name} x {match.awayTeam.name}
            </h2>
            <p className="text-sm text-ink-300">{match.stage}</p>
          </div>
          <button
            type="button"
            className="rounded-full border border-[#ffffff30] px-3 py-1 text-sm text-ink-300"
            onClick={onClose}
          >
            Fechar
          </button>
        </header>

        <div className="mt-4 space-y-1 text-sm text-ink-300">
          <p>
            {kickoff.dateLabel} as {kickoff.timeLabel}
          </p>
          <p>Timezone: {kickoff.timeZone}</p>
          <p>
            {match.venue.stadium} - {match.venue.city}
          </p>
          <p>Status: {match.status}</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <a href={wa} target="_blank" rel="noreferrer" className="rounded-full border border-[#25d36680] px-3 py-1 text-xs text-[#b9f5ce] no-underline">WhatsApp</a>
          <a href={x} target="_blank" rel="noreferrer" className="rounded-full border border-[#8dcfff5e] px-3 py-1 text-xs text-[#d3e8ff] no-underline">Twitter</a>
          <a href={fb} target="_blank" rel="noreferrer" className="rounded-full border border-[#8dcfff5e] px-3 py-1 text-xs text-[#d3e8ff] no-underline">Facebook</a>
          <a href={mapsUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[#8dcfff5e] px-3 py-1 text-xs text-[#d3e8ff] no-underline">Mapa do estadio</a>
        </div>
      </section>
    </div>
  );
}

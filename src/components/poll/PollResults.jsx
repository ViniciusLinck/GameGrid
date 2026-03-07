import { pluralizeVotes } from "../../utils/pollUtils";
import { getPollText } from "../../data/pollText";

const BAR_COLORS = {
  home: "bg-[#16a6b6]",
  draw: "bg-[#f5d061]",
  away: "bg-[#ff5a7d]",
};

function historyLabel(item, lang) {
  const t = getPollText(lang);
  const when = new Date(item.createdAt ?? item.clearedAt ?? Date.now()).toLocaleString(
    lang === "pt" ? "pt-BR" : lang
  );

  if (item.type === "clear") {
    return `${t.clearVote} - ${when}`;
  }

  return `${item.choice} - ${when}`;
}

export default function PollResults({
  homeName,
  awayName,
  result,
  history = [],
  lang = "pt",
}) {
  const t = getPollText(lang);
  const total = result?.total ?? 0;
  const percentages = result?.percentages ?? { home: 0, draw: 0, away: 0 };

  const rows = [
    { id: "home", label: homeName, percent: percentages.home },
    { id: "draw", label: t.draw, percent: percentages.draw },
    { id: "away", label: awayName, percent: percentages.away },
  ];

  return (
    <section aria-live="polite" className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-300">
            <span>{row.label}</span>
            <span>{row.percent}%</span>
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-[#0c1730]"
            role="progressbar"
            aria-label={`${row.label} ${row.percent}%`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={row.percent}
          >
            <div
              className={`h-full transition-all duration-300 ${BAR_COLORS[row.id]}`}
              style={{ width: `${row.percent}%` }}
            />
          </div>
        </div>
      ))}

      <p className="pt-1 text-xs text-ink-300">
        {total} {pluralizeVotes(total, lang)}
      </p>

      {history.length > 0 ? (
        <div className="pt-1">
          <p className="text-[11px] uppercase tracking-[0.05em] text-ink-400">{t.history}</p>
          <ul className="mt-1 space-y-1 text-xs text-ink-300">
            {history.slice(0, 5).map((item, index) => (
              <li key={`${item.createdAt ?? item.clearedAt ?? "item"}-${index}`}>
                {historyLabel(item, lang)}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

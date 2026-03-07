const STATUS_OPTIONS = ["todos", "agendado", "ao vivo", "finalizado"];

export default function FiltersBar({
  teams = [],
  stages = [],
  values,
  onChange,
  showOnlyFavorites,
  onToggleFavorites,
}) {
  return (
    <section className="rounded-xl border border-[#73b8ff42] bg-[#070d1dd1] p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 text-xs text-ink-300">
          Selecao
          <select
            className="rounded-lg border border-[#84c6ff57] bg-[#0f1e3ad6] px-3 py-2 text-sm text-white"
            value={values.team}
            onChange={(event) => onChange({ ...values, team: event.target.value })}
          >
            <option value="">Todas</option>
            {teams.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-300">
          Fase
          <select
            className="rounded-lg border border-[#84c6ff57] bg-[#0f1e3ad6] px-3 py-2 text-sm text-white"
            value={values.stage}
            onChange={(event) => onChange({ ...values, stage: event.target.value })}
          >
            <option value="">Todas</option>
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-300">
          Data
          <input
            type="date"
            className="rounded-lg border border-[#84c6ff57] bg-[#0f1e3ad6] px-3 py-2 text-sm text-white"
            value={values.date}
            onChange={(event) => onChange({ ...values, date: event.target.value })}
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-ink-300">
          Status
          <select
            className="rounded-lg border border-[#84c6ff57] bg-[#0f1e3ad6] px-3 py-2 text-sm text-white"
            value={values.status}
            onChange={(event) => onChange({ ...values, status: event.target.value })}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button
            type="button"
            className="w-full rounded-lg border border-[#ffd06173] bg-[#47361099] px-3 py-2 text-sm text-[#ffe7a5]"
            onClick={onToggleFavorites}
          >
            {showOnlyFavorites ? "Mostrar todos" : "Meus favoritos"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default function GroupTable({ rows = [], title = "Tabela de grupos" }) {
  return (
    <section className="rounded-xl border border-[#73b8ff42] bg-[#070d1dd1] p-4">
      <header className="mb-3">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </header>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-ink-300">
            <tr>
              <th className="px-2 py-2">Time</th>
              <th className="px-2 py-2">PTS</th>
              <th className="px-2 py-2">J</th>
              <th className="px-2 py-2">V</th>
              <th className="px-2 py-2">E</th>
              <th className="px-2 py-2">D</th>
              <th className="px-2 py-2">SG</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.team} className="border-t border-[#6aaeff30] text-ink-300">
                <td className="px-2 py-2 font-medium text-white">{row.team}</td>
                <td className="px-2 py-2">{row.points}</td>
                <td className="px-2 py-2">{row.games}</td>
                <td className="px-2 py-2">{row.wins}</td>
                <td className="px-2 py-2">{row.draws}</td>
                <td className="px-2 py-2">{row.losses}</td>
                <td className="px-2 py-2">{row.goalDiff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

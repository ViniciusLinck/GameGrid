import { useMemo } from "react";
import MatchCard, { MatchCardSkeleton } from "../components/MatchCard";
import TeamBadge from "../components/TeamBadge";
import { useLanguage } from "../context/LanguageContext";
import { useSeo } from "../hooks/useSeo";
import { useWorldCup2026Matches } from "../hooks/useWorldCup2026Matches";
import { buildGroupStandings, groupKnockoutMatches } from "../utils/matchUtils";
import { translateTeamName } from "../utils/teamNames";

function GroupTable({ group, rows, language }) {
  return (
    <section className="group-table-card">
      <header className="group-table-header">
        <h2>Grupo {group}</h2>
      </header>

      <div className="group-table-scroll">
        <table className="group-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>PTS</th>
              <th>J</th>
              <th>V</th>
              <th>E</th>
              <th>D</th>
              <th>GP</th>
              <th>GC</th>
              <th>SG</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${group}-${row.team}`}>
                <td>
                  <TeamBadge name={translateTeamName(row.team, language)} flagSrc={row.flagSrc} />
                </td>
                <td>{row.points}</td>
                <td>{row.games}</td>
                <td>{row.wins}</td>
                <td>{row.draws}</td>
                <td>{row.losses}</td>
                <td>{row.goalsFor}</td>
                <td>{row.goalsAgainst}</td>
                <td>{row.goalDiff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function GroupsPage() {
  const { matches, isLoading } = useWorldCup2026Matches();
  const { language, uiText } = useLanguage();

  const groups = useMemo(
    () => buildGroupStandings(matches, language, translateTeamName),
    [language, matches]
  );
  const knockoutStages = useMemo(() => groupKnockoutMatches(matches), [matches]);

  useSeo({
    title: "GameGrid | Grupos",
    description: "Tabela de grupos e chaveamento da Copa do Mundo 2026.",
    path: "/grupos",
  });

  return (
    <div className="groups-page">
      <header className="page-card groups-hero">
        <span className="featured-match-kicker">Classificacao</span>
        <h1>Grupos e chaveamento</h1>
        <p>Tabelas atualizadas com jogos finalizados e mata-mata organizado por fase.</p>
      </header>

      <section className="groups-grid" aria-label="Tabelas de grupos">
        {isLoading && groups.length === 0
          ? Array.from({ length: 4 }).map((_, index) => (
              <section key={`group-skeleton-${index}`} className="group-table-card skeleton-card">
                <div className="skeleton-row w-60" />
                <div className="skeleton-row w-90" />
                <div className="skeleton-row w-80" />
              </section>
            ))
          : groups.map((group) => (
              <GroupTable key={group.group} group={group.group} rows={group.rows} language={language} />
            ))}
      </section>

      <section className="knockout-section" aria-label="Chaveamento">
        <div className="day-group-header">
          <h2>Chaveamento</h2>
          <span>{knockoutStages.length} fases</span>
        </div>

        {isLoading && knockoutStages.length === 0 ? (
          <div className="match-grid">
            {Array.from({ length: 4 }).map((_, index) => (
              <MatchCardSkeleton key={`knockout-skeleton-${index}`} />
            ))}
          </div>
        ) : null}

        {knockoutStages.map((stage) => (
          <section className="knockout-stage" key={stage.stageKey}>
            <div className="day-group-header">
              <h3>{stage.stage}</h3>
              <span>{uiText.home.matchCount(stage.matches.length)}</span>
            </div>
            <div className="match-grid">
              {stage.matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          </section>
        ))}
      </section>
    </div>
  );
}

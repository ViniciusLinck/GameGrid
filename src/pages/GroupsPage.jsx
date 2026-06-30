import { useMemo } from "react";
import { MatchCardSkeleton } from "../components/MatchCard";
import TeamBadge from "../components/TeamBadge";
import { useLanguage } from "../context/LanguageContext";
import { useSeo } from "../hooks/useSeo";
import { useWorldCup2026Matches } from "../hooks/useWorldCup2026Matches";
import { buildGroupStandings, groupKnockoutMatches } from "../utils/matchUtils";
import { translateTeamName } from "../utils/teamNames";

const BRACKET_STAGE_KEYS = ["round_of_32", "round_of_16", "quarter_final", "semi_final", "final"];

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

function formatBracketMeta(match, locale) {
  if (match.kickoffUtc) {
    const date = new Date(match.kickoffUtc);
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat(locale, {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(date)
        .replace(",", "");
    }
  }

  return `${match.date?.slice(5).replace("-", "/") ?? ""}, ${match.kickoff ?? ""}`;
}

function getTeamScore(match, side) {
  const score = side === "home" ? match.homeScore : match.awayScore;
  const penaltyScore = side === "home" ? match.homePenaltyScore : match.awayPenaltyScore;

  if (score == null) {
    return "";
  }

  return penaltyScore == null ? String(score) : `${score} (${penaltyScore})`;
}

function isWinner(match, side) {
  if (match.homeScore == null || match.awayScore == null) {
    return false;
  }

  const ownScore = side === "home" ? match.homeScore : match.awayScore;
  const otherScore = side === "home" ? match.awayScore : match.homeScore;
  if (ownScore !== otherScore) {
    return ownScore > otherScore;
  }

  const ownPenaltyScore = side === "home" ? match.homePenaltyScore : match.awayPenaltyScore;
  const otherPenaltyScore = side === "home" ? match.awayPenaltyScore : match.homePenaltyScore;
  return ownPenaltyScore != null && otherPenaltyScore != null && ownPenaltyScore > otherPenaltyScore;
}

function BracketTeamRow({ match, side, language }) {
  const team = side === "home" ? match.homeTeam : match.awayTeam;
  const displayName = translateTeamName(team.name, language);
  const score = getTeamScore(match, side);

  return (
    <div className={`bracket-team-row ${isWinner(match, side) ? "bracket-team-winner" : ""}`}>
      <TeamBadge name={displayName} flagSrc={team.flagSrc} />
      <span className="bracket-team-score">{score}</span>
    </div>
  );
}

function KnockoutBracket({ stages, language, locale }) {
  const rounds = stages.filter((stage) => BRACKET_STAGE_KEYS.includes(stage.stageKey));
  const baseSlots = Math.max(...rounds.map((stage) => stage.matches.length), 1);

  if (rounds.length === 0) {
    return null;
  }

  return (
    <div className="bracket-scroll" role="region" aria-label="Chaveamento eliminatorio" tabIndex={0}>
      <div
        className="bracket-board"
        style={{
          "--bracket-slots": baseSlots,
        }}
      >
        {rounds.map((stage, roundIndex) => {
          const slotSpan = Math.max(baseSlots / Math.max(stage.matches.length, 1), 1);

          return (
            <section className="bracket-round" key={stage.stageKey}>
              <h3>{stage.stage}</h3>

              {stage.matches.map((match, matchIndex) => (
                <article
                  className="bracket-match-cell"
                  key={match.id}
                  style={{
                    "--slot-span": slotSpan,
                    gridRow: `${Math.floor(matchIndex * slotSpan) + 2} / span ${Math.max(
                      Math.floor(slotSpan),
                      1
                    )}`,
                  }}
                >
                  <div className="bracket-match-card">
                    <div className="bracket-match-meta">
                      <span>{formatBracketMeta(match, locale)}</span>
                      <strong>Jogo {match.id}</strong>
                    </div>
                    <BracketTeamRow match={match} side="home" language={language} />
                    <BracketTeamRow match={match} side="away" language={language} />
                  </div>

                  {roundIndex < rounds.length - 1 ? (
                    <>
                      <span className="bracket-line bracket-line-out" aria-hidden="true" />
                      {matchIndex % 2 === 0 ? (
                        <span className="bracket-line bracket-line-pair" aria-hidden="true" />
                      ) : null}
                    </>
                  ) : null}
                </article>
              ))}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default function GroupsPage() {
  const { matches, isLoading } = useWorldCup2026Matches();
  const { language, locale, uiText } = useLanguage();

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

      <section id="chaveamento" className="knockout-section" aria-label="Chaveamento">
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

        <KnockoutBracket stages={knockoutStages} language={language} locale={locale} />
      </section>
    </div>
  );
}

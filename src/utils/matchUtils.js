import { normalizeTeamName } from "./flags";

export const MATCH_DURATION_MS = 2 * 60 * 60 * 1000;

export function getMatchStartDate(match) {
  if (match?.kickoffUtc) {
    const startDate = new Date(match.kickoffUtc);
    if (!Number.isNaN(startDate.getTime())) {
      return startDate;
    }
  }

  const fallbackDate = new Date(`${match?.date}T${match?.kickoff ?? "00:00"}:00`);
  return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate;
}

export function formatDayHeading(dateISO, locale) {
  const formatter = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "long",
    weekday: "long",
  });
  const formatted = formatter.format(new Date(`${dateISO}T12:00:00`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function getMatchStatus(match, now = new Date()) {
  if (match?.status === "live" || match?.status === "finished" || match?.status === "upcoming") {
    return match.status;
  }

  const startDate = getMatchStartDate(match);
  if (!startDate) {
    return match?.homeScore != null && match?.awayScore != null ? "finished" : "upcoming";
  }

  if (match?.homeScore != null && match?.awayScore != null && now.getTime() >= startDate.getTime() + MATCH_DURATION_MS) {
    return "finished";
  }

  if (now.getTime() >= startDate.getTime() && now.getTime() < startDate.getTime() + MATCH_DURATION_MS) {
    return "live";
  }

  return "upcoming";
}

export function getFeaturedMatchState(matches, now = new Date()) {
  const liveMatch = matches.find((match) => getMatchStatus(match, now) === "live");
  if (liveMatch) {
    return { match: liveMatch, mode: "live" };
  }

  const nextMatch = matches.find((match) => {
    const kickoffDate = getMatchStartDate(match);
    return kickoffDate ? kickoffDate >= now : false;
  });

  if (nextMatch) {
    return { match: nextMatch, mode: "upcoming" };
  }

  return { match: matches.find((match) => getMatchStatus(match, now) === "finished") ?? matches[0] ?? null, mode: "finished" };
}

export function groupMatchesByDay(matches) {
  const grouped = new Map();
  for (const match of matches) {
    if (!grouped.has(match.date)) {
      grouped.set(match.date, []);
    }
    grouped.get(match.date).push(match);
  }

  return Array.from(grouped.entries()).map(([date, groupMatches]) => ({
    date,
    matches: groupMatches,
  }));
}

function groupLetterFromName(groupName = "") {
  const match = String(groupName).match(/([A-L])$/i);
  return match ? match[1].toUpperCase() : "";
}

export function buildGroupStandings(matches, language, translateTeamName) {
  const groups = new Map();

  const ensureTeam = (groupKey, team) => {
    if (!groups.has(groupKey)) {
      groups.set(groupKey, new Map());
    }

    const table = groups.get(groupKey);
    const teamKey = normalizeTeamName(team.name || team.code || "");
    if (!table.has(teamKey)) {
      table.set(teamKey, {
        team: team.name,
        code: team.code,
        flagSrc: team.flagSrc,
        points: 0,
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDiff: 0,
      });
    }

    return table.get(teamKey);
  };

  matches
    .filter((match) => match.stageKey === "group_stage" && groupLetterFromName(match.group))
    .forEach((match) => {
      const groupKey = groupLetterFromName(match.group);
      ensureTeam(groupKey, match.homeTeam);
      ensureTeam(groupKey, match.awayTeam);

      const status = getMatchStatus(match);
      if ((status !== "finished" && status !== "live") || match.homeScore == null || match.awayScore == null) {
        return;
      }

      const home = ensureTeam(groupKey, match.homeTeam);
      const away = ensureTeam(groupKey, match.awayTeam);
      const homeGoals = Number(match.homeScore);
      const awayGoals = Number(match.awayScore);

      home.games += 1;
      away.games += 1;
      home.goalsFor += homeGoals;
      home.goalsAgainst += awayGoals;
      away.goalsFor += awayGoals;
      away.goalsAgainst += homeGoals;

      if (homeGoals > awayGoals) {
        home.wins += 1;
        away.losses += 1;
        home.points += 3;
      } else if (homeGoals < awayGoals) {
        away.wins += 1;
        home.losses += 1;
        away.points += 3;
      } else {
        home.draws += 1;
        away.draws += 1;
        home.points += 1;
        away.points += 1;
      }

      home.goalDiff = home.goalsFor - home.goalsAgainst;
      away.goalDiff = away.goalsFor - away.goalsAgainst;
    });

  return Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([group, table]) => ({
      group,
      rows: Array.from(table.values()).sort((left, right) => {
        if (right.points !== left.points) return right.points - left.points;
        if (right.goalDiff !== left.goalDiff) return right.goalDiff - left.goalDiff;
        if (right.goalsFor !== left.goalsFor) return right.goalsFor - left.goalsFor;
        return translateTeamName(left.team, language).localeCompare(translateTeamName(right.team, language));
      }),
    }));
}

export function groupKnockoutMatches(matches) {
  const stageOrder = ["round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final"];
  const byStage = new Map();

  matches
    .filter((match) => stageOrder.includes(match.stageKey))
    .forEach((match) => {
      if (!byStage.has(match.stageKey)) {
        byStage.set(match.stageKey, { stageKey: match.stageKey, stage: match.stage, matches: [] });
      }
      byStage.get(match.stageKey).matches.push(match);
    });

  return stageOrder
    .map((stageKey) => byStage.get(stageKey))
    .filter(Boolean)
    .map((stage) => ({
      ...stage,
      matches: stage.matches.sort((left, right) => left.id - right.id),
    }));
}

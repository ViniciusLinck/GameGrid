const SPORTSDB_BASE_URL = "https://www.thesportsdb.com/api/v1/json/3";
const WORLD_CUP_LEAGUE_ID = "4429";
const WORLD_CUP_SEASON = "2026";
const SPORTSDB_MATCHES_CACHE_KEY = "gamegrid_sportsdb_matches_2026_v1";
const SPORTSDB_MATCHES_CACHE_TTL_MS = 60 * 1000;

function withQuery(path, params = {}) {
  const url = new URL(`${SPORTSDB_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
}

async function fetchJson(path, params = {}, signal) {
  const response = await fetch(withQuery(path, params), { signal });
  if (!response.ok) {
    throw new Error(`SportsDB HTTP ${response.status}`);
  }
  return response.json();
}

function readMatchesCache() {
  try {
    const raw = localStorage.getItem(SPORTSDB_MATCHES_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !Array.isArray(parsed?.events)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeMatchesCache(events) {
  try {
    localStorage.setItem(
      SPORTSDB_MATCHES_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        events,
      })
    );
  } catch {
    // Ignore storage failures.
  }
}

function normalizeStatus(rawStatus, homeScore, awayScore) {
  const status = (rawStatus ?? "").toLowerCase();
  const hasScore = homeScore !== null && awayScore !== null;

  if (status.includes("live") || status.includes("in progress")) {
    return "ao vivo";
  }
  if (status.includes("post") || status.includes("ft") || status.includes("final")) {
    return "finalizado";
  }
  if (hasScore) {
    return "finalizado";
  }
  return "agendado";
}

function normalizeEvent(event) {
  const homeScore = Number.isFinite(Number(event.intHomeScore))
    ? Number(event.intHomeScore)
    : null;
  const awayScore = Number.isFinite(Number(event.intAwayScore))
    ? Number(event.intAwayScore)
    : null;

  return {
    id: event.idEvent,
    stage: event.strRound ?? "Fase de grupos",
    date: event.dateEvent ?? "",
    time: (event.strTime ?? "").slice(0, 5),
    venue: {
      stadium: event.strVenue ?? "A definir",
      city: event.strCity ?? "A definir",
    },
    homeTeam: {
      id: event.idHomeTeam ?? "",
      name: event.strHomeTeam ?? "A definir",
      score: homeScore,
    },
    awayTeam: {
      id: event.idAwayTeam ?? "",
      name: event.strAwayTeam ?? "A definir",
      score: awayScore,
    },
    status: normalizeStatus(event.strStatus, homeScore, awayScore),
    raw: event,
  };
}

function toEventDate(event) {
  const date = event.date || "1970-01-01";
  const time = event.time || "00:00";
  return new Date(`${date}T${time}:00Z`).getTime();
}

export async function fetchWorldCupMatches(signal) {
  const cached = readMatchesCache();
  if (cached && Date.now() - cached.savedAt < SPORTSDB_MATCHES_CACHE_TTL_MS) {
    return cached.events;
  }

  const data = await fetchJson(
    "/eventsseason.php",
    { id: WORLD_CUP_LEAGUE_ID, s: WORLD_CUP_SEASON },
    signal
  );

  const events = (data.events ?? [])
    .map(normalizeEvent)
    .sort((a, b) => toEventDate(a) - toEventDate(b));
  writeMatchesCache(events);
  return events;
}

export async function fetchTeamByName(teamName, signal) {
  const data = await fetchJson("/searchteams.php", { t: teamName }, signal);
  return data.teams?.[0] ?? null;
}

export async function fetchPlayersByTeamId(teamId, signal) {
  if (!teamId) {
    return [];
  }
  const data = await fetchJson("/lookup_all_players.php", { id: teamId }, signal);
  return data.player ?? [];
}

export async function fetchPlayerById(playerId, signal) {
  if (!playerId) {
    return null;
  }
  const data = await fetchJson("/lookupplayer.php", { id: playerId }, signal);
  return data.players?.[0] ?? null;
}

export function buildGroupTableFromMatches(matches) {
  const table = new Map();

  const ensureTeam = (name) => {
    if (!table.has(name)) {
      table.set(name, {
        team: name,
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
    return table.get(name);
  };

  matches
    .filter((match) => match.status === "finalizado")
    .forEach((match) => {
      const home = ensureTeam(match.homeTeam.name);
      const away = ensureTeam(match.awayTeam.name);
      const homeGoals = Number(match.homeTeam.score ?? 0);
      const awayGoals = Number(match.awayTeam.score ?? 0);

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

  return Array.from(table.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    return b.goalsFor - a.goalsFor;
  });
}

export const sportsDbConfig = {
  baseUrl: SPORTSDB_BASE_URL,
  leagueId: WORLD_CUP_LEAGUE_ID,
  season: WORLD_CUP_SEASON,
};

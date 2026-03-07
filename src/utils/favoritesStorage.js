const FAVORITES_KEY = "gamegrid_favorites_v1";

function defaultState() {
  return {
    matches: [],
    teams: [],
  };
}

export function readFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) {
      return defaultState();
    }
    const parsed = JSON.parse(raw);
    return {
      matches: Array.isArray(parsed.matches) ? parsed.matches : [],
      teams: Array.isArray(parsed.teams) ? parsed.teams : [],
    };
  } catch {
    return defaultState();
  }
}

export function writeFavorites(nextState) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextState));
  return nextState;
}

export function toggleFavoriteMatch(matchId) {
  const current = readFavorites();
  const key = String(matchId);
  const exists = current.matches.includes(key);

  const matches = exists
    ? current.matches.filter((id) => id !== key)
    : [...current.matches, key];

  return writeFavorites({
    ...current,
    matches,
  });
}

export function toggleFavoriteTeam(teamName) {
  const current = readFavorites();
  const key = String(teamName);
  const exists = current.teams.includes(key);

  const teams = exists
    ? current.teams.filter((name) => name !== key)
    : [...current.teams, key];

  return writeFavorites({
    ...current,
    teams,
  });
}

export function isFavoriteMatch(matchId) {
  return readFavorites().matches.includes(String(matchId));
}

export function isFavoriteTeam(teamName) {
  return readFavorites().teams.includes(String(teamName));
}

export { FAVORITES_KEY };

import { useQuery } from "@tanstack/react-query";
import { fetchWorldCupMatches } from "../services/sportsdbApi";

function byFilter(matches, filters = {}, favoriteMatchIds = [], showOnlyFavorites = false) {
  const team = (filters.team ?? "").trim().toLowerCase();
  const stage = (filters.stage ?? "").trim().toLowerCase();
  const date = (filters.date ?? "").trim();
  const status = (filters.status ?? "todos").trim().toLowerCase();

  return matches.filter((match) => {
    const inTeam =
      !team ||
      match.homeTeam.name.toLowerCase().includes(team) ||
      match.awayTeam.name.toLowerCase().includes(team);
    const inStage = !stage || (match.stage ?? "").toLowerCase() === stage;
    const inDate = !date || match.date === date;
    const inStatus = status === "todos" || (match.status ?? "").toLowerCase() === status;

    const inFavorites =
      !showOnlyFavorites || favoriteMatchIds.includes(String(match.id));

    return inTeam && inStage && inDate && inStatus && inFavorites;
  });
}

export function useWorldCupMatchesQuery({
  filters,
  favoriteMatchIds = [],
  showOnlyFavorites = false,
  enabled = true,
} = {}) {
  const getRefetchInterval = () => {
    if (typeof document !== "undefined" && document.hidden) {
      return false;
    }
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return false;
    }
    return 60_000;
  };

  return useQuery({
    queryKey: ["world-cup-matches", "2026"],
    queryFn: ({ signal }) => fetchWorldCupMatches(signal),
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchInterval: getRefetchInterval,
    refetchIntervalInBackground: false,
    enabled,
    select: (matches) => byFilter(matches, filters, favoriteMatchIds, showOnlyFavorites),
  });
}

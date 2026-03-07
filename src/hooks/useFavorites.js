import { useCallback, useEffect, useState } from "react";
import {
  isFavoriteMatch,
  isFavoriteTeam,
  readFavorites,
  toggleFavoriteMatch,
  toggleFavoriteTeam,
} from "../utils/favoritesStorage";

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => readFavorites());

  useEffect(() => {
    const sync = () => setFavorites(readFavorites());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const onToggleMatch = useCallback((matchId) => {
    setFavorites(toggleFavoriteMatch(matchId));
  }, []);

  const onToggleTeam = useCallback((teamName) => {
    setFavorites(toggleFavoriteTeam(teamName));
  }, []);

  return {
    favorites,
    onToggleMatch,
    onToggleTeam,
    isMatchFavorite: isFavoriteMatch,
    isTeamFavorite: isFavoriteTeam,
  };
}

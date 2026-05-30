import { useMemo, useState } from "react";
import Countdown from "./Countdown";
import FiltersBar from "./FiltersBar";
import GameCard from "./GameCard";
import GroupTable from "./GroupTable";
import MatchModal from "./MatchModal";
import { useFavorites } from "../../hooks/useFavorites";
import { useWorldCupMatchesQuery } from "../../hooks/useWorldCupMatchesQuery";
import { buildGroupTableFromMatches } from "../../services/sportsdbApi";
import { formatMatchTimeToUserZone } from "../../utils/timezone";
import { useLanguage } from "../../context/LanguageContext";
import { translateTeamName } from "../../utils/teamNames";

const INITIAL_FILTERS = {
  team: "",
  stage: "",
  date: "",
  status: "todos",
};

export default function MvpShowcase() {
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  const { favorites, onToggleMatch, isMatchFavorite } = useFavorites();
  const { language } = useLanguage();

  const { data: matches = [], isLoading, error } = useWorldCupMatchesQuery({
    filters,
    favoriteMatchIds: favorites.matches,
    showOnlyFavorites,
  });

  const teams = useMemo(() => {
    const names = new Set();
    matches.forEach((match) => {
      names.add(match.homeTeam.name);
      names.add(match.awayTeam.name);
    });
    return Array.from(names).sort((a, b) =>
      translateTeamName(a, language).localeCompare(translateTeamName(b, language))
    );
  }, [language, matches]);

  const stages = useMemo(() => {
    const values = new Set(matches.map((match) => match.stage).filter(Boolean));
    return Array.from(values);
  }, [matches]);

  const groupTable = useMemo(() => buildGroupTableFromMatches(matches), [matches]);

  const nextMatch = useMemo(() => {
    const now = Date.now();
    return matches.find((match) => {
      const kickoff = formatMatchTimeToUserZone(match.date, match.time).iso;
      return kickoff && new Date(kickoff).getTime() >= now;
    });
  }, [matches]);

  return (
    <section className="grid gap-4">
      {nextMatch ? (
        <Countdown
          label={`Contagem para ${translateTeamName(nextMatch.homeTeam.name, language)} x ${translateTeamName(nextMatch.awayTeam.name, language)}`}
          targetIso={formatMatchTimeToUserZone(nextMatch.date, nextMatch.time).iso}
        />
      ) : null}

      <FiltersBar
        teams={teams}
        stages={stages}
        values={filters}
        onChange={setFilters}
        showOnlyFavorites={showOnlyFavorites}
        onToggleFavorites={() => setShowOnlyFavorites((current) => !current)}
        language={language}
      />

      {isLoading ? <p className="text-ink-300">Carregando jogos...</p> : null}
      {error ? <p className="text-red-300">Erro ao carregar jogos: {error.message}</p> : null}

      <div className="grid gap-3 md:grid-cols-2">
        {matches.map((match) => (
          <GameCard
            key={match.id}
            match={match}
            isFavorite={isMatchFavorite(match.id)}
            onToggleFavorite={() => onToggleMatch(match.id)}
            onOpenDetails={() => setSelectedMatch(match)}
            language={language}
          />
        ))}
      </div>

      <GroupTable
        rows={groupTable}
        title="Classificacao por desempenho (jogos finalizados)"
        language={language}
      />

      <MatchModal
        match={selectedMatch}
        isOpen={Boolean(selectedMatch)}
        onClose={() => setSelectedMatch(null)}
        language={language}
      />
    </section>
  );
}

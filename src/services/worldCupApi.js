import { FALLBACK_MATCHES_2026 } from "../data/matches2026";
import { normalizeTeamName } from "../utils/flags";

const SPORTS_DB_BASE = "https://www.thesportsdb.com/api/v1/json/3";
const SOCCER_WC_LEAGUE_ID = "4429";

const teamNameAliases = {
  "united states": "USA",
  "south korea": "Korea Republic",
};

const isUnknownTeam = (teamName) =>
  /^(grupo|classificado|vencedor|perdedor|a definir)/i.test(teamName ?? "");

function withStageFallback(stageName, fallbackStage) {
  return stageName || fallbackStage || "Fase de grupos";
}

function normalizeKickoff(timeValue) {
  if (!timeValue) {
    return "A definir";
  }
  return timeValue.slice(0, 5);
}

function createMapsUrl(venue) {
  const query = `${venue.stadium}, ${venue.city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function fallbackPlayer(teamName, position, index) {
  return {
    id: `local-${normalizeTeamName(teamName)}-${index + 1}`,
    name: `${teamName} - Jogador ${index + 1}`,
    team: teamName,
    position,
    nationality: teamName,
    birth: "Não informado",
    height: "Não informado",
    weight: "Não informado",
    description:
      "Dados detalhados ainda não disponíveis na API para este atleta.",
    image: "",
  };
}

function fallbackPlayersByTeam(teamName) {
  const positions = [
    "Goalkeeper",
    "Right-Back",
    "Centre-Back",
    "Centre-Back",
    "Left-Back",
    "Defensive Midfield",
    "Central Midfield",
    "Central Midfield",
    "Right Winger",
    "Centre-Forward",
    "Left Winger",
  ];

  return positions.map((position, index) =>
    fallbackPlayer(teamName, position, index)
  );
}

function toPlayerView(player, teamName) {
  return {
    id: player.idPlayer,
    name: player.strPlayer ?? "Jogador",
    team: player.strTeam ?? teamName,
    position: player.strPosition ?? "Posição não informada",
    nationality: player.strNationality ?? "Nacionalidade não informada",
    birth: player.dateBorn ?? "Data não informada",
    height: player.strHeight ?? "Não informado",
    weight: player.strWeight ?? "Não informado",
    description:
      player.strDescriptionPT ??
      player.strDescriptionEN ??
      "Sem descrição disponível.",
    image: player.strThumb ?? player.strCutout ?? "",
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}`);
  }
  return response.json();
}

async function getTeamFromApi(teamName) {
  const normalized = normalizeTeamName(teamName);
  const queryName = teamNameAliases[normalized] ?? teamName;
  const url = `${SPORTS_DB_BASE}/searchteams.php?t=${encodeURIComponent(queryName)}`;
  const data = await fetchJson(url);
  const teams = data.teams ?? [];

  if (teams.length === 0) {
    return null;
  }

  const exactWorldCupTeam =
    teams.find((team) => normalizeTeamName(team.strTeam) === normalized) ??
    teams.find((team) => team.strLeague === "FIFA World Cup") ??
    teams.find((team) => team.strSport === "Soccer") ??
    teams[0];

  return exactWorldCupTeam ?? null;
}

export async function fetchWorldCupMatches2026() {
  try {
    const data = await fetchJson(
      `${SPORTS_DB_BASE}/eventsseason.php?id=${SOCCER_WC_LEAGUE_ID}&s=2026`
    );
    const apiEvents = (data.events ?? []).filter(
      (event) => event.strHomeTeam && event.strAwayTeam
    );

    if (apiEvents.length === 0) {
      return {
        matches: FALLBACK_MATCHES_2026,
        sourceLabel: "local",
      };
    }

    // A API publica ainda nao retorna os 104 jogos completos;
    // fazemos merge dos jogos existentes da API no calendario base.
    const mergedMatches = FALLBACK_MATCHES_2026.map((fallbackMatch, index) => {
      const apiEvent = apiEvents[index];
      if (!apiEvent) {
        return {
          ...fallbackMatch,
          mapsUrl: createMapsUrl(fallbackMatch.venue),
        };
      }

      const venue = {
        stadium: apiEvent.strVenue ?? fallbackMatch.venue.stadium,
        city: apiEvent.strCity ?? fallbackMatch.venue.city,
      };

      return {
        ...fallbackMatch,
        stage: withStageFallback(apiEvent.strRound, fallbackMatch.stage),
        date: apiEvent.dateEvent ?? fallbackMatch.date,
        kickoff: normalizeKickoff(apiEvent.strTimeLocal ?? apiEvent.strTime),
        venue,
        mapsUrl: createMapsUrl(venue),
        homeTeam: { name: apiEvent.strHomeTeam ?? fallbackMatch.homeTeam.name },
        awayTeam: { name: apiEvent.strAwayTeam ?? fallbackMatch.awayTeam.name },
      };
    });

    return {
      matches: mergedMatches,
      sourceLabel: "api+local",
    };
  } catch {
    return {
      matches: FALLBACK_MATCHES_2026.map((match) => ({
        ...match,
        mapsUrl: createMapsUrl(match.venue),
      })),
      sourceLabel: "local",
    };
  }
}

export async function fetchTeamDetails(teamName) {
  if (isUnknownTeam(teamName)) {
    return {
      teamName,
      badge: "",
      country: "A definir",
      founded: "A definir",
      stadium: "A definir",
      description:
        "Este time ainda depende de definicao da fase anterior da Copa.",
      players: fallbackPlayersByTeam(teamName),
      isFallback: true,
    };
  }

  try {
    const team = await getTeamFromApi(teamName);

    if (!team) {
      return {
        teamName,
        badge: "",
        country: "A definir",
        founded: "A definir",
        stadium: "A definir",
        description:
          "A API nao retornou detalhes para este time. Mostrando escalação base.",
        players: fallbackPlayersByTeam(teamName),
        isFallback: true,
      };
    }

    const playersPayload = await fetchJson(
      `${SPORTS_DB_BASE}/lookup_all_players.php?id=${team.idTeam}`
    );
    const players = (playersPayload.player ?? [])
      .filter((player) => player.strStatus !== "Retired")
      .slice(0, 11)
      .map((player) => toPlayerView(player, team.strTeam));

    return {
      teamName: team.strTeam ?? teamName,
      badge: team.strBadge ?? "",
      country: team.strCountry ?? "N/A",
      founded: team.intFormedYear ?? "N/A",
      stadium: team.strStadium ?? "N/A",
      description:
        team.strDescriptionPT ??
        team.strDescriptionEN ??
        "Sem descrição na API.",
      players:
        players.length > 0
          ? players
          : fallbackPlayersByTeam(team.strTeam ?? teamName),
      isFallback: players.length === 0,
    };
  } catch {
    return {
      teamName,
      badge: "",
      country: "A definir",
      founded: "A definir",
      stadium: "A definir",
      description:
        "Nao foi possivel acessar a API no momento. Mostrando escalação base.",
      players: fallbackPlayersByTeam(teamName),
      isFallback: true,
    };
  }
}

export async function fetchPlayerById(playerId, teamName = "Time") {
  if (playerId.startsWith("local-")) {
    const indexFromId = Number(playerId.split("-").at(-1)) || 1;
    return fallbackPlayer(teamName, "Posição não informada", indexFromId - 1);
  }

  try {
    const data = await fetchJson(
      `${SPORTS_DB_BASE}/lookupplayer.php?id=${encodeURIComponent(playerId)}`
    );
    const player = data.players?.[0];
    if (!player) {
      return null;
    }
    return toPlayerView(player, teamName);
  } catch {
    return null;
  }
}

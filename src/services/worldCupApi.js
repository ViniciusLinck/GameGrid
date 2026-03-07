import { FALLBACK_MATCHES_2026 } from "../data/matches2026";
import { getWorldCupProfile } from "../data/worldCupInsights";
import { normalizeTeamName } from "../utils/flags";

const SPORTS_DB_BASE = "https://www.thesportsdb.com/api/v1/json/3";
const SOCCER_WC_LEAGUE_ID = "4429";
const TRANSLATION_API_BASE = "https://api.mymemory.translated.net/get";
const translationCache = new Map();

const teamNameAliases = {
  "united states": "USA",
  "south korea": "Korea Republic",
  "estados unidos": "USA",
  "coreia do sul": "Korea Republic",
  suica: "Switzerland",
  croacia: "Croatia",
  gana: "Ghana",
  "arabia saudita": "Saudi Arabia",
  polonia: "Poland",
  japao: "Japan",
  brasil: "Brazil",
  dinamarca: "Denmark",
  camaroes: "Cameroon",
  eslovaquia: "Slovakia",
  belgica: "Belgium",
  argelia: "Algeria",
  noruega: "Norway",
  uruguai: "Uruguay",
  alemanha: "Germany",
  egito: "Egypt",
  "pais de gales": "Wales",
  "paises baixos": "Netherlands",
  romenia: "Romania",
  marrocos: "Morocco",
  escocia: "Scotland",
  paraguai: "Paraguay",
  italia: "Italy",
  catar: "Qatar",
  franca: "France",
  turquia: "Turkey",
  hungria: "Hungary",
  equador: "Ecuador",
  espanha: "Spain",
  suecia: "Sweden",
  "republica tcheca": "Czech Republic",
  inglaterra: "England",
  servia: "Serbia",
  ucrania: "Ukraine",
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
    birth: "Nao informado",
    height: "Nao informado",
    weight: "Nao informado",
    description: "Dados detalhados ainda nao disponiveis na API para este atleta.",
    image: "",
    gallery: [],
    achievements: [],
  };
}

function fallbackPlayersByTeam(teamName) {
  const positions = [
    "Goleiro",
    "Lateral direito",
    "Zagueiro",
    "Zagueiro",
    "Lateral esquerdo",
    "Volante",
    "Meio-campista central",
    "Meio-campista central",
    "Ponta direita",
    "Centroavante",
    "Ponta esquerda",
  ];

  return positions.map((position, index) => fallbackPlayer(teamName, position, index));
}

function fallbackCoachByTeam(teamName) {
  return {
    id: `coach-${normalizeTeamName(teamName)}`,
    name: `Tecnico de ${teamName}`,
    role: "Tecnico",
    image: "",
    gallery: [],
  };
}

function uniqueImages(values) {
  const unique = [];
  const seen = new Set();

  for (const value of values) {
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    unique.push(value);
  }

  return unique;
}

function extractPlayerGallery(player) {
  return uniqueImages([
    player?.strThumb,
    player?.strCutout,
    player?.strRender,
    player?.strFanart1,
    player?.strFanart2,
    player?.strFanart3,
    player?.strFanart4,
  ]);
}

function toCoachView(team, teamName) {
  const managerName =
    team?.strManager
      ?.split(/[,;|]/)
      .map((name) => name.trim())
      .find(Boolean) ?? `Tecnico de ${teamName}`;

  return {
    id: `coach-${normalizeTeamName(teamName)}`,
    name: managerName,
    role: "Tecnico",
    image: "",
    gallery: [],
  };
}

function toPlayerView(player, teamName) {
  const gallery = extractPlayerGallery(player);

  return {
    id: player.idPlayer,
    name: player.strPlayer ?? "Jogador",
    team: player.strTeam ?? teamName,
    position: player.strPosition ?? "Posicao nao informada",
    nationality: player.strNationality ?? "Nacionalidade nao informada",
    birth: player.dateBorn ?? "Data nao informada",
    height: player.strHeight ?? "Nao informado",
    weight: player.strWeight ?? "Nao informado",
    description: player.strDescriptionPT ?? "Sem descricao disponivel em portugues.",
    image: gallery[0] ?? "",
    gallery,
    achievements: [],
  };
}

function truncateForTranslation(text, maxLength = 900) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength)}...`;
}

async function translateEnglishToPortuguese(text) {
  const base = truncateForTranslation(text);
  if (!base) {
    return "";
  }

  if (translationCache.has(base)) {
    return translationCache.get(base);
  }

  try {
    const data = await fetchJson(
      `${TRANSLATION_API_BASE}?q=${encodeURIComponent(base)}&langpair=en|pt`
    );
    const translated = data?.responseData?.translatedText?.trim();
    const isValid = translated && !/^INVALID LANGUAGE PAIR/i.test(translated);

    if (!isValid) {
      translationCache.set(base, "");
      return "";
    }

    translationCache.set(base, translated);
    return translated;
  } catch {
    return "";
  }
}

async function getPortugueseDescription(descriptionPt, descriptionEn) {
  if (descriptionPt && descriptionPt.trim()) {
    return descriptionPt.trim();
  }

  const translated = await translateEnglishToPortuguese(descriptionEn);
  if (translated) {
    return translated;
  }

  return "Descricao disponivel apenas em ingles no momento.";
}

function toAchievementView(honour, index) {
  return {
    id: honour.id ?? `${honour.idHonour ?? honour.strHonour ?? "honour"}-${index}`,
    title: honour.strHonour ?? "Conquista",
    season: honour.strSeason ?? "Temporada nao informada",
    team: honour.strTeam ?? "Time nao informado",
  };
}

async function fetchHonoursByPlayerId(playerId) {
  if (!playerId) {
    return [];
  }

  try {
    const data = await fetchJson(
      `${SPORTS_DB_BASE}/lookuphonours.php?id=${encodeURIComponent(playerId)}`
    );
    const honours = data.honours ?? [];
    return honours.map((honour, index) => toAchievementView(honour, index));
  } catch {
    return [];
  }
}

async function fetchCoachGallery(coachName, teamName) {
  if (!coachName || /^tecnico de /i.test(coachName)) {
    return [];
  }

  try {
    const data = await fetchJson(
      `${SPORTS_DB_BASE}/searchplayers.php?p=${encodeURIComponent(coachName)}`
    );
    const candidates = data.player ?? [];
    const normalizedTeam = normalizeTeamName(teamName);

    const bestMatch =
      candidates.find((candidate) => normalizeTeamName(candidate.strTeam ?? "") === normalizedTeam) ??
      candidates[0];

    if (!bestMatch) {
      return [];
    }

    return extractPlayerGallery(bestMatch);
  } catch {
    return [];
  }
}

export async function fetchPersonAchievementsByName(personName, teamName = "") {
  const safeName = (personName ?? "").trim();
  if (!safeName || /^tecnico de /i.test(safeName)) {
    return [];
  }

  try {
    const data = await fetchJson(
      `${SPORTS_DB_BASE}/searchplayers.php?p=${encodeURIComponent(safeName)}`
    );
    const candidates = data.player ?? [];
    if (candidates.length === 0) {
      return [];
    }

    const normalizedTeam = normalizeTeamName(teamName);
    const selectedPlayer =
      candidates.find((candidate) => normalizeTeamName(candidate.strTeam ?? "") === normalizedTeam) ??
      candidates[0];

    return fetchHonoursByPlayerId(selectedPlayer.idPlayer);
  } catch {
    return [];
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro HTTP ${response.status}`);
  }
  return response.json();
}

function shortDescription(text) {
  if (!text) {
    return "Resumo indisponivel na API.";
  }
  const trimmed = text.replace(/\s+/g, " ").trim();
  return trimmed.length > 220 ? `${trimmed.slice(0, 220)}...` : trimmed;
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
      description: "Este time ainda depende de definicao da fase anterior da Copa.",
      profile: getWorldCupProfile(teamName),
      players: fallbackPlayersByTeam(teamName),
      coach: fallbackCoachByTeam(teamName),
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
        description: "A API nao retornou detalhes para este time. Mostrando escalacao base.",
        profile: getWorldCupProfile(teamName),
        players: fallbackPlayersByTeam(teamName),
        coach: fallbackCoachByTeam(teamName),
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

    const coach = toCoachView(team, team.strTeam ?? teamName);
    const coachGallery = await fetchCoachGallery(coach.name, team.strTeam ?? teamName);

    return {
      teamName: team.strTeam ?? teamName,
      badge: team.strBadge ?? "",
      country: team.strCountry ?? "N/D",
      founded: team.intFormedYear ?? "N/D",
      stadium: team.strStadium ?? "N/D",
      description: shortDescription(
        await getPortugueseDescription(team.strDescriptionPT, team.strDescriptionEN)
      ),
      profile: getWorldCupProfile(team.strTeam ?? teamName),
      players: players.length > 0 ? players : fallbackPlayersByTeam(team.strTeam ?? teamName),
      coach: {
        ...coach,
        image: coachGallery[0] ?? "",
        gallery: coachGallery,
      },
      isFallback: players.length === 0,
    };
  } catch {
    return {
      teamName,
      badge: "",
      country: "A definir",
      founded: "A definir",
      stadium: "A definir",
      description: "Nao foi possivel acessar a API no momento. Mostrando escalacao base.",
      profile: getWorldCupProfile(teamName),
      players: fallbackPlayersByTeam(teamName),
      coach: fallbackCoachByTeam(teamName),
      isFallback: true,
    };
  }
}

export async function fetchPlayerById(playerId, teamName = "Time") {
  if (playerId.startsWith("local-")) {
    const indexFromId = Number(playerId.split("-").at(-1)) || 1;
    return fallbackPlayer(teamName, "Posicao nao informada", indexFromId - 1);
  }

  try {
    const data = await fetchJson(
      `${SPORTS_DB_BASE}/lookupplayer.php?id=${encodeURIComponent(playerId)}`
    );
    const player = data.players?.[0];
    if (!player) {
      return null;
    }
    const view = toPlayerView(player, teamName);
    view.description = await getPortugueseDescription(
      player.strDescriptionPT,
      player.strDescriptionEN
    );
    const achievements = await fetchHonoursByPlayerId(player.idPlayer);
    return {
      ...view,
      achievements,
    };
  } catch {
    return null;
  }
}

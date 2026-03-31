import { FALLBACK_MATCHES_2026 } from "../data/matches2026";
import { getWorldCupProfile } from "../data/worldCupInsights";
import { normalizeTeamName } from "../utils/flags";

const SPORTS_DB_BASE = "https://www.thesportsdb.com/api/v1/json/3";
const FIFA_API_BASE = "https://api.fifa.com/api/v3";
const FIFA_WC_SEASON_ID = "285023";
const TRANSLATION_API_BASE = "https://api.mymemory.translated.net/get";
const MATCHES_CACHE_KEY = "gamegrid_wc_matches_2026_v4";
const MATCHES_CACHE_TTL_MS = 3 * 60 * 1000;
const translationCache = new Map();

const fifaStageLabels = {
  "First Stage": "Fase de grupos",
  "Round of 32": "16 avos de final",
  "Round of 16": "Oitavas de final",
  "Quarter-final": "Quartas de final",
  "Semi-final": "Semifinal",
  "Play-off for third place": "Disputa de 3º lugar",
  Final: "Final",
};

const fifaVenueAliases = {
  "Mexico City Stadium": { stadium: "Estadio Azteca", city: "Mexico City" },
  "Guadalajara Stadium": { stadium: "Estadio Akron", city: "Guadalajara" },
  "Monterrey Stadium": { stadium: "Estadio BBVA", city: "Monterrey" },
  "Vancouver Stadium": { stadium: "BC Place", city: "Vancouver" },
  "Toronto Stadium": { stadium: "BMO Field", city: "Toronto" },
  "Seattle Stadium": { stadium: "Lumen Field", city: "Seattle" },
  "San Francisco Bay Area Stadium": {
    stadium: "Levi's Stadium",
    city: "San Francisco Bay Area",
  },
  "Los Angeles Stadium": { stadium: "SoFi Stadium", city: "Los Angeles" },
  "Dallas Stadium": { stadium: "AT&T Stadium", city: "Dallas" },
  "Houston Stadium": { stadium: "NRG Stadium", city: "Houston" },
  "Kansas City Stadium": { stadium: "Arrowhead Stadium", city: "Kansas City" },
  "Atlanta Stadium": { stadium: "Mercedes-Benz Stadium", city: "Atlanta" },
  "Miami Stadium": { stadium: "Hard Rock Stadium", city: "Miami" },
  "Boston Stadium": { stadium: "Gillette Stadium", city: "Boston" },
  "Philadelphia Stadium": {
    stadium: "Lincoln Financial Field",
    city: "Philadelphia",
  },
  "New York/New Jersey Stadium": {
    stadium: "MetLife Stadium",
    city: "New York New Jersey",
  },
};

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

function readMatchesCache() {
  try {
    const raw = localStorage.getItem(MATCHES_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.savedAt || !parsed?.data) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeMatchesCache(data) {
  try {
    localStorage.setItem(
      MATCHES_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        data,
      })
    );
  } catch {
    // Ignore quota/private mode failures.
  }
}

function withStageFallback(stageName, fallbackStage) {
  return stageName || fallbackStage || "Fase de grupos";
}

function createMapsUrl(venue) {
  const query = `${venue.stadium}, ${venue.city}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function localDateKeyFromIso(dateTime) {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLocalKickoff(dateTime) {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    return "A definir";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function fifaLabel(entries, fallback = "") {
  return entries?.[0]?.Description?.trim() || fallback;
}

function translateFifaStage(stageName) {
  return fifaStageLabels[stageName] ?? withStageFallback(stageName, "Fase de grupos");
}

function formatGroupStageRank(code) {
  const match = String(code ?? "").trim().match(/^([1234])([A-L])$/i);
  if (!match) {
    return "";
  }

  return `${match[1]}º do Grupo ${match[2].toUpperCase()}`;
}

function formatBestThirdCode(code) {
  const match = String(code ?? "").trim().match(/^3([A-L]+)$/i);
  if (!match) {
    return "";
  }

  return `Melhor 3º entre ${match[1].toUpperCase().split("").join("/")}`;
}

function formatKnockoutCode(code) {
  const winnerMatch = String(code ?? "").trim().match(/^W(\d{1,3})$/i);
  if (winnerMatch) {
    return `Vencedor do Jogo ${winnerMatch[1]}`;
  }

  const loserMatch = String(code ?? "").trim().match(/^L(\d{1,3})$/i);
  if (loserMatch) {
    return `Perdedor do Jogo ${loserMatch[1]}`;
  }

  return "";
}

function formatFifaPlaceholder(code) {
  return (
    formatGroupStageRank(code) ||
    formatBestThirdCode(code) ||
    formatKnockoutCode(code) ||
    String(code ?? "").trim() ||
    "A definir"
  );
}

function normalizeFifaFlagUrl(flagUrl) {
  if (!flagUrl) {
    return "";
  }

  return flagUrl.replace("flags-{format}-{size}/", "flags-sq-4/");
}

function isPlayoffPlaceholder(teamName, placeholderCode) {
  const safeName = String(teamName ?? "").trim();
  if (!safeName) {
    return Boolean(placeholderCode);
  }

  return /\/|qualifier|play-off/i.test(safeName);
}

function toVenueView(stadiumData, fallbackVenue) {
  const officialStadium = fifaLabel(stadiumData?.Name, fallbackVenue?.stadium ?? "A definir");
  const officialCity = fifaLabel(stadiumData?.CityName, fallbackVenue?.city ?? "A definir");
  return fifaVenueAliases[officialStadium] ?? {
    stadium: officialStadium,
    city: officialCity,
  };
}

function toMatchTeam(side, placeholderCode) {
  const teamName = fifaLabel(side?.TeamName, "");
  const isPlaceholder = isPlayoffPlaceholder(teamName, placeholderCode);

  return {
    name: isPlaceholder ? teamName || formatFifaPlaceholder(placeholderCode) : teamName,
    code: side?.IdCountry ?? side?.Abbreviation ?? "",
    flagSrc: isPlaceholder ? "" : normalizeFifaFlagUrl(side?.PictureUrl),
    isPlaceholder,
  };
}

function toFifaMatchView(match) {
  const kickoffUtc = match?.Date ?? null;
  const venue = toVenueView(match?.Stadium);
  const stage = translateFifaStage(fifaLabel(match?.StageName));
  const group = fifaLabel(match?.GroupName, "");

  return {
    id: Number(match?.MatchNumber ?? match?.IdMatch ?? 0),
    stage,
    group,
    date: kickoffUtc ? localDateKeyFromIso(kickoffUtc) : "",
    kickoff: kickoffUtc ? formatLocalKickoff(kickoffUtc) : "A definir",
    kickoffUtc,
    venue,
    mapsUrl: createMapsUrl(venue),
    homeTeam: toMatchTeam(match?.Home, match?.PlaceHolderA),
    awayTeam: toMatchTeam(match?.Away, match?.PlaceHolderB),
  };
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
  const cached = readMatchesCache();
  if (cached && Date.now() - cached.savedAt < MATCHES_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const data = await fetchJson(
      `${FIFA_API_BASE}/calendar/matches?language=en&count=500&idSeason=${FIFA_WC_SEASON_ID}`
    );
    const fifaMatches = (data.Results ?? [])
      .map(toFifaMatchView)
      .filter((match) => match.id > 0 && match.date)
      .sort((left, right) => {
        const leftTime = left.kickoffUtc ? new Date(left.kickoffUtc).getTime() : 0;
        const rightTime = right.kickoffUtc ? new Date(right.kickoffUtc).getTime() : 0;
        return leftTime - rightTime || left.id - right.id;
      });

    if (fifaMatches.length === 0) {
      const fallbackResult = {
        matches: FALLBACK_MATCHES_2026.map((match) => ({
          ...match,
          kickoffUtc: null,
          group: "",
          homeTeam: { ...match.homeTeam, flagSrc: "", code: "", isPlaceholder: true },
          awayTeam: { ...match.awayTeam, flagSrc: "", code: "", isPlaceholder: true },
          mapsUrl: createMapsUrl(match.venue),
        })),
        sourceLabel: "local",
      };
      writeMatchesCache(fallbackResult);
      return fallbackResult;
    }

    const apiResult = {
      matches: fifaMatches,
      sourceLabel: "fifa-official",
    };
    writeMatchesCache(apiResult);
    return apiResult;
  } catch {
    if (cached?.data) {
      return cached.data;
    }

    const fallbackResult = {
      matches: FALLBACK_MATCHES_2026.map((match) => ({
        ...match,
        kickoffUtc: null,
        group: "",
        homeTeam: { ...match.homeTeam, flagSrc: "", code: "", isPlaceholder: true },
        awayTeam: { ...match.awayTeam, flagSrc: "", code: "", isPlaceholder: true },
        mapsUrl: createMapsUrl(match.venue),
      })),
      sourceLabel: "local",
    };
    writeMatchesCache(fallbackResult);
    return fallbackResult;
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

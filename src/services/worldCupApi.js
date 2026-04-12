import { getLanguageMeta, normalizeLanguage } from "../data/uiText";
import { FALLBACK_MATCHES_2026 } from "../data/matches2026";
import { getWorldCupProfile } from "../data/worldCupInsights";
import { normalizeTeamName } from "../utils/flags";

const SPORTS_DB_BASE = "https://www.thesportsdb.com/api/v1/json/3";
const FIFA_API_BASE = "https://api.fifa.com/api/v3";
const FIFA_WC_SEASON_ID = "285023";
const TRANSLATION_API_BASE = "https://api.mymemory.translated.net/get";
const MATCHES_CACHE_KEY = "gamegrid_wc_matches_2026_v6";
const MATCHES_CACHE_TTL_MS = 3 * 60 * 1000;
const translationCache = new Map();
const playerImageCache = new Map();

const stageKeysByName = {
  "First Stage": "group_stage",
  "Round of 32": "round_of_32",
  "Round of 16": "round_of_16",
  "Quarter-final": "quarter_final",
  "Semi-final": "semi_final",
  "Play-off for third place": "third_place",
  Final: "final",
  "Fase de grupos": "group_stage",
  "16 avos de final": "round_of_32",
  "Oitavas de final": "round_of_16",
  "Quartas de final": "quarter_final",
  Semifinal: "semi_final",
  "Disputa de 3º lugar": "third_place",
};

const stageLabels = {
  pt: {
    group_stage: "Fase de grupos",
    round_of_32: "16 avos de final",
    round_of_16: "Oitavas de final",
    quarter_final: "Quartas de final",
    semi_final: "Semifinal",
    third_place: "Disputa de 3º lugar",
    final: "Final",
  },
  en: {
    group_stage: "Group stage",
    round_of_32: "Round of 32",
    round_of_16: "Round of 16",
    quarter_final: "Quarter-final",
    semi_final: "Semi-final",
    third_place: "Third-place play-off",
    final: "Final",
  },
  es: {
    group_stage: "Fase de grupos",
    round_of_32: "Dieciseisavos de final",
    round_of_16: "Octavos de final",
    quarter_final: "Cuartos de final",
    semi_final: "Semifinal",
    third_place: "Partido por el tercer puesto",
    final: "Final",
  },
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

const serviceStrings = {
  pt: {
    defining: "A definir",
    notInformed: "Nao informado",
    summaryUnavailable: "Resumo indisponivel na API.",
    descriptionUnavailable: "Descricao disponivel apenas no idioma original no momento.",
    playerDetailsUnavailable: "Dados detalhados ainda nao disponiveis na API para este atleta.",
    coachOf: (teamName) => `Tecnico de ${teamName}`,
    playerOf: (teamName, index) => `${teamName} - Jogador ${index + 1}`,
    player: "Jogador",
    coachRole: "Tecnico",
    unknownTeamDescription:
      "Este time ainda depende de definicao da fase anterior da Copa.",
    teamApiMissingDescription:
      "A API nao retornou detalhes para este time. Mostrando escalacao base.",
    teamApiUnavailableDescription:
      "Nao foi possivel acessar a API no momento. Mostrando escalacao base.",
    playerDescriptionFallback: "Sem descricao disponivel em portugues.",
    positionFallback: "Posicao nao informada",
    nationalityFallback: "Nacionalidade nao informada",
    birthFallback: "Data nao informada",
    heightFallback: "Nao informado",
    weightFallback: "Nao informado",
    achievementTitle: "Conquista",
    seasonFallback: "Temporada nao informada",
    teamFallback: "Time nao informado",
    roundWinner: (matchNumber) => `Vencedor do Jogo ${matchNumber}`,
    roundLoser: (matchNumber) => `Perdedor do Jogo ${matchNumber}`,
    groupRank: (rank, group) => `${rank}º do Grupo ${group}`,
    bestThird: (groups) => `Melhor 3º entre ${groups}`,
  },
  en: {
    defining: "To be defined",
    notInformed: "Not informed",
    summaryUnavailable: "Summary unavailable from the API.",
    descriptionUnavailable: "Description is only available in the original language right now.",
    playerDetailsUnavailable: "Detailed player data is not yet available from the API.",
    coachOf: (teamName) => `${teamName} coach`,
    playerOf: (teamName, index) => `${teamName} - Player ${index + 1}`,
    player: "Player",
    coachRole: "Coach",
    unknownTeamDescription: "This team still depends on a previous-round result.",
    teamApiMissingDescription:
      "The API did not return details for this team. Showing a base lineup.",
    teamApiUnavailableDescription:
      "Could not reach the API right now. Showing a base lineup.",
    playerDescriptionFallback: "No description available in English.",
    positionFallback: "Position not informed",
    nationalityFallback: "Nationality not informed",
    birthFallback: "Date not informed",
    heightFallback: "Not informed",
    weightFallback: "Not informed",
    achievementTitle: "Achievement",
    seasonFallback: "Season not informed",
    teamFallback: "Team not informed",
    roundWinner: (matchNumber) => `Winner of Match ${matchNumber}`,
    roundLoser: (matchNumber) => `Loser of Match ${matchNumber}`,
    groupRank: (rank, group) =>
      `${rank}${rank === "1" ? "st" : rank === "2" ? "nd" : rank === "3" ? "rd" : "th"} of Group ${group}`,
    bestThird: (groups) => `Best 3rd among ${groups}`,
  },
  es: {
    defining: "Por definir",
    notInformed: "No informado",
    summaryUnavailable: "Resumen no disponible en la API.",
    descriptionUnavailable: "La descripcion solo esta disponible en el idioma original por ahora.",
    playerDetailsUnavailable:
      "Los datos detallados de este jugador aun no estan disponibles en la API.",
    coachOf: (teamName) => `Entrenador de ${teamName}`,
    playerOf: (teamName, index) => `${teamName} - Jugador ${index + 1}`,
    player: "Jugador",
    coachRole: "Entrenador",
    unknownTeamDescription: "Este equipo todavia depende del resultado de una fase anterior.",
    teamApiMissingDescription:
      "La API no devolvio detalles para este equipo. Mostrando una alineacion base.",
    teamApiUnavailableDescription:
      "No fue posible acceder a la API en este momento. Mostrando una alineacion base.",
    playerDescriptionFallback: "No hay descripcion disponible en espanol.",
    positionFallback: "Posicion no informada",
    nationalityFallback: "Nacionalidad no informada",
    birthFallback: "Fecha no informada",
    heightFallback: "No informado",
    weightFallback: "No informado",
    achievementTitle: "Logro",
    seasonFallback: "Temporada no informada",
    teamFallback: "Equipo no informado",
    roundWinner: (matchNumber) => `Ganador del Partido ${matchNumber}`,
    roundLoser: (matchNumber) => `Perdedor del Partido ${matchNumber}`,
    groupRank: (rank, group) => `${rank}º del Grupo ${group}`,
    bestThird: (groups) => `Mejor 3º entre ${groups}`,
  },
};

const isUnknownTeam = (teamName) =>
  /^(grupo|classificado|vencedor|perdedor|a definir|to be defined|por definir)/i.test(
    teamName ?? ""
  );

function resolveLanguage(language = "pt-BR") {
  const normalized = normalizeLanguage(language);
  const meta = getLanguageMeta(normalized);
  return {
    language: normalized,
    locale: meta.locale,
    apiLanguage: meta.api,
    strings: serviceStrings[meta.api] ?? serviceStrings.pt,
  };
}

function cacheKeyForLanguage(language) {
  const { apiLanguage } = resolveLanguage(language);
  return `${MATCHES_CACHE_KEY}_${apiLanguage}`;
}

function readMatchesCache(language) {
  try {
    const raw = localStorage.getItem(cacheKeyForLanguage(language));
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

function writeMatchesCache(language, data) {
  try {
    localStorage.setItem(
      cacheKeyForLanguage(language),
      JSON.stringify({
        savedAt: Date.now(),
        data,
      })
    );
  } catch {
    // Ignore quota/private mode failures.
  }
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

function formatLocalKickoff(dateTime, locale) {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    return resolveLanguage(locale).strings.defining;
  }

  return new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function fifaLabel(entries, fallback = "") {
  return entries?.[0]?.Description?.trim() || fallback;
}

function translateFifaStage(stageKey, language) {
  const { apiLanguage } = resolveLanguage(language);
  return stageLabels[apiLanguage]?.[stageKey] ?? stageLabels.pt[stageKey] ?? stageKey;
}

function resolveStageKey(stageName) {
  return stageKeysByName[stageName] ?? "group_stage";
}

function formatGroupStageRank(code, language) {
  const match = String(code ?? "").trim().match(/^([1234])([A-L])$/i);
  if (!match) {
    return "";
  }

  return resolveLanguage(language).strings.groupRank(match[1], match[2].toUpperCase());
}

function formatBestThirdCode(code, language) {
  const match = String(code ?? "").trim().match(/^3([A-L]+)$/i);
  if (!match) {
    return "";
  }

  return resolveLanguage(language).strings.bestThird(match[1].toUpperCase().split("").join("/"));
}

function formatKnockoutCode(code, language) {
  const winnerMatch = String(code ?? "").trim().match(/^W(\d{1,3})$/i);
  if (winnerMatch) {
    return resolveLanguage(language).strings.roundWinner(winnerMatch[1]);
  }

  const loserMatch = String(code ?? "").trim().match(/^L(\d{1,3})$/i);
  if (loserMatch) {
    return resolveLanguage(language).strings.roundLoser(loserMatch[1]);
  }

  return "";
}

function formatFifaPlaceholder(code, language) {
  const { strings } = resolveLanguage(language);
  return (
    formatGroupStageRank(code, language) ||
    formatBestThirdCode(code, language) ||
    formatKnockoutCode(code, language) ||
    String(code ?? "").trim() ||
    strings.defining
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

function toMatchTeam(side, placeholderCode, language) {
  const teamName = fifaLabel(side?.TeamName, "");
  const isPlaceholder = isPlayoffPlaceholder(teamName, placeholderCode);

  return {
    name: isPlaceholder ? teamName || formatFifaPlaceholder(placeholderCode, language) : teamName,
    code: side?.IdCountry ?? side?.Abbreviation ?? "",
    flagSrc: isPlaceholder ? "" : normalizeFifaFlagUrl(side?.PictureUrl),
    isPlaceholder,
  };
}

function toFifaMatchView(match, language) {
  const { locale } = resolveLanguage(language);
  const kickoffUtc = match?.Date ?? null;
  const venue = toVenueView(match?.Stadium);
  const stageKey = resolveStageKey(fifaLabel(match?.StageName));

  return {
    id: Number(match?.MatchNumber ?? match?.IdMatch ?? 0),
    stageKey,
    stage: translateFifaStage(stageKey, language),
    group: fifaLabel(match?.GroupName, ""),
    date: kickoffUtc ? localDateKeyFromIso(kickoffUtc) : "",
    kickoff: kickoffUtc ? formatLocalKickoff(kickoffUtc, locale) : resolveLanguage(language).strings.defining,
    kickoffUtc,
    venue,
    mapsUrl: createMapsUrl(venue),
    homeTeam: toMatchTeam(match?.Home, match?.PlaceHolderA, language),
    awayTeam: toMatchTeam(match?.Away, match?.PlaceHolderB, language),
  };
}

function fallbackPlayer(teamName, position, index, language) {
  const { strings } = resolveLanguage(language);
  return {
    id: `local-${normalizeTeamName(teamName)}-${index + 1}`,
    name: strings.playerOf(teamName, index),
    team: teamName,
    position,
    nationality: teamName,
    birth: strings.birthFallback,
    height: strings.heightFallback,
    weight: strings.weightFallback,
    description: strings.playerDetailsUnavailable,
    image: "",
    gallery: [],
    achievements: [],
  };
}

function fallbackPlayersByTeam(teamName, language) {
  const positions = [
    "goalkeeper",
    "right-back",
    "centre-back",
    "centre-back",
    "left-back",
    "defensive midfield",
    "central midfield",
    "central midfield",
    "right winger",
    "centre-forward",
    "left winger",
  ];

  return positions.map((position, index) => fallbackPlayer(teamName, position, index, language));
}

function fallbackCoachByTeam(teamName, language) {
  const { strings } = resolveLanguage(language);
  return {
    id: `coach-${normalizeTeamName(teamName)}`,
    name: strings.coachOf(teamName),
    role: strings.coachRole,
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

function toCoachView(team, teamName, language) {
  const { strings } = resolveLanguage(language);
  const managerName =
    team?.strManager
      ?.split(/[,;|]/)
      .map((name) => name.trim())
      .find(Boolean) ?? strings.coachOf(teamName);

  return {
    id: `coach-${normalizeTeamName(teamName)}`,
    name: managerName,
    role: strings.coachRole,
    image: "",
    gallery: [],
  };
}

function toPlayerView(player, teamName, language) {
  const { strings } = resolveLanguage(language);
  const gallery = extractPlayerGallery(player);

  return {
    id: player.idPlayer,
    name: player.strPlayer ?? strings.player,
    team: player.strTeam ?? teamName,
    position: player.strPosition ?? strings.positionFallback,
    nationality: player.strNationality ?? strings.nationalityFallback,
    birth: player.dateBorn ?? strings.birthFallback,
    height: player.strHeight ?? strings.heightFallback,
    weight: player.strWeight ?? strings.weightFallback,
    description: player.strDescriptionEN ?? player.strDescriptionPT ?? strings.playerDescriptionFallback,
    image: gallery[0] ?? "",
    gallery,
    achievements: [],
  };
}

function selectBestPlayerCandidate(candidates, teamName, playerName = "") {
  const normalizedTeam = normalizeTeamName(teamName);
  const normalizedPlayerName = String(playerName ?? "").trim().toLowerCase();

  const sameTeamCandidates = candidates.filter(
    (candidate) => normalizeTeamName(candidate.strTeam ?? "") === normalizedTeam
  );

  const exactNameInTeam = sameTeamCandidates.find(
    (candidate) => String(candidate.strPlayer ?? "").trim().toLowerCase() === normalizedPlayerName
  );
  if (exactNameInTeam) {
    return exactNameInTeam;
  }

  const exactNameAnywhere = candidates.find(
    (candidate) => String(candidate.strPlayer ?? "").trim().toLowerCase() === normalizedPlayerName
  );
  if (exactNameAnywhere) {
    return exactNameAnywhere;
  }

  return sameTeamCandidates[0] ?? candidates[0] ?? null;
}

async function fetchPlayerGalleryFallback(playerName, teamName = "") {
  const safeName = String(playerName ?? "").trim();
  if (!safeName) {
    return [];
  }

  const cacheId = `${normalizeTeamName(teamName)}|${safeName.toLowerCase()}`;
  if (playerImageCache.has(cacheId)) {
    return playerImageCache.get(cacheId);
  }

  try {
    const data = await fetchJson(
      `${SPORTS_DB_BASE}/searchplayers.php?p=${encodeURIComponent(safeName)}`
    );
    const candidates = data.player ?? [];
    const bestMatch = selectBestPlayerCandidate(candidates, teamName, safeName);
    const gallery = bestMatch ? extractPlayerGallery(bestMatch) : [];
    playerImageCache.set(cacheId, gallery);
    return gallery;
  } catch {
    playerImageCache.set(cacheId, []);
    return [];
  }
}

async function hydratePlayersWithFallbackImages(players, teamName) {
  const hydratedPlayers = await Promise.all(
    (players ?? []).map(async (player) => {
      if (player.image) {
        return player;
      }

      const fallbackGallery = await fetchPlayerGalleryFallback(player.name, teamName);
      if (fallbackGallery.length === 0) {
        return player;
      }

      return {
        ...player,
        image: fallbackGallery[0] ?? "",
        gallery: uniqueImages([...fallbackGallery, ...(player.gallery ?? [])]),
      };
    })
  );

  return hydratedPlayers;
}

function truncateForTranslation(text, maxLength = 900) {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) {
    return clean;
  }
  return `${clean.slice(0, maxLength)}...`;
}

async function translateText(text, sourceLanguage, targetLanguage) {
  const base = truncateForTranslation(text);
  if (!base || !sourceLanguage || !targetLanguage || sourceLanguage === targetLanguage) {
    return base;
  }

  const cacheId = `${sourceLanguage}|${targetLanguage}|${base}`;
  if (translationCache.has(cacheId)) {
    return translationCache.get(cacheId);
  }

  try {
    const data = await fetchJson(
      `${TRANSLATION_API_BASE}?q=${encodeURIComponent(base)}&langpair=${sourceLanguage}|${targetLanguage}`
    );
    const translated = data?.responseData?.translatedText?.trim();
    const isValid = translated && !/^INVALID LANGUAGE PAIR/i.test(translated);
    const value = isValid ? translated : "";
    translationCache.set(cacheId, value);
    return value;
  } catch {
    return "";
  }
}

async function getLocalizedDescription({ descriptionPt = "", descriptionEn = "", language }) {
  const { apiLanguage, strings } = resolveLanguage(language);
  const pt = descriptionPt.trim();
  const en = descriptionEn.trim();

  if (apiLanguage === "pt") {
    if (pt) return pt;
    if (en) return (await translateText(en, "en", "pt")) || en;
    return strings.descriptionUnavailable;
  }

  if (apiLanguage === "en") {
    if (en) return en;
    if (pt) return (await translateText(pt, "pt", "en")) || pt;
    return strings.descriptionUnavailable;
  }

  if (en) {
    return (await translateText(en, "en", "es")) || en;
  }
  if (pt) {
    return (await translateText(pt, "pt", "es")) || pt;
  }
  return strings.descriptionUnavailable;
}

function toAchievementView(honour, index, language) {
  const { strings } = resolveLanguage(language);
  return {
    id: honour.id ?? `${honour.idHonour ?? honour.strHonour ?? "honour"}-${index}`,
    title: honour.strHonour ?? strings.achievementTitle,
    season: honour.strSeason ?? strings.seasonFallback,
    team: honour.strTeam ?? strings.teamFallback,
  };
}

async function fetchHonoursByPlayerId(playerId, language) {
  if (!playerId) {
    return [];
  }

  try {
    const data = await fetchJson(
      `${SPORTS_DB_BASE}/lookuphonours.php?id=${encodeURIComponent(playerId)}`
    );
    const honours = data.honours ?? [];
    return honours.map((honour, index) => toAchievementView(honour, index, language));
  } catch {
    return [];
  }
}

async function fetchCoachGallery(coachName, teamName) {
  if (!coachName || /^(tecnico de |coach of |entrenador de )/i.test(coachName)) {
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

export async function fetchPersonAchievementsByName(personName, teamName = "", language = "pt-BR") {
  const safeName = (personName ?? "").trim();
  if (!safeName || /^(tecnico de |coach of |entrenador de )/i.test(safeName)) {
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

    return fetchHonoursByPlayerId(selectedPlayer.idPlayer, language);
  } catch {
    return [];
  }
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return response.json();
}

function shortDescription(text, language) {
  const { strings } = resolveLanguage(language);
  if (!text) {
    return strings.summaryUnavailable;
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

function toFallbackMatch(match, language) {
  return {
    ...match,
    stageKey: resolveStageKey(match.stage),
    stage: translateFifaStage(resolveStageKey(match.stage), language),
    kickoffUtc: null,
    group: "",
    homeTeam: { ...match.homeTeam, flagSrc: "", code: "", isPlaceholder: true },
    awayTeam: { ...match.awayTeam, flagSrc: "", code: "", isPlaceholder: true },
    mapsUrl: createMapsUrl(match.venue),
  };
}

export async function fetchWorldCupMatches2026(language = "pt-BR") {
  const resolved = resolveLanguage(language);
  const cached = readMatchesCache(resolved.language);
  if (cached && Date.now() - cached.savedAt < MATCHES_CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const data = await fetchJson(
      `${FIFA_API_BASE}/calendar/matches?language=en&count=500&idSeason=${FIFA_WC_SEASON_ID}`
    );
    const fifaMatches = (data.Results ?? [])
      .map((match) => toFifaMatchView(match, resolved.language))
      .filter((match) => match.id > 0 && match.date)
      .sort((left, right) => {
        const leftTime = left.kickoffUtc ? new Date(left.kickoffUtc).getTime() : 0;
        const rightTime = right.kickoffUtc ? new Date(right.kickoffUtc).getTime() : 0;
        return leftTime - rightTime || left.id - right.id;
      });

    if (fifaMatches.length === 0) {
      const fallbackResult = {
        matches: FALLBACK_MATCHES_2026.map((match) => toFallbackMatch(match, resolved.language)),
        sourceLabel: "local",
      };
      writeMatchesCache(resolved.language, fallbackResult);
      return fallbackResult;
    }

    const apiResult = {
      matches: fifaMatches,
      sourceLabel: "fifa-official",
    };
    writeMatchesCache(resolved.language, apiResult);
    return apiResult;
  } catch {
    if (cached?.data) {
      return cached.data;
    }

    const fallbackResult = {
      matches: FALLBACK_MATCHES_2026.map((match) => toFallbackMatch(match, resolved.language)),
      sourceLabel: "local",
    };
    writeMatchesCache(resolved.language, fallbackResult);
    return fallbackResult;
  }
}

export async function fetchTeamDetails(teamName, language = "pt-BR") {
  const { strings } = resolveLanguage(language);

  if (isUnknownTeam(teamName)) {
    const fallbackDescription = strings.unknownTeamDescription;
    return {
      teamName,
      badge: "",
      country: strings.defining,
      founded: strings.defining,
      stadium: strings.defining,
      description: fallbackDescription,
      summary: shortDescription(fallbackDescription, language),
      profile: getWorldCupProfile(teamName),
      players: fallbackPlayersByTeam(teamName, language),
      coach: fallbackCoachByTeam(teamName, language),
      isFallback: true,
    };
  }

  try {
    const team = await getTeamFromApi(teamName);

    if (!team) {
      const fallbackDescription = strings.teamApiMissingDescription;
      return {
        teamName,
        badge: "",
        country: strings.defining,
        founded: strings.defining,
        stadium: strings.defining,
        description: fallbackDescription,
        summary: shortDescription(fallbackDescription, language),
        profile: getWorldCupProfile(teamName),
        players: fallbackPlayersByTeam(teamName, language),
        coach: fallbackCoachByTeam(teamName, language),
        isFallback: true,
      };
    }

    const playersPayload = await fetchJson(
      `${SPORTS_DB_BASE}/lookup_all_players.php?id=${team.idTeam}`
    );
    const rawPlayers = (playersPayload.player ?? [])
      .filter((player) => player.strStatus !== "Retired")
      .map((player) => toPlayerView(player, team.strTeam, language));
    const players = await hydratePlayersWithFallbackImages(rawPlayers, team.strTeam ?? teamName);
    const teamDescription = await getLocalizedDescription({
      descriptionPt: team.strDescriptionPT,
      descriptionEn: team.strDescriptionEN,
      language,
    });

    const coach = toCoachView(team, team.strTeam ?? teamName, language);
    const coachGallery = await fetchCoachGallery(coach.name, team.strTeam ?? teamName);

    return {
      teamName: team.strTeam ?? teamName,
      badge: team.strBadge ?? "",
      country: team.strCountry ?? strings.notInformed,
      founded: team.intFormedYear ?? strings.notInformed,
      stadium: team.strStadium ?? strings.notInformed,
      description: teamDescription,
      summary: shortDescription(teamDescription, language),
      profile: getWorldCupProfile(team.strTeam ?? teamName),
      players: players.length > 0 ? players : fallbackPlayersByTeam(team.strTeam ?? teamName, language),
      coach: {
        ...coach,
        image: coachGallery[0] ?? "",
        gallery: coachGallery,
      },
      isFallback: players.length === 0,
    };
  } catch {
    const fallbackDescription = strings.teamApiUnavailableDescription;
    return {
      teamName,
      badge: "",
      country: strings.defining,
      founded: strings.defining,
      stadium: strings.defining,
      description: fallbackDescription,
      summary: shortDescription(fallbackDescription, language),
      profile: getWorldCupProfile(teamName),
      players: fallbackPlayersByTeam(teamName, language),
      coach: fallbackCoachByTeam(teamName, language),
      isFallback: true,
    };
  }
}

export async function fetchPlayerById(playerId, teamName = "Team", language = "pt-BR") {
  const { strings } = resolveLanguage(language);

  if (playerId.startsWith("local-")) {
    const indexFromId = Number(playerId.split("-").at(-1)) || 1;
    return fallbackPlayer(teamName, strings.positionFallback, indexFromId - 1, language);
  }

  try {
    const data = await fetchJson(
      `${SPORTS_DB_BASE}/lookupplayer.php?id=${encodeURIComponent(playerId)}`
    );
    const player = data.players?.[0];
    if (!player) {
      return null;
    }

    const view = toPlayerView(player, teamName, language);
    if (!view.image) {
      const fallbackGallery = await fetchPlayerGalleryFallback(
        view.name,
        view.team ?? teamName
      );
      if (fallbackGallery.length > 0) {
        view.image = fallbackGallery[0] ?? "";
        view.gallery = uniqueImages([...fallbackGallery, ...(view.gallery ?? [])]);
      }
    }
    view.description = await getLocalizedDescription({
      descriptionPt: player.strDescriptionPT,
      descriptionEn: player.strDescriptionEN,
      language,
    });
    const achievements = await fetchHonoursByPlayerId(player.idPlayer, language);

    return {
      ...view,
      summary: shortDescription(view.description, language),
      achievements,
    };
  } catch {
    return null;
  }
}

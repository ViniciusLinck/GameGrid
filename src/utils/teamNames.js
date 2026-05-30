import { getLanguageMeta, normalizeLanguage } from "../data/uiText";
import { normalizeTeamName } from "./flags";

const TEAM_REGION_CODES = {
  argentina: "AR",
  austria: "AT",
  belgium: "BE",
  brazil: "BR",
  canada: "CA",
  cameroon: "CM",
  chile: "CL",
  colombia: "CO",
  "costa rica": "CR",
  croatia: "HR",
  "czech republic": "CZ",
  denmark: "DK",
  ecuador: "EC",
  egypt: "EG",
  france: "FR",
  germany: "DE",
  ghana: "GH",
  hungary: "HU",
  italy: "IT",
  japan: "JP",
  mexico: "MX",
  morocco: "MA",
  netherlands: "NL",
  nigeria: "NG",
  norway: "NO",
  paraguay: "PY",
  poland: "PL",
  portugal: "PT",
  qatar: "QA",
  "saudi arabia": "SA",
  serbia: "RS",
  slovakia: "SK",
  "south korea": "KR",
  spain: "ES",
  sweden: "SE",
  switzerland: "CH",
  tunisia: "TN",
  turkey: "TR",
  "united states": "US",
  uruguay: "UY",
};

const TEAM_LABEL_OVERRIDES = {
  en: {
    england: "England",
    scotland: "Scotland",
    wales: "Wales",
  },
  es: {
    england: "Inglaterra",
    scotland: "Escocia",
    wales: "Gales",
  },
  pt: {
    england: "Inglaterra",
    scotland: "Escócia",
    wales: "País de Gales",
  },
};

const regionDisplayCache = new Map();

function getRegionDisplayName(locale, regionCode) {
  if (typeof Intl === "undefined" || typeof Intl.DisplayNames === "undefined") {
    return "";
  }

  const cacheKey = `${locale}|region`;
  if (!regionDisplayCache.has(cacheKey)) {
    regionDisplayCache.set(
      cacheKey,
      new Intl.DisplayNames([locale], {
        type: "region",
      })
    );
  }

  return regionDisplayCache.get(cacheKey)?.of(regionCode) ?? "";
}

export function translateTeamName(teamName, language = "pt-BR") {
  const fallbackName = String(teamName ?? "").trim();
  if (!fallbackName) {
    return "";
  }

  const normalizedLanguage = normalizeLanguage(language);
  const { api: apiLanguage, locale } = getLanguageMeta(normalizedLanguage);
  const normalizedTeam = normalizeTeamName(fallbackName);

  const override = TEAM_LABEL_OVERRIDES[apiLanguage]?.[normalizedTeam];
  if (override) {
    return override;
  }

  const regionCode = TEAM_REGION_CODES[normalizedTeam];
  if (regionCode) {
    const localizedName = getRegionDisplayName(locale, regionCode);
    if (localizedName) {
      return localizedName;
    }
  }

  return fallbackName;
}

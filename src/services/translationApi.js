const TRANSLATION_BASE_URL = "https://api.mymemory.translated.net/get";
const CACHE_PREFIX = "translation_cache_v1";

function buildCacheKey(text, sourceLang, targetLang) {
  return `${CACHE_PREFIX}:${sourceLang}:${targetLang}:${text}`;
}

function getCachedValue(cacheKey) {
  try {
    return localStorage.getItem(cacheKey) ?? "";
  } catch {
    return "";
  }
}

function setCachedValue(cacheKey, value) {
  try {
    localStorage.setItem(cacheKey, value);
  } catch {
    // Storage can fail in private mode or blocked contexts.
  }
}

export async function translateText(text, sourceLang = "en", targetLang = "pt") {
  const clean = (text ?? "").trim();
  if (!clean) {
    return "";
  }

  const cacheKey = buildCacheKey(clean, sourceLang, targetLang);
  const cached = getCachedValue(cacheKey);
  if (cached) {
    return cached;
  }

  const url = new URL(TRANSLATION_BASE_URL);
  url.searchParams.set("q", clean);
  url.searchParams.set("langpair", `${sourceLang}|${targetLang}`);

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Translation HTTP ${response.status}`);
  }

  const data = await response.json();
  const translated = data?.responseData?.translatedText?.trim() ?? "";

  if (translated) {
    setCachedValue(cacheKey, translated);
  }

  return translated;
}

export async function translateMany(texts, sourceLang = "en", targetLang = "pt") {
  const entries = await Promise.all(
    (texts ?? []).map(async (text) => ({
      original: text,
      translated: await translateText(text, sourceLang, targetLang),
    }))
  );

  return entries;
}

export const translationConfig = {
  baseUrl: TRANSLATION_BASE_URL,
};

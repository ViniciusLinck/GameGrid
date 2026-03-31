import localforage from "localforage";

export const PRIVACY_PREFERENCES_KEY = "gamegrid_privacy_preferences_v1";
export const LANGUAGE_STORAGE_KEY = "gamegrid_language_v1";
export const FAVORITES_KEY = "gamegrid_favorites_v1";
export const POLL_CLIENT_ID_KEY = "gamegrid_poll_client_id";
export const MATCHES_CACHE_PREFIX = "gamegrid_wc_matches_2026_v6_";
export const TRANSLATION_CACHE_PREFIX = "translation_cache_v1:";

const pollStore = localforage.createInstance({
  name: "gamegrid",
  storeName: "poll_votes",
  description: "GameGrid privacy cleanup helper",
});

const defaultPreferences = {
  acknowledged: false,
  allowRemotePoll: false,
  updatedAt: "",
};

export function readPrivacyPreferences() {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  try {
    const raw = window.localStorage.getItem(PRIVACY_PREFERENCES_KEY);
    if (!raw) {
      return defaultPreferences;
    }

    const parsed = JSON.parse(raw);
    return {
      acknowledged: Boolean(parsed?.acknowledged),
      allowRemotePoll: Boolean(parsed?.allowRemotePoll),
      updatedAt: typeof parsed?.updatedAt === "string" ? parsed.updatedAt : "",
    };
  } catch {
    return defaultPreferences;
  }
}

export function writePrivacyPreferences(nextPreferences) {
  const next = {
    acknowledged: Boolean(nextPreferences?.acknowledged),
    allowRemotePoll: Boolean(nextPreferences?.allowRemotePoll),
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(PRIVACY_PREFERENCES_KEY, JSON.stringify(next));
  return next;
}

function localStorageKeysToClear() {
  if (typeof window === "undefined") {
    return [];
  }

  const keys = [];
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) {
      continue;
    }

    if (
      key === PRIVACY_PREFERENCES_KEY ||
      key === LANGUAGE_STORAGE_KEY ||
      key === FAVORITES_KEY ||
      key === POLL_CLIENT_ID_KEY ||
      key.startsWith(MATCHES_CACHE_PREFIX) ||
      key.startsWith(TRANSLATION_CACHE_PREFIX)
    ) {
      keys.push(key);
    }
  }

  return keys;
}

export async function clearAllStoredData() {
  if (typeof window !== "undefined") {
    localStorageKeysToClear().forEach((key) => window.localStorage.removeItem(key));
  }

  try {
    await pollStore.clear();
  } catch {
    // Ignore storage cleanup failures.
  }

  return true;
}

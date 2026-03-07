const GOOGLE_MAPS_SEARCH_BASE_URL = "https://www.google.com/maps/search/?api=1&query=";

export function buildGoogleMapsSearchUrl(stadium, city) {
  const query = [stadium, city].filter(Boolean).join(", ");
  return `${GOOGLE_MAPS_SEARCH_BASE_URL}${encodeURIComponent(query)}`;
}

export function buildMapsUrlFromVenue(venue) {
  return buildGoogleMapsSearchUrl(venue?.stadium ?? "", venue?.city ?? "");
}

export const mapsConfig = {
  searchBaseUrl: GOOGLE_MAPS_SEARCH_BASE_URL,
};

const POLL_API_BASE_URL = import.meta.env.VITE_POLL_API_BASE_URL ?? "";

function getApiBase() {
  return POLL_API_BASE_URL.replace(/\/$/, "");
}

function buildUrl(path) {
  const base = getApiBase();
  if (!base) {
    return "";
  }
  return `${base}${path}`;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : null;

  if (!response.ok) {
    const error = new Error(payload?.message ?? `Poll API HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export async function postVote(matchId, choice, clientId) {
  const url = buildUrl(`/polls/${encodeURIComponent(matchId)}/vote`);
  if (!url) {
    return null;
  }

  return requestJson(url, {
    method: "POST",
    body: JSON.stringify({ choice, clientId }),
  });
}

export async function clearRemoteVote(matchId, clientId) {
  const url = buildUrl(`/polls/${encodeURIComponent(matchId)}/vote`);
  if (!url) {
    return null;
  }

  return requestJson(url, {
    method: "DELETE",
    body: JSON.stringify({ clientId }),
  });
}

export async function getResults(matchId) {
  const url = buildUrl(`/polls/${encodeURIComponent(matchId)}/results`);
  if (!url) {
    return null;
  }

  return requestJson(url, { method: "GET" });
}

export const pollApiConfig = {
  baseUrl: getApiBase(),
  enabled: Boolean(getApiBase()),
};

import http from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT || 8787);
const ROOT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(ROOT_DIR, "data");
const DATA_FILE = path.join(DATA_DIR, "polls-store.json");
const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_REQUESTS = 60;
const CHOICES = new Set(["home", "draw", "away"]);

const rateByIp = new Map();
let cache = { polls: {} };
let saveChain = Promise.resolve();

function nowIso() {
  return new Date().toISOString();
}

function safeNumber(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function createEmptyPoll(matchId) {
  return {
    matchId: String(matchId),
    counts: { home: 0, draw: 0, away: 0 },
    votesByClient: {},
    history: [],
    lastUpdated: nowIso(),
  };
}

function ensurePoll(matchId) {
  const key = String(matchId);
  if (!cache.polls[key]) {
    cache.polls[key] = createEmptyPoll(key);
  }
  return cache.polls[key];
}

function sanitizeMatchId(raw) {
  const matchId = String(raw ?? "").trim();
  return /^\d+$/.test(matchId) ? matchId : null;
}

function getIp(request) {
  return (
    request.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    request.headers["x-real-ip"] ||
    request.socket?.remoteAddress ||
    "0.0.0.0"
  );
}

function isRateLimited(ip) {
  const now = Date.now();
  const previous = rateByIp.get(ip) ?? [];
  const current = previous.filter((entry) => now - entry < RATE_WINDOW_MS);

  if (current.length >= RATE_MAX_REQUESTS) {
    rateByIp.set(ip, current);
    return true;
  }

  current.push(now);
  rateByIp.set(ip, current);
  return false;
}

function json(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(JSON.stringify(payload));
}

async function loadStore() {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.polls && typeof parsed.polls === "object") {
      cache = {
        polls: Object.fromEntries(
          Object.entries(parsed.polls).map(([matchId, poll]) => [
            matchId,
            {
              matchId: String(poll?.matchId ?? matchId),
              counts: {
                home: safeNumber(poll?.counts?.home),
                draw: safeNumber(poll?.counts?.draw),
                away: safeNumber(poll?.counts?.away),
              },
              votesByClient:
                poll?.votesByClient && typeof poll.votesByClient === "object" ? poll.votesByClient : {},
              history: Array.isArray(poll?.history) ? poll.history : [],
              lastUpdated:
                typeof poll?.lastUpdated === "string" && poll.lastUpdated ? poll.lastUpdated : nowIso(),
            },
          ])
        ),
      };
    }
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.warn("[poll-api] Failed to load store:", error.message);
    }
  }
}

async function persistStore() {
  await mkdir(DATA_DIR, { recursive: true });
  const payload = JSON.stringify(cache, null, 2);
  await writeFile(DATA_FILE, payload, "utf8");
}

function schedulePersist() {
  saveChain = saveChain
    .then(() => persistStore())
    .catch((error) => {
      console.warn("[poll-api] Failed to persist store:", error.message);
    });
  return saveChain;
}

function parseBody(request) {
  return new Promise((resolve) => {
    let buffer = "";
    request.on("data", (chunk) => {
      buffer += chunk;
    });
    request.on("end", () => {
      if (!buffer) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(buffer));
      } catch {
        resolve({});
      }
    });
  });
}

function toResult(matchId, poll, clientId = "") {
  const counts = {
    home: safeNumber(poll.counts.home),
    draw: safeNumber(poll.counts.draw),
    away: safeNumber(poll.counts.away),
  };
  const total = counts.home + counts.draw + counts.away;
  const myVote = clientId ? poll.votesByClient[clientId] ?? null : null;

  return {
    matchId: Number(matchId),
    counts,
    total,
    lastUpdated: poll.lastUpdated,
    history: poll.history.slice(-8).reverse(),
    myVote,
  };
}

async function handleVote(request, response, matchId) {
  const body = await parseBody(request);
  const choice = String(body.choice ?? "").toLowerCase();
  const clientId = String(body.clientId ?? "").trim();

  if (!clientId || clientId.length < 8) {
    return json(response, 400, { message: "clientId invalido" });
  }

  if (!CHOICES.has(choice)) {
    return json(response, 400, { message: "choice invalido" });
  }

  const poll = ensurePoll(matchId);
  const previous = poll.votesByClient[clientId];
  if (previous && CHOICES.has(previous.choice)) {
    poll.counts[previous.choice] = Math.max(0, safeNumber(poll.counts[previous.choice]) - 1);
  }

  const createdAt = nowIso();
  poll.votesByClient[clientId] = {
    choice,
    createdAt,
    clientId,
    matchId: Number(matchId),
  };
  poll.counts[choice] = safeNumber(poll.counts[choice]) + 1;
  poll.lastUpdated = createdAt;
  poll.history.push({
    type: "vote",
    clientId,
    choice,
    createdAt,
  });
  poll.history = poll.history.slice(-200);

  await schedulePersist();
  return json(response, 200, {
    ok: true,
    message: "Voto registrado",
    ...toResult(matchId, poll, clientId),
  });
}

async function handleClear(request, response, matchId) {
  const body = await parseBody(request);
  const clientId = String(body.clientId ?? "").trim();

  if (!clientId) {
    return json(response, 400, { message: "clientId obrigatorio" });
  }

  const poll = ensurePoll(matchId);
  const previous = poll.votesByClient[clientId];
  if (previous && CHOICES.has(previous.choice)) {
    poll.counts[previous.choice] = Math.max(0, safeNumber(poll.counts[previous.choice]) - 1);
  }

  delete poll.votesByClient[clientId];
  const clearedAt = nowIso();
  poll.lastUpdated = clearedAt;
  poll.history.push({
    type: "clear",
    clientId,
    clearedAt,
  });
  poll.history = poll.history.slice(-200);

  await schedulePersist();
  return json(response, 200, {
    ok: true,
    message: "Voto removido",
    ...toResult(matchId, poll, clientId),
  });
}

async function handleResults(response, matchId, clientId) {
  const poll = ensurePoll(matchId);
  return json(response, 200, toResult(matchId, poll, clientId));
}

function sendNotFound(response) {
  json(response, 404, { message: "Rota nao encontrada" });
}

const server = http.createServer(async (request, response) => {
  const method = request.method ?? "GET";
  const url = new URL(request.url ?? "/", "http://localhost");
  const parts = url.pathname.split("/").filter(Boolean);

  if (method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end();
    return;
  }

  if (parts[0] !== "api" || parts[1] !== "polls" || parts.length < 4) {
    sendNotFound(response);
    return;
  }

  const matchId = sanitizeMatchId(parts[2]);
  const action = parts[3];
  const clientId = String(url.searchParams.get("clientId") ?? "").trim();
  const ip = getIp(request);

  if (!matchId || !["vote", "results"].includes(action)) {
    sendNotFound(response);
    return;
  }

  if (isRateLimited(ip)) {
    json(response, 429, { message: "Rate limit excedido. Tente novamente." });
    return;
  }

  try {
    if (method === "GET" && action === "results") {
      await handleResults(response, matchId, clientId);
      return;
    }

    if (method === "POST" && action === "vote") {
      await handleVote(request, response, matchId);
      return;
    }

    if (method === "DELETE" && action === "vote") {
      await handleClear(request, response, matchId);
      return;
    }

    json(response, 405, { message: "Metodo nao permitido" });
  } catch (error) {
    console.error("[poll-api] Unhandled error:", error);
    json(response, 500, { message: "Falha interna na API de votos" });
  }
});

await loadStore();

server.listen(PORT, () => {
  console.log(`[poll-api] listening on http://127.0.0.1:${PORT}`);
});

// Exemplo serverless (Node.js) para Vercel/Netlify com store em memoria (dev).
// Endpoints esperados:
// POST   /polls/:matchId/vote
// DELETE /polls/:matchId/vote
// GET    /polls/:matchId/results

const polls = new Map();
const rateByIp = new Map();

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX_REQUESTS = 20;
const CHOICES = new Set(["home", "draw", "away"]);

function nowIso() {
  return new Date().toISOString();
}

function json(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
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

function getPoll(matchId) {
  if (!polls.has(matchId)) {
    polls.set(matchId, {
      counts: { home: 0, draw: 0, away: 0 },
      votesByClient: new Map(),
      history: [],
      lastUpdated: nowIso(),
    });
  }
  return polls.get(matchId);
}

function sanitizeMatchId(raw) {
  const matchId = String(raw ?? "").trim();
  if (!/^\d+$/.test(matchId)) {
    return null;
  }
  return matchId;
}

async function parseBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  return new Promise((resolve) => {
    let buffer = "";
    request.on("data", (chunk) => {
      buffer += chunk;
    });
    request.on("end", () => {
      try {
        resolve(buffer ? JSON.parse(buffer) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function toResult(matchId, poll) {
  const total = poll.counts.home + poll.counts.draw + poll.counts.away;
  return {
    matchId: Number(matchId),
    counts: poll.counts,
    total,
    lastUpdated: poll.lastUpdated,
    history: poll.history.slice(-8).reverse(),
  };
}

module.exports = async function handler(request, response) {
  const method = request.method;
  const path = request.url || "";

  const parts = path.split("/").filter(Boolean);
  const matchId = sanitizeMatchId(parts[parts.length - 2]);
  const action = parts[parts.length - 1];

  if (!matchId || !["vote", "results"].includes(action)) {
    return json(response, 404, { message: "Rota nao encontrada" });
  }

  const ip = getIp(request);
  if (isRateLimited(ip)) {
    return json(response, 429, { message: "Rate limit excedido. Tente novamente." });
  }

  const poll = getPoll(matchId);

  if (method === "GET" && action === "results") {
    return json(response, 200, toResult(matchId, poll));
  }

  if (method === "POST" && action === "vote") {
    const body = await parseBody(request);
    const choice = String(body.choice ?? "").toLowerCase();
    const clientId = String(body.clientId ?? "").trim();

    if (!clientId || clientId.length < 8) {
      return json(response, 400, { message: "clientId invalido" });
    }

    if (!CHOICES.has(choice)) {
      return json(response, 400, { message: "choice invalido" });
    }

    const previous = poll.votesByClient.get(clientId);
    if (previous && CHOICES.has(previous.choice)) {
      poll.counts[previous.choice] = Math.max(0, poll.counts[previous.choice] - 1);
    }

    poll.votesByClient.set(clientId, {
      choice,
      createdAt: nowIso(),
    });

    poll.counts[choice] += 1;
    poll.lastUpdated = nowIso();
    poll.history.push({
      clientId,
      choice,
      createdAt: poll.lastUpdated,
      type: "vote",
    });
    poll.history = poll.history.slice(-200);

    return json(response, 200, {
      ok: true,
      message: "Voto registrado",
      ...toResult(matchId, poll),
    });
  }

  if (method === "DELETE" && action === "vote") {
    const body = await parseBody(request);
    const clientId = String(body.clientId ?? "").trim();

    if (!clientId) {
      return json(response, 400, { message: "clientId obrigatorio" });
    }

    const previous = poll.votesByClient.get(clientId);
    if (previous && CHOICES.has(previous.choice)) {
      poll.counts[previous.choice] = Math.max(0, poll.counts[previous.choice] - 1);
    }

    poll.votesByClient.delete(clientId);
    poll.lastUpdated = nowIso();
    poll.history.push({
      clientId,
      type: "clear",
      clearedAt: poll.lastUpdated,
    });
    poll.history = poll.history.slice(-200);

    return json(response, 200, {
      ok: true,
      message: "Voto removido",
      ...toResult(matchId, poll),
    });
  }

  return json(response, 405, { message: "Metodo nao permitido" });
};

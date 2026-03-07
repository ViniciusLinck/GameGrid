import localforage from "localforage";

const pollStore = localforage.createInstance({
  name: "gamegrid",
  storeName: "poll_votes",
  description: "Armazenamento local da pesquisa de torcida",
});

const VOTE_PREFIX = "poll_vote:";
const HISTORY_PREFIX = "poll_history:";
const CLIENT_ID_KEY = "gamegrid_poll_client_id";

function voteKey(matchId) {
  return `${VOTE_PREFIX}${String(matchId)}`;
}

function historyKey(matchId) {
  return `${HISTORY_PREFIX}${String(matchId)}`;
}

function fallbackUuid() {
  return `cid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export function getClientId() {
  const existing = localStorage.getItem(CLIENT_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = globalThis.crypto?.randomUUID?.() ?? fallbackUuid();
  localStorage.setItem(CLIENT_ID_KEY, next);
  return next;
}

export async function getPollVote(matchId) {
  return (await pollStore.getItem(voteKey(matchId))) ?? null;
}

export async function getPollHistory(matchId, limit = 8) {
  const data = (await pollStore.getItem(historyKey(matchId))) ?? [];
  if (!Array.isArray(data)) {
    return [];
  }
  return data.slice(-limit).reverse();
}

async function appendPollHistory(matchId, entry) {
  const key = historyKey(matchId);
  const current = (await pollStore.getItem(key)) ?? [];
  const next = [...current, entry].slice(-60);
  await pollStore.setItem(key, next);
}

export async function savePollVote(matchId, choice) {
  const vote = {
    matchId: Number(matchId),
    choice,
    createdAt: new Date().toISOString(),
    clientId: getClientId(),
  };

  await pollStore.setItem(voteKey(matchId), vote);
  await appendPollHistory(matchId, {
    ...vote,
    type: "vote",
  });

  return vote;
}

export async function clearPollVote(matchId) {
  const current = await getPollVote(matchId);
  await pollStore.removeItem(voteKey(matchId));

  if (current) {
    await appendPollHistory(matchId, {
      ...current,
      type: "clear",
      clearedAt: new Date().toISOString(),
    });
  }

  return true;
}

export async function getPollLocalSnapshot(matchId) {
  const vote = await getPollVote(matchId);
  const history = await getPollHistory(matchId);

  const counts = {
    home: vote?.choice === "home" ? 1 : 0,
    draw: vote?.choice === "draw" ? 1 : 0,
    away: vote?.choice === "away" ? 1 : 0,
  };

  return {
    vote,
    history,
    counts,
    total: vote ? 1 : 0,
    lastUpdated: vote?.createdAt ?? null,
  };
}

export async function getAllLocalVotes() {
  const result = [];

  await pollStore.iterate((value, key) => {
    if (!key.startsWith(VOTE_PREFIX)) {
      return;
    }
    if (value?.matchId && value?.choice) {
      result.push(value);
    }
  });

  return result;
}

export async function migrateLocalVotesToRemote(postVoteFn) {
  const votes = await getAllLocalVotes();
  const report = {
    total: votes.length,
    sent: 0,
    failed: 0,
  };

  for (const vote of votes) {
    try {
      await postVoteFn(vote.matchId, vote.choice, vote.clientId);
      report.sent += 1;
    } catch {
      report.failed += 1;
    }
  }

  return report;
}

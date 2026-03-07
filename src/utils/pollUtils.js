export const POLL_CHOICES = ["home", "draw", "away"];

export function formatPollResult(counts = { home: 0, draw: 0, away: 0 }) {
  const safe = {
    home: Number(counts.home ?? 0),
    draw: Number(counts.draw ?? 0),
    away: Number(counts.away ?? 0),
  };

  const total = safe.home + safe.draw + safe.away;
  if (total <= 0) {
    return {
      counts: safe,
      total: 0,
      percentages: { home: 0, draw: 0, away: 0 },
      winner: null,
    };
  }

  const percentages = {
    home: Math.round((safe.home / total) * 100),
    draw: Math.round((safe.draw / total) * 100),
    away: Math.round((safe.away / total) * 100),
  };

  const winner = POLL_CHOICES.reduce((best, current) => {
    if (!best) return current;
    return safe[current] > safe[best] ? current : best;
  }, null);

  return {
    counts: safe,
    total,
    percentages,
    winner,
  };
}

export function pluralizeVotes(total, lang = "pt") {
  if (lang === "en") {
    return total === 1 ? "vote" : "votes";
  }
  if (lang === "es") {
    return total === 1 ? "voto" : "votos";
  }
  return total === 1 ? "voto" : "votos";
}

export function isPollLocked(startsAtUtc, autoLockAfterEnd = true) {
  if (!autoLockAfterEnd || !startsAtUtc) {
    return false;
  }

  const start = new Date(startsAtUtc).getTime();
  if (Number.isNaN(start)) {
    return false;
  }

  const estimatedEnd = start + 2 * 60 * 60 * 1000;
  return Date.now() > estimatedEnd;
}

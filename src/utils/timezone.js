function safeDate(date, time = "00:00") {
  const raw = `${date}T${time}:00`;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function detectUserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

export function formatMatchTimeToUserZone(date, time, locale = "pt-BR") {
  const parsed = safeDate(date, time);
  if (!parsed) {
    return {
      dateLabel: "Data invalida",
      timeLabel: "--:--",
      timeZone: detectUserTimeZone(),
      iso: "",
    };
  }

  const timeZone = detectUserTimeZone();
  const dateLabel = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).format(parsed);

  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone,
  }).format(parsed);

  return {
    dateLabel,
    timeLabel,
    timeZone,
    iso: parsed.toISOString(),
  };
}

export function matchStatusLabel(status) {
  const normalized = (status ?? "").toLowerCase();
  if (normalized.includes("live") || normalized.includes("ao vivo")) return "ao vivo";
  if (normalized.includes("final") || normalized.includes("post")) return "finalizado";
  return "agendado";
}

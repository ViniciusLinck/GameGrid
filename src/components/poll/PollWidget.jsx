import { useMemo, useRef, useState } from "react";
import { getFlagByTeamName } from "../../utils/flags";
import { usePollLocal } from "../../hooks/usePollLocal";
import { usePollRemote } from "../../hooks/usePollRemote";
import { buildMapsUrlFromVenue } from "../../services/mapsHelper";
import { getPollText } from "../../data/pollText";
import { isPollLocked } from "../../utils/pollUtils";
import PollResults from "./PollResults";

function toLocale(lang) {
  if (lang === "pt") return "pt-BR";
  if (lang === "es") return "es-ES";
  return "en-US";
}

function optionLabel(choice, homeName, awayName, t) {
  if (choice === "home") return homeName;
  if (choice === "away") return awayName;
  return t.draw;
}

function shareText(choice, homeName, awayName, gameUrl, lang, t) {
  const selected = optionLabel(choice, homeName, awayName, t);

  if (lang === "en") {
    return `My prediction: ${selected}. ${homeName} x ${awayName} ${gameUrl}`;
  }
  if (lang === "es") {
    return `Mi pronostico: ${selected}. ${homeName} vs ${awayName} ${gameUrl}`;
  }
  return `Eu acho que ${selected} vence: ${homeName} x ${awayName} ${gameUrl}`;
}

export default function PollWidget({
  matchId,
  homeName,
  awayName,
  startsAtUtc,
  venue,
  mode = "local",
  lang = "pt",
  autoLockAfterEnd = true,
}) {
  const t = getPollText(lang);
  const [pulseChoice, setPulseChoice] = useState("");
  const optionRefs = useRef([]);

  const local = usePollLocal(matchId);
  const remote = usePollRemote(matchId, {
    startsAtUtc,
    enabled: mode === "remote",
  });

  const isRemoteActive = mode === "remote" && remote.enabled;
  const poll = isRemoteActive ? remote : local;
  const locked = isPollLocked(startsAtUtc, autoLockAfterEnd);

  const voteDateText = useMemo(() => {
    if (!poll.vote?.createdAt) {
      return "";
    }
    return new Date(poll.vote.createdAt).toLocaleString(toLocale(lang));
  }, [poll.vote, lang]);

  const gameUrl = `${window.location.origin}${window.location.pathname}#match-${matchId}`;
  const mapUrl = buildMapsUrlFromVenue(venue);

  const handleVote = async (choice) => {
    if (locked || poll.isSaving) {
      return;
    }

    await poll.voteChoice(choice);
    setPulseChoice(choice);
    window.setTimeout(() => setPulseChoice(""), 260);
  };

  const handleClear = async () => {
    if (poll.isSaving) {
      return;
    }
    await poll.clearVote();
  };

  const moveFocus = (index, direction) => {
    const length = optionRefs.current.length;
    if (!length) return;
    const nextIndex = (index + direction + length) % length;
    optionRefs.current[nextIndex]?.focus();
  };

  const options = [
    { id: "home", label: homeName, icon: getFlagByTeamName(homeName) },
    { id: "draw", label: t.draw, icon: null },
    { id: "away", label: awayName, icon: getFlagByTeamName(awayName) },
  ];

  return (
    <section
      className="mt-3 rounded-xl border border-[#6aaeff42] bg-[#081427d6] p-3"
      aria-label={t.title}
      data-match-id={matchId}
    >
      <header className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-[#f5f9ff]">{t.title}</h4>
          <p className="text-[11px] text-ink-300">
            {isRemoteActive ? t.subtitleRemote : t.subtitleLocal}
          </p>
        </div>
        {locked ? <span className="text-[11px] text-[#ffd98a]">{t.locked}</span> : null}
      </header>

      {poll.isLoading ? <p className="text-xs text-ink-300">{t.loading}</p> : null}

      {!poll.isLoading ? (
        <div className="space-y-3">
          <div
            role="radiogroup"
            aria-label={t.title}
            className="grid grid-cols-1 gap-2 sm:grid-cols-3"
          >
            {options.map((option, index) => {
              const selected = poll.vote?.choice === option.id;
              const pulse = pulseChoice === option.id;

              return (
                <button
                  key={option.id}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`${t.vote} ${option.label}`}
                  onClick={() => handleVote(option.id)}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowRight") {
                      event.preventDefault();
                      moveFocus(index, 1);
                    }
                    if (event.key === "ArrowLeft") {
                      event.preventDefault();
                      moveFocus(index, -1);
                    }
                  }}
                  disabled={locked || poll.isSaving}
                  className={`min-h-[66px] rounded-lg border px-2 py-2 text-xs transition-transform duration-200 ${
                    selected
                      ? "border-[#ffd06190] bg-[#1a2d52] text-white"
                      : "border-[#ffffff20] bg-[#0f1e3ad6] text-ink-300"
                  } ${pulse ? "scale-95" : "scale-100"}`}
                >
                  <span className="mb-1 flex items-center justify-center">
                    {option.icon ? (
                      <img
                        src={option.icon}
                        alt=""
                        className="h-6 w-6 rounded-full border border-[#ffffff30] object-cover"
                      />
                    ) : (
                      <span aria-hidden="true" className="text-base">
                        =
                      </span>
                    )}
                  </span>
                  <span>{option.label}</span>
                </button>
              );
            })}
          </div>

          {poll.vote ? (
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-300">
              <span>{t.voted}</span>
              {voteDateText ? (
                <span>
                  {t.lastVoteAt}: {voteDateText}
                </span>
              ) : null}
              <button
                type="button"
                className="rounded-full border border-[#ffffff30] px-2 py-1"
                onClick={handleClear}
                disabled={poll.isSaving}
              >
                {t.clearVote}
              </button>
            </div>
          ) : null}

          <PollResults
            homeName={homeName}
            awayName={awayName}
            result={poll.result}
            history={poll.history}
            lang={lang}
          />

          {poll.result?.total === 0 ? <p className="text-xs text-ink-400">{t.noData}</p> : null}

          {!navigator.onLine ? <p className="text-xs text-[#ffd98a]">{t.offline}</p> : null}
          {poll.isRateLimited ? <p className="text-xs text-[#ff9db0]">{t.rateLimit}</p> : null}

          <div className="flex flex-wrap gap-2 text-xs">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                shareText(poll.vote?.choice ?? "draw", homeName, awayName, gameUrl, lang, t)
              )}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[#25d36680] px-2 py-1 text-[#b9f5ce] no-underline"
            >
              {t.whatsApp}
            </a>
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                shareText(poll.vote?.choice ?? "draw", homeName, awayName, gameUrl, lang, t)
              )}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[#8dcfff5e] px-2 py-1 text-[#d3e8ff] no-underline"
            >
              {t.twitter}
            </a>
            <a
              href={mapUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-[#8dcfff5e] px-2 py-1 text-[#d3e8ff] no-underline"
            >
              Mapa estadio
            </a>
          </div>
        </div>
      ) : null}

      {poll.error ? (
        <p role="status" className="mt-2 text-xs text-[#ff9db0]">
          {poll.error.message}
        </p>
      ) : null}
    </section>
  );
}

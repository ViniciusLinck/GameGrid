import { useEffect, useMemo, useState } from "react";

function getRemaining(targetIso) {
  const diff = new Date(targetIso).getTime() - Date.now();
  const clamped = Math.max(diff, 0);

  const seconds = Math.floor(clamped / 1000) % 60;
  const minutes = Math.floor(clamped / (1000 * 60)) % 60;
  const hours = Math.floor(clamped / (1000 * 60 * 60)) % 24;
  const days = Math.floor(clamped / (1000 * 60 * 60 * 24));

  return { diff: clamped, days, hours, minutes, seconds };
}

export default function Countdown({ targetIso, label = "Proximo jogo", onComplete }) {
  const [remaining, setRemaining] = useState(() => getRemaining(targetIso));

  useEffect(() => {
    setRemaining(getRemaining(targetIso));

    const timerId = window.setInterval(() => {
      setRemaining((current) => {
        const next = getRemaining(targetIso);
        if (next.diff === 0 && current.diff !== 0) {
          onComplete?.();
        }
        return next;
      });
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [targetIso, onComplete]);

  const values = useMemo(
    () => [
      { id: "d", label: "dias", value: remaining.days },
      { id: "h", label: "horas", value: remaining.hours },
      { id: "m", label: "min", value: remaining.minutes },
      { id: "s", label: "seg", value: remaining.seconds },
    ],
    [remaining]
  );

  return (
    <section className="rounded-xl border border-[#73b8ff42] bg-[#070d1dd1] p-4 text-center">
      <p className="text-sm text-ink-300">{label}</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {values.map((item) => (
          <div key={item.id} className="rounded-lg border border-[#6aaeff42] bg-[#0d1e39c9] p-2">
            <strong className="block text-xl text-[#f5f9ff]">{String(item.value).padStart(2, "0")}</strong>
            <span className="text-xs text-ink-300">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

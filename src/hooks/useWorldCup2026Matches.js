import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { fetchWorldCupMatches2026 } from "../services/worldCupApi";

export function useWorldCup2026Matches() {
  const { apiLanguage } = useLanguage();
  const [matches, setMatches] = useState([]);
  const [sourceLabel, setSourceLabel] = useState("local");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadMatches = ({ force = false } = {}) => {
      if (!force && (document.hidden || !navigator.onLine)) {
        return;
      }

      setIsLoading(true);
      fetchWorldCupMatches2026(apiLanguage)
        .then((result) => {
          if (!mounted) return;
          setMatches(result.matches);
          setSourceLabel(result.sourceLabel ?? "local");
          setError(null);
        })
        .catch((loadError) => {
          if (!mounted) return;
          setError(loadError);
        })
        .finally(() => {
          if (mounted) {
            setIsLoading(false);
          }
        });
    };

    loadMatches({ force: true });

    const intervalId = window.setInterval(loadMatches, 60_000);
    const onVisibility = () => {
      if (!document.hidden) {
        loadMatches({ force: true });
      }
    };
    const onOnline = () => loadMatches({ force: true });

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("online", onOnline);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("online", onOnline);
    };
  }, [apiLanguage]);

  return { matches, sourceLabel, isLoading, error };
}

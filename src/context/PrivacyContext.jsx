import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  clearAllStoredData,
  readPrivacyPreferences,
  writePrivacyPreferences,
} from "../services/privacyStorage";

const PrivacyContext = createContext(null);

export function PrivacyProvider({ children }) {
  const [preferences, setPreferences] = useState(readPrivacyPreferences);

  useEffect(() => {
    const sync = () => setPreferences(readPrivacyPreferences());
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  const value = useMemo(
    () => ({
      preferences,
      acknowledgePrivacy: () => {
        const next = writePrivacyPreferences({
          ...preferences,
          acknowledged: true,
        });
        setPreferences(next);
      },
      setAllowRemotePoll: (allowRemotePoll) => {
        const next = writePrivacyPreferences({
          ...preferences,
          acknowledged: true,
          allowRemotePoll,
        });
        setPreferences(next);
      },
      clearLocalData: async () => {
        await clearAllStoredData();
        setPreferences(readPrivacyPreferences());
      },
    }),
    [preferences]
  );

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function usePrivacy() {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error("usePrivacy must be used within PrivacyProvider");
  }

  return context;
}

import { createContext, useContext } from "react";

export const BackgroundMoodContext = createContext({
  mood: "idle",
  setBackgroundMood: () => {},
});

export function useBackgroundMood() {
  return useContext(BackgroundMoodContext);
}

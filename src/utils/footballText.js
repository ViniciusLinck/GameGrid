import { getUiText } from "../data/uiText";

export function translatePosition(position, language) {
  const value = String(position ?? "").trim().toLowerCase();
  const text = getUiText(language);
  return text.common.positions[value] ?? position ?? text.common.positions.fallback;
}

export function translateBestFinish(bestFinish, language) {
  const text = getUiText(language);
  return text.common.bestFinish[bestFinish] ?? bestFinish ?? text.common.notAvailable;
}

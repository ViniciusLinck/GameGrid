const flagFiles = import.meta.glob("../../assets/*-bg.svg", {
  eager: true,
  import: "default",
});

const normalize = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const aliasToAssetName = {
  usa: "united states",
  us: "united states",
  "united states of america": "united states",
  "south korea": "south korea",
  "korea republic": "south korea",
  "republic of korea": "south korea",
  "north korea": "north korea",
  "korea dpr": "north korea",
  "ivory coast": "ivory coast",
  "cote divoire": "ivory coast",
  "u a e": "united arab emirates",
  uae: "united arab emirates",
  "czechia": "czech republic",
  "dr congo": "democratic republic of congo",
  "d r congo": "democratic republic of congo",
  "congo dr": "democratic republic of congo",
  "north macedonia": "republic of macedonia",
  "timor leste": "east timor",
  "bosnia herzegovina": "bosnia and herzegovina",
};

const flagsByCountry = new Map(
  Object.entries(flagFiles).map(([filePath, fileUrl]) => {
    const fileName = filePath.split("/").pop()?.replace("-bg.svg", "") ?? "";
    return [normalize(fileName), fileUrl];
  })
);

export function normalizeTeamName(name) {
  const normalized = normalize(name);
  return normalize(aliasToAssetName[normalized] ?? normalized);
}

export function getFlagByTeamName(teamName) {
  return flagsByCountry.get(normalizeTeamName(teamName)) ?? null;
}

const flagFiles = import.meta.glob("../../assets/*-bg.svg", {
  eager: true,
  import: "default",
});

export const normalizeText = (value = "") =>
  String(value)
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
  "estados unidos": "united states",
  "coreia do sul": "south korea",
  "coreia do norte": "north korea",
  suica: "switzerland",
  croacia: "croatia",
  gana: "ghana",
  "arabia saudita": "saudi arabia",
  polonia: "poland",
  japao: "japan",
  brasil: "brazil",
  dinamarca: "denmark",
  camaroes: "cameroon",
  eslovaquia: "slovakia",
  belgica: "belgium",
  argelia: "algeria",
  noruega: "norway",
  uruguai: "uruguay",
  alemanha: "germany",
  egito: "egypt",
  "pais de gales": "wales",
  "paises baixos": "netherlands",
  romenia: "romania",
  marrocos: "morocco",
  escocia: "scotland",
  paraguai: "paraguay",
  italia: "italy",
  catar: "qatar",
  franca: "france",
  turquia: "turkey",
  hungria: "hungary",
  equador: "ecuador",
  espanha: "spain",
  suecia: "sweden",
  "republica tcheca": "czech republic",
  inglaterra: "england",
  servia: "serbia",
  ucrania: "ukraine",
};

const flagsByCountry = new Map(
  Object.entries(flagFiles).map(([filePath, fileUrl]) => {
    const fileName = filePath.split("/").pop()?.replace("-bg.svg", "") ?? "";
    return [normalizeText(fileName), fileUrl];
  })
);

export function normalizeTeamName(name) {
  const normalized = normalizeText(name);
  return normalizeText(aliasToAssetName[normalized] ?? normalized);
}

export function getFlagByTeamName(teamName) {
  return flagsByCountry.get(normalizeTeamName(teamName)) ?? null;
}

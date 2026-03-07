const PERFIL_DESCONHECIDO = {
  worldCups: "N/D",
  bestFinish: "N/D",
  fifaRank: "N/D",
  last5WorldCups: ["-", "-", "-", "-", "-"],
};

const INFORMACOES_COPA = {
  argentina: { worldCups: 3, bestFinish: "Campeao", fifaRank: 1, last5WorldCups: ["C", "O", "FG", "F", "V"] },
  brazil: { worldCups: 5, bestFinish: "Campeao", fifaRank: 5, last5WorldCups: ["Q", "4", "Q", "Q", "Q"] },
  england: { worldCups: 1, bestFinish: "Campeao", fifaRank: 4, last5WorldCups: ["Q", "FG", "16", "4", "Q"] },
  france: { worldCups: 2, bestFinish: "Campeao", fifaRank: 2, last5WorldCups: ["V", "Q", "V", "16", "F"] },
  germany: { worldCups: 4, bestFinish: "Campeao", fifaRank: 16, last5WorldCups: ["3", "V", "FG", "FG", "FG"] },
  spain: { worldCups: 1, bestFinish: "Campeao", fifaRank: 8, last5WorldCups: ["V", "FG", "16", "16", "16"] },
  portugal: { worldCups: 0, bestFinish: "3o lugar", fifaRank: 7, last5WorldCups: ["16", "FG", "16", "16", "Q"] },
  netherlands: { worldCups: 0, bestFinish: "Vice-campeao", fifaRank: 6, last5WorldCups: ["F", "3", "FG", "NQ", "Q"] },
  belgium: { worldCups: 0, bestFinish: "3o lugar", fifaRank: 3, last5WorldCups: ["16", "Q", "Q", "3", "FG"] },
  uruguay: { worldCups: 2, bestFinish: "Campeao", fifaRank: 11, last5WorldCups: ["4", "4", "16", "Q", "FG"] },
  croatia: { worldCups: 0, bestFinish: "Vice-campeao", fifaRank: 9, last5WorldCups: ["FG", "3", "FG", "F", "3"] },
  denmark: { worldCups: 0, bestFinish: "Quartas", fifaRank: 21, last5WorldCups: ["FG", "NQ", "16", "NQ", "FG"] },
  poland: { worldCups: 0, bestFinish: "3o lugar", fifaRank: 28, last5WorldCups: ["FG", "FG", "NQ", "FG", "16"] },
  mexico: { worldCups: 0, bestFinish: "Quartas", fifaRank: 17, last5WorldCups: ["16", "16", "16", "16", "FG"] },
  "united states": { worldCups: 0, bestFinish: "3o lugar", fifaRank: 13, last5WorldCups: ["16", "FG", "NQ", "16", "16"] },
  canada: { worldCups: 0, bestFinish: "Fase de grupos", fifaRank: 49, last5WorldCups: ["NQ", "NQ", "NQ", "NQ", "FG"] },
  japan: { worldCups: 0, bestFinish: "Oitavas", fifaRank: 18, last5WorldCups: ["16", "16", "16", "16", "16"] },
  "south korea": { worldCups: 0, bestFinish: "4o lugar", fifaRank: 23, last5WorldCups: ["16", "FG", "FG", "FG", "16"] },
  switzerland: { worldCups: 0, bestFinish: "Quartas", fifaRank: 20, last5WorldCups: ["FG", "16", "16", "16", "16"] },
  serbia: { worldCups: 0, bestFinish: "4o lugar", fifaRank: 33, last5WorldCups: ["FG", "NQ", "FG", "FG", "FG"] },
  morocco: { worldCups: 0, bestFinish: "4o lugar", fifaRank: 12, last5WorldCups: ["FG", "FG", "FG", "FG", "4"] },
  qatar: { worldCups: 0, bestFinish: "Fase de grupos", fifaRank: 58, last5WorldCups: ["NQ", "NQ", "NQ", "NQ", "FG"] },
  ecuador: { worldCups: 0, bestFinish: "Oitavas", fifaRank: 31, last5WorldCups: ["FG", "NQ", "FG", "NQ", "FG"] },
};

const ALIAS_PARA_CHAVE = {
  brasil: "brazil",
  "estados unidos": "united states",
  "coreia do sul": "south korea",
  suica: "switzerland",
  croacia: "croatia",
  gana: "ghana",
  "arabia saudita": "saudi arabia",
  polonia: "poland",
  japao: "japan",
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

function normalize(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getWorldCupProfile(teamName) {
  const normalized = normalize(teamName);
  const key = normalize(ALIAS_PARA_CHAVE[normalized] ?? normalized);
  return INFORMACOES_COPA[key] ?? PERFIL_DESCONHECIDO;
}

const UNKNOWN_PROFILE = {
  worldCups: "N/A",
  bestFinish: "N/A",
  fifaRank: "N/A",
  last5WorldCups: ["-", "-", "-", "-", "-"],
};

const WORLD_CUP_INSIGHTS = {
  argentina: {
    worldCups: 3,
    bestFinish: "Campeão",
    fifaRank: 1,
    last5WorldCups: ["C", "O", "G", "F", "V"],
  },
  brazil: {
    worldCups: 5,
    bestFinish: "Campeão",
    fifaRank: 5,
    last5WorldCups: ["QF", "4", "QF", "QF", "QF"],
  },
  england: {
    worldCups: 1,
    bestFinish: "Campeão",
    fifaRank: 4,
    last5WorldCups: ["QF", "GS", "16", "4", "QF"],
  },
  france: {
    worldCups: 2,
    bestFinish: "Campeão",
    fifaRank: 2,
    last5WorldCups: ["V", "QF", "V", "16", "F"],
  },
  germany: {
    worldCups: 4,
    bestFinish: "Campeão",
    fifaRank: 16,
    last5WorldCups: ["3", "V", "GS", "GS", "GS"],
  },
  spain: {
    worldCups: 1,
    bestFinish: "Campeão",
    fifaRank: 8,
    last5WorldCups: ["V", "GS", "16", "16", "16"],
  },
  portugal: {
    worldCups: 0,
    bestFinish: "3º lugar",
    fifaRank: 7,
    last5WorldCups: ["16", "GS", "16", "16", "QF"],
  },
  netherlands: {
    worldCups: 0,
    bestFinish: "Vice-campeão",
    fifaRank: 6,
    last5WorldCups: ["F", "3", "GS", "DNQ", "QF"],
  },
  belgium: {
    worldCups: 0,
    bestFinish: "3º lugar",
    fifaRank: 3,
    last5WorldCups: ["16", "QF", "QF", "3", "GS"],
  },
  uruguay: {
    worldCups: 2,
    bestFinish: "Campeão",
    fifaRank: 11,
    last5WorldCups: ["4", "4", "16", "QF", "GS"],
  },
  croatia: {
    worldCups: 0,
    bestFinish: "Vice-campeão",
    fifaRank: 9,
    last5WorldCups: ["GS", "3", "GS", "F", "3"],
  },
  denmark: {
    worldCups: 0,
    bestFinish: "Quartas",
    fifaRank: 21,
    last5WorldCups: ["GS", "DNQ", "16", "DNQ", "GS"],
  },
  poland: {
    worldCups: 0,
    bestFinish: "3º lugar",
    fifaRank: 28,
    last5WorldCups: ["GS", "GS", "DNQ", "GS", "16"],
  },
  mexico: {
    worldCups: 0,
    bestFinish: "Quartas",
    fifaRank: 17,
    last5WorldCups: ["16", "16", "16", "16", "GS"],
  },
  "united states": {
    worldCups: 0,
    bestFinish: "3º lugar",
    fifaRank: 13,
    last5WorldCups: ["16", "GS", "DNQ", "16", "16"],
  },
  canada: {
    worldCups: 0,
    bestFinish: "GS",
    fifaRank: 49,
    last5WorldCups: ["DNQ", "DNQ", "DNQ", "DNQ", "GS"],
  },
  japan: {
    worldCups: 0,
    bestFinish: "16 avos",
    fifaRank: 18,
    last5WorldCups: ["16", "16", "16", "16", "16"],
  },
  "south korea": {
    worldCups: 0,
    bestFinish: "4º lugar",
    fifaRank: 23,
    last5WorldCups: ["16", "GS", "GS", "GS", "16"],
  },
  switzerland: {
    worldCups: 0,
    bestFinish: "Quartas",
    fifaRank: 20,
    last5WorldCups: ["GS", "16", "16", "16", "16"],
  },
  serbia: {
    worldCups: 0,
    bestFinish: "4º lugar",
    fifaRank: 33,
    last5WorldCups: ["GS", "DNQ", "GS", "GS", "GS"],
  },
  morocco: {
    worldCups: 0,
    bestFinish: "4º lugar",
    fifaRank: 12,
    last5WorldCups: ["GS", "GS", "GS", "GS", "4"],
  },
  qatar: {
    worldCups: 0,
    bestFinish: "GS",
    fifaRank: 58,
    last5WorldCups: ["DNQ", "DNQ", "DNQ", "DNQ", "GS"],
  },
  ecuador: {
    worldCups: 0,
    bestFinish: "16 avos",
    fifaRank: 31,
    last5WorldCups: ["GS", "DNQ", "GS", "DNQ", "GS"],
  },
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
  return WORLD_CUP_INSIGHTS[normalize(teamName)] ?? UNKNOWN_PROFILE;
}

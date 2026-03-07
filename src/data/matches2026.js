const hostVenues = [
  { city: "Mexico City", stadium: "Estadio Azteca" },
  { city: "Guadalajara", stadium: "Estadio Akron" },
  { city: "Monterrey", stadium: "Estadio BBVA" },
  { city: "Vancouver", stadium: "BC Place" },
  { city: "Toronto", stadium: "BMO Field" },
  { city: "Seattle", stadium: "Lumen Field" },
  { city: "San Francisco Bay Area", stadium: "Levi's Stadium" },
  { city: "Los Angeles", stadium: "SoFi Stadium" },
  { city: "Dallas", stadium: "AT&T Stadium" },
  { city: "Houston", stadium: "NRG Stadium" },
  { city: "Kansas City", stadium: "Arrowhead Stadium" },
  { city: "Atlanta", stadium: "Mercedes-Benz Stadium" },
  { city: "Miami", stadium: "Hard Rock Stadium" },
  { city: "Boston", stadium: "Gillette Stadium" },
  { city: "Philadelphia", stadium: "Lincoln Financial Field" },
  { city: "New York New Jersey", stadium: "MetLife Stadium" },
];

const kickoffSlots = ["13:00", "16:00", "19:00", "22:00"];
const groupOrder = "ABCDEFGHIJKL".split("");
const groupPairMatrix = [
  [1, 2],
  [3, 4],
  [1, 3],
  [2, 4],
  [1, 4],
  [2, 3],
];

const groupTeams = {
  A: ["Mexico", "Suica", "Senegal", "Coreia do Sul"],
  B: ["Canada", "Croacia", "Gana", "Arabia Saudita"],
  C: ["Estados Unidos", "Polonia", "Tunisia", "Japao"],
  D: ["Brasil", "Dinamarca", "Camaroes", "Eslovaquia"],
  E: ["Argentina", "Belgica", "Argelia", "Noruega"],
  F: ["Uruguai", "Alemanha", "Egito", "Pais de Gales"],
  G: ["Colombia", "Paises Baixos", "Nigeria", "Romenia"],
  H: ["Chile", "Portugal", "Marrocos", "Escocia"],
  I: ["Paraguai", "Italia", "Catar", "Austria"],
  J: ["Peru", "Franca", "Turquia", "Hungria"],
  K: ["Equador", "Espanha", "Suecia", "Republica Tcheca"],
  L: ["Costa Rica", "Inglaterra", "Servia", "Ucrania"],
};

const stagePlan = [
  {
    label: "Fase de grupos",
    count: 72,
    startDate: "2026-06-11",
    spanInDays: 17,
    teamBuilder: (index) => {
      const groupLetter = groupOrder[Math.floor(index / 6)];
      const [homeSlot, awaySlot] = groupPairMatrix[index % 6];
      return [
        { name: groupTeams[groupLetter][homeSlot - 1] },
        { name: groupTeams[groupLetter][awaySlot - 1] },
      ];
    },
  },
  {
    label: "16 avos de final",
    count: 16,
    startDate: "2026-06-28",
    spanInDays: 6,
    teamBuilder: (index) => [
      { name: `Classificado ${index * 2 + 1}` },
      { name: `Classificado ${index * 2 + 2}` },
    ],
  },
  {
    label: "Oitavas de final",
    count: 8,
    startDate: "2026-07-04",
    spanInDays: 4,
    teamBuilder: (index) => [
      { name: `Vencedor Jogo ${73 + index * 2}` },
      { name: `Vencedor Jogo ${74 + index * 2}` },
    ],
  },
  {
    label: "Quartas de final",
    count: 4,
    startDate: "2026-07-09",
    spanInDays: 3,
    teamBuilder: (index) => [
      { name: `Vencedor Jogo ${89 + index * 2}` },
      { name: `Vencedor Jogo ${90 + index * 2}` },
    ],
  },
  {
    label: "Semifinal",
    count: 2,
    startDate: "2026-07-14",
    spanInDays: 2,
    teamBuilder: (index) => [
      { name: `Vencedor Jogo ${97 + index * 2}` },
      { name: `Vencedor Jogo ${98 + index * 2}` },
    ],
  },
  {
    label: "Disputa de 3º lugar",
    count: 1,
    startDate: "2026-07-18",
    spanInDays: 1,
    teamBuilder: () => [
      { name: "Perdedor da Semifinal 1" },
      { name: "Perdedor da Semifinal 2" },
    ],
  },
  {
    label: "Final",
    count: 1,
    startDate: "2026-07-19",
    spanInDays: 1,
    teamBuilder: () => [
      { name: "Vencedor da Semifinal 1" },
      { name: "Vencedor da Semifinal 2" },
    ],
  },
];

const fixedVenueByMatch = {
  1: { city: "Mexico City", stadium: "Estadio Azteca" },
  101: { city: "Dallas", stadium: "AT&T Stadium" },
  102: { city: "Atlanta", stadium: "Mercedes-Benz Stadium" },
  103: { city: "Miami", stadium: "Hard Rock Stadium" },
  104: { city: "New York New Jersey", stadium: "MetLife Stadium" },
};

function addDays(dateISO, days) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function spreadIndex(index, totalItems, totalDays) {
  if (totalItems <= 1 || totalDays <= 1) {
    return 0;
  }
  return Math.round((index * (totalDays - 1)) / (totalItems - 1));
}

function buildMatches() {
  let matchNumber = 1;
  const matches = [];

  for (const stage of stagePlan) {
    for (let index = 0; index < stage.count; index += 1) {
      const dayOffset = spreadIndex(index, stage.count, stage.spanInDays);
      const defaultVenue = hostVenues[(matchNumber - 1) % hostVenues.length];
      const [homeTeam, awayTeam] = stage.teamBuilder(index);

      matches.push({
        id: matchNumber,
        stage: stage.label,
        date: addDays(stage.startDate, dayOffset),
        kickoff: kickoffSlots[(matchNumber - 1) % kickoffSlots.length],
        venue: fixedVenueByMatch[matchNumber] ?? defaultVenue,
        homeTeam,
        awayTeam,
      });

      matchNumber += 1;
    }
  }

  return matches;
}

export const FALLBACK_MATCHES_2026 = buildMatches();

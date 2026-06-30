import { normalizeTeamName } from "../utils/flags";

const CAZETV_STREAMS_URL = "https://www.youtube.com/@CazeTV/streams";

const streamTeamAliases = {
  bosnia: "bosnia and herzegovina",
  "costa do marfim": "ivory coast",
  "holland": "netherlands",
  "holanda": "netherlands",
  tchequia: "czech republic",
};

const MATCH_LIVE_VIDEOS = [
  { home: "Colombia", away: "Ghana", videoId: "pgm5kUr6EVU" },
  { home: "Argentina", away: "Cape Verde", videoId: "hfenWvZ5HAU" },
  { home: "Australia", away: "Egypt", videoId: "OwVHSCdF37g" },
  { home: "Switzerland", away: "Algeria", videoId: "jzjZOLYj4oY" },
  { home: "Portugal", away: "Croatia", videoId: "jg4xEFUnFmk" },
  { home: "Spain", away: "Austria", videoId: "__xDLB2Pi0w" },
  { home: "United States", away: "Bosnia and Herzegovina", videoId: "CWo3HBSvQSg" },
  { home: "Belgium", away: "Senegal", videoId: "JAwz4EsvJEA" },
  { home: "England", away: "Democratic Republic of Congo", videoId: "aSXLerQStXA" },
  { home: "Mexico", away: "Ecuador", videoId: "9dmuI66We8A" },
  { home: "France", away: "Sweden", videoId: "4qbRFozLQhE" },
  { home: "Ivory Coast", away: "Norway", videoId: "-1LksEX-4Ig" },
  { home: "Netherlands", away: "Morocco", videoId: "XL2jTQdj134" },
  { home: "Germany", away: "Paraguay", videoId: "MMBZyJNGpL4" },
  { home: "South Africa", away: "Canada", videoId: "6L3aOGmPHic" },
  { home: "England", away: "Panama", videoId: "FDCM9HggRlM" },
  { home: "Argentina", away: "Jordan", videoId: "O-RMGDl9z5w" },
  { home: "Algeria", away: "Austria", videoId: "Q8peX8rkeD0" },
  { home: "Democratic Republic of Congo", away: "Uzbekistan", videoId: "QHHK06-b7aI" },
  { home: "Portugal", away: "Colombia", videoId: "gSd81XYvpsU" },
  { home: "Croatia", away: "Ghana", videoId: "mBZMegb2r90" },
  { home: "Belgium", away: "New Zealand", videoId: "5T7bTslW7oI" },
  { home: "Egypt", away: "Iran", videoId: "eeSdrrpKVlY" },
  { home: "Uruguay", away: "Spain", videoId: "d2OffmJxHbY" },
  { home: "Cape Verde", away: "Saudi Arabia", videoId: "7kdzXhc90xw" },
  { home: "Senegal", away: "Iraq", videoId: "VFF2tuap6mo" },
  { home: "Japan", away: "Sweden", videoId: "w5OVy9QPQd0" },
  { home: "Paraguay", away: "Australia", videoId: "GyNaOcqANX8" },
  { home: "Turkey", away: "United States", videoId: "cAl4PErpiuE" },
  { home: "Tunisia", away: "Netherlands", videoId: "meWCRh7LE-0" },
  { home: "Ivory Coast", away: "Curacao", videoId: "yiq5VPpo34U" },
  { home: "Czech Republic", away: "Mexico", videoId: "D0947hff-G0" },
  { home: "Haiti", away: "Morocco", videoId: "Cy-JKocMCf8" },
  { home: "Bosnia and Herzegovina", away: "Qatar", videoId: "YAa0XEHZCys" },
  { home: "Canada", away: "Switzerland", videoId: "fdD0fb4zDGQ" },
  { home: "Brazil", away: "Scotland", videoId: "dxYTTxhgVNU" },
  { home: "England", away: "Ghana", videoId: "f_ry63WszeQ" },
  { home: "France", away: "Iraq", videoId: "zE4W8SI8yns" },
  { home: "Uruguay", away: "Cape Verde", videoId: "X2ApOuNYmI0" },
  { home: "Belgium", away: "Iran", videoId: "EZmkiHr2eDE" },
  { home: "Ecuador", away: "Curacao", videoId: "Msb7i5PoXSA" },
  { home: "Germany", away: "Ivory Coast", videoId: "bSaANZAFIEI" },
  { home: "Scotland", away: "Morocco", videoId: "cpDw2AKZE2c" },
  { home: "Mexico", away: "South Korea", videoId: "jTTH_MrgnUk" },
  { home: "Canada", away: "Qatar", videoId: "1M374lj_XRo" },
  { home: "Uzbekistan", away: "Colombia", videoId: "rUaJfV-rPVQ" },
  { home: "Ghana", away: "Panama", videoId: "t7XBWsD5p6A" },
  { home: "Austria", away: "Jordan", videoId: "r97R-p-TlNM" },
  { home: "Argentina", away: "Algeria", videoId: "dnjRxKiN-Uk" },
  { home: "Iraq", away: "Norway", videoId: "Dgvz5nHdttk" },
  { home: "France", away: "Senegal", videoId: "m1vplAfSs_A" },
  { home: "Iran", away: "New Zealand", videoId: "vrY_cXwm--g" },
  { home: "Saudi Arabia", away: "Uruguay", videoId: "Mh-iBLsiYDw" },
  { home: "Belgium", away: "Egypt", videoId: "aclBHrhLQr4" },
  { home: "Spain", away: "Cape Verde", videoId: "EYStZQ5FsVk" },
  { home: "Sweden", away: "Tunisia", videoId: "o2wC007Jp-A" },
  { home: "Ivory Coast", away: "Ecuador", videoId: "IFh8Nuuhgcc" },
  { home: "Netherlands", away: "Japan", videoId: "6Ca_GzyVOs0" },
  { home: "Germany", away: "Curacao", videoId: "byP1peOCkzI" },
  { home: "Australia", away: "Turkey", videoId: "8rr-857IbHA" },
  { home: "Haiti", away: "Scotland", videoId: "yBUg81qhrNo" },
  { home: "Brazil", away: "Morocco", videoId: "vC3fV_awcWE" },
  { home: "Qatar", away: "Switzerland", videoId: "ljah6d9m7Z0" },
  { home: "United States", away: "Paraguay", videoId: "7EFTDmwcleI" },
  { home: "Canada", away: "Bosnia and Herzegovina", videoId: "CRtjePKnGvA" },
  { home: "South Korea", away: "Czech Republic", videoId: "LjEP9frJ2CE" },
];

function getStreamTeamKey(teamName) {
  const normalized = normalizeTeamName(teamName);
  return normalizeTeamName(streamTeamAliases[normalized] ?? normalized);
}

const liveVideoByMatchKey = new Map(
  MATCH_LIVE_VIDEOS.flatMap(({ home, away, videoId }) => {
    const forward = `${getStreamTeamKey(home)}|${getStreamTeamKey(away)}`;
    const reverse = `${getStreamTeamKey(away)}|${getStreamTeamKey(home)}`;
    return [
      [forward, videoId],
      [reverse, videoId],
    ];
  })
);

export function getCazetvWatchUrl(homeTeamName, awayTeamName) {
  const key = `${getStreamTeamKey(homeTeamName)}|${getStreamTeamKey(awayTeamName)}`;
  const videoId = liveVideoByMatchKey.get(key);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : CAZETV_STREAMS_URL;
}

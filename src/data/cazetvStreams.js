import { normalizeTeamName } from "../utils/flags";

const CAZETV_STREAMS_URL = "https://www.youtube.com/@CazeTV/streams";

const MATCH_LIVE_VIDEOS = [
  { home: "Mexico", away: "South Africa", videoId: "YCNysrewn7k" },
  { home: "Brazil", away: "Scotland", videoId: "dxYTTxhgVNU" },
  { home: "Brazil", away: "Haiti", videoId: "DUuWdi0r1RI" },
  { home: "Uzbekistan", away: "Colombia", videoId: "BWsf2c4zKZs" },
  { home: "Ghana", away: "Panama", videoId: "t7XBWsD5p6A" },
  { home: "England", away: "Croatia", videoId: "DaAFndjKuf8" },
  { home: "Portugal", away: "Democratic Republic of Congo", videoId: "HpzKFDctbNw" },
  { home: "Austria", away: "Jordan", videoId: "r97R-p-TlNM" },
  { home: "Argentina", away: "Algeria", videoId: "RhpNoBWVQGA" },
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

const liveVideoByMatchKey = new Map(
  MATCH_LIVE_VIDEOS.flatMap(({ home, away, videoId }) => {
    const forward = `${normalizeTeamName(home)}|${normalizeTeamName(away)}`;
    const reverse = `${normalizeTeamName(away)}|${normalizeTeamName(home)}`;
    return [
      [forward, videoId],
      [reverse, videoId],
    ];
  })
);

export function getCazetvWatchUrl(homeTeamName, awayTeamName) {
  const key = `${normalizeTeamName(homeTeamName)}|${normalizeTeamName(awayTeamName)}`;
  const videoId = liveVideoByMatchKey.get(key);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : CAZETV_STREAMS_URL;
}


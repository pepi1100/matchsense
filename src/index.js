const fs = require("fs");
const path = require("path");
const analyzeMatches = require("./analyzer");
const {
  saveAnalysis,
  getBestChampions,
  getOverallStats,
  getWinrateOverTime,
} = require("./db");




const {
  getSummoner,
  getMatchIdsByPUUID,
  getMatchDetails,
} = require("./riotclient");

const mode = process.argv[2];

// =====================
// RIOT MODE
// =====================
if (mode === "riot") {
  const summonerName = process.argv[3];

  if (!summonerName) {
    console.error("Usage: node src/index.js riot <summonerName>");
    process.exit(1);
  }

  (async () => {
    try {
      const summoner = await getSummoner(summonerName, "LAS");

      console.log("=== RIOT DATA ===");
      console.log(`Riot ID: ${summoner.gameName}#${summoner.tagLine}`);
      console.log(`Level: ${summoner.summonerLevel}`);

      const matchIds = await getMatchIdsByPUUID(summoner.puuid, 10);

      const firstMatchId = matchIds[0];
      const match = await getMatchDetails(firstMatchId);

      const player = match.info.participants.find(
        (p) => p.puuid === summoner.puuid,
      );

      const mappedMatches = [];

      for (const matchId of matchIds) {
        const match = await getMatchDetails(matchId);

        const player = match.info.participants.find(
          (p) => p.puuid === summoner.puuid,
        );

        if (!player) continue;

        mappedMatches.push({
          champion: player.championName,
          kills: player.kills,
          deaths: player.deaths,
          assists: player.assists,
          win: player.win,
        });
      }

      const analyzerInput = {
        summoner: `${summoner.gameName}#${summoner.tagLine}`,
        matches: mappedMatches,
      };

      console.log("\nLast matches:");
      matchIds.forEach((id, i) => {
        console.log(`${i + 1}. ${id}`);
      });

      console.log("\n=== LAST MATCH ===");
      console.log(`Game mode: ${match.info.gameMode}`);
      console.log(`Duration: ${Math.floor(match.info.gameDuration / 60)} min`);
      console.log(`Champion: ${player.championName}`);
      console.log(`KDA: ${player.kills}/${player.deaths}/${player.assists}`);
      console.log(`Win: ${player.win ? "Yes" : "No"}`);

      const analysis = analyzeMatches(analyzerInput);

      console.log("\n=== ANALYSIS (LAST 10 MATCHES) ===");
      console.log(`Matches analyzed: ${analysis.totalMatches}`);
      console.log(`Winrate: ${analysis.winrate}%`);
      console.log(
        `Avg KDA: ${analysis.avgKDA.kills}/${analysis.avgKDA.deaths}/${analysis.avgKDA.assists}`,
      );

      console.log("\n--- Performance by Champion ---");
      analysis.byChampion.forEach((champ) => {
        console.log(
          `${champ.champion}: ${champ.matches} games | WR ${champ.winrate}% | Avg KDA ${champ.kda}`,
        );
      });

      saveAnalysis(analysis);
      console.log("\nAnalysis saved to database.");
    } catch (err) {
      console.error(
        "Error fetching summoner:",
        err.response?.data || err.message,
      );
    }
  })();

  return;
}

// =====================
// STATS MODE
// =====================
if (mode === "stats") {
  console.log("=== HISTORICAL STATS ===\n");

  const overall = getOverallStats();
  console.log(
    `Overall Winrate: ${overall.winrate}%`
  );
  console.log(
    `Avg KDA: ${overall.kills}/${overall.deaths}/${overall.assists}\n`
  );

  console.log("--- Best Champions ---");
  const champs = getBestChampions(3);
  champs.forEach((c, i) => {
    console.log(
      `${i + 1}. ${c.champion} | Games: ${c.total_games} | WR: ${c.avg_winrate}%`
    );
  });

  return;
}

if (mode === "graph") {
  console.log("=== WINRATE OVER TIME ===\n");

  const data = getWinrateOverTime();

  data.forEach((row) => {
    const bars = "█".repeat(Math.round(row.winrate / 5));
    console.log(`${row.day} | ${bars} ${row.winrate}%`);
  });

  return;
}


// =====================
// FILE MODE
// =====================
const inputFile = process.argv[2];

if (!inputFile) {
  console.error("Usage: node src/index.js <path-to-match-file>");
  process.exit(1);
}

const filePath = path.resolve(inputFile);

if (!fs.existsSync(filePath)) {
  console.error("File not found:", filePath);
  process.exit(1);
}

const rawData = fs.readFileSync(filePath, "utf-8");
const jsonData = JSON.parse(rawData);

const result = analyzeMatches(jsonData);

console.log("=== MATCHSENSE REPORT ===");
console.log(`Summoner: ${result.summoner}`);
console.log(`Matches analyzed: ${result.totalMatches}`);
console.log(`Winrate: ${result.winrate}%`);
console.log(
  `Avg KDA: ${result.avgKDA.kills}/${result.avgKDA.deaths}/${result.avgKDA.assists}`,
);

console.log("\n--- Performance by Champion ---");
result.byChampion.forEach((champ) => {
  console.log(
    `${champ.champion}: ${champ.matches} games | WR ${champ.winrate}% | Avg KDA ${champ.kda}`,
  );
});

saveAnalysis(result);
console.log("\nAnalysis saved to database.");

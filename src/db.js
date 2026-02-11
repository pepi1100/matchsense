const Database = require("better-sqlite3");
const path = require("path");

const db = new Database(
  path.join(__dirname, "../data/matchsense.db")
);

// tablas
db.exec(`
  CREATE TABLE IF NOT EXISTS analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    summoner TEXT,
    matches INTEGER,
    winrate REAL,
    avg_kills REAL,
    avg_deaths REAL,
    avg_assists REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS champion_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    analysis_id INTEGER,
    champion TEXT,
    matches INTEGER,
    winrate REAL,
    avg_kda TEXT,
    FOREIGN KEY (analysis_id) REFERENCES analyses(id)
  );
`);

function saveAnalysis(result) {
  const insertAnalysis = db.prepare(`
    INSERT INTO analyses
    (summoner, matches, winrate, avg_kills, avg_deaths, avg_assists)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const info = insertAnalysis.run(
    result.summoner,
    result.totalMatches,
    result.winrate,
    result.avgKDA.kills,
    result.avgKDA.deaths,
    result.avgKDA.assists
  );

  const analysisId = info.lastInsertRowid;

  const insertChampion = db.prepare(`
    INSERT INTO champion_stats
    (analysis_id, champion, matches, winrate, avg_kda)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const champ of result.byChampion) {
    insertChampion.run(
      analysisId,
      champ.champion,
      champ.matches,
      champ.winrate,
      champ.kda
    );
  }
}

function getBestChampions(minGames = 3) {
  return db.prepare(`
    SELECT
      champion,
      SUM(matches) AS total_games,
      ROUND(AVG(winrate), 1) AS avg_winrate
    FROM champion_stats
    GROUP BY champion
    HAVING total_games >= ?
    ORDER BY avg_winrate DESC
  `).all(minGames);
}

function getOverallStats() {
  return db.prepare(`
    SELECT
      ROUND(AVG(winrate), 1) AS winrate,
      ROUND(AVG(avg_kills), 2) AS kills,
      ROUND(AVG(avg_deaths), 2) AS deaths,
      ROUND(AVG(avg_assists), 2) AS assists
    FROM analyses
  `).get();
}

function getWinrateOverTime() {
  return db.prepare(`
    SELECT
      date(created_at) AS day,
      ROUND(AVG(winrate), 1) AS winrate
    FROM analyses
    GROUP BY day
    ORDER BY day
  `).all();
}


module.exports = {
  saveAnalysis,
  getBestChampions,
  getOverallStats,
  getWinrateOverTime,
};

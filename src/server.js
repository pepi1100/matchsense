const express = require("express");

const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { getWinrateOverTime } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

const db = new sqlite3.Database(
  path.join(__dirname, "../data/matchsense.db")
);

app.use(express.static("public"));

app.get("/api/winrate", (req, res) => {
  const { summoner } = req.query;

  let sql = `
    SELECT
      DATE(created_at) AS day,
      ROUND(AVG(winrate), 1) AS winrate
    FROM analyses
  `;

  const params = [];

  if (summoner) {
    sql += ` WHERE summoner = ? `;
    params.push(summoner);
  }

  sql += `
    GROUP BY day
    ORDER BY day
  `;

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json(err);
    res.json(rows);
  });
});


app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
});


app.get("/api/summoners", (req, res) => {
  const sql = `
    SELECT DISTINCT summoner
    FROM analyses
    ORDER BY summoner
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    res.json(rows.map(r => r.summoner));
  });
});


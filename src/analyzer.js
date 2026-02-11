function analyzeMatches(data) {
  const total = data.matches.length;
  const wins = data.matches.filter(m => m.win).length;

  let kills = 0;
  let deaths = 0;
  let assists = 0;

  const byChampionMap = {};

  data.matches.forEach(m => {
    kills += m.kills;
    deaths += m.deaths;
    assists += m.assists;

    if (!byChampionMap[m.champion]) {
      byChampionMap[m.champion] = {
        champion: m.champion,
        matches: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0
      };
    }

    const champ = byChampionMap[m.champion];
    champ.matches += 1;
    champ.kills += m.kills;
    champ.deaths += m.deaths;
    champ.assists += m.assists;
    if (m.win) champ.wins += 1;
  });

  const byChampion = Object.values(byChampionMap).map(c => ({
    champion: c.champion,
    matches: c.matches,
    winrate: ((c.wins / c.matches) * 100).toFixed(1),
    kda: `${(c.kills / c.matches).toFixed(1)}/${(c.deaths / c.matches).toFixed(
      1
    )}/${(c.assists / c.matches).toFixed(1)}`
  }));

  return {
    summoner: data.summoner,
    totalMatches: total,
    winrate: ((wins / total) * 100).toFixed(1),
    avgKDA: {
      kills: (kills / total).toFixed(1),
      deaths: (deaths / total).toFixed(1),
      assists: (assists / total).toFixed(1)
    },
    byChampion
  };
}

module.exports = analyzeMatches;

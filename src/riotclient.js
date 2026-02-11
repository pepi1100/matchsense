require('dotenv').config();
const axios = require('axios');

const API_KEY = process.env.RIOT_API_KEY;

const ACCOUNT_URL = 'https://americas.api.riotgames.com';
const SUMMONER_URL = 'https://la2.api.riotgames.com';

async function getAccountByRiotId(gameName, tagLine) {
  const res = await axios.get(
    `${ACCOUNT_URL}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
    {
      headers: { 'X-Riot-Token': API_KEY }
    }
  );
  return res.data;
}

async function getSummonerByPUUID(puuid) {
  const res = await axios.get(
    `${SUMMONER_URL}/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    {
      headers: { 'X-Riot-Token': API_KEY }
    }
  );
  return res.data;
}

async function getSummoner(gameName, tagLine = 'LAS') {
  const account = await getAccountByRiotId(gameName, tagLine);
  const summoner = await getSummonerByPUUID(account.puuid);

  return {
    gameName: account.gameName,
    tagLine: account.tagLine,
    summonerLevel: summoner.summonerLevel,
    puuid: account.puuid
  };
}

const MATCH_URL = 'https://americas.api.riotgames.com';

async function getMatchIdsByPUUID(puuid, count = 10) {
  const res = await axios.get(
    `${MATCH_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids`,
    {
      params: { count },
      headers: { 'X-Riot-Token': API_KEY }
    }
  );
  return res.data;
}

async function getMatchDetails(matchId) {
  const res = await axios.get(
    `${MATCH_URL}/lol/match/v5/matches/${matchId}`,
    {
      headers: { "X-Riot-Token": API_KEY },
    }
  );
  return res.data;
}



module.exports = {
  getSummoner,
  getMatchIdsByPUUID,
  getMatchDetails,
};

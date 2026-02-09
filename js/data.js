const GAME_KEY = "boardGames";

export function getGames() {
  return JSON.parse(localStorage.getItem(GAME_KEY)) || [];
}

export function saveGames(games) {
  localStorage.setItem(GAME_KEY, JSON.stringify(games));
}

export function todayKey() {
  return new Date().toISOString().split("T")[0];
}

export function addPlay(game) {
  if (!game.playHistory) game.playHistory = {};

  const today = todayKey();
  game.playHistory[today] = (game.playHistory[today] || 0) + 1;

  game.plays = Object.values(game.playHistory).reduce((a, b) => a + b, 0);
}

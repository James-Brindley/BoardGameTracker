const GAME_KEY = "boardGames";

function getGames() {
  return JSON.parse(localStorage.getItem(GAME_KEY)) || [];
}

function saveGames(games) {
  localStorage.setItem(GAME_KEY, JSON.stringify(games));
}

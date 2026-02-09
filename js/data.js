const GAME_KEY = "boardGames";
const THEME_KEY = "theme";

function getGames() {
  return JSON.parse(localStorage.getItem(GAME_KEY)) || [];
}

function saveGames(games) {
  localStorage.setItem(GAME_KEY, JSON.stringify(games));
}

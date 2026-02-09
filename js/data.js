const STORAGE_KEY = "boardGames";

function getGames() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveGames(games) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

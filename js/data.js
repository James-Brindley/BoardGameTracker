const STORAGE_KEY = "boardGames";
const THEME_KEY = "theme";

function getGames() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
}

function saveGames(games) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
}

function loadTheme() {
  const theme = localStorage.getItem(THEME_KEY) || "light";
  setTheme(theme);
}

loadTheme();

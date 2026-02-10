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

/* ---------- TAG AWARD ---------- */
export function awardTopMonthTag(year, month) {
  const games = getGames();
  const key = `${year}-${String(month + 1).padStart(2, "0")}`;
  let top = null;

  games.forEach(g => {
    const plays = Object.entries(g.playHistory || {})
      .filter(([d]) => d.startsWith(key))
      .reduce((a, [, v]) => a + v, 0);

    if (!top || plays > top.plays) {
      top = { game: g, plays };
    }
  });

  if (!top || top.plays === 0) return;

  const label = `Most Played · ${new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric"
  })}`;

  top.game.tags ??= [];
  if (!top.game.tags.some(t => t.label === label)) {
    top.game.tags.push({ type: "top-month", label });
    saveGames(games);
  }
}

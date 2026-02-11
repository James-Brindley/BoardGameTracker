const GAME_KEY = "boardGames";

function migrateGame(g) {
  const migrated = { ...g };

  migrated.badges ||= [];
  migrated.playHistory ||= {};
  migrated.players ||= { min: null, max: null };
  migrated.playTime ||= { min: null, max: null };

  if (typeof migrated.plays !== "number") {
    migrated.plays = Object.values(migrated.playHistory)
      .reduce((a,b)=>a+b,0);
  }

  return migrated;
}

export function getGames() {
  const raw = JSON.parse(localStorage.getItem(GAME_KEY)) || [];
  const migrated = raw.map(migrateGame);
  localStorage.setItem(GAME_KEY, JSON.stringify(migrated));
  return migrated;
}

export function saveGames(games) {
  localStorage.setItem(GAME_KEY, JSON.stringify(games));
}

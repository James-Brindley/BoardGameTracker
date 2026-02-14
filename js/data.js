import { auth, db, getUserDoc, setUserDoc, updateUserDoc } from "./firebase.js";

let gamesCache = [];
let currentUser = null;

// ---------- AUTH TRACK ----------
export function setCurrentUser(user) {
  currentUser = user;
}

// ---------- MIGRATE GAME ----------
function migrateGame(g) {
  const migrated = { ...g };
  migrated.badges ||= [];
  migrated.playHistory ||= {};
  migrated.players ||= { min: null, max: null };
  migrated.playTime ||= { min: null, max: null };
  migrated.plays ||= Object.values(migrated.playHistory).reduce((a,b)=>a+b,0);
  return migrated;
}

// ---------- GET GAMES ----------
export async function getGames() {
  if (!currentUser) return [];

  const data = await getUserDoc(currentUser.uid);
  const raw = data?.games || [];
  gamesCache = raw.map(migrateGame);

  return gamesCache;
}

// ---------- SAVE GAMES ----------
export async function saveGames(games) {
  if (!currentUser) throw new Error("User not logged in");

  gamesCache = games.map(migrateGame);
  await setUserDoc(currentUser.uid, { games: gamesCache });
}

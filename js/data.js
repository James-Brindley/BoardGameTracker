import { 
  auth,
  db,
  doc,
  getDoc,
  setDoc
} from "./firebase.js";

let cachedGames = [];
let currentUser = null;

/* =============================
   AUTH READY
============================= */
export function waitForAuth() {
  return new Promise(resolve => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user) {
        currentUser = user;
        unsub();
        resolve(user);
      }
    });
  });
}

/* =============================
   MIGRATION
============================= */
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

/* =============================
   LOAD GAMES (FROM FIRESTORE)
============================= */
export async function getGames() {
  if (!currentUser) await waitForAuth();

  const ref = doc(db, "users", currentUser.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, { games: [] });
    cachedGames = [];
    return [];
  }

  cachedGames = (snap.data().games || []).map(migrateGame);
  return cachedGames;
}

/* =============================
   SAVE GAMES
============================= */
export async function saveGames(games) {
  if (!currentUser) await waitForAuth();

  cachedGames = games;

  const ref = doc(db, "users", currentUser.uid);
  await setDoc(ref, { games });
}

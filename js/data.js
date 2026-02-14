import { db } from "./firebase.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUser = null; // Will be set from firebase.js

export function setCurrentUser(user) {
  currentUser = user;
}

/* ----------------------------
   FIRESTORE HELPERS
---------------------------- */
function userDoc() {
  if (!currentUser) throw new Error("No user logged in");
  return doc(db, "users", currentUser.uid);
}

/* ----------------------------
   MIGRATION LOGIC
---------------------------- */
function migrateGame(g) {
  const migrated = { ...g };

  migrated.badges ||= [];
  migrated.playHistory ||= {};
  migrated.players ||= { min: null, max: null };
  migrated.playTime ||= { min: null, max: null };

  if (typeof migrated.plays !== "number") {
    migrated.plays = Object.values(migrated.playHistory)
      .reduce((a, b) => a + b, 0);
  }

  return migrated;
}

/* ----------------------------
   GET GAMES
---------------------------- */
export async function getGames() {
  if (!currentUser) return [];

  const snap = await getDoc(userDoc());
  const raw = snap.exists() ? snap.data().games || [] : [];

  const migrated = raw.map(migrateGame);

  // Save back migrated data if needed
  await setDoc(userDoc(), { games: migrated }, { merge: true });

  return migrated;
}

/* ----------------------------
   SAVE GAMES
---------------------------- */
export async function saveGames(games) {
  if (!currentUser) throw new Error("No user logged in");
  const migrated = games.map(migrateGame);
  await setDoc(userDoc(), { games: migrated }, { merge: true });
}

/* ----------------------------
   UPDATE SINGLE GAME FIELD
---------------------------- */
export async function updateGameField(gameId, field, value) {
  if (!currentUser) throw new Error("No user logged in");

  const games = await getGames();
  const index = games.findIndex(g => g.id === gameId);
  if (index === -1) return;

  games[index][field] = value;
  await saveGames(games);
}

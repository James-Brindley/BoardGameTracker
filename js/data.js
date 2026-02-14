import { db, auth } from "./firebase.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  increment
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

/* ---------- FIREBASE USER DATA ---------- */
const GAME_COLLECTION = "users"; // Each user has a document with games

// Fallback for migration
function migrateGame(g) {
  const migrated = { ...g };
  migrated.badges ||= [];
  migrated.playHistory ||= {};
  migrated.players ||= { min: null, max: null };
  migrated.playTime ||= { min: null, max: null };
  if (typeof migrated.plays !== "number") {
    migrated.plays = Object.values(migrated.playHistory).reduce((a,b)=>a+b,0);
  }
  return migrated;
}

/* ---------- GET GAMES ---------- */
export async function getGames() {
  const user = auth.currentUser;
  if (!user) return []; // Not logged in

  const userDoc = doc(db, GAME_COLLECTION, user.uid);
  const snapshot = await getDoc(userDoc);

  if (!snapshot.exists() || !snapshot.data().games) {
    return [];
  }

  const raw = snapshot.data().games;
  const migrated = raw.map(migrateGame);
  return migrated;
}

/* ---------- SAVE GAMES ---------- */
export async function saveGames(games) {
  const user = auth.currentUser;
  if (!user) return; // Not logged in

  const userDoc = doc(db, GAME_COLLECTION, user.uid);

  await setDoc(userDoc, { games }, { merge: true });
}

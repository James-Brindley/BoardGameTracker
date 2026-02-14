import { auth, db } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let cachedGames = [];
let ready = false;

/* =============================
   AUTH READY
============================= */

function waitForAuth() {
  return new Promise(resolve => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user) {
        unsub();
        resolve(user);
      }
    });
  });
}

/* =============================
   MIGRATION SAFETY
============================= */

function migrateGame(g) {
  return {
    id: g.id,
    name: g.name || "",
    image: g.image || null,
    plays: g.plays || 0,
    rating: g.rating ?? null,
    review: g.review || "",
    players: g.players || { min: null, max: null },
    playTime: g.playTime || { min: null, max: null },
    playHistory: g.playHistory || {},
    badges: g.badges || []
  };
}

/* =============================
   LOAD GAMES (REALTIME)
============================= */

export async function initGames(callback) {
  const user = await waitForAuth();
  const gamesRef = collection(db, "users", user.uid, "games");

  onSnapshot(gamesRef, snapshot => {
    cachedGames = snapshot.docs.map(d => migrateGame(d.data()));
    ready = true;
    if (callback) callback(cachedGames);
  });
}

/* =============================
   GET GAMES
============================= */

export function getGames() {
  return cachedGames;
}

/* =============================
   SAVE ALL GAMES
============================= */

export async function saveGames(games) {
  const user = auth.currentUser;
  if (!user) return;

  const gamesRef = collection(db, "users", user.uid, "games");

  const existingIds = new Set(cachedGames.map(g => g.id));
  const newIds = new Set(games.map(g => g.id));

  // Save/update
  for (const game of games) {
    await setDoc(
      doc(gamesRef, game.id),
      migrateGame(game)
    );
  }

  // Delete removed games
  for (const id of existingIds) {
    if (!newIds.has(id)) {
      await deleteDoc(doc(gamesRef, id));
    }
  }
}

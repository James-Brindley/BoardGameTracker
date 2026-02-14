import { db, auth } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const COLLECTION_NAME = "games";

/* ----------------------------
   WAIT FOR AUTH
---------------------------- */
function waitForUser() {
  return new Promise(resolve => {
    const unsub = auth.onAuthStateChanged(user => {
      if (user) {
        unsub();
        resolve(user);
      }
    });
  });
}

/* ----------------------------
   MIGRATION SAFETY
---------------------------- */
function migrateGame(g) {
  return {
    badges: [],
    playHistory: {},
    players: { min: null, max: null },
    playTime: { min: null, max: null },
    plays: 0,
    rating: null,
    review: "",
    image: null,
    ...g
  };
}

/* ----------------------------
   GET GAMES
---------------------------- */
export async function getGames() {
  const user = await waitForUser();
  const snap = await getDocs(
    collection(db, "users", user.uid, COLLECTION_NAME)
  );

  return snap.docs.map(d =>
    migrateGame({ id: d.id, ...d.data() })
  );
}

/* ----------------------------
   SAVE ALL GAMES
---------------------------- */
export async function saveGames(games) {
  const user = await waitForUser();

  const existingSnap = await getDocs(
    collection(db, "users", user.uid, COLLECTION_NAME)
  );

  const existingIds = existingSnap.docs.map(d => d.id);
  const newIds = games.map(g => g.id);

  /* Remove deleted */
  for (const id of existingIds) {
    if (!newIds.includes(id)) {
      await deleteDoc(
        doc(db, "users", user.uid, COLLECTION_NAME, id)
      );
    }
  }

  /* Upsert */
  for (const g of games) {
    await setDoc(
      doc(db, "users", user.uid, COLLECTION_NAME, g.id),
      { ...g }
    );
  }
}

// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Your config
const firebaseConfig = {
  apiKey: "AIzaSyDrfFeidoLWHq5sNw1lB59RsAzrc0VG298",
  authDomain: "boardgame-tracker-3f59c.firebaseapp.com",
  projectId: "boardgame-tracker-3f59c",
  storageBucket: "boardgame-tracker-3f59c.firebasestorage.app",
  messagingSenderId: "490483164045",
  appId: "1:490483164045:web:d47116f775572b568513c4"
};

// Initialize
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

// UI Helpers
export function login() {
  return signInWithPopup(auth, provider);
}

export function logout() {
  return signOut(auth);
}

export function onUserChange(callback) {
  onAuthStateChanged(auth, callback);
}

// Firestore helpers
export async function getUserDoc(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data();
  else return null;
}

export async function setUserDoc(uid, data) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, data, { merge: true });
}

export async function updateUserDoc(uid, data) {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, data);
}

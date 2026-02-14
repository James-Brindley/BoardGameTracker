// Import Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { setCurrentUser } from "./data.js"; // Connects data.js

// Your config
const firebaseConfig = {
  apiKey: "AIzaSyDrfFeidoLWHq5sNw1lB59RsAzrc0VG298",
  authDomain: "boardgame-tracker-3f59c.firebaseapp.com",
  projectId: "boardgame-tracker-3f59c",
  storageBucket: "boardgame-tracker-3f59c.firebasestorage.app",
  messagingSenderId: "490483164045",
  appId: "1:490483164045:web:d47116f775572b568513c4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* ----------------------------
   AUTH STATE HANDLING
---------------------------- */
export let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    setCurrentUser(user); // Let data.js know who is logged in
    console.log("Logged in as:", user.email);
  } else {
    currentUser = null;
    setCurrentUser(null);
    console.log("Logged out");
  }
});

/* ----------------------------
   SIGN UP
---------------------------- */
export async function signUp(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    currentUser = cred.user;
    setCurrentUser(currentUser);
    console.log("User signed up:", currentUser.email);
    return currentUser;
  } catch (err) {
    console.error("Sign-up error:", err);
    throw err;
  }
}

/* ----------------------------
   SIGN IN
---------------------------- */
export async function signIn(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    currentUser = cred.user;
    setCurrentUser(currentUser);
    console.log("User signed in:", currentUser.email);
    return currentUser;
  } catch (err) {
    console.error("Sign-in error:", err);
    throw err;
  }
}

/* ----------------------------
   SIGN OUT
---------------------------- */
export async function logout() {
  try {
    await signOut(auth);
    currentUser = null;
    setCurrentUser(null);
    console.log("User logged out");
  } catch (err) {
    console.error("Sign-out error:", err);
    throw err;
  }
}

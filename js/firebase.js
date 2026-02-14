import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { 
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { 
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDrfFeidoLWHq5sNw1lB59RsAzrc0VG298",
  authDomain: "boardgame-tracker-3f59c.firebaseapp.com",
  projectId: "boardgame-tracker-3f59c",
  storageBucket: "boardgame-tracker-3f59c.firebasestorage.app",
  messagingSenderId: "490483164045",
  appId: "1:490483164045:web:d47116f775572b568513c4"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const provider = new GoogleAuthProvider();

export {
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  doc,
  getDoc,
  setDoc
};

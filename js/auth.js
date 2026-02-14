import { auth } from "./firebase.js";
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const provider = new GoogleAuthProvider();

onAuthStateChanged(auth, user => {
  if (!user) {
    signInWithPopup(auth, provider);
  }
});

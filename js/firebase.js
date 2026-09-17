// Initialisation de Firebase (Auth + Firestore).
// La clé API web est publique par conception : la sécurité repose sur firestore.rules.

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDiXTE9CYic8wruXrj2MJJeF78yI-0sGQ4",
  authDomain: "craftnote-5b31b.firebaseapp.com",
  projectId: "craftnote-5b31b",
  storageBucket: "craftnote-5b31b.firebasestorage.app",
  messagingSenderId: "911653521182",
  appId: "1:911653521182:web:79dcc4f55760ca6cfceb0f",
  measurementId: "G-XLL6X8L2B6",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

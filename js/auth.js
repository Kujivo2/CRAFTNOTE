// Connexion / déconnexion et lecture du profil de l'utilisateur connecté.

import {
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";

export const ROLES = {
  student: { label: "élève" },
  teacher: { label: "professeur" },
};

const AUTH_ERRORS = {
  "auth/invalid-credential": "Adresse e-mail ou mot de passe incorrect.",
  "auth/invalid-email": "Adresse e-mail invalide.",
  "auth/too-many-requests": "Trop de tentatives. Réessayez plus tard.",
};

export async function getCurrentProfile() {
  const user = auth.currentUser;
  if (!user) return null;

  const snap = await getDoc(doc(db, "profiles", user.uid));
  if (!snap.exists()) return null;

  return { uid: user.uid, email: user.email, ...snap.data() };
}

// Connecte l'utilisateur et vérifie qu'il a le rôle attendu.
// Renvoie le profil, ou lève une Error avec un message lisible.
export async function login(email, password, expectedRole) {
  if (!email || !password) {
    throw new Error("Veuillez remplir les deux champs.");
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error(error);
    throw new Error(AUTH_ERRORS[error.code] || "Erreur lors de la connexion.");
  }

  let profile;
  try {
    profile = await getCurrentProfile();
  } catch (error) {
    console.error(error);
    await logout();
    throw new Error("Impossible de lire le profil CRAFTNOTE.");
  }

  if (!profile) {
    await logout();
    throw new Error("Aucun profil CRAFTNOTE trouvé.");
  }

  if (profile.role !== expectedRole) {
    await logout();
    throw new Error(`Ce compte n'est pas un compte ${ROLES[expectedRole].label}.`);
  }

  return profile;
}

export async function logout() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error(error);
  }
}

// Vérifie côté client que l'utilisateur est un professeur.
// (La vraie protection est dans firestore.rules.)
export async function requireTeacher() {
  const profile = await getCurrentProfile();
  if (profile?.role !== "teacher") {
    throw new Error("Compte professeur requis.");
  }
  return profile;
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDiXTE9CYic8wruXrj2MJJeF78yI-0sGQ4",
  authDomain: "craftnote-5b31b.firebaseapp.com",
  projectId: "craftnote-5b31b",
  storageBucket: "craftnote-5b31b.firebasestorage.app",
  messagingSenderId: "911653521182",
  appId: "1:911653521182:web:79dcc4f55760ca6cfceb0f",
  measurementId: "G-XLL6X8L2B6"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const $ = (id) => document.getElementById(id);

const screens = [
  "home",
  "login-eleve",
  "login-prof",
  "eleve",
  "prof"
];

const data = {
  notes: [
    "Français : 16/20",
    "Mathématiques : 14/20",
    "Histoire : 15/20"
  ],
  avertissements: [
    "Aucun avertissement."
  ],
  sanctions: [
    "Aucune sanction."
  ]
};

function show(id) {
  screens.forEach((s) => {
    $(s).classList.toggle("hidden", s !== id);
  });
}

function result(id, html) {
  $(id).innerHTML = html;
}

// Navigation
document.querySelectorAll("[data-open]").forEach((button) => {
  button.onclick = () => show(button.dataset.open);
});

document.querySelectorAll("[data-back]").forEach((button) => {
  button.onclick = () => show("home");
});

// Déconnexion
document.querySelectorAll("[data-home]").forEach((button) => {
  button.onclick = async () => {
    try {
      await signOut(auth);
      show("home");
    } catch (error) {
      console.error(error);
      alert("Impossible de se déconnecter.");
    }
  };
});

// Connexion élève avec Firebase
$("eleve-connexion").onclick = async () => {
  const email = $("eleve-identifiant").value.trim();
  const password = $("eleve-motdepasse").value;

  if (!email || !password) {
    alert("Veuillez renseigner votre e-mail et votre mot de passe.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    show("eleve");
  } catch (error) {
    console.error(error);
    afficherErreurFirebase(error);
  }
};

// Connexion professeur avec Firebase
$("prof-connexion").onclick = async () => {
  const email = $("prof-identifiant").value.trim();
  const password = $("prof-motdepasse").value;

  if (!email || !password) {
    alert("Veuillez renseigner votre e-mail et votre mot de passe.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    show("prof");
  } catch (error) {
    console.error(error);
    afficherErreurFirebase(error);
  }
};

// Messages d'erreur Firebase
function afficherErreurFirebase(error) {
  switch (error.code) {
    case "auth/invalid-credential":
      alert("Adresse e-mail ou mot de passe incorrect.");
      break;

    case "auth/invalid-email":
      alert("L'adresse e-mail est invalide.");
      break;

    case "auth/too-many-requests":
      alert("Trop de tentatives. Réessayez plus tard.");
      break;

    case "auth/network-request-failed":
      alert("Problème de connexion Internet.");
      break;

    default:
      alert("Erreur de connexion.");
      console.error(error);
  }
}

// Pages
document.querySelectorAll("[data-page]").forEach((button) => {
  button.onclick = () => {
    const page = button.dataset.page;
    const target = button.closest("#eleve")
      ? "eleve-result"
      : "prof-result";

    if (page === "notes-eleve") {
      result(
        target,
        "<strong>Mes notes</strong><br>" +
        data.notes.join("<br>")
      );
    }

    if (page === "emploi") {
      result(
        target,
        "<strong>Emploi du temps</strong><br>" +
        "Lundi — Français 08:00<br>" +
        "Mardi — Mathématiques 10:00<br>" +
        "Jeudi — Histoire 14:00"
      );
    }

    if (page === "avertissements-eleve") {
      result(
        target,
        "<strong>Mes avertissements</strong><br>" +
        data.avertissements.join("<br>")
      );
    }

    if (page === "sanctions-eleve") {
      result(
        target,
        "<strong>Mes sanctions</strong><br>" +
        data.sanctions.join("<br>")
      );
    }

    if (page === "ajouter-note") {
      result(
        target,
        `
        <strong>Ajouter une note</strong><br>
        <input id="new-note" placeholder="Élève — Matière — Note">
        <button onclick="saveNote()">Enregistrer</button>
        `
      );
    }

    if (page === "appreciation") {
      result(
        target,
        `
        <strong>Appréciation</strong><br>
        <textarea id="new-app" placeholder="Écrire une appréciation"></textarea>
        <button onclick="saveText('Appréciation enregistrée.')">
          Enregistrer
        </button>
        `
      );
    }

    if (page === "avertissement") {
      result(
        target,
        `
        <strong>Avertissement</strong><br>
        <textarea id="new-warning" placeholder="Motif de l’avertissement"></textarea>
        <button onclick="saveText('Avertissement enregistré.')">
          Enregistrer
        </button>
        `
      );
    }

    if (page === "sanction") {
      result(
        target,
        `
        <strong>Sanction</strong><br>
        <textarea id="new-sanction" placeholder="Motif de la sanction"></textarea>
        <button onclick="saveText('Sanction enregistrée.')">
          Enregistrer
        </button>
        `
      );
    }
  };
});

// Enregistrement démo d'une note
window.saveNote = () => {
  const input = $("new-note");

  if (!input) return;

  const value = input.value.trim();

  if (value) {
    data.notes.push(value);
    result("prof-result", "Note enregistrée.");
  }
};

// Messages démo
window.saveText = (message) => {
  result("prof-result", message);
};

// Vérification de l'état de connexion
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Utilisateur connecté :", user.email);
  } else {
    console.log("Aucun utilisateur connecté.");
  }
});

show("home");

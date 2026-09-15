import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

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
const db = getFirestore(app);

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
  screens.forEach((screen) => {
    $(screen).classList.toggle("hidden", screen !== id);
  });
}

function result(id, html) {
  $(id).innerHTML = html;
}

// -----------------------------
// Navigation
// -----------------------------

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => {
    show(button.dataset.open);
  });
});

document.querySelectorAll("[data-back]").forEach((button) => {
  button.addEventListener("click", () => {
    show("home");
  });
});

document.querySelectorAll("[data-home]").forEach((button) => {
  button.addEventListener("click", async () => {
    await signOut(auth);
    show("home");
  });
});

// -----------------------------
// Chercher le profil Firestore
// -----------------------------

async function getProfile(email) {
  const profiles = collection(db, "profiles");
  const q = query(profiles, where("email", "==", email));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data();
}

// -----------------------------
// Connexion élève
// -----------------------------

$("eleve-connexion").addEventListener("click", async () => {
  const email = $("eleve-identifiant").value.trim();
  const password = $("eleve-motdepasse").value;

  if (!email || !password) {
    alert("Veuillez remplir les deux champs.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);

    const profile = await getProfile(email);

    if (!profile) {
      await signOut(auth);
      alert("Aucun profil CRAFTNOTE trouvé pour ce compte.");
      return;
    }

    if (profile.role !== "student") {
      await signOut(auth);
      alert("Ce compte n'est pas un compte élève.");
      return;
    }

    const nom = profile.nom || "Élève";

    document.querySelector("#eleve .muted").textContent =
      `Bienvenue ${nom}`;

    show("eleve");

  } catch (error) {
    console.error(error);

    if (error.code === "auth/invalid-credential") {
      alert("Adresse e-mail ou mot de passe incorrect.");
    } else if (error.code === "auth/invalid-email") {
      alert("Adresse e-mail invalide.");
    } else {
      alert("Erreur lors de la connexion.");
    }
  }
});

// -----------------------------
// Connexion professeur
// -----------------------------

$("prof-connexion").addEventListener("click", async () => {
  const email = $("prof-identifiant").value.trim();
  const password = $("prof-motdepasse").value;

  if (!email || !password) {
    alert("Veuillez remplir les deux champs.");
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);

    const profile = await getProfile(email);

    if (!profile) {
      await signOut(auth);
      alert("Aucun profil CRAFTNOTE trouvé pour ce compte.");
      return;
    }

    if (profile.role !== "teacher") {
      await signOut(auth);
      alert("Ce compte n'est pas un compte professeur.");
      return;
    }

    const nom = profile.nom || "Professeur";

    document.querySelector("#prof .muted").textContent =
      `Bienvenue ${nom}`;

    show("prof");

  } catch (error) {
    console.error(error);

    if (error.code === "auth/invalid-credential") {
      alert("Adresse e-mail ou mot de passe incorrect.");
    } else if (error.code === "auth/invalid-email") {
      alert("Adresse e-mail invalide.");
    } else {
      alert("Erreur lors de la connexion.");
    }
  }
});

// -----------------------------
// Pages élève / professeur
// -----------------------------

document.querySelectorAll("[data-page]").forEach((button) => {
  button.addEventListener("click", () => {
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
        <button id="save-note-button">Enregistrer</button>
        `
      );

      $("save-note-button").addEventListener("click", saveNote);
    }

    if (page === "appreciation") {
      result(
        target,
        `
        <strong>Appréciation</strong><br>
        <textarea id="new-app" placeholder="Écrire une appréciation"></textarea>
        <button id="save-app-button">Enregistrer</button>
        `
      );

      $("save-app-button").addEventListener("click", () => {
        saveText("Appréciation enregistrée.");
      });
    }

    if (page === "avertissement") {
      result(
        target,
        `
        <strong>Avertissement</strong><br>
        <textarea id="new-warning" placeholder="Motif de l’avertissement"></textarea>
        <button id="save-warning-button">Enregistrer</button>
        `
      );

      $("save-warning-button").addEventListener("click", () => {
        saveText("Avertissement enregistré.");
      });
    }

    if (page === "sanction") {
      result(
        target,
        `
        <strong>Sanction</strong><br>
        <textarea id="new-sanction" placeholder="Motif de la sanction"></textarea>
        <button id="save-sanction-button">Enregistrer</button>
        `
      );

      $("save-sanction-button").addEventListener("click", () => {
        saveText("Sanction enregistrée.");
      });
    }
  });
});

// -----------------------------
// Fonctions
// -----------------------------

function saveNote() {
  const input = $("new-note");

  if (!input) return;

  const value = input.value.trim();

  if (!value) {
    alert("Écris une note avant d'enregistrer.");
    return;
  }

  data.notes.push(value);

  result(
    "prof-result",
    "<strong>Note enregistrée.</strong>"
  );
}

function saveText(message) {
  result("prof-result", `<strong>${message}</strong>`);
}

show("home");

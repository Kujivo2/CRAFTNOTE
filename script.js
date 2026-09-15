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
  getDocs,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


/* =========================
   FIREBASE
========================= */

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


/* =========================
   OUTILS
========================= */

const $ = (id) => document.getElementById(id);

const screens = [
  "home",
  "login-eleve",
  "login-prof",
  "eleve",
  "prof"
];

function show(id) {
  screens.forEach((screen) => {
    const element = $(screen);

    if (element) {
      element.classList.toggle("hidden", screen !== id);
    }
  });
}

function result(id, html) {
  const element = $(id);

  if (element) {
    element.innerHTML = html;
  }
}


/* =========================
   NAVIGATION
========================= */

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
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }

    show("home");
  });
});


/* =========================
   PROFIL FIRESTORE
========================= */

async function getProfile(email) {
  const profilesRef = collection(db, "profiles");

  const q = query(
    profilesRef,
    where("email", "==", email)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data();
}


/* =========================
   CONNEXION ÉLÈVE
========================= */

$("eleve-connexion").addEventListener("click", async () => {
  const email = $("eleve-identifiant").value.trim();
  const password = $("eleve-motdepasse").value;

  if (!email || !password) {
    alert("Veuillez remplir les deux champs.");
    return;
  }

  try {
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const profile = await getProfile(email);

    if (!profile) {
      await signOut(auth);
      alert("Aucun profil CRAFTNOTE trouvé.");
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
      alert("E-mail ou mot de passe incorrect.");
    } else if (error.code === "auth/invalid-email") {
      alert("Adresse e-mail invalide.");
    } else {
      alert("Erreur de connexion.");
    }
  }
});


/* =========================
   CONNEXION PROFESSEUR
========================= */

$("prof-connexion").addEventListener("click", async () => {
  const email = $("prof-identifiant").value.trim();
  const password = $("prof-motdepasse").value;

  if (!email || !password) {
    alert("Veuillez remplir les deux champs.");
    return;
  }

  try {
    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const profile = await getProfile(email);

    if (!profile) {
      await signOut(auth);
      alert("Aucun profil CRAFTNOTE trouvé.");
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
      alert("E-mail ou mot de passe incorrect.");
    } else if (error.code === "auth/invalid-email") {
      alert("Adresse e-mail invalide.");
    } else {
      alert("Erreur de connexion.");
    }
  }
});


/* =========================
   CHARGER LES ÉLÈVES
========================= */

async function getStudents() {
  const profilesRef = collection(db, "profiles");

  const q = query(
    profilesRef,
    where("role", "==", "student")
  );

  const snapshot = await getDocs(q);

  const students = [];

  snapshot.forEach((doc) => {
    const data = doc.data();

    students.push({
      id: doc.id,
      email: data.email,
      nom: data.nom || data.email
    });
  });

  students.sort((a, b) =>
    a.nom.localeCompare(b.nom, "fr")
  );

  return students;
}


/* =========================
   AJOUTER UNE NOTE
========================= */

async function afficherFormulaireNote() {
  const target = "prof-result";

  result(
    target,
    `
      <strong>Ajouter une note</strong>

      <div class="note-form">

        <label>
          Élève
          <select id="note-eleve">
            <option value="">Chargement des élèves...</option>
          </select>
        </label>

        <label>
          Matière
          <input
            id="note-matiere"
            type="text"
            placeholder="Ex. Mathématiques"
          >
        </label>

        <label>
          Note
          <input
            id="note-valeur"
            type="text"
            placeholder="Ex. 15/20"
          >
        </label>

        <label>
          Date
          <input
            id="note-date"
            type="date"
          >
        </label>

        <button id="enregistrer-note">
          Enregistrer la note
        </button>

        <p id="note-message"></p>

      </div>
    `
  );

  const select = $("note-eleve");

  try {
    const students = await getStudents();

    if (students.length === 0) {
      select.innerHTML =
        `<option value="">Aucun élève trouvé</option>`;
      return;
    }

    select.innerHTML =
      `<option value="">Choisir un élève</option>`;

    students.forEach((student) => {
      const option = document.createElement("option");

      option.value = student.email;
      option.textContent = student.nom;

      select.appendChild(option);
    });

  } catch (error) {
    console.error(error);

    select.innerHTML =
      `<option value="">Erreur de chargement</option>`;
  }


  $("enregistrer-note").addEventListener(
    "click",
    enregistrerNote
  );
}


/* =========================
   ENREGISTRER UNE NOTE
========================= */

async function enregistrerNote() {
  const eleve = $("note-eleve").value;
  const matiere = $("note-matiere").value.trim();
  const note = $("note-valeur").value.trim();
  const date = $("note-date").value;

  const message = $("note-message");

  if (!eleve || !matiere || !note || !date) {
    message.textContent =
      "Remplis tous les champs.";
    return;
  }

  const professeur = auth.currentUser;

  if (!professeur) {
    message.textContent =
      "Vous devez être connecté.";
    return;
  }

  try {

    const profileProf = await getProfile(
      professeur.email
    );

    if (!profileProf || profileProf.role !== "teacher") {
      message.textContent =
        "Vous n'avez pas les droits professeur.";
      return;
    }

    await addDoc(
      collection(db, "grades"),
      {
        eleve: eleve,
        matiere: matiere,
        note: note,
        date: date,
        professeur: profileProf.nom || professeur.email
      }
    );

    message.textContent =
      "✅ Note enregistrée avec succès.";

    $("note-matiere").value = "";
    $("note-valeur").value = "";
    $("note-date").value = "";

  } catch (error) {
    console.error(error);

    message.textContent =
      "❌ Impossible d'enregistrer la note.";
  }
}


/* =========================
   AFFICHER LES NOTES ÉLÈVE
========================= */

async function afficherNotesEleve() {
  const user = auth.currentUser;

  if (!user) {
    result(
      "eleve-result",
      "Vous devez être connecté."
    );
    return;
  }

  try {
    const gradesRef = collection(db, "grades");

    const q = query(
      gradesRef,
      where("eleve", "==", user.email)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      result(
        "eleve-result",
        `
          <strong>Mes notes</strong>
          <br><br>
          Aucune note pour le moment.
        `
      );

      return;
    }

    const notes = [];

    snapshot.forEach((doc) => {
      notes.push(doc.data());
    });

    notes.sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    );

    let html = `
      <strong>Mes notes</strong>
      <div class="notes-list">
    `;

    notes.forEach((note) => {
      html += `
        <div class="note-card">
          <strong>${escapeHtml(note.matiere)}</strong>
          <br>
          Note : ${escapeHtml(note.note)}
          <br>
          Date : ${formatDate(note.date)}
          <br>
          Professeur :
          ${escapeHtml(note.professeur)}
        </div>
      `;
    });

    html += `</div>`;

    result("eleve-result", html);

  } catch (error) {
    console.error(error);

    result(
      "eleve-result",
      "Impossible de charger les notes."
    );
  }
}


/* =========================
   AUTRES PAGES
========================= */

document.querySelectorAll("[data-page]").forEach((button) => {

  button.addEventListener("click", async () => {

    const page = button.dataset.page;

    const target = button.closest("#eleve")
      ? "eleve-result"
      : "prof-result";


    /* NOTES ÉLÈVE */

    if (page === "notes-eleve") {
      await afficherNotesEleve();
      return;
    }


    /* EMPLOI DU TEMPS */

    if (page === "emploi") {
      result(
        target,
        `
          <strong>Emploi du temps</strong>
          <br><br>
          Lundi — Français 08:00
          <br>
          Mardi — Mathématiques 10:00
          <br>
          Jeudi — Histoire 14:00
        `
      );

      return;
    }


    /* AVERTISSEMENTS */

    if (page === "avertissements-eleve") {
      result(
        target,
        `
          <strong>Mes avertissements</strong>
          <br><br>
          Aucun avertissement.
        `
      );

      return;
    }


    /* SANCTIONS */

    if (page === "sanctions-eleve") {
      result(
        target,
        `
          <strong>Mes sanctions</strong>
          <br><br>
          Aucune sanction.
        `
      );

      return;
    }


    /* AJOUT NOTE PROF */

    if (page === "ajouter-note") {
      await afficherFormulaireNote();
      return;
    }


    /* APPRÉCIATION */

    if (page === "appreciation") {
      result(
        target,
        `
          <strong>Appréciation</strong>
          <br><br>

          <textarea
            id="new-app"
            placeholder="Écrire une appréciation"
          ></textarea>

          <br>

          <button id="save-app">
            Enregistrer
          </button>

          <p id="app-message"></p>
        `
      );

      $("save-app").addEventListener(
        "click",
        () => {
          $("app-message").textContent =
            "Appréciation enregistrée.";
        }
      );

      return;
    }


    /* AVERTISSEMENT */

    if (page === "avertissement") {
      result(
        target,
        `
          <strong>Avertissement</strong>
          <br><br>

          <textarea
            id="new-warning"
            placeholder="Motif de l’avertissement"
          ></textarea>

          <br>

          <button id="save-warning">
            Enregistrer
          </button>

          <p id="warning-message"></p>
        `
      );

      $("save-warning").addEventListener(
        "click",
        () => {
          $("warning-message").textContent =
            "Avertissement enregistré.";
        }
      );

      return;
    }


    /* SANCTION */

    if (page === "sanction") {
      result(
        target,
        `
          <strong>Sanction</strong>
          <br><br>

          <textarea
            id="new-sanction"
            placeholder="Motif de la sanction"
          ></textarea>

          <br>

          <button id="save-sanction">
            Enregistrer
          </button>

          <p id="sanction-message"></p>
        `
      );

      $("save-sanction").addEventListener(
        "click",
        () => {
          $("sanction-message").textContent =
            "Sanction enregistrée.";
        }
      );

      return;
    }

  });

});


/* =========================
   SÉCURITÉ AFFICHAGE
========================= */

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================
   DATE
========================= */

function formatDate(date) {
  if (!date) {
    return "Date inconnue";
  }

  const parts = String(date).split("-");

  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return date;
}


/* =========================
   DÉMARRAGE
========================= */

show("home");

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
  addDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";


/* =========================================================
   FIREBASE
========================================================= */

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


/* =========================================================
   OUTILS
========================================================= */

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

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(date) {
  if (!date) return "Date inconnue";

  const parts = String(date).split("-");

  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  return String(date);
}


/* =========================================================
   PROFIL CONNECTÉ
========================================================= */

async function getCurrentProfile() {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  const profileRef = doc(db, "profiles", user.uid);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    return null;
  }

  return {
    uid: user.uid,
    email: user.email,
    ...profileSnap.data()
  };
}


/* =========================================================
   NAVIGATION
========================================================= */

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


/* =========================================================
   CONNEXION ÉLÈVE
========================================================= */

$("eleve-connexion").addEventListener("click", async () => {

  const email = $("eleve-identifiant").value.trim();
  const password = $("eleve-motdepasse").value;

  if (!email || !password) {
    alert("Veuillez remplir l'adresse e-mail et le mot de passe.");
    return;
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const profile = await getCurrentProfile();

    if (!profile) {
      await signOut(auth);

      alert(
        "Aucun profil CRAFTNOTE n'a été trouvé pour ce compte."
      );

      return;
    }

    if (profile.role !== "student") {
      await signOut(auth);

      alert(
        "Ce compte n'est pas un compte élève."
      );

      return;
    }

    document.querySelector("#eleve .muted").textContent =
      `Bienvenue ${profile.nom || email}`;

    show("eleve");

  } catch (error) {

    console.error(error);

    afficherErreurConnexion(error);
  }
});


/* =========================================================
   CONNEXION PROFESSEUR
========================================================= */

$("prof-connexion").addEventListener("click", async () => {

  const email = $("prof-identifiant").value.trim();
  const password = $("prof-motdepasse").value;

  if (!email || !password) {
    alert("Veuillez remplir l'adresse e-mail et le mot de passe.");
    return;
  }

  try {

    await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    const profile = await getCurrentProfile();

    if (!profile) {
      await signOut(auth);

      alert(
        "Aucun profil CRAFTNOTE n'a été trouvé pour ce compte."
      );

      return;
    }

    if (profile.role !== "teacher") {
      await signOut(auth);

      alert(
        "Ce compte n'est pas un compte professeur."
      );

      return;
    }

    document.querySelector("#prof .muted").textContent =
      `Bienvenue ${profile.nom || email}`;

    show("prof");

  } catch (error) {

    console.error(error);

    afficherErreurConnexion(error);
  }
});


/* =========================================================
   ERREURS CONNEXION
========================================================= */

function afficherErreurConnexion(error) {

  if (error.code === "auth/invalid-credential") {
    alert("Adresse e-mail ou mot de passe incorrect.");
    return;
  }

  if (error.code === "auth/invalid-email") {
    alert("Adresse e-mail invalide.");
    return;
  }

  if (error.code === "auth/too-many-requests") {
    alert("Trop de tentatives. Réessayez plus tard.");
    return;
  }

  alert("Erreur lors de la connexion.");
}


/* =========================================================
   RÉCUPÉRER TOUS LES ÉLÈVES
========================================================= */

async function getStudents() {

  const profilesRef = collection(db, "profiles");

  const q = query(
    profilesRef,
    where("role", "==", "student")
  );

  const snapshot = await getDocs(q);

  const students = [];

  snapshot.forEach((document) => {

    const data = document.data();

    students.push({
      uid: document.id,
      email: data.email || "",
      nom: data.nom || data.email || "Élève"
    });

  });

  students.sort((a, b) =>
    a.nom.localeCompare(b.nom, "fr")
  );

  return students;
}


/* =========================================================
   FORMULAIRE AJOUTER UNE NOTE
========================================================= */

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
            <option value="">Chargement...</option>
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

      /*
        IMPORTANT :
        La valeur réelle est l'UID Firebase.
        Le professeur voit seulement le nom.
      */

      option.value = student.uid;
      option.textContent = student.nom;

      select.appendChild(option);
    });

  } catch (error) {

    console.error(error);

    select.innerHTML =
      `<option value="">Impossible de charger les élèves</option>`;

    return;
  }

  $("enregistrer-note").addEventListener(
    "click",
    enregistrerNote
  );
}


/* =========================================================
   ENREGISTRER LA NOTE
========================================================= */

async function enregistrerNote() {

  const eleveUid = $("note-eleve").value;
  const matiere = $("note-matiere").value.trim();
  const note = $("note-valeur").value.trim();
  const date = $("note-date").value;

  const message = $("note-message");

  if (!eleveUid || !matiere || !note || !date) {

    message.textContent =
      "⚠️ Remplis tous les champs.";

    return;
  }

  const user = auth.currentUser;

  if (!user) {

    message.textContent =
      "❌ Vous devez être connecté.";

    return;
  }

  try {

    /*
      Vérification du professeur
    */

    const profileProf = await getCurrentProfile();

    if (!profileProf) {

      message.textContent =
        "❌ Profil professeur introuvable.";

      return;
    }

    if (profileProf.role !== "teacher") {

      message.textContent =
        "❌ Vous n'avez pas les droits professeur.";

      return;
    }


    /*
      Vérification de l'élève
    */

    const eleveRef = doc(
      db,
      "profiles",
      eleveUid
    );

    const eleveSnap = await getDoc(eleveRef);

    if (!eleveSnap.exists()) {

      message.textContent =
        "❌ Élève introuvable.";

      return;
    }

    const eleve = eleveSnap.data();

    if (eleve.role !== "student") {

      message.textContent =
        "❌ Le compte sélectionné n'est pas un élève.";

      return;
    }


    /*
      Création de la note
    */

    await addDoc(
      collection(db, "grades"),
      {

        eleveUid: eleveUid,

        eleveEmail: eleve.email,

        eleveNom: eleve.nom,

        matiere: matiere,

        note: note,

        date: date,

        professeurUid: user.uid,

        professeur: profileProf.nom || user.email

      }
    );


    message.textContent =
      "✅ Note enregistrée pour cet élève.";

    $("note-matiere").value = "";
    $("note-valeur").value = "";
    $("note-date").value = "";

  } catch (error) {

    console.error(error);

    message.textContent =
      "❌ Impossible d'enregistrer la note.";

  }
}


/* =========================================================
   AFFICHER LES NOTES DE L'ÉLÈVE
========================================================= */

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

    /*
      IMPORTANT :
      On utilise l'UID Firebase du compte connecté.
      L'élève ne récupère donc que SES notes.
    */

    const gradesRef = collection(
      db,
      "grades"
    );

    const q = query(
      gradesRef,
      where(
        "eleveUid",
        "==",
        user.uid
      )
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

    snapshot.forEach((document) => {

      notes.push({
        id: document.id,
        ...document.data()
      });

    });


    /*
      Tri par date
    */

    notes.sort((a, b) =>
      String(b.date || "")
        .localeCompare(String(a.date || ""))
    );


    let html = `
      <strong>Mes notes</strong>
      <div class="notes-list">
    `;


    notes.forEach((note) => {

      html += `
        <div class="note-card">

          <strong>
            ${escapeHtml(note.matiere)}
          </strong>

          <br>

          Note :
          ${escapeHtml(note.note)}

          <br>

          Date :
          ${escapeHtml(formatDate(note.date))}

          <br>

          Professeur :
          ${escapeHtml(note.professeur)}

        </div>
      `;

    });


    html += `
      </div>
    `;


    result(
      "eleve-result",
      html
    );

  } catch (error) {

    console.error(error);

    result(
      "eleve-result",
      "❌ Impossible de charger les notes."
    );
  }
}


/* =========================================================
   AUTRES BOUTONS
========================================================= */

document.querySelectorAll("[data-page]").forEach((button) => {

  button.addEventListener("click", async () => {

    const page = button.dataset.page;

    const target =
      button.closest("#eleve")
        ? "eleve-result"
        : "prof-result";


    /* MES NOTES */

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


    /* AVERTISSEMENTS ÉLÈVE */

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


    /* SANCTIONS ÉLÈVE */

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


    /* AJOUT NOTE */

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
            placeholder="Motif de l'avertissement"
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


/* =========================================================
   DÉMARRAGE
========================================================= */

show("home");

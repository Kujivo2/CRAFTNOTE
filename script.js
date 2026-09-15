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

let auth = null;

// -----------------------------
// Navigation
// -----------------------------

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

// Boutons accueil
document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => {
    show(button.dataset.open);
  });
});

// Boutons retour
document.querySelectorAll("[data-back]").forEach((button) => {
  button.addEventListener("click", () => {
    show("home");
  });
});

// Déconnexion
document.querySelectorAll("[data-home]").forEach((button) => {
  button.addEventListener("click", async () => {
    if (auth) {
      try {
        await auth.signOut();
      } catch (error) {
        console.error(error);
      }
    }

    show("home");
  });
});

// -----------------------------
// Firebase
// -----------------------------

async function chargerFirebase() {
  try {
    const firebaseApp = await import(
      "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"
    );

    const firebaseAuth = await import(
      "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"
    );

    const firebaseConfig = {
      apiKey: "AIzaSyDiXTE9CYic8wruXrj2MJJeF78yI-0sGQ4",
      authDomain: "craftnote-5b31b.firebaseapp.com",
      projectId: "craftnote-5b31b",
      storageBucket: "craftnote-5b31b.firebasestorage.app",
      messagingSenderId: "911653521182",
      appId: "1:911653521182:web:79dcc4f55760ca6cfceb0f",
      measurementId: "G-XLL6X8L2B6"
    };

    const firebase = firebaseApp.initializeApp(firebaseConfig);

    auth = firebaseAuth.getAuth(firebase);

    return firebaseAuth;
  } catch (error) {
    console.error("Erreur Firebase :", error);
    return null;
  }
}

// On charge Firebase sans bloquer les boutons
const firebaseAuth = await chargerFirebase();

// -----------------------------
// Connexion élève
// -----------------------------

$("eleve-connexion").addEventListener("click", async () => {
  const email = $("eleve-identifiant").value.trim();
  const password = $("eleve-motdepasse").value;

  if (!email || !password) {
    alert("Veuillez renseigner votre adresse e-mail et votre mot de passe.");
    return;
  }

  if (!firebaseAuth || !auth) {
    alert("Firebase n'est pas disponible. Vérifie la configuration.");
    return;
  }

  try {
    await firebaseAuth.signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    show("eleve");
  } catch (error) {
    console.error(error);

    if (error.code === "auth/invalid-credential") {
      alert("Adresse e-mail ou mot de passe incorrect.");
    } else if (error.code === "auth/invalid-email") {
      alert("Adresse e-mail invalide.");
    } else {
      alert("Erreur de connexion Firebase.");
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
    alert("Veuillez renseigner votre adresse e-mail et votre mot de passe.");
    return;
  }

  if (!firebaseAuth || !auth) {
    alert("Firebase n'est pas disponible. Vérifie la configuration.");
    return;
  }

  try {
    await firebaseAuth.signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    show("prof");
  } catch (error) {
    console.error(error);

    if (error.code === "auth/invalid-credential") {
      alert("Adresse e-mail ou mot de passe incorrect.");
    } else if (error.code === "auth/invalid-email") {
      alert("Adresse e-mail invalide.");
    } else {
      alert("Erreur de connexion Firebase.");
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

// -----------------------------
// État de connexion
// -----------------------------

show("home");

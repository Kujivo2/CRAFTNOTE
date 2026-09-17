// Point d'entrée : navigation entre les écrans et branchement des boutons.

import { $, show, render } from "./utils.js";
import { login, logout } from "./auth.js";
import { showGradeForm, showMyGrades } from "./grades.js";
import { showRecordForm, showMyRecords } from "./records.js";

// Emploi du temps statique pour l'instant.
const SCHEDULE_HTML = `
  <strong>Emploi du temps</strong><br><br>
  Lundi — Français 08:00<br>
  Mardi — Mathématiques 10:00<br>
  Jeudi — Histoire 14:00
`;

// data-page -> action
const PAGES = {
  // Espace élève
  "notes-eleve": showMyGrades,
  "emploi": () => render("eleve-result", SCHEDULE_HTML),
  "avertissements-eleve": () => showMyRecords("avertissement"),
  "sanctions-eleve": () => showMyRecords("sanction"),
  "appreciations-eleve": () => showMyRecords("appreciation"),

  // Espace professeur
  "ajouter-note": showGradeForm,
  "appreciation": () => showRecordForm("appreciation"),
  "avertissement": () => showRecordForm("avertissement"),
  "sanction": () => showRecordForm("sanction"),
};

// Formulaires de connexion : préfixe des champs -> rôle et écran de destination.
const LOGIN_FORMS = [
  { prefix: "eleve", role: "student", screen: "eleve" },
  { prefix: "prof", role: "teacher", screen: "prof" },
];

document.querySelectorAll("[data-open]").forEach((button) => {
  button.addEventListener("click", () => show(button.dataset.open));
});

document.querySelectorAll("[data-back]").forEach((button) => {
  button.addEventListener("click", () => show("home"));
});

document.querySelectorAll("[data-home]").forEach((button) => {
  button.addEventListener("click", async () => {
    await logout();
    render("eleve-result", "");
    render("prof-result", "");
    show("home");
  });
});

document.querySelectorAll("[data-page]").forEach((button) => {
  button.addEventListener("click", () => PAGES[button.dataset.page]?.());
});

LOGIN_FORMS.forEach(({ prefix, role, screen }) => {
  $(`login-${prefix}-form`).addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = $(`${prefix}-identifiant`).value.trim();
    const password = $(`${prefix}-motdepasse`).value;

    try {
      const profile = await login(email, password, role);
      $(`${screen}-welcome`).textContent = `Bienvenue ${profile.nom || email}`;
      $(`${prefix}-motdepasse`).value = "";
      show(screen);
    } catch (error) {
      alert(error.message);
    }
  });
});

show("home");

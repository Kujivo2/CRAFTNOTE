// Notes : ajout par un professeur, consultation par l'élève.

import { $, render, escapeHtml, formatDate } from "./utils.js";
import { addStudentEntry, errorMessage, fillStudentSelect, getMyEntries } from "./students.js";

const COLLECTION = "grades";

export async function showGradeForm() {
  render("prof-result", `
    <strong>Ajouter une note</strong>

    <label>
      Élève
      <select id="note-eleve">
        <option value="">Chargement des élèves...</option>
      </select>
    </label>

    <label>
      Matière
      <input id="note-matiere" type="text" placeholder="Ex. Mathématiques">
    </label>

    <label>
      Note
      <input id="note-valeur" type="text" placeholder="Ex. 15/20">
    </label>

    <label>
      Date
      <input id="note-date" type="date">
    </label>

    <button id="note-enregistrer">Enregistrer la note</button>

    <p id="note-message"></p>
  `);

  if (await fillStudentSelect($("note-eleve"))) {
    $("note-enregistrer").addEventListener("click", saveGrade);
  }
}

async function saveGrade() {
  const eleveUid = $("note-eleve").value;
  const matiere = $("note-matiere").value.trim();
  const note = $("note-valeur").value.trim();
  const date = $("note-date").value;
  const message = $("note-message");
  const button = $("note-enregistrer");

  if (!eleveUid || !matiere || !note || !date) {
    message.textContent = "⚠️ Remplis tous les champs.";
    return;
  }

  button.disabled = true;

  try {
    const eleve = await addStudentEntry(COLLECTION, eleveUid, { matiere, note, date });

    message.textContent = `✅ Note enregistrée pour ${eleve.nom || "l'élève"}.`;
    $("note-matiere").value = "";
    $("note-valeur").value = "";
    $("note-date").value = "";
  } catch (error) {
    console.error(error);
    message.textContent = `❌ ${errorMessage(error, "Impossible d'enregistrer la note.")}`;
  } finally {
    button.disabled = false;
  }
}

export async function showMyGrades() {
  let html = "<strong>Mes notes</strong><br><br>";

  try {
    const notes = await getMyEntries(COLLECTION);

    if (notes.length === 0) {
      html += "Aucune note pour le moment.";
    }

    notes.forEach((note) => {
      html += `
        <div class="entry-card">
          <strong>${escapeHtml(note.matiere)}</strong><br>
          Note : ${escapeHtml(note.note)}<br>
          Date : ${escapeHtml(formatDate(note.date))}<br>
          Professeur : ${escapeHtml(note.professeur)}
        </div>
      `;
    });
  } catch (error) {
    console.error(error);
    html += `❌ ${errorMessage(error, "Impossible de charger les notes.")}`;
  }

  render("eleve-result", html);
}

// Appréciations, avertissements et sanctions : même fonctionnement,
// seule la collection Firestore et les libellés changent.

import { $, render, escapeHtml, formatDate } from "./utils.js";
import { addStudentEntry, errorMessage, fillStudentSelect, getMyEntries } from "./students.js";

export const RECORD_TYPES = {
  appreciation: {
    collection: "appreciations",
    title: "Appréciation",
    studentTitle: "Mes appréciations",
    placeholder: "Écrire une appréciation",
    success: "Appréciation enregistrée",
    empty: "Aucune appréciation.",
  },
  avertissement: {
    collection: "warnings",
    title: "Avertissement",
    studentTitle: "Mes avertissements",
    placeholder: "Motif de l’avertissement",
    success: "Avertissement enregistré",
    empty: "Aucun avertissement.",
  },
  sanction: {
    collection: "sanctions",
    title: "Sanction",
    studentTitle: "Mes sanctions",
    placeholder: "Motif de la sanction",
    success: "Sanction enregistrée",
    empty: "Aucune sanction.",
  },
};

export async function showRecordForm(type) {
  const record = RECORD_TYPES[type];

  render("prof-result", `
    <strong>${record.title}</strong>

    <label>
      Élève
      <select id="record-eleve">
        <option value="">Chargement des élèves...</option>
      </select>
    </label>

    <label>
      Date
      <input id="record-date" type="date">
    </label>

    <label>
      Texte
      <textarea id="record-texte" placeholder="${record.placeholder}"></textarea>
    </label>

    <button id="record-enregistrer">Enregistrer</button>

    <p id="record-message"></p>
  `);

  if (await fillStudentSelect($("record-eleve"))) {
    $("record-enregistrer").addEventListener("click", () => saveRecord(type));
  }
}

async function saveRecord(type) {
  const record = RECORD_TYPES[type];
  const eleveUid = $("record-eleve").value;
  const date = $("record-date").value;
  const texte = $("record-texte").value.trim();
  const message = $("record-message");
  const button = $("record-enregistrer");

  if (!eleveUid || !date || !texte) {
    message.textContent = "⚠️ Remplis tous les champs.";
    return;
  }

  button.disabled = true;

  try {
    const eleve = await addStudentEntry(record.collection, eleveUid, { texte, date });

    message.textContent = `✅ ${record.success} pour ${eleve.nom || "l'élève"}.`;
    $("record-texte").value = "";
    $("record-date").value = "";
  } catch (error) {
    console.error(error);
    message.textContent = `❌ ${errorMessage(error, "Impossible d'enregistrer.")}`;
  } finally {
    button.disabled = false;
  }
}

export async function showMyRecords(type) {
  const record = RECORD_TYPES[type];
  let html = `<strong>${record.studentTitle}</strong><br><br>`;

  try {
    const items = await getMyEntries(record.collection);

    if (items.length === 0) {
      html += record.empty;
    }

    items.forEach((item) => {
      html += `
        <div class="entry-card">
          <strong>${escapeHtml(formatDate(item.date))}</strong><br>
          ${escapeHtml(item.texte)}<br>
          Professeur : ${escapeHtml(item.professeur)}
        </div>
      `;
    });
  } catch (error) {
    console.error(error);
    html += `❌ ${errorMessage(error, "Impossible de charger les données.")}`;
  }

  render("eleve-result", html);
}

const $ = (id) => document.getElementById(id);
const screens = ['home','login-eleve','login-prof','eleve','prof'];
const data = { notes: ['Français : 16/20','Mathématiques : 14/20','Histoire : 15/20'], avertissements: ['Aucun avertissement.'], sanctions: ['Aucune sanction.'] };
function show(id) { screens.forEach(s => $(s).classList.toggle('hidden', s !== id)); }
function result(id, html) { $(id).innerHTML = html; }
document.querySelectorAll('[data-open]').forEach(b => b.onclick = () => show(b.dataset.open));
document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => show('home'));
document.querySelectorAll('[data-home]').forEach(b => b.onclick = () => show('home'));
$('eleve-connexion').onclick = () => {
  if ($('eleve-identifiant').value === 'leo' && $('eleve-motdepasse').value === 'demo') show('eleve');
  else alert('Identifiant ou mot de passe incorrect.');
};
$('prof-connexion').onclick = () => {
  if ($('prof-identifiant').value === 'prof' && $('prof-motdepasse').value === 'demo') show('prof');
  else alert('Identifiant ou mot de passe incorrect.');
};
document.querySelectorAll('[data-page]').forEach(b => b.onclick = () => {
  const page = b.dataset.page;
  const target = b.closest('#eleve') ? 'eleve-result' : 'prof-result';
  if (page === 'notes-eleve') result(target, '<strong>Mes notes</strong><br>' + data.notes.join('<br>'));
  if (page === 'emploi') result(target, '<strong>Emploi du temps</strong><br>Lundi — Français 08:00<br>Mardi — Mathématiques 10:00<br>Jeudi — Histoire 14:00');
  if (page === 'avertissements-eleve') result(target, '<strong>Mes avertissements</strong><br>' + data.avertissements.join('<br>'));
  if (page === 'sanctions-eleve') result(target, '<strong>Mes sanctions</strong><br>' + data.sanctions.join('<br>'));
  if (page === 'ajouter-note') result(target, '<strong>Ajouter une note</strong><br><input id="new-note" placeholder="Élève — Matière — Note"><button onclick="saveNote()">Enregistrer</button>');
  if (page === 'appreciation') result(target, '<strong>Appréciation</strong><br><textarea id="new-app" placeholder="Écrire une appréciation"></textarea><button onclick="saveText(\'Appréciation enregistrée.\')">Enregistrer</button>');
  if (page === 'avertissement') result(target, '<strong>Avertissement</strong><br><textarea id="new-warning" placeholder="Motif de l’avertissement"></textarea><button onclick="saveText(\'Avertissement enregistré.\')">Enregistrer</button>');
  if (page === 'sanction') result(target, '<strong>Sanction</strong><br><textarea id="new-sanction" placeholder="Motif de la sanction"></textarea><button onclick="saveText(\'Sanction enregistrée.\')">Enregistrer</button>');
});
window.saveNote = () => { const v = $('new-note').value.trim(); if(v) { data.notes.push(v); result('prof-result','Note enregistrée.'); } };
window.saveText = (msg) => result('prof-result', msg);

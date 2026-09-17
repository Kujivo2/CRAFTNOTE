// Petits outils d'affichage partagés par tous les modules.

export const $ = (id) => document.getElementById(id);

const SCREENS = ["home", "login-eleve", "login-prof", "eleve", "prof"];

export function show(id) {
  SCREENS.forEach((screen) => {
    $(screen)?.classList.toggle("hidden", screen !== id);
  });
}

export function render(id, html) {
  const element = $(id);
  if (element) element.innerHTML = html;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// "2026-09-17" -> "17/09/2026"
export function formatDate(date) {
  if (!date) return "Date inconnue";

  const parts = String(date).split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : String(date);
}

// Tri du plus récent au plus ancien (dates au format AAAA-MM-JJ).
export function byDateDesc(a, b) {
  return String(b.date || "").localeCompare(String(a.date || ""));
}

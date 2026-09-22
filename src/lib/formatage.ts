// Affichage en fr-FR (4.2). Virgule decimale, chiffres tabulaires dans les colonnes, dates et
// heures par `Intl` en Europe/Paris.
//
// C'est le SEUL endroit qui appelle `arrondir` : le domaine ne connait que des rationnels
// exacts, et l'arrondi n'arrive qu'ici, au dernier moment.

import { type Rationnel, arrondir, depuisEntier, multiplier } from '@/domain/rationnel';

const FUSEAU = 'Europe/Paris';

export const ABSENCE_DE_VALEUR = '—';

function nombre(valeur: number, decimales: number): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  }).format(valeur);
}

// Deux decimales pour une moyenne. `null` n'est pas zero : c'est « pas de moyenne ».
export function moyenneFr(moyenne: Rationnel | null): string {
  return moyenne === null ? ABSENCE_DE_VALEUR : nombre(arrondir(moyenne, 2), 2);
}

// Une note saisie 12,5 s'affiche 12,5, pas 12,50 : on ne rajoute pas une precision
// que le professeur n'a pas donnee.
export function noteFr(valeurCentiemes: number | null): string {
  if (valeurCentiemes === null) return ABSENCE_DE_VALEUR;

  const decimales = valeurCentiemes % 100 === 0 ? 0 : valeurCentiemes % 10 === 0 ? 1 : 2;
  return nombre(valeurCentiemes / 100, decimales);
}

export function pourcentageFr(fraction: Rationnel | null): string {
  if (fraction === null) return ABSENCE_DE_VALEUR;
  const centieme = arrondir(multiplier(fraction, depuisEntier(100)), 1);
  return `${nombre(centieme, centieme % 1 === 0 ? 0 : 1)} %`;
}

function parties(instant: Date, options: Intl.DateTimeFormatOptions): Map<string, string> {
  const formateur = new Intl.DateTimeFormat('fr-FR', { timeZone: FUSEAU, ...options });
  return new Map(formateur.formatToParts(instant).map((partie) => [partie.type, partie.value]));
}

// « 20h30 ». `Intl` fait la conversion de fuseau et les chiffres ; nous ne choisissons que le
// separateur, parce que le fr-FR rend « 20:30 » et que l'usage scolaire ecrit « 20h30 ».
export function heureFr(instant: Date): string {
  const champs = parties(instant, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${champs.get('hour') ?? '00'}h${champs.get('minute') ?? '00'}`;
}

// « vendredi 18 septembre »
export function dateFr(instant: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: FUSEAU,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(instant);
}

// « 18 sept. », pour les colonnes serrees
export function dateCourteFr(instant: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: FUSEAU,
    day: 'numeric',
    month: 'short',
  }).format(instant);
}

// « 30 min », « 1 h », « 1 h 30 ». Le comptage en demi-journees n'a aucun sens avec des cours
// de 30 minutes (4.3) : on affiche des minutes et des heures.
export function dureeFr(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;

  const heures = Math.floor(minutes / 60);
  const reste = minutes % 60;
  return reste === 0 ? `${heures} h` : `${heures} h ${String(reste).padStart(2, '0')}`;
}

// « aucune absence » plutot qu'un zero masque (3). Le zero s'ecrit, il ne disparait pas.
export function compteFr(
  nombreDe: number,
  singulier: string,
  pluriel: string,
  genre: 'masculin' | 'feminin' = 'masculin',
): string {
  if (nombreDe === 0) return `${genre === 'feminin' ? 'aucune' : 'aucun'} ${singulier}`;
  return `${nombreDe} ${nombreDe === 1 ? singulier : pluriel}`;
}

// Lecture d'une note tapee par un professeur : « 14,5 », « 14.5 », « 14 », « » ou du bruit.
// La virgule ET le point sont acceptes : on saisit au pave numerique, qui produit un point.
//
// Rend `null` pour une saisie vide, et `undefined` pour une saisie qu'on ne sait pas lire --
// les deux ne se confondent jamais, l'une efface la note et l'autre doit etre refusee.
export function noteEnCentiemes(texte: string): number | null | undefined {
  const propre = texte.trim().replace(',', '.');
  if (propre === '') return null;
  if (!/^\d+(\.\d{1,2})?$/.test(propre)) return undefined;

  // Passage par les centiemes sans jamais manipuler le flottant plus loin que cette ligne :
  // Math.round ferme la porte au 14.499999999999998 (4.1).
  return Math.round(Number(propre) * 100);
}

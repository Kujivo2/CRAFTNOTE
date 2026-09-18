// Moyennes. Une valeur de note est un entier de centiemes : 14,50 vaut 1450, un bareme sur 20
// vaut 2000. Une moyenne est un rationnel exact exprime en points sur 20.
//
// `null` signifie « pas de moyenne ». Ce n'est pas zero, et ce n'est jamais NaN.

import {
  type Rationnel,
  ZERO,
  additionner,
  depuisEntier,
  diviserParEntier,
  multiplier,
  rationnel,
} from './rationnel';
import type { OptionsCalcul, StatutNote } from './types';

export type NoteCalculable = {
  readonly valeurCentiemes: number | null;
  readonly baremeCentiemes: number;
  readonly coefficient: number;
  readonly statut: StatutNote;
  readonly priseEnCompte: boolean;
};

export type MoyenneDeMatiere = {
  readonly moyenne: Rationnel | null;
  readonly coefficient: number;
};

export function estRetenue(note: NoteCalculable, options: OptionsCalcul): boolean {
  if (!note.priseEnCompte) return false;
  if (note.baremeCentiemes <= 0 || note.coefficient <= 0) return false;

  switch (note.statut) {
    case 'notee':
      return note.valeurCentiemes !== null;
    case 'absent':
      return options.absentCompteZero;
    case 'nonRendu':
      return options.nonRenduCompteZero;
    case 'dispense':
    case 'nonNotee':
      return false;
  }
}

// Un absent ou un non rendu retenus comptent zero ; seul un `notee` porte une valeur.
function valeurRetenue(note: NoteCalculable): number {
  return note.statut === 'notee' ? (note.valeurCentiemes ?? 0) : 0;
}

// La note ramenee sur 20, exacte : valeur / bareme x 20, les deux etant en centiemes.
function surVingt(note: NoteCalculable): Rationnel {
  return rationnel(valeurRetenue(note) * 20, note.baremeCentiemes);
}

export function moyenneMatiere(
  notes: readonly NoteCalculable[],
  options: OptionsCalcul,
): Rationnel | null {
  let numerateur = ZERO;
  let sommeCoefficients = 0;

  for (const note of notes) {
    if (!estRetenue(note, options)) continue;
    numerateur = additionner(numerateur, multiplier(surVingt(note), depuisEntier(note.coefficient)));
    sommeCoefficients += note.coefficient;
  }

  if (sommeCoefficients === 0) return null;
  return diviserParEntier(numerateur, sommeCoefficients);
}

// La moyenne generale n'est pas la moyenne de toutes les notes, ni la moyenne non ponderee des
// moyennes de matieres : une matiere sans moyenne sort du numerateur ET du denominateur.
export function moyenneGenerale(matieres: readonly MoyenneDeMatiere[]): Rationnel | null {
  let numerateur = ZERO;
  let sommeCoefficients = 0;

  for (const matiere of matieres) {
    if (matiere.moyenne === null || matiere.coefficient <= 0) continue;
    numerateur = additionner(
      numerateur,
      multiplier(matiere.moyenne, depuisEntier(matiere.coefficient)),
    );
    sommeCoefficients += matiere.coefficient;
  }

  if (sommeCoefficients === 0) return null;
  return diviserParEntier(numerateur, sommeCoefficients);
}

// Moyenne des moyennes des eleves, et non moyenne de toutes les notes : les deux different des
// qu'un eleve a manque une evaluation. Desactivee par defaut a l'affichage (options
// d'etablissement) parce qu'avec quatre eleves elle designe des personnes.
export function moyenneGroupeMatiere(
  moyennesDesEleves: readonly (Rationnel | null)[],
): Rationnel | null {
  let numerateur = ZERO;
  let nombre = 0;

  for (const moyenne of moyennesDesEleves) {
    if (moyenne === null) continue;
    numerateur = additionner(numerateur, moyenne);
    nombre += 1;
  }

  if (nombre === 0) return null;
  return diviserParEntier(numerateur, nombre);
}

// Existe, desactive par defaut : « 2e sur 4 » n'informe personne.
export function rangDansGroupe(
  moyenneEleve: Rationnel | null,
  moyennesDuGroupe: readonly (Rationnel | null)[],
): { readonly rang: number; readonly sur: number } | null {
  if (moyenneEleve === null) return null;

  const classees = moyennesDuGroupe.filter((m): m is Rationnel => m !== null);
  if (classees.length === 0) return null;

  const strictementMeilleures = classees.filter(
    (m) => m.n * moyenneEleve.d > moyenneEleve.n * m.d,
  ).length;

  return { rang: strictementMeilleures + 1, sur: classees.length };
}

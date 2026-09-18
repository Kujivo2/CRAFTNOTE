// Mentions du bilan.
//
// L'application SUGGERE selon des seuils parametrables, et ne pre-remplit jamais : c'est le
// conseil qui tranche. Le nom de la fonction et son type de retour disent exactement ca — elle
// rend des propositions motivees, pas des mentions attribuees.

import { type Rationnel, comparer, rationnel } from './rationnel';
import type { Compteurs } from './compteurs';
import type { Mention } from './types';

export type Seuils = {
  readonly felicitations: number; // en points sur 20
  readonly compliments: number;
  readonly encouragements: number;
  readonly avertissementTravail: number;
  readonly absencesNonJustifieesAlerte: number;
  readonly retardsAlerte: number;
  readonly sanctionsAlerte: number;
};

export const SEUILS_PAR_DEFAUT: Seuils = {
  felicitations: 16,
  compliments: 14,
  encouragements: 12,
  avertissementTravail: 8,
  absencesNonJustifieesAlerte: 3,
  retardsAlerte: 5,
  sanctionsAlerte: 1,
};

export type Suggestion = {
  readonly mention: Mention;
  readonly motif: string;
};

// Le vrai formatage francais vit dans lib/formatage.ts ; le domaine n'en a besoin que pour
// ecrire un seuil dans un motif, et n'importe pas la couche d'affichage pour autant.
function seuilEnFrancais(valeur: number): string {
  return String(valeur).replace('.', ',');
}

// Les seuils sont saisis en points sur 20, avec deux decimales au plus : on les ramene a un
// rationnel exact pour que la comparaison ne repasse jamais par un flottant.
function auMoins(moyenne: Rationnel, seuil: number): boolean {
  return comparer(moyenne, rationnel(Math.round(seuil * 100), 100)) >= 0;
}

function total(parType: Readonly<Record<string, number>>): number {
  return Object.values(parType).reduce((somme, nombre) => somme + nombre, 0);
}

export function suggererMentions(
  moyenne: Rationnel | null,
  compteurs: Compteurs,
  seuils: Seuils = SEUILS_PAR_DEFAUT,
): readonly Suggestion[] {
  const suggestions: Suggestion[] = [];

  if (moyenne !== null) {
    if (auMoins(moyenne, seuils.felicitations)) {
      suggestions.push({
        mention: 'felicitations',
        motif: `Moyenne generale a ${seuilEnFrancais(seuils.felicitations)} ou au-dessus.`,
      });
    } else if (auMoins(moyenne, seuils.compliments)) {
      suggestions.push({
        mention: 'compliments',
        motif: `Moyenne generale a ${seuilEnFrancais(seuils.compliments)} ou au-dessus.`,
      });
    } else if (auMoins(moyenne, seuils.encouragements)) {
      suggestions.push({
        mention: 'encouragements',
        motif: `Moyenne generale a ${seuilEnFrancais(seuils.encouragements)} ou au-dessus.`,
      });
    }

    if (!auMoins(moyenne, seuils.avertissementTravail)) {
      suggestions.push({
        mention: 'avertissementTravail',
        motif: `Moyenne generale sous ${seuilEnFrancais(seuils.avertissementTravail)}.`,
      });
    }
  }

  if (compteurs.manqueesNonJustifiees >= seuils.absencesNonJustifieesAlerte) {
    suggestions.push({
      mention: 'avertissementAssiduite',
      motif: `${compteurs.manqueesNonJustifiees} seances manquees non justifiees.`,
    });
  } else if (compteurs.retards >= seuils.retardsAlerte) {
    suggestions.push({
      mention: 'avertissementAssiduite',
      motif: `${compteurs.retards} retards sur la periode.`,
    });
  }

  const sanctions = total(compteurs.sanctionsParType);
  if (sanctions >= seuils.sanctionsAlerte) {
    suggestions.push({
      mention: 'avertissementComportement',
      motif: sanctions === 1 ? 'Une sanction prononcee.' : `${sanctions} sanctions prononcees.`,
    });
  }

  return suggestions;
}

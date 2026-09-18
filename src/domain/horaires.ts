// Horaires d'une soiree. La fonction la plus testee du projet (5).
//
// Les horaires ne sont JAMAIS stockes : ils se calculent depuis l'heure de debut reelle, les
// durees de la grille et les ajustements. Toute autre source d'horaire dans l'application est un
// bogue en attente.

import { instantDepuisHeureLocale } from './fuseau';

export type TypeCreneau = 'accueil' | 'cours' | 'pause' | 'libre';

export type CreneauGrille = {
  readonly id: string;
  readonly ordre: number;
  readonly type: TypeCreneau;
  readonly libelle: string;
  readonly libelleFictif?: string;
  readonly dureeMinutes: number; // 0 : creneau ouvert, sans fin, pour le temps libre
};

export type Ajustement =
  // Geste 2 du 5 : « decaler a partir de maintenant ». Ce creneau et tous les suivants glissent.
  | { readonly type: 'depuisCreneau'; readonly creneauId: string; readonly minutes: number }
  // Geste 3 : allonger ou raccourcir un creneau en direct. Tout ce qui suit se decale d'autant.
  | { readonly type: 'dureeCreneau'; readonly creneauId: string; readonly dureeMinutes: number };

export type Soiree = {
  readonly date: string; // « 2026-09-18 », le jour de RP, qui ne change pas apres minuit
  readonly heureDebut: string; // « 20:00 », heure murale a Paris. Geste 1 : on modifie ce champ
  readonly annulee: boolean;
};

export type CreneauCalcule = {
  readonly creneau: CreneauGrille;
  readonly debut: Date;
  readonly fin: Date | null; // null pour un creneau ouvert
  readonly decaleDeMinutes: number; // ecart du debut par rapport a la grille de reference
};

function dureesEffectives(
  grille: readonly CreneauGrille[],
  ajustements: readonly Ajustement[],
): ReadonlyMap<string, number> {
  const durees = new Map<string, number>();
  for (const creneau of grille) durees.set(creneau.id, creneau.dureeMinutes);
  for (const ajustement of ajustements) {
    if (ajustement.type === 'dureeCreneau') {
      durees.set(ajustement.creneauId, Math.max(0, ajustement.dureeMinutes));
    }
  }
  return durees;
}

function decalagesCumules(ajustements: readonly Ajustement[]): ReadonlyMap<string, number> {
  const decalages = new Map<string, number>();
  for (const ajustement of ajustements) {
    if (ajustement.type === 'depuisCreneau') {
      // Deux decalages sur le meme creneau s'additionnent : le serveur peut planter deux fois.
      decalages.set(ajustement.creneauId, (decalages.get(ajustement.creneauId) ?? 0) + ajustement.minutes);
    }
  }
  return decalages;
}

export function horairesSoiree(
  soiree: Soiree,
  grille: readonly CreneauGrille[],
  ajustements: readonly Ajustement[] = [],
): readonly CreneauCalcule[] {
  const ordonnes = [...grille].sort((a, b) => a.ordre - b.ordre);
  const durees = dureesEffectives(ordonnes, ajustements);
  const decalages = decalagesCumules(ajustements);

  let curseur = instantDepuisHeureLocale(soiree.date, soiree.heureDebut).getTime();
  let decalageCourant = 0;
  const calcules: CreneauCalcule[] = [];

  for (const creneau of ordonnes) {
    const glissement = decalages.get(creneau.id) ?? 0;
    if (glissement !== 0) {
      curseur += glissement * 60_000;
      decalageCourant += glissement;
    }

    const duree = durees.get(creneau.id) ?? creneau.dureeMinutes;
    const ouvert = duree <= 0;
    const debut = new Date(curseur);
    const fin = ouvert ? null : new Date(curseur + duree * 60_000);

    calcules.push({ creneau, debut, fin, decaleDeMinutes: decalageCourant });

    // Un creneau ouvert n'a pas de fin : rien ne peut le suivre, le curseur ne bouge plus.
    if (!ouvert) {
      curseur += duree * 60_000;
      decalageCourant += duree - creneau.dureeMinutes;
    }
  }

  return calcules;
}

// Une soiree annulee garde ses horaires affichables, mais ne doit aucune seance a personne :
// c'est `compteursPeriode` qui en tient compte, pas cette fonction.
export function creneauEnCours(
  calcules: readonly CreneauCalcule[],
  instant: Date,
): CreneauCalcule | null {
  const maintenant = instant.getTime();
  for (const calcule of calcules) {
    const commence = calcule.debut.getTime() <= maintenant;
    const pasFini = calcule.fin === null || calcule.fin.getTime() > maintenant;
    if (commence && pasFini) return calcule;
  }
  return null;
}

// Compteurs de la periode (4.3).
//
// Une seule fonction pure produit tous les compteurs d'un eleve, et sert au pied de bilan, a la
// fiche eleve, au tableau du CPE et a la preparation du conseil. S'il en existe un jour une
// seconde, deux ecrans afficheront deux verites.
//
// Le comptage en demi-journees n'a aucun sens avec des cours de 30 minutes : on compte des
// seances, des minutes et des actes.

import { type Rationnel, rationnel } from './rationnel';
import type { CategorieMesure, StatutPresence, StatutRetenue } from './types';

export type SeanceRelevee = {
  readonly id: string;
  readonly soireeAnnulee: boolean;
  readonly dureeMinutes: number;
};

export type PresenceRelevee = {
  readonly seanceId: string;
  readonly statut: StatutPresence;
  readonly minutesRetard: number;
};

export type AbsenceRelevee = {
  readonly seanceId?: string;
  readonly dureeMinutes: number;
  readonly justifiee: boolean;
};

export type RetenueRelevee = {
  readonly id: string;
  readonly statut: StatutRetenue;
  readonly reporteeDepuisId?: string;
};

export type MesureRelevee = {
  readonly categorie: CategorieMesure;
  readonly type: string;
};

export type EntreeCompteurs = {
  readonly seances: readonly SeanceRelevee[];
  readonly presences: readonly PresenceRelevee[];
  readonly absences: readonly AbsenceRelevee[];
  readonly retenues: readonly RetenueRelevee[];
  readonly mesures: readonly MesureRelevee[];
};

export type Compteurs = {
  readonly seancesDues: number;
  readonly seancesManquees: number;
  readonly manqueesJustifiees: number;
  readonly manqueesNonJustifiees: number;
  readonly minutesManquees: number;
  readonly retards: number;
  readonly minutesRetard: number;
  readonly tauxPresence: Rationnel | null; // fraction entre 0 et 1, null si aucune seance due
  readonly retenuesEffectuees: number;
  readonly retenuesNonEffectuees: number;
  readonly punitionsParType: Readonly<Record<string, number>>;
  readonly sanctionsParType: Readonly<Record<string, number>>;
};

// Une soiree annulee ne doit de seance a personne : ses seances sortent du denominateur.
function seancesDues(seances: readonly SeanceRelevee[]): ReadonlyMap<string, SeanceRelevee> {
  return new Map(seances.filter((seance) => !seance.soireeAnnulee).map((seance) => [seance.id, seance]));
}

function justificationsParSeance(absences: readonly AbsenceRelevee[]): ReadonlyMap<string, boolean> {
  const justifiees = new Map<string, boolean>();
  for (const absence of absences) {
    if (absence.seanceId === undefined) continue;
    const deja = justifiees.get(absence.seanceId) ?? false;
    justifiees.set(absence.seanceId, deja || absence.justifiee);
  }
  return justifiees;
}

// Une retenue reportee n'est comptee qu'une fois : seule la derniere de la chaine compte,
// les precedentes ayant ete remplacees.
function retenuesNonRemplacees(retenues: readonly RetenueRelevee[]): readonly RetenueRelevee[] {
  const remplacees = new Set<string>();
  for (const retenue of retenues) {
    if (retenue.reporteeDepuisId !== undefined) remplacees.add(retenue.reporteeDepuisId);
  }
  return retenues.filter((retenue) => !remplacees.has(retenue.id));
}

// Punitions et sanctions ne se melangent jamais : trois colles et trois blames ne font pas six.
function compterParType(
  mesures: readonly MesureRelevee[],
  categorie: CategorieMesure,
): Record<string, number> {
  const total: Record<string, number> = {};
  for (const mesure of mesures) {
    if (mesure.categorie !== categorie) continue;
    total[mesure.type] = (total[mesure.type] ?? 0) + 1;
  }
  return total;
}

export function compteursPeriode(entree: EntreeCompteurs): Compteurs {
  const dues = seancesDues(entree.seances);
  const justifiees = justificationsParSeance(entree.absences);

  let seancesManquees = 0;
  let manqueesJustifiees = 0;
  let minutesManquees = 0;
  let retards = 0;
  let minutesRetard = 0;

  for (const presence of entree.presences) {
    const seance = dues.get(presence.seanceId);
    if (seance === undefined) continue; // seance d'une soiree annulee, ou inconnue

    switch (presence.statut) {
      case 'absent':
        seancesManquees += 1;
        minutesManquees += seance.dureeMinutes;
        if (justifiees.get(presence.seanceId) === true) manqueesJustifiees += 1;
        break;
      case 'retard':
        // Un eleve en retard est present : les deux compteurs sont independants.
        retards += 1;
        minutesRetard += presence.minutesRetard;
        break;
      case 'present':
      case 'enRetenue':
        // Une retenue sur un creneau de cours ne degrade pas le taux de presence (4.5).
        break;
    }
  }

  // Une absence saisie sans seance rattachee ajoute sa duree, mais pas de seance manquee :
  // on ne sait pas quelles seances elle recouvre.
  for (const absence of entree.absences) {
    if (absence.seanceId === undefined) minutesManquees += absence.dureeMinutes;
  }

  const retenues = retenuesNonRemplacees(entree.retenues);
  const nombreDues = dues.size;

  return {
    seancesDues: nombreDues,
    seancesManquees,
    manqueesJustifiees,
    manqueesNonJustifiees: seancesManquees - manqueesJustifiees,
    minutesManquees,
    retards,
    minutesRetard,
    tauxPresence: nombreDues === 0 ? null : rationnel(nombreDues - seancesManquees, nombreDues),
    retenuesEffectuees: retenues.filter((r) => r.statut === 'effectuee').length,
    retenuesNonEffectuees: retenues.filter((r) => r.statut === 'nonEffectuee').length,
    punitionsParType: compterParType(entree.mesures, 'punition'),
    sanctionsParType: compterParType(entree.mesures, 'sanction'),
  };
}

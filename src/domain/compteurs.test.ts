import { describe, expect, it } from 'vitest';
import { arrondir, depuisEntier, multiplier } from './rationnel';
import { type EntreeCompteurs, compteursPeriode } from './compteurs';

const VIDE: EntreeCompteurs = {
  seances: [],
  presences: [],
  absences: [],
  retenues: [],
  mesures: [],
};

function troisSeances() {
  return [
    { id: 's1', soireeAnnulee: false, dureeMinutes: 30 },
    { id: 's2', soireeAnnulee: false, dureeMinutes: 30 },
    { id: 's3', soireeAnnulee: false, dureeMinutes: 30 },
  ];
}

function tauxEnPourcentage(taux: ReturnType<typeof compteursPeriode>['tauxPresence']): number | null {
  return taux === null ? null : arrondir(multiplier(taux, depuisEntier(100)), 1);
}

describe('retards et absences sont independants', () => {
  it('un retard ne cree aucune absence et ne touche pas au taux de presence', () => {
    const compteurs = compteursPeriode({
      ...VIDE,
      seances: troisSeances(),
      presences: [{ seanceId: 's1', statut: 'retard', minutesRetard: 10 }],
    });

    expect(compteurs.retards).toBe(1);
    expect(compteurs.minutesRetard).toBe(10);
    expect(compteurs.seancesManquees).toBe(0);
    expect(tauxEnPourcentage(compteurs.tauxPresence)).toBe(100);
  });

  it('separe les seances manquees justifiees des autres', () => {
    const compteurs = compteursPeriode({
      ...VIDE,
      seances: troisSeances(),
      presences: [
        { seanceId: 's1', statut: 'absent', minutesRetard: 0 },
        { seanceId: 's2', statut: 'absent', minutesRetard: 0 },
      ],
      absences: [{ seanceId: 's1', dureeMinutes: 30, justifiee: true }],
    });

    expect(compteurs.seancesManquees).toBe(2);
    expect(compteurs.manqueesJustifiees).toBe(1);
    expect(compteurs.manqueesNonJustifiees).toBe(1);
    expect(compteurs.minutesManquees).toBe(60);
  });
});

describe('une soiree annulee ne penalise personne', () => {
  it('ne doit aucune seance et ne degrade pas le taux', () => {
    const compteurs = compteursPeriode({
      ...VIDE,
      seances: [
        { id: 's1', soireeAnnulee: false, dureeMinutes: 30 },
        { id: 's2', soireeAnnulee: true, dureeMinutes: 30 },
      ],
      presences: [{ seanceId: 's2', statut: 'absent', minutesRetard: 0 }],
    });

    expect(compteurs.seancesDues).toBe(1);
    expect(compteurs.seancesManquees).toBe(0);
    expect(tauxEnPourcentage(compteurs.tauxPresence)).toBe(100);
  });
});

describe('retenue sur un creneau de cours', () => {
  it('n est pas une absence et laisse le taux de presence intact', () => {
    const compteurs = compteursPeriode({
      ...VIDE,
      seances: troisSeances(),
      presences: [{ seanceId: 's2', statut: 'enRetenue', minutesRetard: 0 }],
    });

    expect(compteurs.seancesManquees).toBe(0);
    expect(compteurs.retards).toBe(0);
    expect(tauxEnPourcentage(compteurs.tauxPresence)).toBe(100);
  });
});

describe('retenues reportees', () => {
  it('ne compte qu une fois une retenue reportee puis effectuee', () => {
    const compteurs = compteursPeriode({
      ...VIDE,
      retenues: [
        { id: 'r1', statut: 'reportee' },
        { id: 'r2', statut: 'effectuee', reporteeDepuisId: 'r1' },
      ],
    });

    expect(compteurs.retenuesEffectuees).toBe(1);
    expect(compteurs.retenuesNonEffectuees).toBe(0);
  });

  it('compte une retenue jamais effectuee une seule fois', () => {
    const compteurs = compteursPeriode({
      ...VIDE,
      retenues: [{ id: 'r1', statut: 'nonEffectuee' }],
    });

    expect(compteurs.retenuesEffectuees).toBe(0);
    expect(compteurs.retenuesNonEffectuees).toBe(1);
  });
});

describe('punitions et sanctions ne se melangent jamais', () => {
  it('garde deux comptes separes, jamais un total', () => {
    const compteurs = compteursPeriode({
      ...VIDE,
      mesures: [
        { categorie: 'punition', type: 'retenue' },
        { categorie: 'punition', type: 'retenue' },
        { categorie: 'punition', type: 'retenue' },
        { categorie: 'sanction', type: 'blame' },
        { categorie: 'sanction', type: 'blame' },
        { categorie: 'sanction', type: 'blame' },
      ],
    });

    expect(compteurs.punitionsParType).toEqual({ retenue: 3 });
    expect(compteurs.sanctionsParType).toEqual({ blame: 3 });
    expect(compteurs.punitionsParType.blame).toBeUndefined();
    expect(compteurs.sanctionsParType.retenue).toBeUndefined();
  });
});

describe('cas vides', () => {
  it('rend des zeros francs pour un eleve sans histoire', () => {
    const compteurs = compteursPeriode({ ...VIDE, seances: troisSeances() });

    expect(compteurs.seancesManquees).toBe(0);
    expect(compteurs.retards).toBe(0);
    expect(compteurs.retenuesEffectuees).toBe(0);
    expect(compteurs.punitionsParType).toEqual({});
    expect(tauxEnPourcentage(compteurs.tauxPresence)).toBe(100);
  });

  it('rend un taux nul et non zero pourcent quand aucune seance n est due', () => {
    expect(compteursPeriode(VIDE).tauxPresence).toBeNull();
  });

  it('compte une absence saisie sans seance rattachee en minutes seulement', () => {
    const compteurs = compteursPeriode({
      ...VIDE,
      seances: troisSeances(),
      absences: [{ dureeMinutes: 90, justifiee: false }],
    });

    expect(compteurs.minutesManquees).toBe(90);
    expect(compteurs.seancesManquees).toBe(0);
  });
});

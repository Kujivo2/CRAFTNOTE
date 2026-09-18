import { describe, expect, it } from 'vitest';
import { enHeureLocale, instantDepuisHeureLocale } from './fuseau';
import {
  type Ajustement,
  type CreneauGrille,
  creneauEnCours,
  horairesSoiree,
} from './horaires';

// La grille de reference du 5.
const GRILLE: readonly CreneauGrille[] = [
  { id: 'connexion', ordre: 1, type: 'accueil', libelle: 'Connexion', dureeMinutes: 30 },
  { id: 'cours1', ordre: 2, type: 'cours', libelle: 'Cours 1', dureeMinutes: 30 },
  { id: 'recreation', ordre: 3, type: 'pause', libelle: 'Recreation', dureeMinutes: 15 },
  { id: 'cours2', ordre: 4, type: 'cours', libelle: 'Cours 2', dureeMinutes: 30 },
  { id: 'cantine', ordre: 5, type: 'pause', libelle: 'Pause cantine', dureeMinutes: 45 },
  { id: 'cours3', ordre: 6, type: 'cours', libelle: 'Cours 3', dureeMinutes: 30 },
  { id: 'libre', ordre: 7, type: 'libre', libelle: 'Temps libre', dureeMinutes: 0 },
];

const SOIREE = { date: '2026-09-18', heureDebut: '20:00', annulee: false };

function heures(
  ajustements: readonly Ajustement[] = [],
  soiree = SOIREE,
): Record<string, string> {
  const calcules = horairesSoiree(soiree, GRILLE, ajustements);
  return Object.fromEntries(
    calcules.map((c) => [c.creneau.id, enHeureLocale(c.debut).heure]),
  );
}

describe('grille de reference', () => {
  it('pose les horaires habituels a partir de 20h00', () => {
    expect(heures()).toEqual({
      connexion: '20:00',
      cours1: '20:30',
      recreation: '21:00',
      cours2: '21:15',
      cantine: '21:45',
      cours3: '22:30',
      libre: '23:00',
    });
  });

  it('laisse le temps libre sans fin', () => {
    const calcules = horairesSoiree(SOIREE, GRILLE, []);
    expect(calcules.at(-1)?.fin).toBeNull();
    expect(calcules.at(0)?.fin).not.toBeNull();
  });

  it('suit une soiree de week-end commencee plus tot', () => {
    const tot = { date: '2026-09-19', heureDebut: '19:30', annulee: false };
    expect(heures([], tot).cours3).toBe('22:00');
  });
});

describe('les trois gestes du 5', () => {
  it('geste 1 : decaler toute la soiree par l heure de debut', () => {
    const decalee = { date: '2026-09-18', heureDebut: '20:20', annulee: false };
    expect(heures([], decalee).cours3).toBe('22:50');
  });

  it('geste 2 : decaler a partir de maintenant, sans toucher au passe', () => {
    const resultat = heures([{ type: 'depuisCreneau', creneauId: 'cours2', minutes: 15 }]);
    expect(resultat.connexion).toBe('20:00');
    expect(resultat.cours1).toBe('20:30');
    expect(resultat.recreation).toBe('21:00');
    expect(resultat.cours2).toBe('21:30');
    expect(resultat.cours3).toBe('22:45');
  });

  it('geste 3 : allonger un creneau en direct decale la suite d autant', () => {
    const resultat = heures([{ type: 'dureeCreneau', creneauId: 'cantine', dureeMinutes: 60 }]);
    expect(resultat.cours2).toBe('21:15');
    expect(resultat.cantine).toBe('21:45');
    expect(resultat.cours3).toBe('22:45');
  });

  it('cumule deux ajustements successifs, le serveur pouvant planter deux fois', () => {
    const resultat = heures([
      { type: 'depuisCreneau', creneauId: 'cours2', minutes: 10 },
      { type: 'depuisCreneau', creneauId: 'cours3', minutes: 5 },
    ]);
    expect(resultat.cours2).toBe('21:25');
    expect(resultat.cours3).toBe('22:45');
  });

  it('additionne deux decalages poses sur le meme creneau', () => {
    const resultat = heures([
      { type: 'depuisCreneau', creneauId: 'cours2', minutes: 10 },
      { type: 'depuisCreneau', creneauId: 'cours2', minutes: 5 },
    ]);
    expect(resultat.cours2).toBe('21:30');
  });

  it('rend l ecart au format attendu par l affichage', () => {
    const calcules = horairesSoiree(
      SOIREE,
      GRILLE,
      [{ type: 'depuisCreneau', creneauId: 'cours2', minutes: 15 }],
    );
    const parId = new Map(calcules.map((c) => [c.creneau.id, c.decaleDeMinutes]));
    expect(parId.get('cours1')).toBe(0);
    expect(parId.get('cours2')).toBe(15);
    expect(parId.get('cours3')).toBe(15);
  });
});

describe('cas limites', () => {
  it('rend quand meme les horaires d une soiree annulee', () => {
    const annulee = { date: '2026-09-18', heureDebut: '20:00', annulee: true };
    expect(horairesSoiree(annulee, GRILLE, [])).toHaveLength(GRILLE.length);
  });

  it('remonte les creneaux suivants quand la grille en perd un', () => {
    const sansCours2 = GRILLE.filter((c) => c.id !== 'cours2');
    const calcules = horairesSoiree(SOIREE, sansCours2, []);
    const cantine = calcules.find((c) => c.creneau.id === 'cantine');
    expect(enHeureLocale(cantine?.debut ?? new Date(0)).heure).toBe('21:15');
  });

  it('respecte l ordre declare et non l ordre du tableau', () => {
    const melangee = [...GRILLE].reverse();
    const calcules = horairesSoiree(SOIREE, melangee, []);
    expect(calcules.at(0)?.creneau.id).toBe('connexion');
  });

  it('garde la soiree du 4 octobre sur son jour alors que le cours 3 tombe le 5', () => {
    const tardive = { date: '2026-10-04', heureDebut: '22:00', annulee: false };
    const calcules = horairesSoiree(tardive, GRILLE, []);
    const cours3 = calcules.find((c) => c.creneau.id === 'cours3');
    const local = enHeureLocale(cours3?.debut ?? new Date(0));

    expect(local.heure).toBe('00:30');
    expect(local.date).toBe('2026-10-05');
    expect(tardive.date).toBe('2026-10-04');
  });
});

describe('fuseau Europe/Paris', () => {
  it('applique l heure d ete en septembre', () => {
    expect(instantDepuisHeureLocale('2026-09-18', '20:00').toISOString()).toBe(
      '2026-09-18T18:00:00.000Z',
    );
  });

  it('applique l heure d hiver en novembre', () => {
    expect(instantDepuisHeureLocale('2026-11-18', '20:00').toISOString()).toBe(
      '2026-11-18T19:00:00.000Z',
    );
  });

  it('refuse une date ou une heure mal formee plutot que de deviner', () => {
    expect(() => instantDepuisHeureLocale('18/09/2026', '20:00')).toThrow();
    expect(() => instantDepuisHeureLocale('2026-09-18', '25:00')).toThrow();
  });
});

describe('creneau en cours', () => {
  it('trouve le creneau qui contient l instant', () => {
    const calcules = horairesSoiree(SOIREE, GRILLE, []);
    const pendantLaRecreation = instantDepuisHeureLocale('2026-09-18', '21:05');
    expect(creneauEnCours(calcules, pendantLaRecreation)?.creneau.id).toBe('recreation');
  });

  it('ne trouve rien avant le debut de la soiree', () => {
    const calcules = horairesSoiree(SOIREE, GRILLE, []);
    expect(creneauEnCours(calcules, instantDepuisHeureLocale('2026-09-18', '19:00'))).toBeNull();
  });

  it('reste sur le temps libre apres le dernier cours', () => {
    const calcules = horairesSoiree(SOIREE, GRILLE, []);
    const tard = instantDepuisHeureLocale('2026-09-19', '01:00');
    expect(creneauEnCours(calcules, tard)?.creneau.id).toBe('libre');
  });
});

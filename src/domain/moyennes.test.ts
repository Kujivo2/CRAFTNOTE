import { describe, expect, it } from 'vitest';
import { arrondir, rationnel } from './rationnel';
import {
  type NoteCalculable,
  moyenneGenerale,
  moyenneGroupeMatiere,
  moyenneMatiere,
  rangDansGroupe,
} from './moyennes';
import { OPTIONS_PAR_DEFAUT, type StatutNote } from './types';

function notee(valeurSur20: number, coefficient = 1, baremePoints = 20): NoteCalculable {
  return {
    valeurCentiemes: Math.round(valeurSur20 * 100),
    baremeCentiemes: baremePoints * 100,
    coefficient,
    statut: 'notee',
    priseEnCompte: true,
  };
}

function sansValeur(statut: StatutNote, coefficient = 1): NoteCalculable {
  return {
    valeurCentiemes: null,
    baremeCentiemes: 2000,
    coefficient,
    statut,
    priseEnCompte: true,
  };
}

function deuxDecimales(moyenne: ReturnType<typeof moyenneMatiere>): number | null {
  return moyenne === null ? null : arrondir(moyenne, 2);
}

describe('moyenne de matiere', () => {
  it('fait la moyenne de deux notes de meme coefficient', () => {
    expect(deuxDecimales(moyenneMatiere([notee(20), notee(10)], OPTIONS_PAR_DEFAUT))).toBe(15);
  });

  it('ramene un bareme sur 40 a une note sur 20', () => {
    expect(deuxDecimales(moyenneMatiere([notee(30, 1, 40)], OPTIONS_PAR_DEFAUT))).toBe(15);
  });

  it('ramene un bareme sur 10 a une note sur 20', () => {
    expect(deuxDecimales(moyenneMatiere([notee(8, 1, 10)], OPTIONS_PAR_DEFAUT))).toBe(16);
  });

  it('pondere reellement par les coefficients', () => {
    // 18 coefficient 3 et 8 coefficient 1 font 15,50, pas 13,00.
    expect(deuxDecimales(moyenneMatiere([notee(18, 3), notee(8)], OPTIONS_PAR_DEFAUT))).toBe(15.5);
  });

  it('ne compte pas un absent par defaut', () => {
    expect(
      deuxDecimales(moyenneMatiere([notee(15), sansValeur('absent')], OPTIONS_PAR_DEFAUT)),
    ).toBe(15);
  });

  it('compte un absent zero quand l etablissement le demande', () => {
    const options = { absentCompteZero: true, nonRenduCompteZero: true };
    expect(deuxDecimales(moyenneMatiere([notee(15), sansValeur('absent')], options))).toBe(7.5);
  });

  it('compte un non rendu zero par defaut', () => {
    expect(
      deuxDecimales(moyenneMatiere([notee(15), sansValeur('nonRendu')], OPTIONS_PAR_DEFAUT)),
    ).toBe(7.5);
  });

  it('ignore toujours un dispense et une note non notee', () => {
    const notes = [notee(15), sansValeur('dispense'), sansValeur('nonNotee')];
    expect(deuxDecimales(moyenneMatiere(notes, OPTIONS_PAR_DEFAUT))).toBe(15);
  });

  it('exclut une note marquee non prise en compte', () => {
    const exclue: NoteCalculable = { ...notee(0), priseEnCompte: false };
    expect(deuxDecimales(moyenneMatiere([notee(15), exclue], OPTIONS_PAR_DEFAUT))).toBe(15);
  });

  it('rend null et non zero quand aucune note n est retenue', () => {
    expect(moyenneMatiere([], OPTIONS_PAR_DEFAUT)).toBeNull();
    expect(moyenneMatiere([sansValeur('dispense')], OPTIONS_PAR_DEFAUT)).toBeNull();
  });

  it('ne rend jamais NaN sur un bareme ou un coefficient nul', () => {
    const cassee: NoteCalculable = { ...notee(15), baremeCentiemes: 0 };
    expect(moyenneMatiere([cassee], OPTIONS_PAR_DEFAUT)).toBeNull();
  });
});

describe('moyenne generale', () => {
  it('n est pas la moyenne de toutes les notes', () => {
    const maths = moyenneMatiere([notee(20), notee(10)], OPTIONS_PAR_DEFAUT);
    const sport = moyenneMatiere([notee(0)], OPTIONS_PAR_DEFAUT);
    const generale = moyenneGenerale([
      { moyenne: maths, coefficient: 1 },
      { moyenne: sport, coefficient: 1 },
    ]);

    expect(deuxDecimales(generale)).toBe(7.5);
    // La moyenne de toutes les notes vaudrait 10,00 : les deux ne doivent pas coincider.
    expect(deuxDecimales(generale)).not.toBe(10);
  });

  it('sort une matiere sans moyenne du numerateur ET du denominateur', () => {
    const generale = moyenneGenerale([
      { moyenne: rationnel(15, 1), coefficient: 1 },
      { moyenne: null, coefficient: 1 },
    ]);
    expect(deuxDecimales(generale)).toBe(15);
  });

  it('rend null quand aucune matiere n a de moyenne', () => {
    expect(moyenneGenerale([{ moyenne: null, coefficient: 1 }])).toBeNull();
    expect(moyenneGenerale([])).toBeNull();
  });

  it('n arrondit a aucune etape intermediaire', () => {
    // Matiere A : 10 sur un bareme de 30, soit 6,666... sur 20. Matiere B : 20 sur 20.
    // Exact : (20/3 + 20) / 2 = 40/3 = 13,3333... donc 13,33.
    // En arrondissant A a 6,67 d'abord : (6,67 + 20) / 2 = 13,335 donc 13,34.
    const a = moyenneMatiere([notee(10, 1, 30)], OPTIONS_PAR_DEFAUT);
    const b = moyenneMatiere([notee(20)], OPTIONS_PAR_DEFAUT);
    const generale = moyenneGenerale([
      { moyenne: a, coefficient: 1 },
      { moyenne: b, coefficient: 1 },
    ]);

    expect(deuxDecimales(generale)).toBe(13.33);
    expect(deuxDecimales(generale)).not.toBe(13.34);
  });
});

describe('moyenne du groupe', () => {
  it('est la moyenne des moyennes des eleves, pas celle de toutes les notes', () => {
    // Quatre eleves, deux evaluations, le quatrieme absent a la seconde.
    const options = OPTIONS_PAR_DEFAUT;
    const eleves = [
      moyenneMatiere([notee(20), notee(0)], options),
      moyenneMatiere([notee(10), notee(20)], options),
      moyenneMatiere([notee(10), notee(20)], options),
      moyenneMatiere([notee(20), sansValeur('absent')], options),
    ];

    expect(deuxDecimales(moyenneGroupeMatiere(eleves))).toBe(15);
    // La moyenne des sept notes vaudrait 14,29.
    expect(deuxDecimales(moyenneGroupeMatiere(eleves))).not.toBe(14.29);
  });

  it('rend null si personne n a de moyenne', () => {
    expect(moyenneGroupeMatiere([null, null])).toBeNull();
  });
});

describe('rang', () => {
  it('compte les moyennes strictement superieures', () => {
    const groupe = [rationnel(18, 1), rationnel(15, 1), rationnel(15, 1), rationnel(9, 1)];
    expect(rangDansGroupe(rationnel(15, 1), groupe)).toEqual({ rang: 2, sur: 4 });
  });

  it('rend null pour un eleve sans moyenne', () => {
    expect(rangDansGroupe(null, [rationnel(15, 1)])).toBeNull();
  });
});

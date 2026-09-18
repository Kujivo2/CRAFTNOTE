import { describe, expect, it } from 'vitest';
import { type EtatNote, attribuer, classerEvenement, ecartCentiemes } from './journal';
import type { StatutNote } from './types';

function etat(valeurSur20: number | null, statut: StatutNote = 'notee'): EtatNote {
  return {
    valeurCentiemes: valeurSur20 === null ? null : Math.round(valeurSur20 * 100),
    statut,
    commentaire: '',
    coefficient: 1,
    priseEnCompte: true,
  };
}

const AUCUNE_NOTE = etat(null, 'nonNotee');

describe('classement des evenements', () => {
  it('traite une premiere saisie comme une saisie, jamais comme une modification', () => {
    expect(classerEvenement(null, etat(19))).toBe('saisie');
    expect(classerEvenement(AUCUNE_NOTE, etat(19))).toBe('saisie');
  });

  it('traite un changement de valeur comme une modification', () => {
    expect(classerEvenement(etat(19), etat(14))).toBe('modification');
  });

  it('traite un retour a rien comme une suppression', () => {
    expect(classerEvenement(etat(14), null)).toBe('suppression');
    expect(classerEvenement(etat(14), AUCUNE_NOTE)).toBe('suppression');
  });

  it('traite un changement de statut comme une modification', () => {
    expect(classerEvenement(etat(14), etat(null, 'absent'))).toBe('modification');
  });

  it('traite un changement de commentaire comme une modification', () => {
    const avant = etat(14);
    const apres: EtatNote = { ...avant, commentaire: 'a revoir' };
    expect(classerEvenement(avant, apres)).toBe('modification');
  });

  it('traite un changement de coefficient comme une modification', () => {
    const avant = etat(14);
    const apres: EtatNote = { ...avant, coefficient: 2 };
    expect(classerEvenement(avant, apres)).toBe('modification');
  });

  it('traite un retrait du calcul comme une modification', () => {
    const avant = etat(14);
    const apres: EtatNote = { ...avant, priseEnCompte: false };
    expect(classerEvenement(avant, apres)).toBe('modification');
  });

  it('n ecrit rien quand la valeur est reecrite a l identique', () => {
    expect(classerEvenement(etat(14), etat(14))).toBeNull();
  });

  it('n ecrit rien quand rien n existait et que rien n est saisi', () => {
    expect(classerEvenement(null, null)).toBeNull();
    expect(classerEvenement(null, AUCUNE_NOTE)).toBeNull();
  });
});

describe('ecart, pour le filtre des plus gros changements', () => {
  it('mesure la difference en centiemes', () => {
    expect(ecartCentiemes(etat(19), etat(14))).toBe(500);
    expect(ecartCentiemes(etat(13.5), etat(13))).toBe(50);
  });

  it('ne mesure rien quand l une des deux valeurs est absente', () => {
    expect(ecartCentiemes(null, etat(14))).toBeNull();
    expect(ecartCentiemes(etat(14), etat(null, 'absent'))).toBeNull();
  });
});

describe('attribution', () => {
  it('attribue a l auteur quand il agit sous sa propre identite', () => {
    expect(attribuer({ utilisateurId: 'prof-1', adminReelId: null })).toEqual({
      acteurId: 'prof-1',
      acteurUsurpeId: null,
    });
  });

  it('attribue a l admin reel pendant une usurpation, et nomme le compte emprunte', () => {
    expect(attribuer({ utilisateurId: 'prof-1', adminReelId: 'admin-1' })).toEqual({
      acteurId: 'admin-1',
      acteurUsurpeId: 'prof-1',
    });
  });
});

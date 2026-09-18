import { describe, expect, it } from 'vitest';
import { rationnel } from './rationnel';
import { type Compteurs, compteursPeriode } from './compteurs';
import { SEUILS_PAR_DEFAUT, suggererMentions } from './mentions';
import { TYPES_SANCTION, estTypeSanction, sursisAutorise } from './types';

const SANS_HISTOIRE: Compteurs = compteursPeriode({
  seances: [{ id: 's1', soireeAnnulee: false, dureeMinutes: 30 }],
  presences: [],
  absences: [],
  retenues: [],
  mesures: [],
});

function mentions(moyenneSur20: number | null, compteurs: Compteurs = SANS_HISTOIRE): string[] {
  const moyenne = moyenneSur20 === null ? null : rationnel(Math.round(moyenneSur20 * 100), 100);
  return suggererMentions(moyenne, compteurs, SEUILS_PAR_DEFAUT).map((s) => s.mention);
}

describe('suggestions de mention', () => {
  it('propose les felicitations au-dessus du seuil', () => {
    expect(mentions(16)).toContain('felicitations');
    expect(mentions(17.5)).toContain('felicitations');
  });

  it('ne propose qu une seule mention de merite a la fois', () => {
    expect(mentions(16)).not.toContain('compliments');
    expect(mentions(14)).toEqual(['compliments']);
    expect(mentions(12)).toEqual(['encouragements']);
  });

  it('ne propose rien de meritoire entre les seuils', () => {
    expect(mentions(11)).toEqual([]);
  });

  it('propose un avertissement travail sous le seuil', () => {
    expect(mentions(7.5)).toContain('avertissementTravail');
  });

  it('compare exactement au seuil, sans passer par un flottant', () => {
    // 15,99 ne doit pas basculer en felicitations par un arrondi malheureux.
    expect(mentions(15.99)).toEqual(['compliments']);
  });

  it('ne suggere aucune mention de moyenne quand il n y a pas de moyenne', () => {
    expect(mentions(null)).toEqual([]);
  });

  it('propose un avertissement assiduite sur les absences non justifiees', () => {
    const compteurs = compteursPeriode({
      seances: [
        { id: 's1', soireeAnnulee: false, dureeMinutes: 30 },
        { id: 's2', soireeAnnulee: false, dureeMinutes: 30 },
        { id: 's3', soireeAnnulee: false, dureeMinutes: 30 },
      ],
      presences: [
        { seanceId: 's1', statut: 'absent', minutesRetard: 0 },
        { seanceId: 's2', statut: 'absent', minutesRetard: 0 },
        { seanceId: 's3', statut: 'absent', minutesRetard: 0 },
      ],
      absences: [],
      retenues: [],
      mesures: [],
    });

    expect(mentions(15, compteurs)).toContain('avertissementAssiduite');
  });

  it('propose un avertissement comportement des la premiere sanction', () => {
    const compteurs = compteursPeriode({
      seances: [{ id: 's1', soireeAnnulee: false, dureeMinutes: 30 }],
      presences: [],
      absences: [],
      retenues: [],
      mesures: [{ categorie: 'sanction', type: 'blame' }],
    });

    expect(mentions(15, compteurs)).toContain('avertissementComportement');
  });

  it('ne declenche pas le comportement sur une simple punition', () => {
    const compteurs = compteursPeriode({
      seances: [{ id: 's1', soireeAnnulee: false, dureeMinutes: 30 }],
      presences: [],
      absences: [],
      retenues: [],
      mesures: [{ categorie: 'punition', type: 'retenue' }],
    });

    expect(mentions(15, compteurs)).not.toContain('avertissementComportement');
  });

  it('motive chaque suggestion', () => {
    const suggestions = suggererMentions(rationnel(1800, 100), SANS_HISTOIRE, SEUILS_PAR_DEFAUT);
    expect(suggestions.at(0)?.motif).not.toBe('');
  });
});

describe('sanctions, liste fermee', () => {
  it('ne reconnait que les six types du 4.4', () => {
    expect(TYPES_SANCTION).toHaveLength(6);
    expect(estTypeSanction('blame')).toBe(true);
    expect(estTypeSanction('retenue')).toBe(false);
    expect(estTypeSanction('mettreZero')).toBe(false);
  });

  it('interdit le sursis sur un avertissement et un blame', () => {
    expect(sursisAutorise('avertissement')).toBe(false);
    expect(sursisAutorise('blame')).toBe(false);
    expect(sursisAutorise('exclusionTemporaireClasse')).toBe(true);
    expect(sursisAutorise('exclusionDefinitive')).toBe(true);
  });
});

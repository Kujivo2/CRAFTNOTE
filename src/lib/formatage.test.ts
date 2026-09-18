import { describe, expect, it } from 'vitest';
import { rationnel } from '@/domain/rationnel';
import { instantDepuisHeureLocale } from '@/domain/fuseau';
import {
  ABSENCE_DE_VALEUR,
  compteFr,
  dateCourteFr,
  dateFr,
  dureeFr,
  heureFr,
  moyenneFr,
  noteFr,
  pourcentageFr,
} from './formatage';

describe('moyennes', () => {
  it('ecrit une virgule et deux decimales', () => {
    expect(moyenneFr(rationnel(29, 2))).toBe('14,50');
    expect(moyenneFr(rationnel(15, 1))).toBe('15,00');
  });

  it('n ecrit jamais un point decimal', () => {
    expect(moyenneFr(rationnel(31, 3))).toBe('10,33');
    expect(moyenneFr(rationnel(31, 3))).not.toContain('.');
  });

  it('rend un tiret cadratin et non zero quand il n y a pas de moyenne', () => {
    expect(moyenneFr(null)).toBe(ABSENCE_DE_VALEUR);
    expect(moyenneFr(null)).not.toBe('0,00');
  });
});

describe('notes', () => {
  it('n ajoute pas une precision que le professeur n a pas donnee', () => {
    expect(noteFr(1250)).toBe('12,5');
    expect(noteFr(1400)).toBe('14');
    expect(noteFr(1465)).toBe('14,65');
  });

  it('rend un tiret pour une note absente', () => {
    expect(noteFr(null)).toBe(ABSENCE_DE_VALEUR);
  });

  it('ecrit un zero franc', () => {
    expect(noteFr(0)).toBe('0');
  });
});

describe('pourcentages', () => {
  it('ecrit le taux de presence avec une decimale utile', () => {
    expect(pourcentageFr(rationnel(1, 1))).toBe('100 %');
    expect(pourcentageFr(rationnel(35, 36))).toBe('97,2 %');
  });

  it('rend un tiret quand aucune seance n est due', () => {
    expect(pourcentageFr(null)).toBe(ABSENCE_DE_VALEUR);
  });
});

describe('heures et dates', () => {
  const debutDeSoiree = instantDepuisHeureLocale('2026-09-18', '20:30');

  it('ecrit une heure a la francaise', () => {
    expect(heureFr(debutDeSoiree)).toBe('20h30');
  });

  it('affiche l heure de Paris, pas celle du serveur', () => {
    // Le meme instant, ecrit en UTC, doit rester 20h30 a l'ecran.
    expect(heureFr(new Date('2026-09-18T18:30:00.000Z'))).toBe('20h30');
  });

  it('passe minuit sans changer d heure affichee', () => {
    expect(heureFr(instantDepuisHeureLocale('2026-10-05', '00:30'))).toBe('00h30');
  });

  it('ecrit la date en toutes lettres', () => {
    expect(dateFr(debutDeSoiree)).toBe('vendredi 18 septembre');
  });

  it('abrege pour les colonnes serrees', () => {
    expect(dateCourteFr(debutDeSoiree)).toContain('18');
    expect(dateCourteFr(debutDeSoiree)).toContain('sept');
  });
});

describe('durees', () => {
  it('compte en minutes sous l heure', () => {
    expect(dureeFr(30)).toBe('30 min');
    expect(dureeFr(45)).toBe('45 min');
  });

  it('compte en heures au-dela', () => {
    expect(dureeFr(60)).toBe('1 h');
    expect(dureeFr(90)).toBe('1 h 30');
    expect(dureeFr(125)).toBe('2 h 05');
  });

  it('ecrit zero minute plutot que rien', () => {
    expect(dureeFr(0)).toBe('0 min');
  });
});

describe('comptes', () => {
  it('ecrit le zero au lieu de le masquer', () => {
    expect(compteFr(0, 'absence', 'absences', 'feminin')).toBe('aucune absence');
    expect(compteFr(0, 'retard', 'retards')).toBe('aucun retard');
  });

  it('accorde le singulier et le pluriel', () => {
    expect(compteFr(1, 'retard', 'retards')).toBe('1 retard');
    expect(compteFr(3, 'retard', 'retards')).toBe('3 retards');
  });
});

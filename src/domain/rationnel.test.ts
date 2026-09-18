import { describe, expect, it } from 'vitest';
import { additionner, arrondir, comparer, multiplier, rationnel } from './rationnel';

describe('construction', () => {
  it('reduit toujours la fraction', () => {
    expect(rationnel(2, 4)).toEqual({ n: 1, d: 2 });
    expect(rationnel(100, 10)).toEqual({ n: 10, d: 1 });
  });

  it('normalise le signe sur le numerateur', () => {
    expect(rationnel(1, -2)).toEqual({ n: -1, d: 2 });
  });

  it('refuse un denominateur nul plutot que de rendre un infini', () => {
    expect(() => rationnel(1, 0)).toThrow();
  });

  it('rend zero sous sa forme reduite', () => {
    expect(rationnel(0, 7)).toEqual({ n: 0, d: 1 });
  });
});

describe('operations', () => {
  it('additionne exactement la ou le flottant derape', () => {
    // 0,1 + 0,2 vaut 0,30000000000000004 en flottant binaire. Ici, non.
    const somme = additionner(rationnel(1, 10), rationnel(2, 10));
    expect(somme).toEqual({ n: 3, d: 10 });
    expect(arrondir(somme, 2)).toBe(0.3);
  });

  it('additionne des tiers sans perte', () => {
    expect(additionner(rationnel(1, 3), rationnel(1, 6))).toEqual({ n: 1, d: 2 });
  });

  it('multiplie en reduisant en croix', () => {
    expect(multiplier(rationnel(2, 3), rationnel(3, 4))).toEqual({ n: 1, d: 2 });
  });

  it('compare sans passer par un flottant', () => {
    expect(comparer(rationnel(1, 3), rationnel(1, 2))).toBe(-1);
    expect(comparer(rationnel(1, 2), rationnel(2, 4))).toBe(0);
  });
});

describe('arrondi commercial', () => {
  it('rend deux decimales pour une moyenne courante', () => {
    expect(arrondir(rationnel(29, 2), 2)).toBe(14.5);
  });

  it('ne remonte pas un tiers a la decimale superieure', () => {
    // 31/3 vaut 10,3333... : la reponse est 10,33 et non 10,34.
    expect(arrondir(rationnel(31, 3), 2)).toBe(10.33);
  });

  it('eloigne la demie de zero', () => {
    // 14,565 exactement : la troisieme decimale est un 5 franc.
    expect(arrondir(rationnel(2913, 200), 2)).toBe(14.57);
    expect(arrondir(rationnel(1, 2), 0)).toBe(1);
    expect(arrondir(rationnel(-1, 2), 0)).toBe(-1);
  });

  it('traite une demie exacte sans la perdre dans une division flottante', () => {
    expect(arrondir(rationnel(5, 10), 0)).toBe(1);
    expect(arrondir(rationnel(25, 100), 1)).toBe(0.3);
  });

  it('refuse un nombre de decimales absurde', () => {
    expect(() => arrondir(rationnel(1, 2), -1)).toThrow();
  });
});

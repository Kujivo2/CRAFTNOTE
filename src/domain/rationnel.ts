// Arithmetique rationnelle exacte.
//
// Le 4.1 demande deux decimales et interdit le flottant binaire, puis interdit tout arrondi
// intermediaire. Les deux ensemble excluent de manipuler des nombres decimaux : une moyenne est
// donc portee sous forme de fraction entiere reduite, et la seule conversion en nombre a virgule
// est `arrondir`, appelee par la couche d'affichage et par personne d'autre.

export type Rationnel = { readonly n: number; readonly d: number };

export const ZERO: Rationnel = { n: 0, d: 1 };

function pgcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const reste = x % y;
    x = y;
    y = reste;
  }
  return x;
}

export function rationnel(n: number, d: number): Rationnel {
  if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d)) {
    throw new Error('Un rationnel se construit sur deux entiers surs.');
  }
  if (d === 0) {
    throw new Error('Denominateur nul.');
  }
  const signe = d < 0 ? -1 : 1;
  const diviseur = pgcd(n, d) || 1;
  return { n: (n * signe) / diviseur, d: (d * signe) / diviseur };
}

export function depuisEntier(n: number): Rationnel {
  return rationnel(n, 1);
}

export function additionner(a: Rationnel, b: Rationnel): Rationnel {
  // On reduit par le PGCD des denominateurs avant de multiplier, pour que les nombres
  // manipules restent petits meme apres une dizaine d'additions.
  const commun = pgcd(a.d, b.d) || 1;
  const d = (a.d / commun) * b.d;
  const n = a.n * (b.d / commun) + b.n * (a.d / commun);
  return rationnel(n, d);
}

export function multiplier(a: Rationnel, b: Rationnel): Rationnel {
  const croise1 = pgcd(a.n, b.d) || 1;
  const croise2 = pgcd(b.n, a.d) || 1;
  return rationnel((a.n / croise1) * (b.n / croise2), (a.d / croise2) * (b.d / croise1));
}

export function diviserParEntier(a: Rationnel, entier: number): Rationnel {
  if (entier === 0) {
    throw new Error('Division par zero.');
  }
  return multiplier(a, rationnel(1, entier));
}

export function comparer(a: Rationnel, b: Rationnel): number {
  const gauche = a.n * b.d;
  const droite = b.n * a.d;
  if (gauche < droite) return -1;
  if (gauche > droite) return 1;
  return 0;
}

export function estEgal(a: Rationnel, b: Rationnel): boolean {
  return a.n === b.n && a.d === b.d;
}

// Arrondi commercial : la demie s'eloigne de zero, donc 14,565 rend 14,57 et -0,5 rend -1.
// Le calcul reste entier de bout en bout, sans jamais passer par une division flottante
// qui transformerait un 0,5 exact en 0,49999999999999994.
export function arrondir(r: Rationnel, decimales: number): number {
  if (!Number.isInteger(decimales) || decimales < 0) {
    throw new Error('Nombre de decimales invalide.');
  }
  const facteur = 10 ** decimales;
  const numerateur = r.n * facteur;
  const reste = numerateur % r.d;
  const quotient = (numerateur - reste) / r.d;
  const demieAtteinte = Math.abs(reste) * 2 >= r.d;
  const ajustement = demieAtteinte ? (numerateur < 0 ? -1 : 1) : 0;
  return (quotient + ajustement) / facteur;
}

// Conversion entre une heure murale Europe/Paris et un instant UTC.
//
// Le 6.2 le signale comme critique : les soirees vont de 20h a minuit passe, et une conversion
// approximative fait basculer une seance au lendemain. Tout est stocke en UTC, tout est affiche
// en Europe/Paris, et cette conversion est le seul point de passage.
//
// Aucune I/O : `Intl` fait partie du langage et porte la base de fuseaux du systeme.

export const FUSEAU = 'Europe/Paris';

const FORMATEUR = new Intl.DateTimeFormat('en-US', {
  timeZone: FUSEAU,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

type ChampsLocaux = {
  readonly annee: number;
  readonly mois: number;
  readonly jour: number;
  readonly heure: number;
  readonly minute: number;
  readonly seconde: number;
};

function champsLocaux(instant: Date): ChampsLocaux {
  const parties = FORMATEUR.formatToParts(instant);
  const lire = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parties.find((partie) => partie.type === type)?.value ?? '0');

  // Certains moteurs rendent « 24 » pour minuit avec hour12 desactive.
  const heure = lire('hour') % 24;

  return {
    annee: lire('year'),
    mois: lire('month'),
    jour: lire('day'),
    heure,
    minute: lire('minute'),
    seconde: lire('second'),
  };
}

function decalageMinutes(instant: Date): number {
  const champs = champsLocaux(instant);
  const commeSiUtc = Date.UTC(
    champs.annee,
    champs.mois - 1,
    champs.jour,
    champs.heure,
    champs.minute,
    champs.seconde,
  );
  return (commeSiUtc - instant.getTime()) / 60_000;
}

const FORME_DATE = /^\d{4}-\d{2}-\d{2}$/;
const FORME_HEURE = /^\d{1,2}:\d{2}$/;

// « 2026-09-18 » et « 20:00 », heure murale a Paris, vers l'instant UTC correspondant.
// Deux passes : la premiere suppose un decalage, la seconde le corrige si l'instant obtenu
// tombe de l'autre cote d'un changement d'heure.
export function instantDepuisHeureLocale(date: string, heure: string): Date {
  if (!FORME_DATE.test(date)) throw new Error(`Date attendue au format AAAA-MM-JJ : ${date}`);
  if (!FORME_HEURE.test(heure)) throw new Error(`Heure attendue au format HH:MM : ${heure}`);

  const [annee = 0, mois = 0, jour = 0] = date.split('-').map(Number);
  const [heures = 0, minutes = 0] = heure.split(':').map(Number);

  if (heures > 23 || minutes > 59) throw new Error(`Heure hors bornes : ${heure}`);

  const suppose = Date.UTC(annee, mois - 1, jour, heures, minutes);
  const premierDecalage = decalageMinutes(new Date(suppose));
  const premiereReponse = suppose - premierDecalage * 60_000;

  const secondDecalage = decalageMinutes(new Date(premiereReponse));
  if (secondDecalage === premierDecalage) return new Date(premiereReponse);

  return new Date(suppose - secondDecalage * 60_000);
}

// Le chemin inverse, utile des qu'il faut savoir quel jour parisien porte un instant :
// un cours a 00h30 tombe le lendemain, alors que la soiree, elle, reste celle de la veille.
export function enHeureLocale(instant: Date): { readonly date: string; readonly heure: string } {
  const champs = champsLocaux(instant);
  const deuxChiffres = (valeur: number): string => String(valeur).padStart(2, '0');

  return {
    date: `${champs.annee}-${deuxChiffres(champs.mois)}-${deuxChiffres(champs.jour)}`,
    heure: `${deuxChiffres(champs.heure)}:${deuxChiffres(champs.minute)}`,
  };
}

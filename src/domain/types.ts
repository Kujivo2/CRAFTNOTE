// Types partages par le domaine. Aucune de ces valeurs n'est un libelle affichable :
// la traduction en francais se fait dans lib/formatage.ts.

export type StatutNote = 'notee' | 'absent' | 'dispense' | 'nonRendu' | 'nonNotee';

export type StatutPresence = 'present' | 'absent' | 'retard' | 'enRetenue';

export type StatutRetenue = 'planifiee' | 'effectuee' | 'nonEffectuee' | 'reportee';

export type CategorieMesure = 'punition' | 'sanction';

// Liste limitative et fermee dans le code (4.4). Les types de punition, eux, sont une donnee
// paramétrable, parce que la liste en est ouverte.
export const TYPES_SANCTION = [
  'avertissement',
  'blame',
  'mesureResponsabilisation',
  'exclusionTemporaireClasse',
  'exclusionTemporaireEtablissement',
  'exclusionDefinitive',
] as const;

export type TypeSanction = (typeof TYPES_SANCTION)[number];

// Un sursis n'a de sens que sur une sanction qui produit un effet : on ne sursoit pas a une
// parole. L'avertissement et le blame en sont donc exclus.
const SANS_SURSIS_POSSIBLE: ReadonlySet<string> = new Set(['avertissement', 'blame']);

export function sursisAutorise(type: TypeSanction): boolean {
  return !SANS_SURSIS_POSSIBLE.has(type);
}

export function estTypeSanction(valeur: string): valeur is TypeSanction {
  return (TYPES_SANCTION as readonly string[]).includes(valeur);
}

export type Mention =
  | 'encouragements'
  | 'compliments'
  | 'felicitations'
  | 'avertissementTravail'
  | 'avertissementComportement'
  | 'avertissementAssiduite';

// Options de calcul de l'etablissement, stockees dans etablissement/config.
export type OptionsCalcul = {
  readonly absentCompteZero: boolean;
  readonly nonRenduCompteZero: boolean;
};

export const OPTIONS_PAR_DEFAUT: OptionsCalcul = {
  absentCompteZero: false,
  nonRenduCompteZero: true,
};

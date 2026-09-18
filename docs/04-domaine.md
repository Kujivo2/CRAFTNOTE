# Domaine : signatures et cas de test

`src/domain/` ne fait aucune I/O, n'importe ni React ni Firebase, et ne connaît ni session ni
permission. On lui passe des données, il rend des nombres. C'est la partie où une erreur rend
l'application inutilisable, donc c'est celle qui est écrite en premier et testée seule.

## Le choix qui commande tout le reste : pas de flottant

Le §4.1 demande deux décimales et interdit le flottant binaire, puis interdit tout arrondi
intermédiaire. Les deux ensemble excluent de manipuler des `number` décimaux : `0.1 + 0.2` vaut
`0.30000000000000004`, et arrondir à chaque étape pour compenser, c'est précisément l'arrondi
intermédiaire interdit.

Donc deux représentations, et une seule conversion, à l'affichage :

- **Une note saisie est un entier de centièmes.** `14,50` est `1450`. Firestore stocke les entiers
  jusqu'à 2^53 exactement. Un barème de 20 est `2000`.
- **Une moyenne est un rationnel exact**, numérateur et dénominateur entiers, réduit par le PGCD.
  Avec une dizaine d'évaluations, des barèmes entre 10 et 40 et des coefficients à un chiffre, les
  dénominateurs réduits restent très en dessous de 2^53. Aucune approximation n'intervient nulle
  part, et `arrondir` n'est appelée que par la couche d'affichage.

```ts
// domain/rationnel.ts
export type Rationnel = { readonly n: number; readonly d: number }; // d > 0, toujours réduit

export function rationnel(n: number, d: number): Rationnel;
export function additionner(a: Rationnel, b: Rationnel): Rationnel;
export function multiplier(a: Rationnel, b: Rationnel): Rationnel;
export function comparer(a: Rationnel, b: Rationnel): number;

// Arrondi commercial, la demie s'éloigne de zéro : 14,565 rend 14,57.
// Appelée uniquement par lib/formatage.ts, jamais par un autre calcul.
export function arrondir(r: Rationnel, decimales: number): number;
```

## Moyennes

```ts
// domain/moyennes.ts
export type StatutNote = 'notee' | 'absent' | 'dispense' | 'nonRendu' | 'nonNotee';

export type OptionsCalcul = {
  readonly absentCompteZero: boolean;   // false par défaut
  readonly nonRenduCompteZero: boolean; // true par défaut
};

export type NoteCalculable = {
  readonly valeurCentiemes: number | null;
  readonly baremeCentiemes: number;
  readonly coefficient: number;
  readonly statut: StatutNote;
  readonly priseEnCompte: boolean;
};

export function estRetenue(note: NoteCalculable, options: OptionsCalcul): boolean;

// null, jamais NaN, jamais 0 : « pas de moyenne » n'est pas « zéro ».
export function moyenneMatiere(
  notes: readonly NoteCalculable[],
  options: OptionsCalcul,
): Rationnel | null;

// Les matières sans moyenne sortent du numérateur ET du dénominateur.
export function moyenneGenerale(
  matieres: readonly { readonly moyenne: Rationnel | null; readonly coefficient: number }[],
): Rationnel | null;

// Moyenne des moyennes des élèves, pas moyenne de toutes les notes.
export function moyenneGroupeMatiere(
  moyennesDesEleves: readonly (Rationnel | null)[],
): Rationnel | null;

// Existe, désactivé par défaut par les options d'établissement : « 2e sur 4 » n'informe personne.
export function rangDansGroupe(
  moyenneEleve: Rationnel | null,
  moyennesDuGroupe: readonly (Rationnel | null)[],
): { readonly rang: number; readonly sur: number } | null;
```

## Horaires d'une soirée

La fonction la plus testée du projet. Les horaires ne sont jamais stockés.

```ts
// domain/horaires.ts
export type TypeCreneau = 'accueil' | 'cours' | 'pause' | 'libre';

export type CreneauGrille = {
  readonly id: string;
  readonly ordre: number;
  readonly type: TypeCreneau;
  readonly libelle: string;
  readonly libelleFictif?: string;
  readonly dureeMinutes: number; // 0 = ouvert, pour « Temps libre » qui n'a pas de fin
};

export type Ajustement =
  | { readonly type: 'depuisCreneau'; readonly creneauId: string; readonly minutes: number }
  | { readonly type: 'dureeCreneau'; readonly creneauId: string; readonly dureeMinutes: number };

export type CreneauCalcule = {
  readonly creneau: CreneauGrille;
  readonly debut: Date;            // instant UTC
  readonly fin: Date | null;       // null pour un créneau ouvert
  readonly decaleDeMinutes: number; // 0 si conforme à la grille, sinon l'écart cumulé
};

export function horairesSoiree(
  soiree: {
    readonly date: string;       // « 2026-09-18 », jour de RP
    readonly heureDebut: string; // « 20:00 », heure locale Europe/Paris
    readonly annulee: boolean;
  },
  grille: readonly CreneauGrille[],
  ajustements: readonly Ajustement[],
): readonly CreneauCalcule[];
```

Les trois gestes du §5 se répartissent ainsi : **décaler toute la soirée** réécrit `heureDebut`, un
champ et rien d'autre ; **décaler à partir de maintenant** ajoute un `depuisCreneau` ; **allonger un
créneau en direct** ajoute un `dureeCreneau`. Les ajustements sont appliqués dans l'ordre du tableau,
ce qui rend cumulables deux décalages successifs dans la même soirée — cas réel : le serveur plante
deux fois.

Une soirée annulée rend le tableau des créneaux avec leurs horaires, mais aucune séance due : c'est
`compteursPeriode` qui en tient compte, pas `horairesSoiree`.

## Compteurs de la période

Une seule fonction pure, quatre écrans consommateurs : pied de bilan, fiche élève, tableau du CPE,
préparation du conseil.

```ts
// domain/compteurs.ts
export type Compteurs = {
  readonly seancesDues: number;
  readonly seancesManquees: number;
  readonly manqueesJustifiees: number;
  readonly manqueesNonJustifiees: number;
  readonly minutesManquees: number;
  readonly retards: number;
  readonly minutesRetard: number;
  readonly tauxPresence: Rationnel | null; // null si aucune séance due
  readonly retenuesEffectuees: number;
  readonly retenuesNonEffectuees: number;
  readonly punitionsParType: Readonly<Record<string, number>>;
  readonly sanctionsParType: Readonly<Record<string, number>>;
};

export function compteursPeriode(entree: {
  readonly seances: readonly { id: string; soireeAnnulee: boolean; dureeMinutes: number }[];
  readonly presences: readonly { seanceId: string; statut: StatutPresence; minutesRetard: number }[];
  readonly absences: readonly { seanceId?: string; dureeMinutes: number; justifiee: boolean }[];
  readonly retenues: readonly { id: string; statut: StatutRetenue; reporteeDepuisId?: string }[];
  readonly mesures: readonly { categorie: 'punition' | 'sanction'; type: string }[];
}): Compteurs;
```

Une retenue reportée n'est comptée qu'une fois : la chaîne `reporteeDepuisId` est remontée et seule
la dernière de la chaîne compte.

## Mentions et journal

```ts
// domain/mentions.ts
export type Mention =
  | 'encouragements' | 'compliments' | 'felicitations'
  | 'avertissementTravail' | 'avertissementComportement' | 'avertissementAssiduite';

// Suggère et motive. Ne pré-remplit jamais : le retour alimente un écran de propositions
// que le conseil coche ou ignore.
export function suggererMentions(
  moyenne: Rationnel | null,
  compteurs: Compteurs,
  seuils: Seuils,
): readonly { readonly mention: Mention; readonly motif: string }[];

// domain/journal.ts
export type EvenementJournal = 'saisie' | 'modification' | 'suppression';

// null quand rien n'a changé : on n'écrit pas une entrée pour une réécriture identique.
export function classerEvenement(
  avant: EtatNote | null,
  apres: EtatNote | null,
): EvenementJournal | null;
```

## Cas de test

### Moyennes

| Cas | Attendu |
|---|---|
| 20 et 10, coefficients 1, barème 20 | 15,00 |
| 30 sur barème 40 | 15,00 sur 20 |
| 8 sur barème 10 | 16,00 sur 20 |
| 18 coefficient 3, 8 coefficient 1 | 15,50, pas 13,00 |
| 15 et un `absent`, option par défaut | 15,00 |
| le même avec `absentCompteZero` | 7,50 |
| 15 et un `nonRendu` | 7,50 par défaut |
| 15 et un `dispense`, 15 et un `nonNotee` | 15,00 dans les deux cas |
| une note `priseEnCompte: false` | exclue du calcul, toujours rendue par la requête |
| aucune note retenue dans la matière | `null`, et la matière sort des deux termes de la générale |
| **maths 20 et 10, sport 0, coefficients de matière 1** | générale 7,50 — la moyenne de toutes les notes vaut 10,00, le test vérifie qu'elles diffèrent |
| **groupe de 4, un élève absent à la seconde évaluation** | moyenne du groupe = moyenne des moyennes, différente de la moyenne de toutes les notes |
| 10, 10, 11 | 10,33 et non 10,34 |
| deux moyennes dont l'une vaudrait 10,335 avant pondération | le résultat diffère de celui obtenu en arrondissant d'abord : c'est le test qui garde l'absence d'arrondi intermédiaire |
| 14,565 | s'affiche 14,57, arrondi commercial |
| barème 0, coefficient 0, aucune note | `null`, jamais `NaN`, jamais `Infinity` |

### Horaires

| Cas | Attendu |
|---|---|
| grille de référence, début 20h00 | Cours 1 à 20h30, Récréation 21h00, Cours 3 à 22h30, Temps libre à 23h00 sans fin |
| soirée de samedi commencée à 19h30 | tout glisse de 30 minutes, la grille est inchangée |
| décalage global à 20h20 | Cours 3 à 22h50 |
| `depuisCreneau` de +15 sur Cours 2 | Connexion et Cours 1 inchangés, Cours 2 et suivants à +15 |
| `dureeCreneau` portant la Pause cantine à 60 minutes | Cours 3 à 22h45, rien avant ne bouge |
| deux ajustements successifs | cumulés dans l'ordre, pas écrasés |
| créneau de cours sans séance | rendu, marqué « pas cours », aucune séance due |
| soirée annulée | horaires rendus, zéro séance due pour tout le monde |
| soirée du 4 octobre commencée à 22h00 | Cours 3 tombe le 5 octobre à 00h30, la séance reste rattachée à la soirée du 4 |
| grille modifiée : un créneau de cours supprimé | les suivants remontent, aucune séance orpheline |

Le changement d'heure tombe le 25 octobre 2026, après la fin de la saison : aucune soirée n'est
concernée. Le test existe quand même, parce que la fonction survivra à la saison.

### Compteurs

| Cas | Attendu |
|---|---|
| un retard de 10 minutes | 1 retard, 10 minutes, 0 absence, taux de présence inchangé |
| une soirée annulée | aucune séance due, le taux de présence ne bouge pas |
| un élève en retenue sur un créneau de cours | statut `enRetenue`, ni absent ni retard, taux de présence intact |
| une retenue reportée puis effectuée | 1 retenue effectuée, pas 2 |
| une retenue jamais effectuée | reste due, comptée une fois en non effectuée |
| trois colles et trois blâmes | 3 punitions de type retenue, 3 sanctions de type blâme, jamais un total de 6 |
| élève sans aucune absence | tous les compteurs à 0, et le bilan écrit « aucune absence » |
| aucune séance due | taux de présence `null`, jamais 0 %, jamais `NaN` |

### Journal des notes

| Cas | Attendu |
|---|---|
| aucune note vers 19 | `saisie` |
| 19 vers 14 | `modification`, les deux valeurs conservées |
| 14 vers aucune note | `suppression` |
| statut, commentaire ou coefficient modifié | `modification` |
| 14 réécrit en 14 | `null`, aucune entrée |
| saisie faite pendant une usurpation | `acteurId` = l'admin réel, `acteurUsurpeId` = le compte emprunté |

### Permissions, un test par règle

Chaque ligne de la matrice du §2 donne un test, plus les règles de résolution :

- interdiction individuelle bat autorisation individuelle, qui bat le droit du rôle, qui bat le refus ;
- un professeur voit les notes de ses services, pas celles d'un autre service du même groupe ;
- un professeur principal ajoute `notes.voir` en portée `sonGroupe`, sur ses groupes seulement ;
- un surveillant n'obtient jamais `notes.voir`, quelle que soit la portée ;
- le CPE justifie une absence, un surveillant non ;
- la direction seule prononce une sanction ; le CPE la propose ;
- l'administrateur détient tout, et le serveur refuse le décochage même si la requête arrive ;
- le dernier administrateur actif ne peut être ni désactivé ni changé de rôle ;
- personne ne modifie son propre rôle ;
- personne n'accorde un droit ou une portée qu'il ne détient pas.

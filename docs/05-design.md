# Tokens, wireframes, autocritique

## Trois corrections à la palette du §8.3, mesurées

J'ai calculé les rapports de contraste WCAG de la palette fournie avant d'écrire la moindre ligne de
CSS. Trois valeurs ne tiennent pas, et le §9 demande AA.

| Mesure | Rapport | Verdict |
|---|---|---|
| `--correction` `#A3231C` sur `--encre` `#14110F` | **2,52** | échec. C'est la couleur de l'absence non justifiée sur le thème par défaut |
| `--laiton-fonce` `#8F7D45` sur `--papier` `#FFFFFF` | **4,05** | échec pour du texte courant. Suffisant pour une bordure ou un titre, pas pour un lien |
| `--laiton` `#C2B078` sur `--papier` | **2,15** | échec net. À ne jamais utiliser comme texte sur fond clair |

Le rouge stylo est fait pour l'encre sur le papier ; posé sur du noir chaud il disparaît. Ce n'est pas
un défaut de la palette, c'est un usage qui lui manquait. Les trois valeurs retenues :

| Ajout | Valeur | Contraste | Usage |
|---|---|---|---|
| `--correction-clair` | `#D4544A` | 4,63 sur `--encre` | le rouge du thème Uniforme, uniquement |
| `--laiton-lisible` | `#857340` | 4,64 sur `--papier` | texte et liens en thème Papier |
| `--laiton-fonce` | `#8F7D45` | 4,05 | conservé pour les filets et les gros titres, jamais pour du texte courant |

Ce qui tient sans retouche : `--craie` sur `--encre` à 15,78 ; `--laiton` sur `--encre` à 8,75 ;
`--encre` sur `--papier` à 18,80 ; `--correction` sur `--papier` à 7,46.

## Rampe de gris, dérivée de `--encre`

Chaude par construction, R > G > B sur les onze valeurs. Ce n'est ni `zinc` ni `slate`.

| Token | Valeur | sur `--encre` | sur `--papier` |
|---|---|---|---|
| `--gris-05` | `#1C1815` | 1,07 | 17,63 |
| `--gris-10` | `#262220` | 1,19 | 15,76 |
| `--gris-20` | `#3A3431` | 1,54 | 12,24 |
| `--gris-30` | `#4F4845` | 2,10 | 8,95 |
| `--gris-40` | `#6B625E` | 3,16 | 5,94 |
| `--gris-50` | `#8A807B` | 4,88 | 3,85 |
| `--gris-60` | `#A79D97` | 7,09 | 2,65 |
| `--gris-70` | `#C4BAB4` | 9,88 | 1,90 |
| `--gris-80` | `#DCD4CF` | 12,86 | 1,46 |
| `--gris-90` | `#EDE7E3` | 15,35 | 1,23 |
| `--gris-95` | `#F6F2F0` | 16,90 | 1,11 |

Règle qui en découle, et qui évite de tâtonner : **en thème Uniforme le texte secondaire ne descend
jamais sous `--gris-50`, en thème Papier il ne monte jamais au-dessus.** Les valeurs de l'autre
moitié servent aux fonds et aux filets.

## Tokens

```css
:root {
  /* Couleurs de base, identiques aux deux thèmes */
  --encre: #14110F;
  --encre-2: #201C19;
  --laiton: #C2B078;
  --laiton-fonce: #8F7D45;
  --laiton-lisible: #857340;
  --craie: #F2E8F4;
  --papier: #FFFFFF;
  --correction: #A3231C;
  --correction-clair: #D4544A;

  /* Rôles, redéfinis par thème */
  --fond: var(--encre);
  --fond-2: var(--encre-2);
  --texte: var(--craie);
  --texte-2: var(--gris-60);
  --accent: var(--laiton);
  --alerte: var(--correction-clair);
  --filet: var(--gris-20);
  --focus: var(--laiton);

  /* Typographie */
  --police-ui: 'Fira Sans', system-ui, sans-serif;
  --police-dense: 'Fira Sans Condensed', var(--police-ui);
  --police-document: 'Spectral', Georgia, serif;

  --t-12: 0.75rem;   /* mentions, unités, pied de tableau */
  --t-13: 0.8125rem; /* en-têtes de colonnes, en Condensed */
  --t-14: 0.875rem;  /* corps dense : tableaux, listes, interface */
  --t-16: 1rem;      /* corps mobile, et TOUT champ de saisie */
  --t-18: 1.125rem;  /* titre de section */
  --t-22: 1.375rem;  /* titre d'écran */
  --t-28: 1.75rem;   /* l'heure en cours, et elle seule */

  --interligne-serre: 1.25;  /* tableaux */
  --interligne: 1.5;         /* texte courant */
  --interligne-doc: 1.65;    /* appréciations en Spectral */

  /* Espacements, base 4 */
  --e-1: 2px;  --e-2: 4px;  --e-3: 8px;  --e-4: 12px;
  --e-5: 16px; --e-6: 24px; --e-7: 32px; --e-8: 48px;

  /* Le reste */
  --rayon: 2px;          /* champs et boutons UNIQUEMENT */
  --filet-epaisseur: 1px;
  --cible-tactile: 44px;
  --largeur-rail: 232px;
  --mesure: 68ch;        /* largeur maximale d'un texte suivi */
}
```

Deux tokens qui n'existent pas, et c'est délibéré : **aucune ombre** et **aucune durée de transition
globale**. Une ombre n'est déclarée que sur l'en-tête collant d'un tableau long, et une durée n'est
écrite qu'au point d'usage, sur une interaction précise, sous `prefers-reduced-motion`.

Le champ de saisie est à 16 px et pas à 14 px : en dessous, Safari iOS zoome automatiquement au
focus. Un prof qui saisit une note au téléphone verrait la page sauter à chaque champ.

---

## Wireframes

Tous dessinés pour un groupe de quatre élèves.

### 1. Vue soirée, mobile, 390 px, compte professeur

Un soir de RP, c'est l'accueil. Il est 21h12, le Cours 2 du professeur commence dans trois minutes.

```
┌────────────────────────────────┐
│ CRAFTNOTE            M. Vasseur│
├────────────────────────────────┤
│ vendredi 18 septembre          │
│ soirée 5 sur 15                │
│                                │
│   20h00 Connexion              │
│         terminé                │
│ ───────────────────────────────│
│   20h30 Cours 1                │
│         Histoire · Groupe 3    │
│         Salle B · près du puits│
│         apporter une torche    │
│         appel fait · 1 absent  │
│ ───────────────────────────────│
│▌  21h00 Récréation             │
│▌        en cours · fin 21h15   │
│ ───────────────────────────────│
│   21h15 Cours 2                │
│         Histoire · Groupe 5    │
│         Salle B                │
│                                │
│         ┌──────────────────┐   │
│         │ Faire l'appel    │   │
│         └──────────────────┘   │
│ ───────────────────────────────│
│   21h45 Pause cantine          │
│         2 retenues · salle A   │
│ ───────────────────────────────│
│   22h30 Cours 3                │
│         pas cours              │
│ ───────────────────────────────│
│   23h00 Temps libre            │
│                                │
│ Décaler à partir de maintenant │
├────────────────────────────────┤
│ Soirée   Notes   Vie sco.  Moi │
└────────────────────────────────┘
```

Le filet vertical `▌` en `--accent` marque le créneau en cours : pas de fond coloré, pas de carte.
« Pas cours » est écrit, pas masqué. Le lieu est sur la case, pas derrière un clic. Une seule action
primaire à l'écran, et c'est celle de l'instant.

### 2. Appel en grille de portraits

```
┌────────────────────────────────┐
│ Retour   Cours 2 · Groupe 5    │
│          Histoire · 21h15      │
├────────────────────────────────┤
│ Tout le monde est présent.     │
│ Touchez seulement les          │
│ exceptions.                    │
│                                │
│ ┌─────────────┐┌─────────────┐ │
│ │▒▒▒▒▒▒▒▒▒▒▒▒▒││▒▒▒▒▒▒▒▒▒▒▒▒▒│ │
│ │▒▒ portrait ▒││▒▒ portrait ▒│ │
│ │▒▒▒▒▒▒▒▒▒▒▒▒▒││▒▒▒▒▒▒▒▒▒▒▒▒▒│ │
│ │ ● présente  ││ ○ absent    │ │
│ │ Léa M.      ││ Hugo B.     │ │
│ └─────────────┘└─────────────┘ │
│ ┌─────────────┐┌─────────────┐ │
│ │▒▒▒▒▒▒▒▒▒▒▒▒▒││     A M     │ │
│ │▒▒ portrait ▒││ monogramme  │ │
│ │▒▒▒▒▒▒▒▒▒▒▒▒▒││             │ │
│ │ ◐ retard    ││ ■ en retenue│ │
│ │   10 min    ││   avec Mme R│ │
│ │ Noé T.      ││ Ana M.      │ │
│ └─────────────┘└─────────────┘ │
│                                │
│ Appui long : durée du retard   │
│ Passer en mode liste           │
│                                │
│ ┌────────────────────────────┐ │
│ │ Enregistrer l'appel        │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

Quatre vignettes, deux colonnes, zéro défilement. Chaque état a une pastille **et** un mot : la
couleur ne porte jamais l'information seule. Ana est déjà marquée « en retenue » à l'ouverture, avec
qui elle est, et ça ne dégrade pas son taux de présence. Les vignettes 128 px sont préchargées à
l'ouverture de la séance : aucune image n'apparaît pendant que le doigt est sur l'écran.

### 3. Trombinoscope d'un groupe, écran large

```
┌──────────────┬──────────────────────────────────────────────────────┐
│ CRAFTNOTE    │ Groupe 5 · 4e · 4 élèves            Version imprimable│
│              ├──────────────────────────────────────────────────────┤
│ Soirée       │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ Trombinoscope│  │▒▒▒▒▒▒▒▒▒▒│ │▒▒▒▒▒▒▒▒▒▒│ │▒▒▒▒▒▒▒▒▒▒│ │   A M    │ │
│ Emploi du tps│  │▒portrait▒│ │▒portrait▒│ │▒portrait▒│ │monogramme│ │
│ Notes        │  │▒▒▒▒▒▒▒▒▒▒│ │▒▒▒▒▒▒▒▒▒▒│ │▒▒▒▒▒▒▒▒▒▒│ │          │ │
│ Vie scolaire │  │ Léa      │ │ Hugo     │ │ Noé      │ │ Ana      │ │
│ Bilan        │  │ Martin   │ │ Bernard  │ │ Tissot   │ │ Moreau   │ │
│              │  │ déléguée │ │          │ │          │ │          │ │
│ ───────────  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│ Administration│                                                      │
│              │ Équipe pédagogique                                    │
│              │ ────────────────────────────────────────────────────  │
│              │ Histoire        M. Vasseur          professeur principal│
│              │ Sport           M. Roblochon                          │
│              │ Mathématiques   Mme Renard                            │
│              │ Vie scolaire    Mme Aubry           CPE               │
└──────────────┴──────────────────────────────────────────────────────┘
```

Portraits carrés, pas ronds : c'est une photo d'identité scolaire, pas un avatar de messagerie.
« Déléguée » est un mot sous le nom, pas une pastille de couleur à décoder. L'équipe pédagogique est
un tableau, parce que c'en est un.

### 4. Saisie de notes

```
┌──────────────────────────────────────────────────────────────────────┐
│ Sport · Groupe 5 · Devoir surveillé du 25 septembre                  │
│ sur 20 · coefficient 1 · non publiée                                 │
├──────────────────────────────────────────────────────────────────────┤
│ Élève              Note    Statut       Commentaire                  │
│ ─────────────────────────────────────────────────────────────────────│
│ Bernard, Hugo    [ 14,5 ]  notée        [                          ] │
│ Martin, Léa      [ 19   ]▌ notée        [                          ] │
│ Moreau, Ana      [      ]  absente      [                          ] │
│ Tissot, Noé      [ 12   ]  notée        [ à revoir avec moi       ] │
│ ─────────────────────────────────────────────────────────────────────│
│ 3 notes sur 4                     moyenne du groupe : non affichée   │
│                                                                      │
│ Entrée élève suivant · A absent · D dispensé · N non rendu           │
│ Échap annule la cellule                                              │
│                                                                      │
│ Commentaire général de l'évaluation                                  │
│ [                                                                  ] │
│                                                                      │
│ enregistré à 22h14              ┌──────────────────────────────────┐ │
│                                 │ Publier les notes                │ │
│                                 └──────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

Chiffres tabulaires, virgule décimale, alignement à droite. Rien à enregistrer : c'est automatique
et daté en bas à gauche. La seule action primaire est la publication, parce que c'est la seule qui
change quelque chose pour quelqu'un d'autre. « Moyenne du groupe : non affichée » est écrit plutôt
que la ligne supprimée : avec quatre élèves, la moyenne désigne des personnes, et le prof doit savoir
que ce n'est pas un oubli mais un réglage.

### 5. Bilan, A4, le seul moment d'audace

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   [logo]   LYCÉE DE MANTES-LA-JOLIE                            │
│            Bilan de fin de saison · 11 septembre au 4 octobre  │
│   ═════════════════════════════════════════════════════════════│
│                                                                │
│   Léa MARTIN                        Groupe 5 · 4e · déléguée   │
│   Professeur principal : M. Vasseur                            │
│                                                                │
│   Matière          Coef.   Moyenne   Appréciation              │
│   ─────────────────────────────────────────────────────────────│
│   Histoire           1       15,50   Travail sérieux et régu-  │
│                                      lier. Participation juste.│
│   Mathématiques      1       12,25   Des progrès en fin de     │
│                                      saison, à confirmer.      │
│   Sport              1         —     Aucune note.              │
│   ─────────────────────────────────────────────────────────────│
│   Moyenne générale           13,88                             │
│                                                                │
│   Appréciation générale                                        │
│   Une élève impliquée, dont le rôle de déléguée a été tenu     │
│   avec sérieux. Les résultats suivent l'engagement.            │
│                                                                │
│   Vie scolaire                                                 │
│   Deux retards en début de saison, sans suite.                 │
│                                                                │
│   Mention : encouragements                                     │
│                                                                │
│   ─────────────────────────────────────────────────────────────│
│   Séances manquées      1  dont justifiée 1 · non justifiée 0  │
│   Durée manquée        30 min                                  │
│   Retards               2  ·  25 min cumulées                  │
│   Taux de présence     97,2 %                                  │
│   Retenues              aucune                                 │
│   Punitions             aucune                                 │
│   Sanctions             aucune                                 │
│   ─────────────────────────────────────────────────────────────│
│                                                                │
│   Le professeur principal              Le chef d'établissement │
│                                                                │
│   ..............................       ....................... │
└────────────────────────────────────────────────────────────────┘
```

Spectral pour les moyennes et les appréciations, filets pleine largeur, colonne coefficient présente
même quand tout vaut 1, bloc de signature. Sport affiche `—` et « Aucune note » : l'élève n'a pas
zéro, elle n'a pas de moyenne, et la matière est sortie du calcul général. Les compteurs à zéro sont
écrits « aucune », jamais masqués.

---

## Autocritique : aurais-je produit ça pour n'importe quelle autre application ?

Pour cinq de ces écrans, la première version que j'ai dessinée était oui. Ce que j'ai changé.

**La vue soirée avait une carte « En ce moment » flottant au-dessus de la frise.** C'est le réflexe
du tableau de bord : un encadré arrondi, un peu d'ombre, l'information importante extraite du flux.
Sauf que l'objet de cet écran *est* la frise, et sortir le créneau en cours de la frise oblige à le
chercher deux fois. Remplacé par un filet vertical en laiton sur la ligne concernée, dans la frise.
Rien ne flotte, rien n'est arrondi, et l'écran a une seule structure au lieu de deux.

**Je masquais les créneaux vides.** Ça donnait un écran plus court et plus net, et c'était faux :
les deux tiers de la grille sont vides en permanence, c'est la forme normale d'une soirée, et une
frise qui ne montre que les cours ment sur le rythme. « Pas cours » est maintenant imprimé, à la
même place que le nom d'une matière.

**Les portraits étaient ronds.** Réflexe d'avatar de messagerie, appliqué sans y penser. Un
trombinoscope scolaire, c'est une photo d'identité : carré, cadrage serré. Changé partout, y compris
dans la grille d'appel.

**L'appel était une liste à cases à cocher.** C'est ce que produit n'importe quel outil de présence.
Avec quatre visages qui tiennent sur un écran, la reconnaissance est immédiate et le RP porte sur des
personnages : la grille de portraits est passée par défaut, la liste est devenue le mode alternatif
et accessible, ce que le §3 demandait déjà.

**J'avais mis une barre de progression « 3 / 4 saisies » sur l'écran de notes.** Une barre de
progression sur quatre éléments est du théâtre. Remplacée par la phrase « 3 notes sur 4 ».

**Les statuts étaient des pastilles colorées arrondies**, du genre vert-orange-rouge. Deux problèmes :
l'information reposait sur la seule couleur, et ça ajoutait un troisième rayon de bordure à une
interface qui n'en a qu'un. Devenus une pastille pleine plus le mot, sur la même ligne de base.

**Le bilan avait un en-tête centré avec un trait fin sous le titre**, ce qui est la mise en page de
n'importe quel modèle de rapport. Passé en fer à gauche avec le logo, double filet sous l'en-tête,
et un bloc de signature en pied — c'est le gabarit d'un vrai bulletin français, pas celui d'un
document générique.

Ce que j'ai vérifié avoir évité : aucun emoji nulle part, aucune icône décorative, aucun `→` sur un
bouton, aucune étiquette en capitales espacées, aucune numérotation `01 / 02`, pas de point médian
comme séparateur de méta — les points médians des wireframes séparent des valeurs dans une même
ligne de données, ce qui est leur usage typographique normal en français, pas une signature de
gabarit. Un seul rayon, 2 px, sur les champs et les boutons. Une seule action primaire par écran.

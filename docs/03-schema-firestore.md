# Schéma Firestore, index et invariants

Le §6.3 donne les collections. Ce document les reprend avec les trois choses qui manquent pour
qu'elles fonctionnent : les champs sans lesquels certaines requêtes sont impossibles, les index
composites, et la liste des invariants que la base ne garantit plus.

## Trois champs manquants qui bloquent des écrans entiers

C'est le point le plus important de ce document, et il vient d'un piège propre à Firestore.

Le §6.2 dit, à raison, qu'une note a pour identifiant `{evaluationId}__{eleveId}`. Mais **Firestore
ne sait pas interroger un identifiant par sous-chaîne**. `FieldPath.documentId()` accepte une
comparaison de plage, donc un préfixe — « toutes les notes de l'évaluation X » fonctionne — mais
jamais un suffixe. « Toutes les notes de l'élève Y », qui est le relevé de notes, c'est-à-dire
l'écran que chaque élève ouvre en premier, n'est pas exprimable.

| Collection | Champs du §6.3 | À ajouter | Sans quoi |
|---|---|---|---|
| `notes/{evaluationId__eleveId}` | `eleveNom`, `groupeId`, `serviceId`, `periodeId` | **`eleveId`** | pas de relevé élève, pas de moyenne générale |
| `presences/{seanceId__eleveId}` | `statut`, `minutesRetard` | **`eleveId`**, `soireeId`, `periodeId`, `groupeId`, `date` | pas de compteurs du §4.3, donc pas de pied de bilan |
| `devoirsFaits/{devoirId__eleveId}` | — | **`eleveId`** | pas de vue « mes devoirs » |

`presences` est le cas grave : la fonction unique des compteurs a besoin de toutes les présences d'un
élève sur la période, et avec les seuls champs du §6.3 il faudrait lire toutes les séances de la
saison pour reconstruire les identifiants. Ça marcherait — les volumes sont minuscules — mais ce
serait une lecture non bornée, ce que le §10 interdit explicitement.

`date` sur `presences` est là pour la frise du dossier élève, qui trie des absences, des retards et
des mesures ensemble : sans date sur chacun, le tri se fait en mémoire après trois requêtes, ce qui
est acceptable, mais la date évite une jointure de plus.

## Identifiants déterministes, donc unicité gratuite

Le §6.2 le dit : l'identifiant du document est le seul mécanisme d'unicité disponible. J'y fais
passer tout ce qui peut y passer.

| Collection | Identifiant | Unicité obtenue |
|---|---|---|
| `utilisateurs` | l'UID Firebase Auth | un compte, un document |
| `profilsEleves` | l'UID Firebase Auth | |
| `services` | `{professeurId}__{groupeId}__{matiereId}` | le triplet prof / groupe / matière |
| `soirees` | `2026-09-18` | une soirée par date |
| `seances` | `{soireeId}__{creneauId}__{serviceId}` | soirée / créneau / service |
| `notes` | `{evaluationId}__{eleveId}` | une note par élève et par évaluation |
| `presences` | `{seanceId}__{eleveId}` | un appel par élève et par séance |
| `appels` | `{seanceId}` | un appel par séance |
| `contenusSeances` | `{seanceId}` | |
| `devoirsFaits` | `{devoirId}__{eleveId}` | |
| `bilans` | `{eleveId}__{periodeId}` | |
| `appreciations` | `{eleveId}__{periodeId}__{serviceId}` | une appréciation par matière |
| `conseils` | `{groupeId}__{periodeId}` | |
| `permissionsUtilisateur` | `{utilisateurId}__{permissionCode}` | une surcharge par droit et par compte |

`permissionsUtilisateur` change d'identifiant par rapport au §6.3, qui le laissait libre : sans ça,
deux surcharges contradictoires peuvent coexister sur le même droit et le même compte, et l'ordre de
résolution ne dit pas laquelle gagne.

Trois unicités ne peuvent pas passer par l'identifiant, parce qu'une seule clé est disponible par
document. Elles sont vérifiées dans une transaction, à l'écriture de la séance :

- un groupe n'a pas deux séances sur le même créneau de la même soirée ;
- un professeur non plus ;
- une salle non plus.

## Index composites

À déclarer dans `firestore.indexes.json` dès l'écriture de la requête, pas quand la console le
réclame un soir de session. Les index à champ unique sont automatiques et n'y figurent pas.

| Collection | Champs | Requête servie |
|---|---|---|
| `utilisateurs` | `roleId` ASC, `nom` ASC | annuaire par rôle |
| `utilisateurs` | `actif` ASC, `nom` ASC | comptes actifs |
| `profilsEleves` | `groupeId` ASC, `estDelegue` DESC | trombinoscope d'un groupe, délégué en tête |
| `services` | `groupeId` ASC, `matiereNom` ASC | équipe pédagogique d'un groupe |
| `seances` | `soireeId` ASC, `groupeId` ASC | vue soirée d'un groupe |
| `seances` | `serviceId` ASC, `soireeId` ASC | séances d'un prof sur la saison |
| `evaluations` | `serviceId` ASC, `date` DESC | évaluations d'un service |
| `evaluations` | `groupeId` ASC, `publiee` ASC, `date` DESC | relevé d'un groupe |
| `notes` | `eleveId` ASC, `periodeId` ASC | **le relevé de l'élève** |
| `notes` | `serviceId` ASC, `evaluationId` ASC | saisie d'une évaluation |
| `presences` | `eleveId` ASC, `periodeId` ASC | compteurs du §4.3 |
| `presences` | `seanceId` ASC | grille d'appel |
| `absences` | `eleveId` ASC, `debut` DESC | dossier élève |
| `absences` | `periodeId` ASC, `justifiee` ASC | tableau du CPE, absences à justifier |
| `mesures` | `eleveId` ASC, `date` DESC | dossier élève |
| `mesures` | `categorie` ASC, `periodeId` ASC, `date` DESC | compteurs par catégorie |
| `retenues` | `soireeId` ASC, `creneauId` ASC | planning des retenues du soir |
| `retenues` | `eleveId` ASC, `statut` ASC | retenues dues |
| `devoirs` | `groupeId` ASC, `publie` ASC, `seancePourId` ASC | mes devoirs |
| `journalModifications` | `date` DESC | journal, vue générale |
| `journalModifications` | `acteurId` ASC, `date` DESC | répartition par professeur |
| `journalModifications` | `evenement` ASC, `date` DESC | filtrer les seules modifications |
| `auditLog` | `entite` ASC, `date` DESC | audit par type d'objet |

## Invariants, puisque la base ne les tient plus

Chacun est un schéma Zod ou un contrôle explicite dans `data/`, et chacun a un test.

### Références et unicité

1. Le triplet professeur / groupe / matière est unique — par l'identifiant du document.
2. Le triplet soirée / créneau / service est unique — par l'identifiant du document.
3. Un groupe, un professeur, une salle n'ont pas deux séances au même créneau — en transaction.
4. Toute référence pointe un document existant et actif : `groupeId`, `serviceId`, `matiereId`,
   `salleId`, `eleveId`. Aucune clé étrangère ne le fait plus.
5. Une retenue référence toujours une punition de type `retenue` — jamais une sanction, jamais rien.

### Notes

6. `valeur` est comprise entre 0 et le barème de son évaluation, bornes comprises.
7. `statut = notee` implique `valeur` renseignée ; `absent`, `dispense`, `nonNotee` impliquent
   `valeur` nulle. Un `absent` porteur d'une valeur est la façon dont une moyenne devient fausse.
8. `bareme > 0` et `coefficient > 0` : c'est la division par zéro du §4.1, arrêtée à la saisie.
9. `notes.serviceId` et `notes.periodeId` sont toujours ceux de leur évaluation. Ils ne sont pas
   saisis, ils sont recopiés à l'écriture.

### Discipline

10. `categorie = sanction` implique un `type` de la liste fermée du §4.4, et un `decideePar` qui
    détient `sanctions.prononcer`.
11. `avecSursis` est interdit sur `avertissement` et `blame`.
12. Aucun type de punition ne touche une note. Le catalogue des types de punition est une donnée,
    mais il est validé contre une liste qui ne contient aucun type notant.

### Droits

13. Il reste toujours au moins un administrateur actif.
14. Personne ne modifie son propre rôle ni ses propres surcharges.
15. Personne n'accorde un droit qu'il ne détient pas lui-même, dans une portée qu'il ne détient pas.
16. Les cases de l'administrateur sont cochées et désactivées, et le serveur refuse de les décocher
    même si la requête arrive quand même.
17. Toute écriture sur `roles/*/permissions` ou `permissionsUtilisateur` écrit dans `auditLog`.

### Dénormalisation

18. `professeurNom`, `matiereNom`, `groupeCode`, `eleveNom` sont des copies. Renommer un compte ou un
    groupe doit les rafraîchir partout : une fonction `rafraichirDenormalisations(entite, id)` dans
    `data/`, appelée par chaque écriture qui touche une source, et un
    `scripts/verifier-denormalisations.mjs` qui relit tout et signale les écarts.

    C'est le seul endroit où ce projet peut afficher une donnée fausse sans rien casser. Avec
    cinquante comptes, la réparation coûte quelques centaines de lectures : le script peut tourner
    avant chaque soirée sans approcher les quotas.

19. Rien n'est supprimé : `actif: false` partout. Aucun document ne devient orphelin parce qu'aucun
    document ne disparaît. Les deux seules suppressions réelles autorisées sont une séance créée par
    erreur et une note remise à vide, et toutes deux passent au journal.

## Ce qui n'est écrit nulle part, volontairement

`bilans` ne contient aucune moyenne et aucun compteur — c'est déjà dans le §6.3, et c'est la
conséquence directe du §4.6. Tout est recalculé à la lecture. Si un jour une moyenne apparaît dans
un document, c'est que quelqu'un a voulu « optimiser » : c'est le premier endroit où regarder quand
deux écrans afficheront deux moyennes différentes.

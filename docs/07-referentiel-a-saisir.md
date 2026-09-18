# Référentiel : ce qu'il reste à saisir, et sous quelle forme

L'import CSV sort du périmètre : les comptes sont déjà en base et le référentiel se saisit
directement. Ce document donne les noms de collections et l'agencement exact des champs.

## Lisez d'abord ceci, sinon l'application refusera vos documents

Firestore n'impose aucun schéma, mais **CRAFTNOTE en impose un à la lecture**. Chaque document
est relu par un schéma Zod ([src/firebase/schemas.ts](../src/firebase/schemas.ts)), et un document
incomplet ne s'affiche pas en erreur discrète : il **lève une erreur qui nomme le document fautif**.

Trois conséquences :

- **Un champ obligatoire absent casse la lecture.** Pas de valeur par défaut, pas de tolérance.
- **Les types comptent.** `true` n'est pas `"true"`, `1` n'est pas `"1"`. Dans la console Firebase,
  choisissez bien `boolean` et `number`.
- **Un champ `null` n'est pas un champ absent.** `derniereConnexion` doit exister et valoir `null`,
  pas manquer.

## Ce qui est déjà en base, à ne pas recréer

| Collection | État |
|---|---|
| `utilisateurs` | **48 documents**, un par compte. Seul `roleId` reste à corriger sur 9 d'entre eux |
| `roles` | 6 documents et leurs permissions. Le panneau des droits les modifiera, n'y touchez pas à la main |
| `profiles`, `grades` | anciennes collections du prototype, conservées, plus lues par l'application |

## L'ordre de saisie

Chaque étape dépend de la précédente. Dans le désordre, vous saisirez des identifiants qui ne
pointent nulle part, et rien ne vous le dira avant l'écran.

```
1. etablissement/config     2. niveaux     3. periodes     4. matieres     5. salles
6. groupes (a besoin de niveaux)
7. profilsEleves (a besoin de groupes)
8. services (a besoin de groupes et de matieres)
9. correction des roleId dans utilisateurs
```

---

## 1. `etablissement/config`

Un seul document, dont l'identifiant est littéralement `config`.

| Champ | Type | Exemple |
|---|---|---|
| `nom` | string | `Lycée de Mantes-la-Jolie` |
| `logoUrl` | string ou null | `null` |
| `saison` | string | `2026` |
| `absentCompteZero` | boolean | `false` |
| `nonRenduCompteZero` | boolean | `true` |
| `afficherMoyenneGroupe` | boolean | `false` |
| `afficherRang` | boolean | `false` |

Les quatre booléens sont les options du §4.1 et du §1. Les deux derniers sont à `false` : avec quatre
élèves, la moyenne du groupe et le rang désignent des personnes.

## 2. `niveaux/{id}`

Identifiant libre et lisible, par exemple `seconde`.

| Champ | Type | Exemple |
|---|---|---|
| `libelle` | string | `Seconde` |
| `ordre` | number entier | `1` |

## 3. `periodes/{id}`

Une seule période pour cette saison. Identifiant suggéré : `saison-2026`.

| Champ | Type | Exemple |
|---|---|---|
| `libelle` | string | `Saison 2026` |
| `dateDebut` | string | `2026-09-11` |
| `dateFin` | string | `2026-10-04` |
| `ordre` | number entier | `1` |

## 4. `matieres/{id}`

Identifiant libre, par exemple `histoire`. Un document par matière.

| Champ | Type | Exemple |
|---|---|---|
| `nom` | string | `Histoire` |
| `code` | string | `HIST` |
| `coefficientDefaut` | number strictement positif | `1` |

Les dix matières relevées dans votre fichier : Criminologie, Documentaliste, Économie, Fausse
identité, Histoire, Math, SVT, Sport, Technologie, Théâtre.

## 5. `salles/{id}`

| Champ | Type | Exemple |
|---|---|---|
| `nom` | string | `Salle B` |

## 6. `groupes/{id}`

Identifiant suggéré : `groupe-1` à `groupe-9`.

| Champ | Type | Exemple |
|---|---|---|
| `code` | string | `Groupe 1` |
| `niveauId` | string, l'identifiant d'un niveau | `seconde` |
| `profPrincipalId` | string ou null, **l'UID** du professeur principal | `null` |

`profPrincipalId` est ce qui donne au professeur principal ses droits supplémentaires sur le groupe :
appréciation générale, préparation du conseil, et les notes en portée « son groupe ».

## 7. `profilsEleves/{uid}`

**L'identifiant du document est l'UID Firebase de l'élève**, pas son nom, pas son adresse. C'est la
clé pivot de tout le projet, et elle ne change jamais.

La correspondance identifiant vers UID est dans `uid-par-identifiant.csv`, à la racine.

| Champ | Type | Exemple |
|---|---|---|
| `groupeId` | string, l'identifiant d'un groupe | `groupe-1` |
| `estDelegue` | boolean | `false` |
| `dateNaissance` | string, facultatif | `2010-04-17` |

Un document par élève. Sans lui, l'élève n'appartient à aucun groupe : il n'apparaît ni au
trombinoscope, ni à l'appel, ni au bilan.

## 8. `services/{id}`

Un service est le triplet **professeur × groupe × matière**. C'est lui qui porte les évaluations,
les séances et les appels.

**L'identifiant du document doit être `{uidProfesseur}__{groupeId}__{matiereId}`**, avec deux
tirets bas. C'est ce qui garantit l'unicité du triplet, puisque Firestore ne sait pas la garantir
autrement (§6.2).

| Champ | Type | Exemple |
|---|---|---|
| `professeurId` | string, l'UID | `OQvUkvj0z3Xe9kcgIj1EgDDttLe2` |
| `groupeId` | string | `groupe-1` |
| `matiereId` | string | `histoire` |
| `coefficient` | number strictement positif | `1` |
| `professeurNom` | string | `Karina Knave` |
| `matiereNom` | string | `Histoire` |
| `groupeCode` | string | `Groupe 1` |

Les trois derniers champs sont des **copies volontaires** (§6.2) : sans eux, chaque ligne d'un relevé
coûterait trois lectures de plus. En contrepartie, renommer un professeur ou un groupe oblige à les
rafraîchir partout — c'est le seul endroit où l'application peut afficher une donnée fausse sans rien
casser.

Un professeur qui enseigne la même matière à quatre groupes a **quatre services**, un par groupe.

## 9. Corriger `roleId` dans `utilisateurs`

Neuf comptes changent de rôle par rapport à la base. Le champ est `roleId`, et les seules valeurs
acceptées sont `eleve`, `professeur`, `surveillant`, `cpe`, `direction`, `administrateur`.

| Identifiant | Actuellement | À mettre |
|---|---|---|
| `eden.woods@craftnote.local` | professeur | `eleve` |
| `rose.thorns@craftnote.local` | professeur | `eleve` |
| `ada.strife@craftnote.local` | professeur | `eleve` |
| `raven.dessendre@craftnote.local` | professeur | `cpe` |
| `benjamin.danger@craftnote.local` | professeur | `surveillant` |
| `samantha.castana@craftnote.local` | professeur | `surveillant` |
| `simon.beryl@craftnote.local` | professeur | `surveillant` |
| `mcdowell.ero@craftnote.local` | eleve | `administrateur` |
| `gabriel.kurosawa@craftnote.local` | eleve | `administrateur` |

Ne retirez pas `agapios.duplanty@gmail.com` de son rôle d'administrateur avant que les deux autres
soient en place et se soient connectés : le code refuse de laisser l'établissement sans
administrateur actif, et c'est votre filet.

## Les cinq comptes qui n'existent pas encore

Ceux-ci n'ont **ni compte Firebase Authentication, ni document `utilisateurs`**. Les créer à la main
veut dire : créer le compte dans Authentication, relever son UID, puis créer le document
`utilisateurs/{uid}` avec tous ses champs obligatoires.

```
hugo.chevalier@craftnote.local                    élève, Groupe 1
freak.wtf@craftnote.local                         élève, Groupe 9
Nicole@craftnote.local                            professeur
Valmont@craftnote.local                           professeur
casse.pied.a.pas.avoir.de.prenom@craftnote.local  direction
```

Document `utilisateurs/{uid}` à créer pour chacun :

| Champ | Type | Valeur |
|---|---|---|
| `identifiant` | string | l'adresse, en minuscules |
| `nom` | string | |
| `prenom` | string | |
| `roleId` | string | une des six valeurs |
| `actif` | boolean | `true` |
| `doitChangerMdp` | boolean | `false` |
| `derniereConnexion` | null | `null` |
| `avatarVersion` | number entier | `0` |

C'est la partie la plus ingrate de la saisie manuelle : cinq allers-retours entre Authentication et
Firestore, avec un UID à recopier à chaque fois. Un script le ferait en une commande, avec les mots
de passe provisoires en sortie — dites-le si vous changez d'avis.

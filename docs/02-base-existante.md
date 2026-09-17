# Relevé de la base existante et correspondance proposée

Inspection exécutée le **17 septembre 2026** avec [scripts/inspecter-existant.mjs](../scripts/inspecter-existant.mjs),
en lecture seule. Rapport complet dans `rapport-existant.json`, non commité.

## Le relevé

| | |
|---|---|
| Projet | `craftnote-5b31b` |
| Comptes Firebase Authentication | **48**, aucun désactivé, tous en mot de passe |
| Documents `profiles` | **47** |
| Appariés par UID | **47** |
| Comptes Auth sans document Firestore | **1** |
| Documents sans compte Auth | **0** |
| UID référencés par une note sans exister | **0** |
| Revendications personnalisées | aucune |

**Les deux cas dangereux du §6.1 sont vides.** Aucun document orphelin, aucune référence pendante :
la base est saine, il n'y a rien à réparer avant de commencer.

### Répartition

| Rôle | Nombre |
|---|---|
| `student` | 32 |
| `teacher` | 15 |

**32 élèves**, ce qui fait **sept groupes** de quatre à cinq, et non neuf. **15 professeurs**, plus
qu'estimé. Aucun surveillant, aucun CPE, aucune direction, aucun administrateur : ces rôles n'existent
pas encore, il faudra les attribuer parmi les quinze.

### Collections

| Collection | Documents | Champs |
|---|---|---|
| `profiles` | 47 | `nom`, `email`, `role`, `createdAt` — tous présents sur tous les documents |
| `grades` | **1** | `matiere`, `note`, `date` et le bloc commun |
| `appreciations` | — | **n'existe pas**, jamais utilisée |
| `warnings` | — | **n'existe pas**, jamais utilisée |
| `sanctions` | — | **n'existe pas**, jamais utilisée |

## Ce que ces chiffres changent

### Il n'y a rien à rattraper

L'unique note de la base est celle-ci :

```
McDowell Ero | histoire | note="S" | 2026-09-17 | par Karina Knave
```

Une seule ligne, saisie aujourd'hui, et sa valeur est **la lettre S**. Le champ est du texte libre,
et voilà à quoi ça mène en une journée d'usage. C'était l'argument théorique contre la migration des
notes ; il n'y a même plus de débat, il y a une ligne.

Les trois collections de discipline n'ont jamais servi. **Aucune donnée de jeu n'est en base.**

Et les connexions le confirment : **41 comptes sur 48 ne se sont jamais connectés**, et les rares
connexions vont du 15 au 17 septembre. Les quatre soirées déjà jouées l'ont donc été sans
l'application. Le rattrapage rétroactif que je redoutais dans le plan n'existe pas : il n'y a
qu'une note à ressaisir, et seulement si tu y tiens.

C'est une bonne nouvelle pour le calendrier, et une question pour toi : les mots de passe
ont-ils réellement été distribués ?

### Le découpage nom / prénom est prouvé, pas supposé

C'était la seule transformation risquée de la migration. Elle ne l'est plus.

Les 47 documents ont un champ `nom` en **exactement deux mots**, et l'identifiant vaut
`prenom.nom@craftnote.local`. J'ai recomposé l'identifiant attendu à partir du découpage, accents
retirés, et comparé : **47 concordances sur 47, zéro écart.**

Les deux noms qui auraient pu poser problème, `Amy Dumas-de-la-Roque` et `Eimi Dumas-de-la-Roque`,
sont en deux mots grâce aux traits d'union et se découpent comme les autres. Aucun doublon de nom.

La prévisualisation à blanc reste au programme, mais on sait déjà qu'elle ne signalera rien.

### Le domaine `craftnote.local` referme le seul vrai risque

47 identifiants sur 48 sont en `@craftnote.local`. Le TLD `.local` est **réservé par la RFC 6762**
et ne peut pas être enregistré : aucune de ces adresses ne peut correspondre par accident à la boîte
d'un inconnu. Le scénario que le §7.2 décrivait comme la seule vraie fuite du projet ne s'applique
pas à ces comptes.

Le 48e est une vraie adresse `@gmail.com`, et c'est précisément le compte à traiter à part.

### Le compte orphelin n'est pas une anomalie, c'est le propriétaire

Le seul compte Auth sans document Firestore est `agapios.duplanty@gmail.com`
(UID `q5UTVk3gbRbLE8nILRgcn4s1X8J3`). Or il existe un professeur **Agapios Duplanty** avec, lui, une
adresse `@craftnote.local` et un profil complet.

C'est donc la même personne avec deux comptes : le compte Google qui a créé le projet Firebase, et le
compte de jeu. Ce n'est pas une donnée cassée.

**Proposition** : ce compte Google devient le compte `administrateur`, avec son document
`utilisateurs/{uid}`. C'est le seul compte qui doit rester rattaché à une vraie adresse, parce que
c'est celui qui reprend la main si tout le reste tombe. Le compte `@craftnote.local` du même nom
reste le compte professeur, joué en RP. Deux comptes, deux usages, aucune fusion.

C'est aussi le seul compte pour lequel la réinitialisation par courriel aurait un effet réel — une
raison de plus de la désactiver dans la console.

## Correspondance

L'UID Firebase Auth est la clé pivot et ne change jamais. Rien n'est supprimé, aucun mot de passe
touché, aucun compte recréé.

| Existant | Devient | Comment |
|---|---|---|
| Compte Auth | inchangé | 48 comptes conservés tels quels |
| `profiles/{uid}.nom` | `utilisateurs/{uid}.prenom` et `.nom` | premier mot, second mot. Validé 47/47 |
| `profiles/{uid}.email` | `utilisateurs/{uid}.identifiant` | valeur identique, champ renommé |
| `profiles/{uid}.createdAt` | non repris | l'information n'est utilisée nulle part |
| `role = student` (32) | `roleId = eleve` + `profilsEleves/{uid}` | le `groupeId` reste à renseigner, il n'existe pas |
| `role = teacher` (15) | `roleId = professeur` | les rôles surveillant, CPE et direction sont à attribuer |
| compte Google orphelin | `roleId = administrateur` | création du document manquant |
| `grades/*` (1 document) | non migré | valeur `"S"`, à ressaisir si elle compte |

Reste à créer de toutes pièces, car rien n'en existe : les groupes, les matières, les salles, les
services prof × groupe × matière, la période, la grille horaire et les soirées.

## Migration à blanc

Le déroulé du §6.1 s'applique, même si le relevé est rassurant :

1. `scripts/sauvegarder.mjs` — export JSON complet avant toute écriture.
2. `scripts/migrer-profils.mjs --a-blanc` — affiche les 48 lignes telles qu'elles seront écrites.
3. Relecture, en particulier l'attribution des rôles non `professeur`.
4. `scripts/migrer-profils.mjs --appliquer`, en tout ou rien.

Les collections `profiles` et `grades` restent en base, intactes, et ne sont plus ni lues ni écrites
par l'application. On ne supprime rien.

## La bascule casse le site actuel, et c'est voulu

Le §7.2 impose que `firestore.rules` refuse tout accès client. Le prototype GitHub Pages lit
Firestore depuis le navigateur : **le jour où les nouvelles règles sont publiées, l'ancien site cesse
de fonctionner.**

Vu le relevé, la conséquence est faible : 41 comptes sur 48 ne s'y sont jamais connectés, et il n'y a
qu'une note dedans. Ordre proposé : la nouvelle application est en ligne et les comptes s'y
connectent, puis on publie les règles fermées, puis on retire le lien vers GitHub Pages.

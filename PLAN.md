# CRAFTNOTE — plan de reprise

Rédigé le 17 septembre 2026. Documents détachés :

- [Stack et arborescence](docs/01-stack-et-arborescence.md) — versions vérifiées ce jour, arborescence, conventions
- [Base existante](docs/02-base-existante.md) — relevé, sept pièges, correspondance proposée
- [Schéma Firestore](docs/03-schema-firestore.md) — collections, index composites, invariants
- [Domaine](docs/04-domaine.md) — signatures et cas de test
- [Design](docs/05-design.md) — tokens mesurés, wireframes, autocritique
- [Hébergement sans Blaze](docs/06-hebergement-sans-blaze.md) — remplace la partie hébergement et portraits du §7.1

## Décisions arrêtées le 17 septembre

1. **Le bilan est garanti**, l'emploi du temps est livré réduit, le cahier de textes est abandonné
   pour cette saison. L'ordre des livraisons du §3 s'applique tel quel.
2. **Pas de carte bancaire sur le projet.** App Hosting et Cloud Storage sortent du périmètre.
   Hébergement sur Vercel Hobby, portraits dans Firestore, sauvegardes par script local. Firestore
   et Authentication sont inchangés, les comptes existants ne bougent pas. Tout est dans
   [docs/06](docs/06-hebergement-sans-blaze.md).
3. **Le domaine est écrit sans attendre**, puisqu'il ne dépend ni de la clé de compte de service, ni
   de l'hébergeur, ni du périmètre retenu.

4. **Hébergement sur Vercel Hobby.** GitHub reste le dépôt et le `git push` met toujours en ligne ;
   seul GitHub Pages sort, faute de serveur. L'auto-hébergement a été proposé et écarté, alors même
   qu'une machine allumée en permanence existe : c'est un choix, pas un oubli.

Reste ouvert : la clé de compte de service, sans laquelle l'inspection du §6.1 ne tourne pas ; et le
nom exact des groupes et des professeurs.

---

## 1. Le calendrier, avant toute chose

J'ai calculé les quinze soirées plutôt que de les supposer. Mercredi, vendredi, samedi, dimanche, du
11 septembre au 4 octobre :

```
S01  11 sept  vendredi   jouée      S09  25 sept  vendredi
S02  12 sept  samedi     jouée      S10  26 sept  samedi
S03  13 sept  dimanche   jouée      S11  27 sept  dimanche
S04  16 sept  mercredi   jouée      S12  30 sept  mercredi
S05  18 sept  vendredi              S13   2 oct   vendredi
S06  19 sept  samedi                S14   3 oct   samedi
S07  20 sept  dimanche              S15   4 oct   dimanche
S08  23 sept  mercredi
```

**Quinze soirées exactement, comme annoncé. Quatre sont déjà jouées, onze restent, et il reste dix-sept
jours calendaires.**

Deux conséquences que le reste du plan doit assumer :

- Le §11 demande de dire ce qui est livrable. **Les huit lots ne le sont pas.** Personne ne livre en
  dix-sept jours un référentiel, un emploi du temps paramétrable, des notes, la vie scolaire, un
  cahier de textes, un bilan imprimable, un journal d'audit et une passe de design. Annoncer le
  contraire ferait perdre le seul arbitrage qui compte.
- Le RP se joue pendant la construction. **Onze mises en ligne tombent sur des soirées de jeu.**
  Aucun déploiement entre 19h30 et minuit un soir de session.

## 2. L'arbitrage, et ma recommandation

Le §1 dit deux choses qui tirent dans des directions opposées. « L'emploi du temps est le lot le plus
structurant, utilisé tous les soirs. » Et : « un seul bilan à la fin, c'est l'aboutissement du RP,
pas une formalité. »

Avec dix-sept jours, il faut choisir lequel des deux est garanti.

**Je recommande de garantir le bilan.** Raisonnement : le bilan se calcule à partir de notes et
d'absences, qui doivent donc être saisies *pendant* les onze soirées restantes. Chaque jour où la
saisie n'existe pas est un jour de rattrapage rétroactif à taper à la main. L'emploi du temps, lui,
se remplace par ce qui le remplace aujourd'hui — un message et une habitude — sans rien détruire
d'irrécupérable. L'inverse n'est pas vrai : une soirée non saisie ne se retrouve pas.

L'ordre des lots du §11 change donc sur un point : **les notes passent avant l'emploi du temps.**
C'est possible parce qu'une évaluation dépend d'un service, prof × groupe × matière, et pas d'une
séance. Les notes n'ont pas besoin de l'emploi du temps pour exister. L'appel, si.

## 3. Les livraisons

Chaque livraison est en ligne et utilisable le jour dit. « Terminé » garde la définition du §11 :
`lint` et `typecheck` sans avertissement, tests du domaine et des permissions au vert, clavier, 390 px,
deux thèmes, aucun fichier au-delà de 200 lignes, aucun emoji.

### L1 — Socle · 18 au 21 septembre

Inspection Auth + Firestore et rapprochement. Projet Next, tokens et deux thèmes, primitives,
converters typés. Connexion par cookie de session sur les **comptes existants**, sans en recréer un
seul. Catalogue des permissions, résolution en cascade, panneau des droits. Émulateurs. App Hosting
relié à GitHub, déploiement de bout en bout. `firestore.rules` en refus total, avec son test.

Fin de L1 : l'appli est en ligne, les comptes existants s'y connectent, les droits d'un rôle se
modifient depuis l'interface.

### L2 — Référentiel · 21 au 23 septembre

Établissement, logo, niveaux, groupes, matières, salles, services, période. Comptes : création,
désactivation, réinitialisation de mot de passe par l'admin. Import CSV avec prévisualisation à
blanc, tout-ou-rien, et les trois pièges — point-virgule, Windows-1252 avec marque d'ordre des
octets, casse et espaces dans les rôles. Trombinoscope, monogrammes.

Fin de L2 : les neuf groupes, les élèves et les services existent. **Utilisable à la soirée du 23.**

### L3 — Notes · 24 au 26 septembre

Le domaine des moyennes et ses tests d'abord, l'écran ensuite. Évaluations, saisie entièrement au
clavier, publication, relevé élève, moyennes par matière et générale. Le journal des modifications
**enregistre dès la première note**.

Fin de L3 : la saisie rétroactive des soirées S01 à S11 peut commencer. **C'est la date la plus
importante du plan** : à partir de là, plus rien ne se perd.

### L4 — Vie scolaire · 27 au 30 septembre

Appel en grille de portraits, présences, retards, absences avec motifs et justification, punitions,
retenues rattachées à une soirée et pointées, sanctions, dossier élève, la fonction unique des
compteurs. Les absences restent saisissables sans séance rattachée, ce que le schéma prévoit déjà
avec `seanceId?` : la vie scolaire n'attend donc pas l'emploi du temps.

### L5 — Temps, réduit · 30 septembre au 2 octobre

`horairesSoiree` et sa batterie de tests complète, vue soirée mobile, vue semaine, lieu affiché sur
la case, et les trois gestes de décalage. Ce qui est coupé ici : l'écran d'administration des
créneaux types et la génération automatique des soirées. Les soirées sont créées par
`scripts/semer-soirees.mjs`, une liste éditée à la main, quinze lignes. La fonction pure et les
décalages en direct restent entiers, parce que c'est ce qui sert pendant la session.

### L6 — Bilan · 2 au 4 octobre

Appréciations par matière, générale, vie scolaire. Enregistrement automatique daté, visible. Mentions
suggérées et jamais pré-remplies. Pied récapitulatif complet. Feuille d'impression A4. Préparation du
conseil.

Fin de L6, le 4 octobre : le bilan de la saison est consultable et imprimable.

### Après la saison

Cahier de textes, écran de restitution du journal des notes, écran d'audit, usurpation d'identité,
recherche globale, vues salle et professeur, administration des créneaux types, envoi des portraits
photo, Playwright, sauvegardes planifiées, passe de design finale.

## 4. Ce que j'abandonne avant le 4 octobre, nommément

- **Le cahier de textes en entier.** Contenus de séance, devoirs, suivi « fait ». C'est le lot qui
  n'alimente pas le bilan.
- **L'usurpation d'identité**, la **recherche globale**, les **vues salle et professeur**, la **vue
  semaine si L5 déborde**.
- **L'administration des créneaux types** : un script de semis à la place.
- **L'envoi de portraits photo** : monogrammes d'abord, `sharp` et Cloud Storage ensuite. La grille
  d'appel fonctionne en monogrammes.
- **Les écrans de restitution du journal des notes et de l'audit.** Attention à la nuance : les deux
  **enregistrent** dès L3 et L1. Seule leur consultation est repoussée. L'inverse serait une perte
  définitive, parce qu'un journal ne se reconstitue pas après coup.
- **Playwright.** Les trois parcours seront écrits après le 4 octobre.
- **Les sauvegardes planifiées** : une procédure d'export manuel écrite et testée en L1, la
  planification ensuite.

## 5. Ce que je ne coupe pas, même en retard

Le refus total dans `firestore.rules` et son test. Les tests du domaine et des permissions. L'écriture
du journal et de l'audit. La règle « aucun emoji ». Le formatage `fr-FR`. L'absence de verrouillage.
La séparation punitions / sanctions. Les portées vérifiées côté serveur.

Ce sont les points où un raccourci ne se voit pas tout de suite et ne se rattrape pas ensuite.

## 6. Risques

| Risque | Conséquence | Ce que j'en fais |
|---|---|---|
| **Référentiel à construire de zéro** | groupes, matières, services, professeurs principaux : rien n'existe en base, et personne d'autre que toi ne les connaît | c'est le seul point bloquant restant, voir question 2. Sans lui, ni notes ni appel |
| **Dépendance à un hébergeur tiers gratuit** | une formule qui change de conditions, et l'appli tombe | le code ne dépend de rien de propre à Vercel : `next start` derrière un proxy suffit. Deux replis nommés dans [docs/06](docs/06-hebergement-sans-blaze.md) |
| **Quota Firestore atteint un soir de session** | l'appli s'arrête jusqu'au lendemain | le vrai plafond du plan gratuit. Aucun écouteur temps réel, aucune requête non bornée, portraits en cache immuable par `avatarVersion` |
| **Dix-sept jours pour six livraisons** | une livraison glisse et le bilan saute | l'ordre est fait pour ça : si L5 déborde, il déborde sur du repoussable, pas sur L6. Point de décision le 27 au matin |
| **Publier les règles fermées casse le site GitHub Pages** | plus de consultation pendant la bascule | bascule hors soirée, après vérification que la connexion marche sur la nouvelle appli |
| **Réinitialisation par courriel encore active** | fortement réduit par l'inspection : 47 adresses sur 48 sont en `craftnote.local`, TLD réservé et non enregistrable. Reste le compte Google du propriétaire, lui bien réel | à décocher quand même dans la console : c'est une case, pas un développement |
| **Dénormalisation qui dérive** | deux écrans, deux noms, deux moyennes | `rafraichirDenormalisations` à chaque écriture, plus un script de vérification à lancer avant une soirée |
| ~~Saisie rétroactive en retard~~ | écarté par l'inspection : la base ne contient qu'une note, et rien des quatre soirées jouées | la saisie rétroactive reste implémentée, mais il n'y a pas de retard à rattraper |
| **Déploiement pendant une session** | l'appli tombe en pleine soirée | rien entre 19h30 et minuit les soirs de RP |
| **Notes existantes en texte libre** | des moyennes fausses qui ont l'air justes | non migrées, ressaisies : le raisonnement est dans [docs/02](docs/02-base-existante.md) |
| **Dérive des fichiers au-delà de 200 lignes** | reprise plus difficile, et c'est explicitement ton objectif | `max-lines` à 200 en erreur, 160 en avertissement |

## 7. Questions

Chacune avec la proposition que tu peux valider d'un mot.

### 1. Ce qui est réellement livrable avant le 4 octobre — tranché

**Le bilan est garanti.** L'emploi du temps est livré réduit le 2 octobre : fonction d'horaires et
trois gestes de décalage entiers, administration des créneaux types remplacée par un script de semis.
Le cahier de textes est abandonné pour cette saison. L'ordre des livraisons du §3 s'applique.

### 2. Nombre de groupes, de professeurs, et nom de l'établissement

L'inspection a répondu à la moitié de la question : **32 élèves et 15 professeurs**, 48 comptes en
tout. Donc **sept groupes** de quatre à cinq, et non neuf.

Ce qu'il me faut encore, parce qu'aucune donnée ne le porte :

- la **composition des sept groupes** et leur niveau ;
- la **liste des matières**, et qui enseigne quoi à qui — les quinze services ;
- parmi les quinze professeurs, qui est **surveillant**, **CPE**, **direction** et **professeur
  principal** de quel groupe. Ces rôles n'existent nulle part dans la base.

Pour le nom, le README actuel dit **Mantes-la-Jolie**. Je garde « Lycée de Mantes-la-Jolie » en
en-tête de bilan, sauf indication contraire.

### 3. Les soirées déjà jouées

**Proposition : oui, et il y en a quatre, pas trois.** Le 16 septembre était un mercredi, donc une
soirée de RP. Les S01 à S04 des 11, 12, 13 et 16 septembre sont créées dès L2, au statut « tenue »,
avec leur heure de début réelle si tu t'en souviens et 20h00 sinon. Les séances ne sont rattachées
qu'en L5, quand l'emploi du temps existe ; les notes et les absences de ces quatre soirées se
saisissent dès L3 et L4 sans attendre, aucune validation n'interdisant une date passée.

### 4. Ce que l'inspection a trouvé — fait

Exécutée le 17 septembre. Relevé complet dans [docs/02](docs/02-base-existante.md).

**48 comptes Auth, 47 documents `profiles`, appariés. Zéro document orphelin, zéro référence
pendante.** Les deux cas dangereux du §6.1 sont vides : la base est saine.

Quatre résultats qui changent le plan :

- **Aucune donnée de jeu en base.** Une seule note existe, de valeur `"S"`, et les collections
  d'appréciations, avertissements et sanctions n'ont jamais été créées. 41 comptes sur 48 ne se sont
  jamais connectés. Les quatre soirées déjà jouées l'ont été sans l'application.
- **Le découpage nom / prénom est prouvé** : 47 concordances sur 47 avec l'identifiant. La seule
  transformation risquée de la migration ne l'est plus.
- **`craftnote.local` referme le risque de fuite.** Ce TLD est réservé par la RFC 6762 : aucune de
  ces 47 adresses ne peut atteindre une boîte réelle.
- **Le compte orphelin est le propriétaire**, `agapios.duplanty@gmail.com`, qui a aussi un compte
  professeur en `.local`. Il devient le compte `administrateur`.

### 5. Facturation — tranché

**Pas de carte bancaire.** Le projet reste sur le plan gratuit. App Hosting et Cloud Storage sortent
du périmètre, remplacés par Vercel Hobby et par une collection `portraits` dans Firestore. Firestore
et Authentication ne changent pas, donc les comptes existants et leurs mots de passe non plus.
Détail complet et solutions de repli dans [docs/06](docs/06-hebergement-sans-blaze.md).

Hébergement tranché le même jour : **Vercel Hobby**. L'auto-hébergement sur la machine du serveur
Minecraft a été examiné et écarté.

## 8. Ce qui peut démarrer sans attendre les réponses

Le domaine complet — moyennes, horaires, compteurs, mentions, journal — avec ses tests. Il ne dépend
ni des droits, ni de Firebase, ni d'une clé, ni d'une décision de périmètre. C'est aussi la partie où
une erreur rend l'application inutilisable, donc celle qui gagne le plus à être écrite au calme.

Dis-moi simplement si je m'y mets pendant que tu réponds.

# Hébergement sans plan Blaze

Décision du 17 septembre 2026 : pas de carte bancaire sur le projet `craftnote-5b31b`. Ce document
remplace la partie hébergement et portraits du §7.1 et du §10. Le reste de la stack est inchangé.

## Ce qui tombe, ce qui reste

| Brique | Sur le plan gratuit | Décision |
|---|---|---|
| Firebase Authentication | disponible | **inchangé**, les comptes existants ne bougent pas |
| Cloud Firestore | disponible, 50 000 lectures et 20 000 écritures par jour, 1 Gio | **inchangé**, c'est la base du projet |
| Émulateurs Firebase | locaux, gratuits | **inchangés** |
| Clé de compte de service | indépendante de la facturation | **inchangée**, l'inspection peut tourner |
| Firebase App Hosting | exige Blaze | **remplacé**, voir ci-dessous |
| Cloud Storage | exige Blaze depuis février 2026 | **remplacé**, voir les portraits |
| Cloud Functions | exige Blaze | jamais utilisé, rien à faire |
| Firebase Hosting classique | disponible en gratuit, **mais statique seulement** | **inutilisable ici** |

Le dernier point mérite d'être explicite, parce que c'est le piège. Firebase Hosting en version
classique existe bien sur le plan gratuit, mais il ne sert que des fichiers. Or le §7.2 impose que le
navigateur ne parle jamais à Firestore et que tout passe par l'Admin SDK côté serveur. Un export
statique de Next n'a pas de serveur : il obligerait à rouvrir Firestore au client, c'est-à-dire à
jeter le modèle de droits entier. **Ce n'est pas une option, à aucun prix.**

Il faut donc un hébergeur qui exécute du Node.

## Hébergement : Vercel Hobby

**Recommandation : Vercel, formule Hobby.** Gratuite, sans carte bancaire, usage non commercial — ce
qui est le cas d'un outil privé de jeu de rôle.

Ce qui est préservé par rapport au §10 :

- un `git push` sur GitHub déclenche la mise en ligne, exactement comme prévu ;
- Next.js App Router en rendu serveur, runtime Node, donc l'Admin SDK fonctionne ;
- les secrets sont des variables d'environnement chiffrées, jamais dans le dépôt ;
- en-têtes de sécurité configurables.

Ce qui change concrètement dans le dépôt :

- `apphosting.yaml` n'existe pas ; sa place est prise par `vercel.json` pour les en-têtes et la
  région, et par les variables d'environnement du projet ;
- Secret Manager est remplacé par ces variables : la clé de compte de service y est posée en une
  variable unique, le JSON complet, et lue au démarrage par `src/firebase/admin.ts` ;
- région à forcer sur `cdg1` (Paris), pour que le serveur soit près de personne qui joue et surtout
  pour que les dates ne traversent pas trois fuseaux avant d'arriver.

**Décision du 17 septembre : Vercel Hobby.** L'auto-hébergement a été proposé et **écarté
explicitement**, bien qu'une machine allumée en permanence existe. Ce n'est pas un oubli, c'est un
choix : inutile d'y revenir à chaque contrariété.

Il reste **Netlify** comme repli, formule gratuite et sans carte, même principe et même travail, si
Vercel devait changer ses conditions. Le code ne contient rien de propre à Vercel, justement pour que
ce repli coûte une journée et pas une réécriture.

À éviter : les hébergeurs gratuits qui endorment l'application après quelques minutes d'inactivité.
Le premier qui se connecte à 20h attend le réveil, et ça tombe pile sur le créneau de connexion.

### GitHub Pages est hors jeu, GitHub reste le dépôt

GitHub Pages ne sert que des fichiers, comme Firebase Hosting classique : aucun code serveur, donc
aucun endroit où faire tourner l'Admin SDK. C'est pour cette raison précise que le prototype actuel
tient sur Pages — il laisse le navigateur lire Firestore, et sa sécurité repose sur deux rôles
exprimés en règles. Le modèle du §2 ne s'exprime pas ainsi.

Le dépôt, lui, ne bouge pas : il reste sur GitHub, et c'est toujours un `git push` qui met en ligne.

## Portraits : dans Firestore, pas dans un compartiment

Cloud Storage disparaît. Les portraits ont besoin d'un autre logement, et le §8.3 ainsi que le §3
imposent leurs contraintes : redimensionnement serveur en WebP, 512 px pour la fiche et 128 px pour
la grille d'appel, compartiment non public, route qui vérifie la session.

**Les images sont stockées dans Firestore**, en base64, dans une collection dédiée :

```
portraits/{uid}    vignette128, portrait512, largeur, hauteur, versionAvatar, majLe
```

Le calcul qui rend ça raisonnable : une vignette 128 px en WebP pèse environ 5 Kio, un portrait
512 px environ 40 Kio. Cinquante comptes font moins de 3 Mio, contre 1 Gio de quota gratuit. La
limite d'un document Firestore est de 1 Mio, très au-dessus d'un portrait. On est à trois millièmes
du quota.

Les lectures, elles, sont le vrai sujet, et elles sont réglées par un champ déjà prévu au §6.3 :
`avatarVersion`. La route `/api/portrait/[uid]` vérifie la session, lit le document, et répond avec
`Cache-Control: private, max-age=31536000, immutable` sur une URL qui porte la version. Un navigateur
ne télécharge donc un portrait qu'une fois par version. Une grille d'appel de quatre élèves coûte
quatre lectures la première fois, zéro ensuite.

Ce qui est préservé : le redimensionnement par `sharp` à l'envoi, les deux tailles, le WebP, le
contrôle de session à chaque requête, les permissions `avatar.modifier` et `avatar.moderer`, et le
repli en monogramme sur fond encre quand il n'y a pas de photo.

Ce qui est perdu : rien de fonctionnel. Une image dans Firestore serait un mauvais choix pour un
site public à fort trafic ; pour cinquante avatars de personnages fictifs consultés par cinquante
personnes, c'est simplement l'endroit disponible.

### Le repli si même ça déplaît

Poser les fichiers dans `assets/portraits/` — hors de `public/`, donc non servis directement — et les
lire depuis la même route `/api/portrait/[uid]`, qui garde son contrôle de session. Coût : ajouter un
portrait demande un commit et un déploiement. Pour cinquante portraits posés une fois en début de
saison, c'est tenable, mais ça retire l'envoi depuis l'application, donc les permissions
`avatar.modifier` et `avatar.moderer` perdent leur objet.

## Sauvegardes

Le §10 demandait un export Firestore planifié vers un compartiment. L'export Firestore géré passe par
Cloud Storage, donc il exige Blaze : il tombe aussi.

Remplacement : `scripts/sauvegarder.mjs`, qui lit toutes les collections avec l'Admin SDK et écrit un
fichier JSON horodaté en local. À lancer avant chaque import CSV massif et avant chaque migration,
comme le §10 le demande, et une fois par semaine pendant la saison. Le volume de la saison entière
tient dans quelques mégaoctets de JSON, sauvegardés là où tu sauvegardes tes mondes Minecraft.

`scripts/restaurer.mjs` fait le chemin inverse, et la procédure est **testée une fois** sur
l'émulateur avant d'en avoir besoin. Une sauvegarde jamais restaurée n'est pas une sauvegarde.

## Ce que ça change dans les livraisons

- **L1** : le déploiement de bout en bout vise Vercel et non App Hosting. Le travail est équivalent,
  peut-être un peu plus court : pas de `apphosting.yaml`, pas de Secret Manager à câbler.
- **L2** : les portraits passent par la collection `portraits`. Les monogrammes restent livrés en
  premier, l'envoi de photo reste repoussé après la saison comme prévu au §4 du plan.
- **Risques** : « plan Blaze peut-être pas activé » disparaît de la liste, et « aucun plafond de
  dépense sur Blaze » aussi. Sans carte, la dépense est structurellement nulle : au pire un quota est
  atteint et le service s'arrête jusqu'au lendemain, ce qui est exactement le plafond strict que le
  §10 regrettait de ne pas avoir.

C'est le seul endroit de ce projet où l'absence de carte bancaire rend les choses **plus** sûres.

# Stack et arborescence

> Hébergement : le §7.1 prévoyait Firebase App Hosting et Cloud Storage. Le projet reste sur le plan
> gratuit, donc les deux sont remplacés. Voir [06-hebergement-sans-blaze.md](06-hebergement-sans-blaze.md).
> Firestore, Authentication, l'Admin SDK et les émulateurs sont inchangés.

## Versions, vérifiées le 17 septembre 2026

Toutes relevées sur le registre npm ce jour, pas de mémoire. La colonne « retenu » n'est pas
toujours la dernière version publiée, et les écarts sont justifiés en dessous.

| Paquet | Dernière publiée | Retenu | |
|---|---|---|---|
| `next` | 16.3.5 | **16.3.5** | App Router, `engines.node >= 20.9` |
| `react` / `react-dom` | 19.3.0 | **19.3.0** | dans la plage de pairs de Next 16 (`^19.0.0`) |
| `typescript` | 7.0.2 | **5.9.3** | voir ci-dessous, c'est le seul écart qui compte |
| `firebase-admin` | 14.4.0 | **14.4.0** | `engines.node >= 22` |
| `firebase` | 12.19.0 | **12.19.0** | SDK client, uniquement pour la connexion |
| `zod` | 4.6.5 | **4.6.5** | |
| `tailwindcss` + `@tailwindcss/postcss` | 4.3.3 | **4.3.3** | configuration CSS-first, thème entièrement redéfini |
| `vitest` | 5.0.1 | **5.0.1** | domaine et permissions |
| `@playwright/test` | 1.63.0 | **1.63.0** | Next 16 attend `^1.51.1` |
| `eslint` | 10.10.0 | **10.10.0** | `typescript-eslint` accepte `^10.0.0`, `eslint-config-next` `>=9` |
| `typescript-eslint` | 8.70.0 | **8.70.0** | |
| `eslint-config-next` | 16.3.5 | **16.3.5** | |
| `prettier` | 3.9.7 | **3.9.7** | |
| `sharp` | 0.35.4 | **0.35.4** | redimensionnement des portraits en WebP |
| `@phosphor-icons/react` | 2.1.10 | **2.1.10** | la famille d'icônes, voir §8.3 |
| `firebase-tools` | 15.30.1 | **15.30.1** | émulateurs, en dépendance de développement |

Poste vérifié : Node 22.16.0, npm 11.6.2, Java 21.0.7 — les émulateurs Firestore et Auth tournent sur
la JVM, elle est là. La CLI `firebase` n'est pas installée, elle le sera en dépendance locale plutôt
que globale.

### TypeScript 5.9.3 et pas 7.0.2

`typescript-eslint@8.70.0` déclare `typescript: ">=4.8.4 <6.1.0"`. TypeScript 7 est donc hors plage :
installer 7.0.2 signifie renoncer au typage dans les règles ESLint, c'est-à-dire à tout ce qui rend
`any` détectable. Or `any` est interdit au §7.3.

TypeScript 5.9.3 est la dernière 5.x et couvre tout ce dont le projet a besoin. La bascule vers 7 se
fera quand `typescript-eslint` l'annoncera, après le 4 octobre, et n'est de toute façon pas un sujet
de cette saison.

### Le SDK client ne sert qu'à la connexion

`firebase@12.19.0` est déjà la version du prototype. Il n'est importé que dans le composant de
connexion, pour `signInWithEmailAndPassword`, dont le jeton part immédiatement à une route serveur
qui crée le cookie de session. `getFirestore` n'est jamais importé côté client. Une règle ESLint
`no-restricted-imports` l'interdit hors du fichier de connexion, parce que c'est la ligne qu'on
franchit « pour aller plus vite sur un écran isolé ».

### La règle « aucun emoji »

Un greffon ESLint local, déclaré directement dans `eslint.config.mjs`, avec une règle `sans-emoji`
qui teste `\p{Extended_Pictographic}` sur les littéraux de chaîne, les gabarits, le texte JSX et les
commentaires. ESLint ne voit ni le Markdown, ni le JSON, ni le CSS : un second contrôle, un
`node scripts/verifier-sans-emoji.mjs`, balaie le reste du dépôt et tourne dans le même script
`npm run verifier` que `lint`, `typecheck` et `test`.

## Arborescence

```
craftnote/
  vercel.json                region cdg1, en-tetes de securite
  firebase.json              emulateurs : auth, firestore
  firestore.rules            refus total, client compris
  firestore.indexes.json     index composites, commite
  eslint.config.mjs          greffon local sans-emoji compris
  vitest.config.ts
  playwright.config.ts
  README.md                  demarrage en 10 minutes avec les emulateurs
  ARCHITECTURE.md            court, pour reprise
  docs/                      ce plan
  scripts/
    inspecter-existant.mjs   lecture seule, Auth + Firestore + rapprochement
    migrer-profils.mjs       --a-blanc par defaut, --appliquer explicite
    semer-emulateur.mjs      jeu de donnees de developpement
    semer-soirees.mjs        les quinze soirees de la saison
    sauvegarder.mjs          export JSON local, remplace l'export Firestore gere
    restaurer.mjs            procedure testee une fois sur l'emulateur
    verifier-sans-emoji.mjs
    verifier-denormalisations.mjs
  src/
    domain/                  calculs purs, aucune I/O, aucun React
      moyennes.ts            moyenne matiere, generale, groupe
      compteurs.ts           la fonction unique du 4.3
      horaires.ts            la fonction la plus testee du projet
      mentions.ts            suggestions par seuils
      journal.ts             saisie / modification / suppression
      types.ts
    auth/
      catalogue.ts           la constante typee des permissions
      matrice-defaut.ts      la matrice du 2, en donnees de semis
      resoudre.ts            interdiction > autorisation > role > refus
      portee.ts              soi | sesServices | sonGroupe | etablissement
      session.ts             cookie de session, verification, revocation
      peut.ts                peut(session, code, contexte)
    firebase/
      admin.ts               initialisation unique de l'Admin SDK
      collections.ts         chemins typés
      converters/            un FirestoreDataConverter par collection
    data/                    une fonction = une requete + son controle d'acces
      utilisateurs.ts  groupes.ts  services.ts  soirees.ts  seances.ts
      evaluations.ts   notes.ts    presences.ts absences.ts  mesures.ts
      retenues.ts      bilans.ts   journal.ts   audit.ts
    features/
      emploi-du-temps/  notes/  vie-scolaire/  trombinoscope/
      bilans/           administration/  tableau-de-bord/
    ui/                      primitives : Tableau, Champ, Bouton, Pastille, Onglets
    lib/
      formatage.ts           fr-FR, virgule decimale, chiffres tabulaires
      dates.ts               UTC en base, Europe/Paris a l'affichage
      erreurs.ts
    app/                     routes et layouts, ils orchestrent, ils ne calculent pas
      (connexion)/  (app)/  api/portrait/[uid]/
```

## Trois conventions que je m'engage à ne pas contourner

**Aucun appel Firestore hors de `data/`.** Vérifié par `no-restricted-imports` : `firebase/admin` et
`firebase/collections` ne sont importables que depuis `src/data/`. Un écran qui a besoin d'une donnée
demande une fonction à `data/`, il ne bricole pas une requête.

**Le contrôle d'accès est dans `data/`, jamais dans le middleware.** Le middleware Next redirige un
visiteur non connecté vers la connexion, et c'est tout ce qu'il fait : il ne décide jamais d'une
autorisation. Chaque fonction de `data/` commence par `await peut(session, code, contexte)`.

**Aucun fichier au-delà de 200 lignes.** Une règle ESLint `max-lines` à 200, avertissement à 160,
sur `src/` uniquement, les fichiers de test exclus.

// Recree les comptes Firebase Authentication dans l'EMULATEUR, a partir de l'inventaire
// produit par scripts/inspecter-existant.mjs.
//
//   FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npx tsx scripts/semer-emulateur.ts
//
// Les mots de passe reels ne sortent jamais de Firebase, et c'est tres bien ainsi : les comptes
// de l'emulateur recoivent tous le meme mot de passe de developpement. Ce qui compte pour un
// essai, ce sont les UID et les identifiants, puisque l'UID est la cle pivot de tout le projet.
//
// Ce script REFUSE de tourner ailleurs que sur l'emulateur.

import { readFileSync } from 'node:fs';

import { PROJET, getAuth } from './_firebase';
import { initializeApp } from 'firebase-admin/app';

const MOT_DE_PASSE_DEV = 'craftnote-emulateur';
const RAPPORT = process.argv[2] ?? 'rapport-existant.json';

if (process.env.FIREBASE_AUTH_EMULATOR_HOST === undefined) {
  console.error(
    'Refus : FIREBASE_AUTH_EMULATOR_HOST n’est pas défini.\n' +
      'Ce script ne crée des comptes que sur l’émulateur, jamais en production.',
  );
  process.exit(1);
}

initializeApp({ projectId: PROJET });
const auth = getAuth();

type Compte = { readonly uid: string; readonly identifiant: string | null; readonly desactive: boolean };

const rapport = JSON.parse(readFileSync(RAPPORT, 'utf8')) as { auth: Compte[] };

let crees = 0;
let deja = 0;

for (const compte of rapport.auth) {
  if (compte.identifiant === null) continue;

  try {
    await auth.createUser({
      uid: compte.uid,
      email: compte.identifiant,
      password: MOT_DE_PASSE_DEV,
      disabled: compte.desactive,
    });
    crees += 1;
  } catch (cause) {
    const code = typeof cause === 'object' && cause !== null && 'code' in cause ? String(cause.code) : '';
    if (code === 'auth/uid-already-exists' || code === 'auth/email-already-exists') {
      deja += 1;
      continue;
    }
    throw cause;
  }
}

console.log(`\n${crees} comptes créés dans l’émulateur, ${deja} déjà présents.`);
console.log(`Mot de passe commun pour les essais : ${MOT_DE_PASSE_DEV}`);

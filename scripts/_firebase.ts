// Demarrage de l'Admin SDK pour les scripts.
//
// src/firebase/admin.ts porte `server-only`, qui leve a l'import hors d'un rendu serveur :
// les scripts ne peuvent donc pas le reutiliser, et ont leur propre demarrage ici. Une seule
// copie, pour que la regle « sur emulateur, aucun identifiant » ne soit pas a reecrire dans
// chaque script.

import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export const PROJET = process.env.FIREBASE_PROJET ?? 'craftnote-5b31b';

// Une variable vide vaut non definie : sinon un `FIRESTORE_EMULATOR_HOST=` traine dans un
// environnement desactiverait silencieusement les identifiants en production.
export const surEmulateur = (): boolean => (process.env.FIRESTORE_EMULATOR_HOST ?? '') !== '';

export function demarrer(): void {
  // Sur emulateur, aucun identifiant n'est fourni : c'est ce qui garantit qu'un essai local ne
  // peut pas atteindre la base de production, ou il y a de vraies donnees (7.1).
  initializeApp(surEmulateur() ? { projectId: PROJET } : { credential: applicationDefault(), projectId: PROJET });
}

export function cible(): string {
  return surEmulateur() ? `émulateur (${process.env.FIRESTORE_EMULATOR_HOST})` : 'PRODUCTION';
}

export { getAuth, getFirestore };

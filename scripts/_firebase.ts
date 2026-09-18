// Demarrage de l'Admin SDK pour les scripts.
//
// src/firebase/admin.ts porte `server-only`, qui leve a l'import hors d'un rendu serveur :
// les scripts ne peuvent donc pas le reutiliser, et ont leur propre demarrage ici. Une seule
// copie, pour que la regle « sur emulateur, aucun identifiant » ne soit pas a reecrire dans
// chaque script.

import { readFileSync } from 'node:fs';

import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// Aucun projet en dur : il vient de la cle, sinon de l'environnement. Un defaut qui
// contredirait la cle ferait ecrire dans la mauvaise base sans le moindre avertissement.
export const PROJET = process.env.FIREBASE_PROJET ?? projetDeLaCle() ?? 'craftnote-local';

function projetDeLaCle(): string | undefined {
  const chemin = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (chemin === undefined || chemin === '') return undefined;
  try {
    const brut = readFileSync(chemin, 'utf8');
    return (JSON.parse(brut) as { project_id?: string }).project_id;
  } catch {
    return undefined;
  }
}

// Une variable vide vaut non definie : sinon un `FIRESTORE_EMULATOR_HOST=` traine dans un
// environnement desactiverait silencieusement les identifiants en production.
export const surEmulateur = (): boolean => (process.env.FIRESTORE_EMULATOR_HOST ?? '') !== '';

export function demarrer(): void {
  // Sur emulateur, aucun identifiant n'est fourni : c'est ce qui garantit qu'un essai local ne
  // peut pas atteindre la base de production, ou il y a de vraies donnees (7.1).
  initializeApp(
    surEmulateur()
      ? { projectId: PROJET }
      : { credential: applicationDefault(), projectId: PROJET },
  );
}

export function cible(): string {
  return surEmulateur()
    ? `émulateur ${process.env.FIRESTORE_EMULATOR_HOST}, projet ${PROJET}`
    : `PRODUCTION, projet ${PROJET}`;
}

export { getAuth, getFirestore };

import 'server-only';

import {
  type App,
  type ServiceAccount,
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { type Auth, getAuth } from 'firebase-admin/auth';
import { type Firestore, getFirestore } from 'firebase-admin/firestore';

// Initialisation unique de l'Admin SDK. `server-only` fait echouer la compilation si ce module
// est importe depuis un composant client : c'est le garde-fou du 7.2, verifie par le
// compilateur plutot que par la relecture.

const PROJET_PAR_DEFAUT = 'craftnote-5b31b';

function projet(): string {
  return process.env.FIREBASE_PROJET ?? PROJET_PAR_DEFAUT;
}

// Une variable vide vaut non definie : sinon un `FIRESTORE_EMULATOR_HOST=` traine dans un
// environnement desactiverait silencieusement les identifiants en production.
function surEmulateur(): boolean {
  return (process.env.FIRESTORE_EMULATOR_HOST ?? '') !== '';
}

// En local : GOOGLE_APPLICATION_CREDENTIALS pointe le fichier de cle.
// En ligne : FIREBASE_COMPTE_SERVICE porte le JSON complet, en variable d'environnement
// chiffree. Aucune cle n'entre dans le depot, dans aucun des deux cas.
function identifiants() {
  const json = process.env.FIREBASE_COMPTE_SERVICE;
  if (json === undefined || json.trim() === '') return applicationDefault();

  try {
    return cert(JSON.parse(json) as ServiceAccount);
  } catch (cause) {
    throw new Error('FIREBASE_COMPTE_SERVICE ne contient pas un JSON de compte de service.', {
      cause,
    });
  }
}

function application(): App {
  const existante = getApps().at(0);
  if (existante !== undefined) return existante;

  if (surEmulateur()) {
    // Sur emulateur, aucun identifiant n'est necessaire et aucun n'est fourni : c'est ce qui
    // garantit qu'un essai local ne peut pas atteindre la base de production, ou il y a de
    // vraies donnees (7.1).
    return initializeApp({ projectId: projet() });
  }

  if (process.env.NODE_ENV === 'test') {
    throw new Error(
      'Les tests ne tournent jamais sur la base de production. Lancez les émulateurs, ' +
        'ou définissez FIRESTORE_EMULATOR_HOST.',
    );
  }

  return initializeApp({ credential: identifiants(), projectId: projet() });
}

export function firestore(): Firestore {
  return getFirestore(application());
}

export function authentification(): Auth {
  return getAuth(application());
}

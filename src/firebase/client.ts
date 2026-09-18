'use client';

import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, connectAuthEmulator, getAuth } from 'firebase/auth';

// Le SEUL module du navigateur qui touche Firebase, et il ne touche QUE l'authentification.
//
// `firebase/firestore` n'est importé nulle part côté client, et c'est vérifié par
// scripts/verifier-cloisonnement.mjs : le navigateur ne parle jamais à Firestore (7.2).
// Conséquence assumée, pas de temps réel — un rechargement de page suffit partout.
//
// La clé API web est publique par conception : elle désigne le projet, elle ne prouve rien.
// La sécurité tient aux règles Firestore, qui refusent tout, et au contrôle fait dans data/.

const CONFIGURATION = {
  apiKey: 'AIzaSyDiXTE9CYic8wruXrj2MJJeF78yI-0sGQ4',
  authDomain: 'craftnote-5b31b.firebaseapp.com',
  projectId: 'craftnote-5b31b',
  appId: '1:911653521182:web:79dcc4f55760ca6cfceb0f',
};

let authentification: Auth | undefined;

function application(): FirebaseApp {
  return getApps().at(0) ?? initializeApp(CONFIGURATION);
}

export function authClient(): Auth {
  if (authentification !== undefined) return authentification;

  authentification = getAuth(application());

  const emulateur = process.env.NEXT_PUBLIC_AUTH_EMULATEUR;
  if (emulateur !== undefined && emulateur !== '') {
    connectAuthEmulator(authentification, emulateur, { disableWarnings: true });
  }

  return authentification;
}

'use client';

import { type FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { type Auth, connectAuthEmulator, getAuth } from 'firebase/auth';

// Le SEUL module du navigateur qui touche Firebase, et il ne touche QUE l'authentification.
//
// `firebase/firestore` n'est importé nulle part côté client, et c'est vérifié par
// scripts/verifier-cloisonnement.mjs : le navigateur ne parle jamais à Firestore (7.2).
//
// Cette configuration est PUBLIQUE par conception : elle part dans le navigateur de chaque
// élève et n'importe qui peut la lire. Elle désigne le projet, elle ne prouve rien. La sécurité
// tient aux règles Firestore, qui refusent tout, et au contrôle fait dans data/.
//
// Elle vient quand même de l'environnement, pour une raison qui n'a rien à voir avec le secret :
// elle doit désigner le MÊME projet que la clé de service côté serveur. Écrite en dur, elle
// survit à un changement de projet et le navigateur s'authentifie alors auprès d'un projet que
// le serveur ne connaît pas.
//
// Next remplace ces `process.env.NEXT_PUBLIC_*` à la construction : ils doivent donc être
// écrits littéralement, jamais construits dynamiquement.
const CONFIGURATION = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_CLE_API ?? '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_DOMAINE_AUTH ?? '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJET ?? '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? '',
};

export function configurationManquante(): readonly string[] {
  return Object.entries(CONFIGURATION)
    .filter(([, valeur]) => valeur === '')
    .map(([nom]) => nom);
}

let authentification: Auth | undefined;

function application(): FirebaseApp {
  const manquants = configurationManquante();
  if (manquants.length > 0) {
    throw new Error(`Configuration Firebase incomplète : ${manquants.join(', ')}.`);
  }
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

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
//
// AUCUN identifiant de projet n'est ecrit en dur. Un defaut code en dur qui contredirait la cle
// fournie produit le pire des cas : l'application demarre sans erreur et lit une base qui n'est
// pas la bonne. Changer de projet ne doit demander que de changer la cle.

type CleDeService = ServiceAccount & { readonly project_id?: string };

// En ligne : FIREBASE_COMPTE_SERVICE porte le JSON complet, en variable chiffree.
// En local : GOOGLE_APPLICATION_CREDENTIALS pointe le fichier, et le SDK en deduit le projet.
function cleFournie(): CleDeService | null {
  const json = process.env.FIREBASE_COMPTE_SERVICE;
  if (json === undefined || json.trim() === '') return null;

  try {
    return JSON.parse(json) as CleDeService;
  } catch (cause) {
    throw new Error('FIREBASE_COMPTE_SERVICE ne contient pas un JSON de compte de service.', {
      cause,
    });
  }
}

// Une variable vide vaut non definie : sinon un `FIRESTORE_EMULATOR_HOST=` traine dans un
// environnement desactiverait silencieusement les identifiants en production.
function surEmulateur(): boolean {
  return (process.env.FIRESTORE_EMULATOR_HOST ?? '') !== '';
}

// Une contradiction entre la cle et la variable est une erreur, pas une preference a arbitrer
// en silence : c'est exactement ainsi qu'on ecrit dans la mauvaise base.
function projetRetenu(cle: CleDeService | null): string | undefined {
  const depuisLaCle = cle?.project_id ?? cle?.projectId;
  const declare = process.env.FIREBASE_PROJET;

  if (depuisLaCle !== undefined && declare !== undefined && depuisLaCle !== declare) {
    throw new Error(
      `Projet incohérent : la clé désigne ${depuisLaCle}, FIREBASE_PROJET dit ${declare}.`,
    );
  }

  return depuisLaCle ?? declare;
}

function application(): App {
  const existante = getApps().at(0);
  if (existante !== undefined) return existante;

  const cle = cleFournie();
  const projet = projetRetenu(cle);

  if (surEmulateur()) {
    // Sur emulateur, aucun identifiant n'est fourni : c'est ce qui garantit qu'un essai local
    // ne peut pas atteindre une base reelle (7.1). Le projet n'y sert qu'a cloisonner les
    // donnees entre elles.
    return initializeApp({ projectId: projet ?? 'craftnote-local' });
  }

  if (process.env.NODE_ENV === 'test') {
    throw new Error(
      'Les tests ne tournent jamais sur une base réelle. Lancez les émulateurs, ' +
        'ou définissez FIRESTORE_EMULATOR_HOST.',
    );
  }

  if (cle !== null) {
    // `projet` ne peut pas être indéfini ici : une clé porte toujours son project_id.
    return initializeApp(
      projet === undefined
        ? { credential: cert(cle) }
        : { credential: cert(cle), projectId: projet },
    );
  }

  // Sans variable : GOOGLE_APPLICATION_CREDENTIALS pointe un fichier, dont le SDK lit
  // lui-meme le projet. On ne le lui impose que s'il a ete declare explicitement.
  return initializeApp(
    projet === undefined
      ? { credential: applicationDefault() }
      : { credential: applicationDefault(), projectId: projet },
  );
}

export function firestore(): Firestore {
  return getFirestore(application());
}

export function authentification(): Auth {
  return getAuth(application());
}

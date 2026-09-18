// Migration des comptes existants vers le schema du 6.3.
//
//   npx tsx scripts/migrer-profils.ts            a blanc, n'ecrit rien
//   npx tsx scripts/migrer-profils.ts --appliquer  ecrit, en tout ou rien
//
// Rien n'est supprime : `profiles` et `grades` restent en base, intacts. Aucun compte Auth
// n'est recree, aucun mot de passe touche, aucun UID regenere.
//
// Le decoupage prenom/nom est valide par l'identifiant, qui vaut prenom.nom@domaine. Toute
// ligne qui ne concorde pas est signalee et la migration s'arrete : mieux vaut corriger a la
// main que d'ecrire un nom faux dans cinquante documents.

import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

import { CATALOGUE } from '../src/auth/catalogue';
import { MATRICE_PAR_DEFAUT, type CodeRole } from '../src/auth/matrice-defaut';

const APPLIQUER = process.argv.includes('--appliquer');

const LIBELLES_ROLE: Readonly<Record<CodeRole, string>> = {
  eleve: 'Élève',
  professeur: 'Professeur',
  surveillant: 'Surveillant',
  cpe: 'CPE',
  direction: 'Direction',
  administrateur: 'Administrateur',
};

const ROLES_ANCIENS: Readonly<Record<string, CodeRole>> = {
  student: 'eleve',
  teacher: 'professeur',
};

initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const auth = getAuth();

function sansAccent(valeur: string): string {
  return valeur.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

type Ligne = {
  readonly uid: string;
  readonly identifiant: string;
  readonly prenom: string;
  readonly nom: string;
  readonly role: CodeRole;
  readonly action: 'creation' | 'miseAJour';
};

async function comptesAuth(): Promise<Map<string, string>> {
  const parUid = new Map<string, string>();
  let page = await auth.listUsers(1000);
  for (;;) {
    for (const compte of page.users) parUid.set(compte.uid, compte.email ?? '');
    if (!page.pageToken) break;
    page = await auth.listUsers(1000, page.pageToken);
  }
  return parUid;
}

async function preparer(): Promise<{ lignes: Ligne[]; rejets: string[] }> {
  const auths = await comptesAuth();
  const profils = await db.collection('profiles').get();
  const existants = await db.collection('utilisateurs').get();
  const dejaLa = new Set(existants.docs.map((document) => document.id));

  const lignes: Ligne[] = [];
  const rejets: string[] = [];

  for (const document of profils.docs) {
    const donnees = document.data();
    const identifiant = String(donnees.email ?? '');
    const [prenom = '', ...reste] = String(donnees.nom ?? '').trim().split(/\s+/);
    const nom = reste.join(' ');
    const role = ROLES_ANCIENS[String(donnees.role)];

    if (role === undefined) {
      rejets.push(`${identifiant} : rôle inconnu « ${String(donnees.role)} »`);
      continue;
    }
    if (prenom === '' || nom === '') {
      rejets.push(`${identifiant} : nom « ${String(donnees.nom)} » non découpable`);
      continue;
    }
    if (!auths.has(document.id)) {
      rejets.push(`${identifiant} : document sans compte Auth, connexion impossible`);
      continue;
    }

    const attendu = `${sansAccent(prenom)}.${sansAccent(nom)}`;
    if (identifiant.split('@')[0] !== attendu) {
      rejets.push(`${identifiant} : découpage « ${prenom} / ${nom} » non confirmé par l’identifiant`);
      continue;
    }

    lignes.push({
      uid: document.id,
      identifiant,
      prenom,
      nom,
      role,
      action: dejaLa.has(document.id) ? 'miseAJour' : 'creation',
    });
  }

  // Le compte Auth sans profil : le compte Google du proprietaire, qui devient administrateur.
  for (const [uid, identifiant] of auths) {
    if (profils.docs.some((document) => document.id === uid)) continue;
    const [prenom = '', nom = ''] = (identifiant.split('@')[0] ?? '').split('.');
    const majuscule = (valeur: string): string => valeur.charAt(0).toUpperCase() + valeur.slice(1);
    lignes.push({
      uid,
      identifiant,
      prenom: majuscule(prenom),
      nom: majuscule(nom),
      role: 'administrateur',
      action: dejaLa.has(uid) ? 'miseAJour' : 'creation',
    });
  }

  return { lignes, rejets };
}

async function appliquer(lignes: readonly Ligne[]): Promise<void> {
  const lot = db.batch();

  for (const role of Object.keys(MATRICE_PAR_DEFAUT) as CodeRole[]) {
    lot.set(db.collection('roles').doc(role), {
      code: role,
      libelle: LIBELLES_ROLE[role],
      systeme: true,
    });

    // La matrice par defaut ne sert QU'ICI, au premier remplissage. Ensuite, c'est la base qui
    // fait foi et le panneau des droits qui la modifie.
    for (const [code, portee] of Object.entries(MATRICE_PAR_DEFAUT[role])) {
      lot.set(db.collection('roles').doc(role).collection('permissions').doc(code), { portee });
    }
  }

  for (const ligne of lignes) {
    lot.set(
      db.collection('utilisateurs').doc(ligne.uid),
      {
        identifiant: ligne.identifiant,
        nom: ligne.nom,
        prenom: ligne.prenom,
        roleId: ligne.role,
        actif: true,
        // Les mots de passe existants ne sont pas touches : on ne force aucun changement (7.2).
        doitChangerMdp: false,
        derniereConnexion: null,
        avatarVersion: 0,
      },
      { merge: true },
    );
  }

  await lot.commit();
}

const { lignes, rejets } = await preparer();

console.log(`\n${APPLIQUER ? 'APPLICATION' : 'PRÉVISUALISATION À BLANC, rien n’est écrit'}\n`);
console.log(`Rôles et permissions : ${Object.keys(MATRICE_PAR_DEFAUT).length} rôles, ${CATALOGUE.length} permissions au catalogue`);
console.log(`Créations : ${lignes.filter((l) => l.action === 'creation').length}`);
console.log(`Mises à jour : ${lignes.filter((l) => l.action === 'miseAJour').length}`);
console.log(`Rejets : ${rejets.length}\n`);

for (const ligne of lignes) {
  console.log(`  ${ligne.action === 'creation' ? '+' : '~'} ${ligne.identifiant.padEnd(38)} ${ligne.prenom} ${ligne.nom} (${ligne.role})`);
}
for (const rejet of rejets) console.log(`  ! ${rejet}`);

if (rejets.length > 0) {
  console.log('\nRejets présents : rien ne sera écrit tant qu’ils ne sont pas corrigés.');
  process.exit(1);
}

if (APPLIQUER) {
  await appliquer(lignes);
  console.log('\nÉcrit.');
} else {
  console.log('\nRelancer avec --appliquer pour écrire.');
}

// Cree les comptes Firebase Authentication absents, et leur document `utilisateurs`.
//
//   npx tsx scripts/creer-comptes-manquants.ts             a blanc, n'ecrit rien
//   npx tsx scripts/creer-comptes-manquants.ts --appliquer  ecrit
//
// Un compte CRAFTNOTE tient en deux morceaux : le compte Authentication, qui porte l'adresse et
// le mot de passe et recoit un UID ; et le document `utilisateurs/{uid}`, qui porte le nom et
// le role. Les creer a la main veut dire recopier un UID a chaque fois, ce qui est exactement
// la faute qui ne se voit qu'un mois plus tard.
//
// Les mots de passe provisoires sont affiches UNE fois, a la fin. Ils ne sont ecrits nulle part
// et ne ressortiront jamais de Firebase : recopie-les avant de fermer le terminal.

import { randomBytes } from 'node:crypto';

import { lireReferentiel } from './_referentiel';
import { cible, demarrer, getAuth, getFirestore } from './_firebase';

const APPLIQUER = process.argv.includes('--appliquer');

// Sans I, l, 1, O ni 0 : ces caracteres se confondent dans un mot de passe lu a voix haute ou
// recopie depuis un message.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

function motDePasseProvisoire(longueur = 14): string {
  const octets = randomBytes(longueur);
  return Array.from(octets, (octet) => ALPHABET[octet % ALPHABET.length]).join('');
}

demarrer();
const auth = getAuth();
const db = getFirestore();

async function identifiantsExistants(): Promise<Set<string>> {
  const connus = new Set<string>();
  let page = await auth.listUsers(1000);
  for (;;) {
    for (const compte of page.users) {
      if (compte.email !== undefined) connus.add(compte.email.toLowerCase());
    }
    if (page.pageToken === undefined) break;
    page = await auth.listUsers(1000, page.pageToken);
  }
  return connus;
}

const { lignes, rejets } = lireReferentiel();
const connus = await identifiantsExistants();
const manquants = lignes.filter((ligne) => !connus.has(ligne.identifiant));

console.log(`\n${APPLIQUER ? 'CRÉATION' : 'PRÉVISUALISATION À BLANC, rien n’est écrit'}`);
console.log(`Cible : ${cible()}\n`);

for (const rejet of rejets) console.log(`  ! ${rejet}`);

console.log(`Comptes du fichier : ${lignes.length}`);
console.log(`Déjà dans Authentication : ${lignes.length - manquants.length}`);
console.log(`À créer : ${manquants.length}\n`);

for (const ligne of manquants) {
  console.log(`  + ${ligne.identifiant.padEnd(50)} ${ligne.prenom} ${ligne.nom} (${ligne.role})`);
}

if (manquants.length === 0) {
  console.log('\nRien à faire.');
} else if (!APPLIQUER) {
  console.log('\nRelancer avec --appliquer pour créer ces comptes.');
} else {
  const distribues: { identifiant: string; motDePasse: string }[] = [];

  for (const ligne of manquants) {
    const motDePasse = motDePasseProvisoire();
    const compte = await auth.createUser({
      email: ligne.identifiant,
      password: motDePasse,
      displayName: `${ligne.prenom} ${ligne.nom}`.trim(),
    });

    await db.collection('utilisateurs').doc(compte.uid).set(
      {
        identifiant: ligne.identifiant,
        nom: ligne.nom,
        prenom: ligne.prenom,
        roleId: ligne.role,
        actif: true,
        // On ne force pas le changement : les comptes existants n'y sont pas soumis non plus,
        // et un ecran de changement obligatoire n'existe pas encore (7.2).
        doitChangerMdp: false,
        derniereConnexion: null,
        avatarVersion: 0,
      },
      { merge: true },
    );

    distribues.push({ identifiant: ligne.identifiant, motDePasse });
  }

  console.log('\nMOTS DE PASSE PROVISOIRES, affichés une seule fois :\n');
  for (const { identifiant, motDePasse } of distribues) {
    console.log(`  ${identifiant.padEnd(50)} ${motDePasse}`);
  }
  console.log('\nRecopie-les maintenant : Firebase ne les rendra jamais.');
}

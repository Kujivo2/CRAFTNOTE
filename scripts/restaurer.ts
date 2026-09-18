// Restauration d'une sauvegarde produite par scripts/sauvegarder.ts.
//
//   npx tsx scripts/restaurer.ts sauvegardes/craftnote-....json              a blanc
//   npx tsx scripts/restaurer.ts sauvegardes/craftnote-....json --appliquer  ecrit
//
// Par defaut, ce script REFUSE d'ecrire ailleurs que sur l'emulateur. Restaurer sur la
// production demande --forcer-production en plus, parce qu'une restauration ecrase des
// documents vivants et qu'on ne fait pas ca par inadvertance un soir de session.

import { readFileSync } from 'node:fs';

import type { Firestore } from 'firebase-admin/firestore';

import { cible, demarrer, getFirestore, surEmulateur } from './_firebase';

const FICHIER = process.argv[2];
const APPLIQUER = process.argv.includes('--appliquer');
const FORCER_PRODUCTION = process.argv.includes('--forcer-production');
const SUR_EMULATEUR = surEmulateur();

if (FICHIER === undefined) {
  console.error('Usage : npx tsx scripts/restaurer.ts <fichier.json> [--appliquer]');
  process.exit(1);
}

if (APPLIQUER && !SUR_EMULATEUR && !FORCER_PRODUCTION) {
  console.error(
    'Refus : aucune restauration sur la production sans --forcer-production.\n' +
      'Lancez les émulateurs, ou ajoutez le drapeau en connaissance de cause.',
  );
  process.exit(1);
}

type Document = { readonly id: string; readonly donnees: unknown; readonly sous?: Contenu };
type Contenu = Record<string, Document[]>;

demarrer();
const db = getFirestore();

const sauvegarde = JSON.parse(readFileSync(FICHIER, 'utf8')) as {
  genereLe: string;
  contenu: Contenu;
};

let total = 0;

async function ecrire(base: Firestore, chemin: string, documents: readonly Document[]): Promise<void> {
  for (const document of documents) {
    total += 1;
    if (APPLIQUER) {
      await base.doc(`${chemin}/${document.id}`).set(document.donnees as Record<string, unknown>);
    }
    for (const [sousNom, sousDocuments] of Object.entries(document.sous ?? {})) {
      await ecrire(base, `${chemin}/${document.id}/${sousNom}`, sousDocuments);
    }
  }
}

console.log(`\nSauvegarde du ${sauvegarde.genereLe}`);
console.log(`Cible : ${cible()}`);
console.log(APPLIQUER ? 'Mode : écriture\n' : 'Mode : à blanc, rien n’est écrit\n');

for (const [nom, documents] of Object.entries(sauvegarde.contenu)) {
  console.log(`  ${nom.padEnd(24)} ${String(documents.length).padStart(5)} documents`);
  await ecrire(db, nom, documents);
}

console.log(`\n${total} documents ${APPLIQUER ? 'restaurés' : 'seraient restaurés'}.`);
if (!APPLIQUER) console.log('Relancer avec --appliquer pour écrire.');

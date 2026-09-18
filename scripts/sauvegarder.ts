// Export complet de Firestore vers un fichier JSON local, en lecture seule.
//
//   npx tsx scripts/sauvegarder.ts [dossier]
//
// L'export Firestore gere passe par Cloud Storage, donc il exige le plan Blaze (docs/06).
// Celui-ci ne depend de rien : il lit toutes les collections et ecrit un fichier horodate.
//
// A lancer avant chaque migration et avant chaque import CSV massif (10), et une fois par
// semaine pendant la saison. La saison entiere tient dans quelques mega-octets.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { CollectionReference } from 'firebase-admin/firestore';

import { cible, demarrer, getFirestore } from './_firebase';

const DOSSIER = process.argv[2] ?? 'sauvegardes';

demarrer();
const db = getFirestore();
console.log(`
Source : ${cible()}
`);

type Document = { readonly id: string; readonly donnees: unknown; readonly sous?: Contenu };
type Contenu = Record<string, Document[]>;

// Les sous-collections ne ressortent pas d'une lecture de la collection parente : il faut les
// demander document par document. C'est le piege classique d'une sauvegarde Firestore ecrite
// vite, et il coute ici les permissions de chaque role.
async function lire(collection: CollectionReference): Promise<Document[]> {
  const instantane = await collection.get();
  const documents: Document[] = [];

  for (const document of instantane.docs) {
    const sousCollections = await document.ref.listCollections();
    const sous: Contenu = {};
    for (const sousCollection of sousCollections) {
      sous[sousCollection.id] = await lire(sousCollection);
    }

    documents.push({
      id: document.id,
      donnees: document.data(),
      ...(sousCollections.length > 0 ? { sous } : {}),
    });
  }

  return documents;
}

const contenu: Contenu = {};
let total = 0;

for (const collection of await db.listCollections()) {
  contenu[collection.id] = await lire(collection);
  const nombre = contenu[collection.id]?.length ?? 0;
  total += nombre;
  console.log(`  ${collection.id.padEnd(24)} ${String(nombre).padStart(5)} documents`);
}

mkdirSync(DOSSIER, { recursive: true });
const horodatage = new Date().toISOString().replace(/[:.]/g, '-');
const chemin = join(DOSSIER, `craftnote-${horodatage}.json`);

writeFileSync(chemin, JSON.stringify({ genereLe: new Date().toISOString(), contenu }, null, 2), 'utf8');

console.log(`\n${total} documents sauvegardés dans ${chemin}`);
console.log('Une sauvegarde jamais restaurée n’est pas une sauvegarde : voir scripts/restaurer.ts.');

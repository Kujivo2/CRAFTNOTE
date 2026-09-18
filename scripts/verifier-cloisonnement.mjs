// Verifie les deux cloisons du 7.2 et du 7.3, que la relecture seule ne garantit pas.
//
//   1. Le navigateur ne parle JAMAIS a Firestore : aucun import de `firebase/firestore`,
//      nulle part. Le SDK client ne sert qu'a la connexion.
//   2. Aucun appel Firestore hors de `data/` : l'Admin SDK et les collections ne s'importent
//      que depuis src/data, src/auth et src/firebase.
//
// C'est la ligne qu'on franchit « pour aller plus vite sur un ecran isole ». Ici, elle casse
// la verification.

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const fichiers = execFileSync('git', ['ls-files', 'src'], { encoding: 'utf8' })
  .split('\n')
  .map((ligne) => ligne.trim())
  .filter((ligne) => ligne.endsWith('.ts') || ligne.endsWith('.tsx'));

// Le prefixe des dossiers autorises a parler a Firestore.
const AUTORISES = ['src/data/', 'src/auth/', 'src/firebase/'];

const fautes = [];

for (const fichier of fichiers) {
  const contenu = readFileSync(fichier, 'utf8');
  const chemin = fichier.replaceAll('\\', '/');

  if (/from\s+'firebase\/firestore'/.test(contenu)) {
    fautes.push(`${chemin} importe firebase/firestore : le navigateur ne parle jamais a Firestore.`);
  }

  const toucheFirestore =
    /from\s+'@\/firebase\/(admin|collections)'/.test(contenu) ||
    /from\s+'\.\/(admin|collections)'/.test(contenu);

  if (toucheFirestore && !AUTORISES.some((prefixe) => chemin.startsWith(prefixe))) {
    fautes.push(`${chemin} accede a Firestore hors de data/, auth/ ou firebase/.`);
  }
}

if (fautes.length > 0) {
  for (const faute of fautes) console.error(`  ${faute}`);
  console.error(`\n${fautes.length} cloison(s) franchie(s).`);
  process.exit(1);
}

console.log(`Cloisonnement respecte sur ${fichiers.length} fichiers.`);

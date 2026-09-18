// Verifie qu'aucun emoji n'entre dans le depot (8.2).
//
// ESLint ne voit ni le Markdown, ni le JSON, ni le CSS : ce script balaie ce qu'il ne couvre pas,
// et sert de filet meme avant qu'ESLint soit installe. La regle ESLint `sans-emoji` prendra le
// relais sur le code au lot 1.

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const MOTIF = /\p{Extended_Pictographic}/u;

// Les fichiers suivis par git uniquement : ni node_modules, ni artefacts de construction.
const fichiers = execFileSync("git", ["ls-files"], { encoding: "utf8" })
  .split("\n")
  .map((ligne) => ligne.trim())
  .filter(Boolean);

const BINAIRES = /\.(png|jpe?g|webp|gif|ico|woff2?|ttf|otf|pdf|zip)$/i;

// Exemption temporaire : l'ancien prototype statique en contient huit, dans ses messages de
// confirmation. Il est retire au lot 1, et cette ligne part avec lui.
const PROTOTYPE = /^(js|css)\/|^index\.html$/;

let fautes = 0;

for (const fichier of fichiers) {
  if (BINAIRES.test(fichier) || PROTOTYPE.test(fichier)) continue;

  let contenu;
  try {
    contenu = readFileSync(fichier, "utf8");
  } catch {
    continue;
  }

  contenu.split("\n").forEach((ligne, index) => {
    if (!MOTIF.test(ligne)) return;
    console.error(`${fichier}:${index + 1}  ${ligne.trim().slice(0, 100)}`);
    fautes += 1;
  });
}

if (fautes > 0) {
  console.error(`\n${fautes} ligne(s) contiennent un emoji. Le 8.2 en interdit partout.`);
  process.exit(1);
}

console.log(`Aucun emoji dans les ${fichiers.length} fichiers suivis.`);

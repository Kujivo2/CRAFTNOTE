// Inspection en LECTURE SEULE de Firebase Authentication et de Firestore.
// Ce script n'ecrit jamais dans Firebase. Sa seule ecriture est le fichier de rapport local.
//
// Usage (depuis la racine du depot) :
//   GOOGLE_APPLICATION_CREDENTIALS=./cle-service.json node scripts/inspecter-existant.mjs
//
// Obtenir la cle : console Firebase > Parametres du projet > Comptes de service >
// Generer une nouvelle cle privee. Ce fichier ne doit JAMAIS etre commite.

import { writeFileSync } from "node:fs";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const RAPPORT = "rapport-existant.json";

initializeApp({ credential: applicationDefault() });
const auth = getAuth();
const db = getFirestore();

// --- Inventaire Firebase Authentication ---------------------------------

async function inventaireAuth() {
  const comptes = [];
  let page = await auth.listUsers(1000);
  for (;;) {
    for (const u of page.users) {
      comptes.push({
        uid: u.uid,
        identifiant: u.email ?? null,
        emailVerifie: u.emailVerified,
        desactive: u.disabled,
        creeLe: u.metadata.creationTime,
        derniereConnexion: u.metadata.lastSignInTime ?? null,
        fournisseurs: u.providerData.map((p) => p.providerId),
        revendications: u.customClaims ?? {},
      });
    }
    if (!page.pageToken) break;
    page = await auth.listUsers(1000, page.pageToken);
  }
  return comptes.sort((a, b) => (a.identifiant ?? "").localeCompare(b.identifiant ?? "", "fr"));
}

// --- Inventaire Firestore -----------------------------------------------

// Releve les champs reellement presents et leurs types, sans rien supposer du schema.
function formeDocument(donnees) {
  const forme = {};
  for (const [cle, valeur] of Object.entries(donnees)) {
    if (valeur === null) forme[cle] = "null";
    else if (Array.isArray(valeur)) forme[cle] = "tableau";
    else if (valeur?.toDate instanceof Function) forme[cle] = "horodatage";
    else forme[cle] = typeof valeur;
  }
  return forme;
}

function fusionnerFormes(formes) {
  const total = {};
  for (const forme of formes) {
    for (const [cle, type] of Object.entries(forme)) {
      total[cle] ??= { types: new Set(), presentDans: 0 };
      total[cle].types.add(type);
      total[cle].presentDans += 1;
    }
  }
  return Object.fromEntries(
    Object.entries(total).map(([cle, info]) => [
      cle,
      { types: [...info.types], presentDans: info.presentDans, surTotal: formes.length },
    ]),
  );
}

async function inventaireFirestore() {
  const collections = {};
  for (const col of await db.listCollections()) {
    const snap = await col.get();
    const documents = snap.docs.map((d) => ({ id: d.id, donnees: d.data() }));
    collections[col.id] = {
      nombre: documents.length,
      champs: fusionnerFormes(documents.map((d) => formeDocument(d.donnees))),
      exemples: documents.slice(0, 3).map((d) => ({ id: d.id, ...d.donnees })),
      identifiants: documents.map((d) => d.id),
      // Valeurs distinctes des champs qui servent de cle de rapprochement ou d'enum.
      valeursRole: [...new Set(documents.map((d) => d.donnees.role).filter(Boolean))],
      valeursEleveUid: [...new Set(documents.map((d) => d.donnees.eleveUid).filter(Boolean))],
      valeursProfesseurUid: [...new Set(documents.map((d) => d.donnees.professeurUid).filter(Boolean))],
    };
  }
  return collections;
}

// --- Rapprochement des deux cotes ---------------------------------------

// Les documents de profil ont pour identifiant l'UID Firebase Auth : c'est la cle pivot.
function rapprocher(comptes, collections, collectionProfils) {
  const profils = collections[collectionProfils];
  if (!profils) return { erreur: `collection ${collectionProfils} absente` };

  const uidAuth = new Set(comptes.map((c) => c.uid));
  const uidProfils = new Set(profils.identifiants);

  const sansDocument = comptes.filter((c) => !uidProfils.has(c.uid));
  const sansCompte = profils.identifiants.filter((uid) => !uidAuth.has(uid));

  // Un UID reference par une note ou une sanction mais inconnu des deux cotes
  // casse silencieusement un releve : on le sort a part.
  const uidReferences = new Set();
  for (const [nom, col] of Object.entries(collections)) {
    if (nom === collectionProfils) continue;
    col.valeursEleveUid.forEach((u) => uidReferences.add(u));
    col.valeursProfesseurUid.forEach((u) => uidReferences.add(u));
  }
  const referencesOrphelines = [...uidReferences].filter((u) => !uidAuth.has(u) && !uidProfils.has(u));

  return {
    comptesAuth: comptes.length,
    documentsProfils: profils.nombre,
    apparies: comptes.length - sansDocument.length,
    comptesSansDocument: sansDocument.map((c) => ({ uid: c.uid, identifiant: c.identifiant })),
    documentsSansCompte: sansCompte,
    referencesOrphelines,
  };
}

// --- Restitution ---------------------------------------------------------

function afficher(rapport) {
  const { auth: comptes, firestore, rapprochement } = rapport;
  console.log(`\nFirebase Authentication : ${comptes.length} comptes`);
  console.log(`  dont desactives : ${comptes.filter((c) => c.desactive).length}`);
  console.log(`  jamais connectes : ${comptes.filter((c) => !c.derniereConnexion).length}`);

  console.log(`\nFirestore : ${Object.keys(firestore).length} collections`);
  for (const [nom, col] of Object.entries(firestore)) {
    console.log(`  ${nom.padEnd(16)} ${String(col.nombre).padStart(5)} documents`);
    console.log(`    champs : ${Object.keys(col.champs).join(", ") || "aucun"}`);
    if (col.valeursRole.length) console.log(`    roles distincts : ${col.valeursRole.join(", ")}`);
  }

  console.log("\nRapprochement");
  if (rapprochement.erreur) {
    console.log(`  ${rapprochement.erreur}`);
  } else {
    console.log(`  apparies : ${rapprochement.apparies}`);
    console.log(`  comptes Auth sans document Firestore : ${rapprochement.comptesSansDocument.length}`);
    for (const c of rapprochement.comptesSansDocument) console.log(`    ${c.uid}  ${c.identifiant}`);
    console.log(`  DOCUMENTS SANS COMPTE AUTH : ${rapprochement.documentsSansCompte.length}`);
    for (const uid of rapprochement.documentsSansCompte) console.log(`    ${uid}  (connexion impossible)`);
    console.log(`  UID references par une note ou une mesure mais inconnus : ${rapprochement.referencesOrphelines.length}`);
    for (const uid of rapprochement.referencesOrphelines) console.log(`    ${uid}`);
  }
  console.log(`\nRapport complet ecrit dans ${RAPPORT}\n`);
}

const comptes = await inventaireAuth();
const firestore = await inventaireFirestore();
const rapport = {
  genereLe: new Date().toISOString(),
  auth: comptes,
  firestore,
  rapprochement: rapprocher(comptes, firestore, "profiles"),
};
writeFileSync(RAPPORT, JSON.stringify(rapport, null, 2), "utf8");
afficher(rapport);

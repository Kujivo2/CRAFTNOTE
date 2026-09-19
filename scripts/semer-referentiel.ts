// Sème le référentiel complet à partir de referentiel-a-remplir.csv.
//
//   npx tsx scripts/semer-referentiel.ts             a blanc, n'ecrit rien
//   npx tsx scripts/semer-referentiel.ts --appliquer  ecrit
//
// Ecrit, dans l'ordre des dependances : etablissement/config, niveaux, periodes, matieres,
// groupes, profilsEleves, services, puis corrige les roleId de `utilisateurs`.
//
// Relancable sans creer de doublons : tous les identifiants de documents sont deterministes.
// Rien n'est supprime.

import { lireReferentiel, enIdentifiantDocument, estRattacheAUnSeulGroupe } from './_referentiel';
import type { LigneReferentiel } from './_referentiel';
import type { WriteBatch } from 'firebase-admin/firestore';

import { cible, demarrer, getAuth, getFirestore } from './_firebase';

const APPLIQUER = process.argv.includes('--appliquer');

// --- Les seules valeurs qui ne sont pas dans le CSV -------------------------

const ETABLISSEMENT = 'Mantes-La-Jolie';

const NIVEAU = { id: 'speciale', libelle: 'Spéciale', ordre: 1 };

const PERIODE = {
  id: 'saison-2026',
  libelle: 'Saison 2026',
  dateDebut: '2026-09-11',
  dateFin: '2026-10-04',
  ordre: 1,
};

// Professeur principal par groupe, par identifiant de connexion. `profPrincipalId` est ce qui
// donne les droits supplementaires du 2 : appreciation generale, preparation du conseil, et les
// notes en portee « son groupe ».
const PROFS_PRINCIPAUX: Readonly<Record<string, string>> = {
  'Groupe 1': 'valmont@craftnote.local',
  'Groupe 2': 'elena.elena@craftnote.local',
  'Groupe 3': 'elias.nerulis@craftnote.local',
  'Groupe 4': 'nicole@craftnote.local',
  'Groupe 5': 'gaetan.burritosse@craftnote.local',
  'Groupe 6': 'valentina.ashcroft@craftnote.local',
  'Groupe 7': 'karina.knave@craftnote.local',
  'Groupe 8': 'agapios.duplanty@craftnote.local',
  'Groupe 9': 'mark.polochon@craftnote.local',
};

// Seuls ces roles peuvent porter un service qui donne acces aux notes. Un service pose sur un
// autre role n'est pas une erreur en soi -- il fait exister le cours et l'appel -- mais son
// titulaire ne pourra pas saisir de note, et il vaut mieux le dire que le decouvrir.
const ROLES_NOTANTS = new Set(['professeur', 'direction', 'administrateur']);

// Deux ecarts au modele, tranches et assumes. Les encoder ici evite de les signaler comme des
// anomalies a chaque execution : un avertissement qu'on apprend a ignorer ne sert plus a rien.
const ECARTS_ACCEPTES: Readonly<Record<string, string>> = {
  'rose.thorns@craftnote.local':
    'sans groupe volontairement : personnage dont on ignore encore qui il est',
  'flora.cristofeuille@craftnote.local':
    'documentaliste, s’occupe des livres comme au CDI et ne note pas',
};

// --- Lecture ----------------------------------------------------------------

demarrer();
const db = getFirestore();
const auth = getAuth();

async function uidParIdentifiant(): Promise<Map<string, string>> {
  const table = new Map<string, string>();
  let page = await auth.listUsers(1000);
  for (;;) {
    for (const compte of page.users) {
      if (compte.email !== undefined) table.set(compte.email.toLowerCase(), compte.uid);
    }
    if (page.pageToken === undefined) break;
    page = await auth.listUsers(1000, page.pageToken);
  }
  return table;
}

const { lignes, rejets } = lireReferentiel();
const uids = await uidParIdentifiant();
const anomalies: string[] = [...rejets];

// --- Ce qui se deduit du fichier --------------------------------------------

const codesGroupes = [...new Set(lignes.flatMap((ligne) => ligne.groupes))].sort();
const nomsMatieres = [...new Set(lignes.flatMap((ligne) => ligne.matieres))].sort();

const groupeId = (code: string): string => enIdentifiantDocument(code);
const matiereId = (nom: string): string => enIdentifiantDocument(nom);

function codeMatiere(nom: string): string {
  return enIdentifiantDocument(nom).replace(/-/g, '').slice(0, 4).toUpperCase();
}

const eleves = lignes.filter(estRattacheAUnSeulGroupe);
const porteursDeService = lignes.filter((ligne) => ligne.matieres.length > 0);

type Service = {
  readonly id: string;
  readonly uid: string;
  readonly ligne: LigneReferentiel;
  readonly codeGroupe: string;
  readonly nomMatiere: string;
};

const services: Service[] = [];
for (const ligne of porteursDeService) {
  const uid = uids.get(ligne.identifiant);
  if (uid === undefined) continue;
  for (const codeGroupe of ligne.groupes) {
    for (const nomMatiere of ligne.matieres) {
      services.push({
        id: `${uid}__${groupeId(codeGroupe)}__${matiereId(nomMatiere)}`,
        uid,
        ligne,
        codeGroupe,
        nomMatiere,
      });
    }
  }
}

// --- Controles avant d'ecrire quoi que ce soit ------------------------------

for (const ligne of lignes) {
  if (!uids.has(ligne.identifiant)) {
    anomalies.push(
      `ligne ${ligne.ligne} : ${ligne.identifiant} n’a pas de compte Authentication — ` +
        'lancez scripts/creer-comptes-manquants.ts avant celui-ci',
    );
  }
  if (
    ligne.role === 'eleve' &&
    ligne.groupes.length === 0 &&
    ECARTS_ACCEPTES[ligne.identifiant] === undefined
  ) {
    anomalies.push(`ligne ${ligne.ligne} : ${ligne.identifiant} est élève sans aucun groupe`);
  }
  if (
    ligne.matieres.length > 0 &&
    !ROLES_NOTANTS.has(ligne.role) &&
    ECARTS_ACCEPTES[ligne.identifiant] === undefined
  ) {
    anomalies.push(
      `ligne ${ligne.ligne} : ${ligne.identifiant} est ${ligne.role} mais porte la matière ` +
        `« ${ligne.matieres.join(', ')} » — il ne pourra pas saisir de note`,
    );
  }
}

for (const code of codesGroupes) {
  const effectif = eleves.filter((ligne) => ligne.groupes[0] === code).length;
  if (effectif === 0) anomalies.push(`${code} n’a aucun élève`);
  else if (effectif > 5) anomalies.push(`${code} a ${effectif} élèves, le §1 en prévoit 4 à 5`);

  const pp = PROFS_PRINCIPAUX[code];
  if (pp === undefined) anomalies.push(`${code} n’a pas de professeur principal déclaré`);
  else if (!uids.has(pp)) anomalies.push(`${code} : professeur principal ${pp} introuvable`);
}

// --- Restitution -------------------------------------------------------------

console.log(`\n${APPLIQUER ? 'ÉCRITURE' : 'PRÉVISUALISATION À BLANC, rien n’est écrit'}`);
console.log(`Cible : ${cible()}\n`);

console.log(`  etablissement/config   1`);
console.log(`  niveaux                1  ${NIVEAU.libelle}`);
console.log(`  periodes               1  ${PERIODE.libelle}`);
console.log(`  matieres              ${String(nomsMatieres.length).padStart(2)}  ${nomsMatieres.join(', ')}`);
console.log(`  groupes               ${String(codesGroupes.length).padStart(2)}`);
console.log(`  profilsEleves         ${String(eleves.length).padStart(2)}`);
console.log(`  services              ${String(services.length).padStart(2)}`);

console.log('\nEffectifs par groupe :');
for (const code of codesGroupes) {
  const membres = eleves.filter((ligne) => ligne.groupes[0] === code);
  const pp = PROFS_PRINCIPAUX[code] ?? 'aucun';
  console.log(`  ${code.padEnd(10)} ${String(membres.length).padStart(2)} élèves   PP ${pp}`);
}

const accepteesPresentes = lignes.filter(
  (ligne) => ECARTS_ACCEPTES[ligne.identifiant] !== undefined,
);
if (accepteesPresentes.length > 0) {
  console.log('');
  console.log('Écarts assumés :');
  for (const ligne of accepteesPresentes) {
    console.log(`  ${ligne.identifiant} — ${ECARTS_ACCEPTES[ligne.identifiant] ?? ''}`);
  }
}

if (anomalies.length > 0) {
  console.log(`\n${anomalies.length} anomalie(s) :`);
  for (const anomalie of anomalies) console.log(`  ! ${anomalie}`);
}

const bloquantes = anomalies.filter((texte) => texte.includes('Authentication'));
if (bloquantes.length > 0) {
  console.log('\nDes comptes manquent : rien ne sera écrit.');
  process.exit(1);
}

if (!APPLIQUER) {
  console.log('\nRelancer avec --appliquer pour écrire.');
  process.exit(0);
}

// --- Ecriture ----------------------------------------------------------------

// Firestore limite un lot a 500 operations : on decoupe bien en dessous.
const lots: WriteBatch[] = [db.batch()];
let dansLeLot = 0;

function ajouter(action: (courant: WriteBatch) => void): void {
  if (dansLeLot >= 400) {
    lots.push(db.batch());
    dansLeLot = 0;
  }
  const courant = lots[lots.length - 1];
  if (courant === undefined) throw new Error('Lot absent.');
  action(courant);
  dansLeLot += 1;
}

ajouter((courant) =>
  courant.set(db.collection('etablissement').doc('config'), {
    nom: ETABLISSEMENT,
    logoUrl: null,
    saison: PERIODE.libelle,
    absentCompteZero: false,
    nonRenduCompteZero: true,
    // Avec quatre eleves, la moyenne du groupe et le rang designent des personnes (1).
    afficherMoyenneGroupe: false,
    afficherRang: false,
  }),
);

ajouter((courant) =>
  courant.set(db.collection('niveaux').doc(NIVEAU.id), {
    libelle: NIVEAU.libelle,
    ordre: NIVEAU.ordre,
  }),
);

ajouter((courant) =>
  courant.set(db.collection('periodes').doc(PERIODE.id), {
    libelle: PERIODE.libelle,
    dateDebut: PERIODE.dateDebut,
    dateFin: PERIODE.dateFin,
    ordre: PERIODE.ordre,
  }),
);

for (const nom of nomsMatieres) {
  ajouter((courant) =>
    courant.set(db.collection('matieres').doc(matiereId(nom)), {
      nom,
      code: codeMatiere(nom),
      coefficientDefaut: 1,
    }),
  );
}

for (const code of codesGroupes) {
  const identifiantPp = PROFS_PRINCIPAUX[code];
  const uidPp = identifiantPp === undefined ? undefined : uids.get(identifiantPp);
  ajouter((courant) =>
    courant.set(db.collection('groupes').doc(groupeId(code)), {
      code,
      niveauId: NIVEAU.id,
      profPrincipalId: uidPp ?? null,
    }),
  );
}

for (const ligne of eleves) {
  const uid = uids.get(ligne.identifiant);
  const code = ligne.groupes[0];
  if (uid === undefined || code === undefined) continue;
  ajouter((courant) =>
    courant.set(
      db.collection('profilsEleves').doc(uid),
      {
        groupeId: groupeId(code),
        // Aucun delegue n'est declare dans le fichier : a cocher ensuite, un par groupe.
        estDelegue: false,
      },
      { merge: true },
    ),
  );
}

for (const service of services) {
  ajouter((courant) =>
    courant.set(db.collection('services').doc(service.id), {
      professeurId: service.uid,
      groupeId: groupeId(service.codeGroupe),
      matiereId: matiereId(service.nomMatiere),
      coefficient: 1,
      // Copies volontaires (6.2) : sans elles, chaque ligne de releve coute trois lectures.
      professeurNom: `${service.ligne.prenom} ${service.ligne.nom}`.trim(),
      matiereNom: service.nomMatiere,
      groupeCode: service.codeGroupe,
    }),
  );
}

// Correction des roleId : le CSV fait foi, sauf pour les comptes qu'il ne mentionne pas.
const utilisateurs = await db.collection('utilisateurs').get();
type EtatCompte = { roleId: string; nom: string; prenom: string };
const etatActuel = new Map<string, EtatCompte>();
for (const document of utilisateurs.docs) {
  const donnees = document.data();
  etatActuel.set(document.id, {
    roleId: String(donnees.roleId),
    nom: String(donnees.nom),
    prenom: String(donnees.prenom),
  });
}

const changements: string[] = [];
for (const ligne of lignes) {
  const uid = uids.get(ligne.identifiant);
  if (uid === undefined) continue;
  const avant = etatActuel.get(uid);
  if (avant === undefined) continue;

  const correctif: Record<string, string> = {};
  if (avant.roleId !== ligne.role) {
    correctif.roleId = ligne.role;
    changements.push(`${ligne.identifiant} : rôle ${avant.roleId} vers ${ligne.role}`);
  }
  if (avant.nom !== ligne.nom) {
    correctif.nom = ligne.nom;
    changements.push(`${ligne.identifiant} : nom « ${avant.nom} » vers « ${ligne.nom} »`);
  }
  if (avant.prenom !== ligne.prenom) {
    correctif.prenom = ligne.prenom;
    changements.push(`${ligne.identifiant} : prénom « ${avant.prenom} » vers « ${ligne.prenom} »`);
  }
  if (Object.keys(correctif).length === 0) continue;

  ajouter((courant) => courant.update(db.collection('utilisateurs').doc(uid), correctif));
}

for (const courant of lots) await courant.commit();

console.log(`\nÉcrit, en ${lots.length} lot(s).`);
if (changements.length > 0) {
  console.log(`\n${changements.length} rôle(s) corrigé(s) :`);
  for (const changement of changements) console.log(`  ${changement}`);
}

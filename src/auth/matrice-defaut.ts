// Matrice par defaut du 2, en donnees de semis.
//
// Elle n'est PAS la reference : elle sert a remplir `roles/{id}/permissions` la premiere fois.
// Une fois en base, c'est la base qui fait foi, et le panneau des droits la modifie sans
// redeploiement. Rien dans le code ne doit relire cette constante a l'execution.

import { CATALOGUE, type CodePermission } from './catalogue';
import type { Portee } from './portee';

export type CodeRole = 'eleve' | 'professeur' | 'surveillant' | 'cpe' | 'direction' | 'administrateur';

export type DroitsDuRole = Partial<Record<CodePermission, Portee>>;

// La portee la plus large que la permission autorise.
function plusLarge(code: CodePermission): Portee {
  const definition = CATALOGUE.find((permission) => permission.code === code);
  const portees = (definition?.portees ?? ['etablissement']) as readonly Portee[];
  return portees.includes('etablissement') ? 'etablissement' : (portees.at(-1) ?? 'etablissement');
}

function toutSauf(exclues: readonly CodePermission[]): DroitsDuRole {
  const droits: DroitsDuRole = {};
  for (const permission of CATALOGUE) {
    const code = permission.code;
    if (exclues.includes(code)) continue;
    droits[code] = plusLarge(code);
  }
  return droits;
}

const ELEVE: DroitsDuRole = {
  'annuaire.voir': 'sonGroupe',
  'trombinoscope.voir': 'sonGroupe',
  'avatar.modifier': 'soi',
  'edt.voirSoi': 'soi',
  'cdt.voir': 'sonGroupe',
  // En portee `soi`, `data/` ne rend que les evaluations publiees : le filtre est dans la
  // requete, pas dans le droit.
  'notes.voir': 'soi',
  'absences.voir': 'soi',
  'dossierEleve.voir': 'soi',
};

const PROFESSEUR: DroitsDuRole = {
  'annuaire.voir': 'etablissement',
  'trombinoscope.voir': 'etablissement',
  'avatar.modifier': 'soi',
  'edt.voirTous': 'sesServices',
  'edt.seanceModifier': 'sesServices',
  'edt.lieuRenseigner': 'sesServices',
  'cdt.voir': 'sesServices',
  'cdt.ecrire': 'sesServices',
  'devoirs.creer': 'sesServices',
  'evaluations.creer': 'sesServices',
  'notes.saisir': 'sesServices',
  'notes.publier': 'sesServices',
  'notes.voir': 'sesServices',
  'appel.faire': 'sesServices',
  'absences.voir': 'sesServices',
  'punitions.infliger': 'sesServices',
  'appreciationMatiere.saisir': 'sesServices',
  'dossierEleve.voir': 'sesServices',
};

// Equivalent AED : appel, absences, retards, retenues, jamais les notes.
const SURVEILLANT: DroitsDuRole = {
  'annuaire.voir': 'etablissement',
  'trombinoscope.voir': 'etablissement',
  'avatar.modifier': 'soi',
  'edt.voirTous': 'etablissement',
  'cdt.voir': 'etablissement',
  'appel.faire': 'etablissement',
  'absences.voir': 'etablissement',
  'absences.saisir': 'etablissement',
  'punitions.infliger': 'etablissement',
  'retenues.planifier': 'etablissement',
  'retenues.pointer': 'etablissement',
  'dossierEleve.voir': 'etablissement',
};

const CPE: DroitsDuRole = {
  ...SURVEILLANT,
  'avatar.moderer': 'etablissement',
  'edt.soireeCreer': 'etablissement',
  'edt.soireeDecaler': 'etablissement',
  'edt.seanceModifier': 'etablissement',
  'appel.rattraper': 'etablissement',
  'absences.justifier': 'etablissement',
  'sanctions.proposer': 'etablissement',
  // Consultation seulement : le CPE n'a ni `notes.saisir` ni `notes.publier`.
  'notes.voir': 'etablissement',
  'appreciationVs.saisir': 'etablissement',
  'bilan.voirGroupe': 'etablissement',
};

// « Direction (tout le fonctionnel) » : tout, sauf ce qui est reserve a l'administrateur.
const RESERVE_ADMINISTRATEUR: readonly CodePermission[] = [
  'comptes.modifierPersonnel',
  'comptes.changerRole',
  'comptes.usurper',
  'droits.gerer',
  'backoffice.acceder',
];

const DIRECTION: DroitsDuRole = toutSauf(RESERVE_ADMINISTRATEUR);

// « Administrateur (absolument tout) ». Ses cases sont cochees et desactivees dans le panneau,
// et `resoudreDroit` ne consulte meme pas cette table pour lui.
const ADMINISTRATEUR: DroitsDuRole = toutSauf([]);

export const MATRICE_PAR_DEFAUT: Readonly<Record<CodeRole, DroitsDuRole>> = {
  eleve: ELEVE,
  professeur: PROFESSEUR,
  surveillant: SURVEILLANT,
  cpe: CPE,
  direction: DIRECTION,
  administrateur: ADMINISTRATEUR,
};

// Le professeur principal n'est pas un role : c'est un attribut qui ajoute des droits sur ses
// groupes, et seulement sur eux (2).
export const DROITS_PROFESSEUR_PRINCIPAL: DroitsDuRole = {
  'appreciationGenerale.saisir': 'sonGroupe',
  'conseil.preparer': 'sonGroupe',
  'notes.voir': 'sonGroupe',
  'bilan.voirGroupe': 'sonGroupe',
};

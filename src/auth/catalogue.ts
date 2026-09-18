// Catalogue des permissions (2), constante typee dont le panneau des droits se genere
// automatiquement. Ajouter un droit ici le fait apparaitre dans l'ecran d'administration sans
// autre travail ; aucune permission n'est jamais ecrite en dur ailleurs dans le code.

import type { Portee } from './portee';

export type GroupePermission =
  | 'comptes'
  | 'emploiDuTemps'
  | 'cours'
  | 'notes'
  | 'vieScolaire'
  | 'bilan'
  | 'administration';

const E = ['etablissement'] as const;
const SOI = ['soi'] as const;
const SOI_E = ['soi', 'etablissement'] as const;
const SERV_E = ['sesServices', 'etablissement'] as const;
const GRP_E = ['sonGroupe', 'etablissement'] as const;
const TOUTES = ['soi', 'sesServices', 'sonGroupe', 'etablissement'] as const;

export const CATALOGUE = [
  // Comptes
  { code: 'annuaire.voir', libelle: 'Consulter l’annuaire', groupe: 'comptes', portees: TOUTES },
  { code: 'trombinoscope.voir', libelle: 'Consulter le trombinoscope', groupe: 'comptes', portees: GRP_E },
  { code: 'comptes.creer', libelle: 'Créer un compte', groupe: 'comptes', portees: E },
  { code: 'comptes.modifier', libelle: 'Modifier un compte', groupe: 'comptes', portees: E },
  { code: 'comptes.modifierPersonnel', libelle: 'Modifier les données personnelles d’un compte', groupe: 'comptes', portees: E },
  { code: 'avatar.modifier', libelle: 'Changer son portrait', groupe: 'comptes', portees: SOI_E },
  { code: 'avatar.moderer', libelle: 'Retirer un portrait', groupe: 'comptes', portees: E },
  { code: 'comptes.reinitialiserMdp', libelle: 'Réinitialiser un mot de passe', groupe: 'comptes', portees: E },
  { code: 'comptes.desactiver', libelle: 'Désactiver un compte', groupe: 'comptes', portees: E },
  { code: 'comptes.changerRole', libelle: 'Changer le rôle d’un compte', groupe: 'comptes', portees: E },
  { code: 'comptes.usurper', libelle: 'Emprunter l’identité d’un compte', groupe: 'comptes', portees: E },
  { code: 'structure.gerer', libelle: 'Gérer groupes, matières, salles et services', groupe: 'comptes', portees: E },

  // Emploi du temps
  { code: 'edt.voirSoi', libelle: 'Voir son emploi du temps', groupe: 'emploiDuTemps', portees: SOI },
  { code: 'edt.voirTous', libelle: 'Voir les emplois du temps', groupe: 'emploiDuTemps', portees: TOUTES },
  { code: 'edt.grilleGerer', libelle: 'Modifier la grille horaire', groupe: 'emploiDuTemps', portees: E },
  { code: 'edt.creneauxGerer', libelle: 'Gérer les créneaux types', groupe: 'emploiDuTemps', portees: E },
  { code: 'edt.soireeCreer', libelle: 'Créer une soirée', groupe: 'emploiDuTemps', portees: E },
  { code: 'edt.soireeDecaler', libelle: 'Décaler une soirée', groupe: 'emploiDuTemps', portees: E },
  { code: 'edt.seanceModifier', libelle: 'Modifier une séance', groupe: 'emploiDuTemps', portees: SERV_E },
  { code: 'edt.lieuRenseigner', libelle: 'Renseigner le lieu d’un cours', groupe: 'emploiDuTemps', portees: SERV_E },

  // Cours
  { code: 'cdt.voir', libelle: 'Consulter le cahier de textes', groupe: 'cours', portees: TOUTES },
  { code: 'cdt.ecrire', libelle: 'Écrire au cahier de textes', groupe: 'cours', portees: SERV_E },
  { code: 'devoirs.creer', libelle: 'Donner du travail à faire', groupe: 'cours', portees: SERV_E },

  // Notes
  { code: 'evaluations.creer', libelle: 'Créer une évaluation', groupe: 'notes', portees: SERV_E },
  { code: 'notes.saisir', libelle: 'Saisir des notes', groupe: 'notes', portees: SERV_E },
  { code: 'notes.publier', libelle: 'Publier des notes', groupe: 'notes', portees: SERV_E },
  { code: 'notes.voir', libelle: 'Voir les notes', groupe: 'notes', portees: TOUTES },
  { code: 'moyennes.voirGroupe', libelle: 'Voir la moyenne du groupe', groupe: 'notes', portees: SERV_E },
  { code: 'rang.voir', libelle: 'Voir le rang dans le groupe', groupe: 'notes', portees: SERV_E },
  { code: 'journalNotes.consulter', libelle: 'Consulter le journal des notes', groupe: 'notes', portees: E },

  // Vie scolaire
  { code: 'appel.faire', libelle: 'Faire l’appel', groupe: 'vieScolaire', portees: SERV_E },
  { code: 'appel.rattraper', libelle: 'Rattraper un appel passé', groupe: 'vieScolaire', portees: E },
  { code: 'absences.voir', libelle: 'Voir les absences', groupe: 'vieScolaire', portees: TOUTES },
  { code: 'absences.saisir', libelle: 'Saisir une absence', groupe: 'vieScolaire', portees: E },
  { code: 'absences.justifier', libelle: 'Justifier une absence', groupe: 'vieScolaire', portees: E },
  { code: 'punitions.infliger', libelle: 'Infliger une punition', groupe: 'vieScolaire', portees: SERV_E },
  { code: 'retenues.planifier', libelle: 'Planifier une retenue', groupe: 'vieScolaire', portees: E },
  { code: 'retenues.pointer', libelle: 'Pointer une retenue', groupe: 'vieScolaire', portees: E },
  { code: 'sanctions.proposer', libelle: 'Proposer une sanction', groupe: 'vieScolaire', portees: E },
  { code: 'sanctions.prononcer', libelle: 'Prononcer une sanction', groupe: 'vieScolaire', portees: E },
  { code: 'dossierEleve.voir', libelle: 'Ouvrir le dossier d’un élève', groupe: 'vieScolaire', portees: TOUTES },

  // Bilan
  { code: 'appreciationMatiere.saisir', libelle: 'Saisir une appréciation de matière', groupe: 'bilan', portees: SERV_E },
  { code: 'appreciationGenerale.saisir', libelle: 'Saisir l’appréciation générale', groupe: 'bilan', portees: GRP_E },
  { code: 'appreciationVs.saisir', libelle: 'Saisir l’appréciation vie scolaire', groupe: 'bilan', portees: E },
  { code: 'conseil.preparer', libelle: 'Préparer le conseil', groupe: 'bilan', portees: GRP_E },
  { code: 'mentions.attribuer', libelle: 'Attribuer une mention', groupe: 'bilan', portees: E },
  { code: 'bilan.voirGroupe', libelle: 'Voir les bilans d’un groupe', groupe: 'bilan', portees: GRP_E },

  // Administration
  { code: 'parametres.gerer', libelle: 'Modifier les paramètres', groupe: 'administration', portees: E },
  { code: 'droits.gerer', libelle: 'Modifier le panneau des droits', groupe: 'administration', portees: E },
  { code: 'audit.consulter', libelle: 'Consulter le journal d’audit', groupe: 'administration', portees: E },
  { code: 'donnees.exporter', libelle: 'Exporter les données', groupe: 'administration', portees: E },
  { code: 'donnees.importer', libelle: 'Importer des données', groupe: 'administration', portees: E },
  { code: 'backoffice.acceder', libelle: 'Accéder au back-office', groupe: 'administration', portees: E },
] as const satisfies readonly {
  code: string;
  libelle: string;
  groupe: GroupePermission;
  portees: readonly Portee[];
}[];

export type CodePermission = (typeof CATALOGUE)[number]['code'];

// Bloquees pendant une usurpation d'identite (2). L'admin qui emprunte une identite peut
// regarder et corriger ; il ne peut pas toucher aux comptes, aux droits ni aux donnees en masse.
const DESTRUCTRICES: ReadonlySet<string> = new Set<CodePermission>([
  'comptes.creer',
  'comptes.modifierPersonnel',
  'comptes.reinitialiserMdp',
  'comptes.desactiver',
  'comptes.changerRole',
  'comptes.usurper',
  'structure.gerer',
  'droits.gerer',
  'donnees.importer',
  'backoffice.acceder',
  'sanctions.prononcer',
]);

export function estDestructrice(code: CodePermission): boolean {
  return DESTRUCTRICES.has(code);
}

export function definition(code: CodePermission): (typeof CATALOGUE)[number] | undefined {
  return CATALOGUE.find((permission) => permission.code === code);
}

export function porteeAutorisee(code: CodePermission, portee: Portee): boolean {
  const trouvee = definition(code);
  return trouvee !== undefined && (trouvee.portees as readonly Portee[]).includes(portee);
}

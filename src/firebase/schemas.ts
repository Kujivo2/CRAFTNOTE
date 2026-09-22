import { z } from 'zod';

// Firestore n'a ni cle etrangere, ni contrainte, ni unicite declaree (6.2) : tout ce qui
// ressemblait a un schema en SQL vit ici. Chaque lecture passe par ces schemas, donc aucune
// donnee brute ne remonte dans l'application.

export const CODES_ROLE = [
  'eleve',
  'professeur',
  'surveillant',
  'cpe',
  'direction',
  'administrateur',
] as const;

export const PORTEES = ['soi', 'sesServices', 'sonGroupe', 'etablissement'] as const;

export const schemaUtilisateur = z.object({
  identifiant: z.string().min(1),
  nom: z.string().min(1),
  prenom: z.string().min(1),
  roleId: z.enum(CODES_ROLE),
  actif: z.boolean(),
  doitChangerMdp: z.boolean(),
  derniereConnexion: z.string().nullable(),
  telephone: z.string().optional(),
  age: z.number().int().positive().optional(),
  avatarChemin: z.string().optional(),
  avatarVersion: z.number().int().nonnegative(),
});

export const schemaProfilEleve = z.object({
  groupeId: z.string().min(1),
  dateNaissance: z.string().optional(),
  estDelegue: z.boolean(),
});

export const schemaRole = z.object({
  code: z.enum(CODES_ROLE),
  libelle: z.string().min(1),
  systeme: z.boolean(),
});

// Sous-collection roles/{id}/permissions/{code} : l'identifiant du document EST le code de la
// permission, il n'est donc pas repete dans le document.
export const schemaPermissionDeRole = z.object({
  portee: z.enum(PORTEES),
});

// Identifiant `{utilisateurId}__{permissionCode}` : sans cette unicite, deux surcharges
// contradictoires coexisteraient sur le meme droit et l'ordre de resolution ne dirait pas
// laquelle gagne.
export const schemaPermissionUtilisateur = z.object({
  utilisateurId: z.string().min(1),
  permissionCode: z.string().min(1),
  portee: z.enum(PORTEES),
  autorise: z.boolean(),
});

export const schemaGroupe = z.object({
  code: z.string().min(1),
  niveauId: z.string().min(1),
  profPrincipalId: z.string().nullable(),
});

export const schemaService = z.object({
  professeurId: z.string().min(1),
  groupeId: z.string().min(1),
  matiereId: z.string().min(1),
  coefficient: z.number().positive(),
  professeurNom: z.string().min(1),
  matiereNom: z.string().min(1),
  groupeCode: z.string().min(1),
});

export const schemaMatiere = z.object({
  nom: z.string().min(1),
  code: z.string().min(1),
  coefficientDefaut: z.number().positive(),
});

export const schemaNiveau = z.object({
  libelle: z.string().min(1),
  ordre: z.number().int(),
});

export const schemaSalle = z.object({
  nom: z.string().min(1),
});

export const schemaPeriode = z.object({
  libelle: z.string().min(1),
  dateDebut: z.string(),
  dateFin: z.string(),
  ordre: z.number().int(),
});

// etablissement/config : un document unique, d'identifiant « config ».
export const schemaConfig = z.object({
  nom: z.string().min(1),
  logoUrl: z.string().nullable(),
  saison: z.string().min(1),
  // Options de calcul du 4.1, et colonnes desactivees par defaut du 1.
  absentCompteZero: z.boolean(),
  nonRenduCompteZero: z.boolean(),
  afficherMoyenneGroupe: z.boolean(),
  afficherRang: z.boolean(),
});

export const STATUTS_NOTE = ['notee', 'absent', 'dispense', 'nonRendu', 'nonNotee'] as const;

export const TYPES_EVALUATION = [
  'devoirSurveille',
  'interrogation',
  'oral',
  'pratique',
  'projet',
] as const;

export const schemaEvaluation = z.object({
  serviceId: z.string().min(1),
  periodeId: z.string().min(1),
  titre: z.string().min(1).max(120),
  // Jour de RP, « 2026-09-25 ». Aucune validation n'interdit une date passee (1).
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // Bareme et valeurs en CENTIEMES entiers : jamais de flottant binaire (4.1).
  // 20 s'ecrit 2000, 14,50 s'ecrit 1450.
  baremeCentiemes: z.number().int().positive(),
  coefficient: z.number().positive(),
  type: z.enum(TYPES_EVALUATION),
  // Rien n'est visible de l'eleve avant la publication (3).
  publiee: z.boolean(),
  facultative: z.boolean(),
  commentaireGeneral: z.string().max(1000),
  creeeLe: z.string(),
  // Denormalise : le releve d'un groupe ne doit pas relire chaque service.
  groupeId: z.string().min(1),
  matiereNom: z.string().min(1),
});

// Identifiant `{evaluationId}__{eleveId}` : c'est le seul mecanisme d'unicite disponible (6.2).
// `eleveId` est REPETE dans le document : Firestore ne sait pas interroger un identifiant par
// suffixe, donc sans ce champ le releve d'un eleve serait inexprimable.
export const schemaNote = z.object({
  evaluationId: z.string().min(1),
  eleveId: z.string().min(1),
  valeurCentiemes: z.number().int().nonnegative().nullable(),
  statut: z.enum(STATUTS_NOTE),
  commentaire: z.string().max(500),
  // Une note peut etre retiree du calcul tout en restant visible (4.1).
  priseEnCompte: z.boolean(),
  eleveNom: z.string().min(1),
  groupeId: z.string().min(1),
  serviceId: z.string().min(1),
  periodeId: z.string().min(1),
});

// Journal des modifications (4.6). Silencieux : aucune notification, aucun badge, personne
// n'est prevenu. On enregistre, et on regarde a la fin.
export const schemaEntreeJournal = z.object({
  acteurId: z.string().min(1),
  acteurUsurpeId: z.string().nullable(),
  evenement: z.enum(['saisie', 'modification', 'suppression']),
  entite: z.string().min(1),
  entiteId: z.string().min(1),
  eleveId: z.string().min(1),
  evaluationId: z.string().min(1),
  valeurAvant: z.number().int().nullable(),
  valeurApres: z.number().int().nullable(),
  statutAvant: z.string().nullable(),
  statutApres: z.string().nullable(),
  date: z.string(),
});

export const schemaEntreeAudit = z.object({
  acteurId: z.string().min(1),
  acteurUsurpeId: z.string().nullable(),
  action: z.string().min(1),
  entite: z.string().min(1),
  entiteId: z.string(),
  avant: z.unknown(),
  apres: z.unknown(),
  date: z.string(),
});

export type Utilisateur = z.infer<typeof schemaUtilisateur>;
export type ProfilEleve = z.infer<typeof schemaProfilEleve>;
export type Role = z.infer<typeof schemaRole>;
export type PermissionDeRole = z.infer<typeof schemaPermissionDeRole>;
export type PermissionUtilisateur = z.infer<typeof schemaPermissionUtilisateur>;
export type Groupe = z.infer<typeof schemaGroupe>;
export type Service = z.infer<typeof schemaService>;
export type Matiere = z.infer<typeof schemaMatiere>;
export type Niveau = z.infer<typeof schemaNiveau>;
export type Salle = z.infer<typeof schemaSalle>;
export type Periode = z.infer<typeof schemaPeriode>;
export type Config = z.infer<typeof schemaConfig>;
export type Evaluation = z.infer<typeof schemaEvaluation>;
export type Note = z.infer<typeof schemaNote>;
export type EntreeJournal = z.infer<typeof schemaEntreeJournal>;
export type EntreeAudit = z.infer<typeof schemaEntreeAudit>;

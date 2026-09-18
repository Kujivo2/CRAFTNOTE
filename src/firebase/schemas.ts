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
export type EntreeAudit = z.infer<typeof schemaEntreeAudit>;

import 'server-only';

import type {
  CollectionReference,
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import type { ZodType } from 'zod';

import { firestore } from './admin';
import {
  type EntreeAudit,
  type Groupe,
  type Matiere,
  type Niveau,
  type PermissionDeRole,
  type PermissionUtilisateur,
  type ProfilEleve,
  type Role,
  type Service,
  type Utilisateur,
  schemaEntreeAudit,
  schemaGroupe,
  schemaMatiere,
  schemaNiveau,
  schemaPermissionDeRole,
  schemaPermissionUtilisateur,
  schemaProfilEleve,
  schemaRole,
  schemaService,
  schemaUtilisateur,
} from './schemas';

// Un convertisseur type par collection (7.3). La validation se fait A LA LECTURE : c'est la
// que Firestore peut rendre n'importe quoi, puisque la base ne garantit plus aucun schema.
//
// L'ecriture, elle, est validee dans `data/`, avant l'appel : un document ecrit passe souvent
// par des sentinelles comme serverTimestamp(), que Zod ne saurait pas relire.
function convertisseur<T>(nom: string, schema: ZodType<T>): FirestoreDataConverter<T, DocumentData> {
  return {
    toFirestore: (donnees) => donnees as DocumentData,
    fromFirestore: (instantane: QueryDocumentSnapshot<DocumentData>): T => {
      const resultat = schema.safeParse(instantane.data());
      if (resultat.success) return resultat.data;

      // Nommer le document fautif : sans son chemin, une donnee malformee se cherche a l'aveugle.
      throw new Error(`Document ${nom}/${instantane.id} invalide : ${resultat.error.message}`);
    },
  };
}

function collection<T>(nom: string, schema: ZodType<T>): CollectionReference<T, DocumentData> {
  return firestore().collection(nom).withConverter(convertisseur(nom, schema));
}

export const utilisateurs = (): CollectionReference<Utilisateur, DocumentData> =>
  collection('utilisateurs', schemaUtilisateur);

export const profilsEleves = (): CollectionReference<ProfilEleve, DocumentData> =>
  collection('profilsEleves', schemaProfilEleve);

export const roles = (): CollectionReference<Role, DocumentData> => collection('roles', schemaRole);

// Sous-collection : les droits d'un role, un document par code de permission.
export const permissionsDuRole = (
  roleId: string,
): CollectionReference<PermissionDeRole, DocumentData> =>
  roles()
    .doc(roleId)
    .collection('permissions')
    .withConverter(convertisseur(`roles/${roleId}/permissions`, schemaPermissionDeRole));

export const permissionsUtilisateur = (): CollectionReference<
  PermissionUtilisateur,
  DocumentData
> => collection('permissionsUtilisateur', schemaPermissionUtilisateur);

export const groupes = (): CollectionReference<Groupe, DocumentData> =>
  collection('groupes', schemaGroupe);

export const services = (): CollectionReference<Service, DocumentData> =>
  collection('services', schemaService);

export const matieres = (): CollectionReference<Matiere, DocumentData> =>
  collection('matieres', schemaMatiere);

export const niveaux = (): CollectionReference<Niveau, DocumentData> =>
  collection('niveaux', schemaNiveau);

export const auditLog = (): CollectionReference<EntreeAudit, DocumentData> =>
  collection('auditLog', schemaEntreeAudit);

// L'unicite s'obtient par l'identifiant du document, seul mecanisme disponible (6.2).
export const identifiantSurcharge = (utilisateurId: string, permissionCode: string): string =>
  `${utilisateurId}__${permissionCode}`;

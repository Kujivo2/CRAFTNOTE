import 'server-only';

import { cache } from 'react';

import { DROITS_PROFESSEUR_PRINCIPAL, type DroitsDuRole } from '@/auth/matrice-defaut';
import type { Session } from '@/auth/peut';
import type { Portee } from '@/auth/portee';
import type { SurchargeIndividuelle } from '@/auth/resoudre';
import { uidConnecte, uidUsurpe } from '@/auth/session';
import type { CodePermission } from '@/auth/catalogue';
import {
  groupes,
  permissionsDuRole,
  permissionsUtilisateur,
  profilsEleves,
  services,
  utilisateurs,
} from '@/firebase/collections';

// La matrice complete est relue en base a chaque requete, jamais dans les revendications du
// jeton : une modification de droits prend effet immediatement, pas a la prochaine
// reconnexion (7.2). `cache` la dedoublonne a l'interieur d'une meme requete.

async function droitsDuRole(roleId: string): Promise<DroitsDuRole> {
  const instantane = await permissionsDuRole(roleId).get();
  const droits: DroitsDuRole = {};
  for (const document of instantane.docs) {
    droits[document.id as CodePermission] = document.data().portee as Portee;
  }
  return droits;
}

async function surchargesDe(uid: string): Promise<readonly SurchargeIndividuelle[]> {
  const instantane = await permissionsUtilisateur().where('utilisateurId', '==', uid).get();
  return instantane.docs.map((document) => {
    const donnees = document.data();
    return {
      permissionCode: donnees.permissionCode as CodePermission,
      portee: donnees.portee,
      autorise: donnees.autorise,
    };
  });
}

async function servicesDe(uid: string): Promise<readonly string[]> {
  const instantane = await services().where('professeurId', '==', uid).get();
  return instantane.docs.map((document) => document.id);
}

// Les groupes rattaches : son groupe pour un eleve, ses groupes de professeur principal pour
// un membre du personnel. La portee `sonGroupe` couvre les deux cas sans les distinguer.
async function groupesDe(uid: string, estEleve: boolean): Promise<readonly string[]> {
  if (estEleve) {
    const profil = await profilsEleves().doc(uid).get();
    const donnees = profil.data();
    return donnees === undefined ? [] : [donnees.groupeId];
  }

  const instantane = await groupes().where('profPrincipalId', '==', uid).get();
  return instantane.docs.map((document) => document.id);
}

async function chargerSession(): Promise<Session | null> {
  const uidReel = await uidConnecte();
  if (uidReel === null) return null;

  const emprunte = await uidUsurpe();
  // Pendant une usurpation, l'identite EFFECTIVE est celle du compte emprunte, et l'admin reel
  // reste porte a part : c'est lui qui apparaitra dans le journal (4.6).
  const uidEffectif = emprunte ?? uidReel;

  const document = await utilisateurs().doc(uidEffectif).get();
  const utilisateur = document.data();

  // Compte Auth sans document Firestore : le cas que l'inspection du 6.1 sort en evidence,
  // parce qu'il casse silencieusement une application. Ici, il refuse la session.
  if (utilisateur === undefined || !utilisateur.actif) return null;

  const estEleve = utilisateur.roleId === 'eleve';
  const [droitsRole, surcharges, serviceIds, groupeIds] = await Promise.all([
    droitsDuRole(utilisateur.roleId),
    surchargesDe(uidEffectif),
    estEleve ? Promise.resolve([]) : servicesDe(uidEffectif),
    groupesDe(uidEffectif, estEleve),
  ]);

  return {
    utilisateurId: uidEffectif,
    roleCode: utilisateur.roleId,
    serviceIds,
    groupeIds,
    estProfesseurPrincipal: !estEleve && groupeIds.length > 0,
    droitsRole,
    droitsProfesseurPrincipal: DROITS_PROFESSEUR_PRINCIPAL,
    surcharges,
    adminReelId: emprunte === null ? null : uidReel,
  };
}

export const sessionActive = cache(chargerSession);

// A appeler en tete de toute fonction de `data/` qui exige d'etre connecte.
export async function exigerSession(): Promise<Session> {
  const session = await sessionActive();
  if (session === null) throw new Error('Session absente ou expirée.');
  return session;
}

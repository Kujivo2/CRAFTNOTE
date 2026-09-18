import 'server-only';

import { type CodePermission, porteeAutorisee } from '@/auth/catalogue';
import { peutAccorder, peutModifierDroitsDuRole } from '@/auth/garde-fous';
import type { CodeRole, DroitsDuRole } from '@/auth/matrice-defaut';
import { exigerPermission } from '@/auth/peut';
import type { Portee } from '@/auth/portee';
import { attribuer } from '@/domain/journal';
import { auditLog, permissionsDuRole, roles } from '@/firebase/collections';
import { firestore } from '@/firebase/admin';
import { exigerSession } from './session';

// Le panneau des droits. Ce que chaque rôle a le droit de faire est une donnée en base, pas une
// constante du code : on coche, on enregistre, sans redéployer (2).

export type DroitsParRole = Partial<Record<CodeRole, DroitsDuRole>>;

export async function tousLesDroits(): Promise<DroitsParRole> {
  const session = await exigerSession();
  exigerPermission(session, 'droits.gerer');

  const tous: DroitsParRole = {};
  const instantane = await roles().get();

  for (const role of instantane.docs) {
    const permissions = await permissionsDuRole(role.id).get();
    const droits: DroitsDuRole = {};
    for (const permission of permissions.docs) {
      droits[permission.id as CodePermission] = permission.data().portee as Portee;
    }
    tous[role.id as CodeRole] = droits;
  }

  return tous;
}

export type Changement = {
  readonly code: CodePermission;
  readonly portee: Portee | null; // null retire le droit
};

export async function enregistrerDroitsDuRole(
  roleId: CodeRole,
  changements: readonly Changement[],
): Promise<void> {
  const session = await exigerSession();
  exigerPermission(session, 'droits.gerer');

  // Les cases de l'administrateur sont cochées et désactivées à l'écran. Le serveur refuse
  // quand même, au cas où la requête arriverait sans passer par l'écran.
  const modifiable = peutModifierDroitsDuRole(roleId);
  if (!modifiable.ok) throw new Error(modifiable.raison);

  const permissions = permissionsDuRole(roleId);
  const avant = await permissions.get();
  const etatAvant: DroitsDuRole = {};
  for (const document of avant.docs) {
    etatAvant[document.id as CodePermission] = document.data().portee as Portee;
  }

  const lot = firestore().batch();
  const appliques: Changement[] = [];

  for (const changement of changements) {
    if (etatAvant[changement.code] === (changement.portee ?? undefined)) continue;

    if (changement.portee === null) {
      lot.delete(permissions.doc(changement.code));
      appliques.push(changement);
      continue;
    }

    // Deux refus : une portée que la permission n'admet pas, et un droit que l'acteur ne
    // détient pas lui-même. Personne n'accorde plus que ce qu'il a (2).
    if (!porteeAutorisee(changement.code, changement.portee)) {
      throw new Error(`Portée « ${changement.portee} » impossible pour ${changement.code}.`);
    }
    const autorise = peutAccorder(session, changement.code, changement.portee);
    if (!autorise.ok) throw new Error(autorise.raison);

    lot.set(permissions.doc(changement.code), { portee: changement.portee });
    appliques.push(changement);
  }

  if (appliques.length === 0) return;

  // Toute modification de droits part au journal d'audit (2). Pendant une usurpation, c'est
  // l'administrateur réel qui est enregistré.
  const acteur = attribuer({
    utilisateurId: session.utilisateurId,
    adminReelId: session.adminReelId,
  });

  lot.set(auditLog().doc(), {
    acteurId: acteur.acteurId,
    acteurUsurpeId: acteur.acteurUsurpeId,
    action: 'droits.modifier',
    entite: 'role',
    entiteId: roleId,
    avant: etatAvant,
    apres: Object.fromEntries(appliques.map((c) => [c.code, c.portee])),
    date: new Date().toISOString(),
  });

  await lot.commit();
}

import 'server-only';

import { utilisateurs } from '@/firebase/collections';

// Une fonction = une requête + son contrôle d'accès (7.3).
//
// Les deux fonctions ci-dessous sont l'exception assumée : elles tournent AVANT qu'une session
// existe, donc il n'y a encore personne dont vérifier les droits. Elles ne rendent que ce qu'il
// faut pour accepter ou refuser une connexion, et rien d'autre.

export type EtatDeCompte =
  | { readonly etat: 'absent' }
  | { readonly etat: 'desactive' }
  | { readonly etat: 'actif'; readonly prenom: string; readonly nom: string };

export async function etatDuCompte(uid: string): Promise<EtatDeCompte> {
  const document = await utilisateurs().doc(uid).get();
  const utilisateur = document.data();

  // Compte Auth sans document Firestore : le cas que l'inspection du 6.1 sort en évidence,
  // parce qu'il casse l'écran suivant plutôt que la connexion. Ici, il refuse la session.
  if (utilisateur === undefined) return { etat: 'absent' };
  if (!utilisateur.actif) return { etat: 'desactive' };

  return { etat: 'actif', prenom: utilisateur.prenom, nom: utilisateur.nom };
}

export async function marquerConnexion(uid: string): Promise<void> {
  await utilisateurs().doc(uid).update({ derniereConnexion: new Date().toISOString() });
}

// Le profil du compte connecte, pour l'en-tete. Pas de controle de permission : la session a
// deja ete etablie, et personne ne lit ici autre chose que son propre nom.
export async function profilConnecte(
  uid: string,
): Promise<{ readonly prenom: string; readonly nom: string } | null> {
  const document = await utilisateurs().doc(uid).get();
  const utilisateur = document.data();
  if (utilisateur === undefined) return null;
  return { prenom: utilisateur.prenom, nom: utilisateur.nom };
}

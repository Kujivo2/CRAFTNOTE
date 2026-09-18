'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';

import { fermerSession, ouvrirSession, verifierJetonIdentite } from '@/auth/session';
import { etatDuCompte, marquerConnexion } from '@/data/utilisateurs';

// Le jeton d'identité vient du navigateur : on ne lui fait aucune confiance. C'est sa
// vérification côté serveur, et non le formulaire, qui établit l'identité (7.3).
//
// Aucun accès Firestore ici : tout passe par data/, et scripts/verifier-cloisonnement.mjs
// le vérifie.
const schemaJeton = z.object({ jeton: z.string().min(1) });

export type ResultatConnexion = { readonly erreur: string | null };

export async function connecter(donnees: unknown): Promise<ResultatConnexion> {
  const lecture = schemaJeton.safeParse(donnees);
  if (!lecture.success) return { erreur: 'Requête de connexion invalide.' };

  const uid = await verifierJetonIdentite(lecture.data.jeton);
  if (uid === null) return { erreur: 'Connexion refusée. Réessayez.' };

  const compte = await etatDuCompte(uid);
  if (compte.etat === 'absent') {
    return { erreur: 'Ce compte n’a pas de profil CRAFTNOTE. Prévenez l’administrateur.' };
  }
  if (compte.etat === 'desactive') {
    return { erreur: 'Ce compte est désactivé.' };
  }

  await ouvrirSession(lecture.data.jeton);
  await marquerConnexion(uid);

  return { erreur: null };
}

export async function deconnecter(): Promise<never> {
  await fermerSession();
  redirect('/connexion');
}

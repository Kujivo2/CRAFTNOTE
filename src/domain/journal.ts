// Journal des modifications (4.6).
//
// Aucun verrouillage nulle part, un journal a la place. Le journal est silencieux : il
// n'alimente aucune notification, aucun badge, aucun compteur visible. On enregistre, et on
// regarde a la fin.
//
// La regle qui compte : une premiere saisie n'est PAS une modification. Un professeur qui
// remplit son carnet ne doit pas apparaitre dans les statistiques de correction.

import type { StatutNote } from './types';

export type EvenementJournal = 'saisie' | 'modification' | 'suppression';

export type EtatNote = {
  readonly valeurCentiemes: number | null;
  readonly statut: StatutNote;
  readonly commentaire: string;
  readonly coefficient: number;
  readonly priseEnCompte: boolean;
};

// « Aucune note » : le document n'existe pas, ou il existe et ne porte rien.
function estVide(etat: EtatNote | null): boolean {
  if (etat === null) return true;
  return etat.statut === 'nonNotee' && etat.valeurCentiemes === null && etat.commentaire === '';
}

function identiques(avant: EtatNote, apres: EtatNote): boolean {
  return (
    avant.valeurCentiemes === apres.valeurCentiemes &&
    avant.statut === apres.statut &&
    avant.commentaire === apres.commentaire &&
    avant.coefficient === apres.coefficient &&
    avant.priseEnCompte === apres.priseEnCompte
  );
}

// null quand rien n'a change : on n'ecrit pas une entree pour une reecriture identique,
// sinon le journal se remplit de bruit et le filtre « ecarts les plus importants » ne dit plus rien.
export function classerEvenement(
  avant: EtatNote | null,
  apres: EtatNote | null,
): EvenementJournal | null {
  const avantVide = estVide(avant);
  const apresVide = estVide(apres);

  if (avantVide && apresVide) return null;
  if (avantVide) return 'saisie';
  if (apresVide) return 'suppression';

  // Les deux etats sont renseignes : c'est une modification, sauf si rien n'a bouge.
  // `avant` et `apres` sont non nuls ici, puisqu'un etat nul est vide.
  if (avant !== null && apres !== null && identiques(avant, apres)) return null;
  return 'modification';
}

// Sert au filtre « ecarts les plus importants » : 19 vers 14 n'a pas le meme sens que
// 13,5 vers 13. Rendu en centiemes, null quand l'ecart n'est pas une difference de valeur
// (changement de statut, de commentaire ou de coefficient).
export function ecartCentiemes(avant: EtatNote | null, apres: EtatNote | null): number | null {
  const valeurAvant = avant?.valeurCentiemes ?? null;
  const valeurApres = apres?.valeurCentiemes ?? null;
  if (valeurAvant === null || valeurApres === null) return null;
  return Math.abs(valeurApres - valeurAvant);
}

export type SessionActive = {
  readonly utilisateurId: string; // l'identite effective, celle sous laquelle on agit
  readonly adminReelId: string | null; // renseigne uniquement pendant une usurpation
};

export type Attribution = {
  readonly acteurId: string;
  readonly acteurUsurpeId: string | null;
};

// Tout est journalise au nom de l'admin reel : c'est lui qui a agi, meme sous une autre identite.
export function attribuer(session: SessionActive): Attribution {
  if (session.adminReelId === null) {
    return { acteurId: session.utilisateurId, acteurUsurpeId: null };
  }
  return { acteurId: session.adminReelId, acteurUsurpeId: session.utilisateurId };
}

// Garde-fous du 2. Ce sont les regles qui empechent de se tirer dans le pied depuis le panneau
// des droits, et elles sont verifiees cote serveur : le bouton grise cote client ne compte pas.

import type { CodePermission } from './catalogue';
import { type Session, peut } from './peut';
import type { Portee } from './portee';
import { resoudreDroit } from './resoudre';

export type Resultat = { readonly ok: true } | { readonly ok: false; readonly raison: string };

const OK: Resultat = { ok: true };

function refus(raison: string): Resultat {
  return { ok: false, raison };
}

// Personne n'accorde un droit qu'il n'a pas, ni dans une portee qu'il ne detient pas.
export function peutAccorder(
  accordeur: Session,
  code: CodePermission,
  portee: Portee,
): Resultat {
  if (!peut(accordeur, 'droits.gerer', {})) {
    return refus('Vous n’avez pas le droit de modifier le panneau des droits.');
  }

  const decision = resoudreDroit(code, accordeur);
  if (!decision.accorde) {
    return refus(`Vous ne détenez pas vous-même ${code}.`);
  }

  // Detenir la portee `etablissement` suffit a accorder n'importe quelle portee plus etroite ;
  // sinon il faut detenir exactement celle qu'on accorde. On ne classe pas les portees entre
  // elles au-dela de ce cas, parce qu'elles ne forment pas une echelle.
  const couvre = decision.portees.includes('etablissement') || decision.portees.includes(portee);
  if (!couvre) {
    return refus(`Vous ne détenez pas ${code} dans la portée « ${portee} ».`);
  }

  return OK;
}

// Les cases de l'administrateur sont cochees et desactivees. Le serveur refuse quand meme,
// au cas ou la requete arriverait sans passer par l'ecran.
export function peutModifierDroitsDuRole(roleCode: string): Resultat {
  if (roleCode === 'administrateur') {
    return refus('Les droits de l’administrateur ne se modifient pas.');
  }
  return OK;
}

export type ChangementRole = {
  readonly acteurId: string;
  readonly cibleId: string;
  readonly roleActuelCible: string;
  readonly nouveauRole: string;
  readonly administrateursActifs: readonly string[];
};

export function verifierChangementRole(changement: ChangementRole): Resultat {
  if (changement.acteurId === changement.cibleId) {
    return refus('Personne ne modifie son propre rôle.');
  }

  const perdSonAdmin =
    changement.roleActuelCible === 'administrateur' && changement.nouveauRole !== 'administrateur';

  if (perdSonAdmin && dernierAdministrateur(changement.cibleId, changement.administrateursActifs)) {
    return refus('Il doit rester au moins un administrateur actif.');
  }

  return OK;
}

export type Desactivation = {
  readonly acteurId: string;
  readonly cibleId: string;
  readonly cibleEstAdministrateur: boolean;
  readonly administrateursActifs: readonly string[];
};

export function verifierDesactivation(desactivation: Desactivation): Resultat {
  if (desactivation.acteurId === desactivation.cibleId) {
    return refus('Personne ne désactive son propre compte.');
  }

  if (
    desactivation.cibleEstAdministrateur &&
    dernierAdministrateur(desactivation.cibleId, desactivation.administrateursActifs)
  ) {
    return refus('Il doit rester au moins un administrateur actif.');
  }

  return OK;
}

function dernierAdministrateur(cibleId: string, administrateursActifs: readonly string[]): boolean {
  const restants = administrateursActifs.filter((identifiant) => identifiant !== cibleId);
  return restants.length === 0;
}

// Une usurpation est reservee a l'administrateur, et on ne s'usurpe ni soi-meme ni un autre
// administrateur : sinon la tracabilite du 4.6 ne designe plus personne.
export function verifierUsurpation(acteur: Session, cibleId: string, cibleEstAdmin: boolean): Resultat {
  // Teste avant la permission : pendant une usurpation, `comptes.usurper` est deja bloquee
  // comme action destructrice, et le message serait trompeur.
  if (acteur.adminReelId !== null) {
    return refus('Une usurpation est déjà en cours.');
  }
  if (!peut(acteur, 'comptes.usurper', {})) {
    return refus('Seul un administrateur emprunte une identité.');
  }
  if (acteur.utilisateurId === cibleId) {
    return refus('Vous êtes déjà connecté avec ce compte.');
  }
  if (cibleEstAdmin) {
    return refus('On n’emprunte pas l’identité d’un autre administrateur.');
  }
  return OK;
}

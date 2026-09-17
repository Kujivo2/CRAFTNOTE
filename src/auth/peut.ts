// `peut(session, code, contexte)` : le seul point d'entree du controle d'acces.
//
// Le code de l'application n'ecrit jamais « si le role est professeur ». Il appelle ceci, et
// `data/` l'appelle avant chaque lecture et chaque ecriture (7.3, 10). Jamais le middleware :
// le middleware redirige, il n'autorise pas.

import { type CodePermission, estDestructrice } from './catalogue';
import type { CodeRole, DroitsDuRole } from './matrice-defaut';
import { type Contexte, type Sujet, porteeSatisfaite } from './portee';
import { type Decision, type SurchargeIndividuelle, resoudreDroit } from './resoudre';

export type Session = {
  readonly utilisateurId: string;
  readonly roleCode: CodeRole;
  // Services et groupes rattaches, resolus en base a l'ouverture de la session.
  readonly serviceIds: readonly string[];
  readonly groupeIds: readonly string[];
  readonly estProfesseurPrincipal: boolean;
  // La matrice vient de Firestore, pas des revendications du jeton : une modification de droits
  // prend effet immediatement, pas a la prochaine reconnexion (7.2).
  readonly droitsRole: DroitsDuRole;
  readonly droitsProfesseurPrincipal: DroitsDuRole;
  readonly surcharges: readonly SurchargeIndividuelle[];
  // Renseigne uniquement pendant une usurpation d'identite.
  readonly adminReelId: string | null;
};

export type Verdict = {
  readonly accorde: boolean;
  readonly decision: Decision;
  readonly raison: 'accorde' | 'usurpationBloquante' | 'droitRefuse' | 'porteeInsuffisante';
};

function sujetDe(session: Session): Sujet {
  return {
    utilisateurId: session.utilisateurId,
    serviceIds: session.serviceIds,
    groupeIds: session.groupeIds,
  };
}

export function peutAvecRaison(
  session: Session,
  code: CodePermission,
  contexte: Contexte = {},
): Verdict {
  const decision = resoudreDroit(code, session);

  // Pendant une usurpation, les actions destructrices sont bloquees meme pour l'administrateur.
  if (session.adminReelId !== null && estDestructrice(code)) {
    return { accorde: false, decision, raison: 'usurpationBloquante' };
  }

  if (!decision.accorde) {
    return { accorde: false, decision, raison: 'droitRefuse' };
  }

  const sujet = sujetDe(session);
  const couverte = decision.portees.some((portee) => porteeSatisfaite(portee, sujet, contexte));

  return couverte
    ? { accorde: true, decision, raison: 'accorde' }
    : { accorde: false, decision, raison: 'porteeInsuffisante' };
}

export function peut(session: Session, code: CodePermission, contexte: Contexte = {}): boolean {
  return peutAvecRaison(session, code, contexte).accorde;
}

// A appeler en tete de chaque Server Action, apres la validation Zod et jamais avant :
// on ne leve pas une erreur sur des donnees qu'on n'a pas encore relues.
export function exigerPermission(
  session: Session,
  code: CodePermission,
  contexte: Contexte = {},
): void {
  const verdict = peutAvecRaison(session, code, contexte);
  if (verdict.accorde) return;

  if (verdict.raison === 'usurpationBloquante') {
    throw new Error(`Action impossible pendant une usurpation d’identité : ${code}`);
  }
  throw new Error(`Permission refusée : ${code}`);
}

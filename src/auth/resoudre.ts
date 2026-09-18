// Resolution d'un droit (2), dans cet ordre exact :
//   interdiction individuelle > autorisation individuelle > droit du role > refus.
//
// Une permission peut etre accordee dans PLUSIEURS portees a la fois, et c'est indispensable :
// un professeur principal garde `notes.voir` sur ses services, dans tous ses groupes, et gagne
// `sonGroupe` par-dessus. Une portee unique lui ferait perdre ses autres classes.

import { type CodePermission } from './catalogue';
import type { CodeRole, DroitsDuRole } from './matrice-defaut';
import type { Portee } from './portee';

export type SurchargeIndividuelle = {
  readonly permissionCode: CodePermission;
  readonly portee: Portee;
  readonly autorise: boolean;
};

export type OrigineDecision =
  | 'administrateur'
  | 'interdictionIndividuelle'
  | 'autorisationIndividuelle'
  | 'role'
  | 'refusParDefaut';

export type Decision = {
  readonly accorde: boolean;
  // Portees accordees. Le droit s'applique des que l'une d'elles est satisfaite.
  readonly portees: readonly Portee[];
  readonly origine: OrigineDecision;
};

export type ContexteDroits = {
  readonly roleCode: CodeRole;
  readonly droitsRole: DroitsDuRole;
  readonly estProfesseurPrincipal: boolean;
  readonly droitsProfesseurPrincipal: DroitsDuRole;
  readonly surcharges: readonly SurchargeIndividuelle[];
};

const REFUS: Decision = { accorde: false, portees: [], origine: 'refusParDefaut' };

function surchargesPour(
  surcharges: readonly SurchargeIndividuelle[],
  code: CodePermission,
  autorise: boolean,
): readonly Portee[] {
  return surcharges
    .filter((surcharge) => surcharge.permissionCode === code && surcharge.autorise === autorise)
    .map((surcharge) => surcharge.portee);
}

function unique(portees: readonly Portee[]): readonly Portee[] {
  return [...new Set(portees)];
}

export function resoudreDroit(code: CodePermission, contexte: ContexteDroits): Decision {
  // L'administrateur detient toujours tout, sans consulter la table : ses cases sont cochees
  // et desactivees dans le panneau, et le serveur ne se laisse pas convaincre du contraire.
  if (contexte.roleCode === 'administrateur') {
    return { accorde: true, portees: ['etablissement'], origine: 'administrateur' };
  }

  // Une interdiction individuelle ferme le droit entierement, quelle que soit sa portee :
  // on interdit quelqu'un, on ne le restreint pas a une sous-partie.
  if (surchargesPour(contexte.surcharges, code, false).length > 0) {
    return { accorde: false, portees: [], origine: 'interdictionIndividuelle' };
  }

  const autorisations = surchargesPour(contexte.surcharges, code, true);
  const duRole = contexte.droitsRole[code];

  // Le professeur principal n'est pas un role : ses droits s'AJOUTENT, ils ne remplacent pas.
  const duPp = contexte.estProfesseurPrincipal
    ? contexte.droitsProfesseurPrincipal[code]
    : undefined;
  const bonusPp: readonly Portee[] = duPp === undefined ? [] : [duPp];

  if (autorisations.length > 0) {
    return {
      accorde: true,
      portees: unique([...autorisations, ...bonusPp]),
      origine: 'autorisationIndividuelle',
    };
  }

  const portees = unique([...(duRole === undefined ? [] : [duRole]), ...bonusPp]);
  if (portees.length === 0) return REFUS;

  return { accorde: true, portees, origine: 'role' };
}

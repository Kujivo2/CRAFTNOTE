import { describe, expect, it } from 'vitest';
import {
  DROITS_PROFESSEUR_PRINCIPAL,
  MATRICE_PAR_DEFAUT,
  type CodeRole,
} from './matrice-defaut';
import { peut, peutAvecRaison, type Session } from './peut';
import type { Contexte } from './portee';
import { resoudreDroit, type SurchargeIndividuelle } from './resoudre';

const CONTEXTE_COMPLET: Contexte = { eleveId: 'u1', serviceId: 's1', groupeId: 'g1' };

function sessionDe(
  roleCode: CodeRole,
  options: {
    surcharges?: readonly SurchargeIndividuelle[];
    adminReelId?: string | null;
    estProfesseurPrincipal?: boolean;
  } = {},
): Session {
  return {
    utilisateurId: 'u1',
    roleCode,
    serviceIds: ['s1'],
    groupeIds: ['g1'],
    estProfesseurPrincipal: options.estProfesseurPrincipal ?? false,
    droitsRole: MATRICE_PAR_DEFAUT[roleCode],
    droitsProfesseurPrincipal: DROITS_PROFESSEUR_PRINCIPAL,
    surcharges: options.surcharges ?? [],
    adminReelId: options.adminReelId ?? null,
  };
}

const INTERDICTION: SurchargeIndividuelle = {
  permissionCode: 'notes.voir',
  portee: 'etablissement',
  autorise: false,
};

const AUTORISATION: SurchargeIndividuelle = {
  permissionCode: 'notes.voir',
  portee: 'etablissement',
  autorise: true,
};

describe('ordre de resolution', () => {
  it('une interdiction individuelle bat une autorisation individuelle', () => {
    const prof = sessionDe('professeur', { surcharges: [AUTORISATION, INTERDICTION] });
    const verdict = peutAvecRaison(prof, 'notes.voir', CONTEXTE_COMPLET);
    expect(verdict.accorde).toBe(false);
    expect(verdict.decision.origine).toBe('interdictionIndividuelle');
  });

  it('l ordre de declaration des surcharges ne change rien', () => {
    const prof = sessionDe('professeur', { surcharges: [INTERDICTION, AUTORISATION] });
    expect(peut(prof, 'notes.voir', CONTEXTE_COMPLET)).toBe(false);
  });

  it('une autorisation individuelle bat le droit du role', () => {
    const surveillant = sessionDe('surveillant', { surcharges: [AUTORISATION] });
    const verdict = peutAvecRaison(surveillant, 'notes.voir', CONTEXTE_COMPLET);
    expect(verdict.accorde).toBe(true);
    expect(verdict.decision.origine).toBe('autorisationIndividuelle');
  });

  it('le droit du role bat le refus par defaut', () => {
    const verdict = peutAvecRaison(sessionDe('professeur'), 'notes.voir', CONTEXTE_COMPLET);
    expect(verdict.decision.origine).toBe('role');
  });

  it('refuse par defaut quand rien n accorde le droit', () => {
    const verdict = peutAvecRaison(sessionDe('eleve'), 'notes.saisir', CONTEXTE_COMPLET);
    expect(verdict.accorde).toBe(false);
    expect(verdict.decision.origine).toBe('refusParDefaut');
    expect(verdict.decision.portees).toEqual([]);
  });
});

describe('cumul des portees', () => {
  it('ajoute la portee du professeur principal a celle du role', () => {
    const pp = sessionDe('professeur', { estProfesseurPrincipal: true });
    const decision = resoudreDroit('notes.voir', pp);
    expect(decision.portees).toContain('sesServices');
    expect(decision.portees).toContain('sonGroupe');
  });

  it('ajoute aussi la portee du professeur principal a une autorisation individuelle', () => {
    const pp = sessionDe('professeur', {
      estProfesseurPrincipal: true,
      surcharges: [AUTORISATION],
    });
    const decision = resoudreDroit('notes.voir', pp);
    expect(decision.origine).toBe('autorisationIndividuelle');
    expect(decision.portees).toContain('sonGroupe');
  });

  it('ne repete jamais deux fois la meme portee', () => {
    const decision = resoudreDroit('notes.voir', sessionDe('direction'));
    expect(new Set(decision.portees).size).toBe(decision.portees.length);
  });
});

describe('l administrateur detient toujours tout', () => {
  it('ignore une interdiction individuelle posee sur lui', () => {
    const admin = sessionDe('administrateur', { surcharges: [INTERDICTION] });
    const decision = resoudreDroit('notes.voir', admin);
    expect(decision.accorde).toBe(true);
    expect(decision.origine).toBe('administrateur');
  });

  it('couvre toutes les portees sans contexte particulier', () => {
    expect(peut(sessionDe('administrateur'), 'notes.voir', {})).toBe(true);
  });
});

describe('usurpation d identite', () => {
  it('bloque les actions destructrices meme pour l administrateur', () => {
    const emprunteur = sessionDe('administrateur', { adminReelId: 'admin-1' });
    const verdict = peutAvecRaison(emprunteur, 'comptes.changerRole', CONTEXTE_COMPLET);
    expect(verdict.accorde).toBe(false);
    expect(verdict.raison).toBe('usurpationBloquante');
  });

  it('bloque aussi le fait de prononcer une sanction', () => {
    const emprunteur = sessionDe('administrateur', { adminReelId: 'admin-1' });
    expect(peut(emprunteur, 'sanctions.prononcer', CONTEXTE_COMPLET)).toBe(false);
  });

  it('laisse passer la consultation pendant une usurpation', () => {
    const emprunteur = sessionDe('administrateur', { adminReelId: 'admin-1' });
    expect(peut(emprunteur, 'notes.voir', CONTEXTE_COMPLET)).toBe(true);
    expect(peut(emprunteur, 'edt.voirTous', CONTEXTE_COMPLET)).toBe(true);
  });
});

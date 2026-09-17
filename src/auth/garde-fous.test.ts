import { describe, expect, it } from 'vitest';
import {
  peutAccorder,
  peutModifierDroitsDuRole,
  verifierChangementRole,
  verifierDesactivation,
  verifierUsurpation,
} from './garde-fous';
import {
  DROITS_PROFESSEUR_PRINCIPAL,
  MATRICE_PAR_DEFAUT,
  type CodeRole,
} from './matrice-defaut';
import type { Session } from './peut';

function sessionDe(roleCode: CodeRole, utilisateurId = 'u1', adminReelId: string | null = null): Session {
  return {
    utilisateurId,
    roleCode,
    serviceIds: ['s1'],
    groupeIds: ['g1'],
    estProfesseurPrincipal: false,
    droitsRole: MATRICE_PAR_DEFAUT[roleCode],
    droitsProfesseurPrincipal: DROITS_PROFESSEUR_PRINCIPAL,
    surcharges: [],
    adminReelId,
  };
}

describe('personne n accorde un droit qu il n a pas', () => {
  it('refuse a qui ne gere pas les droits', () => {
    expect(peutAccorder(sessionDe('direction'), 'notes.voir', 'etablissement').ok).toBe(false);
  });

  it('laisse l administrateur accorder ce qu il detient', () => {
    expect(peutAccorder(sessionDe('administrateur'), 'notes.voir', 'etablissement').ok).toBe(true);
    expect(peutAccorder(sessionDe('administrateur'), 'droits.gerer', 'etablissement').ok).toBe(true);
  });

  it('nomme la raison du refus plutot que de repondre non', () => {
    const resultat = peutAccorder(sessionDe('professeur'), 'sanctions.prononcer', 'etablissement');
    expect(resultat.ok).toBe(false);
    if (!resultat.ok) expect(resultat.raison).not.toBe('');
  });
});

describe('les cases de l administrateur sont verrouillees', () => {
  it('refuse de modifier les droits du role administrateur', () => {
    expect(peutModifierDroitsDuRole('administrateur').ok).toBe(false);
  });

  it('laisse modifier les autres roles', () => {
    expect(peutModifierDroitsDuRole('professeur').ok).toBe(true);
    expect(peutModifierDroitsDuRole('cpe').ok).toBe(true);
  });
});

describe('changement de role', () => {
  it('interdit de modifier son propre role', () => {
    const resultat = verifierChangementRole({
      acteurId: 'u1',
      cibleId: 'u1',
      roleActuelCible: 'professeur',
      nouveauRole: 'direction',
      administrateursActifs: ['admin-1'],
    });
    expect(resultat.ok).toBe(false);
  });

  it('interdit de retirer le dernier administrateur', () => {
    const resultat = verifierChangementRole({
      acteurId: 'admin-1',
      cibleId: 'admin-2',
      roleActuelCible: 'administrateur',
      nouveauRole: 'direction',
      administrateursActifs: ['admin-2'],
    });
    expect(resultat.ok).toBe(false);
  });

  it('accepte de retirer un administrateur s il en reste un autre', () => {
    const resultat = verifierChangementRole({
      acteurId: 'admin-1',
      cibleId: 'admin-2',
      roleActuelCible: 'administrateur',
      nouveauRole: 'direction',
      administrateursActifs: ['admin-1', 'admin-2'],
    });
    expect(resultat.ok).toBe(true);
  });

  it('laisse promouvoir quelqu un administrateur', () => {
    const resultat = verifierChangementRole({
      acteurId: 'admin-1',
      cibleId: 'u2',
      roleActuelCible: 'professeur',
      nouveauRole: 'administrateur',
      administrateursActifs: ['admin-1'],
    });
    expect(resultat.ok).toBe(true);
  });
});

describe('desactivation', () => {
  it('interdit de se desactiver soi-meme', () => {
    const resultat = verifierDesactivation({
      acteurId: 'u1',
      cibleId: 'u1',
      cibleEstAdministrateur: false,
      administrateursActifs: ['admin-1'],
    });
    expect(resultat.ok).toBe(false);
  });

  it('interdit de desactiver le dernier administrateur actif', () => {
    const resultat = verifierDesactivation({
      acteurId: 'admin-1',
      cibleId: 'admin-2',
      cibleEstAdministrateur: true,
      administrateursActifs: ['admin-2'],
    });
    expect(resultat.ok).toBe(false);
  });

  it('accepte de desactiver un compte ordinaire', () => {
    const resultat = verifierDesactivation({
      acteurId: 'admin-1',
      cibleId: 'u2',
      cibleEstAdministrateur: false,
      administrateursActifs: ['admin-1'],
    });
    expect(resultat.ok).toBe(true);
  });
});

describe('usurpation', () => {
  it('est refusee a qui n est pas administrateur', () => {
    expect(verifierUsurpation(sessionDe('direction'), 'u2', false).ok).toBe(false);
  });

  it('est accordee a l administrateur sur un compte ordinaire', () => {
    expect(verifierUsurpation(sessionDe('administrateur'), 'u2', false).ok).toBe(true);
  });

  it('refuse d emprunter l identite d un autre administrateur', () => {
    expect(verifierUsurpation(sessionDe('administrateur'), 'admin-2', true).ok).toBe(false);
  });

  it('refuse de s usurper soi-meme', () => {
    expect(verifierUsurpation(sessionDe('administrateur', 'u1'), 'u1', false).ok).toBe(false);
  });

  it('refuse une usurpation en cascade', () => {
    const deja = sessionDe('administrateur', 'u1', 'admin-1');
    expect(verifierUsurpation(deja, 'u2', false).ok).toBe(false);
  });
});

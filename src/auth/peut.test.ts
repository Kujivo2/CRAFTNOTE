import { describe, expect, it } from 'vitest';
import type { CodePermission } from './catalogue';
import {
  DROITS_PROFESSEUR_PRINCIPAL,
  MATRICE_PAR_DEFAUT,
  type CodeRole,
} from './matrice-defaut';
import { peut, peutAvecRaison, type Session } from './peut';
import type { Contexte } from './portee';
import { resoudreDroit, type SurchargeIndividuelle } from './resoudre';

const ROLES: readonly CodeRole[] = [
  'eleve',
  'professeur',
  'surveillant',
  'cpe',
  'direction',
  'administrateur',
];

// Un contexte qui satisfait les quatre portees a la fois : on isole ainsi la question
// « le droit est-il accorde ? » de la question « la portee couvre-t-elle la demande ? »,
// qui a son propre bloc plus bas.
const CONTEXTE_COMPLET: Contexte = { eleveId: 'u1', serviceId: 's1', groupeId: 'g1' };

function sessionDe(
  roleCode: CodeRole,
  options: {
    estProfesseurPrincipal?: boolean;
    surcharges?: readonly SurchargeIndividuelle[];
    adminReelId?: string | null;
    serviceIds?: readonly string[];
    groupeIds?: readonly string[];
  } = {},
): Session {
  return {
    utilisateurId: 'u1',
    roleCode,
    serviceIds: options.serviceIds ?? ['s1'],
    groupeIds: options.groupeIds ?? ['g1'],
    estProfesseurPrincipal: options.estProfesseurPrincipal ?? false,
    droitsRole: MATRICE_PAR_DEFAUT[roleCode],
    droitsProfesseurPrincipal: DROITS_PROFESSEUR_PRINCIPAL,
    surcharges: options.surcharges ?? [],
    adminReelId: options.adminReelId ?? null,
  };
}

// Une ligne par regle de la matrice du 2. On verifie les deux sens : que ceux qui doivent
// l'avoir l'ont, et surtout que les autres ne l'ont pas.
const REGLES: readonly { code: CodePermission; autorises: readonly CodeRole[] }[] = [
  { code: 'edt.voirTous', autorises: ['professeur', 'surveillant', 'cpe', 'direction', 'administrateur'] },
  { code: 'edt.seanceModifier', autorises: ['professeur', 'cpe', 'direction', 'administrateur'] },
  { code: 'edt.soireeDecaler', autorises: ['cpe', 'direction', 'administrateur'] },
  { code: 'cdt.voir', autorises: ROLES },
  { code: 'cdt.ecrire', autorises: ['professeur', 'direction', 'administrateur'] },
  { code: 'devoirs.creer', autorises: ['professeur', 'direction', 'administrateur'] },
  { code: 'evaluations.creer', autorises: ['professeur', 'direction', 'administrateur'] },
  { code: 'notes.saisir', autorises: ['professeur', 'direction', 'administrateur'] },
  { code: 'notes.publier', autorises: ['professeur', 'direction', 'administrateur'] },
  { code: 'notes.voir', autorises: ['eleve', 'professeur', 'cpe', 'direction', 'administrateur'] },
  { code: 'appel.faire', autorises: ['professeur', 'surveillant', 'cpe', 'direction', 'administrateur'] },
  { code: 'appel.rattraper', autorises: ['cpe', 'direction', 'administrateur'] },
  { code: 'absences.saisir', autorises: ['surveillant', 'cpe', 'direction', 'administrateur'] },
  { code: 'absences.justifier', autorises: ['cpe', 'direction', 'administrateur'] },
  { code: 'punitions.infliger', autorises: ['professeur', 'surveillant', 'cpe', 'direction', 'administrateur'] },
  { code: 'retenues.planifier', autorises: ['surveillant', 'cpe', 'direction', 'administrateur'] },
  { code: 'retenues.pointer', autorises: ['surveillant', 'cpe', 'direction', 'administrateur'] },
  { code: 'sanctions.proposer', autorises: ['cpe', 'direction', 'administrateur'] },
  { code: 'sanctions.prononcer', autorises: ['direction', 'administrateur'] },
  { code: 'appreciationMatiere.saisir', autorises: ['professeur', 'direction', 'administrateur'] },
  { code: 'appreciationGenerale.saisir', autorises: ['direction', 'administrateur'] },
  { code: 'appreciationVs.saisir', autorises: ['cpe', 'direction', 'administrateur'] },
  { code: 'mentions.attribuer', autorises: ['direction', 'administrateur'] },
  { code: 'comptes.creer', autorises: ['direction', 'administrateur'] },
  { code: 'comptes.desactiver', autorises: ['direction', 'administrateur'] },
  { code: 'comptes.modifierPersonnel', autorises: ['administrateur'] },
  { code: 'comptes.changerRole', autorises: ['administrateur'] },
  { code: 'comptes.usurper', autorises: ['administrateur'] },
  { code: 'journalNotes.consulter', autorises: ['direction', 'administrateur'] },
  { code: 'audit.consulter', autorises: ['direction', 'administrateur'] },
  { code: 'droits.gerer', autorises: ['administrateur'] },
  { code: 'backoffice.acceder', autorises: ['administrateur'] },
];

describe.each(REGLES)('regle $code', ({ code, autorises }) => {
  it.each(ROLES)('%s', (role) => {
    const attendu = autorises.includes(role);
    expect(peut(sessionDe(role), code, CONTEXTE_COMPLET)).toBe(attendu);
  });
});

describe('le surveillant ne touche jamais aux notes', () => {
  const surveillant = sessionDe('surveillant');

  it('ne detient notes.voir dans aucune portee', () => {
    const decision = resoudreDroit('notes.voir', surveillant);
    expect(decision.accorde).toBe(false);
    expect(decision.portees).toEqual([]);
  });

  it('ne peut ni saisir, ni publier, ni voir la moyenne du groupe', () => {
    expect(peut(surveillant, 'notes.saisir', CONTEXTE_COMPLET)).toBe(false);
    expect(peut(surveillant, 'notes.publier', CONTEXTE_COMPLET)).toBe(false);
    expect(peut(surveillant, 'moyennes.voirGroupe', CONTEXTE_COMPLET)).toBe(false);
  });
});

describe('portees', () => {
  it('limite le professeur a ses services', () => {
    const prof = sessionDe('professeur', { serviceIds: ['s1'] });
    expect(peut(prof, 'notes.voir', { serviceId: 's1' })).toBe(true);
    expect(peut(prof, 'notes.voir', { serviceId: 's2' })).toBe(false);
  });

  it('limite l eleve a lui-meme', () => {
    const eleve = sessionDe('eleve');
    expect(peut(eleve, 'notes.voir', { eleveId: 'u1' })).toBe(true);
    expect(peut(eleve, 'notes.voir', { eleveId: 'u2' })).toBe(false);
  });

  it('refuse quand le contexte ne permet pas de conclure', () => {
    const prof = sessionDe('professeur');
    const verdict = peutAvecRaison(prof, 'notes.voir', {});
    expect(verdict.accorde).toBe(false);
    expect(verdict.raison).toBe('porteeInsuffisante');
  });

  it('laisse passer la direction sur tout l etablissement', () => {
    expect(peut(sessionDe('direction'), 'notes.voir', { serviceId: 'inconnu' })).toBe(true);
  });
});

describe('professeur principal', () => {
  it('gagne notes.voir sur son groupe sans perdre ses services', () => {
    const pp = sessionDe('professeur', { estProfesseurPrincipal: true, groupeIds: ['g1'] });
    expect(peut(pp, 'notes.voir', { groupeId: 'g1' })).toBe(true);
    expect(peut(pp, 'notes.voir', { serviceId: 's1' })).toBe(true);
    expect(peut(pp, 'notes.voir', { groupeId: 'g9' })).toBe(false);
  });

  it('gagne l appreciation generale et la preparation du conseil, sur ses groupes seulement', () => {
    const pp = sessionDe('professeur', { estProfesseurPrincipal: true });
    expect(peut(pp, 'appreciationGenerale.saisir', { groupeId: 'g1' })).toBe(true);
    expect(peut(pp, 'conseil.preparer', { groupeId: 'g1' })).toBe(true);
    expect(peut(pp, 'appreciationGenerale.saisir', { groupeId: 'g9' })).toBe(false);
  });

  it('ne change rien pour un professeur qui ne l est pas', () => {
    const prof = sessionDe('professeur');
    expect(peut(prof, 'appreciationGenerale.saisir', CONTEXTE_COMPLET)).toBe(false);
  });
});

import 'server-only';

import { exigerPermission } from '@/auth/peut';
import { attribuer, classerEvenement, type EtatNote } from '@/domain/journal';
import type { StatutNote } from '@/domain/types';
import { firestore } from '@/firebase/admin';
import {
  evaluations,
  identifiantNote,
  journalModifications,
  notes,
} from '@/firebase/collections';
import { elevesDuGroupe } from './groupes';
import { exigerSession } from './session';

export type LigneDeSaisie = {
  readonly eleveId: string;
  readonly prenom: string;
  readonly nom: string;
  readonly valeurCentiemes: number | null;
  readonly statut: StatutNote;
  readonly commentaire: string;
  readonly priseEnCompte: boolean;
};

export type FeuilleDeSaisie = {
  readonly evaluationId: string;
  readonly titre: string;
  readonly baremeCentiemes: number;
  readonly publiee: boolean;
  readonly serviceId: string;
  readonly lignes: readonly LigneDeSaisie[];
};

const LIGNE_VIDE = {
  valeurCentiemes: null,
  statut: 'nonNotee' as const,
  commentaire: '',
  priseEnCompte: true,
};

// La feuille porte TOUS les élèves du groupe, même ceux sans note : c'est une feuille de
// saisie, pas un relevé. Un élève qui n'y figurerait pas serait un élève qu'on oublie de noter.
export async function feuilleDeSaisie(evaluationId: string): Promise<FeuilleDeSaisie | null> {
  const document = await evaluations().doc(evaluationId).get();
  const evaluationDonnees = document.data();
  if (evaluationDonnees === undefined) return null;

  const session = await exigerSession();
  exigerPermission(session, 'notes.saisir', { serviceId: evaluationDonnees.serviceId });

  const [eleves, saisies] = await Promise.all([
    elevesDuGroupe(evaluationDonnees.groupeId),
    notes().where('evaluationId', '==', evaluationId).get(),
  ]);

  const parEleve = new Map(saisies.docs.map((note) => [note.data().eleveId, note.data()]));

  return {
    evaluationId,
    titre: evaluationDonnees.titre,
    baremeCentiemes: evaluationDonnees.baremeCentiemes,
    publiee: evaluationDonnees.publiee,
    serviceId: evaluationDonnees.serviceId,
    lignes: eleves.map((eleve) => {
      const existante = parEleve.get(eleve.uid);
      return {
        eleveId: eleve.uid,
        prenom: eleve.prenom,
        nom: eleve.nom,
        valeurCentiemes: existante?.valeurCentiemes ?? LIGNE_VIDE.valeurCentiemes,
        statut: existante?.statut ?? LIGNE_VIDE.statut,
        commentaire: existante?.commentaire ?? LIGNE_VIDE.commentaire,
        priseEnCompte: existante?.priseEnCompte ?? LIGNE_VIDE.priseEnCompte,
      };
    }),
  };
}

export type SaisieDeNote = {
  readonly eleveId: string;
  readonly valeurCentiemes: number | null;
  readonly statut: StatutNote;
  readonly commentaire: string;
  readonly priseEnCompte: boolean;
};

function etat(saisie: SaisieDeNote | undefined, coefficient: number): EtatNote | null {
  if (saisie === undefined) return null;
  return {
    valeurCentiemes: saisie.valeurCentiemes,
    statut: saisie.statut,
    commentaire: saisie.commentaire,
    coefficient,
    priseEnCompte: saisie.priseEnCompte,
  };
}

export async function enregistrerNotes(
  evaluationId: string,
  saisies: readonly SaisieDeNote[],
): Promise<void> {
  const document = await evaluations().doc(evaluationId).get();
  const evaluationDonnees = document.data();
  if (evaluationDonnees === undefined) throw new Error('Évaluation introuvable.');

  const session = await exigerSession();
  exigerPermission(session, 'notes.saisir', { serviceId: evaluationDonnees.serviceId });

  const eleves = await elevesDuGroupe(evaluationDonnees.groupeId);
  const parUid = new Map(eleves.map((eleve) => [eleve.uid, eleve]));

  const existantes = await notes().where('evaluationId', '==', evaluationId).get();
  const avantParEleve = new Map(existantes.docs.map((note) => [note.data().eleveId, note.data()]));

  const acteur = attribuer({
    utilisateurId: session.utilisateurId,
    adminReelId: session.adminReelId,
  });
  const maintenant = new Date().toISOString();
  const lot = firestore().batch();

  for (const saisie of saisies) {
    const eleve = parUid.get(saisie.eleveId);
    // Un identifiant d'élève venu du client ne vaut rien tant qu'il n'appartient pas au
    // groupe de l'évaluation (7.3).
    if (eleve === undefined) continue;

    if (saisie.valeurCentiemes !== null) {
      if (saisie.valeurCentiemes < 0 || saisie.valeurCentiemes > evaluationDonnees.baremeCentiemes) {
        throw new Error(`Note hors barème pour ${eleve.prenom} ${eleve.nom}.`);
      }
    }

    const avant = avantParEleve.get(saisie.eleveId);
    const evenement = classerEvenement(
      etat(avant, evaluationDonnees.coefficient),
      etat(saisie, evaluationDonnees.coefficient),
    );
    if (evenement === null) continue;

    lot.set(notes().doc(identifiantNote(evaluationId, saisie.eleveId)), {
      evaluationId,
      eleveId: saisie.eleveId,
      valeurCentiemes: saisie.valeurCentiemes,
      statut: saisie.statut,
      commentaire: saisie.commentaire,
      priseEnCompte: saisie.priseEnCompte,
      eleveNom: `${eleve.prenom} ${eleve.nom}`.trim(),
      groupeId: evaluationDonnees.groupeId,
      serviceId: evaluationDonnees.serviceId,
      periodeId: evaluationDonnees.periodeId,
    });

    // Le journal est silencieux : aucune notification, aucun badge, personne n'est prévenu.
    // On enregistre, et on regarde a la fin (4.6). Une première saisie n'est PAS une
    // modification : un professeur qui remplit son carnet ne doit pas apparaître dans les
    // statistiques de correction.
    lot.set(journalModifications().doc(), {
      acteurId: acteur.acteurId,
      acteurUsurpeId: acteur.acteurUsurpeId,
      evenement,
      entite: 'note',
      entiteId: identifiantNote(evaluationId, saisie.eleveId),
      eleveId: saisie.eleveId,
      evaluationId,
      valeurAvant: avant?.valeurCentiemes ?? null,
      valeurApres: saisie.valeurCentiemes,
      statutAvant: avant?.statut ?? null,
      statutApres: saisie.statut,
      date: maintenant,
    });
  }

  await lot.commit();
}

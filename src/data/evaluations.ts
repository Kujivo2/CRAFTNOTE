import 'server-only';

import { exigerPermission } from '@/auth/peut';
import { evaluations, services } from '@/firebase/collections';
import type { TYPES_EVALUATION } from '@/firebase/schemas';
import { periodeCourante } from './services';
import { exigerSession } from './session';

export type TypeEvaluation = (typeof TYPES_EVALUATION)[number];

export type EvaluationEnBref = {
  readonly id: string;
  readonly titre: string;
  readonly date: string;
  readonly baremeCentiemes: number;
  readonly coefficient: number;
  readonly type: TypeEvaluation;
  readonly publiee: boolean;
  readonly serviceId: string;
  readonly groupeId: string;
  readonly matiereNom: string;
};

function enBref(identifiant: string, donnees: Omit<EvaluationEnBref, 'id'>): EvaluationEnBref {
  return { id: identifiant, ...donnees };
}

export async function evaluationsDuService(
  serviceId: string,
): Promise<readonly EvaluationEnBref[]> {
  const session = await exigerSession();
  exigerPermission(session, 'notes.voir', { serviceId });

  const trouvees = await evaluations()
    .where('serviceId', '==', serviceId)
    .orderBy('date', 'desc')
    .get();

  return trouvees.docs.map((document) => enBref(document.id, document.data()));
}

export async function evaluation(identifiant: string): Promise<EvaluationEnBref | null> {
  const document = await evaluations().doc(identifiant).get();
  const donnees = document.data();
  if (donnees === undefined) return null;

  const session = await exigerSession();
  // La portée est confrontée au service de l'évaluation, pas à celui que l'URL prétend.
  exigerPermission(session, 'notes.voir', { serviceId: donnees.serviceId });

  return enBref(document.id, donnees);
}

export type NouvelleEvaluation = {
  readonly serviceId: string;
  readonly titre: string;
  readonly date: string;
  readonly baremeCentiemes: number;
  readonly coefficient: number;
  readonly type: TypeEvaluation;
  readonly facultative: boolean;
};

export async function creerEvaluation(saisie: NouvelleEvaluation): Promise<string> {
  const session = await exigerSession();
  exigerPermission(session, 'evaluations.creer', { serviceId: saisie.serviceId });

  const document = await services().doc(saisie.serviceId).get();
  const leService = document.data();
  if (leService === undefined) throw new Error('Service introuvable.');

  const periodeId = await periodeCourante();
  const creee = evaluations().doc();

  await creee.set({
    serviceId: saisie.serviceId,
    periodeId,
    titre: saisie.titre,
    date: saisie.date,
    baremeCentiemes: saisie.baremeCentiemes,
    coefficient: saisie.coefficient,
    type: saisie.type,
    // Rien n'est visible de l'élève avant la publication (3).
    publiee: false,
    facultative: saisie.facultative,
    commentaireGeneral: '',
    creeeLe: new Date().toISOString(),
    groupeId: leService.groupeId,
    matiereNom: leService.matiereNom,
  });

  return creee.id;
}

export async function publierEvaluation(identifiant: string, publiee: boolean): Promise<void> {
  const document = await evaluations().doc(identifiant).get();
  const donnees = document.data();
  if (donnees === undefined) throw new Error('Évaluation introuvable.');

  const session = await exigerSession();
  exigerPermission(session, 'notes.publier', { serviceId: donnees.serviceId });

  // Aucun verrouillage (4.6) : publier n'empêche pas de corriger ensuite, et dépublier est
  // permis. Ce qui compte est tracé par le journal, pas interdit.
  await evaluations().doc(identifiant).update({ publiee });
}

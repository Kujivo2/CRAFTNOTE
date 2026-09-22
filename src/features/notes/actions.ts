'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { creerEvaluation, publierEvaluation } from '@/data/evaluations';
import { enregistrerNotes } from '@/data/notes';
import { STATUTS_NOTE, TYPES_EVALUATION } from '@/firebase/schemas';

// Chaque Server Action valide avec Zod ET revérifie la permission (7.3). La revérification vit
// dans `data/`, pas ici : cette couche ne juge que la forme de ce qui arrive.

export type Resultat = { readonly erreur: string | null };

function echec(cause: unknown): Resultat {
  return { erreur: cause instanceof Error ? cause.message : 'Opération impossible.' };
}

const schemaNouvelle = z.object({
  serviceId: z.string().min(1),
  titre: z.string().trim().min(1).max(120),
  // Aucune validation n'interdit une date antérieure à aujourd'hui (1) : la saison a commencé
  // et tout se saisit rétroactivement.
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  baremeCentiemes: z.number().int().positive(),
  coefficient: z.number().positive(),
  type: z.enum(TYPES_EVALUATION),
  facultative: z.boolean(),
});

export async function creerUneEvaluation(
  donnees: unknown,
): Promise<Resultat & { readonly id?: string }> {
  const lecture = schemaNouvelle.safeParse(donnees);
  if (!lecture.success) return { erreur: 'Évaluation invalide.' };

  try {
    const id = await creerEvaluation(lecture.data);
    revalidatePath(`/notes/${lecture.data.serviceId}`);
    return { erreur: null, id };
  } catch (cause) {
    return echec(cause);
  }
}

const schemaSaisie = z.object({
  evaluationId: z.string().min(1),
  saisies: z
    .array(
      z.object({
        eleveId: z.string().min(1),
        valeurCentiemes: z.number().int().nonnegative().nullable(),
        statut: z.enum(STATUTS_NOTE),
        commentaire: z.string().max(500),
        priseEnCompte: z.boolean(),
      }),
    )
    .max(60),
});

export async function enregistrerLaSaisie(donnees: unknown): Promise<Resultat> {
  const lecture = schemaSaisie.safeParse(donnees);
  if (!lecture.success) return { erreur: 'Saisie invalide.' };

  try {
    await enregistrerNotes(lecture.data.evaluationId, lecture.data.saisies);
    revalidatePath('/notes', 'layout');
    return { erreur: null };
  } catch (cause) {
    return echec(cause);
  }
}

const schemaPublication = z.object({
  evaluationId: z.string().min(1),
  publiee: z.boolean(),
});

export async function basculerPublication(donnees: unknown): Promise<Resultat> {
  const lecture = schemaPublication.safeParse(donnees);
  if (!lecture.success) return { erreur: 'Demande invalide.' };

  try {
    await publierEvaluation(lecture.data.evaluationId, lecture.data.publiee);
    revalidatePath('/notes', 'layout');
    return { erreur: null };
  } catch (cause) {
    return echec(cause);
  }
}

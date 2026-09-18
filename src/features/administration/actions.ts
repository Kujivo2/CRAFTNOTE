'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { CATALOGUE } from '@/auth/catalogue';
import { PORTEES } from '@/firebase/schemas';
import { type Changement, enregistrerDroitsDuRole } from '@/data/droits';
import type { CodeRole } from '@/auth/matrice-defaut';

// Chaque Server Action valide avec Zod ET revérifie la permission (7.3). La revérification est
// dans `data/`, pas ici : cette couche ne fait que valider la forme de ce qui arrive.

const CODES = CATALOGUE.map((permission) => permission.code);

const schemaChangements = z.object({
  roleId: z.enum(['eleve', 'professeur', 'surveillant', 'cpe', 'direction', 'administrateur']),
  changements: z
    .array(
      z.object({
        code: z.enum(CODES as [string, ...string[]]),
        portee: z.enum(PORTEES).nullable(),
      }),
    )
    .max(CATALOGUE.length),
});

export type ResultatEnregistrement = { readonly erreur: string | null };

export async function enregistrerDroits(donnees: unknown): Promise<ResultatEnregistrement> {
  const lecture = schemaChangements.safeParse(donnees);
  if (!lecture.success) return { erreur: 'Modification invalide.' };

  try {
    await enregistrerDroitsDuRole(
      lecture.data.roleId as CodeRole,
      lecture.data.changements as readonly Changement[],
    );
  } catch (cause) {
    // Les garde-fous nomment leur raison : on la montre plutôt qu'un refus muet.
    return { erreur: cause instanceof Error ? cause.message : 'Enregistrement impossible.' };
  }

  // Une modification de droits prend effet immédiatement : les pages qui lisent la session
  // doivent être recalculées.
  revalidatePath('/', 'layout');
  return { erreur: null };
}

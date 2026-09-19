import 'server-only';

import { groupes } from '@/firebase/collections';

// Les codes lisibles des groupes rattachés à la session. « Groupe 4 » dit quelque chose,
// « 1 groupe » ne dit rien.
//
// Pas de contrôle de permission : on ne lit ici que les groupes que la session porte déjà,
// c'est-à-dire ceux que le serveur a lui-même résolus à l'ouverture.
export async function codesDesGroupes(
  identifiants: readonly string[],
): Promise<readonly string[]> {
  if (identifiants.length === 0) return [];

  const documents = await Promise.all(
    identifiants.map(async (identifiant) => groupes().doc(identifiant).get()),
  );

  return documents
    .map((document) => document.data()?.code)
    .filter((code): code is string => code !== undefined);
}

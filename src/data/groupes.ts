import 'server-only';

import { groupes, profilsEleves, utilisateurs } from '@/firebase/collections';

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

export type MembreDuGroupe = {
  readonly uid: string;
  readonly prenom: string;
  readonly nom: string;
  readonly estDelegue: boolean;
};

// Les élèves d'un groupe, triés par nom. Partagé par le trombinoscope, la saisie de notes et
// l'appel : une seule requête, un seul tri, pour que trois écrans ne divergent pas sur l'ordre.
//
// Pas de contrôle ici : l'appelant a déjà vérifié la portée sur le groupe. Aucune fonction de
// `data/` exportée ne prend ce raccourci, seules celles-ci qui servent d'assise.
export async function elevesDuGroupe(identifiant: string): Promise<readonly MembreDuGroupe[]> {
  const profils = await profilsEleves().where('groupeId', '==', identifiant).get();
  if (profils.empty) return [];

  // Un groupe fait quatre documents : on les charge et on trie en mémoire (6.2).
  const comptes = await Promise.all(
    profils.docs.map(async (profil) => ({
      uid: profil.id,
      estDelegue: profil.data().estDelegue,
      compte: (await utilisateurs().doc(profil.id).get()).data(),
    })),
  );

  return comptes
    .filter((entree) => entree.compte !== undefined)
    .map((entree) => ({
      uid: entree.uid,
      prenom: entree.compte?.prenom ?? '',
      nom: entree.compte?.nom ?? '',
      estDelegue: entree.estDelegue,
    }))
    .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}

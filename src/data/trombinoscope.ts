import 'server-only';

import { exigerPermission, peut } from '@/auth/peut';
import { groupes, niveaux, profilsEleves, services } from '@/firebase/collections';
import { elevesDuGroupe, type MembreDuGroupe } from './groupes';
import { exigerSession } from './session';

// Une fonction = une requête + son contrôle d'accès (7.3).
//
// La portée fait tout le travail ici : un élève détient `trombinoscope.voir` en portée
// « son groupe », un membre du personnel en portée « établissement ». Le même appel rend donc
// un groupe à l'un et les neuf à l'autre, sans que l'écran ait à le savoir.

export type { MembreDuGroupe };

export type IntervenantDuGroupe = {
  readonly serviceId: string;
  readonly professeurId: string;
  readonly professeurNom: string;
  readonly matiereNom: string;
  readonly estProfesseurPrincipal: boolean;
};

export type GroupeEnBref = {
  readonly id: string;
  readonly code: string;
  readonly effectif: number;
};

export type Trombinoscope = {
  readonly id: string;
  readonly code: string;
  readonly niveau: string | null;
  readonly eleves: readonly MembreDuGroupe[];
  readonly equipe: readonly IntervenantDuGroupe[];
};

async function equipeDuGroupe(
  identifiant: string,
  professeurPrincipalId: string | null,
): Promise<readonly IntervenantDuGroupe[]> {
  const inscrits = await services().where('groupeId', '==', identifiant).get();

  return inscrits.docs
    .map((service) => {
      const donnees = service.data();
      return {
        serviceId: service.id,
        professeurId: donnees.professeurId,
        // Champs dénormalisés (6.2) : sans eux, chaque ligne coûterait deux lectures de plus.
        professeurNom: donnees.professeurNom,
        matiereNom: donnees.matiereNom,
        estProfesseurPrincipal: donnees.professeurId === professeurPrincipalId,
      };
    })
    .sort((a, b) => a.matiereNom.localeCompare(b.matiereNom, 'fr'));
}

export async function trombinoscopeDuGroupe(identifiant: string): Promise<Trombinoscope | null> {
  const session = await exigerSession();
  // La portée est vérifiée ici, pas à l'écran : un identifiant de groupe reçu de l'URL ne vaut
  // rien tant qu'il n'a pas été confronté à ce que la session porte réellement.
  exigerPermission(session, 'trombinoscope.voir', { groupeId: identifiant });

  const document = await groupes().doc(identifiant).get();
  const groupe = document.data();
  if (groupe === undefined) return null;

  const [eleves, equipe, niveau] = await Promise.all([
    elevesDuGroupe(identifiant),
    equipeDuGroupe(identifiant, groupe.profPrincipalId),
    niveaux().doc(groupe.niveauId).get(),
  ]);

  return {
    id: identifiant,
    code: groupe.code,
    niveau: niveau.data()?.libelle ?? null,
    eleves,
    equipe,
  };
}

// Les groupes que la session a le droit de consulter. Un élève n'en voit qu'un, le sien.
export async function groupesVisibles(): Promise<readonly GroupeEnBref[]> {
  const session = await exigerSession();

  const tous = await groupes().get();
  const autorises = tous.docs.filter((document) =>
    peut(session, 'trombinoscope.voir', { groupeId: document.id }),
  );

  const avecEffectif = await Promise.all(
    autorises.map(async (document) => {
      const profils = await profilsEleves().where('groupeId', '==', document.id).count().get();
      return {
        id: document.id,
        code: document.data().code,
        effectif: profils.data().count,
      };
    }),
  );

  return avecEffectif.sort((a, b) => a.code.localeCompare(b.code, 'fr', { numeric: true }));
}

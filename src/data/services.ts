import 'server-only';

import { peut } from '@/auth/peut';
import { periodes, services } from '@/firebase/collections';
import { exigerSession } from './session';

export type ServiceEnBref = {
  readonly id: string;
  readonly groupeId: string;
  readonly groupeCode: string;
  readonly matiereNom: string;
  readonly professeurNom: string;
};

// Les services sur lesquels la session peut créer une évaluation et saisir. Un professeur y
// trouve les siens ; la direction, tous. C'est la portée qui tranche, pas le rôle.
export async function servicesOuJeSaisis(): Promise<readonly ServiceEnBref[]> {
  const session = await exigerSession();

  const tous = await services().get();
  return tous.docs
    .filter((document) => peut(session, 'notes.saisir', { serviceId: document.id }))
    .map((document) => {
      const donnees = document.data();
      return {
        id: document.id,
        groupeId: donnees.groupeId,
        groupeCode: donnees.groupeCode,
        matiereNom: donnees.matiereNom,
        professeurNom: donnees.professeurNom,
      };
    })
    .sort(
      (a, b) =>
        a.groupeCode.localeCompare(b.groupeCode, 'fr', { numeric: true }) ||
        a.matiereNom.localeCompare(b.matiereNom, 'fr'),
    );
}

export async function service(identifiant: string): Promise<ServiceEnBref | null> {
  const document = await services().doc(identifiant).get();
  const donnees = document.data();
  if (donnees === undefined) return null;

  return {
    id: document.id,
    groupeId: donnees.groupeId,
    groupeCode: donnees.groupeCode,
    matiereNom: donnees.matiereNom,
    professeurNom: donnees.professeurNom,
  };
}

// Une seule période cette saison (1). On la lit plutôt que de l'écrire en dur : le jour où il
// y en a deux, rien ne casse silencieusement.
export async function periodeCourante(): Promise<string> {
  const toutes = await periodes().orderBy('ordre').limit(1).get();
  const premiere = toutes.docs[0];
  if (premiere === undefined) {
    throw new Error('Aucune période définie : le référentiel est incomplet.');
  }
  return premiere.id;
}

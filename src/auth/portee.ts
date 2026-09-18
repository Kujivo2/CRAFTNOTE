// Portees (2). Chaque droit accorde en porte une : « voir les notes » ne veut pas dire la meme
// chose pour un prof et pour le proviseur.
//
// Les portees ne forment pas une echelle du plus petit au plus grand : `soi` parle de l'usager,
// `sesServices` de ses cours, `sonGroupe` de son groupe. On ne les compare donc pas entre elles,
// on les evalue contre un contexte fourni par le serveur.

export type Portee = 'soi' | 'sesServices' | 'sonGroupe' | 'etablissement';

export const PORTEES: readonly Portee[] = ['soi', 'sesServices', 'sonGroupe', 'etablissement'];

// Ce sur quoi porte la demande. Chaque champ est resolu cote serveur, dans `data/` :
// un identifiant venu du client n'entre jamais ici sans avoir ete relu en base.
export type Contexte = {
  readonly eleveId?: string;
  readonly serviceId?: string;
  readonly groupeId?: string;
};

// Qui demande, et ce qui lui est rattache.
export type Sujet = {
  readonly utilisateurId: string;
  readonly serviceIds: readonly string[];
  // Le groupe de l'eleve, ou les groupes dont on est professeur principal.
  readonly groupeIds: readonly string[];
};

// Un contexte incomplet ne permet pas de conclure : on refuse plutot que de deviner. C'est le
// sens de « la portee est verifiee cote serveur a chaque requete » — si l'appelant n'a pas
// fourni de quoi trancher, la reponse est non.
export function porteeSatisfaite(portee: Portee, sujet: Sujet, contexte: Contexte): boolean {
  switch (portee) {
    case 'etablissement':
      return true;
    case 'sonGroupe':
      return contexte.groupeId !== undefined && sujet.groupeIds.includes(contexte.groupeId);
    case 'sesServices':
      return contexte.serviceId !== undefined && sujet.serviceIds.includes(contexte.serviceId);
    case 'soi':
      return contexte.eleveId !== undefined && contexte.eleveId === sujet.utilisateurId;
  }
}

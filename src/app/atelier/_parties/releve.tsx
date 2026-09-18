// Un vrai relevé, calculé par le domaine et mis en forme par lib/formatage. Ce n'est pas une
// maquette : les moyennes sortent de `moyenneMatiere`, avec un groupe de quatre élèves, un
// absent et un dispensé, pour vérifier à l'œil ce que les tests vérifient au vert.

import { type NoteCalculable, moyenneMatiere } from '@/domain/moyennes';
import { OPTIONS_PAR_DEFAUT, type StatutNote } from '@/domain/types';
import { moyenneFr, noteFr } from '@/lib/formatage';
import { Pastille } from '@/ui/pastille';
import { EnteteTableau, Ligne, Tableau, Td, Th, ThLigne } from '@/ui/tableau';

function note(valeurSur20: number | null, statut: StatutNote = 'notee'): NoteCalculable {
  return {
    valeurCentiemes: valeurSur20 === null ? null : Math.round(valeurSur20 * 100),
    baremeCentiemes: 2000,
    coefficient: 1,
    statut,
    priseEnCompte: true,
  };
}

const GROUPE = [
  { nom: 'Bernard, Hugo', notes: [note(14.5), note(12)] },
  { nom: 'Martin, Léa', notes: [note(19), note(17.5)] },
  { nom: 'Moreau, Ana', notes: [note(null, 'absent'), note(13)] },
  { nom: 'Tissot, Noé', notes: [note(12), note(null, 'dispense')] },
] as const;

const STATUTS: Readonly<Record<StatutNote, { ton: 'neutre' | 'accent' | 'alerte' | 'sourd'; mot: string }>> = {
  notee: { ton: 'neutre', mot: 'notée' },
  absent: { ton: 'alerte', mot: 'absente' },
  dispense: { ton: 'sourd', mot: 'dispensé' },
  nonRendu: { ton: 'alerte', mot: 'non rendu' },
  nonNotee: { ton: 'sourd', mot: 'non notée' },
};

export function Releve() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-18">Relevé, groupe de quatre</h2>
        <p className="text-13 text-texte-2">
          Sport, devoir surveillé du 25 septembre, sur 20, coefficient 1. Les moyennes sont
          calculées par le domaine, pas écrites à la main.
        </p>
      </div>

      <Tableau legende="Notes du groupe et moyenne de chaque élève">
        <EnteteTableau>
          <Th>Élève</Th>
          <Th aDroite>Devoir 1</Th>
          <Th aDroite>Devoir 2</Th>
          <Th>Statut du devoir 2</Th>
          <Th aDroite>Moyenne</Th>
        </EnteteTableau>

        <tbody>
          {GROUPE.map((eleve) => {
            const [premier, second] = eleve.notes;
            const statut = STATUTS[second.statut];

            return (
              <Ligne key={eleve.nom}>
                <ThLigne>{eleve.nom}</ThLigne>
                <Td numerique>{noteFr(premier.valeurCentiemes)}</Td>
                <Td numerique>{noteFr(second.valeurCentiemes)}</Td>
                <Td>
                  <Pastille ton={statut.ton}>{statut.mot}</Pastille>
                </Td>
                <Td numerique>{moyenneFr(moyenneMatiere([...eleve.notes], OPTIONS_PAR_DEFAUT))}</Td>
              </Ligne>
            );
          })}
        </tbody>
      </Tableau>

      <p className="text-13 text-texte-2">
        Ana est absente au premier devoir : par défaut l’absence ne compte pas, sa moyenne est
        donc celle du seul devoir rendu. Noé est dispensé au second : même règle. Aucun des deux
        n’a zéro. La moyenne du groupe n’est pas affichée — avec quatre élèves, elle désigne des
        personnes.
      </p>
    </section>
  );
}

import type { Releve } from '@/data/releve';
import type { StatutNote } from '@/domain/types';
import { dateCourteFr, moyenneFr, noteFr } from '@/lib/formatage';
import { EnteteTableau, Ligne, Tableau, Td, Th, ThLigne } from '@/ui/tableau';

const LIBELLES: Readonly<Record<StatutNote, string>> = {
  notee: '',
  absent: 'absent',
  dispense: 'dispensé',
  nonRendu: 'non rendu',
  nonNotee: 'non notée',
};

export function ReleveEleve({ releve }: { releve: Releve }) {
  if (releve.matieres.length === 0) {
    return (
      <p className="text-14 text-texte-2">
        Aucune note publiée pour l’instant. Rien n’est visible avant qu’un professeur publie.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {releve.matieres.map((matiere) => (
        <section key={matiere.matiereNom} className="flex flex-col gap-2">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-18">{matiere.matiereNom}</h2>
            <p className="chiffres text-14">
              <span className="text-texte-2">Moyenne </span>
              {moyenneFr(matiere.moyenne)}
            </p>
          </div>

          <Tableau legende={`Notes en ${matiere.matiereNom}`}>
            <EnteteTableau>
              <Th>Évaluation</Th>
              <Th>Date</Th>
              <Th aDroite>Note</Th>
              <Th aDroite>Barème</Th>
            </EnteteTableau>
            <tbody>
              {matiere.lignes.map((ligne) => (
                <Ligne key={ligne.evaluationId}>
                  <ThLigne>{ligne.titre}</ThLigne>
                  <Td>{dateCourteFr(new Date(`${ligne.date}T12:00:00Z`))}</Td>
                  <Td numerique>
                    {ligne.statut === 'notee'
                      ? noteFr(ligne.valeurCentiemes)
                      : LIBELLES[ligne.statut]}
                  </Td>
                  <Td numerique>{noteFr(ligne.baremeCentiemes)}</Td>
                </Ligne>
              ))}
            </tbody>
          </Tableau>
        </section>
      ))}

      <section className="flex flex-wrap items-baseline justify-between gap-2 border-t border-filet pt-4">
        <h2 className="text-18">Moyenne générale</h2>
        {/* Une matière sans moyenne sort du calcul : elle n'y vaut pas zéro (4.1). */}
        <p className="chiffres text-22">{moyenneFr(releve.generale)}</p>
      </section>
    </div>
  );
}

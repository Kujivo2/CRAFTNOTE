import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { evaluationsDuService } from '@/data/evaluations';
import { service } from '@/data/services';
import { sessionActive } from '@/data/session';
import { FormulaireEvaluation } from '@/features/notes/formulaire-evaluation';
import { dateCourteFr, noteFr } from '@/lib/formatage';
import { Pastille } from '@/ui/pastille';
import { EnteteTableau, Ligne, Tableau, Td, Th, ThLigne } from '@/ui/tableau';

export const metadata = { title: 'Évaluations' };

export default async function PageService({ params }: { params: Promise<{ service: string }> }) {
  const session = await sessionActive();
  if (session === null) redirect('/connexion');

  const { service: serviceId } = await params;
  const leService = await service(serviceId);
  if (leService === null) notFound();

  // La portée est vérifiée dans `data/`, qui lèvera si le service n'est pas le sien.
  const evaluations = await evaluationsDuService(serviceId);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2 border-b border-filet pb-4">
        <Link href="/notes" className="text-13 text-texte-2 underline underline-offset-4">
          Tous mes services
        </Link>
        <h1 className="text-22">
          {leService.matiereNom} · {leService.groupeCode}
        </h1>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-18">Évaluations</h2>

        {evaluations.length === 0 ? (
          <p className="text-14 text-texte-2">
            Aucune évaluation. Créez la première ci-dessous ; elle pourra porter une date passée.
          </p>
        ) : (
          <Tableau legende={`Évaluations de ${leService.matiereNom} en ${leService.groupeCode}`}>
            <EnteteTableau>
              <Th>Titre</Th>
              <Th>Date</Th>
              <Th aDroite>Barème</Th>
              <Th>État</Th>
            </EnteteTableau>
            <tbody>
              {evaluations.map((evaluation) => (
                <Ligne key={evaluation.id}>
                  <ThLigne>
                    <Link
                      href={`/notes/${serviceId}/${evaluation.id}`}
                      className="underline underline-offset-4"
                    >
                      {evaluation.titre}
                    </Link>
                  </ThLigne>
                  <Td>{dateCourteFr(new Date(`${evaluation.date}T12:00:00Z`))}</Td>
                  <Td numerique>{noteFr(evaluation.baremeCentiemes)}</Td>
                  <Td>
                    {/* Rien n'est visible de l'élève avant la publication (3). */}
                    <Pastille ton={evaluation.publiee ? 'accent' : 'sourd'}>
                      {evaluation.publiee ? 'publiée' : 'non publiée'}
                    </Pastille>
                  </Td>
                </Ligne>
              ))}
            </tbody>
          </Tableau>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t border-filet pt-6">
        <h2 className="text-18">Nouvelle évaluation</h2>
        <FormulaireEvaluation serviceId={serviceId} />
      </section>
    </main>
  );
}

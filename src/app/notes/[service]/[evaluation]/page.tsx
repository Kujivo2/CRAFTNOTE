import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { peut } from '@/auth/peut';
import { evaluation } from '@/data/evaluations';
import { feuilleDeSaisie } from '@/data/notes';
import { sessionActive } from '@/data/session';
import { BoutonPublier } from '@/features/notes/bouton-publier';
import { SaisieNotes } from '@/features/notes/saisie-notes';
import { dateFr, noteFr } from '@/lib/formatage';
import { Pastille } from '@/ui/pastille';

export const metadata = { title: 'Saisie des notes' };

export default async function PageSaisie({
  params,
}: {
  params: Promise<{ service: string; evaluation: string }>;
}) {
  const session = await sessionActive();
  if (session === null) redirect('/connexion');

  const { service: serviceId, evaluation: evaluationId } = await params;
  const laEvaluation = await evaluation(evaluationId);
  if (laEvaluation === null) notFound();

  const feuille = await feuilleDeSaisie(evaluationId);
  if (feuille === null) notFound();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2 border-b border-filet pb-4">
        <Link href={`/notes/${serviceId}`} className="text-13 text-texte-2 underline underline-offset-4">
          Retour aux évaluations
        </Link>
        <h1 className="text-22">{laEvaluation.titre}</h1>
        <p className="text-13 text-texte-2">
          {laEvaluation.matiereNom} · {dateFr(new Date(`${laEvaluation.date}T12:00:00Z`))} · sur{' '}
          {noteFr(laEvaluation.baremeCentiemes)} · coefficient {laEvaluation.coefficient}
        </p>
        <Pastille ton={laEvaluation.publiee ? 'accent' : 'sourd'}>
          {laEvaluation.publiee
            ? 'Publiée : les élèves la voient'
            : 'Non publiée : aucun élève ne la voit'}
        </Pastille>
      </header>

      <SaisieNotes feuille={feuille} />

      {peut(session, 'notes.publier', { serviceId }) && (
        <section className="flex flex-col gap-3 border-t border-filet pt-6">
          <h2 className="text-18">Publication</h2>
          <p className="text-14 text-texte-2">
            Publier ne verrouille rien : une note reste corrigeable jusqu’au dernier jour, et
            chaque correction part au journal.
          </p>
          <BoutonPublier evaluationId={evaluationId} publiee={laEvaluation.publiee} />
        </section>
      )}
    </main>
  );
}

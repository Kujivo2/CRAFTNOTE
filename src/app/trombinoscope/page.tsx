import Link from 'next/link';
import { redirect } from 'next/navigation';

import { sessionActive } from '@/data/session';
import { groupesVisibles } from '@/data/trombinoscope';
import { compteFr } from '@/lib/formatage';
import { EnteteTableau, Ligne, Tableau, Td, Th, ThLigne } from '@/ui/tableau';

export const metadata = { title: 'Trombinoscope' };

export default async function PageTrombinoscope() {
  const session = await sessionActive();
  if (session === null) redirect('/connexion');

  const groupes = await groupesVisibles();

  // Un élève ne voit que son groupe : lui imposer une liste d'un seul élément lui coûterait
  // une interaction pour rien, alors que le §9 en accorde deux depuis l'accueil.
  if (groupes.length === 1 && groupes[0] !== undefined) {
    redirect(`/trombinoscope/${groupes[0].id}`);
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2 border-b border-filet pb-4">
        <Link href="/" className="text-13 text-texte-2 underline underline-offset-4">
          Retour à l’accueil
        </Link>
        <h1 className="text-22">Trombinoscope</h1>
      </header>

      {groupes.length === 0 ? (
        <p className="text-14 text-texte-2">Aucun groupe ne vous est accessible.</p>
      ) : (
        <Tableau legende="Groupes accessibles et leur effectif">
          <EnteteTableau>
            <Th>Groupe</Th>
            <Th aDroite>Élèves</Th>
          </EnteteTableau>
          <tbody>
            {groupes.map((groupe) => (
              <Ligne key={groupe.id}>
                <ThLigne>
                  <Link
                    href={`/trombinoscope/${groupe.id}`}
                    className="underline underline-offset-4"
                  >
                    {groupe.code}
                  </Link>
                </ThLigne>
                <Td numerique>{compteFr(groupe.effectif, 'élève', 'élèves')}</Td>
              </Ligne>
            ))}
          </tbody>
        </Tableau>
      )}
    </main>
  );
}

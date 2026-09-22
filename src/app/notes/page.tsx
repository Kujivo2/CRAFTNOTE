import Link from 'next/link';
import { redirect } from 'next/navigation';

import { releveDeLEleve } from '@/data/releve';
import { servicesOuJeSaisis } from '@/data/services';
import { sessionActive } from '@/data/session';
import { ReleveEleve } from '@/features/notes/releve-eleve';
import { EnteteTableau, Ligne, Tableau, Td, Th, ThLigne } from '@/ui/tableau';

export const metadata = { title: 'Notes' };

export default async function PageNotes() {
  const session = await sessionActive();
  if (session === null) redirect('/connexion');

  // Le meme chemin sert deux usages : un eleve y trouve son releve, un professeur ses
  // services. C'est le role qui tranche, pas deux adresses a retenir.
  const releve = session.roleCode === 'eleve' ? await releveDeLEleve(session.utilisateurId) : null;
  const services = session.roleCode === 'eleve' ? [] : await servicesOuJeSaisis();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2 border-b border-filet pb-4">
        <Link href="/" className="text-13 text-texte-2 underline underline-offset-4">
          Retour a l&rsquo;accueil
        </Link>
        <h1 className="text-22">{releve === null ? 'Notes' : 'Mes notes'}</h1>
      </header>

      {releve !== null && <ReleveEleve releve={releve} />}

      {releve === null &&
        (services.length === 0 ? (
          <p className="text-14 text-texte-2">Aucun service ne vous est rattache.</p>
        ) : (
          <Tableau legende="Services sur lesquels vous pouvez saisir des notes">
            <EnteteTableau>
              <Th>Groupe</Th>
              <Th>Matiere</Th>
            </EnteteTableau>
            <tbody>
              {services.map((service) => (
                <Ligne key={service.id}>
                  <ThLigne>
                    <Link href={`/notes/${service.id}`} className="underline underline-offset-4">
                      {service.groupeCode}
                    </Link>
                  </ThLigne>
                  <Td>{service.matiereNom}</Td>
                </Ligne>
              ))}
            </tbody>
          </Tableau>
        ))}
    </main>
  );
}

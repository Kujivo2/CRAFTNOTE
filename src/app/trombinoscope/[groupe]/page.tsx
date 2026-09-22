import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { sessionActive } from '@/data/session';
import { trombinoscopeDuGroupe } from '@/data/trombinoscope';
import { BoutonImprimer } from '@/features/trombinoscope/bouton-imprimer';
import { compteFr } from '@/lib/formatage';
import { Monogramme } from '@/ui/monogramme';
import { EnteteTableau, Ligne, Tableau, Td, Th, ThLigne } from '@/ui/tableau';

export const metadata = { title: 'Trombinoscope' };

export default async function PageGroupe({ params }: { params: Promise<{ groupe: string }> }) {
  const session = await sessionActive();
  if (session === null) redirect('/connexion');

  const { groupe: identifiant } = await params;
  const trombinoscope = await trombinoscopeDuGroupe(identifiant);
  if (trombinoscope === null) notFound();

  const { code, niveau, eleves, equipe } = trombinoscope;

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-filet pb-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/trombinoscope"
            className="impression-masquee text-13 text-texte-2 underline underline-offset-4"
          >
            Tous les groupes
          </Link>
          <h1 className="text-22">{code}</h1>
          <p className="text-13 text-texte-2">
            {niveau === null ? '' : `${niveau} · `}
            {compteFr(eleves.length, 'élève', 'élèves')}
          </p>
        </div>
        <div className="impression-masquee">
          <BoutonImprimer>Version imprimable</BoutonImprimer>
        </div>
      </header>

      {eleves.length === 0 ? (
        <p className="text-14 text-texte-2">
          Aucun élève rattaché à ce groupe. Le rattachement se fait dans `profilsEleves`.
        </p>
      ) : (
        <section className="flex flex-col gap-4">
          {/* Quatre visages tiennent sur un écran : ni pagination, ni filtre, ni recherche
              sur un ensemble de quatre (1). */}
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {eleves.map((eleve) => (
              <li key={eleve.uid} className="flex flex-col gap-2">
                {/* Portrait carré, jamais rond : c'est une photo d'identité scolaire. Le
                    monogramme sur fond encre remplace la photo absente, jamais une
                    silhouette grise (8.3). */}
                <Monogramme prenom={eleve.prenom} nom={eleve.nom} />
                <span className="text-14">
                  {eleve.prenom} {eleve.nom}
                </span>
                {eleve.estDelegue && (
                  <span className="text-12 text-texte-2">
                    {/* Un mot, pas une pastille de couleur à décoder. */}
                    Délégué
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-18">Équipe pédagogique</h2>

        {equipe.length === 0 ? (
          <p className="text-14 text-texte-2">Aucun service rattaché à ce groupe.</p>
        ) : (
          <Tableau legende={`Équipe pédagogique du ${code}`}>
            <EnteteTableau>
              <Th>Matière</Th>
              <Th>Intervenant</Th>
              <Th>Rôle</Th>
            </EnteteTableau>
            <tbody>
              {equipe.map((intervenant) => (
                <Ligne key={intervenant.serviceId}>
                  <ThLigne>{intervenant.matiereNom}</ThLigne>
                  <Td>{intervenant.professeurNom}</Td>
                  <Td>{intervenant.estProfesseurPrincipal ? 'Professeur principal' : ''}</Td>
                </Ligne>
              ))}
            </tbody>
          </Tableau>
        )}
      </section>
    </main>
  );
}

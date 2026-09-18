import Link from 'next/link';
import { redirect } from 'next/navigation';

import { peut } from '@/auth/peut';
import { tousLesDroits } from '@/data/droits';
import { sessionActive } from '@/data/session';
import { PanneauDroits } from '@/features/administration/panneau-droits';

export const metadata = { title: 'Panneau des droits' };

export default async function PageDroits() {
  const session = await sessionActive();
  if (session === null) redirect('/connexion');

  // Le contrôle qui compte est dans `data/`, qui lèvera de toute façon. Celui-ci évite
  // seulement d'afficher un écran vide à qui n'a rien à y faire.
  if (!peut(session, 'droits.gerer')) redirect('/');

  const droits = await tousLesDroits();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <header className="flex flex-col gap-2 border-b border-filet pb-4">
        <Link href="/" className="text-13 text-texte-2 underline underline-offset-4">
          Retour à l’accueil
        </Link>
        <h1 className="text-22">Panneau des droits</h1>
        <p className="text-14 text-texte-2">
          Ce que chaque rôle a le droit de faire est une donnée, pas une constante du code. Toute
          modification est enregistrée au journal d’audit.
        </p>
      </header>

      <PanneauDroits initial={droits} />
    </main>
  );
}

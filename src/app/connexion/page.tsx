import { redirect } from 'next/navigation';

import { sessionActive } from '@/data/session';
import { FormulaireConnexion } from '@/features/connexion/formulaire';

// Pas de landing page, pas de bannière cookies, pas de CGU (1) : l'application privée
// s'ouvre sur sa connexion, et rien d'autre.
export const metadata = { title: 'Connexion' };

export default async function PageConnexion() {
  if ((await sessionActive()) !== null) redirect('/');

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 py-8">
      <header className="flex flex-col gap-2 border-b border-filet pb-5">
        <h1 className="text-22">CRAFTNOTE</h1>
        <p className="text-14 text-texte-2">Lycée de Mantes-la-Jolie</p>
      </header>

      <FormulaireConnexion />

      {/* Le champ s'appelle « Identifiant » et cette valeur n'apparaît nulle part comme un
          moyen de contact (7.2). La réinitialisation par courriel est désactivée : c'est
          l'administrateur qui remet un mot de passe. */}
      <p className="text-13 text-texte-2">
        Mot de passe oublié : demandez sa réinitialisation à l’administrateur. Aucun courriel
        n’est envoyé par cette application.
      </p>
    </main>
  );
}

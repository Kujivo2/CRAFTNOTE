import Link from 'next/link';
import { redirect } from 'next/navigation';

import { peut } from '@/auth/peut';
import { codesDesGroupes } from '@/data/groupes';
import { sessionActive } from '@/data/session';
import { profilConnecte } from '@/data/utilisateurs';
import { MesDroits } from '@/features/accueil/mes-droits';
import { BoutonDeconnexion } from '@/features/connexion/bouton-deconnexion';
import { Pastille } from '@/ui/pastille';

// Accueil provisoire. Le §3 veut un tableau de bord différent par rôle, et différent selon
// qu'on soit ou non un soir de RP : il arrivera avec l'emploi du temps, qui seul sait dire
// « la soirée en cours ». En attendant, cet écran prouve la chaîne complète, de la connexion
// jusqu'à la résolution des droits.

const LIBELLES_ROLE: Readonly<Record<string, string>> = {
  eleve: 'Élève',
  professeur: 'Professeur',
  surveillant: 'Surveillant',
  cpe: 'CPE',
  direction: 'Direction',
  administrateur: 'Administrateur',
};

// Un eleve n'a jamais de service : la session ne les charge que pour le personnel. Lui dire
// « aucun service » accuserait le referentiel a tort, alors que son groupe est bien la.
function decrireRattachements(
  session: { roleCode: string; serviceIds: readonly string[] },
  codesGroupes: readonly string[],
): string {
  const groupes = codesGroupes.length === 0 ? null : codesGroupes.join(', ');

  if (session.roleCode === 'eleve') {
    return groupes === null
      ? 'Aucun groupe : prévenez l’administrateur, vous n’apparaîtrez ni à l’appel ni au bilan.'
      : `${groupes}.`;
  }

  const services =
    session.serviceIds.length === 0
      ? 'Aucun service rattaché.'
      : `${session.serviceIds.length} service${session.serviceIds.length > 1 ? 's' : ''}.`;

  if (groupes === null) return services;
  return `${services} Professeur principal de ${groupes}.`;
}

export default async function Accueil() {
  const session = await sessionActive();
  if (session === null) redirect('/connexion');

  const profil = await profilConnecte(session.utilisateurId);
  const codesGroupes = await codesDesGroupes(session.groupeIds);
  const rattachements = decrireRattachements(session, codesGroupes);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-8">
      <header className="flex flex-wrap items-baseline justify-between gap-4 border-b border-filet pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-22">
            {profil === null ? 'Compte' : `${profil.prenom} ${profil.nom}`}
          </h1>
          <p className="text-13 text-texte-2">
            {LIBELLES_ROLE[session.roleCode] ?? session.roleCode}
            {session.estProfesseurPrincipal ? ', professeur principal' : ''}
          </p>
        </div>
        <BoutonDeconnexion />
      </header>

      {/* Bannière permanente pendant une usurpation (§2), impossible à manquer. */}
      {session.adminReelId !== null && (
        <p className="border border-alerte px-3 py-2 text-14">
          <Pastille ton="alerte">
            Identité empruntée. Toutes vos actions sont journalisées au nom de l’administrateur.
          </Pastille>
        </p>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-18">Rattachements</h2>
        <p className="text-14 text-texte-2">{rattachements}</p>
      </section>

      {peut(session, 'trombinoscope.voir', { groupeId: session.groupeIds[0] ?? '' }) ||
      peut(session, 'trombinoscope.voir') ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-18">Consulter</h2>
          <Link href="/trombinoscope" className="text-14 underline underline-offset-4">
            Trombinoscope
          </Link>
          <Link href="/notes" className="text-14 underline underline-offset-4">
            {session.roleCode === 'eleve' ? 'Mes notes' : 'Notes'}
          </Link>
        </section>
      ) : null}

      {peut(session, 'droits.gerer') && (
        <section className="flex flex-col gap-2">
          <h2 className="text-18">Administration</h2>
          <Link href="/administration/droits" className="text-14 underline underline-offset-4">
            Panneau des droits
          </Link>
        </section>
      )}

      <MesDroits session={session} />
    </main>
  );
}

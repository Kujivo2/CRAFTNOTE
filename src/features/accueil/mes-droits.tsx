import { CATALOGUE, type GroupePermission } from '@/auth/catalogue';
import type { Session } from '@/auth/peut';
import { resoudreDroit } from '@/auth/resoudre';
import { EnteteTableau, Ligne, Tableau, Td, Th, ThLigne } from '@/ui/tableau';

// La résolution en cascade, rendue lisible. C'est ce qui permet de répondre à « pourquoi je ne
// vois pas cet écran ? » sans ouvrir la console, et c'est déjà la moitié du panneau des droits.

const TITRES: Readonly<Record<GroupePermission, string>> = {
  comptes: 'Comptes',
  emploiDuTemps: 'Emploi du temps',
  cours: 'Cours',
  notes: 'Notes',
  vieScolaire: 'Vie scolaire',
  bilan: 'Bilan',
  administration: 'Administration',
};

const PORTEES: Readonly<Record<string, string>> = {
  soi: 'soi',
  sesServices: 'ses services',
  sonGroupe: 'son groupe',
  etablissement: 'établissement',
};

const ORIGINES: Readonly<Record<string, string>> = {
  administrateur: 'administrateur',
  autorisationIndividuelle: 'autorisation individuelle',
  interdictionIndividuelle: 'interdiction individuelle',
  role: 'rôle',
  refusParDefaut: 'refus',
};

export function MesDroits({ session }: { session: Session }) {
  const accordes = CATALOGUE.map((permission) => ({
    permission,
    decision: resoudreDroit(permission.code, session),
  })).filter((ligne) => ligne.decision.accorde);

  const groupes = [...new Set(accordes.map((ligne) => ligne.permission.groupe))];

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-18">Mes droits</h2>
        <p className="text-13 text-texte-2">
          {accordes.length} permissions sur {CATALOGUE.length}, telles que le serveur les résout.
        </p>
      </div>

      {groupes.map((groupe) => (
        <div key={groupe} className="flex flex-col gap-2">
          <h3 className="font-dense text-13 text-texte-2">{TITRES[groupe]}</h3>

          <Tableau legende={`Permissions accordées : ${TITRES[groupe]}`}>
            <EnteteTableau>
              <Th>Permission</Th>
              <Th>Portée</Th>
              <Th>Origine</Th>
            </EnteteTableau>

            <tbody>
              {accordes
                .filter((ligne) => ligne.permission.groupe === groupe)
                .map(({ permission, decision }) => (
                  <Ligne key={permission.code}>
                    <ThLigne>{permission.libelle}</ThLigne>
                    <Td>
                      {decision.portees.map((portee) => PORTEES[portee] ?? portee).join(', ')}
                    </Td>
                    <Td>{ORIGINES[decision.origine] ?? decision.origine}</Td>
                  </Ligne>
                ))}
            </tbody>
          </Tableau>
        </div>
      ))}
    </section>
  );
}

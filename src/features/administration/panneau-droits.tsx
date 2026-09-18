'use client';

import { useState } from 'react';

import { CATALOGUE, type CodePermission, type GroupePermission } from '@/auth/catalogue';
import type { CodeRole, DroitsDuRole } from '@/auth/matrice-defaut';
import type { Portee } from '@/auth/portee';
import { Bouton } from '@/ui/bouton';
import { Pastille } from '@/ui/pastille';
import { enregistrerDroits } from './actions';

// Un rôle à la fois, et non les six colonnes côte à côte : six colonnes de menus déroulants
// imposent un défilement horizontal sur téléphone, que le §9 interdit. Le tableau complet
// reste lisible en lecture seule sur l'accueil de chaque compte.

const ROLES: readonly { code: CodeRole; libelle: string }[] = [
  { code: 'eleve', libelle: 'Élève' },
  { code: 'professeur', libelle: 'Professeur' },
  { code: 'surveillant', libelle: 'Surveillant' },
  { code: 'cpe', libelle: 'CPE' },
  { code: 'direction', libelle: 'Direction' },
  { code: 'administrateur', libelle: 'Administrateur' },
];

const TITRES: Readonly<Record<GroupePermission, string>> = {
  comptes: 'Comptes',
  emploiDuTemps: 'Emploi du temps',
  cours: 'Cours',
  notes: 'Notes',
  vieScolaire: 'Vie scolaire',
  bilan: 'Bilan',
  administration: 'Administration',
};

const LIBELLES_PORTEE: Readonly<Record<Portee, string>> = {
  soi: 'Soi',
  sesServices: 'Ses services',
  sonGroupe: 'Son groupe',
  etablissement: 'Établissement',
};

const GROUPES = [...new Set(CATALOGUE.map((permission) => permission.groupe))];

export function PanneauDroits({ initial }: { initial: Partial<Record<CodeRole, DroitsDuRole>> }) {
  const [role, setRole] = useState<CodeRole>('professeur');
  const [droits, setDroits] = useState(initial);
  const [message, setMessage] = useState<{ ton: 'accent' | 'alerte'; texte: string } | null>(null);
  const [enCours, setEnCours] = useState(false);

  const verrouille = role === 'administrateur';
  const courant = droits[role] ?? {};

  function changer(code: CodePermission, valeur: string): void {
    const portee = valeur === '' ? undefined : (valeur as Portee);
    setDroits((precedent) => {
      const pourLeRole = { ...(precedent[role] ?? {}) };
      if (portee === undefined) delete pourLeRole[code];
      else pourLeRole[code] = portee;
      return { ...precedent, [role]: pourLeRole };
    });
    setMessage(null);
  }

  async function enregistrer(): Promise<void> {
    setEnCours(true);
    setMessage(null);

    const changements = CATALOGUE.map((permission) => ({
      code: permission.code,
      portee: courant[permission.code] ?? null,
    }));

    const resultat = await enregistrerDroits({ roleId: role, changements });
    setMessage(
      resultat.erreur === null
        ? { ton: 'accent', texte: 'Droits enregistrés.' }
        : { ton: 'alerte', texte: resultat.erreur },
    );
    setEnCours(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Rôle à modifier">
        {ROLES.map((entree) => (
          <Bouton
            key={entree.code}
            variante={entree.code === role ? 'primaire' : 'secondaire'}
            aria-pressed={entree.code === role}
            onClick={() => {
              setRole(entree.code);
              setMessage(null);
            }}
          >
            {entree.libelle}
          </Bouton>
        ))}
      </div>

      {verrouille && (
        <p className="border border-filet px-3 py-2 text-14">
          <Pastille ton="sourd">
            L’administrateur détient tout, et ses cases ne se décochent pas. Le serveur refuse
            aussi, au cas où la requête arriverait sans passer par cet écran.
          </Pastille>
        </p>
      )}

      {GROUPES.map((groupe) => (
        <fieldset key={groupe} className="flex flex-col gap-2 border-0 p-0">
          <legend className="font-dense text-13 text-texte-2">{TITRES[groupe]}</legend>

          {CATALOGUE.filter((permission) => permission.groupe === groupe).map((permission) => {
            const identifiant = `droit-${permission.code}`;
            return (
              <div
                key={permission.code}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-filet py-2"
              >
                <label htmlFor={identifiant} className="text-14">
                  {permission.libelle}
                </label>

                <select
                  id={identifiant}
                  className="min-h-11 rounded-champ border border-filet bg-fond px-2 text-16 text-texte"
                  value={verrouille ? 'etablissement' : (courant[permission.code] ?? '')}
                  disabled={verrouille || enCours}
                  onChange={(evenement) => changer(permission.code, evenement.target.value)}
                >
                  <option value="">Pas de droit</option>
                  {permission.portees.map((portee) => (
                    <option key={portee} value={portee}>
                      {LIBELLES_PORTEE[portee]}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </fieldset>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-filet pt-4">
        {message === null ? (
          <span className="text-13 text-texte-2">
            Une modification prend effet immédiatement, sans reconnexion.
          </span>
        ) : (
          <Pastille ton={message.ton}>{message.texte}</Pastille>
        )}

        <Bouton variante="primaire" onClick={enregistrer} disabled={verrouille || enCours}>
          {enCours ? 'Enregistrement' : 'Enregistrer les droits'}
        </Bouton>
      </div>
    </div>
  );
}

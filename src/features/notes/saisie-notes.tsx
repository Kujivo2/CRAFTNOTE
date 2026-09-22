'use client';

import { useRef, useState } from 'react';

import type { FeuilleDeSaisie, LigneDeSaisie } from '@/data/notes';
import type { StatutNote } from '@/domain/types';
import { heureFr, noteEnCentiemes, noteFr } from '@/lib/formatage';
import { Bouton } from '@/ui/bouton';
import { Pastille } from '@/ui/pastille';
import { EnteteTableau, Ligne, Tableau, Td, Th, ThLigne } from '@/ui/tableau';
import { enregistrerLaSaisie } from './actions';

// Saisie entièrement au clavier (3) : Entrée passe au suivant, une lettre pose un statut.
// Les raccourcis écrasent la valeur, toujours, sans se demander ce qu'il y avait avant : une
// règle qu'on peut appliquer les yeux sur la copie vaut mieux qu'une règle intelligente.
const RACCOURCIS: Readonly<Record<string, StatutNote>> = {
  a: 'absent',
  d: 'dispense',
  n: 'nonRendu',
};

const LIBELLES: Readonly<Record<StatutNote, string>> = {
  notee: 'notée',
  absent: 'absent',
  dispense: 'dispensé',
  nonRendu: 'non rendu',
  nonNotee: 'non notée',
};

const TONS: Readonly<Record<StatutNote, 'neutre' | 'accent' | 'alerte' | 'sourd'>> = {
  notee: 'neutre',
  absent: 'alerte',
  dispense: 'sourd',
  nonRendu: 'alerte',
  nonNotee: 'sourd',
};

type Etat = {
  readonly eleveId: string;
  readonly prenom: string;
  readonly nom: string;
  texte: string;
  statut: StatutNote;
  commentaire: string;
};

function depuisLigne(ligne: LigneDeSaisie): Etat {
  return {
    eleveId: ligne.eleveId,
    prenom: ligne.prenom,
    nom: ligne.nom,
    texte: ligne.valeurCentiemes === null ? '' : noteFr(ligne.valeurCentiemes),
    statut: ligne.statut,
    commentaire: ligne.commentaire,
  };
}

export function SaisieNotes({ feuille }: { feuille: FeuilleDeSaisie }) {
  const [lignes, setLignes] = useState<Etat[]>(feuille.lignes.map(depuisLigne));
  const [message, setMessage] = useState<{ ton: 'accent' | 'alerte'; texte: string } | null>(null);
  const [enCours, setEnCours] = useState(false);
  const champs = useRef<(HTMLInputElement | null)[]>([]);

  function modifier(index: number, correctif: Partial<Etat>): void {
    setLignes((precedent) =>
      precedent.map((ligne, position) =>
        position === index ? { ...ligne, ...correctif } : ligne,
      ),
    );
    setMessage(null);
  }

  function auClavier(evenement: React.KeyboardEvent<HTMLInputElement>, index: number): void {
    const statut = RACCOURCIS[evenement.key.toLowerCase()];
    if (statut !== undefined) {
      evenement.preventDefault();
      modifier(index, { statut, texte: '' });
      return;
    }
    if (evenement.key === 'Enter') {
      evenement.preventDefault();
      champs.current[index + 1]?.focus();
    }
  }

  async function enregistrer(): Promise<void> {
    setEnCours(true);
    setMessage(null);

    const saisies = [];
    for (const ligne of lignes) {
      const valeur = noteEnCentiemes(ligne.texte);
      if (valeur === undefined) {
        setMessage({ ton: 'alerte', texte: `Note illisible pour ${ligne.prenom} ${ligne.nom}.` });
        setEnCours(false);
        return;
      }
      if (valeur !== null && valeur > feuille.baremeCentiemes) {
        setMessage({
          ton: 'alerte',
          texte: `${ligne.prenom} ${ligne.nom} dépasse le barème de ${noteFr(feuille.baremeCentiemes)}.`,
        });
        setEnCours(false);
        return;
      }
      saisies.push({
        eleveId: ligne.eleveId,
        valeurCentiemes: valeur,
        statut: valeur === null ? ligne.statut : ('notee' as StatutNote),
        commentaire: ligne.commentaire,
        priseEnCompte: true,
      });
    }

    const resultat = await enregistrerLaSaisie({ evaluationId: feuille.evaluationId, saisies });
    setMessage(
      resultat.erreur === null
        ? { ton: 'accent', texte: `Enregistré à ${heureFr(new Date())}.` }
        : { ton: 'alerte', texte: resultat.erreur },
    );
    setEnCours(false);
  }

  const saisies = lignes.filter((ligne) => ligne.texte.trim() !== '').length;

  return (
    <div className="flex flex-col gap-4">
      <Tableau legende={`Saisie des notes : ${feuille.titre}`}>
        <EnteteTableau>
          <Th>Élève</Th>
          <Th aDroite>Note</Th>
          <Th>Statut</Th>
          <Th>Commentaire</Th>
        </EnteteTableau>
        <tbody>
          {lignes.map((ligne, index) => (
            <Ligne key={ligne.eleveId}>
              <ThLigne>
                {ligne.nom}, {ligne.prenom}
              </ThLigne>
              <Td aDroite>
                <input
                  ref={(element) => {
                    champs.current[index] = element;
                  }}
                  value={ligne.texte}
                  onChange={(evenement) =>
                    modifier(index, { texte: evenement.target.value, statut: 'notee' })
                  }
                  onKeyDown={(evenement) => auClavier(evenement, index)}
                  inputMode="decimal"
                  aria-label={`Note de ${ligne.prenom} ${ligne.nom}`}
                  className="chiffres min-h-11 w-20 rounded-champ border border-filet bg-fond px-2 text-right text-16 text-texte"
                />
              </Td>
              <Td>
                <Pastille ton={TONS[ligne.statut]}>{LIBELLES[ligne.statut]}</Pastille>
              </Td>
              <Td>
                <input
                  value={ligne.commentaire}
                  onChange={(evenement) => modifier(index, { commentaire: evenement.target.value })}
                  aria-label={`Commentaire pour ${ligne.prenom} ${ligne.nom}`}
                  className="min-h-11 w-full rounded-champ border border-filet bg-fond px-2 text-16 text-texte"
                />
              </Td>
            </Ligne>
          ))}
        </tbody>
      </Tableau>

      <p className="text-13 text-texte-2">
        {saisies} note{saisies > 1 ? 's' : ''} sur {lignes.length}. Moyenne du groupe : non
        affichée.
      </p>

      <p className="text-13 text-texte-2">
        Entrée élève suivant · A absent · D dispensé · N non rendu
      </p>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-filet pt-4">
        {message === null ? <span /> : <Pastille ton={message.ton}>{message.texte}</Pastille>}
        <Bouton variante="primaire" onClick={enregistrer} disabled={enCours}>
          {enCours ? 'Enregistrement' : 'Enregistrer les notes'}
        </Bouton>
      </div>
    </div>
  );
}

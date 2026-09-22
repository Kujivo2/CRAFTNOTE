'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { noteEnCentiemes } from '@/lib/formatage';
import { Bouton } from '@/ui/bouton';
import { Champ } from '@/ui/champ';
import { Pastille } from '@/ui/pastille';
import { creerUneEvaluation } from './actions';

const TYPES: readonly { valeur: string; libelle: string }[] = [
  { valeur: 'devoirSurveille', libelle: 'Devoir surveillé' },
  { valeur: 'interrogation', libelle: 'Interrogation' },
  { valeur: 'oral', libelle: 'Oral' },
  { valeur: 'pratique', libelle: 'Pratique' },
  { valeur: 'projet', libelle: 'Projet' },
];

export function FormulaireEvaluation({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(donnees: FormData): Promise<void> {
    setErreur(null);
    setEnCours(true);

    const bareme = noteEnCentiemes(String(donnees.get('bareme') ?? ''));
    const coefficient = Number(String(donnees.get('coefficient') ?? '1').replace(',', '.'));

    if (bareme === null || bareme === undefined || bareme <= 0) {
      setErreur('Le barème doit être un nombre supérieur à zéro.');
      setEnCours(false);
      return;
    }
    if (!Number.isFinite(coefficient) || coefficient <= 0) {
      setErreur('Le coefficient doit être un nombre supérieur à zéro.');
      setEnCours(false);
      return;
    }

    const resultat = await creerUneEvaluation({
      serviceId,
      titre: String(donnees.get('titre') ?? ''),
      date: String(donnees.get('date') ?? ''),
      baremeCentiemes: bareme,
      coefficient,
      type: String(donnees.get('type') ?? 'devoirSurveille'),
      facultative: donnees.get('facultative') === 'on',
    });

    setEnCours(false);
    if (resultat.erreur !== null) {
      setErreur(resultat.erreur);
      return;
    }
    if (resultat.id !== undefined) router.push(`/notes/${serviceId}/${resultat.id}`);
  }

  return (
    <form action={soumettre} className="flex max-w-sm flex-col gap-4">
      <Champ id="titre" name="titre" libelle="Titre" required placeholder="Devoir surveillé" />

      {/* Aucune validation n'interdit une date passée : la saison a commencé et tout se
          saisit rétroactivement (1). */}
      <Champ id="date" name="date" libelle="Date" type="date" required />

      <div className="flex flex-col gap-2">
        <label htmlFor="type" className="text-14 text-texte">
          Type
        </label>
        <select
          id="type"
          name="type"
          defaultValue="devoirSurveille"
          className="min-h-11 rounded-champ border border-filet bg-fond px-2 text-16 text-texte"
        >
          {TYPES.map((type) => (
            <option key={type.valeur} value={type.valeur}>
              {type.libelle}
            </option>
          ))}
        </select>
      </div>

      <Champ id="bareme" name="bareme" libelle="Barème" defaultValue="20" inputMode="decimal" />

      {/* Le coefficient vaut 1 par défaut et le champ est rangé dans les options (4.1) :
          la pondération est implémentée, elle n'encombre pas l'écran courant. */}
      <details className="text-14">
        <summary className="min-h-11 cursor-pointer py-2">Options</summary>
        <div className="flex flex-col gap-4 pt-2">
          <Champ
            id="coefficient"
            name="coefficient"
            libelle="Coefficient"
            defaultValue="1"
            inputMode="decimal"
          />
          <label htmlFor="facultative" className="flex items-center gap-2 text-14">
            <input type="checkbox" id="facultative" name="facultative" className="size-4" />
            Évaluation facultative
          </label>
        </div>
      </details>

      {erreur !== null && <Pastille ton="alerte">{erreur}</Pastille>}

      <Bouton variante="primaire" type="submit" disabled={enCours}>
        {enCours ? 'Création' : 'Créer l’évaluation'}
      </Bouton>
    </form>
  );
}

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Bouton } from '@/ui/bouton';
import { Pastille } from '@/ui/pastille';
import { basculerPublication } from './actions';

// « Un bouton dit ce qui va se produire, et la confirmation reprend le mot » (8.3).
// Publier n'est pas un verrou : dépublier reste possible, et corriger une note publiée aussi.
// Ce qui compte est tracé par le journal, pas interdit (4.6).
export function BoutonPublier({
  evaluationId,
  publiee,
}: {
  evaluationId: string;
  publiee: boolean;
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function basculer(): Promise<void> {
    setEnCours(true);
    setErreur(null);

    const resultat = await basculerPublication({ evaluationId, publiee: !publiee });
    setEnCours(false);

    if (resultat.erreur !== null) {
      setErreur(resultat.erreur);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Bouton variante={publiee ? 'secondaire' : 'primaire'} onClick={basculer} disabled={enCours}>
        {publiee ? 'Retirer la publication' : 'Publier les notes'}
      </Bouton>
      {erreur !== null && <Pastille ton="alerte">{erreur}</Pastille>}
    </div>
  );
}

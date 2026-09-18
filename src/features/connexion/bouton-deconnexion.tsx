'use client';

import { Bouton } from '@/ui/bouton';
import { deconnecter } from './actions';

export function BoutonDeconnexion() {
  // Le bouton dit ce qui va se produire (8.3). L'action serveur efface le cookie et redirige :
  // rien ne reste côté navigateur, puisque le SDK client a déjà été déconnecté à l'ouverture.
  return (
    <form action={deconnecter}>
      <Bouton variante="discret" type="submit">
        Se déconnecter
      </Bouton>
    </form>
  );
}

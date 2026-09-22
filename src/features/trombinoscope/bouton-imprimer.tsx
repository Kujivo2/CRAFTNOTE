'use client';

import { Bouton } from '@/ui/bouton';

// L'export PDF passe par l'impression du navigateur (9) : pas de bibliothèque, pas de rendu
// serveur à maintenir, et le résultat suit la feuille de style d'impression.
export function BoutonImprimer({ children }: { children: string }) {
  return (
    <Bouton variante="secondaire" onClick={() => window.print()}>
      {children}
    </Bouton>
  );
}

import type { ReactNode } from 'react';

// « Les etats ne se distinguent jamais par la seule couleur : pastille pleine et libelle » (8.3).
// Le mot est donc obligatoire dans ce composant, pas optionnel : on ne peut pas s'en passer
// par inadvertance.
type Ton = 'neutre' | 'accent' | 'alerte' | 'sourd';

const TONS: Readonly<Record<Ton, string>> = {
  neutre: 'bg-texte',
  accent: 'bg-accent',
  alerte: 'bg-alerte',
  sourd: 'bg-texte-2',
};

export function Pastille({ ton, children }: { ton: Ton; children: ReactNode }) {
  return (
    <span className="inline-flex items-baseline gap-2 text-14">
      {/* Le seul cercle de l'interface, et c'est assume : une pastille est ronde par
          definition. Le « rayon unique de 2 px » du 8.3 vise les boites, pas ce point.
          Ecrit en valeur arbitraire parce que l'espace de noms `--radius-*` est vide. */}
      <span
        aria-hidden="true"
        className={`inline-block size-2 shrink-0 translate-y-px rounded-[50%] ${TONS[ton]}`}
      />
      {children}
    </span>
  );
}

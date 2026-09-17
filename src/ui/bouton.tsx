import type { ButtonHTMLAttributes, ReactNode } from 'react';

// Une seule action primaire par ecran (8.3). Si deux boutons `primaire` se retrouvent sur la
// meme page, c'est la page qu'il faut revoir, pas le composant.
type Variante = 'primaire' | 'secondaire' | 'discret';

const VARIANTES: Readonly<Record<Variante, string>> = {
  primaire: 'bg-accent text-accent-texte border-accent font-medium',
  secondaire: 'bg-transparent text-texte border-filet hover:border-accent',
  discret: 'bg-transparent text-texte-2 border-transparent hover:text-texte',
};

// 44 px de haut : la cible tactile minimale du 9. `min-h-11` vaut 2,75 rem.
const COMMUN =
  'inline-flex min-h-11 items-center justify-center rounded-champ border px-4 text-16 ' +
  'disabled:cursor-not-allowed disabled:opacity-50';

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  readonly variante?: Variante;
  readonly pleineLargeur?: boolean;
  readonly children: ReactNode;
};

export function Bouton({
  variante = 'secondaire',
  pleineLargeur = false,
  type = 'button',
  children,
  ...reste
}: Props) {
  const largeur = pleineLargeur ? 'w-full' : '';

  return (
    <button type={type} className={`${COMMUN} ${VARIANTES[variante]} ${largeur}`} {...reste}>
      {children}
    </button>
  );
}

import type { ReactNode, ThHTMLAttributes } from 'react';

// De vrais tableaux (8.3) : filets d'un pixel, pas d'ombre, pas d'arrondi, lignes serrees,
// en-tetes collants. La densite est une qualite ici.

export function Tableau({ children, legende }: { children: ReactNode; legende: string }) {
  return (
    <table className="w-full border-collapse text-14">
      {/* La legende porte le sens du tableau pour un lecteur d'ecran, sans occuper l'ecran. */}
      <caption className="sr-only">{legende}</caption>
      {children}
    </table>
  );
}

export function EnteteTableau({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 bg-fond">
      <tr className="border-b border-filet">{children}</tr>
    </thead>
  );
}

type PropsTh = Omit<ThHTMLAttributes<HTMLTableCellElement>, 'className' | 'scope'> & {
  readonly children: ReactNode;
  readonly aDroite?: boolean;
};

// `scope` est toujours renseigne : sans lui, un lecteur d'ecran ne rattache pas la cellule
// a sa colonne, et le tableau devient une suite de nombres sans titre.
export function Th({ children, aDroite = false, ...reste }: PropsTh) {
  const alignement = aDroite ? 'text-right' : 'text-left';
  return (
    <th
      scope="col"
      className={`${alignement} px-3 py-2 font-dense text-13 font-medium text-texte-2`}
      {...reste}
    >
      {children}
    </th>
  );
}

export function ThLigne({ children }: { children: ReactNode }) {
  return (
    <th scope="row" className="px-3 py-2 text-left font-normal text-texte">
      {children}
    </th>
  );
}

export function Ligne({ children }: { children: ReactNode }) {
  return <tr className="border-b border-filet">{children}</tr>;
}

// `chiffres` active les chiffres tabulaires : sans eux, une colonne de moyennes ondule.
export function Td({
  children,
  aDroite = false,
  numerique = false,
}: {
  children: ReactNode;
  aDroite?: boolean;
  numerique?: boolean;
}) {
  const alignement = aDroite || numerique ? 'text-right' : 'text-left';
  const chiffres = numerique ? 'chiffres' : '';
  return <td className={`px-3 py-2 ${alignement} ${chiffres}`}>{children}</td>;
}

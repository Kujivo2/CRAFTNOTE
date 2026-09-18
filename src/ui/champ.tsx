import type { InputHTMLAttributes } from 'react';

// Un `<label>` reel, jamais un placeholder en guise d'etiquette, et l'erreur reliee par
// `aria-describedby` (9). Le champ est a 16 px : en dessous, Safari iOS zoome au focus.
type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'id'> & {
  readonly id: string;
  readonly libelle: string;
  readonly aide?: string;
  readonly erreur?: string;
};

const CHAMP =
  'min-h-11 w-full rounded-champ border bg-fond px-3 text-16 text-texte ' +
  'placeholder:text-texte-2';

export function Champ({ id, libelle, aide, erreur, ...reste }: Props) {
  const idAide = aide === undefined ? undefined : `${id}-aide`;
  const idErreur = erreur === undefined ? undefined : `${id}-erreur`;
  const decrit = [idErreur, idAide].filter((valeur) => valeur !== undefined).join(' ');
  const bordure = erreur === undefined ? 'border-filet' : 'border-alerte';

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-14 text-texte">
        {libelle}
      </label>

      <input
        id={id}
        className={`${CHAMP} ${bordure}`}
        aria-invalid={erreur === undefined ? undefined : true}
        aria-describedby={decrit === '' ? undefined : decrit}
        {...reste}
      />

      {/* L'erreur dit ce qui s'est passe et comment corriger, sans s'excuser (8.3). */}
      {erreur !== undefined && (
        <p id={idErreur} className="text-13 text-alerte">
          {erreur}
        </p>
      )}

      {aide !== undefined && (
        <p id={idAide} className="text-13 text-texte-2">
          {aide}
        </p>
      )}
    </div>
  );
}

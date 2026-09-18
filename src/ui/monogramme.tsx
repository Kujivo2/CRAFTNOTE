// Repli sans photo : monogramme des initiales sur fond encre, jamais une silhouette grise (8.3).
// Carre et non rond : c'est une photo d'identite scolaire, pas un avatar de messagerie.

const TAILLES = {
  grille: 'text-18',
  fiche: 'text-28',
} as const;

type Props = {
  readonly prenom: string;
  readonly nom: string;
  readonly taille?: keyof typeof TAILLES;
};

function initiales(prenom: string, nom: string): string {
  const premiere = (valeur: string): string => valeur.trim().charAt(0).toLocaleUpperCase('fr-FR');
  return `${premiere(prenom)}${premiere(nom)}`;
}

export function Monogramme({ prenom, nom, taille = 'grille' }: Props) {
  const lettres = initiales(prenom, nom);

  return (
    <span
      // Le nom complet est deja affiche sous la vignette : repeter les initiales a la
      // synthese vocale n'apprendrait rien.
      aria-hidden="true"
      className={`flex aspect-square w-full items-center justify-center bg-encre-2 font-dense ${TAILLES[taille]} text-craie`}
    >
      {lettres}
    </span>
  );
}

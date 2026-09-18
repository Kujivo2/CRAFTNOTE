// Les tokens rendus visibles, pour les relire dans les deux themes. Chaque contraste annonce
// ici est mesure dans docs/05-design.md, il n'est pas estime a l'oeil.

const PALETTE = [
  { nom: 'encre', valeur: '#14110F', classe: 'bg-encre', note: 'noir chaud de l’uniforme' },
  { nom: 'encre-2', valeur: '#201C19', classe: 'bg-encre-2', note: 'surfaces surélevées' },
  { nom: 'laiton', valeur: '#C2B078', classe: 'bg-laiton', note: '8,75 sur encre' },
  { nom: 'laiton-lisible', valeur: '#857340', classe: 'bg-laiton-lisible', note: '4,64 sur papier' },
  { nom: 'craie', valeur: '#F2E8F4', classe: 'bg-craie', note: '15,78 sur encre' },
  { nom: 'correction', valeur: '#A3231C', classe: 'bg-correction', note: '7,46 sur papier' },
  { nom: 'correction-clair', valeur: '#D4544A', classe: 'bg-correction-clair', note: '4,63 sur encre' },
] as const;

const GRIS = [
  'bg-gris-05',
  'bg-gris-10',
  'bg-gris-20',
  'bg-gris-30',
  'bg-gris-40',
  'bg-gris-50',
  'bg-gris-60',
  'bg-gris-70',
  'bg-gris-80',
  'bg-gris-90',
  'bg-gris-95',
] as const;

const ECHELLE = [
  { classe: 'text-28', nom: '28', usage: 'l’heure en cours, et elle seule' },
  { classe: 'text-22', nom: '22', usage: 'titre d’écran' },
  { classe: 'text-18', nom: '18', usage: 'titre de section' },
  { classe: 'text-16', nom: '16', usage: 'corps mobile, et tout champ de saisie' },
  { classe: 'text-14', nom: '14', usage: 'corps dense : tableaux, interface' },
  { classe: 'text-13', nom: '13', usage: 'en-têtes de colonnes, en Condensed' },
  { classe: 'text-12', nom: '12', usage: 'mentions, unités' },
] as const;

export function Palette() {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="text-18">Palette</h2>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PALETTE.map((couleur) => (
          <li key={couleur.nom} className="flex flex-col gap-2">
            <span className={`block h-12 w-full border border-filet ${couleur.classe}`} />
            <span className="text-13">{couleur.nom}</span>
            <span className="chiffres text-12 text-texte-2">{couleur.valeur}</span>
            <span className="text-12 text-texte-2">{couleur.note}</span>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <h3 className="text-14 text-texte-2">
          Rampe de gris, dérivée de l’encre, donc chaude sur les onze valeurs
        </h3>
        <div className="flex h-8 w-full">
          {GRIS.map((classe) => (
            <span key={classe} className={`h-full flex-1 ${classe}`} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-14 text-texte-2">Échelle typographique</h3>
        {ECHELLE.map((taille) => (
          <p key={taille.nom} className="flex items-baseline gap-4">
            <span className={`${taille.classe} shrink-0`}>Le lycée de Mantes-la-Jolie</span>
            <span className="chiffres shrink-0 text-12 text-texte-2">{taille.nom}</span>
            <span className="text-12 text-texte-2">{taille.usage}</span>
          </p>
        ))}
        <p className="font-document text-18">
          Spectral, réservée aux documents : le bilan, les en-têtes officiels.
        </p>
      </div>
    </section>
  );
}

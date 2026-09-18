// Atelier : la page qui rend les tokens et les primitives visibles dans les deux thèmes.
// Elle sera remplacée par le tableau de bord dès que la connexion existera. Elle reste utile
// ensuite comme page de contrôle du design.

import { Palette } from './_parties/palette';
import { Releve } from './_parties/releve';
import { BasculeTheme } from '@/ui/bascule-theme';
import { Bouton } from '@/ui/bouton';
import { Champ } from '@/ui/champ';
import { Monogramme } from '@/ui/monogramme';
import { Pastille } from '@/ui/pastille';

const PRESENCES = [
  { prenom: 'Léa', nom: 'Martin', ton: 'neutre', etat: 'présente' },
  { prenom: 'Hugo', nom: 'Bernard', ton: 'sourd', etat: 'absent' },
  { prenom: 'Noé', nom: 'Tissot', ton: 'accent', etat: 'retard, 10 min' },
  { prenom: 'Ana', nom: 'Moreau', ton: 'alerte', etat: 'en retenue' },
] as const;

export default function Atelier() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-8">
      <header className="flex items-baseline justify-between gap-4 border-b border-filet pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-22">CRAFTNOTE</h1>
          <p className="text-13 text-texte-2">Atelier du thème et des primitives</p>
        </div>
        <BasculeTheme />
      </header>

      <Palette />

      <section className="flex flex-col gap-4">
        <h2 className="text-18">Boutons</h2>
        <p className="text-13 text-texte-2">
          Un bouton dit ce qui va se produire. Une seule action primaire par écran.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Bouton variante="primaire">Publier les notes</Bouton>
          <Bouton variante="secondaire">Faire l’appel</Bouton>
          <Bouton variante="discret">Passer en mode liste</Bouton>
          <Bouton variante="secondaire" disabled>
            Indisponible
          </Bouton>
        </div>
      </section>

      <section className="flex max-w-sm flex-col gap-4">
        <h2 className="text-18">Champs</h2>
        <Champ
          id="demo-identifiant"
          libelle="Identifiant"
          placeholder="prenom.nom@craftnote.local"
          aide="L’adresse fictive qui sert à se connecter."
          autoComplete="username"
        />
        <Champ
          id="demo-heure"
          libelle="Heure de début de la soirée"
          defaultValue="20:00"
          erreur="Le format attendu est 20:00."
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-18">Appel, quatre élèves sur un écran</h2>
        <p className="text-13 text-texte-2">
          Chaque état porte une pastille et un mot : la couleur ne dit jamais rien toute seule.
        </p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PRESENCES.map((eleve) => (
            <li key={eleve.nom} className="flex flex-col gap-2 border border-filet p-2">
              <Monogramme prenom={eleve.prenom} nom={eleve.nom} />
              <Pastille ton={eleve.ton}>{eleve.etat}</Pastille>
              <span className="text-13">
                {eleve.prenom} {eleve.nom.charAt(0)}.
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Releve />

      <footer className="border-t border-filet pt-4 text-12 text-texte-2">
        Aucun emoji, une seule famille de police par rôle, un seul rayon de bordure, aucune ombre.
        Les espaces de noms par défaut de Tailwind sont vides : ni palette héritée, ni arrondi
        décoratif ne peuvent être écrits par inadvertance.
      </footer>
    </main>
  );
}

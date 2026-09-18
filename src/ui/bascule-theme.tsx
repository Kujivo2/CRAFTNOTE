'use client';

import { useEffect, useState } from 'react';
import { Bouton } from './bouton';

export const CLE_THEME = 'craftnote-theme';

export type Theme = 'uniforme' | 'papier';

// Le mot plutot que le pictogramme (8.3) : « Thème papier » dit ce qui va se produire,
// une icone de lune ne le dit pas.
const LIBELLES: Readonly<Record<Theme, string>> = {
  uniforme: 'Thème papier',
  papier: 'Thème uniforme',
};

function themeSysteme(): Theme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'papier' : 'uniforme';
}

export function BasculeTheme() {
  // `null` tant que le composant n'est pas monte : le serveur ne sait pas quel theme
  // le navigateur applique, et afficher le mauvais libelle serait pire que rien.
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const pose = document.documentElement.dataset.theme;
    setTheme(pose === 'papier' || pose === 'uniforme' ? pose : themeSysteme());
  }, []);

  function basculer(): void {
    const suivant: Theme = theme === 'papier' ? 'uniforme' : 'papier';
    document.documentElement.dataset.theme = suivant;
    setTheme(suivant);
    try {
      window.localStorage.setItem(CLE_THEME, suivant);
    } catch {
      // Navigation privee ou stockage refuse : le theme tient pour la session, sans plus.
      // Le choix remontera dans le document utilisateur des que la connexion existera.
    }
  }

  return (
    <Bouton variante="discret" onClick={basculer} aria-live="polite">
      {theme === null ? 'Thème' : LIBELLES[theme]}
    </Bouton>
  );
}

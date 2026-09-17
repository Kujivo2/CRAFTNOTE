import type { Metadata, Viewport } from 'next';
import { Fira_Sans, Fira_Sans_Condensed, Spectral } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

// Fira Sans pour toute l'interface : excellentes diacritiques francaises, tres lisible en
// petit corps. Spectral, serif, est reservee aux documents : le bilan, les en-tetes officiels.
// Les graisses sont choisies, pas laissees par defaut (8.2).
const fira = Fira_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--police-fira',
  display: 'swap',
});

const firaCondensed = Fira_Sans_Condensed({
  subsets: ['latin'],
  weight: ['500', '600'],
  variable: '--police-fira-condensed',
  display: 'swap',
});

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--police-spectral',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CRAFTNOTE',
  description: 'Vie scolaire du lycée de Mantes-la-Jolie.',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#14110F' },
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
  ],
};

// Pose le theme enregistre avant le premier rendu. Sans ce script, la page s'affiche une
// fraction de seconde dans le mauvais theme a chaque chargement, ce qui se voit surtout le
// soir, en pleine session.
const POSER_LE_THEME = `(function(){try{var t=localStorage.getItem('craftnote-theme');if(t==='papier'||t==='uniforme'){document.documentElement.dataset.theme=t}}catch(e){}})()`;

export default function RacineLayout({ children }: { children: ReactNode }) {
  const polices = `${fira.variable} ${firaCondensed.variable} ${spectral.variable}`;

  return (
    // `suppressHydrationWarning` parce que le script ci-dessus pose `data-theme` avant React.
    <html lang="fr" className={polices} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: POSER_LE_THEME }} />
      </head>
      <body className="min-h-dvh bg-fond text-texte antialiased">{children}</body>
    </html>
  );
}

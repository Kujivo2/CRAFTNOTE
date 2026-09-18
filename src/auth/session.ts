import 'server-only';

import { cookies } from 'next/headers';

import { authentification } from '@/firebase/admin';

// Session par cookie signe (7.2). Le jeton d'identite produit par le SDK client a la connexion
// est echange ici contre un cookie de session, et le SDK client ne sert plus a rien ensuite.

const NOM_COOKIE = 'craftnote_session';
const NOM_COOKIE_USURPATION = 'craftnote_usurpation';

// Cinq jours : une saison de RP dure trois semaines, et se reconnecter une fois par semaine
// n'est pas une contrainte. Au-dela, un cookie oublie sur un poste partage traine trop.
const DUREE_MS = 1000 * 60 * 60 * 24 * 5;

function options() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: DUREE_MS / 1000,
  };
}

// Verifie le jeton d'identite produit par le SDK client a la connexion. Le controle de
// revocation est actif : un compte desactive entre-temps ne passe pas.
export async function verifierJetonIdentite(jeton: string): Promise<string | null> {
  try {
    const verifie = await authentification().verifyIdToken(jeton, true);
    return verifie.uid;
  } catch {
    return null;
  }
}

export async function ouvrirSession(jetonIdentite: string): Promise<void> {
  const cookie = await authentification().createSessionCookie(jetonIdentite, {
    expiresIn: DUREE_MS,
  });
  const magasin = await cookies();
  magasin.set(NOM_COOKIE, cookie, options());
}

export async function fermerSession(): Promise<void> {
  const magasin = await cookies();
  magasin.delete(NOM_COOKIE);
  magasin.delete(NOM_COOKIE_USURPATION);
}

// Rend l'UID du compte REELLEMENT connecte, jamais celui d'une identite empruntee.
export async function uidConnecte(): Promise<string | null> {
  const magasin = await cookies();
  const cookie = magasin.get(NOM_COOKIE)?.value;
  if (cookie === undefined) return null;

  try {
    // `true` active le controle de revocation : desactiver un compte le deconnecte
    // a la requete suivante, sans attendre l'expiration du cookie.
    const jeton = await authentification().verifySessionCookie(cookie, true);
    return jeton.uid;
  } catch {
    // Cookie expire, revoque ou falsifie : on ne distingue pas, on refuse.
    return null;
  }
}

export async function uidUsurpe(): Promise<string | null> {
  const magasin = await cookies();
  return magasin.get(NOM_COOKIE_USURPATION)?.value ?? null;
}

// L'usurpation est verifiee par `verifierUsurpation` AVANT d'appeler ceci : cette fonction ne
// controle rien, elle pose le cookie.
export async function commencerUsurpation(cibleUid: string): Promise<void> {
  const magasin = await cookies();
  magasin.set(NOM_COOKIE_USURPATION, cibleUid, options());
}

// Sortie en un clic (2) : on ne touche pas au cookie de session, seulement a l'emprunt.
export async function arreterUsurpation(): Promise<void> {
  const magasin = await cookies();
  magasin.delete(NOM_COOKIE_USURPATION);
}

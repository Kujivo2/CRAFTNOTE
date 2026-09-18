import { type NextRequest, NextResponse } from 'next/server';

// CE MIDDLEWARE N'AUTORISE RIEN. Il redirige, et c'est tout.
//
// Le §10 est explicite : le contrôle d'accès vit dans `data/`, jamais ici. Une vulnérabilité de
// contournement du middleware Next a été publiée en mai 2026, et la leçon n'est pas « colmater le
// middleware », c'est « ne jamais lui confier une décision d'autorisation ».
//
// Concrètement, ce fichier regarde si un cookie EXISTE. Il ne le vérifie pas : la vérification
// signée et le contrôle de révocation demandent l'Admin SDK, qui ne tourne pas dans le runtime
// Edge. Un cookie forgé passe donc ce middleware, et se fait refuser dans `data/`, où
// `sessionActive()` le vérifie pour de bon.
//
// Son seul mérite : éviter qu'un visiteur non connecté charge une page pour y lire « session
// absente ». C'est du confort, pas de la sécurité.

const NOM_COOKIE = 'craftnote_session';
const PUBLIQUES = new Set(['/connexion']);

export function middleware(requete: NextRequest): NextResponse {
  const chemin = requete.nextUrl.pathname;
  const aUnCookie = requete.cookies.has(NOM_COOKIE);

  if (!aUnCookie && !PUBLIQUES.has(chemin)) {
    const destination = new URL('/connexion', requete.url);
    return NextResponse.redirect(destination);
  }

  return NextResponse.next();
}

export const config = {
  // Tout, sauf les ressources internes de Next, les fichiers statiques et les routes d'API,
  // qui font leur propre contrôle.
  matcher: ['/((?!_next/static|_next/image|api|favicon.ico).*)'],
};

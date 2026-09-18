import { NextResponse } from 'next/server';

// ROUTE TEMPORAIRE, A RETIRER une fois le deploiement en ordre.
//
// Elle existe parce que les journaux d'execution de Vercel ne sont pas consultables depuis ici,
// et qu'empiler les hypotheses a l'aveugle coute plus cher qu'un aller-retour de diagnostic.
//
// Elle ne rend AUCUN secret : ni la cle, ni son contenu, ni aucune valeur de configuration.
// Uniquement des booleens, des noms de champs attendus, et le message d'une erreur eventuelle.

export const dynamic = 'force-dynamic';

type Essai = { readonly ok: boolean; readonly erreur?: string };

async function essayer(action: () => Promise<unknown> | unknown): Promise<Essai> {
  try {
    await action();
    return { ok: true };
  } catch (cause) {
    const message = cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);
    return { ok: false, erreur: message.slice(0, 300) };
  }
}

function formeDeLaCle(): Record<string, boolean | number | string> {
  const brut = process.env.FIREBASE_COMPTE_SERVICE;
  if (brut === undefined) return { presente: false };

  const forme: Record<string, boolean | number | string> = {
    presente: true,
    longueur: brut.length,
    // Une variable collee depuis un tableur ou un terminal arrive parfois entouree de guillemets.
    commencePar: brut.trimStart().slice(0, 1),
  };

  try {
    const objet = JSON.parse(brut) as Record<string, unknown>;
    forme.jsonValide = true;
    for (const champ of ['type', 'project_id', 'client_email', 'private_key']) {
      forme[`a_${champ}`] = typeof objet[champ] === 'string' && objet[champ] !== '';
    }
    const cle = typeof objet.private_key === 'string' ? objet.private_key : '';
    forme.cleEnPem = cle.includes('BEGIN PRIVATE KEY');
    // Le piege classique : les \n echappes restent litteraux et la cle devient illisible.
    forme.cleAvecVraisSautsDeLigne = cle.includes('\n');
  } catch (cause) {
    forme.jsonValide = false;
    forme.erreurJson = cause instanceof Error ? cause.message.slice(0, 200) : 'inconnue';
  }

  return forme;
}

export async function GET() {
  const chargeAdmin = await essayer(() => import('firebase-admin/app'));
  const chargeAuth = await essayer(() => import('firebase-admin/auth'));
  const chargeFirestore = await essayer(() => import('firebase-admin/firestore'));

  // Le module qui echoue reellement quand une page tombe : il enchaine les trois ci-dessus.
  const chargeNotreAdmin = await essayer(() => import('@/firebase/admin'));
  const chargeSession = await essayer(() => import('@/data/session'));

  return NextResponse.json({
    node: process.version,
    region: process.env.VERCEL_REGION ?? null,
    environnement: process.env.VERCEL_ENV ?? 'hors Vercel',
    cle: formeDeLaCle(),
    modules: {
      'firebase-admin/app': chargeAdmin,
      'firebase-admin/auth': chargeAuth,
      'firebase-admin/firestore': chargeFirestore,
      'src/firebase/admin': chargeNotreAdmin,
      'src/data/session': chargeSession,
    },
  });
}

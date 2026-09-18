'use client';

import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { authClient } from '@/firebase/client';
import { Bouton } from '@/ui/bouton';
import { Champ } from '@/ui/champ';
import { connecter } from './actions';

// Les erreurs disent ce qui s'est passé et comment corriger, sans s'excuser (8.3).
// La limitation de débit sur la connexion (10) est celle de Firebase Authentication, qui
// répond `auth/too-many-requests` : en ajouter une seconde ici la dupliquerait mal.
const MESSAGES: Readonly<Record<string, string>> = {
  'auth/invalid-credential': 'Identifiant ou mot de passe incorrect.',
  'auth/invalid-email': 'L’identifiant doit ressembler à prenom.nom@craftnote.local.',
  'auth/user-disabled': 'Ce compte est désactivé.',
  'auth/too-many-requests': 'Trop de tentatives. Réessayez dans quelques minutes.',
  'auth/network-request-failed': 'Connexion au serveur impossible. Vérifiez votre réseau.',
};

function messageDe(erreur: unknown): string {
  const code = typeof erreur === 'object' && erreur !== null && 'code' in erreur ? String(erreur.code) : '';
  return MESSAGES[code] ?? 'La connexion a échoué. Réessayez.';
}

export function FormulaireConnexion() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function soumettre(donnees: FormData): Promise<void> {
    setErreur(null);
    setEnCours(true);

    const identifiant = String(donnees.get('identifiant') ?? '').trim();
    const motDePasse = String(donnees.get('motDePasse') ?? '');

    try {
      const auth = authClient();
      const identite = await signInWithEmailAndPassword(auth, identifiant, motDePasse);
      const jeton = await identite.user.getIdToken();

      // Le jeton part immédiatement au serveur, qui le change en cookie de session. Ensuite le
      // SDK client n'a plus rien à faire : on le déconnecte pour qu'aucune session ne traîne
      // dans le navigateur.
      const resultat = await connecter({ jeton });
      await signOut(auth);

      if (resultat.erreur !== null) {
        setErreur(resultat.erreur);
        return;
      }
      router.replace('/');
      router.refresh();
    } catch (cause) {
      setErreur(messageDe(cause));
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form action={soumettre} className="flex flex-col gap-5">
      <Champ
        id="identifiant"
        name="identifiant"
        libelle="Identifiant"
        type="text"
        inputMode="email"
        autoComplete="username"
        required
        aide="L’adresse fictive qui vous a été donnée."
      />

      <Champ
        id="motDePasse"
        name="motDePasse"
        libelle="Mot de passe"
        type="password"
        autoComplete="current-password"
        required
        {...(erreur === null ? {} : { erreur })}
      />

      <Bouton variante="primaire" type="submit" pleineLargeur disabled={enCours}>
        {enCours ? 'Connexion en cours' : 'Se connecter'}
      </Bouton>
    </form>
  );
}

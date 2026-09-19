// Lecture et normalisation du fichier referentiel-a-remplir.csv.
//
// Partage par creer-comptes-manquants.ts et semer-referentiel.ts : les deux doivent lire le
// fichier exactement de la meme facon, sinon l'un cree un compte que l'autre ne retrouve pas.
//
// Trois pieges du 3 sont traites ici, une fois pour toutes :
//   - separateur point-virgule, celui des tableurs francais ;
//   - marque d'ordre des octets en tete de fichier ;
//   - casse et espaces variables dans les roles (« Eleve » vaut « eleve »).

import { readFileSync } from 'node:fs';

export const ROLES_CONNUS = [
  'eleve',
  'professeur',
  'surveillant',
  'cpe',
  'direction',
  'administrateur',
] as const;

export type CodeRole = (typeof ROLES_CONNUS)[number];

export type LigneReferentiel = {
  readonly identifiant: string;
  readonly nom: string;
  readonly prenom: string;
  readonly role: CodeRole;
  readonly roleBrut: string;
  readonly groupes: readonly string[];
  readonly matieres: readonly string[];
  readonly ligne: number;
};

// Les adresses sont ramenees en minuscules : Firebase Authentication le fait de son cote, et
// une correspondance qui echoue sur une majuscule cree un doublon au lieu d'une mise a jour.
export function normaliserIdentifiant(valeur: string): string {
  return valeur.trim().toLowerCase();
}

export function sansAccent(valeur: string): string {
  return valeur.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// « Groupe 1 » devient « groupe-1 », « Fausse identite » devient « fausse-identite ».
export function enIdentifiantDocument(valeur: string): string {
  return sansAccent(valeur)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function estRoleConnu(valeur: string): valeur is CodeRole {
  return (ROLES_CONNUS as readonly string[]).includes(valeur);
}

function decouperListe(valeur: string): readonly string[] {
  return valeur
    .split('|')
    .map((element) => element.trim())
    .filter((element) => element !== '');
}

export type Lecture = {
  readonly lignes: readonly LigneReferentiel[];
  readonly rejets: readonly string[];
};

export function lireReferentiel(chemin = 'classe.csv'): Lecture {
  const brut = readFileSync(chemin, 'utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const [entete = '', ...corps] = brut.trim().split('\n');

  const colonnes = entete.split(';').map((nom) => nom.trim());
  const indice = (nom: string): number => colonnes.indexOf(nom);
  const iIdentifiant = indice('identifiant');
  const iNom = indice('nom');
  const iPrenom = indice('prenom');
  const iRole = indice('role');
  const iGroupe = indice('groupe');
  const iMatiere = indice('matiere');

  if ([iIdentifiant, iNom, iPrenom, iRole, iGroupe, iMatiere].includes(-1)) {
    throw new Error(`En-tête inattendu dans ${chemin} : ${entete}`);
  }

  const lignes: LigneReferentiel[] = [];
  const rejets: string[] = [];

  corps.forEach((texte, decalage) => {
    if (texte.trim() === '') return;
    const numero = decalage + 2;
    const cellules = texte.split(';');
    const lire = (index: number): string => (cellules[index] ?? '').trim();

    const identifiant = normaliserIdentifiant(lire(iIdentifiant));
    const roleBrut = lire(iRole);
    const role = roleBrut.trim().toLowerCase();

    if (identifiant === '') {
      rejets.push(`ligne ${numero} : identifiant vide`);
      return;
    }
    if (!estRoleConnu(role)) {
      rejets.push(`ligne ${numero} : ${identifiant} porte un rôle inconnu « ${roleBrut} »`);
      return;
    }

    lignes.push({
      identifiant,
      nom: lire(iNom),
      prenom: lire(iPrenom),
      role,
      roleBrut,
      groupes: decouperListe(lire(iGroupe)),
      matieres: decouperListe(lire(iMatiere)),
      ligne: numero,
    });
  });

  return { lignes, rejets };
}

// Un membre du personnel porte la liste de TOUS les groupes ou il intervient ; un eleve n'en a
// qu'un, le sien. C'est ce qui distingue les deux sans se fier au role, et c'est ce qui permet
// a un administrateur joue comme eleve d'avoir quand meme son groupe.
export function estRattacheAUnSeulGroupe(ligne: LigneReferentiel): boolean {
  return ligne.groupes.length === 1;
}

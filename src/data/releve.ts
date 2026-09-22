import 'server-only';

import { exigerPermission } from '@/auth/peut';
import { moyenneGenerale, moyenneMatiere, type NoteCalculable } from '@/domain/moyennes';
import type { Rationnel } from '@/domain/rationnel';
import { OPTIONS_PAR_DEFAUT, type OptionsCalcul, type StatutNote } from '@/domain/types';
import { etablissement, evaluations, notes, utilisateurs } from '@/firebase/collections';
import { periodeCourante } from './services';
import { exigerSession } from './session';

export type LigneDeReleve = {
  readonly evaluationId: string;
  readonly titre: string;
  readonly date: string;
  readonly valeurCentiemes: number | null;
  readonly baremeCentiemes: number;
  readonly coefficient: number;
  readonly statut: StatutNote;
  readonly priseEnCompte: boolean;
};

export type MatiereDuReleve = {
  readonly matiereNom: string;
  readonly lignes: readonly LigneDeReleve[];
  readonly moyenne: Rationnel | null;
};

export type Releve = {
  readonly eleveNom: string;
  readonly matieres: readonly MatiereDuReleve[];
  readonly generale: Rationnel | null;
};

async function optionsDeCalcul(): Promise<OptionsCalcul> {
  const config = (await etablissement().doc('config').get()).data();
  if (config === undefined) return OPTIONS_PAR_DEFAUT;
  return {
    absentCompteZero: config.absentCompteZero,
    nonRenduCompteZero: config.nonRenduCompteZero,
  };
}

export async function releveDeLEleve(eleveId: string): Promise<Releve | null> {
  const session = await exigerSession();
  exigerPermission(session, 'notes.voir', { eleveId });

  const compte = (await utilisateurs().doc(eleveId).get()).data();
  if (compte === undefined) return null;

  const periodeId = await periodeCourante();
  const siennes = await notes()
    .where('eleveId', '==', eleveId)
    .where('periodeId', '==', periodeId)
    .get();

  // Un élève ne voit que ce qui est publié (2) : rien n'est visible avant que le professeur
  // ait publié, et c'est le serveur qui l'applique, pas l'écran.
  const seulementPubliees = session.utilisateurId === eleveId && session.roleCode === 'eleve';

  const detaillees = await Promise.all(
    siennes.docs.map(async (note) => {
      const donnees = note.data();
      const evaluation = (await evaluations().doc(donnees.evaluationId).get()).data();
      return evaluation === undefined ? null : { note: donnees, evaluation };
    }),
  );

  const retenues = detaillees
    .filter((entree) => entree !== null)
    .filter((entree) => !seulementPubliees || entree.evaluation.publiee);

  const options = await optionsDeCalcul();
  const parMatiere = new Map<string, LigneDeReleve[]>();

  for (const { note, evaluation } of retenues) {
    const lignes = parMatiere.get(evaluation.matiereNom) ?? [];
    lignes.push({
      evaluationId: note.evaluationId,
      titre: evaluation.titre,
      date: evaluation.date,
      valeurCentiemes: note.valeurCentiemes,
      baremeCentiemes: evaluation.baremeCentiemes,
      coefficient: evaluation.coefficient,
      statut: note.statut,
      priseEnCompte: note.priseEnCompte,
    });
    parMatiere.set(evaluation.matiereNom, lignes);
  }

  const calculable = (ligne: LigneDeReleve): NoteCalculable => ({
    valeurCentiemes: ligne.valeurCentiemes,
    baremeCentiemes: ligne.baremeCentiemes,
    coefficient: ligne.coefficient,
    statut: ligne.statut,
    priseEnCompte: ligne.priseEnCompte,
  });

  const matieres = [...parMatiere.entries()]
    .map(([matiereNom, lignes]) => ({
      matiereNom,
      lignes: [...lignes].sort((a, b) => b.date.localeCompare(a.date)),
      moyenne: moyenneMatiere(lignes.map(calculable), options),
    }))
    .sort((a, b) => a.matiereNom.localeCompare(b.matiereNom, 'fr'));

  return {
    eleveNom: `${compte.prenom} ${compte.nom}`.trim(),
    matieres,
    // Une matière sans moyenne sort du numérateur ET du dénominateur (4.1). Le coefficient de
    // matière vaut 1 : le champ existe sur les services, il n'est pas encore exploité.
    generale: moyenneGenerale(
      matieres.map((matiere) => ({ moyenne: matiere.moyenne, coefficient: 1 })),
    ),
  };
}

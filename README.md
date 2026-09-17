# CRAFTNOTE

Vie scolaire du serveur Minecraft RP **Mantes-la-Jolie** : notes, appréciations, avertissements et sanctions.

- **Hébergement** : GitHub Pages (site statique, aucune compilation)
- **Base de données et comptes** : Firebase (Authentication + Firestore)

## Structure

```
index.html          Page unique (accueil, connexions, espace élève, espace prof)
css/style.css       Styles
js/main.js          Point d'entrée : navigation et boutons
js/firebase.js      Configuration Firebase
js/auth.js          Connexion, déconnexion, profil connecté
js/students.js      Liste des élèves, lecture/écriture de leur dossier
js/grades.js        Notes
js/records.js       Appréciations, avertissements, sanctions
js/utils.js         Outils d'affichage
firestore.rules     Règles de sécurité Firestore
```

## Firestore

| Collection      | Contenu                                               |
|-----------------|-------------------------------------------------------|
| `profiles`      | Un document par compte (id = UID) : `nom`, `email`, `role` (`student` ou `teacher`) |
| `grades`        | Notes : `matiere`, `note`, `date`                     |
| `appreciations` | Appréciations : `texte`, `date`                       |
| `warnings`      | Avertissements : `texte`, `date`                      |
| `sanctions`     | Sanctions : `texte`, `date`                           |

Chaque note ou entrée contient aussi `eleveUid`, `eleveNom`, `eleveEmail`, `professeurUid`, `professeur` et `createdAt`.

## Ajouter un compte

1. Firebase Console → **Authentication** → Ajouter un utilisateur (e-mail + mot de passe).
2. Copier son **UID**.
3. **Firestore** → collection `profiles` → nouveau document avec cet UID comme id :
   `nom`, `email`, `role` = `student` ou `teacher`.

## Règles de sécurité

Le contenu de `firestore.rules` doit être copié dans Firebase Console → Firestore → **Règles**, puis publié.
Modifier ce fichier dans le repo ne change rien tant qu'il n'est pas publié dans la console.

## Tester en local

Les modules JavaScript ne fonctionnent pas en ouvrant `index.html` directement (`file://`).
Il faut lancer un petit serveur, par exemple l'extension VS Code **Live Server**, ou :

```
npx serve .
```

// Accès aux élèves et aux entrées de leur dossier (notes, avertissements...).

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

import { auth, db } from "./firebase.js";
import { requireTeacher } from "./auth.js";
import { byDateDesc } from "./utils.js";

export async function getStudents() {
  const snapshot = await getDocs(
    query(collection(db, "profiles"), where("role", "==", "student"))
  );

  const students = snapshot.docs.map((d) => ({
    uid: d.id,
    nom: d.data().nom || d.data().email || "Élève",
  }));

  return students.sort((a, b) => a.nom.localeCompare(b.nom, "fr"));
}

// Remplit un <select> avec la liste des élèves.
// Renvoie false si le formulaire n'est plus affiché ou si la liste est vide.
export async function fillStudentSelect(select) {
  let students;

  try {
    students = await getStudents();
  } catch (error) {
    console.error(error);
    select.innerHTML = `<option value="">Erreur de chargement</option>`;
    return false;
  }

  // L'utilisateur a changé de menu pendant le chargement.
  if (!select.isConnected) return false;

  if (students.length === 0) {
    select.innerHTML = `<option value="">Aucun élève trouvé</option>`;
    return false;
  }

  select.innerHTML = `<option value="">Choisir un élève</option>`;

  students.forEach((student) => {
    const option = document.createElement("option");
    option.value = student.uid;
    option.textContent = student.nom;
    select.appendChild(option);
  });

  return true;
}

// Ajoute une entrée (note, avertissement...) au dossier d'un élève.
// Renvoie le profil de l'élève.
export async function addStudentEntry(collectionName, eleveUid, fields) {
  const professeur = await requireTeacher();

  const eleveSnap = await getDoc(doc(db, "profiles", eleveUid));
  if (!eleveSnap.exists() || eleveSnap.data().role !== "student") {
    throw new Error("Élève introuvable.");
  }

  const eleve = eleveSnap.data();

  await addDoc(collection(db, collectionName), {
    ...fields,
    eleveUid,
    eleveNom: eleve.nom || "Élève",
    eleveEmail: eleve.email || "",
    professeurUid: professeur.uid,
    professeur: professeur.nom || professeur.email,
    createdAt: serverTimestamp(),
  });

  return eleve;
}

// Entrées d'une collection concernant l'élève connecté, les plus récentes d'abord.
export async function getMyEntries(collectionName) {
  const user = auth.currentUser;
  if (!user) throw new Error("Vous devez être connecté.");

  const snapshot = await getDocs(
    query(collection(db, collectionName), where("eleveUid", "==", user.uid))
  );

  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byDateDesc);
}

// Message lisible pour une erreur d'écriture/lecture Firestore.
export function errorMessage(error, fallback) {
  if (error.code === "permission-denied") {
    return "Accès refusé par Firebase (règles Firestore).";
  }
  return error.code ? fallback : error.message;
}

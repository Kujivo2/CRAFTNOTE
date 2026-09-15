import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://wootcoufwixfzpjznlct.supabase.co";
const SUPABASE_KEY = "sb_publishable_bE2j9C1RtcpJLxXqfrHyQg_cqsOLxDj";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (id) => document.getElementById(id);
const modal = $("accessModal");
const homeView = $("homeView");
const dashboardView = $("dashboardView");
const logoutButton = $("logoutButton");
const loginMessage = $("loginMessage");

function showModal() { modal.classList.remove("hidden"); $("emailInput").focus(); }
function closeModal() { modal.classList.add("hidden"); loginMessage.textContent = ""; }
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[char]));
}
function roleLabel(role) {
  return ({student:"Élève",teacher:"Professeur",admin:"Administrateur"})[role] || role || "Utilisateur";
}
function showMessage(text) { $("dashboardMessage").textContent = text; $("dashboardMessage").classList.remove("hidden"); }

$("openAccess").addEventListener("click", showModal);
$("closeAccess").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeModal(); });

$("loginForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  loginMessage.textContent = "Connexion en cours…";
  const { error } = await supabase.auth.signInWithPassword({
    email: $("emailInput").value.trim(),
    password: $("passwordInput").value
  });
  if (error) {
    loginMessage.textContent = "Connexion impossible : " + error.message;
    return;
  }
  closeModal();
  await loadDashboard();
});

logoutButton.addEventListener("click", async () => {
  await supabase.auth.signOut();
  dashboardView.classList.add("hidden");
  homeView.classList.remove("hidden");
  logoutButton.classList.add("hidden");
});

async function loadDashboard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    showMessage("Ton compte est connecté, mais aucun profil n’a encore été créé dans la table profiles.");
    $("welcomeTitle").textContent = "Bienvenue";
    $("profileSummary").textContent = user.email;
    $("roleBadge").textContent = "Profil non configuré";
    return;
  }

  homeView.classList.add("hidden");
  dashboardView.classList.remove("hidden");
  logoutButton.classList.remove("hidden");
  $("welcomeTitle").textContent = "Bonjour " + (profile.full_name || "à toi");
  $("profileSummary").textContent = [profile.class_name, user.email].filter(Boolean).join(" • ");
  $("roleBadge").textContent = roleLabel(profile.role);
  $("teacherPanel").classList.toggle("hidden", profile.role !== "teacher" && profile.role !== "admin");

  const studentId = profile.role === "student" ? user.id : null;
  await Promise.all([
    loadGrades(studentId),
    loadDiscipline(studentId),
    loadSchedule(profile.class_name)
  ]);
}

async function loadGrades(studentId) {
  const list = $("gradesList");
  if (!studentId) { list.innerHTML = '<p class="muted">Les notes d’un élève s’afficheront ici.</p>'; return; }
  const { data, error } = await supabase.from("grades").select("*").eq("student_id", studentId).order("created_at", {ascending:false});
  if (error) { list.innerHTML = '<p class="muted">Impossible de charger les notes.</p>'; return; }
  list.innerHTML = data?.length ? data.map(item => `
    <div class="data-item"><div><strong>${escapeHtml(item.subject)}</strong><small>${escapeHtml(item.comment || "Aucune appréciation")}</small></div><span class="data-value">${escapeHtml(item.grade)}/20</span></div>
  `).join("") : '<p class="muted">Aucune note pour le moment.</p>';
}

async function loadDiscipline(studentId) {
  const list = $("disciplineList");
  if (!studentId) { list.innerHTML = '<p class="muted">Les avertissements et sanctions d’un élève s’afficheront ici.</p>'; return; }
  const [warnings, sanctions] = await Promise.all([
    supabase.from("warnings").select("*").eq("student_id", studentId).order("created_at", {ascending:false}),
    supabase.from("sanctions").select("*").eq("student_id", studentId).order("created_at", {ascending:false})
  ]);
  const warningItems = (warnings.data || []).map(item => `<div class="data-item"><div><strong>Avertissement</strong><small>${escapeHtml(item.reason)}</small></div></div>`);
  const sanctionItems = (sanctions.data || []).map(item => `<div class="data-item"><div><strong>Sanction : ${escapeHtml(item.sanction_type)}</strong><small>${escapeHtml(item.reason)}</small></div></div>`);
  list.innerHTML = [...warningItems, ...sanctionItems].join("") || '<p class="muted">Aucun avertissement ou sanction.</p>';
}

async function loadSchedule(className) {
  const list = $("scheduleList");
  if (!className) { list.innerHTML = '<p class="muted">Aucune classe renseignée dans ton profil.</p>'; return; }
  const { data, error } = await supabase.from("schedules").select("*").eq("class_name", className).order("day_of_week").order("start_time");
  if (error) { list.innerHTML = '<p class="muted">Impossible de charger l’emploi du temps.</p>'; return; }
  list.innerHTML = data?.length ? data.map(item => `
    <div class="data-item"><div><strong>${escapeHtml(item.day_of_week)} — ${escapeHtml(item.subject)}</strong><small>${escapeHtml(item.start_time)} à ${escapeHtml(item.end_time)}${item.room ? " • Salle " + escapeHtml(item.room) : ""}</small></div></div>
  `).join("") : '<p class="muted">Aucun cours enregistré pour cette classe.</p>';
}

$("teacherForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("grades").insert({
    student_id: $("studentIdInput").value.trim(),
    teacher_id: user.id,
    subject: $("subjectInput").value.trim(),
    grade: Number($("gradeInput").value),
    comment: $("commentInput").value.trim() || null
  });
  if (error) {
    showMessage("La note n’a pas été ajoutée : " + error.message);
    return;
  }
  showMessage("La note a été ajoutée.");
  $("teacherForm").reset();
});

const { data: { session } } = await supabase.auth.getSession();
if (session) loadDashboard();
supabase.auth.onAuthStateChange((_event, nextSession) => {
  if (nextSession) loadDashboard();
});

/**
 * Seed runner pour Agri-ERP — Campagne 2025/2026
 * Converti depuis kadiar_seed.py
 * Usage: node kadiar_seed_runner.mjs
 */

const BASE_URL = "https://agri-erp-production.up.railway.app/api";
const TOKEN    = "30|uzBzBnQnM9xhn9TqNyOGC9gfg7IfR8Uq0Spi2kIc44be7bdb";

const HEADERS = {
  "Accept": "application/json",
  "Content-Type": "application/json",
  "Authorization": `Bearer ${TOKEN}`,
};

async function apiGet(endpoint) {
  const r = await fetch(`${BASE_URL}/${endpoint}`, { headers: HEADERS });
  if (!r.ok) {
    console.log(`  ❌ ERREUR ${r.status} sur GET ${endpoint}`);
    return [];
  }
  const res = await r.json();
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  return [];
}

async function apiPost(endpoint, data) {
  const r = await fetch(`${BASE_URL}/${endpoint}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(data),
  });
  if (![200, 201].includes(r.status)) {
    const text = await r.text();
    console.log(`  ❌ ERREUR ${r.status} sur POST ${endpoint}: ${text.slice(0, 200)}`);
    return null;
  }
  return r.json();
}

// ── 1. Vérification token ──────────────────────────────────────────────────────
async function login() {
  const r = await fetch(`${BASE_URL}/auth/user`, { headers: HEADERS });
  if (!r.ok) {
    console.log(`❌ Token invalide (${r.status})`);
    process.exit(1);
  }
  const user = await r.json();
  console.log(`✅ Authentifié : ${user.nom || user.name || "?"} (org: ${user.organisation?.nom || "?"})`);
}

// ── 2. Employés ───────────────────────────────────────────────────────────────
const EMPLOYES = [
  { nom: "Abdou Aziz Fall",       poste: "Gérant",  telephone: "775759378" },
  { nom: "Mandickou Fall",        poste: "Ouvrier",  telephone: null },
  { nom: "Ousmane Fall Sa Thies", poste: "Ouvrier",  telephone: null },
  { nom: "Amadou Diao Fall",      poste: "Ouvrier",  telephone: null },
  { nom: "Ablaye Fall Machine",   poste: null,       telephone: null },
  { nom: "Ablaye Fall",           poste: "Ouvrier",  telephone: null },
];

async function seedEmployes() {
  console.log("\n── Employés ──");
  const existants = await apiGet("employes");
  const existMap = Object.fromEntries(existants.map(e => [e.nom, e.id]));
  const ids = {};
  for (const e of EMPLOYES) {
    if (existMap[e.nom] !== undefined) {
      console.log(`  ⏭  ${e.nom} (existe déjà)`);
      ids[e.nom] = existMap[e.nom];
    } else {
      const res = await apiPost("employes", {
        nom: e.nom,
        poste: e.poste,
        telephone: e.telephone,
        salaire_mensuel_fcfa: 0,
      });
      if (res) {
        ids[e.nom] = res.id;
        console.log(`  ✅ ${e.nom} créé (id=${res.id})`);
      }
    }
  }
  return ids;
}

// ── 3. Financements → dépenses ────────────────────────────────────────────────
const FINANCEMENTS = [
  { employe_nom: "Abdou Aziz Fall",       montant_fcfa: 202000, motif: "Campagne oignon 2025-2026", date: "2026-04-08", remboursements: [] },
  { employe_nom: "Mandickou Fall",        montant_fcfa: 269000, motif: "Campagne oignon 2025-2026", date: "2026-04-08", remboursements: [] },
  { employe_nom: "Ousmane Fall Sa Thies", montant_fcfa: 317000, motif: "Campagne oignon 2025-2026", date: "2026-04-08", remboursements: [] },
  { employe_nom: "Amadou Diao Fall",      montant_fcfa: 289000, motif: "Campagne oignon 2025-2026", date: "2026-04-08", remboursements: [] },
  { employe_nom: "Ablaye Fall Machine",   montant_fcfa:  61000, motif: "Campagne oignon 2025-2026", date: "2026-04-08", remboursements: [] },
  { employe_nom: "Ablaye Fall",           montant_fcfa: 310000, motif: "Campagne oignon 2025-2026", date: "2026-04-08",
    remboursements: [{ montant_fcfa: 310000, date: "2026-04-08" }] },
];

async function seedFinancements() {
  console.log("\n── Financements → dépenses (avances employés) ──");
  let total = 0;
  for (const f of FINANCEMENTS) {
    let desc = `Avance à ${f.employe_nom} — ${f.motif}`;
    if (f.remboursements.length) {
      const r = f.remboursements[0];
      desc += ` [remboursé ${r.montant_fcfa.toLocaleString()} FCFA le ${r.date}]`;
    }
    const res = await apiPost("depenses", {
      champ_id: null,
      categorie: "autre",
      description: desc,
      montant_fcfa: f.montant_fcfa,
      date_depense: f.date,
    });
    if (res) {
      total++;
      console.log(`  ✅ Avance ${f.employe_nom} — ${f.montant_fcfa.toLocaleString()} FCFA`);
    }
  }
  console.log(`  → ${total} financement(s) enregistré(s) comme dépenses`);
}

// ── 4. Dépenses ───────────────────────────────────────────────────────────────
const DEPENSES = [
  // Octobre 2025
  ["Ablaye Fall","traitement_phytosanitaire","traitement Ablaye Fall",13500,"2025-10-01"],
  ["Yokh","traitement_phytosanitaire","traitement yokhe Selec",40000,"2025-10-01"],
  [null,"autre","Dépenses diverses",2500,"2025-10-01"],
  [null,"carburant","Essence tricycle",10000,"2025-10-01"],
  [null,"main_oeuvre","Main-d'oeuvre 0,90 ha",54000,"2025-10-01"],
  [null,"main_oeuvre","Main-d'oeuvre 0,55 ha",33000,"2025-10-01"],
  [null,"main_oeuvre","Dépenses répigage 2jr",10000,"2025-10-01"],
  ["Ablaye Fall","carburant","Gazoil Ablay",10000,"2025-10-01"],
  ["Ablaye Fall","carburant","Gazoil Ablaye",10000,"2025-10-01"],
  [null,"carburant","Essence tricycle",10000,"2025-10-01"],
  ["Yokh","traitement_phytosanitaire","traitement yokhe",27000,"2025-10-01"],
  [null,"carburant","Essence tricycle",13000,"2025-10-15"],
  ["Ablaye Fall","autre","Dépenses Ablay Tlb 2j",10000,"2025-10-15"],
  ["Yokh","autre","Dépenses yokhe Bay",40000,"2025-10-15"],
  ["Projet","carburant","Gazoil projet",10000,"2025-10-15"],
  ["Projet","main_oeuvre","Coup-coup projet",4000,"2025-10-15"],
  [null,"carburant","Essence tricycle",5000,"2025-10-15"],
  [null,"main_oeuvre","Main-d'oeuvre Tlb",44000,"2025-10-15"],
  ["Ablaye Fall","autre","Dépenses Tlb Ablay",5000,"2025-10-15"],
  [null,"entretien_materiel","Entretien tricycle",6000,"2025-10-15"],
  [null,"carburant","Essence tricycle",10000,"2025-10-15"],
  ["Yokh","carburant","Gazoil yokhe",10000,"2025-10-15"],
  // Novembre 2025
  ["Yokh","autre","Dépenses Ablay Yokhe",5000,"2025-11-01"],
  [null,"carburant","Essence tricycle",5000,"2025-11-01"],
  ["Yokh","carburant","Gazoil yokhe",5000,"2025-11-01"],
  [null,"autre","Dépenses diverses",5000,"2025-11-01"],
  [null,"entretien_materiel","Moto pompe",12000,"2025-11-01"],
  ["Yokh","main_oeuvre","Ripage tomates yokhe",9000,"2025-11-01"],
  [null,"carburant","Essence tricycle",10000,"2025-11-01"],
  [null,"main_oeuvre","Moto pompe + main-d'oeuvre",15000,"2025-11-01"],
  ["Yokh","carburant","Gazoil yokhe",5000,"2025-11-01"],
  ["Razel","traitement_phytosanitaire","Traitement Razel",17000,"2025-11-01"],
  ["Razel","main_oeuvre","Journalier Razel",12500,"2025-11-01"],
  ["Razel","carburant","Essence moto Razel",12000,"2025-11-01"],
  ["Razel","alimentation_betail","Aliment rakal Razel",10000,"2025-11-01"],
  ["Razel","autre","Mode fouk Razel",5000,"2025-11-01"],
  ["Razel","main_oeuvre","Journalier Razel",10000,"2025-11-01"],
  ["Razel","traitement_phytosanitaire","Traitement Razel",20000,"2025-11-01"],
  ["Razel","carburant","Essence Razel",12000,"2025-11-01"],
  ["Razel","autre","Dépenses Razel",4000,"2025-11-01"],
  ["Razel","main_oeuvre","Talibé répigage Razel",15000,"2025-11-01"],
  ["Razel","carburant","Essence moto Razel",5000,"2025-11-01"],
  [null,"entretien_materiel","Moto pompe",17000,"2025-11-15"],
  [null,"autre","Dépenses diverses",3000,"2025-11-15"],
  ["Yokh","carburant","Essence yokhe",5000,"2025-11-15"],
  [null,"autre","Marabout Sarah",35000,"2025-11-15"],
  [null,"transport","Transport engrais",20000,"2025-11-15"],
  [null,"transport","Transport engrais",20000,"2025-11-15"],
  ["Yokh","traitement_phytosanitaire","Traitement yokhe",20000,"2025-11-15"],
  ["Ablaye Fall","traitement_phytosanitaire","Traitement Ablaye",5000,"2025-11-15"],
  [null,"autre","Dépenses diverses",3000,"2025-11-15"],
  ["Ablaye Fall","traitement_phytosanitaire","Traitement Ablaye",14000,"2025-11-15"],
  [null,"entretien_materiel","Dépenage moto",32500,"2025-11-15"],
  ["Ablaye Fall","traitement_phytosanitaire","Traitement Ablaye Fall",20000,"2025-11-15"],
  [null,"autre","Marabout sarax",3500,"2025-11-15"],
  [null,"carburant","Essence tricycle",10000,"2025-11-15"],
  // Décembre 2025
  [null,"carburant","Essence tricycle",10000,"2025-12-01"],
  ["Projet","carburant","Gazoil projet",10000,"2025-12-01"],
  [null,"alimentation_betail","Aliment rakal",20000,"2025-12-01"],
  ["Yokh","carburant","Gazoil yokhe",10000,"2025-12-01"],
  ["Ablaye Fall","carburant","Gazoil Ablaye",10000,"2025-12-01"],
  ["Ablaye Fall","carburant","Gazoil Ablaye Fall",7000,"2025-12-01"],
  [null,"carburant","Essence tricycle",10000,"2025-12-01"],
  ["Yokh","traitement_phytosanitaire","Traitement yokhe safir",30000,"2025-12-01"],
  [null,"entretien_materiel","Assane mécanicien",7000,"2025-12-01"],
  [null,"alimentation_betail","40 litres aliment",14000,"2025-12-01"],
  [null,"autre","Dépenses diverses",5000,"2025-12-01"],
  ["Yokh","carburant","Gazoil yokhe",10000,"2025-12-01"],
  ["Ablaye Fall","carburant","Gazoil Ablay",10000,"2025-12-01"],
  [null,"carburant","Essence tricycle",10000,"2025-12-01"],
  ["Projet","carburant","Gazoil projet",5000,"2025-12-15"],
  ["Yokh","carburant","Gazoil yokhe",10000,"2025-12-15"],
  ["Ablaye Fall","carburant","Gazoil Ablay Fall",10000,"2025-12-15"],
  [null,"entretien_materiel","Huile moto pompe",4000,"2025-12-15"],
  [null,"carburant","Essence tricycle",10000,"2025-12-15"],
  [null,"traitement_phytosanitaire","Safir plus Slec traitement",22000,"2025-12-15"],
  [null,"autre","Dépenses diverses",5000,"2025-12-15"],
  ["Yokh","carburant","Gazoil yokhe",8000,"2025-12-15"],
  ["Ablaye Fall","carburant","Gazoil Ablay",10000,"2025-12-15"],
  ["Projet","carburant","Gazoil projet",5000,"2025-12-15"],
  ["Projet","main_oeuvre","Travaux projet",48000,"2025-12-15"],
  // Janvier 2026
  [null,"entretien_materiel","Entretien moto pompe",40000,"2026-01-01"],
  [null,"main_oeuvre","Main-d'oeuvre mécanicien",20000,"2026-01-01"],
  [null,"carburant","Gazoil",3000,"2026-01-01"],
  [null,"carburant","Essence tricycle",5000,"2026-01-01"],
  ["Projet","carburant","Gazoil projet",5000,"2026-01-01"],
  ["Ablaye Fall","carburant","Gazoil Ablay Fall",10000,"2026-01-01"],
  ["Yokh","frais_recolte","Frais récolte yokhe",13500,"2026-01-01"],
  ["Ablaye Fall","frais_recolte","Frais récolte Ablay",42500,"2026-01-01"],
  [null,"entretien_materiel","Roulement moto pompe",4000,"2026-01-01"],
  [null,"carburant","Gazoil",10000,"2026-01-01"],
  [null,"autre","Dépenses diverses",20000,"2026-01-15"],
  [null,"entretien_materiel","Moto pompe",25000,"2026-01-15"],
  [null,"main_oeuvre","Aliment ripase 10 sacs",70000,"2026-01-15"],
  [null,"alimentation_betail","Rakal 3 sacs",30000,"2026-01-15"],
  ["Yokh","frais_recolte","Frais récolte yokhe",79000,"2026-01-15"],
  [null,"carburant","Essence tricycle",10000,"2026-01-15"],
  [null,"carburant","Gazoil",15000,"2026-01-15"],
  [null,"alimentation_betail","Rakal aliment",10000,"2026-01-15"],
  ["Ablaye Fall","traitement_phytosanitaire","Traitement Ablaye",9500,"2026-01-15"],
  ["Yokh","traitement_phytosanitaire","Traitement yokhe",7500,"2026-01-15"],
  [null,"alimentation_betail","Aliment rakal",8000,"2026-01-15"],
  ["Yokh","frais_recolte","Frais récolte yokhe",36000,"2026-01-15"],
  ["Razel","main_oeuvre","Journalier Razel",15000,"2026-01-15"],
  ["Razel","carburant","Essence moto Razel",12000,"2026-01-15"],
  ["Ablaye Fall","carburant","Gazoil Ablay",5000,"2026-01-15"],
  ["Razel","entretien_materiel","Entretien moto Razel",55000,"2026-01-15"],
  ["Razel","carburant","Essence moto Razel",6000,"2026-01-15"],
  ["Razel","carburant","Essence moto Razel",12000,"2026-01-15"],
  ["Razel","frais_recolte","1er frais récolte Razel",11000,"2026-01-15"],
  ["Razel","frais_recolte","2e et 3e frais récolte Razel",27000,"2026-01-15"],
  // Février 2026
  [null,"autre","Sarah",2300,"2026-02-01"],
  ["Yokh","traitement_phytosanitaire","Traitement yokhe",15000,"2026-02-01"],
  [null,"autre","Dépenses diverses",4000,"2026-02-01"],
  [null,"autre","Dépenses diakarta",13000,"2026-02-01"],
  ["Yokh","carburant","Gazoil yokhe",5000,"2026-02-01"],
  [null,"carburant","Essence tricycle",5000,"2026-02-01"],
  [null,"entretien_materiel","Moto pompe",4000,"2026-02-01"],
  [null,"entretien_materiel","Entretien tricycle",4000,"2026-02-01"],
  ["Yokh","transport","Transport yokhe oignons",10000,"2026-02-01"],
  ["Yokh","main_oeuvre","Main-d'oeuvre yokhe",51000,"2026-02-01"],
  ["Yokh","transport","Transport yokhe",15000,"2026-02-01"],
  ["Ablaye Fall","carburant","Gazoil Ablay Fall",10000,"2026-02-01"],
  [null,"entretien_materiel","Entretien moto",15000,"2026-02-01"],
  [null,"alimentation_betail","Rakal aliment",10000,"2026-02-01"],
  ["Ablaye Fall","traitement_phytosanitaire","Traitement Ablaye Fall Slec",40000,"2026-02-01"],
  [null,"autre","Dépenses diverses",6000,"2026-02-01"],
  [null,"entretien_materiel","Dépenage tricycle",32000,"2026-02-01"],
  ["Ablaye Fall","traitement_phytosanitaire","Traitement foliaire Ablay",4000,"2026-02-01"],
  ["Yokh","traitement_phytosanitaire","Traitement foliaire yokhe",8000,"2026-02-01"],
  ["Yokh","traitement_phytosanitaire","Traitement canal yokhe",6000,"2026-02-01"],
  ["Ablaye Fall","traitement_phytosanitaire","Traitement canal Ablay",6000,"2026-02-01"],
  [null,"carburant","Essence tricycle",10000,"2026-02-01"],
  ["Razel","main_oeuvre","Nettoyage citron Razel",27500,"2026-02-15"],
  ["Razel","main_oeuvre","Journalier tomates et oignons Razel",25000,"2026-02-15"],
  ["Razel","traitement_phytosanitaire","Traitement citron 2L Razel",14000,"2026-02-15"],
  ["Razel","traitement_phytosanitaire","Traitement tomates Razel",18000,"2026-02-15"],
  ["Razel","carburant","Essence moto Razel",12000,"2026-02-15"],
  [null,"carburant","Essence tricycle",10000,"2026-02-15"],
  [null,"entretien_materiel","Porte module",3000,"2026-02-15"],
  ["Ablaye Fall","carburant","Gazoil et huile Ablay",9500,"2026-02-15"],
  ["Projet","carburant","Gazoil projet",5000,"2026-02-15"],
  [null,"autre","Dépenses diverses",5000,"2026-02-15"],
  [null,"entretien_materiel","Entretien moto pompe",50500,"2026-02-15"],
  [null,"carburant","Essence gazoil",7000,"2026-02-15"],
  ["Ablaye Fall","carburant","Gazoil Ablay",10000,"2026-02-15"],
  ["Yokh","carburant","Gazoil yokhe",15000,"2026-02-15"],
  [null,"autre","Dépenses diverses",4000,"2026-02-15"],
  [null,"main_oeuvre","Main-d'oeuvre entretien",15000,"2026-02-15"],
  // Mars 2026
  [null,"traitement_phytosanitaire","Titen 3 litres traitement",39000,"2026-03-01"],
  ["Yokh","traitement_phytosanitaire","Traitement yokhe safir",43000,"2026-03-01"],
  ["Ablaye Fall","traitement_phytosanitaire","Traitement Ablay safir",21000,"2026-03-01"],
  ["Ablaye Fall","traitement_phytosanitaire","Clifader traitement Ablay",6000,"2026-03-01"],
  ["Yokh","traitement_phytosanitaire","Clifader yokhe",6000,"2026-03-01"],
  [null,"carburant","Essence tricycle",13000,"2026-03-01"],
  [null,"main_oeuvre","Maçon",15000,"2026-03-01"],
  [null,"materiel","Ciment 8 sacs",30400,"2026-03-01"],
  [null,"autre","Dépenses diverses",5000,"2026-03-01"],
  [null,"carburant","Gazoil",10000,"2026-03-01"],
  [null,"traitement_phytosanitaire","Semences tomates et traitements",14000,"2026-03-01"],
  ["Yokh","main_oeuvre","Journalier yokhe",7500,"2026-03-01"],
  ["Ablaye Fall","main_oeuvre","Journalier Ablay",10000,"2026-03-01"],
  [null,"autre","Dépenses déjeuner",3000,"2026-03-01"],
  [null,"carburant","Essence tricycle",10000,"2026-03-01"],
  ["Razel","main_oeuvre","Journalier Razel répigage",20000,"2026-03-01"],
  [null,"carburant","Essence tricycle",10000,"2026-03-01"],
  [null,"entretien_materiel","Huile moteur",10000,"2026-03-01"],
  [null,"entretien_materiel","3 porte module",31250,"2026-03-01"],
  [null,"main_oeuvre","Main-d'oeuvre",12000,"2026-03-01"],
  [null,"main_oeuvre","Maçon",15000,"2026-03-01"],
  [null,"materiel","Charge sable",15000,"2026-03-01"],
  [null,"materiel","3 barres fer 6",5300,"2026-03-01"],
  [null,"materiel","4 pelles",2000,"2026-03-01"],
  [null,"autre","Dépenses diverses",3000,"2026-03-01"],
  [null,"carburant","Gazoil",30000,"2026-03-01"],
  [null,"carburant","Gazoil",10000,"2026-03-01"],
  ["Razel","autre","Dépenses Razel",3000,"2026-03-15"],
  ["Razel","entretien_materiel","Rouleau enjou + transport Razel",46000,"2026-03-15"],
  ["Razel","materiel","Obsette Razel",65000,"2026-03-15"],
  ["Razel","carburant","Essence Razel",6000,"2026-03-15"],
  ["Razel","materiel","Tuyau menssion 63/50 Razel",13500,"2026-03-15"],
  ["Razel","materiel","Corde 64m Razel",8000,"2026-03-15"],
  ["Razel","autre","Dépenses Razel",4000,"2026-03-15"],
  ["Razel","main_oeuvre","Aliment ripas Razel",7000,"2026-03-15"],
  ["Razel","main_oeuvre","Ordenace Seydou Razel",15000,"2026-03-15"],
  ["Razel","materiel","2 van ger Razel",9000,"2026-03-15"],
  ["Razel","carburant","Essence Razel",6000,"2026-03-15"],
  ["Razel","entretien_materiel","Huile Razel",4000,"2026-03-15"],
  [null,"autre","Marabout sud",25000,"2026-03-15"],
  [null,"transport","Transport Makha",5000,"2026-03-15"],
  [null,"autre","Marabout sud",22000,"2026-03-15"],
  [null,"traitement_phytosanitaire","Traitement",21000,"2026-03-15"],
  [null,"entretien_materiel","Dépenage moto",186000,"2026-03-15"],
  [null,"materiel","Paire d'arrosoirs",12000,"2026-03-15"],
  [null,"entretien_materiel","Entretien tricycle",28000,"2026-03-15"],
  [null,"carburant","Essence",15000,"2026-03-15"],
  [null,"transport","Transport compost",10000,"2026-03-15"],
  ["Razel","alimentation_betail","1 sac rakal Razel",10500,"2026-03-15"],
  [null,"carburant","Essence",10000,"2026-03-15"],
  [null,"transport","Transport Tywo",15000,"2026-03-15"],
  [null,"carburant","Essence",5000,"2026-03-15"],
  // Avril 2026
  ["Yokh","frais_recolte","Frais De Récolte Tomate particulier",79000,"2026-04-08"],
];

async function seedDepenses(champIds) {
  console.log("\n── Dépenses (202 entrées) ──");
  let total = 0;
  const ignores = [];
  for (const [champNom, cat, desc, montant, date] of DEPENSES) {
    const champId = champNom ? champIds[champNom] : null;
    if (champNom && champId === undefined) ignores.push(champNom);
    const res = await apiPost("depenses", {
      champ_id: champId ?? null,
      categorie: cat,
      description: desc,
      montant_fcfa: montant,
      date_depense: date,
    });
    if (res) total++;
  }
  console.log(`  ✅ ${total} dépenses créées`);
  if (ignores.length) {
    const manquants = [...new Set(ignores)].sort();
    console.log(`  ⚠  champs non trouvés : ${manquants.join(", ")}`);
  }
}

// ── 5. Ventes ─────────────────────────────────────────────────────────────────
const VENTES = [
  ["Yokh","Tomate",2480,   59.5,"2026-04-08","1) 90 caisses"],
  ["Yokh","Tomate",2370,   59.5,"2026-04-08","2) 90 caisses"],
  ["Yokh","Tomate",2220,   59.5,"2026-04-08","3) 90 caisses"],
  ["Yokh","Tomate",2510,   59.5,"2026-04-08","4) 90 caisses"],
  ["Ablaye Fall","Tomate",2450,59.5,"2026-04-08","1) 90 caisses"],
  ["Ablaye Fall","Tomate",1950,59.5,"2026-04-08","2) 70 caisses"],
  ["Ablaye Fall","Tomate",2390,59.5,"2026-04-08","3) 90 Caisses"],
  ["Ablaye Fall","Tomate",2440,59.5,"2026-04-08","4) 90 Caisses"],
  ["Razel","Tomate",2400,  59.5,"2026-04-08","1) 90 Caisses"],
  ["Razel","Tomate",2430,  59.5,"2026-04-08","2) 90 Caisses"],
  ["Razel","Tomate",760,   59.5,"2026-04-08","3) 30 Caisses"],
  ["Razel","Tomate",2130,  59.5,"2026-04-08","4) 80 Caisses"],
  ["Razel","Tomate",2080,  59.5,"2026-04-08","5) 80 Caisses"],
  ["Yokh","Tomate",3466.66,269.71,"2026-04-08","Récolte Tomate Particulier petit cargo 270 grand cargo 180"],
  ["Yokh","Oignon",187,   5000,"2026-04-08","Récolte Oignon Champs Yokh ( Environ 190 Sacs)"],
];

async function seedVentes(champIds) {
  console.log("\n── Ventes (15 entrées) ──");
  let total = 0;
  for (const [champNom, produit, qte, prix, date, notes] of VENTES) {
    const champId = champIds[champNom];
    const res = await apiPost("ventes", {
      champ_id: champId ?? null,
      produit,
      quantite_kg: qte,
      prix_unitaire_fcfa: prix,
      date_vente: date,
      notes,
    });
    if (res) total++;
  }
  console.log(`  ✅ ${total} ventes créées`);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
console.log("=".repeat(60));
console.log("  SEED AGRI-ERP — Campagne 2025/2026");
console.log("=".repeat(60));

await login();

const champsData = await apiGet("champs");
if (!champsData.length) {
  console.log("❌ Aucun champ trouvé.");
  process.exit(1);
}
const champIds = Object.fromEntries(champsData.map(c => [c.nom, c.id]));
console.log(`\nChamps trouvés : ${Object.keys(champIds).join(", ")}`);

const manquants = ["Yokh","Ablaye Fall","Razel","Projet"].filter(n => !champIds[n]);
if (manquants.length) console.log(`⚠  Champs manquants : ${manquants.join(", ")}`);

await seedEmployes();
await seedFinancements();
await seedDepenses(champIds);
await seedVentes(champIds);

console.log("\n" + "=".repeat(60));
console.log("  SEED TERMINÉ");
console.log("=".repeat(60));

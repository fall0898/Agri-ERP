/**
 * Export complet de la base de données Render → fichier .sql
 * Usage: node export_db.mjs
 * Génère: backup_YYYY-MM-DD.sql
 */

import { writeFileSync } from 'fs';

const BASE_URL = 'https://agri-erp-q9g1.onrender.com/api';
const LOGIN_TEL = '770809798'; // ton numéro super_admin
const LOGIN_PWD = process.argv[2] || '';

if (!LOGIN_PWD) {
  console.error('Usage: node export_db.mjs <ton_mot_de_passe>');
  process.exit(1);
}

async function request(method, path, token, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (res.status === 401) throw new Error('Non authentifié');
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { _raw: text }; }
}

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')}'`;
}

function toInserts(table, rows) {
  if (!rows || rows.length === 0) return `-- (aucune donnée dans ${table})\n`;
  const cols = Object.keys(rows[0]);
  const header = `INSERT INTO \`${table}\` (\`${cols.join('`,`')}\`) VALUES\n`;
  const values = rows.map(row =>
    '  (' + cols.map(c => esc(row[c])).join(', ') + ')'
  ).join(',\n');
  return header + values + ';\n';
}

async function main() {
  console.log('🔐 Connexion...');
  const loginRes = await request('POST', '/auth/login', null, {
    telephone: LOGIN_TEL,
    password: LOGIN_PWD,
  });
  const token = loginRes.token;
  if (!token) {
    console.error('❌ Connexion échouée:', loginRes.message || JSON.stringify(loginRes));
    process.exit(1);
  }
  console.log('✅ Connecté');

  const lines = [];
  const date = new Date().toISOString().slice(0, 10);

  lines.push(`-- ============================================================`);
  lines.push(`-- Agri-ERP — Backup complet`);
  lines.push(`-- Date: ${new Date().toISOString()}`);
  lines.push(`-- URL: ${BASE_URL}`);
  lines.push(`-- ============================================================\n`);
  lines.push(`SET FOREIGN_KEY_CHECKS=0;\n`);

  // ── Super-admin fetch : organisations + users ──────────────────
  console.log('📦 Organisations...');
  const tenantsRes = await request('GET', '/admin/tenants?per_page=200', token);
  const orgs = tenantsRes?.data?.data ?? tenantsRes?.data ?? [];
  lines.push(`\n-- TABLE: organisations (${orgs.length} lignes)`);
  lines.push(toInserts('organisations', orgs.map(o => ({
    id: o.id, nom: o.nom, slug: o.slug, email_contact: o.email_contact,
    telephone: o.telephone, devise: o.devise ?? 'FCFA',
    plan: o.plan, plan_expire_at: o.plan_expire_at ?? null,
    periode_essai_fin: o.periode_essai_fin ?? null,
    est_active: o.est_active ? 1 : 0, est_suspendue: o.est_suspendue ? 1 : 0,
    campagne_debut_mois: o.campagne_debut_mois ?? 10,
    campagne_debut_jour: o.campagne_debut_jour ?? 1,
    pays: o.pays ?? null, region: o.region ?? null,
    superficie_totale: o.superficie_totale ?? null,
    type_agriculture: o.type_agriculture ?? null,
    created_at: o.created_at, updated_at: o.updated_at,
  }))));

  console.log('👥 Utilisateurs...');
  const usersRes = await request('GET', '/admin/users', token);
  const users = Array.isArray(usersRes) ? usersRes : usersRes?.data ?? [];
  lines.push(`\n-- TABLE: users (${users.length} lignes)`);
  lines.push(toInserts('users', users.map(u => ({
    id: u.id, organisation_id: u.organisation?.id ?? null,
    nom: u.nom, prenom: u.prenom ?? null,
    email: u.email ?? null, telephone: u.telephone ?? null,
    role: u.role, est_actif: u.est_actif ? 1 : 0,
    onboarding_complete: u.onboarding_complete ? 1 : 0,
    preferences_notification: u.preferences_notification ? JSON.stringify(u.preferences_notification) : null,
    created_at: u.created_at, updated_at: u.updated_at,
  }))));

  // ── Données par organisation ───────────────────────────────────
  for (const org of orgs) {
    // On se connecte en tant qu'admin de chaque org si possible
    // Pour les données Kadiar (#1), on utilise le token super_admin (ResolveTenant bypass)
    const orgId = org.id;
    console.log(`\n🌾 Org #${orgId} — ${org.nom}`);

    const endpoints = [
      { path: `/champs`,   table: 'champs',   key: null },
      { path: `/cultures`, table: 'cultures',  key: 'data' },
      { path: `/employes`, table: 'employes',  key: null },
      { path: `/stocks`,   table: 'stocks',    key: null },
      { path: `/intrants`, table: 'intrants',  key: null },
      { path: `/campagnes`,table: 'campagnes_agricoles', key: null },
    ];

    // Pour les données de l'org, on se reconnecte avec un user de cette org
    // ou on utilise les sub-routes champs/{id}/...
    // Approche: utiliser le token super_admin + ResolveTenant bypass
    // Note: super_admin bypasse TenantScope donc ces appels retournent toutes les données

    for (const ep of endpoints) {
      try {
        const res = await request('GET', ep.path, token);
        let rows = Array.isArray(res) ? res : (res?.data?.data ?? res?.data ?? res ?? []);
        if (!Array.isArray(rows)) rows = [];
        // Filtrer par org
        rows = rows.filter(r => !r.organisation_id || r.organisation_id === orgId);
        if (rows.length > 0) {
          lines.push(`\n-- TABLE: ${ep.table} (org #${orgId} — ${rows.length} lignes)`);
          lines.push(toInserts(ep.table, rows));
        }
        process.stdout.write(`  ✓ ${ep.table}: ${rows.length}\n`);
      } catch(e) {
        process.stdout.write(`  ⚠️  ${ep.table}: ${e.message}\n`);
      }
    }

    // Ventes et dépenses (format paginé)
    for (const ep of [
      { path: '/ventes',   table: 'ventes'   },
      { path: '/depenses', table: 'depenses'  },
    ]) {
      try {
        const res = await request('GET', ep.path + '?per_page=1000', token);
        let rows = res?.data ?? [];
        if (!Array.isArray(rows)) rows = [];
        rows = rows.filter(r => !r.organisation_id || r.organisation_id === orgId);
        if (rows.length > 0) {
          lines.push(`\n-- TABLE: ${ep.table} (org #${orgId} — ${rows.length} lignes)`);
          lines.push(toInserts(ep.table, rows));
        }
        process.stdout.write(`  ✓ ${ep.table}: ${rows.length}\n`);
      } catch(e) {
        process.stdout.write(`  ⚠️  ${ep.table}: ${e.message}\n`);
      }
    }

    // Mouvements stocks via champs
    try {
      const champsRes = await request('GET', '/champs', token);
      const champs = (Array.isArray(champsRes) ? champsRes : []).filter(c => c.organisation_id === orgId);
      const stocksRes = await request('GET', '/stocks', token);
      const stocks = (Array.isArray(stocksRes) ? stocksRes : []).filter(s => s.organisation_id === orgId);

      const allMouvements = [];
      for (const stock of stocks) {
        try {
          const mvRes = await request('GET', `/stocks/${stock.id}/mouvements`, token);
          const mv = Array.isArray(mvRes) ? mvRes : [];
          allMouvements.push(...mv);
        } catch {}
      }
      if (allMouvements.length > 0) {
        lines.push(`\n-- TABLE: mouvements_stock (org #${orgId} — ${allMouvements.length} lignes)`);
        lines.push(toInserts('mouvements_stock', allMouvements));
      }
      process.stdout.write(`  ✓ mouvements_stock: ${allMouvements.length}\n`);
    } catch(e) {
      process.stdout.write(`  ⚠️  mouvements_stock: ${e.message}\n`);
    }

    // Tâches, salaires, financements
    for (const ep of [
      { path: '/taches',  table: 'taches'  },
      { path: '/salaires',table: 'paiements_salaires' },
    ]) {
      try {
        const res = await request('GET', ep.path, token);
        let rows = Array.isArray(res) ? res : (res?.data ?? []);
        if (!Array.isArray(rows)) rows = [];
        rows = rows.filter(r => !r.organisation_id || r.organisation_id === orgId);
        if (rows.length > 0) {
          lines.push(`\n-- TABLE: ${ep.table} (org #${orgId} — ${rows.length} lignes)`);
          lines.push(toInserts(ep.table, rows));
        }
        process.stdout.write(`  ✓ ${ep.table}: ${rows.length}\n`);
      } catch(e) {
        process.stdout.write(`  ⚠️  ${ep.table}: ${e.message}\n`);
      }
    }

    // Médias
    try {
      const res = await request('GET', `/medias`, token);
      let rows = Array.isArray(res) ? res : [];
      if (rows.length > 0) {
        lines.push(`\n-- TABLE: medias (org #${orgId} — ${rows.length} lignes)`);
        lines.push(toInserts('medias', rows));
      }
      process.stdout.write(`  ✓ medias: ${rows.length}\n`);
    } catch(e) {
      process.stdout.write(`  ⚠️  medias: ${e.message}\n`);
    }
  }

  lines.push(`\nSET FOREIGN_KEY_CHECKS=1;\n`);
  lines.push(`-- ============================================================`);
  lines.push(`-- Fin du backup — ${new Date().toISOString()}`);
  lines.push(`-- ============================================================\n`);

  const filename = `backup_${date}.sql`;
  writeFileSync(filename, lines.join('\n'), 'utf8');
  console.log(`\n✅ Backup exporté → ${filename}`);
}

main().catch(err => { console.error('❌', err.message); process.exit(1); });

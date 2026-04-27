/**
 * Export des données de l'org Dia 1 via l'API
 * Usage: node export_org.mjs <token>
 */
import { writeFileSync } from 'fs';

const BASE = 'https://agri-erp-q9g1.onrender.com/api';
const TOKEN = process.argv[2] || '';
if (!TOKEN) { console.error('Usage: node export_org.mjs <token>'); process.exit(1); }

function esc(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? '1' : '0';
  if (typeof v === 'number') return String(v);
  return "'" + String(v).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r') + "'";
}

function toInserts(table, rows) {
  if (!rows || rows.length === 0) return `-- (aucune donnée dans ${table})\n`;
  const cols = Object.keys(rows[0]);
  return `INSERT INTO \`${table}\` (\`${cols.join('`,`')}\`) VALUES\n` +
    rows.map(r => '  (' + cols.map(c => esc(r[c])).join(', ') + ')').join(',\n') + ';\n';
}

async function req(path) {
  const r = await fetch(BASE + path, {
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Accept': 'application/json' }
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return {}; }
}

async function main() {
  const lines = [];
  const date = new Date().toISOString().slice(0, 10);

  lines.push(`-- ============================================================`);
  lines.push(`-- Agri-ERP — Backup Org: Dia 1`);
  lines.push(`-- Date: ${new Date().toISOString()}`);
  lines.push(`-- ============================================================\n`);
  lines.push(`SET FOREIGN_KEY_CHECKS=0;\n`);

  const endpoints = [
    { path: '/champs',            table: 'champs',    parse: r => Array.isArray(r) ? r : r.data?.data ?? r.data ?? [] },
    { path: '/cultures',          table: 'cultures',  parse: r => Array.isArray(r) ? r : r.data?.data ?? r.data ?? [] },
    { path: '/stocks',            table: 'stocks',    parse: r => Array.isArray(r) ? r : r.data ?? [] },
    { path: '/employes',          table: 'employes',  parse: r => Array.isArray(r) ? r : r.data ?? [] },
    { path: '/taches',            table: 'taches',    parse: r => Array.isArray(r) ? r : r.data ?? [] },
    { path: '/intrants',          table: 'intrants',  parse: r => Array.isArray(r) ? r : r.data ?? [] },
    { path: '/campagnes',         table: 'campagnes_agricoles', parse: r => Array.isArray(r) ? r : r.data ?? [] },
    { path: '/depenses?per_page=1000', table: 'depenses', parse: r => r.data ?? [] },
    { path: '/ventes?per_page=1000',   table: 'ventes',   parse: r => r.data ?? [] },
    { path: '/salaires',          table: 'paiements_salaires', parse: r => Array.isArray(r) ? r : r.data ?? [] },
  ];

  for (const ep of endpoints) {
    try {
      const res = await req(ep.path);
      const rows = ep.parse(res);
      lines.push(`\n-- TABLE: ${ep.table} (${rows.length} lignes)`);
      lines.push(toInserts(ep.table, rows));
      console.log(`  ✓ ${ep.table}: ${rows.length}`);
    } catch (e) {
      console.log(`  ⚠️  ${ep.table}: ${e.message}`);
    }
  }

  // Mouvements stocks
  try {
    const stocksRes = await req('/stocks');
    const stocks = Array.isArray(stocksRes) ? stocksRes : stocksRes.data ?? [];
    const allMv = [];
    for (const s of stocks) {
      const mv = await req(`/stocks/${s.id}/mouvements`);
      if (Array.isArray(mv)) allMv.push(...mv);
    }
    lines.push(`\n-- TABLE: mouvements_stock (${allMv.length} lignes)`);
    lines.push(toInserts('mouvements_stock', allMv));
    console.log(`  ✓ mouvements_stock: ${allMv.length}`);
  } catch (e) {
    console.log(`  ⚠️  mouvements_stock: ${e.message}`);
  }

  lines.push(`\nSET FOREIGN_KEY_CHECKS=1;\n`);
  lines.push(`-- ============================================================`);
  lines.push(`-- Fin du backup — ${new Date().toISOString()}`);
  lines.push(`-- ============================================================\n`);

  const filename = `backup_${date}.sql`;
  writeFileSync(filename, lines.join('\n'), 'utf8');
  console.log(`\n✅ Backup exporté → ${filename}`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });

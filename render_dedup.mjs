// Supprime les doublons créés par le double-import (les IDs les plus bas = premier run)
const BASE_URL = 'https://agri-erp-q9g1.onrender.com/api';
const FETCH_TIMEOUT = 30000; // 30s par requête

async function api(method, path, body, token) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      signal: ctrl.signal,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: body ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    try { return { status: res.status, data: JSON.parse(text) }; }
    catch { return { status: res.status, data: { _raw: text } }; }
  } catch (e) {
    return { status: 0, data: { error: e.message } };
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  console.log('=== Déduplication dépenses & ventes Kadiar ===\n');

  // Login
  const lr = await api('POST', '/auth/login', { telephone: '770000001', password: 'password' });
  const token = lr.data?.token;
  if (!token) { console.error('Échec login:', lr.data); return; }
  console.log('✓ Connecté\n');

  // --- DÉPENSES ---
  console.log('Récupération des dépenses (page unique)...');
  const dr = await api('GET', '/depenses?per_page=500', null, token);
  const depData = dr.data?.data ?? (Array.isArray(dr.data) ? dr.data : []);
  const nonAutoDep = depData.filter(d => !d.est_auto_generee).sort((a, b) => a.id - b.id);
  console.log(`  Total non-auto récupérés: ${nonAutoDep.length}`);

  if (nonAutoDep.length >= 300 && nonAutoDep.length <= 500) {
    const half = Math.floor(nonAutoDep.length / 2);
    const toDeleteDep = nonAutoDep.slice(0, half);
    console.log(`  Suppression de ${half} dépenses (IDs ${toDeleteDep[0].id} → ${toDeleteDep[toDeleteDep.length - 1].id})...`);
    let ok = 0, err = 0;
    for (const dep of toDeleteDep) {
      const r = await api('DELETE', `/depenses/${dep.id}`, null, token);
      if (r.status === 200 || r.status === 204) { ok++; if (ok % 20 === 0) console.log(`    ... ${ok}/${half} supprimées`); }
      else { err++; console.error(`  ✗ Dépense ${dep.id} (HTTP ${r.status}):`, JSON.stringify(r.data).slice(0, 100)); }
    }
    console.log(`  ✓ ${ok} supprimées, ${err} erreurs\n`);
  } else {
    console.log(`  Nombre inattendu (${nonAutoDep.length}), vérifiez manuellement.\n`);
  }

  // --- VENTES ---
  console.log('Récupération des ventes (page unique)...');
  const vr = await api('GET', '/ventes?per_page=200', null, token);
  const ventData = vr.data?.data ?? (Array.isArray(vr.data) ? vr.data : []);
  const nonAutoVent = ventData.filter(v => !v.est_auto_generee).sort((a, b) => a.id - b.id);
  console.log(`  Total non-auto récupérés: ${nonAutoVent.length}`);

  if (nonAutoVent.length >= 20 && nonAutoVent.length <= 50) {
    const half = Math.floor(nonAutoVent.length / 2);
    const toDeleteVent = nonAutoVent.slice(0, half);
    console.log(`  Suppression de ${half} ventes (IDs ${toDeleteVent[0].id} → ${toDeleteVent[toDeleteVent.length - 1].id})...`);
    let ok = 0, err = 0;
    for (const v of toDeleteVent) {
      const r = await api('DELETE', `/ventes/${v.id}`, null, token);
      if (r.status === 200 || r.status === 204) ok++;
      else { err++; console.error(`  ✗ Vente ${v.id} (HTTP ${r.status}):`, JSON.stringify(r.data).slice(0, 100)); }
    }
    console.log(`  ✓ ${ok} supprimées, ${err} erreurs\n`);
  } else {
    console.log(`  Nombre inattendu (${nonAutoVent.length}), vérifiez manuellement.\n`);
  }

  console.log('=== Déduplication terminée ===');
}

main().catch(console.error);

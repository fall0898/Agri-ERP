import { readFileSync } from 'fs';

const BASE_URL = 'https://agri-erp-q9g1.onrender.com/api';
const data = JSON.parse(readFileSync('./railway_export.json', 'utf8'));

function fix(str) {
  if (!str) return str;
  return str
    .replace(/Ã©/g, 'é').replace(/Ã¨/g, 'è').replace(/Ã /g, 'à')
    .replace(/Ã§/g, 'ç').replace(/Ã®/g, 'î').replace(/Ã´/g, 'ô')
    .replace(/Ã»/g, 'û').replace(/Ãª/g, 'ê').replace(/Ã‰/g, 'É')
    .replace(/Ã‡/g, 'Ç').replace(/Ã¢/g, 'â').replace(/Ã¹/g, 'ù');
}

async function api(method, path, body, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { _raw: text }; }
}

async function main() {
  console.log('=== Import Railway → Render (Exploitation Kadiar) ===\n');

  // 1. Login super admin
  console.log('1. Login super admin...');
  let r = await api('POST', '/auth/login', { telephone: '00000000', password: 'password' });
  const superToken = r.token;
  if (!superToken) { console.error('Échec login super admin:', r); return; }
  console.log('   ✓ Connecté');

  // 2. Reset données Kadiar existantes
  console.log('2. Reset données Kadiar existantes...');
  const tenantsForReset = await api('GET', '/admin/tenants', null, superToken);
  const orgForReset = Array.isArray(tenantsForReset) ? tenantsForReset.find(t => t.slug === 'kadiar-demo') : null;
  if (orgForReset) {
    r = await api('DELETE', `/admin/tenants/${orgForReset.id}/reset-data`, null, superToken);
    console.log(r.ok ? `   ✓ Données supprimées` : `   ✗ Reset échoué: ${JSON.stringify(r)}`);
  } else {
    console.log('   ℹ Org non trouvée, pas de reset');
  }

  // 3. Fixer le telephone de l'admin Kadiar (espaces → pas d'espaces)
  console.log('2. Correction telephone admin Kadiar...');
  const allUsers = await api('GET', '/admin/users', null, superToken);
  const kadiarAdmin = allUsers.find(u => u.telephone === '77 000 0001');
  if (kadiarAdmin) {
    await api('PUT', `/admin/users/${kadiarAdmin.id}`, { telephone: '770000001' }, superToken);
    console.log('   ✓ Telephone fixé');
  } else {
    console.log('   ℹ Déjà corrigé ou introuvable');
  }

  // 3. Login admin Kadiar
  console.log('3. Login admin Kadiar...');
  r = await api('POST', '/auth/login', { telephone: '770000001', password: 'password' });
  const token = r.token;
  if (!token) { console.error('Échec login admin Kadiar:', r); return; }
  console.log('   ✓ Connecté');

  const champMap = {};     // old_id → new_id
  const employeMap = {};   // old_id → new_id
  const financementMap = {}; // old_id → new_id

  // Helper: extraire l'id de la réponse (direct ou enveloppé dans {data:{...}})
  const getId = (res) => res?.id ?? res?.data?.id ?? null;

  // 4. Upgrade plan org → entreprise (via super admin)
  console.log('\n4. Upgrade plan org → entreprise...');
  const tenants = await api('GET', '/admin/tenants', null, superToken);
  const kadiarOrg = Array.isArray(tenants) ? tenants.find(t => t.slug === 'kadiar-demo') : null;
  if (kadiarOrg) {
    r = await api('PATCH', `/admin/tenants/${kadiarOrg.id}/plan`, { plan: 'entreprise' }, superToken);
    console.log(r.ok ? `   ✓ Plan entreprise activé (org ${kadiarOrg.id})` : `   ✗ Échec upgrade plan: ${JSON.stringify(r)}`);
  } else {
    console.log('   ℹ Org Kadiar non trouvée via super admin, plan non modifié');
  }

  // 5. Utilisateurs
  console.log('\n5. Création des utilisateurs...');
  const tels = ['admin9901', 'lecteur9901', 'lecteur9902', 'lecteur9903'];
  for (let i = 0; i < data.users.length; i++) {
    const u = data.users[i];
    r = await api('POST', '/utilisateurs', {
      nom: fix(u.nom), telephone: tels[i], password: 'password', role: u.role
    }, token);
    if (getId(r)) console.log(`   ✓ ${fix(u.nom)} [${u.role}] → tel: ${tels[i]}`);
    else console.error(`   ✗ ${u.nom}:`, JSON.stringify(r));
  }

  // 6. Champs
  console.log('\n6. Création des champs...');
  for (const c of data.champs) {
    r = await api('POST', '/champs', {
      nom: fix(c.nom),
      superficie_ha: c.superficie_ha || 0,
      localisation: c.localisation || null,
      description: c.description || null
    }, token);
    const newId = getId(r);
    if (newId) { champMap[c.id] = newId; console.log(`   ✓ "${c.nom}" : ${c.id} → ${newId}`); }
    else console.error(`   ✗ Champ "${c.nom}":`, JSON.stringify(r));
  }

  // 7. Intrants
  console.log('\n7. Création des intrants...');
  for (const intrant of data.intrants) {
    r = await api('POST', '/intrants', {
      nom: fix(intrant.nom), categorie: intrant.categorie, unite: intrant.unite
    }, token);
    if (getId(r)) console.log(`   ✓ "${fix(intrant.nom)}"`);
    else console.error(`   ✗ Intrant "${intrant.nom}":`, JSON.stringify(r));
  }

  // 8. Employés
  console.log('\n8. Création des employés...');
  for (const emp of data.employes) {
    r = await api('POST', '/employes', {
      nom: fix(emp.nom),
      telephone: emp.telephone || null,
      poste: fix(emp.poste) || null,
      salaire_mensuel_fcfa: parseFloat(emp.salaire_mensuel_fcfa) || 0,
      est_actif: emp.est_actif === 1
    }, token);
    const newEmpId = getId(r);
    if (newEmpId) { employeMap[emp.id] = newEmpId; console.log(`   ✓ "${fix(emp.nom)}" : ${emp.id} → ${newEmpId}`); }
    else console.error(`   ✗ Employé "${emp.nom}":`, JSON.stringify(r));
  }

  // 9. Dépenses (non auto-générées uniquement)
  console.log('\n9. Création des dépenses (202 entrées)...');
  const depenses = data.depenses.filter(d => !d.est_auto_generee);
  let depOk = 0, depErr = 0;
  for (const dep of depenses) {
    r = await api('POST', '/depenses', {
      description: fix(dep.description),
      categorie: dep.categorie,
      montant_fcfa: parseFloat(dep.montant_fcfa),
      date_depense: dep.date_depense,
      champ_id: dep.champ_id ? (champMap[dep.champ_id] || null) : null
    }, token);
    if (getId(r)) depOk++;
    else { depErr++; console.error(`   ✗ Dépense "${fix(dep.description)}":`, JSON.stringify(r)); }
  }
  console.log(`   ✓ ${depOk} créées, ${depErr} erreurs`);

  // 10. Ventes (non auto-générées uniquement)
  console.log('\n10. Création des ventes...');
  const ventes = data.ventes.filter(v => !v.est_auto_generee);
  let ventOk = 0, ventErr = 0;
  for (const v of ventes) {
    r = await api('POST', '/ventes', {
      produit: fix(v.produit),
      acheteur: v.acheteur || null,
      quantite_kg: parseFloat(v.quantite_kg),
      unite: 'kg',
      prix_unitaire_fcfa: parseFloat(v.prix_unitaire_fcfa),
      date_vente: v.date_vente,
      champ_id: v.champ_id ? (champMap[v.champ_id] || null) : null,
      notes: fix(v.notes) || null
    }, token);
    if (getId(r)) ventOk++;
    else { ventErr++; console.error(`   ✗ Vente "${fix(v.produit)}":`, JSON.stringify(r)); }
  }
  console.log(`   ✓ ${ventOk} créées, ${ventErr} erreurs`);

  // 11. Financements (génèrent automatiquement les dépenses liées)
  console.log('\n11. Création des financements...');
  for (const fin of data.financements) {
    const newEmpId = employeMap[fin.employe_id];
    if (!newEmpId) { console.error(`   ✗ Employé ${fin.employe_id} non mappé`); continue; }
    r = await api('POST', `/employes/${newEmpId}/financements`, {
      montant_fcfa: parseFloat(fin.montant_fcfa),
      motif: fix(fin.motif),
      date_financement: fin.date_financement,
      mode_paiement: fin.mode_paiement,
      notes: fin.notes || null
    }, token);
    const newFinId = getId(r);
    if (newFinId) {
      financementMap[fin.id] = newFinId;
      console.log(`   ✓ Financement #${fin.id} → #${newFinId} | ${parseFloat(fin.montant_fcfa).toLocaleString()} FCFA`);
    } else console.error(`   ✗ Financement #${fin.id}:`, JSON.stringify(r));
  }

  // 12. Remboursements (génèrent automatiquement les ventes liées)
  console.log('\n12. Création des remboursements...');
  for (const remb of data.remboursements_financement) {
    const newFinId = financementMap[remb.financement_id];
    if (!newFinId) { console.error(`   ✗ Financement ${remb.financement_id} non mappé`); continue; }
    r = await api('POST', `/financements/${newFinId}/rembourser`, {
      montant_fcfa: parseFloat(remb.montant_fcfa),
      date_remboursement: remb.date_remboursement,
      mode_paiement: remb.mode_paiement
    }, token);
    if (getId(r) || r.message) console.log(`   ✓ Remboursement financement #${newFinId} : ${parseFloat(remb.montant_fcfa).toLocaleString()} FCFA`);
    else console.error(`   ✗ Remboursement:`, JSON.stringify(r));
  }

  console.log('\n=== Import terminé ! ===');
  console.log(`Champs : ${Object.keys(champMap).length}`);
  console.log(`Employés : ${Object.keys(employeMap).length}`);
  console.log(`Financements : ${Object.keys(financementMap).length}`);
}

main().catch(console.error);

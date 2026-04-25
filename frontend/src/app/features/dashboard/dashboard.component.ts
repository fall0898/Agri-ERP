import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyFcfaPipe } from '../../core/pipes/currency-fcfa.pipe';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CurrencyFcfaPipe, DateFrPipe],
  styles: [`
    :host { display: block; }

    /* ═══ TOKENS ═══ */
    .d {
      --card:      #ffffff;
      --bg:        #f8fafc;
      --border:    #e5ddd2;
      --border-lt: #f0ebe3;
      --sh:        0 1px 4px rgba(26,48,32,.07), 0 1px 2px rgba(0,0,0,.04);
      --sh-md:     0 4px 16px rgba(26,48,32,.11);
      --green:     #16a34a;
      --green-bg:  #f0fdf4;
      --green-bdr: #bbf7d0;
      --red:       #dc2626;
      --red-bg:    #fef2f2;
      --amber:     #d97706;
      --blue:      #2563eb;
      --purple:    #7c3aed;
      --txt:       #1a2332;
      --txt2:      #6b7280;
      --txt3:      #9ca3af;
      font-family: 'DM Sans', system-ui, sans-serif;
      color: var(--txt);
      margin: -16px -16px -16px;
      padding: 20px 14px 60px;
    }
    @media (min-width: 1024px) {
      .d { margin: -24px -24px -24px; padding: 28px 32px 48px; }
    }

    /* ═══ PAGE HEADER ═══ */
    .pg-hd { margin-bottom: 20px; }
    .pg-title {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 20px; font-weight: 700; color: var(--txt); margin: 0 0 2px;
    }
    .pg-sub { font-size: 13px; color: var(--txt2); margin: 0; }
    @media (min-width: 1024px) {
      .pg-title { font-size: 22px; }
    }

    /* ═══ SKELETON ═══ */
    .skel {
      background: linear-gradient(90deg,#f1ece5 0%,#e8e0d6 50%,#f1ece5 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      border-radius: 8px;
    }
    @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }

    /* ════════════════════════════════════════
       MOBILE: FINANCIAL HERO CARD
    ════════════════════════════════════════ */
    .mob-hero {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 18px;
      overflow: hidden;
      box-shadow: var(--sh-md);
      margin-bottom: 12px;
    }
    @media (min-width: 1024px) { .mob-hero { display: none; } }

    .hero-accent {
      height: 5px;
      transition: background .4s ease;
    }
    .hero-accent.pos {
      background: linear-gradient(90deg, #16a34a, #4ade80, #16a34a);
      background-size: 200% 100%;
      animation: pulse-green 2.5s ease-in-out infinite;
    }
    .hero-accent.neg {
      background: linear-gradient(90deg, #dc2626, #f87171, #dc2626);
      background-size: 200% 100%;
      animation: pulse-red 1.8s ease-in-out infinite;
    }
    @keyframes pulse-green { 0%,100%{background-position:0% 0} 50%{background-position:100% 0} }
    @keyframes pulse-red   { 0%,100%{background-position:0% 0} 50%{background-position:100% 0} }

    .hero-body { padding: 18px 18px 16px; }

    .hero-cols {
      display: grid; grid-template-columns: 1fr 1fr; gap: 0;
      padding-bottom: 14px; border-bottom: 1px solid var(--border-lt);
      margin-bottom: 14px;
    }
    .hero-col { padding: 0 14px; }
    .hero-col:first-child { padding-left: 0; border-right: 1px solid var(--border-lt); }
    .hero-col:last-child  { padding-right: 0; }

    .hero-lbl {
      font-size: 10px; font-weight: 600; letter-spacing: .6px;
      text-transform: uppercase; color: var(--txt2); margin-bottom: 5px;
    }
    .hero-amt {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 15px; font-weight: 800; word-break: break-word; line-height: 1.3;
    }

    .hero-solde { text-align: center; }
    .hero-solde-lbl {
      font-size: 10px; font-weight: 600; letter-spacing: .6px;
      text-transform: uppercase; color: var(--txt2); margin-bottom: 4px;
    }
    .hero-solde-amt {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 24px; font-weight: 900; letter-spacing: -.5px;
    }

    /* ═══ MOBILE: COUNT CHIPS ═══ */
    .count-strip {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 10px; margin-bottom: 14px;
    }
    @media (min-width: 1024px) { .count-strip { display: none; } }

    .count-chip {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 14px; padding: 14px 10px 12px;
      text-align: center; box-shadow: var(--sh);
    }
    .count-n {
      display: block;
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 24px; font-weight: 900; line-height: 1; margin-bottom: 4px;
    }
    .count-l {
      display: block; font-size: 10px; color: var(--txt2);
      font-weight: 500; text-transform: uppercase; letter-spacing: .4px;
    }

    /* ════════════════════════════════════════
       DESKTOP: 6-COL KPI GRID
    ════════════════════════════════════════ */
    .kpi-desk {
      display: none;
    }
    @media (min-width: 1024px) {
      .kpi-desk {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 12px; margin-bottom: 16px;
      }
    }

    .kc {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 14px; padding: 16px 16px 18px;
      box-shadow: var(--sh);
      transition: transform .15s, box-shadow .15s;
    }
    .kc:hover { transform: translateY(-2px); box-shadow: var(--sh-md); }
    .kc.hl    { background: var(--green-bg); border-color: var(--green-bdr); }

    .kc-ico {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 12px;
    }
    .kc-num {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 16px; font-weight: 800; line-height: 1.3;
      word-break: break-word;
    }
    .kc-lbl {
      font-size: 10px; font-weight: 500; color: var(--txt2);
      text-transform: uppercase; letter-spacing: .5px; margin-top: 4px;
    }

    /* ════════════════════════════════════════
       SHARED: CARD
    ════════════════════════════════════════ */
    .card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 14px; padding: 18px 16px;
      box-shadow: var(--sh);
    }
    @media (min-width: 1024px) {
      .card { padding: 22px; }
    }
    .card-hd {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 6px; margin-bottom: 16px;
    }
    .card-title {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 14px; font-weight: 700; color: var(--txt); margin: 0;
    }
    @media (min-width: 1024px) { .card-title { font-size: 15px; } }
    .card-lk {
      font-size: 12px; font-weight: 500; color: var(--green);
      text-decoration: none; white-space: nowrap;
    }
    .card-lk:hover { text-decoration: underline; }

    /* ════════════════════════════════════════
       MIDDLE ROW: Chart + Synthèse
    ════════════════════════════════════════ */
    .mid-row {
      display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 12px;
    }
    @media (min-width: 1024px) {
      .mid-row { grid-template-columns: 1.65fr 1fr; gap: 14px; margin-bottom: 14px; }
    }

    /* chart empty/loading */
    .chart-skel { border-radius: 10px; }

    /* ─── Custom par-champ bars ─── */
    .champ-list { display: flex; flex-direction: column; gap: 0; }
    .champ-item {
      padding: 13px 0; border-bottom: 1px solid var(--border-lt);
    }
    .champ-item:last-child { border-bottom: none; }
    .champ-hd {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 9px;
    }
    .champ-lbl {
      font-family: 'Outfit', sans-serif;
      font-size: 12px; font-weight: 700; letter-spacing: .4px;
      color: var(--txt); text-transform: uppercase;
    }
    .champ-badge {
      font-family: 'Outfit', sans-serif;
      font-size: 11px; font-weight: 800;
      padding: 2px 9px; border-radius: 20px; letter-spacing: .2px;
    }
    .champ-badge.pos { background: #dcfce7; color: #15803d; }
    .champ-badge.neg { background: #fee2e2; color: #b91c1c; }
    .bar-row {
      display: flex; align-items: center; gap: 8px; margin-bottom: 5px;
    }
    .bar-row:last-child { margin-bottom: 0; }
    .bar-lbl {
      font-size: 10px; font-weight: 600; letter-spacing: .3px;
      text-transform: uppercase; width: 52px; flex-shrink: 0; color: var(--txt2);
    }
    .bar-track {
      flex: 1; height: 7px; background: #f1ece5;
      border-radius: 99px; overflow: hidden;
    }
    .bar-fill {
      height: 100%; border-radius: 99px;
      transition: width 1s cubic-bezier(.4,0,.2,1);
    }
    .bar-fill.v {
      background: linear-gradient(90deg, #16a34a 0%, #4ade80 100%);
      box-shadow: 0 0 6px rgba(22,163,74,.35);
    }
    .bar-fill.d {
      background: linear-gradient(90deg, #f97316 0%, #fbbf24 100%);
      box-shadow: 0 0 6px rgba(249,115,22,.3);
    }
    .bar-amt {
      font-family: 'Outfit', sans-serif;
      font-size: 11px; font-weight: 700;
      width: 48px; text-align: right; flex-shrink: 0;
    }

    /* ─── Synthèse ─── */
    .syn-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 11px 0; border-bottom: 1px solid var(--border-lt);
    }
    .syn-row:last-of-type { border-bottom: none; }
    .syn-lbl { font-size: 13px; color: var(--txt2); }
    .syn-val {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 15px; font-weight: 700;
    }
    .syn-row.net .syn-lbl { font-size: 14px; font-weight: 600; color: var(--txt); }
    .syn-row.net .syn-val { font-size: 17px; }

    .taux-wrap { margin-top: 16px; padding-top: 14px; border-top: 1px solid var(--border-lt); }
    .taux-hd   { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .taux-lbl  { font-size: 12px; color: var(--txt2); }
    .taux-pct  { font-size: 12px; font-weight: 700; color: var(--txt); }
    .taux-track { height: 7px; background: #f1ece5; border-radius: 99px; overflow: hidden; }
    .taux-fill  {
      height: 100%; border-radius: 99px;
      background: linear-gradient(90deg, #fcd34d, #f59e0b);
      transition: width .7s cubic-bezier(.4,0,.2,1);
    }

    /* ════════════════════════════════════════
       BOTTOM: Recent Transactions
       Mobile: tabs | Desktop: 2-col
    ════════════════════════════════════════ */

    /* Tab switcher — mobile only */
    .tab-sw {
      display: flex; background: #f0ebe3;
      border-radius: 12px; padding: 4px; margin-bottom: 12px; gap: 3px;
    }
    @media (min-width: 768px) { .tab-sw { display: none; } }

    .tab-btn {
      flex: 1; padding: 9px 12px; border-radius: 9px;
      border: none; background: transparent;
      font-size: 13px; font-weight: 600; color: var(--txt2);
      cursor: pointer; transition: all .15s;
      font-family: 'DM Sans', system-ui, sans-serif;
    }
    .tab-btn.active {
      background: var(--card); color: var(--txt);
      box-shadow: 0 1px 4px rgba(0,0,0,.09);
    }

    .bot-row {
      display: grid; grid-template-columns: 1fr; gap: 12px;
    }
    @media (min-width: 768px) {
      .bot-row { grid-template-columns: repeat(2, 1fr); gap: 14px; }
    }

    /* hide/show cards via tab on mobile */
    @media (max-width: 767px) {
      .rec-dep { display: none; }
      .rec-ven { display: none; }
      .rec-dep.show { display: block; }
      .rec-ven.show { display: block; }
    }

    /* ─── Recent items ─── */
    .rec-item {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 11px 0; border-bottom: 1px solid var(--border-lt);
      min-height: 50px; /* tap target */
    }
    .rec-item:last-child { border-bottom: none; }
    .rec-ico {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
    }
    .rec-body { flex: 1; min-width: 0; }
    .rec-name {
      font-size: 13px; font-weight: 500; color: var(--txt);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .rec-date { font-size: 11px; color: var(--txt3); margin-top: 2px; }
    .rec-amt  {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 13px; font-weight: 700; white-space: nowrap; flex-shrink: 0;
      align-self: center;
    }

    /* empty state */
    .empty {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 100px;
      font-size: 13px; color: var(--txt3); gap: 6px;
    }

    /* ─── Entry animations ─── */
    .fade-in   { animation: fadeIn .4s ease both; }
    .fade-in-1 { animation-delay: .05s; }
    .fade-in-2 { animation-delay: .10s; }
    .fade-in-3 { animation-delay: .15s; }
    .fade-in-4 { animation-delay: .20s; }
    .fade-in-5 { animation-delay: .25s; }
    @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
  `],
  template: `
<div class="d">

  <!-- ══════════ PAGE HEADER ══════════ -->
  <div class="pg-hd fade-in">
    <h1 class="pg-title">Tableau de bord</h1>
    <p class="pg-sub">Campagne agricole en cours</p>
  </div>

  <!-- ══════════ MOBILE: HERO FINANCIER ══════════ -->
  <div class="mob-hero fade-in fade-in-1">
    <div class="hero-accent" [class.pos]="soldeNet() >= 0" [class.neg]="soldeNet() < 0"></div>
    <div class="hero-body">
      <!-- Ventes / Dépenses côte à côte -->
      <div class="hero-cols">
        <div class="hero-col">
          <div class="hero-lbl">Total Ventes</div>
          @if (loading()) { <div class="skel" style="height:18px;width:90%"></div> }
          @else { <div class="hero-amt" style="color:#16a34a">{{ totalVentes() | currencyFcfa }}</div> }
        </div>
        <div class="hero-col">
          <div class="hero-lbl">Total Dépenses</div>
          @if (loading()) { <div class="skel" style="height:18px;width:90%"></div> }
          @else { <div class="hero-amt" style="color:#dc2626">{{ totalDepenses() | currencyFcfa }}</div> }
        </div>
      </div>
      <!-- Solde net central -->
      <div class="hero-solde">
        <div class="hero-solde-lbl">Solde Net</div>
        @if (loading()) {
          <div class="skel" style="height:28px;width:60%;margin:0 auto"></div>
        } @else {
          <div class="hero-solde-amt" [style.color]="soldeNet() < 0 ? '#dc2626' : '#16a34a'">
            {{ soldeNet() | currencyFcfa }}
          </div>
        }
      </div>
    </div>
  </div>

  <!-- ══════════ MOBILE: COUNT CHIPS ══════════ -->
  <div class="count-strip fade-in fade-in-2">
    <div class="count-chip">
      <span class="count-n" style="color:#d97706">
        @if (loading()) { <span class="skel" style="display:inline-block;width:24px;height:24px"></span> }
        @else { {{ nbChamps() }} }
      </span>
      <span class="count-l">Champs</span>
    </div>
    <div class="count-chip">
      <span class="count-n" style="color:#2563eb">
        @if (loading()) { <span class="skel" style="display:inline-block;width:24px;height:24px"></span> }
        @else { {{ nbCulturesActives() }} }
      </span>
      <span class="count-l">Cultures</span>
    </div>
    <div class="count-chip">
      <span class="count-n" style="color:#7c3aed">
        @if (loading()) { <span class="skel" style="display:inline-block;width:24px;height:24px"></span> }
        @else { {{ nbEmployes() }} }
      </span>
      <span class="count-l">Employés</span>
    </div>
  </div>

  <!-- ══════════ DESKTOP: 6-COL KPI GRID ══════════ -->
  <div class="kpi-desk">
    <!-- Total Ventes -->
    <div class="kc fade-in fade-in-1">
      <div class="kc-ico" style="background:#dcfce7">
        <svg width="17" height="17" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10h8M8 14h8"/>
        </svg>
      </div>
      <div class="kc-num" style="color:#16a34a">
        @if (loading()) { <div class="skel" style="height:18px;width:90%"></div> }
        @else { {{ totalVentes() | currencyFcfa }} }
      </div>
      <div class="kc-lbl">Total Ventes</div>
    </div>
    <!-- Total Dépenses -->
    <div class="kc fade-in fade-in-2">
      <div class="kc-ico" style="background:#fee2e2">
        <svg width="17" height="17" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>
        </svg>
      </div>
      <div class="kc-num" style="color:#dc2626">
        @if (loading()) { <div class="skel" style="height:18px;width:90%"></div> }
        @else { {{ totalDepenses() | currencyFcfa }} }
      </div>
      <div class="kc-lbl">Total Dépenses</div>
    </div>
    <!-- Solde Net -->
    <div class="kc hl fade-in fade-in-3">
      <div class="kc-ico" style="background:#bbf7d0">
        <svg width="17" height="17" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      </div>
      <div class="kc-num" [style.color]="soldeNet() < 0 ? '#dc2626' : '#16a34a'">
        @if (loading()) { <div class="skel" style="height:18px;width:90%"></div> }
        @else { {{ soldeNet() | currencyFcfa }} }
      </div>
      <div class="kc-lbl">Solde Net</div>
    </div>
    <!-- Champs -->
    <div class="kc fade-in fade-in-3">
      <div class="kc-ico" style="background:#fff7ed">
        <svg width="17" height="17" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
      <div class="kc-num" style="color:#d97706;font-size:22px">
        @if (loading()) { <div class="skel" style="height:22px;width:40px"></div> }
        @else { {{ nbChamps() }} }
      </div>
      <div class="kc-lbl">Champs</div>
    </div>
    <!-- Cultures -->
    <div class="kc fade-in fade-in-4">
      <div class="kc-ico" style="background:#eff6ff">
        <svg width="17" height="17" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M12 22V12M12 12C12 7 7 4 2 6M12 12C12 7 17 4 22 6"/>
        </svg>
      </div>
      <div class="kc-num" style="color:#2563eb;font-size:22px">
        @if (loading()) { <div class="skel" style="height:22px;width:40px"></div> }
        @else { {{ nbCulturesActives() }} }
      </div>
      <div class="kc-lbl">Cultures actives</div>
    </div>
    <!-- Employés -->
    <div class="kc fade-in fade-in-5">
      <div class="kc-ico" style="background:#f5f3ff">
        <svg width="17" height="17" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <div class="kc-num" style="color:#7c3aed;font-size:22px">
        @if (loading()) { <div class="skel" style="height:22px;width:40px"></div> }
        @else { {{ nbEmployes() }} }
      </div>
      <div class="kc-lbl">Employés actifs</div>
    </div>
  </div>

  <!-- ══════════ MIDDLE ROW: CHART + SYNTHÈSE ══════════ -->
  <div class="mid-row fade-in fade-in-3">

    <!-- Barres par exploitation -->
    <div class="card">
      <div class="card-hd">
        <p class="card-title">Ventes vs Dépenses par exploitation</p>
        <a routerLink="/finances" class="card-lk">Voir le détail →</a>
      </div>

      <!-- Légende -->
      @if (parChamp().length) {
        <div style="display:flex;gap:14px;margin-bottom:14px;">
          <span style="display:flex;align-items:center;gap:5px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;color:#16a34a">
            <span style="width:20px;height:4px;border-radius:99px;background:linear-gradient(90deg,#16a34a,#4ade80);display:inline-block"></span>
            Ventes
          </span>
          <span style="display:flex;align-items:center;gap:5px;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.4px;color:#f97316">
            <span style="width:20px;height:4px;border-radius:99px;background:linear-gradient(90deg,#f97316,#fbbf24);display:inline-block"></span>
            Dépenses
          </span>
        </div>
        <div class="champ-list">
          @for (champ of parChamp(); track champ.champ_id) {
            <div class="champ-item">
              <div class="champ-hd">
                <span class="champ-lbl">{{ champ.nom }}</span>
                <span class="champ-badge" [class.pos]="champ.solde_net >= 0" [class.neg]="champ.solde_net < 0">
                  {{ champ.solde_net >= 0 ? '+' : '' }}{{ compact(champ.solde_net) }} FCFA
                </span>
              </div>
              <div class="bar-row">
                <span class="bar-lbl" style="color:#16a34a">Ventes</span>
                <div class="bar-track">
                  <div class="bar-fill v" [style.width.%]="pct(champ.total_ventes)"></div>
                </div>
                <span class="bar-amt" style="color:#16a34a">{{ compact(champ.total_ventes) }}</span>
              </div>
              <div class="bar-row">
                <span class="bar-lbl" style="color:#f97316">Charges</span>
                <div class="bar-track">
                  <div class="bar-fill d" [style.width.%]="pct(champ.total_depenses)"></div>
                </div>
                <span class="bar-amt" style="color:#f97316">{{ compact(champ.total_depenses) }}</span>
              </div>
            </div>
          }
        </div>
      } @else if (loading()) {
        <div class="chart-skel skel" style="height:180px;border-radius:10px"></div>
      } @else {
        <div class="empty">Aucune donnée par exploitation</div>
      }
    </div>

    <!-- Synthèse financière -->
    <div class="card">
      <div class="card-hd">
        <p class="card-title">Synthèse financière</p>
      </div>
      <div class="syn-row">
        <span class="syn-lbl">Recettes</span>
        <span class="syn-val" style="color:#16a34a">{{ totalVentes() | currencyFcfa }}</span>
      </div>
      <div class="syn-row">
        <span class="syn-lbl">Charges</span>
        <span class="syn-val" style="color:#dc2626">{{ totalDepenses() | currencyFcfa }}</span>
      </div>
      <div class="syn-row net">
        <span class="syn-lbl">Résultat net</span>
        <span class="syn-val" [style.color]="soldeNet() < 0 ? '#dc2626' : '#16a34a'">{{ soldeNet() | currencyFcfa }}</span>
      </div>
      <div class="taux-wrap">
        <div class="taux-hd">
          <span class="taux-lbl">Taux de charges</span>
          <span class="taux-pct">{{ tauxCharges() }}%</span>
        </div>
        <div class="taux-track">
          <div class="taux-fill" [style.width.%]="tauxCharges()"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ══════════ BOTTOM: TRANSACTIONS RÉCENTES ══════════ -->
  <div class="fade-in fade-in-4">
    <!-- Tab switcher — mobile uniquement -->
    <div class="tab-sw">
      <button class="tab-btn" [class.active]="activeTab() === 'depenses'"
              (click)="activeTab.set('depenses')">
        Dernières dépenses
      </button>
      <button class="tab-btn" [class.active]="activeTab() === 'ventes'"
              (click)="activeTab.set('ventes')">
        Dernières ventes
      </button>
    </div>

    <div class="bot-row">

      <!-- Dépenses récentes -->
      <div class="card rec-dep" [class.show]="activeTab() === 'depenses'">
        <div class="card-hd">
          <p class="card-title">Dernières dépenses</p>
          <a routerLink="/depenses" class="card-lk">Voir tout →</a>
        </div>
        @if (depensesRecentes().length) {
          @for (dep of depensesRecentes(); track dep.id) {
            <div class="rec-item">
              <div class="rec-ico" style="background:#fee2e2">
                <svg width="14" height="14" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24">
                  <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>
                </svg>
              </div>
              <div class="rec-body">
                <div class="rec-name">{{ dep.libelle ?? dep.description ?? dep.categorie ?? 'Dépense' }}</div>
                <div class="rec-date">{{ dep.date | dateFr }}</div>
              </div>
              <span class="rec-amt" style="color:#dc2626">−{{ dep.montant_fcfa | currencyFcfa }}</span>
            </div>
          }
        } @else if (loading()) {
          @for (i of [1,2,3]; track i) {
            <div class="rec-item">
              <div class="skel" style="width:36px;height:36px;border-radius:10px;flex-shrink:0"></div>
              <div style="flex:1;display:flex;flex-direction:column;gap:5px">
                <div class="skel" style="height:12px;border-radius:4px"></div>
                <div class="skel" style="height:10px;width:50%;border-radius:4px"></div>
              </div>
            </div>
          }
        } @else {
          <div class="empty">Aucune dépense récente</div>
        }
      </div>

      <!-- Ventes récentes -->
      <div class="card rec-ven" [class.show]="activeTab() === 'ventes'">
        <div class="card-hd">
          <p class="card-title">Dernières ventes</p>
          <a routerLink="/ventes" class="card-lk">Voir tout →</a>
        </div>
        @if (ventesRecentes().length) {
          @for (ven of ventesRecentes(); track ven.id) {
            <div class="rec-item">
              <div class="rec-ico" style="background:#dcfce7">
                <svg width="14" height="14" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <div class="rec-body">
                <div class="rec-name">{{ ven.produit ?? ven.libelle ?? 'Vente' }}</div>
                <div class="rec-date">{{ ven.date | dateFr }}</div>
              </div>
              <span class="rec-amt" style="color:#16a34a">+{{ ven.montant_total_fcfa | currencyFcfa }}</span>
            </div>
          }
        } @else if (loading()) {
          @for (i of [1,2,3]; track i) {
            <div class="rec-item">
              <div class="skel" style="width:36px;height:36px;border-radius:10px;flex-shrink:0"></div>
              <div style="flex:1;display:flex;flex-direction:column;gap:5px">
                <div class="skel" style="height:12px;border-radius:4px"></div>
                <div class="skel" style="height:10px;width:50%;border-radius:4px"></div>
              </div>
            </div>
          }
        } @else {
          <div class="empty">Aucune vente récente</div>
        }
      </div>

    </div>
  </div>

</div>
  `,
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);

  loading           = signal(true);
  totalVentes       = signal(0);
  totalDepenses     = signal(0);
  nbChamps          = signal(0);
  nbCulturesActives = signal(0);
  nbEmployes        = signal(0);
  depensesRecentes  = signal<any[]>([]);
  ventesRecentes    = signal<any[]>([]);
  parChamp          = signal<any[]>([]);
  activeTab         = signal<'depenses' | 'ventes'>('depenses');

  soldeNet    = computed(() => this.totalVentes() - this.totalDepenses());
  tauxCharges = computed(() =>
    this.totalVentes() > 0
      ? Math.min(100, Math.round((this.totalDepenses() / this.totalVentes()) * 100))
      : 0
  );

  maxChampValue = computed(() =>
    Math.max(1, ...this.parChamp().flatMap((c: any) => [c.total_ventes ?? 0, c.total_depenses ?? 0]))
  );

  pct(val: number): number {
    return Math.round((val / this.maxChampValue()) * 100);
  }

  compact(n: number): string {
    const abs = Math.abs(n);
    const sign = n < 0 ? '−' : '';
    if (abs >= 1_000_000) return sign + (abs / 1_000_000).toFixed(1).replace('.', ',') + 'M';
    if (abs >= 1_000)     return sign + new Intl.NumberFormat('fr-FR').format(Math.round(abs / 1_000)) + 'K';
    return sign + new Intl.NumberFormat('fr-FR').format(Math.round(abs));
  }

  ngOnInit(): void {
    this.api.get<any>('/api/dashboard').subscribe({
      next: res => {
        const k = res.kpis ?? {};
        this.nbChamps.set(k.nb_champs ?? 0);
        this.nbCulturesActives.set(k.nb_cultures_actives ?? 0);
        this.nbEmployes.set(k.nb_employes ?? 0);

        if (k.total_ventes != null)   this.totalVentes.set(k.total_ventes);
        if (k.total_depenses != null) this.totalDepenses.set(k.total_depenses);
        if (k.total_depenses == null) {
          const gf = Array.isArray(res.graphiqueFinance) ? res.graphiqueFinance : [];
          if (k.total_ventes == null)
            this.totalVentes.set(gf.reduce((a: number, m: any) => a + (m.ventes   ?? 0), 0));
          this.totalDepenses.set(gf.reduce((a: number, m: any) => a + (m.depenses ?? 0), 0));
        }

        this.depensesRecentes.set(
          (Array.isArray(res.depensesRecentes) ? res.depensesRecentes : []).slice(0, 5)
        );
        this.ventesRecentes.set(
          (Array.isArray(res.ventesRecentes) ? res.ventesRecentes : []).slice(0, 5)
        );
        this.parChamp.set(Array.isArray(res.parChamp) ? res.parChamp : []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}

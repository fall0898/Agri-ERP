import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartOptions, Plugin } from 'chart.js';
import {
  Chart, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyFcfaPipe } from '../../core/pipes/currency-fcfa.pipe';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';

Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

/* ── Gradient dynamique ── */
const gradientPlugin: Plugin = {
  id: 'dynamicGradient',
  beforeDatasetsUpdate(chart: any) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    chart.data.datasets.forEach((ds: any) => {
      if (ds._gradientFrom && ds._gradientTo) {
        const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        g.addColorStop(0, ds._gradientFrom);
        g.addColorStop(1, ds._gradientTo);
        ds.backgroundColor = g;
      }
    });
  },
};

/* ── Texte centré donut ── */
const donutCenterPlugin: Plugin = {
  id: 'donutCenter',
  afterDraw(chart: any) {
    if (chart.config.type !== 'doughnut') return;
    const { ctx, chartArea } = chart;
    const total = (chart.data.datasets[0]?.data as number[])?.reduce((a: number, b: number) => a + b, 0) ?? 0;
    if (!total) return;
    const cx = (chartArea.left + chartArea.right) / 2;
    const cy = (chartArea.top + chartArea.bottom) / 2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "bold 14px 'Outfit', sans-serif";
    ctx.fillStyle = '#E8F2EB';
    ctx.fillText(new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(total) + ' F', cx, cy - 7);
    ctx.font = "11px 'DM Sans', sans-serif";
    ctx.fillStyle = '#7DA888';
    ctx.fillText('Total', cx, cy + 10);
    ctx.restore();
  },
};

Chart.register(gradientPlugin as any, donutCenterPlugin as any);

const TOOLTIP = {
  padding: 12, cornerRadius: 10,
  backgroundColor: '#0d1a10',
  titleColor: '#7DA888', bodyColor: '#E8F2EB',
  borderColor: 'rgba(74,222,128,0.18)', borderWidth: 1,
  displayColors: true, boxWidth: 9, boxHeight: 9, boxPadding: 4,
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, BaseChartDirective, CurrencyFcfaPipe, DateFrPipe],
  styles: [`
    :host { display: block; }

    /* ── Root & tokens ── */
    .d {
      --bg:        #0B1912;
      --card:      #111F16;
      --card2:     #162B1D;
      --border:    rgba(74,222,128,.10);
      --green:     #4ADE80;
      --gold:      #F5C842;
      --red:       #FF6B6B;
      --txt:       #E8F2EB;
      --txt2:      #7DA888;
      --txt3:      #4A7057;
      font-family: 'DM Sans', system-ui, sans-serif;
      color: var(--txt);
      background: var(--bg);
      min-height: calc(100vh - 0px);
      /* Contrer le padding du parent (.main-content p-4 lg:p-6) */
      margin: -16px -16px -16px;
      padding: 20px 16px 80px;
      position: relative;
      overflow-x: hidden;
    }
    @media (min-width:768px)  { .d { padding: 24px 24px 32px; } }
    @media (min-width:1024px) {
      .d {
        margin: -24px -24px -24px;
        padding: 28px 32px 40px;
      }
    }

    /* ── Ambient blobs ── */
    .blob {
      position: fixed; border-radius: 50%; pointer-events: none; z-index: 0;
      filter: blur(80px); opacity: .18;
    }
    .blob-a {
      width: 420px; height: 420px;
      background: radial-gradient(circle, #16a34a, transparent 70%);
      top: -100px; right: -100px;
      animation: drift 18s ease-in-out infinite alternate;
    }
    .blob-b {
      width: 300px; height: 300px;
      background: radial-gradient(circle, #854d0e, transparent 70%);
      bottom: 10%; left: -80px;
      animation: drift 22s ease-in-out infinite alternate-reverse;
    }
    @keyframes drift { from { transform: translate(0,0) scale(1); } to { transform: translate(30px,20px) scale(1.1); } }

    /* all content above blobs */
    .d > *:not(.blob) { position: relative; z-index: 1; }

    /* ── Header ── */
    .hd {
      display: flex; align-items: flex-start; justify-content: space-between;
      gap: 16px; flex-wrap: wrap; margin-bottom: 24px;
    }
    .hd-left { display: flex; align-items: center; gap: 14px; }
    .avatar {
      width: 46px; height: 46px; border-radius: 14px; flex-shrink: 0;
      background: linear-gradient(135deg, #16a34a 0%, #0f6c2e 100%);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700; color: #fff;
      box-shadow: 0 4px 20px rgba(74,222,128,.3);
    }
    .hd-greet { font-size: 11px; color: var(--txt2); letter-spacing: .5px; text-transform: uppercase; margin-bottom: 2px; }
    .hd-name  { font-family: 'Outfit', sans-serif; font-size: 20px; font-weight: 700; color: var(--txt); line-height: 1.2; }
    .hd-org   { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--txt3); margin-top: 3px; }
    .hd-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    .chip {
      display: flex; flex-direction: column; align-items: flex-end;
      padding: 8px 14px; border-radius: 14px; gap: 1px;
      border: 1px solid var(--border);
    }
    .chip-label  { font-size: 10px; font-weight: 500; letter-spacing: .4px; text-transform: uppercase; }
    .chip-value  { font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; }
    .chip.pos    { background: rgba(74,222,128,.08); }
    .chip.pos .chip-label { color: var(--green); }
    .chip.pos .chip-value { color: var(--green); }
    .chip.neg    { background: rgba(255,107,107,.08); }
    .chip.neg .chip-label { color: var(--red); }
    .chip.neg .chip-value { color: var(--red); }

    .wx-chip {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 12px; border-radius: 12px;
      background: rgba(255,255,255,.04); border: 1px solid var(--border);
      font-size: 13px; color: var(--txt2);
    }
    .wx-temp { font-family: 'Outfit', sans-serif; font-weight: 600; color: var(--txt); }

    .btn-cta {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 16px; border-radius: 12px; text-decoration: none;
      font-size: 13px; font-weight: 600; transition: all .2s;
      background: var(--green); color: #0B1912;
    }
    .btn-cta:hover { background: #6ee7a0; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(74,222,128,.35); }
    .btn-ghost {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 9px 14px; border-radius: 12px; text-decoration: none;
      font-size: 13px; font-weight: 500; transition: all .2s;
      background: rgba(255,255,255,.05); border: 1px solid var(--border); color: var(--txt2);
    }
    .btn-ghost:hover { background: rgba(255,255,255,.09); color: var(--txt); }

    /* ── Separator ── */
    .sep { height: 1px; background: var(--border); margin: 0 0 20px; }

    /* ── KPI grid ── */
    .kpi-grid {
      display: grid; grid-template-columns: repeat(2,1fr); gap: 10px; margin-bottom: 16px;
    }
    @media (min-width:768px)  { .kpi-grid { grid-template-columns: repeat(4,1fr); gap: 14px; } }

    .kc {
      background: var(--card); border: 1px solid var(--border); border-radius: 18px;
      padding: 18px 16px 16px; position: relative; overflow: hidden;
      transition: transform .2s, box-shadow .2s;
    }
    .kc:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,.35); }
    .kc-glow {
      position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
      border-radius: 0 0 18px 18px; opacity: .6;
    }
    .kc-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 14px; }
    .kc-icon {
      width: 40px; height: 40px; border-radius: 11px;
      display: flex; align-items: center; justify-content: center;
    }
    .kc-badge {
      font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 20px;
      letter-spacing: .3px;
    }
    .kc-val  { font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 800; color: var(--txt); line-height: 1; }
    .kc-lbl  { font-size: 12px; color: var(--txt2); margin-top: 5px; font-weight: 500; }

    .kc-skel { height: 110px; background: var(--card); border-radius: 18px; border: 1px solid var(--border); }
    .shimmer {
      background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.04) 50%, transparent 100%);
      background-size: 200% 100%;
      animation: shimmer 1.6s ease-in-out infinite;
    }
    @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }

    /* ── Charts layout ── */
    .charts-row {
      display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 14px;
    }
    @media (min-width: 1024px) { .charts-row { grid-template-columns: 2fr 1fr; } }

    .bottom-row {
      display: grid; grid-template-columns: 1fr; gap: 14px;
    }
    @media (min-width: 640px)  { .bottom-row { grid-template-columns: repeat(2,1fr); } }
    @media (min-width: 1024px) { .bottom-row { grid-template-columns: repeat(3,1fr); } }

    /* ── Card ── */
    .card {
      background: var(--card); border: 1px solid var(--border); border-radius: 20px;
      padding: 22px; transition: box-shadow .2s;
    }
    .card:hover { box-shadow: 0 6px 24px rgba(0,0,0,.3); }

    .card-title { font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700; color: var(--txt); }
    .card-sub   { font-size: 12px; color: var(--txt3); margin-top: 2px; }
    .card-head  { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 8px; }

    .chart-skel { border-radius: 12px; }

    /* chart legend */
    .legend { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .legend span { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--txt2); }
    .legend i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; flex-shrink: 0; }
    .legend i.ln { width: 18px; height: 2px; border-radius: 2px; }

    /* benefice badge */
    .ben-badge {
      font-family: 'Outfit', sans-serif; font-size: 14px; font-weight: 700;
      padding: 6px 12px; border-radius: 10px;
    }
    .ben-badge.pos { background: rgba(74,222,128,.12); color: var(--green); }
    .ben-badge.neg { background: rgba(255,107,107,.12); color: var(--red);   }

    /* ── Alert / task items ── */
    .alert-item {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px;
      border-radius: 12px; margin-bottom: 8px;
      background: rgba(245,200,66,.06); border: 1px solid rgba(245,200,66,.12);
    }
    .alert-dot {
      width: 8px; height: 8px; border-radius: 50%; background: var(--gold); flex-shrink: 0;
      box-shadow: 0 0 8px var(--gold);
    }
    .alert-name { font-size: 13px; font-weight: 600; color: var(--txt); }
    .alert-qty  { font-size: 11px; color: var(--txt3); margin-top: 2px; }
    .alert-bdg  {
      margin-left: auto; font-size: 10px; font-weight: 700; padding: 3px 8px;
      border-radius: 8px; background: rgba(245,200,66,.15); color: var(--gold);
      white-space: nowrap; letter-spacing: .3px;
    }
    .progress-wrap { margin-top: 5px; height: 3px; background: rgba(255,255,255,.08); border-radius: 2px; }
    .progress-bar  { height: 3px; border-radius: 2px; background: var(--gold); max-width: 100%; }

    .task-item {
      display: flex; align-items: flex-start; gap: 10px; padding: 10px 0;
      border-bottom: 1px solid var(--border);
    }
    .task-item:last-child { border-bottom: none; }
    .task-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
    .task-title { font-size: 13px; font-weight: 500; color: var(--txt); }
    .task-date  { font-size: 11px; color: var(--txt3); margin-top: 2px; }

    /* activity feed */
    .act-item {
      display: flex; align-items: flex-start; gap: 10px; padding: 9px 0;
      border-bottom: 1px solid rgba(255,255,255,.05);
    }
    .act-item:last-child { border-bottom: none; }
    .act-dot {
      width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
      background: rgba(74,222,128,.1); display: flex; align-items: center; justify-content: center;
    }
    .act-title { font-size: 12px; font-weight: 500; color: var(--txt); line-height: 1.4; }
    .act-date  { font-size: 11px; color: var(--txt3); margin-top: 2px; }

    /* link */
    .lk { font-size: 12px; color: var(--green); text-decoration: none; font-weight: 500; transition: opacity .15s; }
    .lk:hover { opacity: .75; }

    /* empty / ok states */
    .ok-state   { display:flex;align-items:center;justify-content:center;gap:8px;
                  height:80px;font-size:13px;color:var(--green);font-weight:500; }
    .empty-state{ display:flex;flex-direction:column;align-items:center;justify-content:center;
                  height:180px;gap:8px;font-size:13px;color:var(--txt3); }
  `],
  template: `
<div class="d">
  <!-- ambient blobs -->
  <div class="blob blob-a"></div>
  <div class="blob blob-b"></div>

  <!-- ════════ HEADER ════════ -->
  <div class="hd">
    <div class="hd-left">
      <div class="avatar">{{ initiale() }}</div>
      <div>
        <div class="hd-greet">{{ greeting() }}</div>
        <div class="hd-name">{{ auth.user()?.prenom || auth.user()?.nom || 'Utilisateur' }}</div>
        <div class="hd-org">
          <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ auth.organisation()?.nom ?? 'Exploitation agricole' }}
        </div>
      </div>
    </div>

    <div class="hd-right">
      @if (meteo()) {
        <div class="wx-chip">
          <span style="font-size:16px">{{ meteoIcon() }}</span>
          <span class="wx-temp">{{ meteo()?.temperature }}°C</span>
          <span style="font-size:11px;color:var(--txt3)">{{ meteo()?.description }}</span>
        </div>
      }
      <div class="chip" [class.pos]="beneficeTotal()>=0" [class.neg]="beneficeTotal()<0">
        <span class="chip-label">Solde net</span>
        <span class="chip-value">{{ beneficeTotal()>=0?'+':'' }}{{ beneficeTotal() | currencyFcfa }}</span>
      </div>
      @if (auth.isAdmin()) {
        <a routerLink="/champs" class="btn-ghost">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Champ
        </a>
        <a routerLink="/cultures" class="btn-cta">
          <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Culture
        </a>
      }
    </div>
  </div>

  <div class="sep"></div>

  <!-- ════════ KPI CARDS ════════ -->
  <div class="kpi-grid">
    @if (loadingKpis()) {
      @for (i of [1,2,3,4]; track i) {
        <div class="kc-skel shimmer"></div>
      }
    } @else {
      @for (kpi of kpis(); track kpi.label) {
        <div class="kc">
          <div class="kc-glow" [style.background]="kpi.accentColor"></div>
          <div class="kc-top">
            <div class="kc-icon" [style.background]="kpi.iconBg" [innerHTML]="kpi.icon"></div>
            <span class="kc-badge" [style.background]="kpi.badgeBg" [style.color]="kpi.badgeColor">{{ kpi.badge }}</span>
          </div>
          <div class="kc-val">{{ kpi.value }}</div>
          <div class="kc-lbl">{{ kpi.label }}</div>
        </div>
      }
    }
  </div>

  <!-- ════════ CHARTS ROW ════════ -->
  <div class="charts-row">

    <!-- Revenus & Dépenses -->
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">Revenus & Dépenses</div>
          <div class="card-sub">Évolution mensuelle avec solde net</div>
        </div>
        <div class="legend">
          <span><i style="background:#4ADE80;border-radius:3px"></i>Revenus</span>
          <span><i style="background:#FF6B6B;border-radius:3px"></i>Dépenses</span>
          <span><i class="ln" style="background:var(--gold)"></i>Solde</span>
        </div>
      </div>
      @if (loadingGraphiques()) {
        <div class="chart-skel shimmer" style="height:260px"></div>
      } @else {
        <div style="height:260px">
          <canvas baseChart [data]="mixedChartData()" [options]="mixedOptions" type="bar"></canvas>
        </div>
      }
    </div>

    <!-- Bénéfice net -->
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">Bénéfice net</div>
          <div class="card-sub">Solde mensuel cumulé</div>
        </div>
        <span class="ben-badge" [class.pos]="beneficeTotal()>=0" [class.neg]="beneficeTotal()<0">
          {{ beneficeTotal()>=0?'+':'' }}{{ beneficeTotal() | currencyFcfa }}
        </span>
      </div>
      @if (loadingGraphiques()) {
        <div class="chart-skel shimmer" style="height:200px"></div>
      } @else {
        <div style="height:200px">
          <canvas baseChart [data]="lineChartData()" [options]="lineOptions" type="line"></canvas>
        </div>
      }
    </div>
  </div>

  <!-- ════════ BOTTOM ROW ════════ -->
  <div class="bottom-row">

    <!-- Dépenses par catégorie -->
    <div class="card">
      <div class="card-head">
        <div>
          <div class="card-title">Dépenses</div>
          <div class="card-sub">Répartition par catégorie</div>
        </div>
      </div>
      @if (loadingGraphiques()) {
        <div class="chart-skel shimmer" style="height:200px"></div>
      } @else if (donutData().labels?.length) {
        <div style="height:210px">
          <canvas baseChart [data]="donutData()" [options]="donutOptions" type="doughnut"></canvas>
        </div>
      } @else {
        <div class="empty-state">
          <svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" style="color:var(--txt3)">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/>
          </svg>
          Aucune dépense enregistrée
        </div>
      }
    </div>

    <!-- Stocks en alerte -->
    <div class="card">
      <div class="card-head">
        <div class="card-title">Stocks en alerte</div>
        <a routerLink="/stocks" class="lk">Gérer →</a>
      </div>
      @if (stocksAlerte().length) {
        @for (s of stocksAlerte().slice(0,4); track s.id) {
          <div class="alert-item">
            <div class="alert-dot"></div>
            <div style="flex:1;min-width:0">
              <div class="alert-name">{{ s.nom }}</div>
              <div class="alert-qty">{{ s.quantite_actuelle }} {{ s.unite }} / seuil {{ s.seuil_alerte }}</div>
              @if (s.seuil_alerte > 0) {
                <div class="progress-wrap">
                  <div class="progress-bar"
                       [style.width.%]="Math.min(100, (s.quantite_actuelle / s.seuil_alerte) * 100)">
                  </div>
                </div>
              }
            </div>
            <span class="alert-bdg">BAS</span>
          </div>
        }
      } @else {
        <div class="ok-state">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Tous les stocks sont OK
        </div>
      }
    </div>

    <!-- Tâches urgentes + Activité récente -->
    <div class="card">
      <div class="card-head">
        <div class="card-title">Tâches urgentes</div>
        <a routerLink="/taches" class="lk">Voir tout →</a>
      </div>
      @if (taches().length) {
        @for (t of taches().slice(0,4); track t.id) {
          <div class="task-item">
            <div class="task-dot"
                 [style.background]="t.priorite==='haute'?'var(--red)':t.priorite==='normale'?'var(--gold)':'var(--green)'"
                 [style.boxShadow]="t.priorite==='haute'?'0 0 8px var(--red)':''">
            </div>
            <div>
              <div class="task-title">{{ t.titre }}</div>
              <div class="task-date">{{ t.date_echeance ? (t.date_echeance | dateFr) : 'Sans échéance' }}</div>
            </div>
          </div>
        }
      } @else if (activites().length) {
        <!-- Fallback: activité récente si pas de tâches -->
        @for (act of activites().slice(0,4); track act.id) {
          <div class="act-item">
            <div class="act-dot">
              <svg width="12" height="12" fill="none" stroke="var(--green)" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              </svg>
            </div>
            <div>
              <div class="act-title">{{ act.titre }}</div>
              <div class="act-date">{{ act.date | dateFr }}</div>
            </div>
          </div>
        }
      } @else {
        <div class="ok-state">
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Aucune urgence
        </div>
      }
    </div>
  </div>
</div>
  `,
})
export class DashboardComponent implements OnInit {
  protected readonly Math = Math;
  auth = inject(AuthService);
  private api = inject(ApiService);

  loadingKpis      = signal(true);
  loadingGraphiques = signal(true);
  kpis         = signal<any[]>([]);
  meteo        = signal<any>(null);
  stocksAlerte = signal<any[]>([]);
  taches       = signal<any[]>([]);
  activites    = signal<any[]>([]);

  private revenusMois       = signal<number[]>([]);
  private depensesMois      = signal<number[]>([]);
  private labelsMois        = signal<string[]>([]);
  private depensesCategories = signal<any[]>([]);

  beneficeTotal = computed(() =>
    this.revenusMois().reduce((a, b) => a + b, 0) - this.depensesMois().reduce((a, b) => a + b, 0)
  );

  initiale = computed(() => {
    const n = this.auth.user()?.prenom || this.auth.user()?.nom || 'U';
    return n.charAt(0).toUpperCase();
  });

  greeting = computed(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir';
  });

  meteoIcon = computed(() => {
    const d = this.meteo()?.description?.toLowerCase() || '';
    if (d.includes('pluie') || d.includes('rain')) return '🌧️';
    if (d.includes('nuage') || d.includes('cloud')) return '⛅';
    if (d.includes('orage')) return '⛈️';
    return '☀️';
  });

  /* ── Chart options — dark theme ─────────────────────────── */
  mixedOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { ...TOOLTIP, callbacks: { label: (c: any) => ` ${c.dataset.label}: ${new Intl.NumberFormat('fr-FR').format(c.parsed.y)} F` } },
    },
    scales: {
      x: {
        grid: { display: false }, border: { display: false },
        ticks: { font: { size: 11, family: 'DM Sans' }, color: '#4A7057', maxRotation: 0 },
      },
      y: {
        position: 'left',
        grid: { color: 'rgba(255,255,255,0.05)', drawTicks: false },
        border: { display: false, dash: [4, 4] },
        ticks: { font: { size: 11, family: 'DM Sans' }, color: '#4A7057', padding: 10,
                 callback: (v: any) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v) },
      },
      y1: {
        position: 'right',
        grid: { display: false }, border: { display: false },
        ticks: { font: { size: 10, family: 'DM Sans' }, color: '#8A6E1A', padding: 10,
                 callback: (v: any) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v) },
      },
    },
  };

  donutOptions: ChartOptions<'doughnut'> = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 11, family: 'DM Sans' }, padding: 14, boxWidth: 10, boxHeight: 10, color: '#7DA888' },
      },
      tooltip: { ...TOOLTIP, callbacks: { label: (c: any) => ` ${c.label}: ${new Intl.NumberFormat('fr-FR').format(c.raw as number)} F` } },
    },
    cutout: '68%',
    animation: { animateRotate: true, animateScale: true },
  };

  lineOptions: ChartConfiguration['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { ...TOOLTIP, callbacks: { label: (c: any) => ` Solde: ${new Intl.NumberFormat('fr-FR').format(c.parsed.y)} F` } },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false },
           ticks: { font: { size: 10, family: 'DM Sans' }, color: '#4A7057', maxRotation: 0 } },
      y: { grid: { color: 'rgba(255,255,255,0.05)', drawTicks: false }, border: { display: false, dash: [4, 4] },
           ticks: { font: { size: 10, family: 'DM Sans' }, color: '#4A7057', padding: 10,
                    callback: (v: any) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v) } },
    },
    elements: {
      line: { tension: 0.45, borderWidth: 2.5 },
      point: { radius: 3, hoverRadius: 6, borderWidth: 2, borderColor: '#0d1a10' },
    },
  };

  /* ── Computed chart data ──────────────────────────────────── */
  mixedChartData = computed<ChartData<'bar'>>(() => {
    const ben = this.revenusMois().map((r, i) => r - (this.depensesMois()[i] ?? 0));
    return {
      labels: this.labelsMois(),
      datasets: [
        { type: 'bar' as any, label: 'Revenus', data: this.revenusMois(),
          backgroundColor: 'rgba(74,222,128,0.75)', hoverBackgroundColor: 'rgba(74,222,128,1)',
          borderRadius: { topLeft: 5, topRight: 5 } as any, borderSkipped: false, yAxisID: 'y', order: 2 },
        { type: 'bar' as any, label: 'Dépenses', data: this.depensesMois(),
          backgroundColor: 'rgba(255,107,107,0.65)', hoverBackgroundColor: 'rgba(255,107,107,0.9)',
          borderRadius: { topLeft: 5, topRight: 5 } as any, borderSkipped: false, yAxisID: 'y', order: 2 },
        { type: 'line' as any, label: 'Solde net', data: ben,
          borderColor: '#F5C842',
          _gradientFrom: 'rgba(245,200,66,0.20)', _gradientTo: 'rgba(245,200,66,0)',
          fill: true,
          pointBackgroundColor: ben.map(v => v >= 0 ? '#4ADE80' : '#FF6B6B'),
          pointBorderColor: '#0d1a10', pointBorderWidth: 2,
          yAxisID: 'y1', order: 1,
        } as any,
      ],
    };
  });

  donutData = computed<ChartData<'doughnut'>>(() => {
    const cats = this.depensesCategories();
    const PALETTE = ['#4ADE80','#F5C842','#60A5FA','#F87171','#C084FC','#34D399','#FB923C','#A3E635','#F472B6','#38BDF8'];
    return {
      labels: cats.map(c => c.categorie ?? 'Autre'),
      datasets: [{
        data: cats.map(c => c.total),
        backgroundColor: PALETTE.slice(0, cats.length).map(c => c + 'cc'),
        hoverBackgroundColor: PALETTE.slice(0, cats.length),
        borderWidth: 2, borderColor: '#111F16', hoverOffset: 6,
      }],
    };
  });

  lineChartData = computed<ChartData<'line'>>(() => {
    const ben = this.revenusMois().map((r, i) => r - (this.depensesMois()[i] ?? 0));
    const allPos = ben.every(v => v >= 0);
    return {
      labels: this.labelsMois(),
      datasets: [{
        label: 'Bénéfice net', data: ben,
        borderColor: allPos ? '#4ADE80' : '#F5C842',
        _gradientFrom: allPos ? 'rgba(74,222,128,0.22)' : 'rgba(245,200,66,0.18)',
        _gradientTo: 'rgba(0,0,0,0)',
        fill: true,
        pointBackgroundColor: ben.map(v => v >= 0 ? '#4ADE80' : '#FF6B6B'),
        pointBorderColor: '#0d1a10', pointBorderWidth: 2,
      } as any],
    };
  });

  ngOnInit(): void {
    this.loadAll();
    this.loadNotifications();
    this.loadMeteo();
  }

  private svgIcon(path: string, color: string): string {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
  }

  private loadAll(): void {
    this.api.get<any>('/api/dashboard').subscribe({
      next: res => {
        const d = res.kpis ?? {};
        this.kpis.set([
          { label: 'Champs actifs',    value: d.nb_champs ?? 0,
            icon: this.svgIcon('M2 20h20M5 20V8l7-5 7 5v12','#4ADE80'),
            iconBg: 'rgba(74,222,128,.12)', badge: 'Total',
            badgeBg: 'rgba(74,222,128,.15)', badgeColor: '#4ADE80', accentColor: '#4ADE80' },
          { label: 'Cultures actives', value: d.nb_cultures_actives ?? 0,
            icon: this.svgIcon('M12 2a5 5 0 0 0-5 5c0 3 5 11 5 11s5-8 5-11a5 5 0 0 0-5-5z','#F5C842'),
            iconBg: 'rgba(245,200,66,.12)', badge: 'En cours',
            badgeBg: 'rgba(245,200,66,.15)', badgeColor: '#F5C842', accentColor: '#F5C842' },
          { label: 'Ventes totales',   value: d.total_ventes != null ? new Intl.NumberFormat('fr-FR',{notation:'compact'}).format(d.total_ventes)+' F':'—',
            icon: this.svgIcon('M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6','#60A5FA'),
            iconBg: 'rgba(96,165,250,.12)', badge: 'FCFA',
            badgeBg: 'rgba(96,165,250,.15)', badgeColor: '#60A5FA', accentColor: '#60A5FA' },
          { label: 'Employés actifs',  value: d.nb_employes ?? 0,
            icon: this.svgIcon('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','#C084FC'),
            iconBg: 'rgba(192,132,252,.12)', badge: 'Actifs',
            badgeBg: 'rgba(192,132,252,.15)', badgeColor: '#C084FC', accentColor: '#C084FC' },
        ]);
        this.loadingKpis.set(false);

        const gf = Array.isArray(res.graphiqueFinance) ? res.graphiqueFinance : [];
        this.labelsMois.set(gf.map((m: any) => m.mois));
        this.revenusMois.set(gf.map((m: any) => m.ventes ?? 0));
        this.depensesMois.set(gf.map((m: any) => m.depenses ?? 0));
        this.loadingGraphiques.set(false);

        this.depensesCategories.set(Array.isArray(res.graphiqueDepenses) ? res.graphiqueDepenses : []);
        this.stocksAlerte.set(Array.isArray(res.stocksAlertes) ? res.stocksAlertes : []);
        this.taches.set(Array.isArray(res.tachesEnCours) ? res.tachesEnCours : []);
      },
      error: () => {
        const e = { value: '—', badge: '—', badgeBg: 'rgba(255,255,255,.06)', badgeColor: '#4A7057' };
        this.kpis.set([
          { ...e, label: 'Champs actifs',    icon: this.svgIcon('M2 20h20M5 20V8l7-5 7 5v12','#4A7057'),    iconBg:'rgba(74,222,128,.06)',  accentColor:'#4ADE80' },
          { ...e, label: 'Cultures actives', icon: this.svgIcon('M12 2a5 5 0 0 0-5 5c0 3 5 11 5 11s5-8 5-11a5 5 0 0 0-5-5z','#6b5a1a'), iconBg:'rgba(245,200,66,.06)', accentColor:'#F5C842' },
          { ...e, label: 'Ventes totales',   icon: this.svgIcon('M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6','#2a4a6b'), iconBg:'rgba(96,165,250,.06)', accentColor:'#60A5FA' },
          { ...e, label: 'Employés actifs',  icon: this.svgIcon('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','#5a2d7a'), iconBg:'rgba(192,132,252,.06)', accentColor:'#C084FC' },
        ]);
        this.loadingKpis.set(false);
        this.loadingGraphiques.set(false);
      },
    });
  }

  private loadNotifications(): void {
    this.api.get<any>('/api/notifications', { per_page: 5 }).subscribe({
      next: res => {
        const items = res.data?.data ?? res.data ?? [];
        this.activites.set(items.slice(0, 5).map((n: any) => ({ id: n.id, titre: n.message ?? 'Notification', date: n.created_at })));
      },
      error: () => {},
    });
  }

  private loadMeteo(): void {
    this.api.get<any>('/api/meteo').subscribe({
      next: res => this.meteo.set(res.data ?? res),
      error: () => {},
    });
  }
}

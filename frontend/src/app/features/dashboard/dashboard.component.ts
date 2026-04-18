import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartData, ChartOptions } from 'chart.js';
import {
  Chart, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler
} from 'chart.js';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyFcfaPipe } from '../../core/pipes/currency-fcfa.pipe';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';

Chart.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend, Filler);

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, BaseChartDirective, CurrencyFcfaPipe, DateFrPipe],
  styles: [`
    :host { display: block; }

    .d {
      --card:        #ffffff;
      --border:      #e5ddd2;
      --border-lt:   #f0ebe3;
      --shadow:      0 1px 4px rgba(26,48,32,.07), 0 1px 2px rgba(0,0,0,.04);
      --shadow-md:   0 4px 16px rgba(26,48,32,.10);
      --green:       #16a34a;
      --green-bg:    #f0fdf4;
      --green-bdr:   #bbf7d0;
      --red:         #dc2626;
      --red-bg:      #fef2f2;
      --orange:      #d97706;
      --blue:        #2563eb;
      --purple:      #7c3aed;
      --txt:         #1a2332;
      --txt2:        #6b7280;
      --txt3:        #9ca3af;
      font-family: 'DM Sans', system-ui, sans-serif;
      color: var(--txt);
      /* offset parent p-4 lg:p-6 */
      margin: -16px -16px -16px;
      padding: 24px 16px 40px;
    }
    @media (min-width: 1024px) {
      .d { margin: -24px -24px -24px; padding: 28px 32px 48px; }
    }

    /* ── Header ── */
    .pg-hd { margin-bottom: 24px; }
    .pg-title {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 22px; font-weight: 700; color: var(--txt); margin: 0 0 3px;
    }
    .pg-sub { font-size: 13px; color: var(--txt2); margin: 0; }

    /* ── KPI grid ── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px; margin-bottom: 16px;
    }
    @media (min-width: 640px)  { .kpi-grid { grid-template-columns: repeat(3, 1fr); } }
    @media (min-width: 1280px) { .kpi-grid { grid-template-columns: repeat(6, 1fr); } }

    .kc {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 14px; padding: 16px 18px 18px;
      box-shadow: var(--shadow);
      transition: transform .15s, box-shadow .15s;
    }
    .kc:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
    .kc.hl    { background: var(--green-bg); border-color: var(--green-bdr); }

    .kc-ico {
      width: 38px; height: 38px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
    }
    .kc-num {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 17px; font-weight: 800; line-height: 1.25;
      word-break: break-word;
    }
    .kc-lbl {
      font-size: 11px; font-weight: 500; color: var(--txt2);
      text-transform: uppercase; letter-spacing: .5px; margin-top: 4px;
    }

    /* ── Skeleton ── */
    .skel {
      background: linear-gradient(90deg, #f1ece5 0%, #e8e0d6 50%, #f1ece5 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
      border-radius: 10px;
    }
    @keyframes shimmer { from { background-position: -200% 0 } to { background-position: 200% 0 } }

    /* ── Middle row ── */
    .mid-row {
      display: grid; grid-template-columns: 1fr; gap: 14px; margin-bottom: 14px;
    }
    @media (min-width: 1024px) { .mid-row { grid-template-columns: 1.65fr 1fr; } }

    /* ── Bottom row ── */
    .bot-row {
      display: grid; grid-template-columns: 1fr; gap: 14px;
    }
    @media (min-width: 768px) { .bot-row { grid-template-columns: repeat(2, 1fr); } }

    /* ── Card ── */
    .card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: 14px; padding: 22px;
      box-shadow: var(--shadow);
    }
    .card-hd {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 8px; margin-bottom: 18px;
    }
    .card-title {
      font-family: 'Outfit', system-ui, sans-serif;
      font-size: 15px; font-weight: 700; color: var(--txt); margin: 0;
    }
    .card-lk {
      font-size: 13px; font-weight: 500; color: var(--green);
      text-decoration: none; white-space: nowrap;
    }
    .card-lk:hover { text-decoration: underline; }

    /* ── Synthèse ── */
    .syn-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 13px 0; border-bottom: 1px solid var(--border-lt);
    }
    .syn-row:last-of-type { border-bottom: none; }
    .syn-lbl { font-size: 14px; color: var(--txt2); }
    .syn-val { font-family: 'Outfit', system-ui, sans-serif; font-size: 16px; font-weight: 700; }
    .syn-row.net .syn-lbl  { font-size: 15px; font-weight: 600; color: var(--txt); }
    .syn-row.net .syn-val  { font-size: 18px; }
    .taux-wrap { margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--border-lt); }
    .taux-hd   { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .taux-lbl  { font-size: 13px; color: var(--txt2); }
    .taux-pct  { font-size: 13px; font-weight: 700; color: var(--txt); }
    .taux-track {
      height: 8px; background: #f1ece5; border-radius: 99px; overflow: hidden;
    }
    .taux-fill {
      height: 100%; border-radius: 99px;
      background: linear-gradient(90deg, #fcd34d, #f59e0b);
      transition: width .7s cubic-bezier(.4,0,.2,1);
    }

    /* ── Recent items ── */
    .rec-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 11px 0; border-bottom: 1px solid var(--border-lt);
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
      font-size: 14px; font-weight: 700; white-space: nowrap; flex-shrink: 0;
    }

    /* empty state */
    .empty {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; height: 120px;
      font-size: 13px; color: var(--txt3); gap: 6px;
    }
  `],
  template: `
<div class="d">

  <!-- ── Page Header ── -->
  <div class="pg-hd">
    <h1 class="pg-title">Tableau de bord</h1>
    <p class="pg-sub">Campagne agricole en cours</p>
  </div>

  <!-- ── KPI Cards ── -->
  <div class="kpi-grid">

    <!-- Total Ventes -->
    <div class="kc">
      <div class="kc-ico" style="background:#dcfce7">
        <svg width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v12M8 10h8M8 14h8"/>
        </svg>
      </div>
      <div class="kc-num" style="color:#16a34a">
        @if (loading()) { <div class="skel" style="height:20px;width:85%"></div> }
        @else { {{ totalVentes() | currencyFcfa }} }
      </div>
      <div class="kc-lbl">Total Ventes</div>
    </div>

    <!-- Total Dépenses -->
    <div class="kc">
      <div class="kc-ico" style="background:#fee2e2">
        <svg width="18" height="18" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>
        </svg>
      </div>
      <div class="kc-num" style="color:#dc2626">
        @if (loading()) { <div class="skel" style="height:20px;width:85%"></div> }
        @else { {{ totalDepenses() | currencyFcfa }} }
      </div>
      <div class="kc-lbl">Total Dépenses</div>
    </div>

    <!-- Solde Net — highlighted -->
    <div class="kc hl">
      <div class="kc-ico" style="background:#bbf7d0">
        <svg width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
      </div>
      <div class="kc-num" [style.color]="soldeNet() < 0 ? '#dc2626' : '#16a34a'">
        @if (loading()) { <div class="skel" style="height:20px;width:85%"></div> }
        @else { {{ soldeNet() | currencyFcfa }} }
      </div>
      <div class="kc-lbl">Solde Net</div>
    </div>

    <!-- Champs -->
    <div class="kc">
      <div class="kc-ico" style="background:#fff7ed">
        <svg width="18" height="18" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
      <div class="kc-num" style="color:#d97706;font-size:24px">
        @if (loading()) { <div class="skel" style="height:24px;width:40px"></div> }
        @else { {{ nbChamps() }} }
      </div>
      <div class="kc-lbl">Champs</div>
    </div>

    <!-- Cultures actives -->
    <div class="kc">
      <div class="kc-ico" style="background:#eff6ff">
        <svg width="18" height="18" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M12 22V12M12 12C12 7 7 4 2 6M12 12C12 7 17 4 22 6"/>
        </svg>
      </div>
      <div class="kc-num" style="color:#2563eb;font-size:24px">
        @if (loading()) { <div class="skel" style="height:24px;width:40px"></div> }
        @else { {{ nbCulturesActives() }} }
      </div>
      <div class="kc-lbl">Cultures actives</div>
    </div>

    <!-- Employés actifs -->
    <div class="kc">
      <div class="kc-ico" style="background:#f5f3ff">
        <svg width="18" height="18" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      </div>
      <div class="kc-num" style="color:#7c3aed;font-size:24px">
        @if (loading()) { <div class="skel" style="height:24px;width:40px"></div> }
        @else { {{ nbEmployes() }} }
      </div>
      <div class="kc-lbl">Employés actifs</div>
    </div>
  </div>

  <!-- ── Middle Row: Chart + Synthèse ── -->
  <div class="mid-row">

    <!-- Bar chart: Ventes vs Dépenses par exploitation -->
    <div class="card">
      <div class="card-hd">
        <p class="card-title">Ventes vs Dépenses par exploitation</p>
        <a routerLink="/finances" class="card-lk">Voir le détail →</a>
      </div>
      @if (parChamp().length) {
        <div style="height:270px">
          <canvas baseChart [data]="barData()" [options]="barOpts" type="bar"></canvas>
        </div>
      } @else {
        <div class="skel" style="height:270px"></div>
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

  <!-- ── Bottom Row: Recent lists ── -->
  <div class="bot-row">

    <!-- Dernières dépenses -->
    <div class="card">
      <div class="card-hd">
        <p class="card-title">Dernières dépenses</p>
        <a routerLink="/depenses" class="card-lk">Voir tout →</a>
      </div>
      @if (depensesRecentes().length) {
        @for (dep of depensesRecentes(); track dep.id) {
          <div class="rec-item">
            <div class="rec-ico" style="background:#fee2e2">
              <svg width="15" height="15" fill="none" stroke="#dc2626" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24">
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
            <div style="flex:1;display:flex;flex-direction:column;gap:6px">
              <div class="skel" style="height:13px;border-radius:4px"></div>
              <div class="skel" style="height:11px;width:55%;border-radius:4px"></div>
            </div>
          </div>
        }
      } @else {
        <div class="empty">Aucune dépense récente</div>
      }
    </div>

    <!-- Dernières ventes -->
    <div class="card">
      <div class="card-hd">
        <p class="card-title">Dernières ventes</p>
        <a routerLink="/ventes" class="card-lk">Voir tout →</a>
      </div>
      @if (ventesRecentes().length) {
        @for (ven of ventesRecentes(); track ven.id) {
          <div class="rec-item">
            <div class="rec-ico" style="background:#dcfce7">
              <svg width="15" height="15" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
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
            <div style="flex:1;display:flex;flex-direction:column;gap:6px">
              <div class="skel" style="height:13px;border-radius:4px"></div>
              <div class="skel" style="height:11px;width:55%;border-radius:4px"></div>
            </div>
          </div>
        }
      } @else {
        <div class="empty">Aucune vente récente</div>
      }
    </div>
  </div>

</div>
  `,
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(ApiService);

  loading       = signal(true);
  totalVentes   = signal(0);
  totalDepenses = signal(0);
  nbChamps          = signal(0);
  nbCulturesActives = signal(0);
  nbEmployes        = signal(0);
  depensesRecentes  = signal<any[]>([]);
  ventesRecentes    = signal<any[]>([]);
  parChamp          = signal<any[]>([]);

  soldeNet   = computed(() => this.totalVentes() - this.totalDepenses());
  tauxCharges = computed(() =>
    this.totalVentes() > 0
      ? Math.min(100, Math.round((this.totalDepenses() / this.totalVentes()) * 100))
      : 0
  );

  /* ── Bar chart ── */
  barData = computed<ChartData<'bar'>>(() => ({
    labels: this.parChamp().map(c => c.nom ?? c.champ ?? 'Champ'),
    datasets: [
      {
        label: 'Ventes',
        data: this.parChamp().map(c => c.total_ventes ?? 0),
        backgroundColor: '#4ade80',
        hoverBackgroundColor: '#22c55e',
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Dépenses',
        data: this.parChamp().map(c => c.total_depenses ?? 0),
        backgroundColor: '#fca5a5',
        hoverBackgroundColor: '#f87171',
        borderRadius: 6,
        borderSkipped: false,
      },
    ],
  }));

  barOpts: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyleWidth: 10,
          padding: 20,
          font: { size: 12, family: 'DM Sans' },
          color: '#6b7280',
        },
      },
      tooltip: {
        backgroundColor: '#1e293b',
        titleColor: '#94a3b8',
        bodyColor: '#f1f5f9',
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (c: any) =>
            ` ${c.dataset.label} : ${new Intl.NumberFormat('fr-FR').format(c.raw as number)} FCFA`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#6b7280', font: { size: 12, family: 'DM Sans' } },
      },
      y: {
        grid: { color: '#f0ebe3' },
        border: { display: false },
        ticks: {
          color: '#6b7280',
          font: { size: 11, family: 'DM Sans' },
          padding: 8,
          callback: (v: any) =>
            new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(v),
        },
      },
    },
  };

  ngOnInit(): void {
    /* Unified dashboard endpoint */
    this.api.get<any>('/api/dashboard').subscribe({
      next: res => {
        const k = res.kpis ?? {};
        this.nbChamps.set(k.nb_champs ?? 0);
        this.nbCulturesActives.set(k.nb_cultures_actives ?? 0);
        this.nbEmployes.set(k.nb_employes ?? 0);

        /* Financial totals — try kpis first, fall back to summing monthly data */
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
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    /* Per-champ breakdown for the bar chart */
    this.api.get<any>('/api/finance/par-champ').subscribe({
      next: res => this.parChamp.set(Array.isArray(res) ? res : (res.data ?? [])),
      error: () => {},
    });
  }
}

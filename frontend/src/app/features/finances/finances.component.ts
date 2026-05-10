import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { toObservable, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { CurrencyFcfaPipe } from '../../core/pipes/currency-fcfa.pipe';
import { CampagneService } from '../../core/services/campagne.service';

@Component({
  selector: 'app-finances',
  standalone: true,
  imports: [CurrencyFcfaPipe, DecimalPipe],
  template: `
    <div class="pg-wrap space-y-6">

      <div class="flex items-center justify-between">
        <div>
          <h1>Finances</h1>
          <p class="pg-sub">Analyse financière de votre exploitation</p>
          @if (campagneService.estFiltre() && periode() === 'campagne') {
            <div class="inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-lg text-xs bg-amber-50 border border-amber-200 text-amber-800">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Filtré sur <strong class="ml-1">{{ campagneService.campagneActive()?.nom }}</strong>
              <button (click)="campagneService.reinitialiser()" class="ml-1 text-amber-600 hover:text-amber-800 font-bold">✕</button>
            </div>
          }
        </div>
        <div class="flex gap-2">
          <select class="form-input h-9 text-sm" (change)="periode.set($any($event.target).value); load()">
            <option value="campagne" [selected]="periode() === 'campagne'">
              {{ campagneService.campagneActive()?.nom ?? 'Campagne courante' }}
            </option>
            <option value="mois">Ce mois</option>
            <option value="3mois">3 mois</option>
            <option value="6mois">6 mois</option>
            <option value="annee">Cette année</option>
            <option value="tout">Tout</option>
          </select>
          <button (click)="exportPdf()" [disabled]="exportingPdf()" class="btn-secondary h-9 px-4 text-sm">
            {{ exportingPdf() ? '...' : '📄 PDF' }}
          </button>
          <button (click)="exportExcel()" [disabled]="exportingExcel()" class="btn-secondary h-9 px-4 text-sm">
            {{ exportingExcel() ? '...' : '📊 Excel' }}
          </button>
        </div>
      </div>

      <!-- KPIs financiers -->
      @if (loading()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          @for (i of [1,2,3,4]; track i) { <div class="card animate-pulse h-24 bg-neutral-100"></div> }
        </div>
      } @else if (resume()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card border-l-4 border-l-green-400">
            <div class="text-xs text-neutral-500 mb-1">Revenus (ventes)</div>
            <div class="text-xl font-bold text-green-600">{{ resume().total_ventes | currencyFcfa }}</div>
          </div>
          <div class="card border-l-4 border-l-red-400">
            <div class="text-xs text-neutral-500 mb-1">Dépenses totales</div>
            <div class="text-xl font-bold text-red-600">{{ resume().total_depenses | currencyFcfa }}</div>
          </div>
          <div class="card border-l-4"
               [class.border-l-green-400]="resume().solde_net >= 0"
               [class.border-l-red-400]="resume().solde_net < 0">
            <div class="text-xs text-neutral-500 mb-1">Solde net</div>
            <div class="text-xl font-bold"
                 [class.text-green-600]="resume().solde_net >= 0"
                 [class.text-red-600]="resume().solde_net < 0">
              {{ resume().solde_net | currencyFcfa }}
            </div>
          </div>
          <div class="card border-l-4 border-l-blue-400">
            <div class="text-xs text-neutral-500 mb-1">Marge nette</div>
            <div class="text-xl font-bold text-blue-600">
              {{ resume().total_ventes > 0 ? (resume().solde_net / resume().total_ventes * 100 | number:'1.1-1') : '0' }}%
            </div>
          </div>
        </div>
      } @else {
        <div class="card text-center py-8">
          <p class="text-neutral-400 text-sm">Aucune donnée financière pour cette période.</p>
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Ventes par culture -->
        <div class="card">
          <h2 class="font-semibold text-neutral-900 mb-4">Ventes par culture</h2>
          @if (parCulture().length) {
            <div class="space-y-3">
              @for (item of parCulture(); track item.culture_id) {
                <div class="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-neutral-900 text-sm">{{ item.culture?.nom ?? 'Culture #' + item.culture_id }}</span>
                    <span class="text-sm font-semibold text-green-600">{{ item.total_ventes | currencyFcfa }}</span>
                  </div>
                  <div class="text-xs text-neutral-500">
                    Quantité vendue : {{ item.total_kg }} kg
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-neutral-400 text-sm text-center py-8">Aucune vente enregistrée</p>
          }
        </div>

        <!-- Résultats par champ -->
        <div class="card">
          <h2 class="font-semibold text-neutral-900 mb-4">Résultats par champ</h2>
          @if (parChamp().length) {
            <div class="space-y-3">
              @for (champ of parChamp(); track champ.champ_id) {
                <div class="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-neutral-900 text-sm">
                      {{ champNom(champ.champ_id) }}
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                          [class.bg-green-100]="champ.solde_net >= 0"
                          [class.text-green-700]="champ.solde_net >= 0"
                          [class.bg-red-100]="champ.solde_net < 0"
                          [class.text-red-700]="champ.solde_net < 0">
                      {{ champ.solde_net | currencyFcfa }}
                    </span>
                  </div>
                  <div class="flex justify-between text-xs text-neutral-500">
                    <span>Ventes : {{ champ.total_ventes | currencyFcfa }}</span>
                    <span>Dépenses : {{ champ.total_depenses | currencyFcfa }}</span>
                  </div>
                </div>
              }
            </div>
          } @else {
            <p class="text-neutral-400 text-sm text-center py-8">Aucune donnée disponible</p>
          }
        </div>

      </div>

      <!-- Tableau récapitulatif par champ -->
      @if (resume()) {
        <div class="card">
          <h2 class="font-semibold text-neutral-900 mb-4">Tableau récapitulatif par champ</h2>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-neutral-50">
                <tr>
                  <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Exploitation</th>
                  <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Ventes</th>
                  <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Dépenses</th>
                  <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Solde net</th>
                  <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Marge</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-50">
                @for (champ of parChamp(); track champ.champ_id) {
                  <tr class="hover:bg-neutral-50/50">
                    <td class="px-4 py-3 font-medium text-neutral-900">{{ champNom(champ.champ_id) }}</td>
                    <td class="px-4 py-3 text-right text-green-600 font-medium">{{ champ.total_ventes | currencyFcfa }}</td>
                    <td class="px-4 py-3 text-right text-red-600">{{ champ.total_depenses | currencyFcfa }}</td>
                    <td class="px-4 py-3 text-right font-semibold"
                        [class.text-green-600]="champ.solde_net >= 0"
                        [class.text-red-600]="champ.solde_net < 0">
                      {{ champ.solde_net | currencyFcfa }}
                    </td>
                    <td class="px-4 py-3 text-right text-sm text-neutral-600">
                      {{ champ.total_ventes > 0 ? (champ.solde_net / champ.total_ventes * 100 | number:'1.1-1') : '—' }}%
                    </td>
                  </tr>
                }
                <!-- Ligne dépenses générales (sans champ) -->
                @if (depensesGenerales() > 0) {
                  <tr class="hover:bg-amber-50/30 bg-amber-50/20">
                    <td class="px-4 py-3 font-medium text-neutral-700 italic">Dépenses générales (sans exploitation)</td>
                    <td class="px-4 py-3 text-right text-neutral-400">—</td>
                    <td class="px-4 py-3 text-right text-red-500 font-medium">{{ depensesGenerales() | currencyFcfa }}</td>
                    <td class="px-4 py-3 text-right text-red-500 font-medium">{{ -depensesGenerales() | currencyFcfa }}</td>
                    <td class="px-4 py-3 text-right text-neutral-400">—</td>
                  </tr>
                }
              </tbody>
              <!-- Ligne TOTAL -->
              <tfoot class="border-t-2 border-neutral-200 bg-neutral-50">
                <tr>
                  <td class="px-4 py-3 font-bold text-neutral-900 uppercase text-sm">TOTAL</td>
                  <td class="px-4 py-3 text-right font-bold text-green-600">{{ resume().total_ventes | currencyFcfa }}</td>
                  <td class="px-4 py-3 text-right font-bold text-red-600">{{ resume().total_depenses | currencyFcfa }}</td>
                  <td class="px-4 py-3 text-right font-bold text-lg"
                      [class.text-green-600]="resume().solde_net >= 0"
                      [class.text-red-600]="resume().solde_net < 0">
                    {{ resume().solde_net | currencyFcfa }}
                  </td>
                  <td class="px-4 py-3 text-right font-bold text-neutral-700">
                    {{ resume().total_ventes > 0 ? (resume().solde_net / resume().total_ventes * 100 | number:'1.1-1') : '—' }}%
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      }

    </div>
  `,
})
export class FinancesComponent implements OnInit {
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  campagneService = inject(CampagneService);

  loading = signal(true);
  exportingExcel = signal(false);
  exportingPdf = signal(false);
  resume = signal<any>(null);
  parCulture = signal<any[]>([]);
  parChamp = signal<any[]>([]);
  champsMap = signal<Record<number, string>>({});
  periode = signal('campagne');

  constructor() {
    toObservable(this.campagneService.campagneActive)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.load());
  }

  // Dépenses non rattachées à un champ = total_depenses − Σ dépenses par champ
  depensesGenerales = computed(() => {
    const total = this.resume()?.total_depenses ?? 0;
    const parChampTotal = this.parChamp().reduce((sum, c) => sum + Number(c.total_depenses), 0);
    return Math.max(0, total - parChampTotal);
  });

  ngOnInit(): void {
    // Charger les noms des champs pour l'affichage
    this.api.get<any>('/api/champs').subscribe({
      next: res => {
        const list = Array.isArray(res) ? res : res.data ?? [];
        const map: Record<number, string> = {};
        list.forEach((c: any) => { map[c.id] = c.nom; });
        this.champsMap.set(map);
      },
    });
  }

  load(): void {
    this.loading.set(true);
    const c = this.campagneService.campagneActive();

    let baseParams: any = {};
    if (this.periode() === 'campagne' && c) {
      baseParams = { campagne_id: c.id };
    } else if (this.periode() !== 'campagne') {
      const { debut, fin } = this.plage();
      if (debut) baseParams['date_debut'] = debut;
      if (fin)   baseParams['date_fin']   = fin;
    }
    // Note: if periode === 'campagne' but no active campaign → no params → all data

    this.api.get<any>('/api/finance/resume', baseParams).subscribe({
      next: res => { this.resume.set(res); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.api.get<any>('/api/finance/par-culture', baseParams).subscribe({
      next: res => this.parCulture.set(Array.isArray(res) ? res : res.data ?? []),
      error: () => {},
    });
    this.api.get<any>('/api/finance/par-champ', baseParams).subscribe({
      next: res => this.parChamp.set(Array.isArray(res) ? res : res.data ?? []),
      error: () => {},
    });
  }

  champNom(id: number): string {
    return this.champsMap()[id] ?? `Champ #${id}`;
  }

  private plage(): { debut: string | null; fin: string | null } {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    switch (this.periode()) {
      case 'tout':     return { debut: null, fin: null };
      case 'mois':     return { debut: new Date(y, m, 1).toISOString().split('T')[0], fin: new Date(y, m + 1, 0).toISOString().split('T')[0] };
      case '3mois':    return { debut: new Date(y, m - 2, 1).toISOString().split('T')[0], fin: new Date(y, m + 1, 0).toISOString().split('T')[0] };
      case '6mois':    return { debut: new Date(y, m - 5, 1).toISOString().split('T')[0], fin: new Date(y, m + 1, 0).toISOString().split('T')[0] };
      default:         return { debut: `${y}-01-01`, fin: `${y}-12-31` };
    }
  }

  private buildQuery(): string {
    const c = this.campagneService.campagneActive();
    if (this.periode() === 'campagne' && c) {
      return `?campagne_id=${c.id}`;
    }
    const { debut, fin } = this.plage();
    const params = new URLSearchParams();
    if (debut) params.set('date_debut', debut);
    if (fin)   params.set('date_fin', fin);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  exportExcel(): void {
    this.exportingExcel.set(true);
    this.api.getBlob(`/api/finance/export-excel${this.buildQuery()}`).subscribe({
      next: blob => {
        this.downloadBlob(blob, `rapport-finances-agri-erp.xlsx`);
        this.exportingExcel.set(false);
      },
      error: () => { this.exportingExcel.set(false); this.notif.error('Erreur lors de l\'export Excel.'); },
    });
  }

  exportPdf(): void {
    this.exportingPdf.set(true);
    this.api.getBlob(`/api/finance/rapport-pdf${this.buildQuery()}`).subscribe({
      next: blob => {
        this.downloadBlob(blob, `rapport-finances-agri-erp.pdf`);
        this.exportingPdf.set(false);
      },
      error: () => { this.exportingPdf.set(false); this.notif.error('Erreur lors de l\'export PDF.'); },
    });
  }
}

import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyFcfaPipe } from '../../core/pipes/currency-fcfa.pipe';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-rapports',
  standalone: true,
  imports: [CurrencyFcfaPipe, DateFrPipe, DecimalPipe],
  styles: [`
    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      body { background: white !important; }
      .card { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
    }
    .print-only { display: none; }
  `],
  template: `
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between no-print">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900">Rapports</h1>
          <p class="text-neutral-500 text-sm">Générez et téléchargez vos bilans mensuels</p>
        </div>
        <div class="flex items-center gap-3">
          <!-- Filtre période -->
          <select (change)="changerPeriode($event)"
                  class="form-input text-sm h-9 py-0 w-40">
            <option value="mois">Ce mois</option>
            <option value="trimestre">Ce trimestre</option>
            <option value="saison">Cette saison</option>
            <option value="annee">Cette année</option>
          </select>
          <button (click)="imprimerRapport()"
                  class="btn-primary text-sm h-9 px-4 flex items-center gap-2">
            🖨️ Imprimer / PDF
          </button>
        </div>
      </div>

      @if (chargement()) {
        <div class="card flex items-center justify-center py-16">
          <div class="text-center">
            <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p class="text-neutral-500 text-sm">Chargement du rapport...</p>
          </div>
        </div>
      } @else {

      <!-- === CONTENU DU RAPPORT (imprimable) === -->
      <div id="rapport-contenu">

        <!-- En-tête rapport (visible à l'impression) -->
        <div class="card print-only mb-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                <span class="text-white font-bold">K</span>
              </div>
              <div>
                <div class="font-bold text-neutral-900">Agri-ERP</div>
                <div class="text-xs text-neutral-500">Rapport financier agricole</div>
              </div>
            </div>
            <div class="text-right">
              <div class="font-semibold text-neutral-900">{{ auth.organisation()?.nom }}</div>
              <div class="text-xs text-neutral-500">Généré le {{ dateGeneration() | dateFr }}</div>
            </div>
          </div>
        </div>

        <!-- Titre de période -->
        <div class="card no-print">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-2xl">📊</div>
            <div>
              <h2 class="font-bold text-neutral-900 text-lg">Bilan financier — {{ labelPeriode() }}</h2>
              <p class="text-neutral-500 text-sm">{{ auth.organisation()?.nom }}</p>
            </div>
            <div class="ml-auto text-right">
              <p class="text-xs text-neutral-400">Généré le {{ dateGeneration() | dateFr }}</p>
            </div>
          </div>
        </div>

        <!-- KPIs financiers -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card text-center">
            <div class="text-2xl font-bold text-green-600">{{ finance()?.total_revenus | currencyFcfa }}</div>
            <div class="text-xs text-neutral-500 mt-1">Total revenus</div>
          </div>
          <div class="card text-center">
            <div class="text-2xl font-bold text-red-500">{{ finance()?.total_depenses | currencyFcfa }}</div>
            <div class="text-xs text-neutral-500 mt-1">Total dépenses</div>
          </div>
          <div class="card text-center">
            <div class="text-2xl font-bold"
                 [class.text-green-600]="(finance()?.benefice_net ?? 0) >= 0"
                 [class.text-red-500]="(finance()?.benefice_net ?? 0) < 0">
              {{ finance()?.benefice_net | currencyFcfa }}
            </div>
            <div class="text-xs text-neutral-500 mt-1">Bénéfice net</div>
          </div>
          <div class="card text-center">
            <div class="text-2xl font-bold text-primary-600">
              {{ finance()?.marge_beneficiaire | number:'1.0-1' }}%
            </div>
            <div class="text-xs text-neutral-500 mt-1">Marge bénéficiaire</div>
          </div>
        </div>

        <!-- Section champs -->
        <div class="card">
          <h3 class="font-bold text-neutral-900 mb-4 flex items-center gap-2">
            🌾 <span>Performance par champ</span>
          </h3>
          @if (parChamp().length) {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-neutral-100">
                    <th class="text-left py-2 px-3 text-neutral-500 font-medium">Champ</th>
                    <th class="text-right py-2 px-3 text-neutral-500 font-medium">Superficie</th>
                    <th class="text-right py-2 px-3 text-neutral-500 font-medium">Revenus</th>
                    <th class="text-right py-2 px-3 text-neutral-500 font-medium">Dépenses</th>
                    <th class="text-right py-2 px-3 text-neutral-500 font-medium">Bénéfice</th>
                    <th class="text-right py-2 px-3 text-neutral-500 font-medium">Marge</th>
                  </tr>
                </thead>
                <tbody>
                  @for (champ of parChamp(); track champ.champ_id) {
                    <tr class="border-b border-neutral-50 hover:bg-neutral-50">
                      <td class="py-2.5 px-3 font-medium text-neutral-900">{{ champ.nom }}</td>
                      <td class="py-2.5 px-3 text-right text-neutral-600">{{ champ.superficie }} ha</td>
                      <td class="py-2.5 px-3 text-right text-green-600 font-medium">{{ champ.total_ventes | currencyFcfa }}</td>
                      <td class="py-2.5 px-3 text-right text-red-500">{{ champ.total_depenses | currencyFcfa }}</td>
                      <td class="py-2.5 px-3 text-right font-semibold"
                          [class.text-green-600]="champ.benefice >= 0"
                          [class.text-red-500]="champ.benefice < 0">
                        {{ champ.benefice | currencyFcfa }}
                      </td>
                      <td class="py-2.5 px-3 text-right">
                        <span class="text-xs px-2 py-0.5 rounded-full font-medium"
                              [class.bg-green-100]="champ.marge >= 0"
                              [class.text-green-700]="champ.marge >= 0"
                              [class.bg-red-100]="champ.marge < 0"
                              [class.text-red-700]="champ.marge < 0">
                          {{ champ.marge | number:'1.0-1' }}%
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
                <tfoot>
                  <tr class="bg-neutral-50 font-semibold">
                    <td class="py-2.5 px-3 text-neutral-700">Total</td>
                    <td class="py-2.5 px-3 text-right text-neutral-600">{{ totalSuperficie() | number:'1.0-2' }} ha</td>
                    <td class="py-2.5 px-3 text-right text-green-600">{{ finance()?.total_revenus | currencyFcfa }}</td>
                    <td class="py-2.5 px-3 text-right text-red-500">{{ finance()?.total_depenses | currencyFcfa }}</td>
                    <td class="py-2.5 px-3 text-right"
                        [class.text-green-600]="(finance()?.benefice_net ?? 0) >= 0"
                        [class.text-red-500]="(finance()?.benefice_net ?? 0) < 0">
                      {{ finance()?.benefice_net | currencyFcfa }}
                    </td>
                    <td class="py-2.5 px-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          } @else {
            <p class="text-neutral-500 text-sm text-center py-6">Aucune donnée de champ disponible.</p>
          }
        </div>

        <!-- Section cultures -->
        <div class="card">
          <h3 class="font-bold text-neutral-900 mb-4 flex items-center gap-2">
            🌱 <span>Performance par culture</span>
          </h3>
          @if (parCulture().length) {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-neutral-100">
                    <th class="text-left py-2 px-3 text-neutral-500 font-medium">Culture</th>
                    <th class="text-left py-2 px-3 text-neutral-500 font-medium">Champ</th>
                    <th class="text-right py-2 px-3 text-neutral-500 font-medium">Revenus</th>
                    <th class="text-right py-2 px-3 text-neutral-500 font-medium">Dépenses</th>
                    <th class="text-right py-2 px-3 text-neutral-500 font-medium">Bénéfice</th>
                    <th class="text-left py-2 px-3 text-neutral-500 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  @for (c of parCulture(); track c.culture_id) {
                    <tr class="border-b border-neutral-50 hover:bg-neutral-50">
                      <td class="py-2.5 px-3 font-medium text-neutral-900">{{ c.nom }}</td>
                      <td class="py-2.5 px-3 text-neutral-600">{{ c.champ }}</td>
                      <td class="py-2.5 px-3 text-right text-green-600 font-medium">{{ c.total_ventes | currencyFcfa }}</td>
                      <td class="py-2.5 px-3 text-right text-red-500">{{ c.total_depenses | currencyFcfa }}</td>
                      <td class="py-2.5 px-3 text-right font-semibold"
                          [class.text-green-600]="c.benefice >= 0"
                          [class.text-red-500]="c.benefice < 0">
                        {{ c.benefice | currencyFcfa }}
                      </td>
                      <td class="py-2.5 px-3">
                        <span class="text-xs px-2 py-0.5 rounded-full"
                              [class.bg-green-100]="c.statut === 'recoltee'"
                              [class.text-green-700]="c.statut === 'recoltee'"
                              [class.bg-amber-100]="c.statut === 'en_cours'"
                              [class.text-amber-700]="c.statut === 'en_cours'"
                              [class.bg-blue-100]="c.statut === 'planifiee'"
                              [class.text-blue-700]="c.statut === 'planifiee'">
                          {{ c.statut }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          } @else {
            <p class="text-neutral-500 text-sm text-center py-6">Aucune donnée de culture disponible.</p>
          }
        </div>

        <!-- Pied de page rapport (visible à l'impression) -->
        <div class="print-only card mt-6">
          <div class="flex justify-between text-xs text-neutral-400">
            <span>Agri-ERP — Rapport confidentiel</span>
            <span>www.agri-erp.com</span>
            <span>{{ dateGeneration() | dateFr }}</span>
          </div>
        </div>

      </div>
      <!-- /rapport-contenu -->

      }

    </div>
  `,
})
export class RapportsComponent implements OnInit {
  private api = inject(ApiService);
  auth = inject(AuthService);

  chargement = signal(true);
  finance = signal<any>(null);
  parChamp = signal<any[]>([]);
  parCulture = signal<any[]>([]);
  periode = signal<'mois' | 'trimestre' | 'saison' | 'annee'>('mois');
  dateGeneration = signal(new Date());

  labelPeriode = computed(() => {
    const labels: Record<string, string> = {
      mois: new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      trimestre: `T${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`,
      saison: `Saison ${new Date().getFullYear()}`,
      annee: `Année ${new Date().getFullYear()}`,
    };
    return labels[this.periode()];
  });

  totalSuperficie = computed(() =>
    this.parChamp().reduce((sum, c) => sum + (Number(c.superficie) || 0), 0)
  );

  ngOnInit(): void {
    this.charger();
  }

  changerPeriode(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as any;
    this.periode.set(val);
    this.charger();
  }

  imprimerRapport(): void {
    window.print();
  }

  private charger(): void {
    this.chargement.set(true);
    const { debut, fin } = this.plage();

    let done = 0;
    const check = () => { if (++done === 3) this.chargement.set(false); };

    this.api.get<any>(`/api/finance/resume?date_debut=${debut}&date_fin=${fin}`).subscribe({
      next: res => { this.finance.set(res); check(); },
      error: () => { this.finance.set({ total_revenus: 0, total_depenses: 0, benefice_net: 0, marge_beneficiaire: 0 }); check(); },
    });

    this.api.get<any>(`/api/finance/par-champ?date_debut=${debut}&date_fin=${fin}`).subscribe({
      next: res => { this.parChamp.set(Array.isArray(res) ? res : res.data ?? []); check(); },
      error: () => { this.parChamp.set([]); check(); },
    });

    this.api.get<any>(`/api/finance/par-culture?date_debut=${debut}&date_fin=${fin}`).subscribe({
      next: res => { this.parCulture.set(Array.isArray(res) ? res : res.data ?? []); check(); },
      error: () => { this.parCulture.set([]); check(); },
    });
  }

  private plage(): { debut: string; fin: string } {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    switch (this.periode()) {
      case 'mois': {
        const debut = new Date(y, m, 1).toISOString().split('T')[0];
        const fin = new Date(y, m + 1, 0).toISOString().split('T')[0];
        return { debut, fin };
      }
      case 'trimestre': {
        const q = Math.floor(m / 3);
        const debut = new Date(y, q * 3, 1).toISOString().split('T')[0];
        const fin = new Date(y, q * 3 + 3, 0).toISOString().split('T')[0];
        return { debut, fin };
      }
      case 'annee': {
        return { debut: `${y}-01-01`, fin: `${y}-12-31` };
      }
      default:
        return { debut: `${y}-01-01`, fin: `${y}-12-31` };
    }
  }
}

import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { CurrencyFcfaPipe } from '../../core/pipes/currency-fcfa.pipe';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';

interface Tenant {
  id: number;
  nom: string;
  plan: string;
  est_active: boolean;
  pays?: string;
  created_at: string;
  users?: { id: number; nom: string; email: string }[];
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CurrencyFcfaPipe, DateFrPipe],
  template: `
    <div class="pg-wrap space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1>Super Admin</h1>
          <p class="pg-sub">Vue plateforme — toutes les organisations</p>
        </div>
        <div class="flex items-center gap-2">
          <button (click)="charger()"
                  class="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600">
            ↺ Actualiser
          </button>
        </div>
      </div>

      <!-- Stats globales -->
      @if (stats()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card text-center">
            <div class="text-3xl font-bold text-primary-600">{{ stats().nb_organisations }}</div>
            <div class="text-xs text-neutral-500 mt-1">Organisations totales</div>
          </div>
          <div class="card text-center">
            <div class="text-3xl font-bold text-green-600">{{ stats().nb_organisations_actives }}</div>
            <div class="text-xs text-neutral-500 mt-1">Organisations actives</div>
          </div>
          <div class="card text-center">
            <div class="text-3xl font-bold text-blue-600">{{ stats().nb_users }}</div>
            <div class="text-xs text-neutral-500 mt-1">Utilisateurs inscrits</div>
          </div>
          <div class="card text-center">
            <div class="text-3xl font-bold text-amber-600">{{ stats().nb_inscriptions_ce_mois }}</div>
            <div class="text-xs text-neutral-500 mt-1">Nouvelles inscriptions</div>
            <div class="text-xs text-neutral-400">ce mois</div>
          </div>
        </div>

        <!-- Volume ventes plateforme -->
        <div class="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-primary-100 text-sm">Volume total des ventes sur la plateforme</p>
              <p class="text-3xl font-bold mt-1">{{ stats().total_ventes_plateforme | currencyFcfa }}</p>
            </div>
            <div class="text-5xl opacity-30">💰</div>
          </div>
        </div>

        <!-- Répartition par plan -->
        @if (stats().nb_organisations_par_plan) {
          <div class="card">
            <h3 class="font-semibold text-neutral-800 mb-4">Répartition par plan</h3>
            <div class="flex flex-wrap gap-3">
              @for (entry of planEntries(); track entry.plan) {
                <div class="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-100 bg-neutral-50">
                  <div class="w-3 h-3 rounded-full"
                       [style.background-color]="planColor(entry.plan)"></div>
                  <span class="font-medium text-neutral-700 capitalize">{{ entry.plan }}</span>
                  <span class="text-xl font-bold"
                        [style.color]="planColor(entry.plan)">{{ entry.total }}</span>
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- Filtres -->
      <div class="card py-3 flex items-center gap-3 flex-wrap">
        <input type="text" [value]="recherche" (input)="onRecherche($event)"
               placeholder="Rechercher une organisation..."
               class="form-input text-sm h-9 py-0 flex-1 min-w-48" />
        <select (change)="onFiltreStatut($event)" class="form-input text-sm h-9 py-0 w-40">
          <option value="">Tous les statuts</option>
          <option value="active">Actives</option>
          <option value="inactive">Désactivées</option>
        </select>
        <select (change)="onFiltrePlan($event)" class="form-input text-sm h-9 py-0 w-36">
          <option value="">Tous les plans</option>
          <option value="gratuit">Gratuit</option>
          <option value="pro">Pro</option>
          <option value="entreprise">Entreprise</option>
        </select>
      </div>

      <!-- Tableau des tenants -->
      <div class="card p-0 overflow-hidden">
        @if (chargement()) {
          <div class="flex items-center justify-center py-16">
            <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        } @else if (tenantsFiltres().length) {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th class="text-left py-3 px-4 text-neutral-500 font-medium">Organisation</th>
                  <th class="text-left py-3 px-4 text-neutral-500 font-medium">Admin</th>
                  <th class="text-center py-3 px-4 text-neutral-500 font-medium">Plan</th>
                  <th class="text-center py-3 px-4 text-neutral-500 font-medium">Statut</th>
                  <th class="text-left py-3 px-4 text-neutral-500 font-medium">Pays</th>
                  <th class="text-left py-3 px-4 text-neutral-500 font-medium">Inscription</th>
                  <th class="text-center py-3 px-4 text-neutral-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (tenant of tenantsFiltres(); track tenant.id) {
                  <tr class="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                             [style.background-color]="planColor(tenant.plan)">
                          {{ tenant.nom.charAt(0).toUpperCase() }}
                        </div>
                        <div>
                          <div class="font-semibold text-neutral-900">{{ tenant.nom }}</div>
                          <div class="text-xs text-neutral-400">#{{ tenant.id }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="py-3 px-4">
                      @if (tenant.users?.[0]; as admin) {
                        <div class="text-neutral-700">{{ admin.nom }}</div>
                        <div class="text-xs text-neutral-400">{{ admin.email }}</div>
                      } @else {
                        <span class="text-neutral-400 text-xs">—</span>
                      }
                    </td>
                    <td class="py-3 px-4 text-center">
                      <span class="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                            [style.background-color]="planColor(tenant.plan) + '20'"
                            [style.color]="planColor(tenant.plan)">
                        {{ tenant.plan }}
                      </span>
                    </td>
                    <td class="py-3 px-4 text-center">
                      @if (tenant.est_active) {
                        <span class="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                          <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          Active
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-medium">
                          <span class="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                          Désactivée
                        </span>
                      }
                    </td>
                    <td class="py-3 px-4 text-neutral-600">{{ tenant.pays || '—' }}</td>
                    <td class="py-3 px-4 text-neutral-500 text-xs">{{ tenant.created_at | dateFr }}</td>
                    <td class="py-3 px-4 text-center">
                      <button (click)="toggleActif(tenant)"
                              [disabled]="toggling() === tenant.id"
                              class="text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
                              [class.bg-red-50]="tenant.est_active"
                              [class.text-red-600]="tenant.est_active"
                              [class.hover:bg-red-100]="tenant.est_active"
                              [class.bg-green-50]="!tenant.est_active"
                              [class.text-green-600]="!tenant.est_active"
                              [class.hover:bg-green-100]="!tenant.est_active">
                        @if (toggling() === tenant.id) {
                          ...
                        } @else {
                          {{ tenant.est_active ? 'Désactiver' : 'Activer' }}
                        }
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination info -->
          <div class="px-4 py-3 border-t border-neutral-100 flex items-center justify-between">
            <p class="text-xs text-neutral-500">
              {{ tenantsFiltres().length }} organisation(s) sur {{ tenants().length }}
            </p>
            @if (totalPages() > 1) {
              <div class="flex items-center gap-2">
                <button (click)="pagePrecedente()" [disabled]="page() === 1"
                        class="px-3 py-1 text-xs border border-neutral-200 rounded hover:bg-neutral-50 disabled:opacity-40">
                  ← Préc.
                </button>
                <span class="text-xs text-neutral-500">Page {{ page() }} / {{ totalPages() }}</span>
                <button (click)="pageSuivante()" [disabled]="page() === totalPages()"
                        class="px-3 py-1 text-xs border border-neutral-200 rounded hover:bg-neutral-50 disabled:opacity-40">
                  Suiv. →
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="text-center py-16">
            <div class="text-4xl mb-3">🔍</div>
            <p class="text-neutral-500">Aucune organisation trouvée.</p>
          </div>
        }
      </div>

    </div>
  `,
})
export class AdminComponent implements OnInit {
  private api = inject(ApiService);

  chargement = signal(true);
  stats = signal<any>(null);
  tenants = signal<Tenant[]>([]);
  toggling = signal<number | null>(null);

  recherche = '';
  filtreStatut = '';
  filtrePlan = '';
  page = signal(1);
  parPage = 20;

  tenantsFiltres = computed(() => {
    let list = this.tenants();
    if (this.recherche) {
      const q = this.recherche.toLowerCase();
      list = list.filter(t =>
        t.nom.toLowerCase().includes(q) ||
        t.users?.some(u => u.email.toLowerCase().includes(q) || u.nom.toLowerCase().includes(q))
      );
    }
    if (this.filtreStatut === 'active') list = list.filter(t => t.est_active);
    if (this.filtreStatut === 'inactive') list = list.filter(t => !t.est_active);
    if (this.filtrePlan) list = list.filter(t => t.plan === this.filtrePlan);
    return list;
  });

  totalPages = computed(() => Math.ceil(this.tenants().length / this.parPage));

  planEntries = computed(() => {
    const par = this.stats()?.nb_organisations_par_plan ?? {};
    return Object.entries(par).map(([plan, total]) => ({ plan, total }));
  });

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);

    this.api.get<any>('/api/admin/stats').subscribe({
      next: res => this.stats.set(res),
      error: () => {},
    });

    this.api.get<any>('/api/admin/tenants?per_page=200').subscribe({
      next: res => {
        const data = res.data ?? res;
        this.tenants.set(Array.isArray(data) ? data : data.data ?? []);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false),
    });
  }

  toggleActif(tenant: Tenant): void {
    this.toggling.set(tenant.id);
    this.api.patch<any>(`/api/admin/tenants/${tenant.id}/activer`, {}).subscribe({
      next: res => {
        this.tenants.update(list =>
          list.map(t => t.id === tenant.id ? { ...t, est_active: res.organisation?.est_active ?? !t.est_active } : t)
        );
        this.toggling.set(null);
      },
      error: () => this.toggling.set(null),
    });
  }

  onRecherche(event: Event): void {
    this.recherche = (event.target as HTMLInputElement).value;
    this.page.set(1);
  }

  onFiltreStatut(event: Event): void {
    this.filtreStatut = (event.target as HTMLSelectElement).value;
    this.page.set(1);
  }

  onFiltrePlan(event: Event): void {
    this.filtrePlan = (event.target as HTMLSelectElement).value;
    this.page.set(1);
  }

  pagePrecedente(): void { this.page.update(p => Math.max(1, p - 1)); }
  pageSuivante(): void { this.page.update(p => Math.min(this.totalPages(), p + 1)); }

  filtrer(): void { this.page.set(1); }

  planColor(plan: string): string {
    return { gratuit: '#6b7280', pro: '#3b82f6', entreprise: '#8b5cf6' }[plan] ?? '#6b7280';
  }
}

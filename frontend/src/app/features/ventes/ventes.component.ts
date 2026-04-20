import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyFcfaPipe } from '../../core/pipes/currency-fcfa.pipe';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';
import { VenteFormComponent } from './vente-form.component';


@Component({
  selector: 'app-ventes',
  standalone: true,
  imports: [CurrencyFcfaPipe, DateFrPipe, VenteFormComponent, DecimalPipe],
  template: `
    <div class="pg-wrap space-y-6">

      <!-- En-tête -->
      <div class="flex items-center justify-between">
        <div>
          <h1>Ventes</h1>
          <p class="pg-sub mt-0.5">Enregistrez et suivez vos ventes agricoles</p>
        </div>
        @if (auth.isAdmin()) {
          <button (click)="openModal()" class="btn-primary">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            Nouvelle vente
          </button>
        }
      </div>

      <!-- KPI summary -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card">
          <p class="text-xs font-medium text-neutral-500 mb-2">Total des ventes</p>
          <p class="text-2xl font-bold text-green-600 tabular-nums">{{ totalFiltre() | currencyFcfa }}</p>
        </div>
        <div class="card">
          <p class="text-xs font-medium text-neutral-500 mb-2">Nombre de ventes</p>
          <p class="text-2xl font-bold text-neutral-900 tabular-nums">{{ filtered().length }}</p>
        </div>
        <div class="card">
          <p class="text-xs font-medium text-neutral-500 mb-2">Panier moyen</p>
          <p class="text-2xl font-bold text-neutral-900 tabular-nums">{{ moyenneVente() | currencyFcfa }}</p>
        </div>
        <div class="card">
          <p class="text-xs font-medium text-neutral-500 mb-2">Plus grande vente</p>
          <p class="text-2xl font-bold text-neutral-900 tabular-nums">{{ maxVente() | currencyFcfa }}</p>
        </div>
      </div>

      <!-- Filtres -->
      <div class="card p-4">
        <div class="flex flex-wrap items-end gap-4">
          <!-- Filtre par champ -->
          <div class="flex-1 min-w-44">
            <label class="form-label">Filtrer par champ</label>
            <select class="form-input" (change)="filterChamp.set($any($event.target).value)">
              <option value="" [selected]="!filterChamp()">Tous les champs</option>
              <option value="__aucun__" [selected]="filterChamp() === '__aucun__'">Sans champ</option>
              @for (champ of champs(); track champ.id) {
                <option [value]="champ.id" [selected]="filterChamp() == champ.id">{{ champ.nom }}</option>
              }
            </select>
          </div>
          <!-- Filtre par produit (recherche) -->
          <div class="flex-1 min-w-44">
            <label class="form-label">Rechercher un produit</label>
            <input type="text" class="form-input" placeholder="Mil, Tomates…"
                   [value]="filterProduit()" (input)="filterProduit.set($any($event.target).value)"/>
          </div>
          <!-- Filtre date début -->
          <div class="min-w-36">
            <label class="form-label">Du</label>
            <input type="date" class="form-input" [value]="filterDateDeb()" (change)="filterDateDeb.set($any($event.target).value)"/>
          </div>
          <!-- Filtre date fin -->
          <div class="min-w-36">
            <label class="form-label">Au</label>
            <input type="date" class="form-input" [value]="filterDateFin()" (change)="filterDateFin.set($any($event.target).value)"/>
          </div>
          <!-- Reset -->
          @if (hasActiveFilters()) {
            <button (click)="resetFilters()"
                    class="btn-ghost text-xs h-10 px-3 text-neutral-500 hover:text-red-600">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              Réinitialiser
            </button>
          }
        </div>
        @if (hasActiveFilters()) {
          <div class="mt-3 flex items-center gap-2 text-xs text-neutral-500">
            <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2V12.46L22 3z" stroke-linecap="round" stroke-linejoin="round"/></svg>
            {{ filtered().length }} résultat(s) sur {{ allVentes().length }} ventes
          </div>
        }
      </div>

      <!-- Tableau -->
      @if (loading()) {
        <div class="card h-48 skeleton"></div>
      } @else if (filtered().length) {

        <!-- Cartes mobiles -->
        <div class="md:hidden space-y-3">
          @for (vente of filtered(); track vente.id) {
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
              <div class="flex items-start justify-between mb-2">
                <div class="font-semibold text-neutral-900 text-sm">{{ vente.produit }}</div>
                <div class="font-bold text-primary-600 text-base">{{ vente.montant_total_fcfa | currencyFcfa }}</div>
              </div>
              <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500 mb-3">
                <span>{{ vente.quantite_kg | number:'1.0-2' }} {{ vente.unite ?? 'kg' }} × {{ vente.prix_unitaire_fcfa | currencyFcfa }}/{{ vente.unite ?? 'kg' }}</span>
                @if (vente.champ) { <span>· {{ vente.champ.nom }}</span> }
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-neutral-400">{{ vente.date_vente | dateFr }}</span>
                @if (auth.isAdmin()) {
                  <div class="flex gap-2">
                    <button (click)="downloadRecu(vente)" title="Télécharger le reçu"
                            class="border border-neutral-200 bg-white rounded-lg px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-50">
                      Reçu
                    </button>
                    @if (!vente.est_auto_generee) {
                      <button (click)="openModal(vente)"
                              class="border border-neutral-200 bg-white rounded-lg px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-50">
                        Modifier
                      </button>
                      <button (click)="delete(vente)"
                              class="border border-red-200 bg-red-50 rounded-lg px-2.5 py-1 text-xs text-red-600 hover:bg-red-100">
                        Supprimer
                      </button>
                    }
                  </div>
                }
              </div>
            </div>
          }
          @empty {
            <div class="text-center py-10 text-neutral-400 text-sm">Aucune vente enregistrée</div>
          }
        </div>

        <!-- Tableau desktop -->
        <div class="card overflow-hidden p-0 hidden md:block">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead style="background:#fafaf9; border-bottom:1px solid #f0efee;">
                <tr>
                  <th class="table-th">Produit</th>
                  <th class="table-th">Champ</th>
                  <th class="table-th">Culture</th>
                  <th class="table-th">Acheteur</th>
                  <th class="table-th text-right">Qté</th>
                  <th class="table-th text-right">P.U.</th>
                  <th class="table-th text-right">Total</th>
                  <th class="table-th">Date</th>
                  @if (auth.isAdmin()) { <th class="table-th"></th> }
                </tr>
              </thead>
              <tbody>
                @for (vente of filtered(); track vente.id) {
                  <tr class="table-row">
                    <td class="table-td">
                      <div class="font-medium text-neutral-900">{{ vente.produit }}</div>
                      @if (vente.est_auto_generee) {
                        <span class="text-xs text-violet-500 font-medium">Auto-générée</span>
                      }
                    </td>
                    <td class="table-td">
                      @if (vente.champ) {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700">
                          {{ vente.champ.nom }}
                        </span>
                      } @else { <span class="text-neutral-400">—</span> }
                    </td>
                    <td class="table-td text-neutral-600 text-sm">
                      {{ vente.culture?.nom ?? '—' }}
                    </td>
                    <td class="table-td text-neutral-600 text-sm">{{ vente.acheteur ?? '—' }}</td>
                    <td class="table-td text-right tabular-nums text-sm">{{ vente.quantite_kg | number:'1.0-2' }} {{ vente.unite ?? 'kg' }}</td>
                    <td class="table-td text-right tabular-nums text-sm text-neutral-500">{{ vente.prix_unitaire_fcfa | currencyFcfa }}</td>
                    <td class="table-td text-right">
                      <span class="font-semibold text-green-600 tabular-nums">{{ vente.montant_total_fcfa | currencyFcfa }}</span>
                    </td>
                    <td class="table-td text-neutral-500 text-sm whitespace-nowrap">{{ vente.date_vente | dateFr }}</td>
                    @if (auth.isAdmin()) {
                      <td class="table-td">
                        <div class="flex gap-1 justify-end">
                          <button (click)="downloadRecu(vente)" title="Télécharger le reçu"
                                  class="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                          </button>
                          @if (!vente.est_auto_generee) {
                            <button (click)="openModal(vente)"
                                    class="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors">
                              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button (click)="delete(vente)"
                                    class="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                            </button>
                          }
                        </div>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <!-- Footer total filtré -->
          <div class="px-5 py-3 flex items-center justify-between" style="background:#fafaf9;border-top:1px solid #f0efee;">
            <span class="text-xs text-neutral-500">{{ filtered().length }} vente(s){{ hasActiveFilters() ? ' filtrée(s)' : '' }}</span>
            <span class="text-sm font-semibold text-green-600">Total : {{ totalFiltre() | currencyFcfa }}</span>
          </div>
        </div>
      } @else {
        <div class="card text-center py-16">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style="background:#f0fdf4;">
            <svg width="24" height="24" fill="none" stroke="#16a34a" stroke-width="1.75" stroke-linecap="round" viewBox="0 0 24 24"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-10 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/></svg>
          </div>
          <h3 class="font-semibold text-neutral-900 mb-2">Aucune vente trouvée</h3>
          <p class="text-neutral-500 text-sm">{{ hasActiveFilters() ? 'Aucun résultat pour ce filtre.' : 'Enregistrez votre première vente.' }}</p>
        </div>
      }

      <!-- Modal -->
      @if (showModal()) {
        <app-vente-form
          [vente]="editing()"
          [champs]="champs()"
          [cultures]="cultures()"
          (ferme)="closeModal()"
          (sauvegarde)="onSauvegarde()"
        />
      }
    </div>
  `,
})
export class VentesComponent implements OnInit {
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  auth = inject(AuthService);

  loading = signal(true);
  showModal = signal(false);
  editing = signal<any>(null);
  allVentes = signal<any[]>([]);
  cultures = signal<any[]>([]);
  champs = signal<any[]>([]);

  filterChamp = signal('');
  filterProduit = signal('');
  filterDateDeb = signal('');
  filterDateFin = signal('');

  hasActiveFilters = computed(() =>
    !!this.filterChamp() || !!this.filterProduit() || !!this.filterDateDeb() || !!this.filterDateFin()
  );

  filtered = computed(() => {
    let list = this.allVentes();
    const champ = this.filterChamp();
    const produit = this.filterProduit().toLowerCase();
    const deb = this.filterDateDeb();
    const fin = this.filterDateFin();
    if (champ === '__aucun__') list = list.filter(v => !v.champ);
    else if (champ) list = list.filter(v => String(v.champ?.id) === champ);
    if (produit) list = list.filter(v => v.produit?.toLowerCase().includes(produit));
    if (deb) list = list.filter(v => (v.date_vente ?? '') >= deb);
    if (fin) list = list.filter(v => (v.date_vente ?? '') <= fin);
    return list;
  });

  totalFiltre = computed(() => this.filtered().reduce((acc, v) => acc + Number(v.montant_total_fcfa), 0));
  moyenneVente = computed(() => this.filtered().length > 0 ? Math.round(this.totalFiltre() / this.filtered().length) : 0);
  maxVente = computed(() => Math.max(0, ...this.filtered().map(v => Number(v.montant_total_fcfa))));

  ngOnInit(): void {
    this.load();
    this.api.get<any>('/api/cultures').subscribe({
      next: res => this.cultures.set(Array.isArray(res) ? res : res.data?.data ?? res.data ?? []),
    });
    this.api.get<any>('/api/champs').subscribe({
      next: res => this.champs.set(Array.isArray(res) ? res : res.data ?? []),
    });
  }

  load(): void {
    this.loading.set(true);
    this.api.get<any>('/api/ventes').subscribe({
      next: res => { this.allVentes.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  resetFilters(): void {
    this.filterChamp.set('');
    this.filterProduit.set('');
    this.filterDateDeb.set('');
    this.filterDateFin.set('');
  }

  openModal(vente?: any): void {
    this.editing.set(vente ?? null);
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editing.set(null); }

  onSauvegarde(): void {
    this.closeModal();
    this.load();
  }

  downloadRecu(vente: any): void {
    this.api.getBlob(`/api/ventes/${vente.id}/recu-pdf`).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `recu-vente-${vente.id}.pdf`; a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.notif.error('Impossible de télécharger le reçu.'),
    });
  }

  delete(v: any): void {
    if (!confirm('Supprimer cette vente ?')) return;
    this.api.delete(`/api/ventes/${v.id}`).subscribe({
      next: () => { this.notif.success('Vente supprimée.'); this.load(); },
      error: err => this.notif.error(err.error?.message || 'Erreur.'),
    });
  }
}

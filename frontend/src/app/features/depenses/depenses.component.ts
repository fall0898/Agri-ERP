import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyFcfaPipe } from '../../core/pipes/currency-fcfa.pipe';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';
import { DepenseFormComponent } from './depense-form.component';

// Catégories exactes acceptées par le backend
const CATEGORIES = [
  { id: 'intrant', nom: 'Intrant agricole' },
  { id: 'salaire', nom: 'Salaire' },
  { id: 'materiel', nom: 'Matériel' },
  { id: 'carburant', nom: 'Carburant' },
  { id: 'main_oeuvre', nom: 'Main d\'œuvre' },
  { id: 'traitement_phytosanitaire', nom: 'Traitement phytosanitaire' },
  { id: 'transport', nom: 'Transport' },
  { id: 'irrigation', nom: 'Irrigation' },
  { id: 'entretien_materiel', nom: 'Entretien matériel' },
  { id: 'alimentation_betail', nom: 'Alimentation bétail' },
  { id: 'frais_recolte', nom: 'Frais récolte' },
  { id: 'financement_individuel', nom: 'Financement individuel' },
  { id: 'autre', nom: 'Autre' },
];

@Component({
  selector: 'app-depenses',
  standalone: true,
  imports: [CurrencyFcfaPipe, DateFrPipe, DepenseFormComponent],
  template: `
    <div class="pg-wrap space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1>Dépenses</h1>
          <p class="pg-sub">Suivez toutes vos dépenses agricoles</p>
        </div>
        @if (auth.isAdmin()) {
          <button (click)="openModal()" class="btn-primary h-9 px-4 text-sm">+ Nouvelle dépense</button>
        }
      </div>

      <!-- Résumé -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card text-center">
          <div class="text-xs text-neutral-500 mb-1">Total</div>
          <div class="text-xl font-bold text-red-600">{{ totalFiltre() | currencyFcfa }}</div>
        </div>
        <div class="card text-center">
          <div class="text-xs text-neutral-500 mb-1">Nombre</div>
          <div class="text-xl font-bold text-neutral-900">{{ filtered().length }}</div>
        </div>
        <div class="card text-center">
          <div class="text-xs text-neutral-500 mb-1">Moyenne/dépense</div>
          <div class="text-xl font-bold text-neutral-900">{{ moyenneDep() | currencyFcfa }}</div>
        </div>
        <div class="card text-center">
          <div class="text-xs text-neutral-500 mb-1">Plus grosse</div>
          <div class="text-xl font-bold text-neutral-900">{{ maxDepense() | currencyFcfa }}</div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="card p-4">
        <div class="flex flex-wrap items-end gap-4">
          <div class="flex-1 min-w-44">
            <label class="form-label">Exploitation</label>
            <select class="form-input" (change)="filterChamp.set($any($event.target).value)">
              <option value="" [selected]="!filterChamp()">Toutes les exploitations</option>
              <option value="__aucun__" [selected]="filterChamp() === '__aucun__'">Sans exploitation</option>
              @for (champ of champs(); track champ.id) {
                <option [value]="champ.id" [selected]="filterChamp() == champ.id">{{ champ.nom }}</option>
              }
            </select>
          </div>
          <div class="flex-1 min-w-44">
            <label class="form-label">Catégorie</label>
            <select class="form-input" (change)="filterCat.set($any($event.target).value)">
              <option value="" [selected]="!filterCat()">Toutes les catégories</option>
              @for (cat of categories; track cat.id) {
                <option [value]="cat.id" [selected]="filterCat() === cat.id">{{ cat.nom }}</option>
              }
            </select>
          </div>
          <div class="flex-1 min-w-44">
            <label class="form-label">Recherche</label>
            <input type="text" class="form-input" placeholder="Description…"
                   [value]="filterTexte()" (input)="filterTexte.set($any($event.target).value)"/>
          </div>
          <div class="min-w-36">
            <label class="form-label">Du</label>
            <input type="date" class="form-input" [value]="filterDateDeb()" (change)="filterDateDeb.set($any($event.target).value)"/>
          </div>
          <div class="min-w-36">
            <label class="form-label">Au</label>
            <input type="date" class="form-input" [value]="filterDateFin()" (change)="filterDateFin.set($any($event.target).value)"/>
          </div>
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
            {{ filtered().length }} résultat(s) sur {{ depenses().length }} dépenses
          </div>
        }
      </div>

      <!-- Tableau -->
      @if (loading()) {
        <div class="card animate-pulse h-48 bg-neutral-100"></div>
      } @else if (filtered().length) {

        <!-- Cartes mobiles -->
        <div class="md:hidden space-y-3">
          @for (depense of filtered(); track depense.id) {
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
              <div class="flex items-start justify-between mb-2">
                <div class="font-semibold text-neutral-900 text-sm">{{ depense.description }}</div>
                <div class="font-bold text-red-500 text-base">{{ depense.montant_fcfa | currencyFcfa }}</div>
              </div>
              <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500 mb-3">
                <span class="capitalize">{{ labelCategorie(depense.categorie) }}</span>
                @if (depense.champ) { <span>· {{ depense.champ.nom }}</span> }
              </div>
              <div class="flex items-center justify-between">
                <span class="text-xs text-neutral-400">{{ depense.date_depense | dateFr }}</span>
                @if (auth.isAdmin() && !depense.est_auto_generee) {
                  <div class="flex gap-2">
                    <button (click)="openModal(depense)"
                            class="border border-neutral-200 bg-white rounded-lg px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-50">
                      Modifier
                    </button>
                    <button (click)="delete(depense)"
                            class="border border-red-200 bg-red-50 rounded-lg px-2.5 py-1 text-xs text-red-600 hover:bg-red-100">
                      Supprimer
                    </button>
                  </div>
                }
              </div>
            </div>
          }
          @empty {
            <div class="text-center py-10 text-neutral-400 text-sm">Aucune dépense enregistrée</div>
          }
        </div>

        <!-- Tableau desktop -->
        <div class="card overflow-hidden p-0 hidden md:block">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th class="text-left text-xs font-medium text-neutral-500 uppercase px-6 py-3">Description</th>
                  <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Catégorie</th>
                  <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Champ</th>
                  <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Montant</th>
                  <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Date</th>
                  @if (auth.isAdmin()) { <th class="px-4 py-3"></th> }
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-50">
                @for (dep of filtered(); track dep.id) {
                  <tr class="hover:bg-neutral-50/50">
                    <td class="px-6 py-4">
                      <div class="font-medium text-neutral-900">{{ dep.description }}</div>
                    </td>
                    <td class="px-4 py-4 text-sm text-neutral-600">{{ labelCategorie(dep.categorie) }}</td>
                    <td class="px-4 py-4 text-sm text-neutral-600">{{ dep.champ?.nom ?? '—' }}</td>
                    <td class="px-4 py-4 text-right font-semibold text-red-600">{{ dep.montant_fcfa | currencyFcfa }}</td>
                    <td class="px-4 py-4 text-sm text-neutral-500">{{ dep.date_depense | dateFr }}</td>
                    @if (auth.isAdmin()) {
                      <td class="px-4 py-4">
                        <div class="flex gap-2 justify-end">
                          <button (click)="openModal(dep)" class="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">✏️</button>
                          <button (click)="delete(dep)" class="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">🗑️</button>
                        </div>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else {
        <div class="card text-center py-16">
          <div class="text-5xl mb-4">💸</div>
          <h3 class="font-semibold text-neutral-900 mb-2">Aucune dépense enregistrée</h3>
          <p class="text-neutral-500 text-sm">Les dépenses de stock apparaissent automatiquement lors des achats.</p>
        </div>
      }

      <!-- Modal -->
      @if (showModal()) {
        <app-depense-form
          [depense]="editing()"
          [champs]="champs()"
          (ferme)="closeModal()"
          (sauvegarde)="onSauvegarde()"
        />
      }
    </div>
  `,
})
export class DepensesComponent implements OnInit {
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  auth = inject(AuthService);

  readonly categories = CATEGORIES;

  loading = signal(true);
  showModal = signal(false);
  editing = signal<any>(null);
  depenses = signal<any[]>([]);
  champs = signal<any[]>([]);
  filterCat = signal('');
  filterChamp = signal('');
  filterTexte = signal('');
  filterDateDeb = signal('');
  filterDateFin = signal('');

  hasActiveFilters = computed(() =>
    !!this.filterCat() || !!this.filterChamp() || !!this.filterTexte() || !!this.filterDateDeb() || !!this.filterDateFin()
  );

  filtered = computed(() => {
    let list = this.depenses();
    const cat = this.filterCat();
    const champ = this.filterChamp();
    const texte = this.filterTexte().toLowerCase();
    const deb = this.filterDateDeb();
    const fin = this.filterDateFin();
    if (cat) list = list.filter(d => d.categorie === cat);
    if (champ === '__aucun__') list = list.filter(d => !d.champ_id);
    else if (champ) list = list.filter(d => String(d.champ_id) === champ);
    if (texte) list = list.filter(d => d.description?.toLowerCase().includes(texte));
    if (deb) list = list.filter(d => (d.date_depense ?? '') >= deb);
    if (fin) list = list.filter(d => (d.date_depense ?? '') <= fin);
    return list;
  });

  totalFiltre = computed(() => this.filtered().reduce((acc, d) => acc + Number(d.montant_fcfa), 0));
  moyenneDep = computed(() => this.filtered().length > 0 ? Math.round(this.totalFiltre() / this.filtered().length) : 0);
  maxDepense = computed(() => Math.max(0, ...this.filtered().map(d => Number(d.montant_fcfa))));

  ngOnInit(): void {
    this.load();
    this.api.get<any>('/api/champs').subscribe({
      next: res => this.champs.set(Array.isArray(res) ? res : res.data?.data ?? res.data ?? []),
    });
  }

  load(): void {
    this.loading.set(true);
    this.api.get<any>('/api/depenses').subscribe({
      next: res => { this.depenses.set(res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  labelCategorie(id: string): string {
    return CATEGORIES.find(c => c.id === id)?.nom ?? id ?? '—';
  }

  resetFilters(): void {
    this.filterCat.set('');
    this.filterChamp.set('');
    this.filterTexte.set('');
    this.filterDateDeb.set('');
    this.filterDateFin.set('');
  }

  openModal(dep?: any): void { this.editing.set(dep ?? null); this.showModal.set(true); }

  closeModal(): void { this.showModal.set(false); this.editing.set(null); }

  onSauvegarde(): void { this.closeModal(); this.load(); }

  delete(d: any): void {
    if (!confirm('Supprimer cette dépense ?')) return;
    this.api.delete(`/api/depenses/${d.id}`).subscribe({
      next: () => { this.notif.success('Dépense supprimée.'); this.load(); },
      error: err => this.notif.error(err.error?.message || 'Erreur.'),
    });
  }
}

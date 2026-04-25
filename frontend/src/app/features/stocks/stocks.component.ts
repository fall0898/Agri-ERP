import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyFcfaPipe } from '../../core/pipes/currency-fcfa.pipe';
@Component({
  selector: 'app-stocks',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyFcfaPipe],
  template: `
    <div class="pg-wrap space-y-6">

      <div class="flex items-center justify-between">
        <div>
          <h1>Stocks & Intrants</h1>
          <p class="pg-sub">Gérez vos stocks d'engrais, semences et pesticides</p>
        </div>
        @if (auth.isAdmin()) {
          <div class="flex gap-2">
            <button (click)="openMouvementModal()" class="btn-secondary h-9 px-4 text-sm">+ Mouvement</button>
            <button (click)="openStockModal()" class="btn-primary h-9 px-4 text-sm">+ Nouveau stock</button>
          </div>
        }
      </div>

      <!-- Alertes -->
      @if (stocksEnAlerte().length) {
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <span class="text-2xl">⚠️</span>
          <div>
            <p class="font-medium text-amber-800">{{ stocksEnAlerte().length }} stock(s) en dessous du seuil d'alerte</p>
            <p class="text-amber-600 text-sm">{{ alerteNoms() }}</p>
          </div>
        </div>
      }

      <!-- Tableau stocks -->
      @if (loading()) {
        <div class="card animate-pulse h-48 bg-neutral-100"></div>
      } @else if (stocks().length) {

        <!-- Cartes mobiles -->
        <div class="md:hidden space-y-3">
          @for (stock of stocks(); track stock.id) {
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100"
                 [class.border-l-4]="isEnAlerte(stock)"
                 [class.border-l-amber-400]="isEnAlerte(stock)">
              <div class="flex items-start justify-between mb-2">
                <div class="font-semibold text-neutral-900 text-sm">{{ stock.nom }}</div>
                <div class="font-bold text-sm"
                     [class.text-amber-500]="isEnAlerte(stock)"
                     [class.text-neutral-700]="!isEnAlerte(stock)">
                  {{ stock.quantite_actuelle }} {{ stock.unite }}
                </div>
              </div>
              <div class="flex justify-between items-center mb-3">
                <span class="text-xs text-neutral-400 capitalize">{{ stock.categorie }}</span>
                @if (isEnAlerte(stock)) {
                  <span class="text-xs font-semibold text-amber-500">⚠ Seuil atteint</span>
                }
              </div>
              @if (auth.isAdmin()) {
                <div class="flex gap-2">
                  <button (click)="openMouvementModal(stock)"
                          class="flex-1 border border-primary-200 bg-primary-50 rounded-lg py-1.5 text-xs text-primary-700 font-medium hover:bg-primary-100">
                    + Mouvement
                  </button>
                  <button (click)="deleteStock(stock)"
                          class="border border-red-200 bg-red-50 rounded-lg px-3 py-1.5 text-xs text-red-600 hover:bg-red-100">
                    Supprimer
                  </button>
                </div>
              }
            </div>
          }
          @empty {
            <div class="text-center py-10 text-neutral-400 text-sm">Aucun stock enregistré</div>
          }
        </div>

        <!-- Tableau desktop -->
        <div class="card overflow-hidden p-0 hidden md:block">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th class="text-left text-xs font-medium text-neutral-500 uppercase px-6 py-3">Nom</th>
                  <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Catégorie</th>
                  <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Qté disponible</th>
                  <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Seuil alerte</th>
                  <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Statut</th>
                  @if (auth.isAdmin()) { <th class="px-4 py-3"></th> }
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-50">
                @for (stock of stocks(); track stock.id) {
                  <tr class="hover:bg-neutral-50/50 transition-colors">
                    <td class="px-6 py-4">
                      <div class="font-medium text-neutral-900">{{ stock.nom }}</div>
                      <div class="text-xs text-neutral-400">Réf. #{{ stock.id }}</div>
                    </td>
                    <td class="px-4 py-4 text-sm text-neutral-600 capitalize">{{ stock.categorie }}</td>
                    <td class="px-4 py-4 text-right">
                      <span class="font-semibold"
                            [class.text-red-600]="isEnAlerte(stock)"
                            [class.text-neutral-900]="!isEnAlerte(stock)">
                        {{ stock.quantite_actuelle }} {{ stock.unite }}
                      </span>
                    </td>
                    <td class="px-4 py-4 text-right text-sm text-neutral-500">
                      {{ stock.seuil_alerte ?? '—' }} {{ stock.seuil_alerte ? stock.unite : '' }}
                    </td>
                    <td class="px-4 py-4">
                      @if (isEnAlerte(stock)) {
                        <span class="badge-warning text-xs">⚠ Alerte</span>
                      } @else {
                        <span class="badge-success text-xs">✓ OK</span>
                      }
                    </td>
                    @if (auth.isAdmin()) {
                      <td class="px-4 py-4">
                        <div class="flex gap-2 justify-end">
                          <button (click)="openMouvementModal(stock)"
                                  class="text-xs text-primary-600 hover:underline">
                            Mouvement
                          </button>
                          <button (click)="deleteStock(stock)"
                                  class="text-xs text-red-500 hover:underline ml-2">
                            Supprimer
                          </button>
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
          <div class="text-5xl mb-4">📦</div>
          <h3 class="font-semibold text-neutral-900 mb-2">Aucun stock enregistré</h3>
          <p class="text-neutral-500 text-sm mb-6">Ajoutez vos intrants agricoles pour suivre vos stocks.</p>
          @if (auth.isAdmin()) {
            <button (click)="openStockModal()" class="btn-primary h-9 px-6 text-sm">+ Nouveau stock</button>
          }
        </div>
      }

      <!-- Modal : nouveau stock -->
      @if (showStockModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="showStockModal.set(false)">
          <div class="bg-white rounded-2xl w-full max-w-md shadow-xl" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-neutral-100">
              <h2 class="font-semibold text-neutral-900">Nouveau stock</h2>
              <button (click)="showStockModal.set(false)" class="text-neutral-400 text-xl">&times;</button>
            </div>
            <form [formGroup]="stockForm" (ngSubmit)="saveStock()" class="p-6 space-y-4">
              <div>
                <label class="form-label">Nom *</label>
                <input type="text" formControlName="nom" class="form-input" placeholder="ex: Engrais NPK 15-15-15"/>
                @if (stockForm.get('nom')?.invalid && stockForm.get('nom')?.touched) {
                  <p class="form-error">Nom requis.</p>
                }
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Catégorie *</label>
                  <select formControlName="categorie" class="form-input">
                    <option value="engrais">Engrais</option>
                    <option value="semence">Semence</option>
                    <option value="pesticide">Pesticide</option>
                    <option value="herbicide">Herbicide</option>
                    <option value="materiel">Matériel</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">Unité *</label>
                  <input type="text" formControlName="unite" class="form-input" placeholder="sac, kg, L..."/>
                  @if (stockForm.get('unite')?.invalid && stockForm.get('unite')?.touched) {
                    <p class="form-error">Unité requise.</p>
                  }
                </div>
                <div>
                  <label class="form-label">Quantité initiale</label>
                  <input type="number" step="0.01" formControlName="quantite_actuelle" class="form-input" min="0"/>
                </div>
                <div>
                  <label class="form-label">Seuil d'alerte</label>
                  <input type="number" step="0.01" formControlName="seuil_alerte" class="form-input" min="0"/>
                </div>
              </div>
              <div class="flex gap-3 pt-2">
                <button type="button" (click)="showStockModal.set(false)" class="btn-secondary flex-1 h-10 text-sm">Annuler</button>
                <button type="submit" [disabled]="savingStock()" class="btn-primary flex-1 h-10 text-sm">
                  {{ savingStock() ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Modal : mouvement de stock -->
      @if (showMouvementModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="showMouvementModal.set(false)">
          <div class="bg-white rounded-2xl w-full max-w-md shadow-xl" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-neutral-100">
              <h2 class="font-semibold text-neutral-900">Enregistrer un mouvement</h2>
              <button (click)="showMouvementModal.set(false)" class="text-neutral-400 text-xl">&times;</button>
            </div>
            <form [formGroup]="mouvementForm" (ngSubmit)="saveMouvement()" class="p-6 space-y-4">
              <div>
                <label class="form-label">Stock concerné *</label>
                <select formControlName="stock_id" class="form-input">
                  <option value="">Sélectionner...</option>
                  @for (s of stocks(); track s.id) {
                    <option [value]="s.id">{{ s.nom }} ({{ s.quantite_actuelle }} {{ s.unite }})</option>
                  }
                </select>
                @if (mouvementForm.get('stock_id')?.invalid && mouvementForm.get('stock_id')?.touched) {
                  <p class="form-error">Stock requis.</p>
                }
              </div>
              <div>
                <label class="form-label">Type de mouvement *</label>
                <select formControlName="type" class="form-input">
                  <option value="achat">Achat (entrée)</option>
                  <option value="utilisation">Utilisation (sortie)</option>
                  <option value="perte">Perte (sortie)</option>
                  <option value="ajustement">Ajustement inventaire</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Quantité *</label>
                  <input type="number" step="0.01" formControlName="quantite" class="form-input" min="0"/>
                  @if (mouvementForm.get('quantite')?.invalid && mouvementForm.get('quantite')?.touched) {
                    <p class="form-error">Quantité requise.</p>
                  }
                </div>
                <div>
                  <label class="form-label">Date *</label>
                  <input type="date" formControlName="date_mouvement" class="form-input"/>
                  @if (mouvementForm.get('date_mouvement')?.invalid && mouvementForm.get('date_mouvement')?.touched) {
                    <p class="form-error">Date requise.</p>
                  }
                </div>
                <div>
                  <label class="form-label">Prix unitaire (FCFA)</label>
                  <input type="number" formControlName="prix_unitaire_fcfa" class="form-input" min="0"/>
                </div>
                <div>
                  <label class="form-label">Fournisseur</label>
                  <input type="text" formControlName="fournisseur" class="form-input"/>
                </div>
              </div>
              <div>
                <label class="form-label">Motif / Notes</label>
                <textarea formControlName="motif" class="form-input h-16 resize-none"></textarea>
              </div>
              <div class="flex gap-3 pt-2">
                <button type="button" (click)="showMouvementModal.set(false)" class="btn-secondary flex-1 h-10 text-sm">Annuler</button>
                <button type="submit" [disabled]="savingMouvement()" class="btn-primary flex-1 h-10 text-sm">
                  {{ savingMouvement() ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `,
})
export class StocksComponent implements OnInit {
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  loading = signal(true);
  savingStock = signal(false);
  savingMouvement = signal(false);
  showStockModal = signal(false);
  showMouvementModal = signal(false);
  stocks = signal<any[]>([]);

  stocksEnAlerte = computed(() => this.stocks().filter(s => this.isEnAlerte(s)));
  alerteNoms = computed(() => this.stocksEnAlerte().map(s => s.nom).join(', '));

  isEnAlerte = (s: any) => s.seuil_alerte != null && Number(s.quantite_actuelle) <= Number(s.seuil_alerte);

  stockForm = this.fb.group({
    nom: ['', Validators.required],
    categorie: ['engrais', Validators.required],
    unite: ['sac', Validators.required],
    quantite_actuelle: [0],
    seuil_alerte: [null as number | null],
  });

  mouvementForm = this.fb.group({
    stock_id: ['', Validators.required],
    type: ['achat', Validators.required],
    quantite: [null as number | null, [Validators.required, Validators.min(0)]],
    date_mouvement: [new Date().toISOString().split('T')[0], Validators.required],
    prix_unitaire_fcfa: [null as number | null],
    fournisseur: [''],
    motif: [''],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.get<any>('/api/stocks').subscribe({
      next: res => {
        this.stocks.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openStockModal(): void {
    this.stockForm.reset({ categorie: 'engrais', unite: 'sac', quantite_actuelle: 0 });
    this.showStockModal.set(true);
  }

  openMouvementModal(stock?: any): void {
    this.mouvementForm.reset({
      type: 'achat',
      date_mouvement: new Date().toISOString().split('T')[0],
    });
    if (stock) this.mouvementForm.patchValue({ stock_id: stock.id });
    this.showMouvementModal.set(true);
  }

  saveStock(): void {
    if (this.stockForm.invalid) { this.stockForm.markAllAsTouched(); return; }
    this.savingStock.set(true);
    const payload: any = { ...this.stockForm.value };
    if (!payload.seuil_alerte) delete payload.seuil_alerte;

    this.api.post('/api/stocks', payload).subscribe({
      next: () => {
        this.notif.success('Stock créé.');
        this.savingStock.set(false);
        this.showStockModal.set(false);
        this.load();
      },
      error: err => {
        this.savingStock.set(false);
        const errors = err.error?.errors;
        if (errors) {
          const first = Object.values(errors)[0] as string[];
          this.notif.error(first[0]);
        } else {
          this.notif.error(err.error?.message || 'Erreur.');
        }
      },
    });
  }

  saveMouvement(): void {
    if (this.mouvementForm.invalid) { this.mouvementForm.markAllAsTouched(); return; }
    this.savingMouvement.set(true);

    const { stock_id, ...rest } = this.mouvementForm.value as any;
    const payload: any = { ...rest };
    if (!payload.prix_unitaire_fcfa) delete payload.prix_unitaire_fcfa;
    if (!payload.fournisseur) delete payload.fournisseur;
    if (!payload.motif) delete payload.motif;

    this.api.post(`/api/stocks/${stock_id}/mouvements`, payload).subscribe({
      next: () => {
        this.notif.success('Mouvement enregistré. Le stock a été mis à jour.');
        this.savingMouvement.set(false);
        this.showMouvementModal.set(false);
        this.load();
      },
      error: err => {
        this.savingMouvement.set(false);
        const errors = err.error?.errors;
        if (errors) {
          const first = Object.values(errors)[0] as string[];
          this.notif.error(first[0]);
        } else {
          this.notif.error(err.error?.message || 'Erreur.');
        }
      },
    });
  }

  deleteStock(stock: any): void {
    if (!confirm(`Supprimer le stock "${stock.nom}" ?`)) return;
    this.api.delete(`/api/stocks/${stock.id}`).subscribe({
      next: () => { this.notif.success('Stock supprimé.'); this.load(); },
      error: err => this.notif.error(err.error?.message || 'Erreur.'),
    });
  }
}

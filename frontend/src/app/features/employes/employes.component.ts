import { Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyFcfaPipe } from '../../core/pipes/currency-fcfa.pipe';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';

@Component({
  selector: 'app-employes',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyFcfaPipe, DateFrPipe],
  template: `
    <div class="pg-wrap space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1>Employés & Salaires</h1>
          <p class="pg-sub">Gérez votre main-d'œuvre agricole</p>
        </div>
        @if (auth.isAdmin()) {
          <div class="flex gap-2">
            @if (onglet() === 'employes') {
              <button (click)="openModal()" class="btn-primary h-9 px-4 text-sm">+ Nouvel employé</button>
            } @else if (onglet() === 'salaires') {
              <button (click)="openSalaireModal()" class="btn-primary h-9 px-4 text-sm">+ Payer salaire</button>
            } @else if (onglet() === 'financements') {
              <button (click)="openFinancementModal()" class="btn-primary h-9 px-4 text-sm">+ Financement</button>
            }
          </div>
        }
      </div>

      <!-- Onglets -->
      <div class="flex bg-neutral-100 rounded-lg p-1 w-fit">
        <button (click)="onglet.set('employes')"
                class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
                [class.bg-white]="onglet() === 'employes'"
                [class.text-neutral-900]="onglet() === 'employes'"
                [class.shadow-sm]="onglet() === 'employes'"
                [class.text-neutral-500]="onglet() !== 'employes'">
          👥 Employés
        </button>
        <button (click)="onglet.set('salaires'); loadSalaires()"
                class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
                [class.bg-white]="onglet() === 'salaires'"
                [class.text-neutral-900]="onglet() === 'salaires'"
                [class.shadow-sm]="onglet() === 'salaires'"
                [class.text-neutral-500]="onglet() !== 'salaires'">
          💳 Salaires
        </button>
        <button (click)="onglet.set('financements'); loadFinancements()"
                class="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
                [class.bg-white]="onglet() === 'financements'"
                [class.text-neutral-900]="onglet() === 'financements'"
                [class.shadow-sm]="onglet() === 'financements'"
                [class.text-neutral-500]="onglet() !== 'financements'">
          💰 Financements
        </button>
      </div>

      <!-- ===== ONGLET EMPLOYÉS ===== -->
      @if (onglet() === 'employes') {
        @if (loading()) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (i of [1,2,3]; track i) { <div class="card animate-pulse h-32 bg-neutral-100"></div> }
          </div>
        } @else if (employes().length) {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (emp of employes(); track emp.id) {
              <div class="card">
                <div class="flex items-center gap-3 mb-4">
                  <div class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center font-bold text-primary-700 flex-shrink-0">
                    {{ emp.nom.charAt(0).toUpperCase() }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-semibold text-neutral-900 truncate">{{ emp.nom }}</div>
                    <div class="text-sm text-neutral-500">{{ emp.poste ?? '—' }}</div>
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-2 mb-3">
                  <div class="bg-neutral-50 rounded-lg p-2">
                    <div class="text-xs text-neutral-400">Salaire mensuel</div>
                    <div class="text-sm font-semibold text-neutral-900">{{ emp.salaire_mensuel_fcfa | currencyFcfa }}</div>
                  </div>
                  <div class="bg-neutral-50 rounded-lg p-2">
                    <div class="text-xs text-neutral-400">Embauche</div>
                    <div class="text-sm font-semibold text-neutral-900">{{ emp.date_embauche | dateFr }}</div>
                  </div>
                </div>
                @if (emp.telephone) {
                  <p class="text-xs text-neutral-400 mb-3">📞 {{ emp.telephone }}</p>
                }
                @if (auth.isAdmin()) {
                  <div class="flex gap-2 flex-wrap">
                    <button (click)="openModal(emp)" class="flex-1 text-xs py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition-colors">Modifier</button>
                    <button (click)="openSalaireModal(emp)" class="flex-1 text-xs py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium transition-colors">Payer salaire</button>
                    <button (click)="openFinancementModal(emp)" class="flex-1 text-xs py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium transition-colors">Financement</button>
                    <button (click)="delete(emp)" class="flex-1 text-xs py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors">Supprimer</button>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="card text-center py-16">
            <div class="text-5xl mb-4">👥</div>
            <h3 class="font-semibold text-neutral-900 mb-2">Aucun employé enregistré</h3>
            <p class="text-neutral-500 text-sm">Ajoutez les membres de votre équipe agricole.</p>
          </div>
        }
      }

      <!-- ===== ONGLET SALAIRES ===== -->
      @if (onglet() === 'salaires') {
        @if (loadingSalaires()) {
          <div class="card animate-pulse h-48 bg-neutral-100"></div>
        } @else if (salaires().length) {

          <!-- Cartes mobiles salaires -->
          <div class="md:hidden space-y-3">
            @for (sal of salaires(); track sal.id) {
              <div class="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
                <div class="flex items-start justify-between mb-2">
                  <div class="font-semibold text-neutral-900 text-sm">{{ sal.employe?.nom ?? '—' }}</div>
                  <div class="font-bold text-neutral-900 text-base">{{ sal.montant_fcfa | currencyFcfa }}</div>
                </div>
                <div class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500 mb-3">
                  <span>{{ sal.mois }}</span>
                  @if (sal.mode_paiement) { <span>· {{ sal.mode_paiement }}</span> }
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-neutral-400">{{ sal.date_paiement | dateFr }}</span>
                  @if (auth.isAdmin()) {
                    <button (click)="deleteSalaire(sal)"
                            class="border border-red-200 bg-red-50 rounded-lg px-2.5 py-1 text-xs text-red-600 hover:bg-red-100">
                      Supprimer
                    </button>
                  }
                </div>
              </div>
            }
            @empty {
              <div class="text-center py-10 text-neutral-400 text-sm">Aucun paiement enregistré</div>
            }
          </div>

          <!-- Tableau desktop salaires -->
          <div class="card overflow-hidden p-0 hidden md:block">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th class="text-left text-xs font-medium text-neutral-500 uppercase px-6 py-3">Employé</th>
                    <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Mois</th>
                    <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Montant</th>
                    <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Mode</th>
                    <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Date paiement</th>
                    @if (auth.isAdmin()) { <th class="px-4 py-3"></th> }
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-50">
                  @for (sal of salaires(); track sal.id) {
                    <tr class="hover:bg-neutral-50/50">
                      <td class="px-6 py-4 font-medium text-neutral-900">{{ sal.employe?.nom ?? '—' }}</td>
                      <td class="px-4 py-4 text-sm text-neutral-600">{{ sal.mois }}</td>
                      <td class="px-4 py-4 text-right font-semibold text-neutral-900">{{ sal.montant_fcfa | currencyFcfa }}</td>
                      <td class="px-4 py-4 text-sm text-neutral-600 capitalize">{{ sal.mode_paiement ?? '—' }}</td>
                      <td class="px-4 py-4 text-sm text-neutral-500">{{ sal.date_paiement | dateFr }}</td>
                      @if (auth.isAdmin()) {
                        <td class="px-4 py-4">
                          <button (click)="deleteSalaire(sal)" class="text-xs text-red-500 hover:underline">Supprimer</button>
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
            <div class="text-5xl mb-4">💳</div>
            <h3 class="font-semibold text-neutral-900 mb-2">Aucun paiement enregistré</h3>
            <p class="text-neutral-500 text-sm">Les paiements de salaires apparaissent ici.</p>
          </div>
        }
      }

      <!-- ===== ONGLET FINANCEMENTS ===== -->
      @if (onglet() === 'financements') {
        @if (loadingFinancements()) {
          <div class="card animate-pulse h-48 bg-neutral-100"></div>
        } @else if (financements().length) {

          <!-- Résumé -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="card py-4">
              <div class="text-xs text-neutral-400 mb-1">Total accordé</div>
              <div class="text-xl font-bold text-neutral-900">{{ totalAccorde() | currencyFcfa }}</div>
            </div>
            <div class="card py-4">
              <div class="text-xs text-neutral-400 mb-1">Remboursé</div>
              <div class="text-xl font-bold text-emerald-600">{{ totalRembourse() | currencyFcfa }}</div>
            </div>
            <div class="card py-4">
              <div class="text-xs text-neutral-400 mb-1">Reste à rembourser</div>
              <div class="text-xl font-bold text-amber-600">{{ totalRestant() | currencyFcfa }}</div>
            </div>
          </div>

          <!-- Cartes mobiles financements -->
          <div class="md:hidden space-y-3">
            @for (fin of financements(); track fin.id) {
              <div class="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <div class="font-semibold text-neutral-900 text-sm">{{ fin.employe?.nom ?? '—' }}</div>
                    <div class="text-xs text-neutral-400 mt-0.5 truncate max-w-[200px]">{{ fin.motif }}</div>
                  </div>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        [class.bg-emerald-100]="fin.statut === 'rembourse'"
                        [class.text-emerald-700]="fin.statut === 'rembourse'"
                        [class.bg-amber-100]="fin.statut === 'en_attente'"
                        [class.text-amber-700]="fin.statut === 'en_attente'">
                    {{ fin.statut === 'rembourse' ? '✓ Remboursé' : '⏳ En attente' }}
                  </span>
                </div>
                <div class="grid grid-cols-3 gap-2 text-xs mb-3">
                  <div>
                    <div class="text-neutral-400">Montant</div>
                    <div class="font-semibold text-neutral-900">{{ fin.montant_fcfa | currencyFcfa }}</div>
                  </div>
                  <div>
                    <div class="text-neutral-400">Remboursé</div>
                    <div class="font-semibold text-emerald-600">{{ fin.montant_rembourse_fcfa | currencyFcfa }}</div>
                  </div>
                  <div>
                    <div class="text-neutral-400">Restant</div>
                    <div class="font-semibold text-amber-600">{{ fin.montant_restant | currencyFcfa }}</div>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-neutral-400">{{ fin.date_financement | dateFr }}</span>
                  @if (auth.isAdmin()) {
                    <div class="flex gap-2">
                      @if (fin.statut !== 'rembourse') {
                        <button (click)="openRemboursementModal(fin)"
                                class="border border-emerald-200 bg-emerald-50 rounded-lg px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-100">
                          Rembourser
                        </button>
                      }
                      @if (!fin.remboursements?.length) {
                        <button (click)="deleteFinancement(fin)"
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
              <div class="text-center py-10 text-neutral-400 text-sm">Aucun financement enregistré</div>
            }
          </div>

          <!-- Table financements desktop -->
          <div class="card overflow-hidden p-0 hidden md:block">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th class="text-left text-xs font-medium text-neutral-500 uppercase px-6 py-3">Employé</th>
                    <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Motif</th>
                    <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Date</th>
                    <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Montant</th>
                    <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Remboursé</th>
                    <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Restant</th>
                    <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Statut</th>
                    @if (auth.isAdmin()) { <th class="px-4 py-3"></th> }
                  </tr>
                </thead>
                <tbody class="divide-y divide-neutral-50">
                  @for (fin of financements(); track fin.id) {
                    <tr class="hover:bg-neutral-50/50">
                      <td class="px-6 py-4 font-medium text-neutral-900">{{ fin.employe?.nom ?? '—' }}</td>
                      <td class="px-4 py-4 text-sm text-neutral-700 max-w-[180px] truncate" [title]="fin.motif">{{ fin.motif }}</td>
                      <td class="px-4 py-4 text-sm text-neutral-500 whitespace-nowrap">{{ fin.date_financement | dateFr }}</td>
                      <td class="px-4 py-4 text-right font-semibold text-neutral-900 whitespace-nowrap">{{ fin.montant_fcfa | currencyFcfa }}</td>
                      <td class="px-4 py-4 text-right text-emerald-600 font-medium whitespace-nowrap">{{ fin.montant_rembourse_fcfa | currencyFcfa }}</td>
                      <td class="px-4 py-4 text-right text-amber-600 font-semibold whitespace-nowrap">{{ fin.montant_restant | currencyFcfa }}</td>
                      <td class="px-4 py-4">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                              [class.bg-emerald-100]="fin.statut === 'rembourse'"
                              [class.text-emerald-700]="fin.statut === 'rembourse'"
                              [class.bg-amber-100]="fin.statut === 'en_attente'"
                              [class.text-amber-700]="fin.statut === 'en_attente'">
                          {{ fin.statut === 'rembourse' ? '✓ Remboursé' : '⏳ En attente' }}
                        </span>
                      </td>
                      @if (auth.isAdmin()) {
                        <td class="px-4 py-4">
                          <div class="flex gap-2 items-center">
                            @if (fin.statut !== 'rembourse') {
                              <button (click)="openRemboursementModal(fin)"
                                      class="text-xs px-2.5 py-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium transition-colors whitespace-nowrap">
                                Rembourser
                              </button>
                            }
                            @if (!fin.remboursements?.length) {
                              <button (click)="deleteFinancement(fin)"
                                      class="text-xs text-red-400 hover:text-red-600 transition-colors">✕</button>
                            }
                          </div>
                        </td>
                      }
                    </tr>
                    <!-- Ligne historique remboursements -->
                    @if (fin.remboursements?.length) {
                      <tr class="bg-neutral-50/60">
                        <td colspan="8" class="px-6 pb-3 pt-0">
                          <div class="text-xs text-neutral-400 font-medium mb-1.5">Historique des remboursements :</div>
                          <div class="flex flex-wrap gap-2">
                            @for (r of fin.remboursements; track r.id) {
                              <span class="inline-flex items-center gap-1.5 bg-white border border-emerald-100 rounded-lg px-2.5 py-1 text-xs text-neutral-700">
                                <span class="text-emerald-600 font-semibold">{{ r.montant_fcfa | currencyFcfa }}</span>
                                <span class="text-neutral-400">—</span>
                                <span>{{ r.date_remboursement | dateFr }}</span>
                                <span class="text-neutral-400 capitalize">({{ r.mode_paiement }})</span>
                              </span>
                            }
                          </div>
                        </td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </div>
          </div>
        } @else {
          <div class="card text-center py-16">
            <div class="text-5xl mb-4">💰</div>
            <h3 class="font-semibold text-neutral-900 mb-2">Aucun financement enregistré</h3>
            <p class="text-neutral-500 text-sm">Les financements individuels accordés aux employés apparaissent ici.</p>
          </div>
        }
      }

      <!-- ─── MODAL EMPLOYÉ ─────────────────────────────────────── -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeModal()">
          <div class="bg-white rounded-2xl w-full max-w-lg shadow-xl" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-neutral-100">
              <h2 class="font-semibold text-neutral-900">{{ editing() ? "Modifier l'employé" : "Nouvel employé" }}</h2>
              <button (click)="closeModal()" class="text-neutral-400 text-xl">&times;</button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()" class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="form-label">Nom complet *</label>
                  <input type="text" formControlName="nom" class="form-input" placeholder="ex: Mamadou Diallo"/>
                  @if (form.get('nom')?.invalid && form.get('nom')?.touched) {
                    <p class="form-error">Nom requis.</p>
                  }
                </div>
                <div>
                  <label class="form-label">Poste</label>
                  <input type="text" formControlName="poste" class="form-input" placeholder="ex: Ouvrier agricole"/>
                </div>
                <div>
                  <label class="form-label">Téléphone</label>
                  <input type="tel" formControlName="telephone" class="form-input"/>
                </div>
                <div>
                  <label class="form-label">Salaire mensuel (FCFA)</label>
                  <input type="number" formControlName="salaire_mensuel_fcfa" class="form-input" min="0"/>
                </div>
                <div>
                  <label class="form-label">Date d'embauche</label>
                  <input type="date" formControlName="date_embauche" class="form-input"/>
                </div>
                <div class="col-span-2">
                  <label class="form-label">Notes</label>
                  <textarea formControlName="notes" class="form-input h-16 resize-none"></textarea>
                </div>
              </div>
              <div class="flex gap-3 pt-2">
                <button type="button" (click)="closeModal()" class="btn-secondary flex-1 h-10 text-sm">Annuler</button>
                <button type="submit" [disabled]="saving() || form.invalid" class="btn-primary flex-1 h-10 text-sm">
                  {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ─── MODAL SALAIRE ─────────────────────────────────────── -->
      @if (showSalaireModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="showSalaireModal.set(false)">
          <div class="bg-white rounded-2xl w-full max-w-md shadow-xl" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-neutral-100">
              <h2 class="font-semibold text-neutral-900">Payer un salaire</h2>
              <button (click)="showSalaireModal.set(false)" class="text-neutral-400 text-xl">&times;</button>
            </div>
            <form [formGroup]="salaireForm" (ngSubmit)="saveSalaire()" class="p-6 space-y-4">
              <div>
                <label class="form-label">Employé *</label>
                <select formControlName="employe_id" class="form-input">
                  <option value="">Sélectionner...</option>
                  @for (emp of employes(); track emp.id) {
                    <option [value]="emp.id">{{ emp.nom }}</option>
                  }
                </select>
                @if (salaireForm.get('employe_id')?.invalid && salaireForm.get('employe_id')?.touched) {
                  <p class="form-error">Employé requis.</p>
                }
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Montant (FCFA) *</label>
                  <input type="number" formControlName="montant_fcfa" class="form-input" min="0"/>
                </div>
                <div>
                  <label class="form-label">Mois (AAAA-MM) *</label>
                  <input type="month" formControlName="mois" class="form-input"/>
                </div>
                <div>
                  <label class="form-label">Date de paiement *</label>
                  <input type="date" formControlName="date_paiement" class="form-input"/>
                </div>
                <div>
                  <label class="form-label">Mode de paiement</label>
                  <select formControlName="mode_paiement" class="form-input">
                    <option value="especes">Espèces</option>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="virement">Virement</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>
              <p class="text-xs text-neutral-400 bg-blue-50 rounded-lg px-3 py-2">
                💡 Une dépense sera automatiquement créée dans votre comptabilité.
              </p>
              <div class="flex gap-3 pt-2">
                <button type="button" (click)="showSalaireModal.set(false)" class="btn-secondary flex-1 h-10 text-sm">Annuler</button>
                <button type="submit" [disabled]="savingSalaire()" class="btn-primary flex-1 h-10 text-sm">
                  {{ savingSalaire() ? 'Enregistrement...' : 'Valider le paiement' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ─── MODAL FINANCEMENT ──────────────────────────────────── -->
      @if (showFinancementModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="showFinancementModal.set(false)">
          <div class="bg-white rounded-2xl w-full max-w-md shadow-xl" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-neutral-100">
              <h2 class="font-semibold text-neutral-900">Enregistrer un financement</h2>
              <button (click)="showFinancementModal.set(false)" class="text-neutral-400 text-xl">&times;</button>
            </div>
            <form [formGroup]="financementForm" (ngSubmit)="saveFinancement()" class="p-6 space-y-4">
              <div>
                <label class="form-label">Employé *</label>
                <select formControlName="employe_id" class="form-input">
                  <option value="">Sélectionner...</option>
                  @for (emp of employes(); track emp.id) {
                    <option [value]="emp.id">{{ emp.nom }}</option>
                  }
                </select>
                @if (financementForm.get('employe_id')?.invalid && financementForm.get('employe_id')?.touched) {
                  <p class="form-error">Employé requis.</p>
                }
              </div>
              <div>
                <label class="form-label">Motif *</label>
                <input type="text" formControlName="motif" class="form-input" placeholder="ex: Campagne oignon 2025-2026"/>
                @if (financementForm.get('motif')?.invalid && financementForm.get('motif')?.touched) {
                  <p class="form-error">Motif requis.</p>
                }
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Montant (FCFA) *</label>
                  <input type="number" formControlName="montant_fcfa" class="form-input" min="1"/>
                  @if (financementForm.get('montant_fcfa')?.invalid && financementForm.get('montant_fcfa')?.touched) {
                    <p class="form-error">Montant requis.</p>
                  }
                </div>
                <div>
                  <label class="form-label">Date *</label>
                  <input type="date" formControlName="date_financement" class="form-input"/>
                </div>
                <div class="col-span-2">
                  <label class="form-label">Mode de remise</label>
                  <select formControlName="mode_paiement" class="form-input">
                    <option value="especes">Espèces</option>
                    <option value="virement">Virement</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="wave">Wave</option>
                  </select>
                </div>
                <div class="col-span-2">
                  <label class="form-label">Notes</label>
                  <textarea formControlName="notes" class="form-input h-16 resize-none" placeholder="Informations complémentaires..."></textarea>
                </div>
              </div>
              <p class="text-xs text-neutral-400 bg-amber-50 rounded-lg px-3 py-2">
                💡 Une dépense <strong>Financement individuel</strong> sera automatiquement créée dans votre comptabilité.
              </p>
              <div class="flex gap-3 pt-2">
                <button type="button" (click)="showFinancementModal.set(false)" class="btn-secondary flex-1 h-10 text-sm">Annuler</button>
                <button type="submit" [disabled]="savingFinancement()" class="btn-primary flex-1 h-10 text-sm">
                  {{ savingFinancement() ? 'Enregistrement...' : 'Valider le financement' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- ─── MODAL REMBOURSEMENT ────────────────────────────────── -->
      @if (showRemboursementModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="showRemboursementModal.set(false)">
          <div class="bg-white rounded-2xl w-full max-w-md shadow-xl" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-neutral-100">
              <div>
                <h2 class="font-semibold text-neutral-900">Enregistrer un remboursement</h2>
                @if (selectedFinancement()) {
                  <p class="text-sm text-neutral-500 mt-0.5">
                    {{ selectedFinancement()!.employe?.nom }} — Restant :
                    <strong class="text-amber-600">{{ selectedFinancement()!.montant_restant | currencyFcfa }}</strong>
                  </p>
                }
              </div>
              <button (click)="showRemboursementModal.set(false)" class="text-neutral-400 text-xl">&times;</button>
            </div>
            <form [formGroup]="remboursementForm" (ngSubmit)="saveRemboursement()" class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Montant remboursé (FCFA) *</label>
                  <input type="number" formControlName="montant_fcfa" class="form-input" min="1"
                         [max]="selectedFinancement()?.montant_restant"/>
                  @if (remboursementForm.get('montant_fcfa')?.invalid && remboursementForm.get('montant_fcfa')?.touched) {
                    <p class="form-error">Montant requis.</p>
                  }
                </div>
                <div>
                  <label class="form-label">Date *</label>
                  <input type="date" formControlName="date_remboursement" class="form-input"/>
                </div>
                <div class="col-span-2">
                  <label class="form-label">Mode de réception</label>
                  <select formControlName="mode_paiement" class="form-input">
                    <option value="especes">Espèces</option>
                    <option value="virement">Virement</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="wave">Wave</option>
                  </select>
                </div>
              </div>
              <p class="text-xs text-neutral-400 bg-emerald-50 rounded-lg px-3 py-2">
                💡 Une <strong>vente (remboursement financement)</strong> sera automatiquement créée dans votre comptabilité.
              </p>
              <div class="flex gap-3 pt-2">
                <button type="button" (click)="showRemboursementModal.set(false)" class="btn-secondary flex-1 h-10 text-sm">Annuler</button>
                <button type="submit" [disabled]="savingRemboursement()" class="btn-primary flex-1 h-10 text-sm">
                  {{ savingRemboursement() ? 'Enregistrement...' : 'Valider le remboursement' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `,
})
export class EmployesComponent implements OnInit {
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  onglet = signal<'employes' | 'salaires' | 'financements'>('employes');

  // Employés
  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editing = signal<any>(null);
  employes = signal<any[]>([]);

  // Salaires
  loadingSalaires = signal(false);
  savingSalaire = signal(false);
  showSalaireModal = signal(false);
  salaires = signal<any[]>([]);

  // Financements
  loadingFinancements = signal(false);
  savingFinancement = signal(false);
  savingRemboursement = signal(false);
  showFinancementModal = signal(false);
  showRemboursementModal = signal(false);
  selectedFinancement = signal<any>(null);
  financements = signal<any[]>([]);

  // Computed totaux financements
  totalAccorde = () => this.financements().reduce((s, f) => s + +f.montant_fcfa, 0);
  totalRembourse = () => this.financements().reduce((s, f) => s + +f.montant_rembourse_fcfa, 0);
  totalRestant = () => this.financements().reduce((s, f) => s + +f.montant_restant, 0);

  form = this.fb.group({
    nom: ['', Validators.required],
    poste: [''],
    telephone: [''],
    salaire_mensuel_fcfa: [null as number | null],
    date_embauche: [new Date().toISOString().split('T')[0]],
    notes: [''],
  });

  salaireForm = this.fb.group({
    employe_id: ['', Validators.required],
    montant_fcfa: [null as number | null, [Validators.required, Validators.min(0)]],
    mois: [new Date().toISOString().slice(0, 7), Validators.required],
    date_paiement: [new Date().toISOString().split('T')[0], Validators.required],
    mode_paiement: ['especes'],
  });

  financementForm = this.fb.group({
    employe_id: ['', Validators.required],
    motif: ['', Validators.required],
    montant_fcfa: [null as number | null, [Validators.required, Validators.min(1)]],
    date_financement: [new Date().toISOString().split('T')[0], Validators.required],
    mode_paiement: ['especes'],
    notes: [''],
  });

  remboursementForm = this.fb.group({
    montant_fcfa: [null as number | null, [Validators.required, Validators.min(1)]],
    date_remboursement: [new Date().toISOString().split('T')[0], Validators.required],
    mode_paiement: ['especes'],
  });

  ngOnInit(): void { this.load(); }

  // ── Employés ──────────────────────────────────────────────────────────────

  load(): void {
    this.loading.set(true);
    this.api.get<any>('/api/employes').subscribe({
      next: res => { this.employes.set(Array.isArray(res) ? res : res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openModal(emp?: any): void {
    this.editing.set(emp ?? null);
    if (emp) {
      this.form.patchValue({
        nom: emp.nom, poste: emp.poste, telephone: emp.telephone,
        salaire_mensuel_fcfa: emp.salaire_mensuel_fcfa,
        date_embauche: emp.date_embauche?.split('T')[0] ?? emp.date_embauche,
        notes: emp.notes,
      });
    } else {
      this.form.reset({ date_embauche: new Date().toISOString().split('T')[0] });
    }
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editing.set(null); this.form.reset(); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const payload: any = { ...this.form.value };
    if (!payload.salaire_mensuel_fcfa) delete payload.salaire_mensuel_fcfa;
    if (!payload.notes) delete payload.notes;

    const req = this.editing()
      ? this.api.put(`/api/employes/${this.editing().id}`, payload)
      : this.api.post('/api/employes', payload);

    req.subscribe({
      next: () => {
        this.notif.success(this.editing() ? 'Employé modifié.' : 'Employé ajouté.');
        this.saving.set(false); this.closeModal(); this.load();
      },
      error: err => {
        this.saving.set(false);
        const first = err.error?.errors ? Object.values(err.error.errors)[0] as string[] : null;
        this.notif.error(first?.[0] ?? err.error?.message ?? 'Erreur.');
      },
    });
  }

  delete(emp: any): void {
    if (!confirm(`Supprimer ${emp.nom} ?`)) return;
    this.api.delete(`/api/employes/${emp.id}`).subscribe({
      next: () => { this.notif.success('Employé supprimé.'); this.load(); },
      error: err => this.notif.error(err.error?.message || 'Erreur.'),
    });
  }

  // ── Salaires ──────────────────────────────────────────────────────────────

  loadSalaires(): void {
    this.loadingSalaires.set(true);
    this.api.get<any>('/api/salaires').subscribe({
      next: res => { this.salaires.set(Array.isArray(res) ? res : res.data ?? []); this.loadingSalaires.set(false); },
      error: () => this.loadingSalaires.set(false),
    });
  }

  openSalaireModal(emp?: any): void {
    this.salaireForm.reset({
      employe_id: emp?.id ?? '',
      mois: new Date().toISOString().slice(0, 7),
      date_paiement: new Date().toISOString().split('T')[0],
      mode_paiement: 'especes',
      montant_fcfa: emp?.salaire_mensuel_fcfa ?? null,
    });
    this.showSalaireModal.set(true);
  }

  saveSalaire(): void {
    if (this.salaireForm.invalid) { this.salaireForm.markAllAsTouched(); return; }
    this.savingSalaire.set(true);
    this.api.post('/api/salaires', this.salaireForm.value).subscribe({
      next: () => {
        this.notif.success('Salaire payé. Une dépense a été créée automatiquement.');
        this.savingSalaire.set(false); this.showSalaireModal.set(false);
        if (this.onglet() === 'salaires') this.loadSalaires();
      },
      error: err => {
        this.savingSalaire.set(false);
        const first = err.error?.errors ? Object.values(err.error.errors)[0] as string[] : null;
        this.notif.error(first?.[0] ?? err.error?.message ?? 'Erreur.');
      },
    });
  }

  deleteSalaire(sal: any): void {
    if (!confirm('Supprimer ce paiement ?')) return;
    this.api.delete(`/api/salaires/${sal.id}`).subscribe({
      next: () => { this.notif.success('Paiement supprimé.'); this.loadSalaires(); },
      error: err => this.notif.error(err.error?.message || 'Erreur.'),
    });
  }

  // ── Financements ──────────────────────────────────────────────────────────

  loadFinancements(): void {
    this.loadingFinancements.set(true);
    this.api.get<any>('/api/financements').subscribe({
      next: res => { this.financements.set(Array.isArray(res) ? res : res.data ?? []); this.loadingFinancements.set(false); },
      error: () => this.loadingFinancements.set(false),
    });
  }

  openFinancementModal(emp?: any): void {
    this.financementForm.reset({
      employe_id: emp?.id ? String(emp.id) : '',
      motif: '',
      montant_fcfa: null,
      date_financement: new Date().toISOString().split('T')[0],
      mode_paiement: 'especes',
      notes: '',
    });
    this.showFinancementModal.set(true);
  }

  saveFinancement(): void {
    if (this.financementForm.invalid) { this.financementForm.markAllAsTouched(); return; }
    this.savingFinancement.set(true);
    const { employe_id, ...rest } = this.financementForm.value as any;
    this.api.post(`/api/employes/${employe_id}/financements`, rest).subscribe({
      next: () => {
        this.notif.success('Financement enregistré. Une dépense a été créée automatiquement.');
        this.savingFinancement.set(false); this.showFinancementModal.set(false);
        if (this.onglet() === 'financements') this.loadFinancements();
      },
      error: err => {
        this.savingFinancement.set(false);
        const first = err.error?.errors ? Object.values(err.error.errors)[0] as string[] : null;
        this.notif.error(first?.[0] ?? err.error?.message ?? 'Erreur.');
      },
    });
  }

  openRemboursementModal(fin: any): void {
    this.selectedFinancement.set(fin);
    this.remboursementForm.reset({
      montant_fcfa: null,
      date_remboursement: new Date().toISOString().split('T')[0],
      mode_paiement: 'especes',
    });
    this.showRemboursementModal.set(true);
  }

  saveRemboursement(): void {
    if (this.remboursementForm.invalid) { this.remboursementForm.markAllAsTouched(); return; }
    this.savingRemboursement.set(true);
    const finId = this.selectedFinancement()!.id;
    this.api.post(`/api/financements/${finId}/rembourser`, this.remboursementForm.value).subscribe({
      next: () => {
        this.notif.success('Remboursement enregistré. Une vente a été créée automatiquement.');
        this.savingRemboursement.set(false); this.showRemboursementModal.set(false);
        this.selectedFinancement.set(null);
        this.loadFinancements();
      },
      error: err => {
        this.savingRemboursement.set(false);
        const first = err.error?.errors ? Object.values(err.error.errors)[0] as string[] : null;
        this.notif.error(first?.[0] ?? err.error?.message ?? 'Erreur.');
      },
    });
  }

  deleteFinancement(fin: any): void {
    if (!confirm(`Supprimer ce financement de ${fin.employe?.nom} ?`)) return;
    this.api.delete(`/api/financements/${fin.id}`).subscribe({
      next: () => { this.notif.success('Financement supprimé.'); this.loadFinancements(); },
      error: err => this.notif.error(err.error?.message || 'Erreur.'),
    });
  }
}

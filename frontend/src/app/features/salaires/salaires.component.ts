import { Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { CurrencyFcfaPipe } from '../../core/pipes/currency-fcfa.pipe';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';

@Component({
  selector: 'app-salaires',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyFcfaPipe, DateFrPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-neutral-900">Salaires</h1>
          <p class="text-neutral-500 text-sm">Gérez les paiements de salaires</p>
        </div>
        @if (auth.isAdmin()) {
          <button (click)="openModal()" class="btn-primary h-9 px-4 text-sm">+ Payer un salaire</button>
        }
      </div>

      <!-- Résumé mensuel -->
      <div class="grid grid-cols-3 gap-4">
        <div class="card text-center">
          <div class="text-xs text-neutral-500 mb-1">Total payé ce mois</div>
          <div class="text-xl font-bold text-red-600">{{ totalMois() | currencyFcfa }}</div>
        </div>
        <div class="card text-center">
          <div class="text-xs text-neutral-500 mb-1">Nombre de paiements</div>
          <div class="text-xl font-bold text-neutral-900">{{ paiements().length }}</div>
        </div>
        <div class="card text-center">
          <div class="text-xs text-neutral-500 mb-1">Employés payés</div>
          <div class="text-xl font-bold text-neutral-900">{{ employesPayes() }}</div>
        </div>
      </div>

      @if (loading()) {
        <div class="card animate-pulse h-48 bg-neutral-100"></div>
      } @else if (paiements().length) {
        <div class="card overflow-hidden p-0">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th class="text-left text-xs font-medium text-neutral-500 uppercase px-6 py-3">Employé</th>
                  <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Période</th>
                  <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Salaire de base</th>
                  <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Primes</th>
                  <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Déductions</th>
                  <th class="text-right text-xs font-medium text-neutral-500 uppercase px-4 py-3">Net payé</th>
                  <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-50">
                @for (p of paiements(); track p.id) {
                  <tr class="hover:bg-neutral-50/50">
                    <td class="px-6 py-4 font-medium text-neutral-900">{{ p.employe?.prenom }} {{ p.employe?.nom }}</td>
                    <td class="px-4 py-4 text-sm text-neutral-600">{{ p.mois }}/{{ p.annee }}</td>
                    <td class="px-4 py-4 text-right text-sm">{{ p.salaire_base | currencyFcfa }}</td>
                    <td class="px-4 py-4 text-right text-sm text-green-600">+{{ p.primes | currencyFcfa }}</td>
                    <td class="px-4 py-4 text-right text-sm text-red-600">-{{ p.deductions | currencyFcfa }}</td>
                    <td class="px-4 py-4 text-right font-bold text-neutral-900">{{ p.montant_net | currencyFcfa }}</td>
                    <td class="px-4 py-4 text-sm text-neutral-500">{{ p.date_paiement | dateFr }}</td>
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
          <p class="text-neutral-500 text-sm">Enregistrez les paiements de salaires de vos employés.</p>
        </div>
      }

      @if (showModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeModal()">
          <div class="bg-white rounded-2xl w-full max-w-lg shadow-xl" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-neutral-100">
              <h2 class="font-semibold text-neutral-900">Payer un salaire</h2>
              <button (click)="closeModal()" class="text-neutral-400 text-xl">&times;</button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()" class="p-6 space-y-4">
              <div>
                <label class="form-label">Employé *</label>
                <select formControlName="employe_id" class="form-input" (change)="onEmployeChange($event)">
                  <option value="">Sélectionner...</option>
                  @for (emp of employes(); track emp.id) {
                    <option [value]="emp.id">{{ emp.prenom }} {{ emp.nom }} — {{ emp.salaire_base | currencyFcfa }}</option>
                  }
                </select>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Mois *</label>
                  <select formControlName="mois" class="form-input">
                    @for (m of mois; track m.num) { <option [value]="m.num">{{ m.nom }}</option> }
                  </select>
                </div>
                <div>
                  <label class="form-label">Année *</label>
                  <input type="number" formControlName="annee" class="form-input"/>
                </div>
                <div>
                  <label class="form-label">Salaire de base</label>
                  <input type="number" formControlName="salaire_base" class="form-input"/>
                </div>
                <div>
                  <label class="form-label">Primes (FCFA)</label>
                  <input type="number" formControlName="primes" class="form-input"/>
                </div>
                <div>
                  <label class="form-label">Déductions (FCFA)</label>
                  <input type="number" formControlName="deductions" class="form-input"/>
                </div>
                <div>
                  <label class="form-label">Date de paiement</label>
                  <input type="date" formControlName="date_paiement" class="form-input"/>
                </div>
              </div>
              <div>
                <label class="form-label">Mode de paiement</label>
                <select formControlName="mode_paiement" class="form-input">
                  <option value="especes">Espèces</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="virement">Virement</option>
                </select>
              </div>
              <div class="flex gap-3 pt-2">
                <button type="button" (click)="closeModal()" class="btn-secondary flex-1 h-10 text-sm">Annuler</button>
                <button type="submit" [disabled]="saving() || form.invalid" class="btn-primary flex-1 h-10 text-sm">
                  {{ saving() ? 'Enregistrement...' : 'Valider le paiement' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class SalairesComponent implements OnInit {
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  paiements = signal<any[]>([]);
  employes = signal<any[]>([]);

  totalMois = () => this.paiements().reduce((acc, p) => acc + Number(p.montant_net), 0);
  employesPayes = () => new Set(this.paiements().map(p => p.employe_id)).size;

  mois = [
    { num: 1, nom: 'Janvier' }, { num: 2, nom: 'Février' }, { num: 3, nom: 'Mars' },
    { num: 4, nom: 'Avril' }, { num: 5, nom: 'Mai' }, { num: 6, nom: 'Juin' },
    { num: 7, nom: 'Juillet' }, { num: 8, nom: 'Août' }, { num: 9, nom: 'Septembre' },
    { num: 10, nom: 'Octobre' }, { num: 11, nom: 'Novembre' }, { num: 12, nom: 'Décembre' },
  ];

  form = this.fb.group({
    employe_id: ['', Validators.required],
    mois: [new Date().getMonth() + 1, Validators.required],
    annee: [new Date().getFullYear(), Validators.required],
    salaire_base: [0],
    primes: [0],
    deductions: [0],
    date_paiement: [new Date().toISOString().split('T')[0]],
    mode_paiement: ['especes'],
  });

  ngOnInit(): void {
    this.load();
    this.api.get<any>('/api/employes').subscribe({ next: res => this.employes.set(res.data?.data || res.data || []) });
  }

  load(): void {
    this.loading.set(true);
    this.api.get<any>('/api/salaires').subscribe({
      next: res => { this.paiements.set(res.data?.data || res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onEmployeChange(event: Event): void {
    const id = (event.target as HTMLSelectElement).value;
    const emp = this.employes().find(e => String(e.id) === id);
    if (emp) this.form.patchValue({ salaire_base: emp.salaire_base });
  }

  openModal(): void {
    this.form.reset({
      mois: new Date().getMonth() + 1, annee: new Date().getFullYear(),
      primes: 0, deductions: 0, date_paiement: new Date().toISOString().split('T')[0], mode_paiement: 'especes'
    });
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.form.reset(); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    this.api.post('/api/salaires', this.form.value).subscribe({
      next: () => { this.notif.success('Paiement de salaire enregistré.'); this.saving.set(false); this.closeModal(); this.load(); },
      error: err => { this.saving.set(false); this.notif.error(err.error?.message || 'Erreur.'); },
    });
  }
}

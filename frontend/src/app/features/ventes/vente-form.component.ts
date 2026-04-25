import { Component, input, output, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { CurrencyFcfaPipe } from '../../core/pipes/currency-fcfa.pipe';

@Component({
  selector: 'app-vente-form',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyFcfaPipe],
  template: `
    <div class="modal-backdrop" (click)="ferme.emit()">
      <div class="modal-panel max-w-lg w-full flex flex-col" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between px-6 py-4 shrink-0" style="border-bottom:1px solid #f0efee;">
          <h2 class="font-semibold text-neutral-900">{{ vente() ? 'Modifier la vente' : 'Nouvelle vente' }}</h2>
          <button (click)="ferme.emit()" class="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
            <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col flex-1 overflow-hidden">
          <div class="overflow-y-auto flex-1 p-6 space-y-4">
          <div>
            <label class="form-label">Produit vendu *</label>
            <input type="text" formControlName="produit" class="form-input" placeholder="ex: Mil, Tomates, Oignons…"/>
            @if (form.get('produit')?.invalid && form.get('produit')?.touched) {
              <p class="form-error">Produit requis.</p>
            }
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="sm:col-span-2">
              <label class="form-label">Culture liée</label>
              <select formControlName="culture_id" class="form-input" (change)="onCultureChange($event)">
                <option value="">Aucune</option>
                @for (c of cultures(); track c.id) {
                  <option [value]="c.id">{{ c.nom }} — {{ c.champ?.nom ?? '?' }}</option>
                }
              </select>
            </div>
            <div>
              <label class="form-label">Champ</label>
              <select formControlName="champ_id" class="form-input">
                <option value="">Aucun</option>
                @for (c of champs(); track c.id) {
                  <option [value]="c.id">{{ c.nom }}</option>
                }
              </select>
              @if (champAutoRempli()) {
                <p class="text-xs text-primary-600 mt-1 flex items-center gap-1">
                  <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke-linecap="round"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke-linecap="round"/></svg>
                  Champ auto-associé à la culture
                </p>
              }
            </div>
            <div>
              <label class="form-label">Acheteur</label>
              <input type="text" formControlName="acheteur" class="form-input" placeholder="Nom de l'acheteur"/>
            </div>
            <div class="sm:col-span-2">
              <label class="form-label">Unité de mesure</label>
              <div class="flex gap-3 mt-1">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" formControlName="unite" value="kg" class="accent-primary-600"/>
                  <span class="text-sm text-neutral-700">Kilogramme (kg)</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" formControlName="unite" value="sac" class="accent-primary-600"/>
                  <span class="text-sm text-neutral-700">Sac</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" formControlName="unite" value="caisse" class="accent-primary-600"/>
                  <span class="text-sm text-neutral-700">Caisse</span>
                </label>
              </div>
            </div>
            <div>
              <label class="form-label">Quantité ({{ form.get('unite')?.value || 'kg' }}) *</label>
              <input type="number" step="0.01" formControlName="quantite_kg" class="form-input" min="0" placeholder="0"/>
              @if (form.get('quantite_kg')?.invalid && form.get('quantite_kg')?.touched) {
                <p class="form-error">Quantité requise.</p>
              }
            </div>
            <div>
              <label class="form-label">Prix unitaire (FCFA/{{ form.get('unite')?.value || 'kg' }}) *</label>
              <input type="number" formControlName="prix_unitaire_fcfa" class="form-input" min="0" placeholder="0"/>
              @if (form.get('prix_unitaire_fcfa')?.invalid && form.get('prix_unitaire_fcfa')?.touched) {
                <p class="form-error">Prix requis.</p>
              }
            </div>
            <div>
              <label class="form-label">Date de vente *</label>
              <input type="date" formControlName="date_vente" class="form-input"/>
              @if (form.get('date_vente')?.invalid && form.get('date_vente')?.touched) {
                <p class="form-error">Date requise.</p>
              }
            </div>
            <div class="sm:col-span-2">
              <label class="form-label">Notes</label>
              <textarea formControlName="notes" class="form-input h-16 resize-none" placeholder="Informations complémentaires…"></textarea>
            </div>
          </div>
          @if (form.value.quantite_kg && form.value.prix_unitaire_fcfa) {
            <div class="flex items-center justify-between px-4 py-3 rounded-xl" style="background:#f0fdf4;border:1px solid #dcfce7;">
              <span class="text-sm text-green-700">Total estimé</span>
              <span class="font-bold text-green-700 tabular-nums">{{ (form.value.quantite_kg! * form.value.prix_unitaire_fcfa!) | currencyFcfa }}</span>
            </div>
          }
          </div><!-- fin scroll -->
          <!-- Boutons collés en bas -->
          <div class="shrink-0 px-6 py-4 flex flex-col-reverse sm:flex-row gap-3" style="border-top:1px solid #f0efee;">
            <button type="button" (click)="ferme.emit()" class="btn-secondary h-11 text-sm sm:flex-1">Annuler</button>
            <button type="submit" [disabled]="saving() || form.invalid" class="btn-primary h-11 text-sm sm:flex-1">
              {{ saving() ? 'Enregistrement…' : (vente() ? 'Modifier' : 'Enregistrer') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class VenteFormComponent implements OnInit {
  vente   = input<any>(null);
  champs  = input<any[]>([]);
  cultures = input<any[]>([]);

  ferme      = output<void>();
  sauvegarde = output<void>();

  private api   = inject(ApiService);
  private notif = inject(NotificationService);
  private fb    = inject(FormBuilder);

  saving         = signal(false);
  champAutoRempli = signal(false);

  form = this.fb.group({
    produit:            ['', Validators.required],
    culture_id:         [null as number | null],
    champ_id:           [null as number | null],
    acheteur:           [''],
    quantite_kg:        [null as number | null, [Validators.required, Validators.min(0)]],
    unite:              ['kg'],
    prix_unitaire_fcfa: [null as number | null, [Validators.required, Validators.min(0)]],
    date_vente:         [new Date().toISOString().split('T')[0], Validators.required],
    notes:              [''],
  });

  ngOnInit(): void {
    const v = this.vente();
    this.champAutoRempli.set(false);
    if (v) {
      this.form.patchValue({
        produit: v.produit, culture_id: v.culture_id, champ_id: v.champ_id,
        acheteur: v.acheteur, quantite_kg: v.quantite_kg, unite: v.unite ?? 'kg',
        prix_unitaire_fcfa: v.prix_unitaire_fcfa,
        date_vente: v.date_vente?.split('T')[0] ?? v.date_vente,
        notes: v.notes,
      });
    }
  }

  onCultureChange(event: Event): void {
    const id = Number((event.target as HTMLSelectElement).value);
    const culture = this.cultures().find(c => c.id === id);
    if (culture?.champ_id) {
      this.form.patchValue({ champ_id: culture.champ_id });
      this.champAutoRempli.set(true);
    } else {
      this.champAutoRempli.set(false);
    }
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const payload: any = { ...this.form.value };
    if (!payload.culture_id) delete payload.culture_id;
    if (!payload.champ_id) delete payload.champ_id;
    if (!payload.acheteur) delete payload.acheteur;
    if (!payload.notes) delete payload.notes;

    const v = this.vente();
    const req = v
      ? this.api.put(`/api/ventes/${v.id}`, payload)
      : this.api.post('/api/ventes', payload);

    req.subscribe({
      next: res => {
        if ((res as any)?._offline) {
          this.notif.success('Vente enregistrée hors ligne — sera envoyée automatiquement à la reconnexion.');
          this.saving.set(false);
          this.sauvegarde.emit();
          return;
        }
        this.notif.success(v ? 'Vente modifiée.' : 'Vente enregistrée.');
        this.saving.set(false);
        this.sauvegarde.emit();
      },
      error: err => {
        this.saving.set(false);
        const first = err.error?.errors ? Object.values(err.error.errors)[0] as string[] : null;
        this.notif.error(first ? first[0] : (err.error?.message || 'Erreur.'));
      },
    });
  }
}

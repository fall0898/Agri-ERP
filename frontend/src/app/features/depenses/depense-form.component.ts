import { Component, input, output, signal, inject, effect } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-depense-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="ferme.emit()">
      <div class="bg-white rounded-2xl w-full max-w-lg shadow-xl" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between p-6 border-b border-neutral-100">
          <h2 class="font-semibold text-neutral-900">{{ depense() ? 'Modifier la dépense' : 'Nouvelle dépense' }}</h2>
          <button (click)="ferme.emit()" class="text-neutral-400 text-xl">&times;</button>
        </div>
        <form [formGroup]="form" (ngSubmit)="save()" class="p-6 space-y-4">
          <div>
            <label class="form-label">Description *</label>
            <input type="text" formControlName="description" class="form-input" placeholder="ex: Achat engrais NPK"/>
            @if (form.get('description')?.invalid && form.get('description')?.touched) {
              <p class="form-error">Description requise.</p>
            }
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="form-label">Montant (FCFA) *</label>
              <input type="number" formControlName="montant_fcfa" class="form-input" min="0"/>
              @if (form.get('montant_fcfa')?.invalid && form.get('montant_fcfa')?.touched) {
                <p class="form-error">Montant requis.</p>
              }
            </div>
            <div>
              <label class="form-label">Date *</label>
              <input type="date" formControlName="date_depense" class="form-input"/>
              @if (form.get('date_depense')?.invalid && form.get('date_depense')?.touched) {
                <p class="form-error">Date requise.</p>
              }
            </div>
            <div>
              <label class="form-label">Catégorie *</label>
              <select formControlName="categorie" class="form-input">
                <option value="">Sélectionner...</option>
                @for (cat of categories(); track cat.slug) {
                  <option [value]="cat.slug">{{ cat.nom }}</option>
                }
              </select>
              @if (form.get('categorie')?.invalid && form.get('categorie')?.touched) {
                <p class="form-error">Catégorie requise.</p>
              }
            </div>
            <div>
              <label class="form-label">Champ</label>
              <select formControlName="champ_id" class="form-input">
                <option value="">Aucun</option>
                @for (champ of champs(); track champ.id) {
                  <option [value]="champ.id">{{ champ.nom }}</option>
                }
              </select>
            </div>
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" (click)="ferme.emit()" class="btn-secondary flex-1 h-10 text-sm">Annuler</button>
            <button type="submit" [disabled]="saving() || form.invalid" class="btn-primary flex-1 h-10 text-sm">
              {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class DepenseFormComponent {
  depense    = input<any>(null);
  champs     = input<any[]>([]);
  categories = input<any[]>([]);

  ferme      = output<void>();
  sauvegarde = output<void>();

  private api   = inject(ApiService);
  private notif = inject(NotificationService);
  private fb    = inject(FormBuilder);

  saving = signal(false);

  form = this.fb.group({
    description:  ['', Validators.required],
    montant_fcfa: [null as number | null, [Validators.required, Validators.min(0)]],
    date_depense: [new Date().toISOString().split('T')[0], Validators.required],
    categorie:    ['', Validators.required],
    champ_id:     [null as number | null],
  });

  constructor() {
    effect(() => {
      const d = this.depense();
      if (d) {
        this.form.patchValue({
          description:  d.description,
          montant_fcfa: d.montant_fcfa,
          date_depense: d.date_depense?.split('T')[0] ?? d.date_depense,
          categorie:    d.categorie,
          champ_id:     d.champ_id,
        });
      } else {
        this.form.reset({ date_depense: new Date().toISOString().split('T')[0] });
      }
    });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const payload = { ...this.form.value, champ_id: this.form.value.champ_id || null };
    const d = this.depense();
    const req = d
      ? this.api.put(`/api/depenses/${d.id}`, payload)
      : this.api.post('/api/depenses', payload);

    req.subscribe({
      next: res => {
        if ((res as any)?._offline) {
          this.notif.success('Dépense enregistrée hors ligne — sera envoyée automatiquement à la reconnexion.');
          this.saving.set(false);
          this.sauvegarde.emit();
          return;
        }
        this.notif.success(d ? 'Dépense modifiée.' : 'Dépense ajoutée.');
        this.saving.set(false);
        this.sauvegarde.emit();
      },
      error: err => {
        this.saving.set(false);
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
}

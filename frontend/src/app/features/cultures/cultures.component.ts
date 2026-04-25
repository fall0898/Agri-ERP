import { Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';
import { MediaGalleryComponent } from '../../shared/media-gallery/media-gallery.component';

// Statuts exacts du backend
const STATUT_LABELS: Record<string, string> = {
  en_cours: 'En cours', recolte: 'Récoltée', termine: 'Terminée', abandonne: 'Abandonnée',
};
const STATUT_COLORS: Record<string, string> = {
  en_cours: 'bg-green-100 text-green-700',
  recolte: 'bg-amber-100 text-amber-700',
  termine: 'bg-blue-100 text-blue-700',
  abandonne: 'bg-red-100 text-red-700',
};

@Component({
  selector: 'app-cultures',
  standalone: true,
  imports: [ReactiveFormsModule, DateFrPipe, MediaGalleryComponent],
  template: `
    <div class="pg-wrap space-y-6">

      <div class="flex items-center justify-between">
        <div>
          <h1>Cultures</h1>
          <p class="pg-sub">Suivez vos cycles culturaux</p>
        </div>
        @if (auth.isAdmin()) {
          <button (click)="openModal()" class="btn-primary h-9 px-4 text-sm">+ Nouvelle culture</button>
        }
      </div>

      <!-- Filtre statut -->
      <div class="flex gap-2 flex-wrap">
        @for (s of statutOptions; track s.value) {
          <button (click)="filterStatut.set(s.value)"
                  class="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                  [class.bg-primary-500]="filterStatut() === s.value"
                  [class.text-white]="filterStatut() === s.value"
                  [class.border-primary-500]="filterStatut() === s.value"
                  [class.bg-white]="filterStatut() !== s.value"
                  [class.text-neutral-600]="filterStatut() !== s.value"
                  [class.border-neutral-200]="filterStatut() !== s.value">
            {{ s.label }}
          </button>
        }
      </div>

      <!-- Liste -->
      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) {
            <div class="card animate-pulse h-20 bg-neutral-100"></div>
          }
        </div>
      } @else if (filtered().length) {
        <div class="space-y-3">
          @for (culture of filtered(); track culture.id) {
            <div class="card flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center text-2xl flex-shrink-0">🌱</div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <h3 class="font-semibold text-neutral-900">{{ culture.nom }}</h3>
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium" [class]="statutColor(culture.statut)">
                    {{ statutLabel(culture.statut) }}
                  </span>
                </div>
                <p class="text-sm text-neutral-500">
                  {{ culture.champ?.nom ?? 'Champ non défini' }}
                  · {{ culture.saison === 'normale' ? 'Saison normale' : 'Contre-saison' }} {{ culture.annee }}
                  @if (culture.date_semis) { · Semis : {{ culture.date_semis | dateFr }} }
                  @if (culture.superficie_cultivee_ha) { · {{ formatHa(culture.superficie_cultivee_ha) }} ha }
                </p>
              </div>
              <div class="flex gap-2">
                <button (click)="openMedias(culture)" class="p-2 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Photos & Vidéos">📷</button>
                @if (auth.isAdmin()) {
                  <button (click)="openModal(culture)" class="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">✏️</button>
                  <button (click)="delete(culture)" class="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">🗑️</button>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="card text-center py-16">
          <div class="text-5xl mb-4">🌱</div>
          <h3 class="font-semibold text-neutral-900 mb-2">Aucune culture trouvée</h3>
          <p class="text-neutral-500 text-sm">{{ filterStatut() !== 'all' ? 'Aucune culture avec ce statut.' : 'Commencez par enregistrer vos cultures.' }}</p>
        </div>
      }

      <!-- Modal médias -->
      @if (selectedCultureForMedia()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeMedias()">
          <div class="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0">
              <div>
                <h2 class="font-semibold text-neutral-900">{{ selectedCultureForMedia().nom }}</h2>
                <p class="text-xs text-neutral-400 mt-0.5">Suivi photo &amp; vidéo</p>
              </div>
              <button (click)="closeMedias()" class="text-neutral-400 hover:text-neutral-600 text-xl">&times;</button>
            </div>
            <div class="p-6 overflow-y-auto">
              <app-media-gallery
                entityType="culture"
                [entityId]="selectedCultureForMedia().id"
                [canEdit]="auth.isAdmin()">
              </app-media-gallery>
            </div>
          </div>
        </div>
      }

      <!-- Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeModal()">
          <div class="modal-panel max-w-lg w-full" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0">
              <h2 class="font-semibold text-neutral-900">{{ editing() ? 'Modifier la culture' : 'Nouvelle culture' }}</h2>
              <button (click)="closeModal()" class="text-neutral-400 hover:text-neutral-600 text-xl">&times;</button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()" class="flex flex-col flex-1 overflow-hidden">
              <div class="overflow-y-auto flex-1 p-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div class="sm:col-span-2">
                    <label class="form-label">Nom de la culture *</label>
                    <input type="text" formControlName="nom" class="form-input" placeholder="ex: Mil, Maïs, Tomate..."/>
                    @if (form.get('nom')?.invalid && form.get('nom')?.touched) {
                      <p class="form-error">Nom requis.</p>
                    }
                  </div>
                  <div>
                    <label class="form-label">Champ *</label>
                    <select formControlName="champ_id" class="form-input">
                      <option value="">Sélectionner...</option>
                      @for (champ of champs(); track champ.id) {
                        <option [value]="champ.id">{{ champ.nom }}</option>
                      }
                    </select>
                    @if (form.get('champ_id')?.invalid && form.get('champ_id')?.touched) {
                      <p class="form-error">Champ requis.</p>
                    }
                  </div>
                  <div>
                    <label class="form-label">Statut</label>
                    <select formControlName="statut" class="form-input">
                      <option value="en_cours">En cours</option>
                      <option value="recolte">Récoltée</option>
                      <option value="termine">Terminée</option>
                      <option value="abandonne">Abandonnée</option>
                    </select>
                  </div>
                  <div>
                    <label class="form-label">Saison *</label>
                    <select formControlName="saison" class="form-input">
                      <option value="normale">Saison normale</option>
                      <option value="contre_saison">Contre-saison</option>
                    </select>
                  </div>
                  <div>
                    <label class="form-label">Année *</label>
                    <input type="number" formControlName="annee" class="form-input" [min]="2000" [max]="2100"/>
                    @if (form.get('annee')?.invalid && form.get('annee')?.touched) {
                      <p class="form-error">Année requise.</p>
                    }
                  </div>
                  <div>
                    <label class="form-label">Date de semis</label>
                    <input type="date" formControlName="date_semis" class="form-input"/>
                  </div>
                  <div>
                    <label class="form-label">Date récolte prévue</label>
                    <input type="date" formControlName="date_recolte_prevue" class="form-input"/>
                  </div>
                  <div>
                    <label class="form-label">Superficie cultivée (ha)</label>
                    <input type="number" step="0.01" formControlName="superficie_cultivee_ha" class="form-input"/>
                  </div>
                  <div>
                    <label class="form-label">Variété</label>
                    <input type="text" formControlName="variete" class="form-input" placeholder="ex: Souna III"/>
                  </div>
                </div>
              </div>
              <div class="shrink-0 px-6 py-4 flex flex-col-reverse sm:flex-row gap-3" style="border-top:1px solid #f0efee;">
                <button type="button" (click)="closeModal()" class="btn-secondary h-11 text-sm sm:flex-1">Annuler</button>
                <button type="submit" [disabled]="saving() || form.invalid" class="btn-primary h-11 text-sm sm:flex-1">
                  {{ saving() ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class CulturesComponent implements OnInit {
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editing = signal<any>(null);
  cultures = signal<any[]>([]);
  champs = signal<any[]>([]);
  filterStatut = signal('all');
  selectedCultureForMedia = signal<any>(null);

  statutOptions = [
    { value: 'all', label: 'Toutes' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'recolte', label: 'Récoltées' },
    { value: 'termine', label: 'Terminées' },
    { value: 'abandonne', label: 'Abandonnées' },
  ];

  filtered = () => {
    const s = this.filterStatut();
    return s === 'all' ? this.cultures() : this.cultures().filter(c => c.statut === s);
  };

  statutLabel = (s: string) => STATUT_LABELS[s] ?? s;
  statutColor = (s: string) => STATUT_COLORS[s] ?? 'bg-neutral-100 text-neutral-600';

  form = this.fb.group({
    nom: ['', Validators.required],
    champ_id: ['', Validators.required],
    statut: ['en_cours'],
    saison: ['normale', Validators.required],
    annee: [new Date().getFullYear(), [Validators.required, Validators.min(2000), Validators.max(2100)]],
    date_semis: [''],
    date_recolte_prevue: [''],
    superficie_cultivee_ha: [null as number | null],
    variete: [''],
  });

  ngOnInit(): void {
    this.load();
    this.api.get<any>('/api/champs').subscribe({
      next: res => this.champs.set(res.data ?? []),
    });
  }

  load(): void {
    this.loading.set(true);
    this.api.get<any>('/api/cultures').subscribe({
      next: res => {
        this.cultures.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openModal(culture?: any): void {
    this.editing.set(culture ?? null);
    if (culture) {
      this.form.patchValue({
        nom: culture.nom,
        champ_id: culture.champ_id,
        statut: culture.statut,
        saison: culture.saison,
        annee: culture.annee,
        date_semis: culture.date_semis?.split('T')[0] ?? culture.date_semis ?? '',
        date_recolte_prevue: culture.date_recolte_prevue?.split('T')[0] ?? culture.date_recolte_prevue ?? '',
        superficie_cultivee_ha: culture.superficie_cultivee_ha,
        variete: culture.variete,
      });
    } else {
      this.form.reset({ statut: 'en_cours', saison: 'normale', annee: new Date().getFullYear() });
    }
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editing.set(null); this.form.reset(); }

  openMedias(culture: any): void { this.selectedCultureForMedia.set(culture); }
  closeMedias(): void { this.selectedCultureForMedia.set(null); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const payload: any = { ...this.form.value };
    // Nettoyer les champs vides
    if (!payload.date_semis) delete payload.date_semis;
    if (!payload.date_recolte_prevue) delete payload.date_recolte_prevue;
    if (!payload.superficie_cultivee_ha) delete payload.superficie_cultivee_ha;
    if (!payload.variete) delete payload.variete;

    const req = this.editing()
      ? this.api.put(`/api/cultures/${this.editing().id}`, payload)
      : this.api.post('/api/cultures', payload);

    req.subscribe({
      next: () => {
        this.notif.success(this.editing() ? 'Culture modifiée.' : 'Culture créée.');
        this.saving.set(false);
        this.closeModal();
        this.load();
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

  formatHa(val: any): string {
    const n = parseFloat(val);
    if (isNaN(n)) return '0';
    return n % 1 === 0 ? n.toString() : parseFloat(n.toFixed(1)).toString();
  }

  delete(c: any): void {
    if (!confirm(`Supprimer la culture "${c.nom}" ?`)) return;
    this.api.delete(`/api/cultures/${c.id}`).subscribe({
      next: () => { this.notif.success('Culture supprimée.'); this.load(); },
      error: err => this.notif.error(err.error?.message || 'Erreur.'),
    });
  }
}

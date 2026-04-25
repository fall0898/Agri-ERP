import { Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { MediaGalleryComponent } from '../../shared/media-gallery/media-gallery.component';

@Component({
  selector: 'app-champs',
  standalone: true,
  imports: [ReactiveFormsModule, MediaGalleryComponent],
  template: `
    <div class="pg-wrap space-y-6">

      <div class="flex items-center justify-between">
        <div>
          <h1>Mes champs</h1>
          <p class="pg-sub">Gérez vos parcelles agricoles</p>
        </div>
        @if (auth.isAdmin()) {
          <button (click)="openModal()" class="btn-primary h-9 px-4 text-sm">+ Nouveau champ</button>
        }
      </div>

      <!-- Grille des champs -->
      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (i of [1,2,3]; track i) {
            <div class="card animate-pulse h-40 bg-neutral-100"></div>
          }
        </div>
      } @else if (champs().length) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (champ of champs(); track champ.id) {
            <div class="card hover:border-primary-300 transition-colors">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h3 class="font-semibold text-neutral-900">{{ champ.nom }}</h3>
                  <p class="text-sm text-neutral-500 mt-0.5">{{ formatHa(champ.superficie_ha) }} ha</p>
                </div>
                <span class="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center text-xl">🗺️</span>
              </div>
              <div class="grid grid-cols-2 gap-3 mb-4">
                <div class="bg-neutral-50 rounded-lg p-3">
                  <div class="text-xs text-neutral-400 mb-0.5">Cultures actives</div>
                  <div class="font-semibold text-neutral-900">{{ champ.cultures_count ?? 0 }}</div>
                </div>
                <div class="bg-neutral-50 rounded-lg p-3">
                  <div class="text-xs text-neutral-400 mb-0.5">Statut</div>
                  <div class="font-semibold text-neutral-900 text-xs">{{ champ.est_actif ? 'Actif' : 'Inactif' }}</div>
                </div>
              </div>
              @if (champ.localisation) {
                <p class="text-xs text-neutral-400 mb-3">📍 {{ champ.localisation }}</p>
              }
              <div class="flex gap-2">
                <button (click)="openMedias(champ)" class="flex-1 text-xs py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 font-medium transition-colors">
                  📷 Médias
                </button>
                @if (auth.isAdmin()) {
                  <button (click)="openModal(champ)" class="flex-1 text-xs py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium transition-colors">
                    Modifier
                  </button>
                  <button (click)="delete(champ)" class="flex-1 text-xs py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors">
                    Supprimer
                  </button>
                }
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="card text-center py-16">
          <div class="text-5xl mb-4">🗺️</div>
          <h3 class="font-semibold text-neutral-900 mb-2">Aucun champ enregistré</h3>
          <p class="text-neutral-500 text-sm mb-6">Commencez par ajouter votre première parcelle agricole.</p>
          @if (auth.isAdmin()) {
            <button (click)="openModal()" class="btn-primary h-9 px-6 text-sm">+ Ajouter un champ</button>
          }
        </div>
      }

      <!-- Modal médias -->
      @if (selectedChampForMedia()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeMedias()">
          <div class="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-neutral-100 shrink-0">
              <div>
                <h2 class="font-semibold text-neutral-900">{{ selectedChampForMedia().nom }}</h2>
                <p class="text-xs text-neutral-400 mt-0.5">Suivi photo &amp; vidéo</p>
              </div>
              <button (click)="closeMedias()" class="text-neutral-400 hover:text-neutral-600 text-xl">&times;</button>
            </div>
            <div class="p-6 overflow-y-auto">
              <app-media-gallery
                entityType="champ"
                [entityId]="selectedChampForMedia().id"
                [canEdit]="auth.isAdmin()">
              </app-media-gallery>
            </div>
          </div>
        </div>
      }

      <!-- Modal -->
      @if (showModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeModal()">
          <div class="bg-white rounded-2xl w-full max-w-lg shadow-xl" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-neutral-100">
              <h2 class="font-semibold text-neutral-900">{{ editing() ? 'Modifier le champ' : 'Nouveau champ' }}</h2>
              <button (click)="closeModal()" class="text-neutral-400 hover:text-neutral-600 text-xl">&times;</button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()" class="p-6 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="form-label">Nom du champ *</label>
                  <input type="text" formControlName="nom" class="form-input" placeholder="ex: Parcelle Nord"/>
                  @if (form.get('nom')?.invalid && form.get('nom')?.touched) {
                    <p class="form-error">Nom requis.</p>
                  }
                </div>
                <div>
                  <label class="form-label">Superficie (ha) *</label>
                  <input type="number" step="0.01" formControlName="superficie_ha" class="form-input" placeholder="2.5"/>
                  @if (form.get('superficie_ha')?.invalid && form.get('superficie_ha')?.touched) {
                    <p class="form-error">Superficie requise.</p>
                  }
                </div>
                <div>
                  <label class="form-label">Localisation / GPS</label>
                  <input type="text" formControlName="localisation" class="form-input" placeholder="ex: Kaolack Nord"/>
                </div>
                <div class="col-span-2">
                  <label class="form-label">Description</label>
                  <textarea formControlName="description" class="form-input h-20 resize-none" placeholder="Observations, historique..."></textarea>
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
    </div>
  `,
})
export class ChampsComponent implements OnInit {
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editing = signal<any>(null);
  champs = signal<any[]>([]);
  selectedChampForMedia = signal<any>(null);

  form = this.fb.group({
    nom: ['', Validators.required],
    superficie_ha: [null as number | null, [Validators.required, Validators.min(0)]],
    localisation: [''],
    description: [''],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.get<any>('/api/champs').subscribe({
      next: res => {
        this.champs.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openModal(champ?: any): void {
    this.editing.set(champ ?? null);
    if (champ) {
      this.form.patchValue({
        nom: champ.nom,
        superficie_ha: champ.superficie_ha,
        localisation: champ.localisation,
        description: champ.description,
      });
    } else {
      this.form.reset();
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editing.set(null);
    this.form.reset();
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const payload = this.form.value;
    const req = this.editing()
      ? this.api.put(`/api/champs/${this.editing().id}`, payload)
      : this.api.post('/api/champs', payload);

    req.subscribe({
      next: () => {
        this.notif.success(this.editing() ? 'Champ modifié.' : 'Champ créé.');
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
          this.notif.error(err.error?.message || 'Erreur lors de l\'enregistrement.');
        }
      },
    });
  }

  formatHa(val: any): string {
    const n = parseFloat(val);
    if (isNaN(n)) return '0';
    return n % 1 === 0 ? n.toString() : parseFloat(n.toFixed(1)).toString();
  }

  openMedias(champ: any): void { this.selectedChampForMedia.set(champ); }
  closeMedias(): void { this.selectedChampForMedia.set(null); }

  delete(champ: any): void {
    if (!confirm(`Supprimer le champ "${champ.nom}" ?`)) return;
    this.api.delete(`/api/champs/${champ.id}`).subscribe({
      next: () => { this.notif.success('Champ supprimé.'); this.load(); },
      error: err => this.notif.error(err.error?.message || 'Erreur lors de la suppression.'),
    });
  }
}

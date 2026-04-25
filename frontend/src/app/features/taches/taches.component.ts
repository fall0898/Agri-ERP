import { Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';

// Statuts exacts du backend : a_faire, en_cours, termine, annule
const STATUT_LABELS: Record<string, string> = {
  a_faire: 'À faire', en_cours: 'En cours', termine: 'Terminée', annule: 'Annulée',
};

@Component({
  selector: 'app-taches',
  standalone: true,
  imports: [ReactiveFormsModule, DateFrPipe],
  template: `
    <div class="pg-wrap space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1>Tâches</h1>
          <p class="pg-sub">Planifiez et suivez vos activités agricoles</p>
        </div>
        @if (auth.isAdmin()) {
          <button (click)="openModal()" class="btn-primary h-9 px-4 text-sm">+ Nouvelle tâche</button>
        }
      </div>

      <!-- Filtres statut -->
      <div class="flex gap-2 flex-wrap">
        @for (s of statutOptions; track s.value) {
          <button (click)="filterStatut.set(s.value)"
                  class="text-xs font-medium px-3 py-1.5 rounded-full border transition-colors"
                  [class.bg-primary-500]="filterStatut() === s.value" [class.text-white]="filterStatut() === s.value"
                  [class.border-primary-500]="filterStatut() === s.value" [class.bg-white]="filterStatut() !== s.value"
                  [class.text-neutral-600]="filterStatut() !== s.value" [class.border-neutral-200]="filterStatut() !== s.value">
            {{ s.label }}
          </button>
        }
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3]; track i) { <div class="card animate-pulse h-20 bg-neutral-100"></div> }
        </div>
      } @else if (filtered().length) {
        <div class="space-y-3">
          @for (tache of filtered(); track tache.id) {
            <div class="card flex items-center gap-4">
              @if (auth.isAdmin()) {
                <button (click)="toggleStatut(tache)"
                        class="w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors"
                        [class.border-primary-500]="tache.statut !== 'termine'"
                        [class.bg-primary-500]="tache.statut === 'termine'"
                        [class.border-green-500]="tache.statut === 'termine'">
                  @if (tache.statut === 'termine') { <span class="text-white text-xs">✓</span> }
                </button>
              }
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-0.5">
                  <h3 class="font-medium text-neutral-900 truncate"
                      [class.line-through]="tache.statut === 'termine'"
                      [class.text-neutral-400]="tache.statut === 'termine'">
                    {{ tache.titre }}
                  </h3>
                  <span class="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                        [class.bg-red-100]="tache.priorite === 'urgente' || tache.priorite === 'haute'"
                        [class.text-red-700]="tache.priorite === 'urgente' || tache.priorite === 'haute'"
                        [class.bg-amber-100]="tache.priorite === 'normale'"
                        [class.text-amber-700]="tache.priorite === 'normale'"
                        [class.bg-green-100]="tache.priorite === 'basse'"
                        [class.text-green-700]="tache.priorite === 'basse'">
                    {{ tache.priorite }}
                  </span>
                </div>
                <p class="text-xs text-neutral-400">
                  {{ tache.champ?.nom ?? 'Sans champ' }}
                  @if (tache.employe) { · {{ tache.employe.nom }} }
                  @if (tache.date_debut) { · Début : {{ tache.date_debut | dateFr }} }
                  @if (tache.date_fin) { · Fin : {{ tache.date_fin | dateFr }} }
                </p>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full hidden md:inline-flex"
                    [class.bg-blue-100]="tache.statut === 'a_faire'"
                    [class.text-blue-700]="tache.statut === 'a_faire'"
                    [class.bg-amber-100]="tache.statut === 'en_cours'"
                    [class.text-amber-700]="tache.statut === 'en_cours'"
                    [class.bg-green-100]="tache.statut === 'termine'"
                    [class.text-green-700]="tache.statut === 'termine'"
                    [class.bg-neutral-100]="tache.statut === 'annule'"
                    [class.text-neutral-600]="tache.statut === 'annule'">
                {{ statutLabel(tache.statut) }}
              </span>
              @if (auth.isAdmin()) {
                <div class="flex gap-1">
                  <button (click)="openModal(tache)" class="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">✏️</button>
                  <button (click)="delete(tache)" class="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">🗑️</button>
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="card text-center py-16">
          <div class="text-5xl mb-4">✅</div>
          <h3 class="font-semibold text-neutral-900 mb-2">Aucune tâche trouvée</h3>
          <p class="text-neutral-500 text-sm">{{ filterStatut() !== 'all' ? 'Aucune tâche avec ce statut.' : 'Planifiez vos activités agricoles.' }}</p>
        </div>
      }

      @if (showModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeModal()">
          <div class="bg-white rounded-2xl w-full max-w-lg shadow-xl" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-neutral-100">
              <h2 class="font-semibold text-neutral-900">{{ editing() ? 'Modifier la tâche' : 'Nouvelle tâche' }}</h2>
              <button (click)="closeModal()" class="text-neutral-400 text-xl">&times;</button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()" class="p-6 space-y-4">
              <div>
                <label class="form-label">Titre *</label>
                <input type="text" formControlName="titre" class="form-input" placeholder="ex: Fertilisation Parcelle Nord"/>
                @if (form.get('titre')?.invalid && form.get('titre')?.touched) {
                  <p class="form-error">Titre requis.</p>
                }
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Assigné à *</label>
                  <select formControlName="employe_id" class="form-input">
                    <option value="">Sélectionner...</option>
                    @for (emp of employes(); track emp.id) {
                      <option [value]="emp.id">{{ emp.nom }}</option>
                    }
                  </select>
                  @if (form.get('employe_id')?.invalid && form.get('employe_id')?.touched) {
                    <p class="form-error">Assignation requise.</p>
                  }
                </div>
                <div>
                  <label class="form-label">Champ</label>
                  <select formControlName="champ_id" class="form-input">
                    <option value="">Aucun</option>
                    @for (champ of champs(); track champ.id) { <option [value]="champ.id">{{ champ.nom }}</option> }
                  </select>
                </div>
                <div>
                  <label class="form-label">Priorité</label>
                  <select formControlName="priorite" class="form-input">
                    <option value="basse">Basse</option>
                    <option value="normale">Normale</option>
                    <option value="haute">Haute</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">Statut</label>
                  <select formControlName="statut" class="form-input">
                    <option value="a_faire">À faire</option>
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminée</option>
                    <option value="annule">Annulée</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">Date de début *</label>
                  <input type="date" formControlName="date_debut" class="form-input"/>
                  @if (form.get('date_debut')?.invalid && form.get('date_debut')?.touched) {
                    <p class="form-error">Date de début requise.</p>
                  }
                </div>
                <div>
                  <label class="form-label">Date de fin</label>
                  <input type="date" formControlName="date_fin" class="form-input"/>
                </div>
              </div>
              <div>
                <label class="form-label">Description</label>
                <textarea formControlName="description" class="form-input h-20 resize-none"></textarea>
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
export class TachesComponent implements OnInit {
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editing = signal<any>(null);
  taches = signal<any[]>([]);
  champs = signal<any[]>([]);
  employes = signal<any[]>([]);
  filterStatut = signal('all');

  statutOptions = [
    { value: 'all', label: 'Toutes' },
    { value: 'a_faire', label: 'À faire' },
    { value: 'en_cours', label: 'En cours' },
    { value: 'termine', label: 'Terminées' },
    { value: 'annule', label: 'Annulées' },
  ];

  filtered = () => {
    const s = this.filterStatut();
    return s === 'all' ? this.taches() : this.taches().filter(t => t.statut === s);
  };

  statutLabel = (s: string) => STATUT_LABELS[s] ?? s;

  form = this.fb.group({
    titre: ['', Validators.required],
    employe_id: ['', Validators.required],
    champ_id: [null as number | null],
    priorite: ['normale'],
    statut: ['a_faire'],
    date_debut: [new Date().toISOString().split('T')[0], Validators.required],
    date_fin: [''],
    description: [''],
  });

  ngOnInit(): void {
    this.load();
    this.api.get<any>('/api/champs').subscribe({
      next: res => this.champs.set(res.data ?? []),
    });
    this.api.get<any>('/api/employes').subscribe({
      next: res => this.employes.set(res.data ?? []),
    });
  }

  load(): void {
    this.loading.set(true);
    this.api.get<any>('/api/taches').subscribe({
      next: res => {
        this.taches.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  toggleStatut(tache: any): void {
    const newStatut = tache.statut === 'termine' ? 'a_faire' : 'termine';
    this.api.patch(`/api/taches/${tache.id}/statut`, { statut: newStatut }).subscribe({
      next: () => { tache.statut = newStatut; this.taches.update(t => [...t]); },
      error: () => this.notif.error('Erreur lors de la mise à jour.'),
    });
  }

  openModal(tache?: any): void {
    this.editing.set(tache ?? null);
    if (tache) {
      this.form.patchValue({
        titre: tache.titre,
        employe_id: tache.employe_id,
        champ_id: tache.champ_id,
        priorite: tache.priorite,
        statut: tache.statut,
        date_debut: tache.date_debut?.split('T')[0] ?? tache.date_debut,
        date_fin: tache.date_fin?.split('T')[0] ?? tache.date_fin ?? '',
        description: tache.description,
      });
    } else {
      this.form.reset({
        priorite: 'normale',
        statut: 'a_faire',
        date_debut: new Date().toISOString().split('T')[0],
      });
    }
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editing.set(null); this.form.reset(); }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const payload: any = { ...this.form.value };
    if (!payload.champ_id) delete payload.champ_id;
    if (!payload.date_fin) delete payload.date_fin;
    if (!payload.description) delete payload.description;

    const req = this.editing()
      ? this.api.put(`/api/taches/${this.editing().id}`, payload)
      : this.api.post('/api/taches', payload);

    req.subscribe({
      next: () => {
        this.notif.success(this.editing() ? 'Tâche modifiée.' : 'Tâche créée.');
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

  delete(t: any): void {
    if (!confirm('Supprimer cette tâche ?')) return;
    this.api.delete(`/api/taches/${t.id}`).subscribe({
      next: () => { this.notif.success('Tâche supprimée.'); this.load(); },
      error: err => this.notif.error(err.error?.message || 'Erreur.'),
    });
  }
}

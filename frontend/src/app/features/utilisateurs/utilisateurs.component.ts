import { Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [ReactiveFormsModule, DateFrPipe],
  template: `
    <div class="pg-wrap space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1>Utilisateurs</h1>
          <p class="pg-sub">Gérez les accès à votre exploitation</p>
        </div>
        <button (click)="openModal()" class="btn-primary h-9 px-4 text-sm">+ Inviter un utilisateur</button>
      </div>

      @if (loading()) {
        <div class="card animate-pulse h-48 bg-neutral-100"></div>
      } @else if (users().length) {
        <div class="card overflow-hidden p-0">
          <table class="w-full">
            <thead class="bg-neutral-50 border-b border-neutral-100">
              <tr>
                <th class="text-left text-xs font-medium text-neutral-500 uppercase px-6 py-3">Utilisateur</th>
                @if (auth.isSuperAdmin()) {
                  <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Exploitation</th>
                }
                <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Rôle</th>
                <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Statut</th>
                <th class="text-left text-xs font-medium text-neutral-500 uppercase px-4 py-3">Inscrit le</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50">
              @for (user of users(); track user.id) {
                <tr class="hover:bg-neutral-50/50">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                        {{ (user.prenom || user.nom || '?')[0].toUpperCase() }}
                      </div>
                      <div>
                        <div class="font-medium text-neutral-900">{{ user.prenom }} {{ user.nom }}</div>
                        <div class="text-xs text-neutral-400">{{ user.email }}</div>
                      </div>
                    </div>
                  </td>
                  @if (auth.isSuperAdmin()) {
                    <td class="px-4 py-4 text-sm text-neutral-600">{{ user.organisation?.nom ?? '—' }}</td>
                  }
                  <td class="px-4 py-4">
                    <span class="text-xs px-2 py-0.5 rounded-full capitalize"
                          [class.bg-red-100]="user.role === 'super_admin'"
                          [class.text-red-700]="user.role === 'super_admin'"
                          [class.bg-primary-100]="user.role === 'admin'"
                          [class.text-primary-700]="user.role === 'admin'"
                          [class.bg-neutral-100]="user.role === 'lecteur'"
                          [class.text-neutral-600]="user.role === 'lecteur'">
                      {{ roleLabel(user.role) }}
                    </span>
                  </td>
                  <td class="px-4 py-4">
                    <span class="text-xs px-2 py-0.5 rounded-full"
                          [class.bg-green-100]="user.est_actif" [class.text-green-700]="user.est_actif"
                          [class.bg-red-100]="!user.est_actif" [class.text-red-700]="!user.est_actif">
                      {{ user.est_actif ? 'Actif' : 'Inactif' }}
                    </span>
                  </td>
                  <td class="px-4 py-4 text-sm text-neutral-500">{{ user.created_at | dateFr }}</td>
                  <td class="px-4 py-4">
                    @if (user.id !== auth.user()?.id && user.role !== 'super_admin') {
                      <div class="flex gap-2 justify-end">
                        <button (click)="openModal(user)" class="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors">✏️</button>
                        <button (click)="toggleActive(user)" class="p-1.5 text-neutral-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors">
                          {{ user.est_actif ? '🔒' : '🔓' }}
                        </button>
                      </div>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      } @else {
        <div class="card text-center py-16">
          <div class="text-5xl mb-4">👥</div>
          <h3 class="font-semibold text-neutral-900 mb-2">Aucun utilisateur</h3>
        </div>
      }

      @if (showModal()) {
        <div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" (click)="closeModal()">
          <div class="bg-white rounded-2xl w-full max-w-md shadow-xl" (click)="$event.stopPropagation()">
            <div class="flex items-center justify-between p-6 border-b border-neutral-100">
              <h2 class="font-semibold text-neutral-900">{{ editing() ? "Modifier l'utilisateur" : "Inviter un utilisateur" }}</h2>
              <button (click)="closeModal()" class="text-neutral-400 text-xl">&times;</button>
            </div>
            <form [formGroup]="form" (ngSubmit)="save()" class="p-6 space-y-4">
              @if (!editing()) {
                <div>
                  <label class="form-label">Email *</label>
                  <input type="email" formControlName="email" class="form-input" placeholder="utilisateur@email.com"/>
                </div>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="form-label">Prénom *</label>
                    <input type="text" formControlName="prenom" class="form-input"/>
                  </div>
                  <div>
                    <label class="form-label">Nom *</label>
                    <input type="text" formControlName="nom" class="form-input"/>
                  </div>
                </div>
                <div>
                  <label class="form-label">Mot de passe *</label>
                  <input type="password" formControlName="password" class="form-input" placeholder="Min. 8 caractères"/>
                </div>
              }
              <div>
                <label class="form-label">Rôle</label>
                <select formControlName="role" class="form-input">
                  <option value="lecteur">Lecteur (lecture seule)</option>
                  <option value="admin">Administrateur (accès complet)</option>
                </select>
              </div>
              <div class="flex gap-3 pt-2">
                <button type="button" (click)="closeModal()" class="btn-secondary flex-1 h-10 text-sm">Annuler</button>
                <button type="submit" [disabled]="saving() || form.invalid" class="btn-primary flex-1 h-10 text-sm">
                  {{ saving() ? 'Enregistrement...' : (editing() ? 'Modifier' : 'Inviter') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
})
export class UtilisateursComponent implements OnInit {
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  editing = signal<any>(null);
  users = signal<any[]>([]);

  roleLabel = (r: string) => ({ super_admin: 'Super Admin', admin: 'Admin', lecteur: 'Lecteur' }[r] ?? r);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    prenom: ['', Validators.required],
    nom: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['lecteur'],
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.get<any>('/api/utilisateurs').subscribe({
      next: res => { this.users.set(Array.isArray(res) ? res : res.data ?? []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openModal(user?: any): void {
    this.editing.set(user ?? null);
    if (user) {
      this.form.get('email')?.disable();
      this.form.get('prenom')?.clearValidators();
      this.form.get('nom')?.clearValidators();
      this.form.get('password')?.clearValidators();
      this.form.patchValue({ role: user.role });
    } else {
      this.form.get('email')?.enable();
      this.form.get('prenom')?.setValidators(Validators.required);
      this.form.get('nom')?.setValidators(Validators.required);
      this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
      this.form.reset({ role: 'lecteur' });
    }
    this.form.updateValueAndValidity();
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editing.set(null); this.form.reset(); this.form.get('email')?.enable(); }

  save(): void {
    this.saving.set(true);
    const req = this.editing()
      ? this.api.put(`/api/utilisateurs/${this.editing().id}`, { role: this.form.value.role })
      : this.api.post('/api/utilisateurs', this.form.getRawValue());
    req.subscribe({
      next: () => { this.notif.success(this.editing() ? 'Utilisateur modifié.' : 'Utilisateur invité.'); this.saving.set(false); this.closeModal(); this.load(); },
      error: err => { this.saving.set(false); this.notif.error(err.error?.message || 'Erreur.'); },
    });
  }

  toggleActive(user: any): void {
    this.api.patch(`/api/utilisateurs/${user.id}`, { est_actif: !user.est_actif }).subscribe({
      next: () => { user.est_actif = !user.est_actif; this.users.update(u => [...u]); this.notif.success('Statut modifié.'); },
      error: err => this.notif.error(err.error?.message || 'Erreur.'),
    });
  }
}

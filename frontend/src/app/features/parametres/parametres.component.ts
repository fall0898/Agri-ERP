import { Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="pg-wrap space-y-6">
      <div>
        <h1>Paramètres</h1>
        <p class="pg-sub">Gérez votre profil et les paramètres de l'exploitation</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <!-- Sidebar nav -->
        <div class="card h-fit">
          <nav class="space-y-1">
            @for (tab of tabs; track tab.id) {
              <button (click)="activeTab.set(tab.id)"
                      class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
                      [class.bg-primary-50]="activeTab() === tab.id"
                      [class.text-primary-700]="activeTab() === tab.id"
                      [class.text-neutral-600]="activeTab() !== tab.id"
                      [class.hover:bg-neutral-50]="activeTab() !== tab.id">
                {{ tab.icon }} {{ tab.label }}
              </button>
            }
          </nav>
        </div>

        <!-- Content -->
        <div class="lg:col-span-2 card">

          @if (activeTab() === 'profil') {
            <h2 class="font-semibold text-neutral-900 mb-6">Mon profil</h2>
            <form [formGroup]="profilForm" (ngSubmit)="saveProfil()" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Prénom</label>
                  <input type="text" formControlName="prenom" class="form-input"/>
                </div>
                <div>
                  <label class="form-label">Nom</label>
                  <input type="text" formControlName="nom" class="form-input"/>
                </div>
              </div>
              <div>
                <label class="form-label">Email</label>
                <input type="email" formControlName="email" class="form-input" readonly/>
              </div>
              <div class="pt-2">
                <button type="submit" [disabled]="savingProfil()" class="btn-primary h-10 px-6 text-sm">
                  {{ savingProfil() ? 'Enregistrement...' : 'Sauvegarder' }}
                </button>
              </div>
            </form>
          }

          @if (activeTab() === 'motdepasse') {
            <h2 class="font-semibold text-neutral-900 mb-6">Changer le mot de passe</h2>
            <form [formGroup]="passwordForm" (ngSubmit)="savePassword()" class="space-y-4">
              <div>
                <label class="form-label">Mot de passe actuel</label>
                <input type="password" formControlName="current_password" class="form-input"/>
              </div>
              <div>
                <label class="form-label">Nouveau mot de passe</label>
                <input type="password" formControlName="password" class="form-input"/>
              </div>
              <div>
                <label class="form-label">Confirmer le nouveau mot de passe</label>
                <input type="password" formControlName="password_confirmation" class="form-input"/>
              </div>
              <div class="pt-2">
                <button type="submit" [disabled]="savingPassword() || passwordForm.invalid" class="btn-primary h-10 px-6 text-sm">
                  {{ savingPassword() ? 'Enregistrement...' : 'Changer le mot de passe' }}
                </button>
              </div>
            </form>
          }

          @if (activeTab() === 'organisation') {
            <h2 class="font-semibold text-neutral-900 mb-6">Informations de l'exploitation</h2>
            <form [formGroup]="orgForm" (ngSubmit)="saveOrg()" class="space-y-4">
              <div>
                <label class="form-label">Nom de l'exploitation</label>
                <input type="text" formControlName="nom" class="form-input"/>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="form-label">Pays</label>
                  <input type="text" formControlName="pays" class="form-input"/>
                </div>
                <div>
                  <label class="form-label">Région</label>
                  <input type="text" formControlName="region" class="form-input"/>
                </div>
                <div>
                  <label class="form-label">Superficie totale (ha)</label>
                  <input type="number" formControlName="superficie_totale" class="form-input"/>
                </div>
                <div>
                  <label class="form-label">Type d'agriculture</label>
                  <select formControlName="type_agriculture" class="form-input">
                    <option value="">Non précisé</option>
                    <option value="cereales">Céréales</option>
                    <option value="maraichage">Maraîchage</option>
                    <option value="arboriculture">Arboriculture</option>
                    <option value="elevage">Élevage</option>
                    <option value="mixte">Mixte</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="form-label">Téléphone</label>
                <input type="tel" formControlName="telephone" class="form-input"/>
              </div>
              <div class="pt-2">
                <button type="submit" [disabled]="savingOrg()" class="btn-primary h-10 px-6 text-sm">
                  {{ savingOrg() ? 'Enregistrement...' : 'Sauvegarder' }}
                </button>
              </div>
            </form>
          }

          @if (activeTab() === 'notifications') {
            <h2 class="font-semibold text-neutral-900 mb-6">Préférences de notification</h2>
            <div class="space-y-4">
              @for (pref of notifPrefs; track pref.key) {
                <div class="flex items-center justify-between py-3 border-b border-neutral-50 last:border-0">
                  <div>
                    <div class="font-medium text-neutral-900 text-sm">{{ pref.label }}</div>
                    <div class="text-xs text-neutral-400">{{ pref.desc }}</div>
                  </div>
                  <button (click)="togglePref(pref.key)"
                          class="relative w-11 h-6 rounded-full transition-colors"
                          [class.bg-primary-500]="prefEnabled(pref.key)"
                          [class.bg-neutral-200]="!prefEnabled(pref.key)">
                    <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                          [class.translate-x-5]="prefEnabled(pref.key)"></span>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class ParametresComponent implements OnInit {
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  activeTab = signal('profil');
  savingProfil = signal(false);
  savingPassword = signal(false);
  savingOrg = signal(false);
  prefs = signal<Record<string, boolean>>({});

  tabs = [
    { id: 'profil', label: 'Mon profil', icon: '👤' },
    { id: 'motdepasse', label: 'Mot de passe', icon: '🔒' },
    { id: 'organisation', label: 'Exploitation', icon: '🌾' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
  ];

  notifPrefs = [
    { key: 'stock_bas', label: 'Alertes stock bas', desc: 'Notifié quand un stock passe sous le seuil d\'alerte' },
    { key: 'tache_echeance', label: 'Échéances de tâches', desc: 'Rappel avant la date d\'échéance d\'une tâche' },
    { key: 'paiement_salaire', label: 'Paiements de salaires', desc: 'Confirmation des paiements effectués' },
    { key: 'finance', label: 'Résumé financier', desc: 'Résumé financier mensuel automatique' },
  ];

  profilForm = this.fb.group({
    prenom: [''],
    nom: [''],
    email: [{ value: '', disabled: true }],
  });

  passwordForm = this.fb.group({
    current_password: ['', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required],
  });

  orgForm = this.fb.group({
    nom: [''],
    pays: [''],
    region: [''],
    superficie_totale: [null],
    type_agriculture: [''],
    telephone: [''],
  });

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.profilForm.patchValue({ prenom: user.prenom, nom: user.nom, email: user.email });
    }
    const org = user?.organisation;
    if (org) {
      this.orgForm.patchValue(org as any);
    }
    const savedPrefs = user?.preferences_notification as any;
    if (savedPrefs) this.prefs.set(savedPrefs);
  }

  prefEnabled = (key: string) => this.prefs()[key] !== false;

  togglePref(key: string): void {
    this.prefs.update(p => ({ ...p, [key]: !this.prefEnabled(key) }));
    this.api.patch('/api/profil', { preferences_notification: this.prefs() }).subscribe();
  }

  saveProfil(): void {
    this.savingProfil.set(true);
    this.api.put('/api/profil', this.profilForm.getRawValue()).subscribe({
      next: () => {
        this.notif.success('Profil mis à jour.');
        this.savingProfil.set(false);
        this.auth.refreshUser().subscribe();
      },
      error: err => { this.savingProfil.set(false); this.notif.error(err.error?.message || 'Erreur.'); },
    });
  }

  savePassword(): void {
    this.savingPassword.set(true);
    this.api.put('/api/profil/mot-de-passe', this.passwordForm.value).subscribe({
      next: () => { this.notif.success('Mot de passe modifié.'); this.savingPassword.set(false); this.passwordForm.reset(); },
      error: err => { this.savingPassword.set(false); this.notif.error(err.error?.message || 'Erreur.'); },
    });
  }

  saveOrg(): void {
    this.savingOrg.set(true);
    this.api.put('/api/organisation', this.orgForm.value).subscribe({
      next: () => { this.notif.success('Exploitation mise à jour.'); this.savingOrg.set(false); this.auth.refreshUser().subscribe(); },
      error: err => { this.savingOrg.set(false); this.notif.error(err.error?.message || 'Erreur.'); },
    });
  }
}

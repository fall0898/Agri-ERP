import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

function passwordMatch(control: AbstractControl) {
  const pwd = control.get('password')?.value;
  const confirm = control.get('password_confirmation')?.value;
  if (pwd && confirm && pwd !== confirm) {
    control.get('password_confirmation')?.setErrors({ mismatch: true });
  } else {
    const err = control.get('password_confirmation')?.errors;
    if (err) { delete err['mismatch']; control.get('password_confirmation')?.setErrors(Object.keys(err).length ? err : null); }
  }
  return null;
}

// Valide les numéros West Africa : 8-9 chiffres après suppression du préfixe pays
const phoneValidator: ValidatorFn = (control: AbstractControl) => {
  const raw = (control.value || '').replace(/[\s\-\.\(\)]/g, '');
  const local = raw.replace(/^(\+?221|00221)/, '');
  return /^[0-9]{8,9}$/.test(local) ? null : { invalidPhone: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex bg-neutral-50">

      <!-- Left panel — image de fond -->
      <div class="hidden lg:flex lg:flex-1 relative items-end p-12 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=85&fit=crop&crop=center"
          alt="Agriculture africaine"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/50 to-primary-900/30"></div>

        <div class="relative z-10 max-w-md">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span class="text-white font-bold">K</span>
            </div>
            <span class="text-xl font-bold text-white">Agri-ERP</span>
          </div>
          <h2 class="text-2xl font-bold text-white mb-3 leading-snug">
            Rejoignez 500+ agriculteurs<br>qui pilotent leur exploitation
          </h2>
          <p class="text-neutral-300 text-sm mb-6">7 jours d'essai gratuit. Paiement mobile via Orange Money ou Wave après la période d'essai.</p>
          <div class="space-y-3">
            @for (av of avantages; track av.text) {
              <div class="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <span class="text-xl">{{ av.icon }}</span>
                <div>
                  <div class="text-white font-medium text-sm">{{ av.text }}</div>
                  <div class="text-neutral-400 text-xs">{{ av.sub }}</div>
                </div>
              </div>
            }
          </div>
          <div class="mt-6 bg-primary-500/20 backdrop-blur-sm rounded-xl p-4 border border-primary-400/30">
            <div class="text-primary-200 text-xs font-medium mb-1">💡 Tarif transparent</div>
            <div class="text-white font-bold">10 000 FCFA / mois · Orange Money & Wave</div>
          </div>
        </div>
      </div>

      <!-- Right panel -->
      <div class="flex-1 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div class="w-full max-w-md">

          <div class="lg:hidden flex items-center gap-2 mb-8">
            <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span class="text-white font-bold">K</span>
            </div>
            <span class="text-xl font-bold text-neutral-900">Agri-ERP</span>
          </div>

          <div class="mb-8">
            <h2 class="text-2xl font-bold text-neutral-900">Créer votre compte Agri-ERP</h2>
            <p class="text-neutral-500 mt-1">7 jours d'essai gratuit, sans engagement. Ensuite, paiement mobile Orange Money ou Wave.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" autocomplete="off">

            <div>
              <label class="form-label">Votre nom complet *</label>
              <input type="text" formControlName="nom" class="form-input" placeholder="Jean Diallo" autocomplete="off"/>
              @if (f['nom'].invalid && f['nom'].touched) {
                <p class="form-error">Nom requis.</p>
              }
            </div>

            <div>
              <label class="form-label">Numéro de téléphone *</label>
              <div class="flex gap-2">
                <span class="form-input w-20 shrink-0 flex items-center justify-center text-neutral-500 text-sm font-medium cursor-default select-none" style="background:#f5f5f4;">+221</span>
                <input type="tel" formControlName="telephone" class="form-input flex-1"
                       placeholder="77 000 00 00" autocomplete="tel" inputmode="numeric"/>
              </div>
              @if (f['telephone'].touched) {
                @if (f['telephone'].errors?.['required']) {
                  <p class="form-error">Numéro de téléphone requis.</p>
                } @else if (f['telephone'].errors?.['invalidPhone']) {
                  <p class="form-error">Numéro invalide — ex: 770809798</p>
                }
              }
              <p class="text-xs text-neutral-400 mt-1">Saisissez votre numéro sans l'indicatif pays</p>
            </div>

            <div>
              <label class="form-label">Nom de l'exploitation *</label>
              <input type="text" formControlName="nom_organisation" class="form-input" placeholder="Ferme du Soleil" autocomplete="off"/>
              @if (f['nom_organisation'].invalid && f['nom_organisation'].touched) {
                <p class="form-error">Nom de l'exploitation requis.</p>
              }
            </div>

            <div>
              <label class="form-label">Pays</label>
              <select formControlName="pays" class="form-input">
                <option value="">Sélectionner un pays</option>
                @for (pays of paysList; track pays.code) {
                  <option [value]="pays.code">{{ pays.nom }}</option>
                }
              </select>
            </div>

            <div>
              <label class="form-label">Mot de passe</label>
              <div class="relative">
                <input [type]="showPassword() ? 'text' : 'password'" formControlName="password"
                       class="form-input pr-10" placeholder="Min. 8 caractères" autocomplete="off"/>
                <button type="button" (click)="togglePassword()"
                        class="absolute inset-y-0 right-0 px-3 text-neutral-400 hover:text-neutral-600">
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (f['password'].invalid && f['password'].touched) {
                <p class="form-error">Mot de passe min. 8 caractères requis.</p>
              }
            </div>

            <div>
              <label class="form-label">Confirmer le mot de passe</label>
              <input [type]="showPassword() ? 'text' : 'password'" formControlName="password_confirmation"
                     class="form-input" placeholder="••••••••" autocomplete="off"/>
              @if (f['password_confirmation'].errors?.['mismatch'] && f['password_confirmation'].touched) {
                <p class="form-error">Les mots de passe ne correspondent pas.</p>
              }
            </div>

            @if (errorMsg()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {{ errorMsg() }}
              </div>
            }

            <button type="submit" [disabled]="loading() || form.invalid"
                    class="btn-primary w-full justify-center h-11 mt-2">
              @if (loading()) {
                <svg class="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Création en cours...
              } @else {
                Démarrer mon essai gratuit
              }
            </button>
          </form>

          <p class="text-center text-sm text-neutral-500 mt-6">
            Déjà un compte ?
            <a routerLink="/connexion" class="text-primary-600 font-medium hover:underline">Se connecter</a>
          </p>

          <p class="text-center text-xs text-neutral-400 mt-4">
            En créant un compte, vous acceptez nos
            <a href="#" class="underline hover:text-neutral-600">Conditions d'utilisation</a>
            et notre
            <a href="#" class="underline hover:text-neutral-600">Politique de confidentialité</a>.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notif = inject(NotificationService);

  avantages = [
    { icon: '🗺️', text: 'Gestion complète des champs', sub: 'Cultures, intrants, calendrier agricole' },
    { icon: '📊', text: 'Finances et rentabilité', sub: 'Dépenses, ventes, bilans automatiques' },
    { icon: '⛅', text: 'Météo et alertes intelligentes', sub: 'Prévisions adaptées à votre exploitation' },
  ];

  loading = signal(false);
  showPassword = signal(false);
  togglePassword(): void { this.showPassword.update(v => !v); }
  errorMsg = signal('');

  paysList = [
    { code: 'SN', nom: 'Sénégal' }, { code: 'CI', nom: "Côte d'Ivoire" },
    { code: 'ML', nom: 'Mali' }, { code: 'BF', nom: 'Burkina Faso' },
    { code: 'GN', nom: 'Guinée' }, { code: 'TG', nom: 'Togo' },
    { code: 'BJ', nom: 'Bénin' }, { code: 'NE', nom: 'Niger' },
    { code: 'CM', nom: 'Cameroun' }, { code: 'GA', nom: 'Gabon' },
    { code: 'CD', nom: 'RD Congo' }, { code: 'MG', nom: 'Madagascar' },
  ];

  form = this.fb.group({
    nom:                  ['', Validators.required],
    telephone:            ['', [Validators.required, phoneValidator]],
    nom_organisation:     ['', Validators.required],
    pays:                 [''],
    password:             ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation:['', Validators.required],
  }, { validators: passwordMatch });

  get f() { return this.form.controls; }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.register(this.form.value as any).subscribe({
      next: () => {
        this.notif.success('Compte créé ! Bienvenue sur Agri-ERP.');
        this.router.navigate(['/onboarding']);
      },
      error: err => {
        this.loading.set(false);
        const errors = err.error?.errors;
        if (errors) {
          const first = Object.values(errors)[0] as string[];
          this.errorMsg.set(first[0]);
        } else {
          this.errorMsg.set('Une erreur est survenue. Veuillez réessayer.');
        }
      },
    });
  }
}

import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex bg-neutral-50">

      <!-- Left panel — image de fond -->
      <div class="hidden lg:flex lg:flex-1 relative items-end p-12 overflow-hidden">
        <!-- Photo -->
        <img
          src="https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200&q=85&fit=crop&crop=center"
          alt="Agriculteur au coucher du soleil"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <!-- Gradient sombre en bas -->
        <div class="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent"></div>

        <!-- Contenu superposé -->
        <div class="relative z-10 max-w-md">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span class="text-white font-bold text-xs">ERP</span>
            </div>
            <span class="text-xl font-bold text-white">Agri-ERP</span>
          </div>
          <h2 class="text-2xl font-bold text-white mb-3 leading-snug">
            L'ERP agricole pensé<br>pour l'Afrique
          </h2>
          <p class="text-neutral-300 text-sm mb-6">
            Gérez vos champs, stocks, finances et employés depuis un seul outil.
          </p>
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div class="text-xl font-bold text-white">500+</div>
              <div class="text-neutral-400 text-xs">Exploitants</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div class="text-xl font-bold text-white">12</div>
              <div class="text-neutral-400 text-xs">Pays</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div class="text-xl font-bold text-white">98%</div>
              <div class="text-neutral-400 text-xs">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right panel (form) -->
      <div class="flex-1 flex items-center justify-center px-6 py-12">
        <div class="w-full max-w-md">

          <!-- Logo mobile -->
          <div class="lg:hidden flex items-center gap-2 mb-8">
            <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span class="text-white font-bold text-xs">ERP</span>
            </div>
            <span class="text-xl font-bold text-neutral-900">Agri-ERP</span>
          </div>

          <div class="mb-8">
            <h2 class="text-2xl font-bold text-neutral-900">Connexion</h2>
            <p class="text-neutral-500 mt-1">Accédez à votre espace de gestion agricole</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5" autocomplete="off">

            <div>
              <label class="form-label">Adresse email</label>
              <input type="email" formControlName="email" class="form-input"
                     placeholder="votre@email.com" autocomplete="off"/>
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="form-error">Adresse email invalide.</p>
              }
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="form-label mb-0">Mot de passe</label>
                <a routerLink="/mot-de-passe-oublie" class="text-xs text-primary-600 hover:underline">Oublié ?</a>
              </div>
              <div class="relative">
                <input [type]="showPassword() ? 'text' : 'password'" formControlName="password"
                       class="form-input pr-10" placeholder="••••••••" autocomplete="off"/>
                <button type="button" (click)="togglePassword()"
                        class="absolute inset-y-0 right-0 px-3 text-neutral-400 hover:text-neutral-600">
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="form-error">Le mot de passe est obligatoire.</p>
              }
            </div>

            @if (errorMsg()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {{ errorMsg() }}
              </div>
            }

            <button type="submit" [disabled]="loading() || form.invalid"
                    class="btn-primary w-full justify-center h-11">
              @if (loading()) {
                <svg class="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Connexion en cours...
              } @else {
                Se connecter
              }
            </button>
          </form>

          <p class="text-center text-sm text-neutral-500 mt-6">
            Pas encore de compte ?
            <a routerLink="/inscription" class="text-primary-600 font-medium hover:underline">Essai gratuit 7 jours</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notif = inject(NotificationService);

  loading = signal(false);
  showPassword = signal(false);
  togglePassword(): void { this.showPassword.update(v => !v); }
  errorMsg = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.form.value as any).subscribe({
      next: () => {
        this.router.navigate(['/tableau-de-bord']);
      },
      error: err => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.errors?.email?.[0] || 'Identifiants incorrects.');
      },
    });
  }
}

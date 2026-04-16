import { Component, signal, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password');
  const confirm = control.get('password_confirmation');
  if (password && confirm && password.value !== confirm.value) {
    confirm.setErrors({ mismatch: true });
    return { mismatch: true };
  }
  return null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
      <div class="w-full max-w-md">

        <div class="flex items-center gap-2 mb-8">
          <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <span class="text-white font-bold">A</span>
          </div>
          <span class="text-xl font-bold text-neutral-900">Agri-ERP</span>
        </div>

        @if (!success()) {
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-neutral-900">Nouveau mot de passe</h2>
            <p class="text-neutral-500 mt-1">Choisissez un nouveau mot de passe pour votre compte.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">

            <div>
              <label class="form-label">Adresse email</label>
              <input type="email" formControlName="email" class="form-input" placeholder="votre@email.com"/>
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="form-error">Email invalide.</p>
              }
            </div>

            <div>
              <label class="form-label">Nouveau mot de passe</label>
              <div class="relative">
                <input [type]="showPassword() ? 'text' : 'password'"
                       formControlName="password" class="form-input pr-10"
                       placeholder="Minimum 8 caractères"/>
                <button type="button" (click)="showPassword.set(!showPassword())"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600">
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="form-error">Minimum 8 caractères requis.</p>
              }
            </div>

            <div>
              <label class="form-label">Confirmer le mot de passe</label>
              <input [type]="showPassword() ? 'text' : 'password'"
                     formControlName="password_confirmation" class="form-input"
                     placeholder="Répétez le mot de passe"/>
              @if (form.get('password_confirmation')?.errors?.['mismatch'] && form.get('password_confirmation')?.touched) {
                <p class="form-error">Les mots de passe ne correspondent pas.</p>
              }
            </div>

            @if (errorMsg()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{{ errorMsg() }}</div>
            }

            <button type="submit" [disabled]="loading() || form.invalid"
                    class="btn-primary w-full justify-center h-11">
              @if (loading()) {
                <svg class="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Réinitialisation...
              } @else {
                Réinitialiser le mot de passe
              }
            </button>
          </form>

        } @else {
          <div class="text-center bg-white rounded-2xl p-8 shadow-sm border border-neutral-200">
            <div class="text-5xl mb-4">✅</div>
            <h2 class="text-xl font-bold text-neutral-900 mb-2">Mot de passe modifié !</h2>
            <p class="text-neutral-500 text-sm mb-6">Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
            <a routerLink="/connexion" class="btn-primary h-10 px-6 text-sm inline-flex items-center">
              Se connecter →
            </a>
          </div>
        }

        <p class="text-center text-sm text-neutral-500 mt-6">
          <a routerLink="/connexion" class="text-primary-600 font-medium hover:underline">← Retour à la connexion</a>
        </p>

      </div>
    </div>
  `,
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  success = signal(false);
  errorMsg = signal('');
  showPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required],
    token: ['', Validators.required],
  }, { validators: passwordsMatch });

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    this.form.patchValue({ token, email });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');

    this.api.post('/api/auth/password/reset', this.form.value).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: err => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Le lien est invalide ou expiré.');
      },
    });
  }
}

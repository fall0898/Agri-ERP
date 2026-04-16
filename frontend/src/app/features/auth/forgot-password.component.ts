import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-neutral-50 px-6">
      <div class="w-full max-w-md">
        <div class="flex items-center gap-2 mb-8">
          <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
            <span class="text-white font-bold">K</span>
          </div>
          <span class="text-xl font-bold text-neutral-900">Agri-ERP</span>
        </div>

        @if (!sent()) {
          <div class="mb-8">
            <h2 class="text-2xl font-bold text-neutral-900">Mot de passe oublié ?</h2>
            <p class="text-neutral-500 mt-1">Entrez votre email pour recevoir un lien de réinitialisation.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5">
            <div>
              <label class="form-label">Adresse email</label>
              <input type="email" formControlName="email" class="form-input" placeholder="votre@email.com"/>
              @if (form.get('email')?.invalid && form.get('email')?.touched) {
                <p class="form-error">Email invalide.</p>
              }
            </div>

            @if (errorMsg()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{{ errorMsg() }}</div>
            }

            <button type="submit" [disabled]="loading() || form.invalid" class="btn-primary w-full justify-center h-11">
              @if (loading()) {
                <svg class="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Envoi en cours...
              } @else {
                Envoyer le lien
              }
            </button>
          </form>
        } @else {
          <div class="text-center bg-white rounded-2xl p-8 shadow-sm border border-neutral-200">
            <div class="text-5xl mb-4">📧</div>
            <h2 class="text-xl font-bold text-neutral-900 mb-2">Email envoyé !</h2>
            <p class="text-neutral-500 text-sm">Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot de passe.</p>
          </div>
        }

        <p class="text-center text-sm text-neutral-500 mt-6">
          <a routerLink="/connexion" class="text-primary-600 font-medium hover:underline">← Retour à la connexion</a>
        </p>
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private notif = inject(NotificationService);

  loading = signal(false);
  sent = signal(false);
  errorMsg = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.errorMsg.set('');
    this.api.post('/api/mot-de-passe/reinitialiser', this.form.value).subscribe({
      next: () => { this.loading.set(false); this.sent.set(true); },
      error: err => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.message || 'Une erreur est survenue.');
      },
    });
  }
}

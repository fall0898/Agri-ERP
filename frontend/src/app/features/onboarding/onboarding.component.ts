import { Component, signal, inject, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-6 py-12">
      <div class="w-full max-w-lg">

        <!-- Header -->
        <div class="text-center mb-10">
          <div class="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span class="text-3xl">🌾</span>
          </div>
          <h1 class="text-2xl font-bold text-neutral-900">Bienvenue sur Agri-ERP !</h1>
          <p class="text-neutral-500 mt-2">Configurons votre espace de travail en quelques étapes.</p>
        </div>

        <!-- Progress -->
        <div class="flex items-center gap-2 mb-8">
          @for (s of steps; track s.num) {
            <div class="flex-1 h-1.5 rounded-full transition-colors"
                 [class.bg-primary-500]="currentStep() >= s.num"
                 [class.bg-neutral-200]="currentStep() < s.num"></div>
          }
        </div>

        <!-- Step content -->
        <div class="bg-white rounded-2xl p-8 shadow-sm border border-neutral-100">

          @if (currentStep() === 1) {
            <div>
              <h2 class="text-lg font-semibold text-neutral-900 mb-1">Votre exploitation</h2>
              <p class="text-neutral-500 text-sm mb-6">Complétez les informations de votre exploitation agricole.</p>
              <form [formGroup]="orgForm" class="space-y-4">
                <div>
                  <label class="form-label">Superficie totale (hectares)</label>
                  <input type="number" formControlName="superficie_totale" class="form-input" placeholder="ex: 10"/>
                </div>
                <div>
                  <label class="form-label">Type d'agriculture principal</label>
                  <select formControlName="type_agriculture" class="form-input">
                    <option value="">Sélectionner...</option>
                    <option value="cereales">Céréales (mil, sorgho, maïs...)</option>
                    <option value="maraichage">Maraîchage</option>
                    <option value="arboriculture">Arboriculture fruitière</option>
                    <option value="elevage">Élevage</option>
                    <option value="mixte">Agriculture mixte</option>
                  </select>
                </div>
                <div>
                  <label class="form-label">Région / Localité</label>
                  <input type="text" formControlName="region" class="form-input" placeholder="ex: Kaolack, Sénégal"/>
                </div>
              </form>
            </div>
          }

          @if (currentStep() === 2) {
            <div>
              <h2 class="text-lg font-semibold text-neutral-900 mb-1">Votre premier champ</h2>
              <p class="text-neutral-500 text-sm mb-6">Ajoutez votre première parcelle agricole pour commencer.</p>
              <form [formGroup]="champForm" class="space-y-4">
                <div>
                  <label class="form-label">Nom du champ</label>
                  <input type="text" formControlName="nom" class="form-input" placeholder="ex: Parcelle Nord"/>
                </div>
                <div>
                  <label class="form-label">Superficie (hectares)</label>
                  <input type="number" formControlName="superficie" class="form-input" placeholder="ex: 2.5"/>
                </div>
                <div>
                  <label class="form-label">Type de sol</label>
                  <select formControlName="type_sol" class="form-input">
                    <option value="">Sélectionner...</option>
                    <option value="argileux">Argileux</option>
                    <option value="limoneux">Limoneux</option>
                    <option value="sableux">Sableux</option>
                    <option value="argilo-limoneux">Argilo-limoneux</option>
                  </select>
                </div>
              </form>
            </div>
          }

          @if (currentStep() === 3) {
            <div class="text-center py-4">
              <div class="text-6xl mb-6">🎉</div>
              <h2 class="text-xl font-bold text-neutral-900 mb-3">Votre espace est prêt !</h2>
              <p class="text-neutral-500 text-sm mb-8">
                Tout est configuré. Vous pouvez maintenant explorer toutes les fonctionnalités de Agri-ERP.
              </p>
              <div class="grid grid-cols-3 gap-3 text-center mb-8">
                <div class="bg-primary-50 rounded-xl p-3">
                  <div class="text-xl mb-1">🗺️</div>
                  <div class="text-xs font-medium text-primary-700">Vos champs</div>
                </div>
                <div class="bg-amber-50 rounded-xl p-3">
                  <div class="text-xl mb-1">📦</div>
                  <div class="text-xs font-medium text-amber-700">Vos stocks</div>
                </div>
                <div class="bg-blue-50 rounded-xl p-3">
                  <div class="text-xl mb-1">📊</div>
                  <div class="text-xs font-medium text-blue-700">Vos finances</div>
                </div>
              </div>
            </div>
          }

        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-between mt-6">
          @if (currentStep() > 1 && currentStep() < 3) {
            <button (click)="prev()" class="text-neutral-500 hover:text-neutral-700 font-medium text-sm">← Précédent</button>
          } @else {
            <div></div>
          }

          @if (currentStep() < 3) {
            <button (click)="next()" [disabled]="loading()" class="btn-primary h-10 px-6">
              Suivant →
            </button>
          } @else {
            <button (click)="finish()" [disabled]="loading()" class="btn-primary h-10 px-8">
              @if (loading()) { Chargement... } @else { Accéder au tableau de bord }
            </button>
          }
        </div>

        <p class="text-center text-xs text-neutral-400 mt-4">
          <button (click)="skip()" class="hover:text-neutral-600">Passer cette étape</button>
        </p>
      </div>
    </div>
  `,
})
export class OnboardingComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notif = inject(NotificationService);

  currentStep = signal(1);
  loading = signal(false);

  steps = [{ num: 1 }, { num: 2 }, { num: 3 }];

  orgForm = this.fb.group({
    superficie_totale: [null],
    type_agriculture: [''],
    region: [''],
  });

  champForm = this.fb.group({
    nom: ['', Validators.required],
    superficie: [null, Validators.required],
    type_sol: [''],
  });

  next(): void {
    if (this.currentStep() === 1) {
      this.saveOrgInfo();
    } else if (this.currentStep() === 2) {
      this.saveChamp();
    }
  }

  prev(): void {
    this.currentStep.update(s => s - 1);
  }

  skip(): void {
    if (this.currentStep() < 3) {
      this.currentStep.update(s => s + 1);
    } else {
      this.completeOnboarding();
    }
  }

  finish(): void {
    this.completeOnboarding();
  }

  private saveOrgInfo(): void {
    const val = this.orgForm.value;
    if (!val.superficie_totale && !val.type_agriculture && !val.region) {
      this.currentStep.set(2);
      return;
    }
    this.loading.set(true);
    this.api.put('/api/organisation', val).subscribe({
      next: () => { this.loading.set(false); this.currentStep.set(2); },
      error: () => { this.loading.set(false); this.currentStep.set(2); },
    });
  }

  private saveChamp(): void {
    if (this.champForm.invalid) { this.currentStep.set(3); return; }
    this.loading.set(true);
    this.api.post('/api/champs', this.champForm.value).subscribe({
      next: () => { this.loading.set(false); this.currentStep.set(3); },
      error: () => { this.loading.set(false); this.currentStep.set(3); },
    });
  }

  private completeOnboarding(): void {
    this.loading.set(true);
    this.api.post('/api/profil/onboarding-complete', {}).subscribe({
      next: () => {
        this.auth.refreshUser().subscribe(() => {
          this.router.navigate(['/tableau-de-bord']);
        });
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/tableau-de-bord']);
      },
    });
  }
}

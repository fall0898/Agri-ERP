import { Component, signal, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { RouterLink } from '@angular/router';

interface DiagnosticResult {
  maladie: string;
  niveau_confiance: string;
  symptomes: string[];
  traitement_immediat: string[];
  produits_senegal: string[];
  prevention: string[];
  conseil: string;
}

const CULTURES = [
  { key: 'oignon',   label: 'Oignon',   emoji: '🧅' },
  { key: 'tomate',   label: 'Tomate',   emoji: '🍅' },
  { key: 'riz',      label: 'Riz',      emoji: '🌾' },
  { key: 'courgette',label: 'Courgette',emoji: '🥒' },
  { key: 'piment',   label: 'Piment',   emoji: '🌶️' },
  { key: 'patate',   label: 'Patate douce', emoji: '🍠' },
];

@Component({
  selector: 'app-diagnostic',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="pg-wrap space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1>🔬 Diagnostic Phytosanitaire</h1>
          <p class="pg-sub">Analysez vos plantes malades par intelligence artificielle</p>
        </div>
        <a routerLink="/tableau-de-bord" class="text-sm text-neutral-400 hover:text-neutral-600 transition-colors">
          ← Tableau de bord
        </a>
      </div>

      @if (!result()) {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Étape 1 : Choix culture -->
          <div class="card space-y-4">
            <h2 class="font-semibold text-neutral-900">1. Quelle culture est affectée ?</h2>
            <div class="grid grid-cols-3 gap-3">
              @for (c of cultures; track c.key) {
                <button (click)="selectedCulture.set(c)"
                        class="flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all"
                        [class.border-emerald-400]="selectedCulture()?.key === c.key"
                        [class.bg-emerald-50]="selectedCulture()?.key === c.key"
                        [class.border-neutral-200]="selectedCulture()?.key !== c.key"
                        [class.hover:border-neutral-300]="selectedCulture()?.key !== c.key">
                  <span class="text-3xl">{{ c.emoji }}</span>
                  <span class="text-xs font-medium text-neutral-700">{{ c.label }}</span>
                </button>
              }
            </div>
          </div>

          <!-- Étape 2 : Photo + description -->
          <div class="card space-y-4">
            <h2 class="font-semibold text-neutral-900">2. Photo de la plante malade</h2>

            <!-- Zone upload -->
            <div class="border-2 border-dashed rounded-xl transition-colors text-center"
                 [class.border-emerald-400]="previewUrl()"
                 [class.border-neutral-200]="!previewUrl()">
              @if (previewUrl()) {
                <div class="relative">
                  <img [src]="previewUrl()!" alt="Plante" class="w-full h-52 object-cover rounded-xl"/>
                  <button (click)="clearPhoto()"
                          class="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600">
                    ×
                  </button>
                </div>
              } @else {
                <div class="py-10 px-6">
                  <div class="text-5xl mb-3">📸</div>
                  <p class="text-neutral-500 text-sm mb-3">Prenez ou uploadez une photo claire de la plante</p>
                  <button (click)="fileInput.click()"
                          class="text-sm font-medium px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors">
                    Choisir une photo
                  </button>
                </div>
              }
              <input #fileInput type="file" accept="image/*" class="hidden" (change)="onPhoto($event)"/>
            </div>

            <!-- Description optionnelle -->
            <div>
              <label class="form-label">Description des symptômes (optionnel)</label>
              <textarea [value]="description()" (input)="description.set($any($event.target).value)"
                        class="form-input h-20 resize-none text-sm"
                        placeholder="Ex: les feuilles jaunissent à la base depuis 3 jours, taches brunes..."></textarea>
            </div>
          </div>
        </div>

        <!-- Bouton analyse -->
        <div class="flex justify-center">
          <button (click)="analyser()"
                  [disabled]="!selectedCulture() || !pendingFile() || analysing()"
                  class="btn-primary h-12 px-10 text-base disabled:opacity-40 disabled:cursor-not-allowed">
            @if (analysing()) {
              <svg class="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Analyse en cours...
            } @else {
              🔬 Lancer l'analyse IA
            }
          </button>
        </div>

        @if (!selectedCulture() || !pendingFile()) {
          <p class="text-center text-xs text-neutral-400">
            {{ !selectedCulture() ? 'Sélectionnez une culture' : 'Ajoutez une photo' }} pour continuer
          </p>
        }

      } @else {

        <!-- Résultats -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Photo + info -->
          <div class="card space-y-4">
            <img [src]="previewUrl()!" alt="Plante analysée" class="w-full h-48 object-cover rounded-xl"/>
            <div>
              <p class="text-xs text-neutral-400 mb-1">Culture analysée</p>
              <p class="font-semibold text-neutral-900">{{ selectedCulture()!.emoji }} {{ selectedCulture()!.label }}</p>
            </div>
            <div>
              <p class="text-xs text-neutral-400 mb-1">Niveau de confiance</p>
              <span class="text-sm font-medium px-3 py-1 rounded-full"
                    [class.bg-green-100]="result()!.niveau_confiance === 'élevé'"
                    [class.text-green-700]="result()!.niveau_confiance === 'élevé'"
                    [class.bg-amber-100]="result()!.niveau_confiance === 'moyen'"
                    [class.text-amber-700]="result()!.niveau_confiance === 'moyen'"
                    [class.bg-red-100]="result()!.niveau_confiance === 'faible'"
                    [class.text-red-700]="result()!.niveau_confiance === 'faible'">
                {{ result()!.niveau_confiance }}
              </span>
            </div>
            <button (click)="recommencer()" class="w-full btn-secondary text-sm h-9">
              Nouveau diagnostic
            </button>
          </div>

          <!-- Diagnostic -->
          <div class="lg:col-span-2 space-y-4">

            <!-- Maladie détectée -->
            <div class="card bg-red-50 border-red-200">
              <p class="text-xs font-medium text-red-500 uppercase tracking-wide mb-1">Maladie détectée</p>
              <h2 class="text-xl font-bold text-red-800">{{ result()!.maladie }}</h2>
            </div>

            <!-- Symptômes -->
            <div class="card">
              <h3 class="font-semibold text-neutral-900 mb-3">🔍 Symptômes confirmés</h3>
              <ul class="space-y-1.5">
                @for (s of result()!.symptomes; track s) {
                  <li class="flex items-start gap-2 text-sm text-neutral-700">
                    <span class="text-amber-500 mt-0.5 shrink-0">•</span> {{ s }}
                  </li>
                }
              </ul>
            </div>

            <!-- Traitement -->
            <div class="card">
              <h3 class="font-semibold text-neutral-900 mb-3">💊 Traitement immédiat</h3>
              <ul class="space-y-1.5">
                @for (t of result()!.traitement_immediat; track t) {
                  <li class="flex items-start gap-2 text-sm text-neutral-700">
                    <span class="text-green-500 mt-0.5 shrink-0">✓</span> {{ t }}
                  </li>
                }
              </ul>
            </div>

            <!-- Produits Sénégal -->
            @if (result()!.produits_senegal.length) {
              <div class="card bg-blue-50 border-blue-100">
                <h3 class="font-semibold text-blue-900 mb-3">🛒 Produits disponibles au Sénégal</h3>
                <div class="flex flex-wrap gap-2">
                  @for (p of result()!.produits_senegal; track p) {
                    <span class="text-sm bg-white border border-blue-200 text-blue-800 px-3 py-1 rounded-full">{{ p }}</span>
                  }
                </div>
              </div>
            }

            <!-- Prévention -->
            <div class="card">
              <h3 class="font-semibold text-neutral-900 mb-3">🛡️ Mesures préventives</h3>
              <ul class="space-y-1.5">
                @for (p of result()!.prevention; track p) {
                  <li class="flex items-start gap-2 text-sm text-neutral-700">
                    <span class="text-blue-500 mt-0.5 shrink-0">→</span> {{ p }}
                  </li>
                }
              </ul>
            </div>

            <!-- Conseil -->
            @if (result()!.conseil) {
              <div class="card bg-amber-50 border-amber-200">
                <h3 class="font-semibold text-amber-900 mb-2">💡 Conseil de l'expert</h3>
                <p class="text-sm text-amber-800 leading-relaxed">{{ result()!.conseil }}</p>
              </div>
            }

          </div>
        </div>
      }
    </div>
  `,
})
export class DiagnosticComponent {
  private api = inject(ApiService);
  private notif = inject(NotificationService);

  cultures = CULTURES;
  selectedCulture = signal<typeof CULTURES[0] | null>(null);
  pendingFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  description = signal('');
  analysing = signal(false);
  result = signal<DiagnosticResult | null>(null);

  onPhoto(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.pendingFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  clearPhoto(): void {
    this.pendingFile.set(null);
    this.previewUrl.set(null);
  }

  analyser(): void {
    const file = this.pendingFile();
    const culture = this.selectedCulture();
    if (!file || !culture) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('type_culture', culture.key);
    if (this.description()) formData.append('description_symptomes', this.description());

    this.analysing.set(true);
    this.api.postFormData<DiagnosticResult>('/api/diagnostic/analyser', formData).subscribe({
      next: res => {
        this.result.set(res);
        this.analysing.set(false);
      },
      error: err => {
        this.analysing.set(false);
        this.notif.error(err.error?.message || 'Erreur lors de l\'analyse.');
      },
    });
  }

  recommencer(): void {
    this.result.set(null);
    this.pendingFile.set(null);
    this.previewUrl.set(null);
    this.description.set('');
    this.selectedCulture.set(null);
  }
}

import { Component, signal, inject } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';

interface ImportType {
  key: string;
  label: string;
  icon: string;
  colonnes: string[];
  exemple: string;
}

interface ImportResult {
  imported: number;
  errors: string[];
  message: string;
}

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [],
  template: `
    <div class="pg-wrap space-y-6">

      <div>
        <h1>Import CSV</h1>
        <p class="pg-sub">Importez vos données depuis des fichiers CSV</p>
      </div>

      @if (!auth.isAdmin()) {
        <div class="card text-center py-12">
          <div class="text-4xl mb-3">🔒</div>
          <p class="text-neutral-500">Réservé aux administrateurs.</p>
        </div>
      } @else {

        <!-- Onglets types -->
        <div class="flex gap-2 flex-wrap">
          @for (t of types; track t.key) {
            <button (click)="selectedType.set(t)"
                    class="text-sm font-medium px-4 py-2 rounded-xl border transition-colors"
                    [class.bg-primary-500]="selectedType().key === t.key"
                    [class.text-white]="selectedType().key === t.key"
                    [class.border-primary-500]="selectedType().key === t.key"
                    [class.bg-white]="selectedType().key !== t.key"
                    [class.text-neutral-600]="selectedType().key !== t.key"
                    [class.border-neutral-200]="selectedType().key !== t.key">
              {{ t.icon }} {{ t.label }}
            </button>
          }
        </div>

        <!-- Panneau actif -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <!-- Instructions -->
          <div class="card space-y-4">
            <h2 class="font-semibold text-neutral-900">{{ selectedType().icon }} Importer des {{ selectedType().label }}</h2>

            <div class="bg-neutral-50 rounded-xl p-4">
              <p class="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Colonnes attendues</p>
              <div class="flex flex-wrap gap-2">
                @for (col of selectedType().colonnes; track col) {
                  <span class="font-mono text-xs bg-white border border-neutral-200 px-2 py-1 rounded-lg text-neutral-700">{{ col }}</span>
                }
              </div>
            </div>

            <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p class="text-xs font-medium text-amber-700 mb-1">💡 Exemple (ligne CSV)</p>
              <p class="font-mono text-xs text-amber-800 break-all">{{ selectedType().exemple }}</p>
            </div>

            <button (click)="downloadTemplate()"
                    class="w-full text-sm py-2.5 rounded-xl border-2 border-dashed border-primary-300 text-primary-600 hover:bg-primary-50 font-medium transition-colors">
              ⬇️ Télécharger le template CSV
            </button>
          </div>

          <!-- Upload -->
          <div class="card space-y-4">
            <h2 class="font-semibold text-neutral-900">Envoyer le fichier</h2>

            <!-- Drop zone -->
            <div class="border-2 border-dashed rounded-xl p-8 text-center transition-colors"
                 [class.border-primary-400]="pendingFile()"
                 [class.bg-primary-50]="pendingFile()"
                 [class.border-neutral-200]="!pendingFile()">
              @if (!pendingFile()) {
                <div class="text-4xl mb-3">📂</div>
                <p class="text-neutral-500 text-sm mb-3">Glissez votre fichier CSV ou</p>
                <button (click)="fileInput.click()"
                        class="text-sm font-medium px-4 py-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors">
                  Choisir un fichier
                </button>
              } @else {
                <div class="text-4xl mb-2">📄</div>
                <p class="font-medium text-neutral-900 text-sm">{{ pendingFile()!.name }}</p>
                <p class="text-xs text-neutral-400 mt-1">{{ formatSize(pendingFile()!.size) }}</p>
                <button (click)="pendingFile.set(null)"
                        class="mt-3 text-xs text-red-500 hover:text-red-700">Supprimer</button>
              }
              <input #fileInput type="file" accept=".csv,.txt" class="hidden" (change)="onFile($event)"/>
            </div>

            @if (pendingFile()) {
              <button (click)="upload()" [disabled]="uploading()"
                      class="w-full btn-primary h-11 text-sm">
                {{ uploading() ? 'Import en cours...' : '🚀 Lancer l\'import' }}
              </button>
            }

            <!-- Résultats -->
            @if (result()) {
              <div class="rounded-xl border overflow-hidden"
                   [class.border-green-200]="result()!.errors.length === 0"
                   [class.border-amber-200]="result()!.errors.length > 0">
                <div class="px-4 py-3 flex items-center gap-2"
                     [class.bg-green-50]="result()!.errors.length === 0"
                     [class.bg-amber-50]="result()!.errors.length > 0">
                  <span class="text-lg">{{ result()!.errors.length === 0 ? '✅' : '⚠️' }}</span>
                  <div>
                    <p class="text-sm font-medium text-neutral-900">{{ result()!.imported }} ligne(s) importée(s)</p>
                    @if (result()!.errors.length > 0) {
                      <p class="text-xs text-amber-700">{{ result()!.errors.length }} erreur(s)</p>
                    }
                  </div>
                </div>
                @if (result()!.errors.length > 0) {
                  <div class="bg-white p-3 max-h-40 overflow-y-auto space-y-1">
                    @for (err of result()!.errors; track err) {
                      <p class="text-xs text-red-600 font-mono">{{ err }}</p>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Conseils -->
        <div class="card bg-blue-50 border-blue-100">
          <h3 class="font-semibold text-blue-900 mb-3">📌 Conseils pour l'import</h3>
          <ul class="space-y-1.5 text-sm text-blue-800">
            <li>• Utilisez le <strong>séparateur point-virgule (;)</strong> entre les colonnes</li>
            <li>• Les dates doivent être au format <strong>YYYY-MM-DD</strong> (ex: 2026-03-15)</li>
            <li>• La première ligne du CSV doit contenir les <strong>en-têtes</strong></li>
            <li>• Pour les cultures et dépenses, utilisez le <strong>nom exact du champ</strong> (colonne champ_nom)</li>
            <li>• Les lignes avec erreurs sont ignorées, les autres sont importées</li>
          </ul>
        </div>

      }
    </div>
  `,
})
export class ImportComponent {
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  auth = inject(AuthService);

  uploading = signal(false);
  pendingFile = signal<File | null>(null);
  result = signal<ImportResult | null>(null);

  types: ImportType[] = [
    {
      key: 'champs',
      label: 'Champs',
      icon: '🌾',
      colonnes: ['nom', 'superficie_ha', 'localisation', 'description'],
      exemple: 'Parcelle Nord;2.5;Kaolack;Sol argileux',
    },
    {
      key: 'cultures',
      label: 'Cultures',
      icon: '🌱',
      colonnes: ['nom', 'champ_nom', 'saison', 'annee', 'date_semis', 'date_recolte_prevue', 'superficie_cultivee_ha', 'variete', 'notes'],
      exemple: 'Mil;Parcelle Nord;normale;2026;2026-06-01;2026-10-15;2;Souna III;',
    },
    {
      key: 'stocks',
      label: 'Stocks',
      icon: '📦',
      colonnes: ['nom', 'categorie', 'quantite_actuelle', 'unite', 'seuil_alerte'],
      exemple: 'Engrais NPK;intrant;500;kg;50',
    },
    {
      key: 'depenses',
      label: 'Dépenses',
      icon: '💸',
      colonnes: ['description', 'categorie', 'montant_fcfa', 'date_depense', 'champ_nom'],
      exemple: 'Achat semences;intrant;25000;2026-04-01;Parcelle Nord',
    },
    {
      key: 'ventes',
      label: 'Ventes',
      icon: '💰',
      colonnes: ['produit', 'acheteur', 'quantite_kg', 'prix_unitaire_fcfa', 'date_vente', 'champ_nom'],
      exemple: 'Mil;Marché Sandaga;300;250;2026-11-20;Parcelle Nord',
    },
  ];

  selectedType = signal<ImportType>(this.types[0]);

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.pendingFile.set(file);
      this.result.set(null);
    }
  }

  downloadTemplate(): void {
    this.api.getBlob(`/api/import/template/${this.selectedType().key}`).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `template_${this.selectedType().key}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.notif.error('Erreur lors du téléchargement.'),
    });
  }

  upload(): void {
    const file = this.pendingFile();
    if (!file) return;

    const formData = new FormData();
    formData.append('fichier', file);

    this.uploading.set(true);
    this.result.set(null);

    this.api.postFormData<ImportResult>(`/api/import/${this.selectedType().key}`, formData).subscribe({
      next: res => {
        this.uploading.set(false);
        this.result.set(res);
        this.pendingFile.set(null);
        if (res.errors.length === 0) {
          this.notif.success(res.message);
        } else {
          this.notif.error(`${res.imported} importé(s), ${res.errors.length} erreur(s).`);
        }
      },
      error: err => {
        this.uploading.set(false);
        this.notif.error(err.error?.message || 'Erreur lors de l\'import.');
      },
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }
}

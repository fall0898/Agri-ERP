import { Component, Input, signal, inject, OnInit, OnChanges } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { Media } from '../../core/models';

@Component({
  selector: 'app-media-gallery',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="space-y-4">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-neutral-800">
          Photos &amp; Vidéos
          @if (medias().length) {
            <span class="ml-2 text-xs font-normal text-neutral-400">({{ medias().length }})</span>
          }
        </h3>
        @if (canEdit) {
          <button (click)="fileInput.click()" [disabled]="uploading()"
                  class="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary-500 hover:bg-primary-600 text-white transition-colors disabled:opacity-50">
            {{ uploading() ? 'Envoi...' : '+ Ajouter' }}
          </button>
          <input #fileInput type="file" accept="image/jpeg,image/png,image/webp,video/mp4"
                 class="hidden" (change)="onFileSelected($event)"/>
        }
      </div>

      <!-- Description input (shown after file selection) -->
      @if (pendingFile()) {
        <div class="bg-primary-50 border border-primary-200 rounded-xl p-4 space-y-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center text-lg shrink-0">
              {{ pendingFile()!.type.startsWith('video') ? '🎥' : '📷' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-neutral-800 truncate">{{ pendingFile()!.name }}</p>
              <p class="text-xs text-neutral-400">{{ formatSize(pendingFile()!.size) }}</p>
            </div>
          </div>
          <input type="text" [value]="pendingDescription()" (input)="pendingDescription.set($any($event.target).value)"
                 placeholder="Description (optionnel)" class="form-input text-sm"/>
          <div class="flex gap-2">
            <button (click)="cancelUpload()" class="flex-1 text-xs py-1.5 rounded-lg bg-white border border-neutral-200 text-neutral-600 font-medium">Annuler</button>
            <button (click)="upload()" [disabled]="uploading()"
                    class="flex-1 text-xs py-1.5 rounded-lg bg-primary-500 text-white font-medium disabled:opacity-50">
              {{ uploading() ? 'Envoi...' : 'Envoyer' }}
            </button>
          </div>
        </div>
      }

      <!-- Loading -->
      @if (loading()) {
        <div class="grid grid-cols-3 gap-2">
          @for (i of [1,2,3]; track i) {
            <div class="aspect-square rounded-xl bg-neutral-100 animate-pulse"></div>
          }
        </div>
      }

      <!-- Grid -->
      @if (!loading() && medias().length) {
        <div class="grid grid-cols-3 gap-2">
          @for (media of medias(); track media.id) {
            <div class="relative group aspect-square rounded-xl overflow-hidden bg-neutral-100 cursor-pointer"
                 (click)="openViewer(media)">
              @if (media.type === 'photo') {
                <img [src]="media.fichier_url" [alt]="media.description || media.fichier_nom"
                     class="w-full h-full object-cover transition-transform group-hover:scale-105"/>
              } @else {
                <div class="w-full h-full flex flex-col items-center justify-center bg-neutral-800 text-white gap-1">
                  <span class="text-2xl">▶</span>
                  <span class="text-xs opacity-70">Vidéo</span>
                </div>
              }
              @if (media.description) {
                <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                  <p class="text-white text-xs truncate">{{ media.description }}</p>
                </div>
              }
              @if (canEdit) {
                <button (click)="deleteMedia(media, $event)"
                        class="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  ×
                </button>
              }
            </div>
          }
        </div>
      }

      <!-- Empty state -->
      @if (!loading() && !medias().length && !pendingFile()) {
        <div class="text-center py-8 text-neutral-400">
          <div class="text-3xl mb-2">📷</div>
          <p class="text-sm">Aucune photo ni vidéo</p>
          @if (canEdit) {
            <p class="text-xs mt-1">Cliquez sur "+ Ajouter" pour commencer le suivi visuel</p>
          }
        </div>
      }

    </div>

    <!-- Viewer modal -->
    @if (viewerMedia()) {
      <div class="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
           (click)="closeViewer()">
        <div class="relative max-w-4xl w-full" (click)="$event.stopPropagation()">
          <button (click)="closeViewer()"
                  class="absolute -top-10 right-0 text-white text-2xl leading-none opacity-70 hover:opacity-100">×</button>
          @if (viewerMedia()!.type === 'photo') {
            <img [src]="viewerMedia()!.fichier_url" [alt]="viewerMedia()!.description || ''"
                 class="max-h-[80vh] w-full object-contain rounded-lg"/>
          } @else {
            <video [src]="viewerMedia()!.fichier_url" controls autoplay
                   class="max-h-[80vh] w-full rounded-lg"></video>
          }
          @if (viewerMedia()!.description) {
            <p class="text-white text-sm text-center mt-3 opacity-80">{{ viewerMedia()!.description }}</p>
          }
          <p class="text-neutral-400 text-xs text-center mt-1">{{ viewerMedia()!.fichier_nom }}</p>
        </div>
      </div>
    }
  `,
})
export class MediaGalleryComponent implements OnInit, OnChanges {
  @Input() entityType!: 'champ' | 'culture';
  @Input() entityId!: number;
  @Input() canEdit = false;

  private api = inject(ApiService);
  private notif = inject(NotificationService);

  loading = signal(true);
  uploading = signal(false);
  medias = signal<Media[]>([]);
  pendingFile = signal<File | null>(null);
  pendingDescription = signal('');
  viewerMedia = signal<Media | null>(null);

  ngOnInit(): void { this.loadMedias(); }

  ngOnChanges(): void { this.loadMedias(); }

  loadMedias(): void {
    if (!this.entityId) return;
    this.loading.set(true);
    const path = this.entityType === 'champ'
      ? `/api/champs/${this.entityId}/medias`
      : `/api/cultures/${this.entityId}/medias`;

    this.api.get<Media[]>(path).subscribe({
      next: res => { this.medias.set(Array.isArray(res) ? res : []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.pendingFile.set(file);
      this.pendingDescription.set('');
    }
  }

  cancelUpload(): void {
    this.pendingFile.set(null);
    this.pendingDescription.set('');
  }

  upload(): void {
    const file = this.pendingFile();
    if (!file) return;

    const formData = new FormData();
    formData.append('fichier', file);
    if (this.pendingDescription()) {
      formData.append('description', this.pendingDescription());
    }

    this.uploading.set(true);
    const path = this.entityType === 'champ'
      ? `/api/champs/${this.entityId}/medias`
      : `/api/cultures/${this.entityId}/medias`;

    this.api.postFormData<Media>(path, formData).subscribe({
      next: media => {
        this.medias.update(list => [media, ...list]);
        this.pendingFile.set(null);
        this.pendingDescription.set('');
        this.uploading.set(false);
        this.notif.success('Média ajouté.');
      },
      error: err => {
        this.uploading.set(false);
        this.notif.error(err.error?.message || 'Erreur lors de l\'envoi.');
      },
    });
  }

  deleteMedia(media: Media, event: Event): void {
    event.stopPropagation();
    if (!confirm('Supprimer ce média ?')) return;
    this.api.delete(`/api/medias/${media.id}`).subscribe({
      next: () => {
        this.medias.update(list => list.filter(m => m.id !== media.id));
        this.notif.success('Média supprimé.');
      },
      error: err => this.notif.error(err.error?.message || 'Erreur lors de la suppression.'),
    });
  }

  openViewer(media: Media): void { this.viewerMedia.set(media); }
  closeViewer(): void { this.viewerMedia.set(null); }

  formatSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }
}

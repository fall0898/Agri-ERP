import {
  Component, Input, signal, inject, OnInit, OnChanges,
  HostListener, computed
} from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { Media } from '../../core/models';

@Component({
  selector: 'app-media-gallery',
  standalone: true,
  imports: [],
  styles: [`
    :host { display: block; }

    /* ── tokens ── */
    .mg {
      --green:  #16a34a;
      --red:    #dc2626;
      --border: #e5e7eb;
      --bg:     #f9fafb;
      --txt:    #111827;
      --txt2:   #6b7280;
      --radius: 14px;
    }

    /* ── dropzone ── */
    .drop-zone {
      border: 2px dashed var(--border);
      border-radius: var(--radius);
      padding: 36px 20px;
      text-align: center;
      cursor: pointer;
      transition: border-color .2s, background .2s;
      background: var(--bg);
      position: relative;
    }
    .drop-zone:hover, .drop-zone.dragging {
      border-color: var(--green);
      background: #f0fdf4;
    }
    .drop-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .drop-icon {
      width: 48px; height: 48px; border-radius: 14px;
      background: #dcfce7; display: flex; align-items: center;
      justify-content: center; margin: 0 auto 12px;
    }
    .drop-title { font-size: 14px; font-weight: 600; color: var(--txt); margin-bottom: 4px; }
    .drop-sub   { font-size: 12px; color: var(--txt2); }

    /* ── upload pending ── */
    .up-pending {
      border: 1px solid #bbf7d0; border-radius: var(--radius);
      background: #f0fdf4; padding: 14px; margin-bottom: 12px;
    }
    .up-file-row {
      display: flex; align-items: center; gap: 10px; margin-bottom: 10px;
    }
    .up-file-icon {
      width: 38px; height: 38px; border-radius: 10px; background: #dcfce7;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }
    .up-file-name { font-size: 13px; font-weight: 500; color: var(--txt); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .up-file-size { font-size: 11px; color: var(--txt2); margin-top: 1px; }
    .up-input {
      width: 100%; border: 1px solid #bbf7d0; border-radius: 9px;
      padding: 8px 12px; font-size: 13px; color: var(--txt);
      background: white; outline: none; margin-bottom: 10px;
      font-family: inherit;
    }
    .up-input:focus { border-color: var(--green); box-shadow: 0 0 0 3px rgba(22,163,74,.12); }
    .up-actions { display: flex; gap: 8px; }
    .btn-cancel {
      flex: 1; padding: 8px; border-radius: 9px; border: 1px solid var(--border);
      background: white; font-size: 13px; font-weight: 500; color: var(--txt2);
      cursor: pointer; font-family: inherit; transition: background .15s;
    }
    .btn-cancel:hover { background: #f3f4f6; }
    .btn-upload {
      flex: 1; padding: 8px; border-radius: 9px; border: none;
      background: var(--green); color: white;
      font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit;
      transition: background .15s;
    }
    .btn-upload:hover:not(:disabled) { background: #15803d; }
    .btn-upload:disabled { opacity: .55; cursor: not-allowed; }

    /* ── progress ── */
    .prog-wrap { margin-bottom: 10px; }
    .prog-label { font-size: 12px; color: var(--txt2); margin-bottom: 5px; display: flex; justify-content: space-between; }
    .prog-track { height: 6px; background: #bbf7d0; border-radius: 99px; overflow: hidden; }
    .prog-fill  { height: 100%; background: var(--green); border-radius: 99px; transition: width .3s ease; }

    /* ── gallery grid (masonry-like using CSS columns) ── */
    .gallery {
      columns: 2; column-gap: 8px;
      margin-top: 12px;
    }
    @media (min-width: 480px) { .gallery { columns: 3; column-gap: 10px; } }

    .gallery-item {
      break-inside: avoid;
      margin-bottom: 8px;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      background: #f3f4f6;
      display: block;
    }
    @media (min-width: 480px) { .gallery-item { margin-bottom: 10px; } }

    .gallery-item img, .gallery-item video {
      width: 100%; display: block;
      transition: transform .25s ease;
    }
    .gallery-item:hover img, .gallery-item:hover video {
      transform: scale(1.04);
    }

    .gallery-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,.55) 0%, transparent 45%);
      opacity: 0; transition: opacity .2s;
    }
    .gallery-item:hover .gallery-overlay { opacity: 1; }

    .gallery-desc {
      position: absolute; bottom: 0; left: 0; right: 0;
      padding: 8px 10px 7px;
      color: white; font-size: 11px; line-height: 1.4;
      transform: translateY(4px); transition: transform .2s;
    }
    .gallery-item:hover .gallery-desc { transform: none; }

    .gallery-del {
      position: absolute; top: 6px; right: 6px;
      width: 26px; height: 26px; border-radius: 50%;
      background: rgba(220,38,38,.85); color: white;
      border: none; cursor: pointer; font-size: 16px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity .15s;
    }
    .gallery-item:hover .gallery-del { opacity: 1; }

    .gallery-type-badge {
      position: absolute; top: 6px; left: 6px;
      background: rgba(0,0,0,.55); color: white;
      font-size: 10px; font-weight: 600; padding: 2px 7px;
      border-radius: 99px; letter-spacing: .3px;
    }

    /* ── skeleton ── */
    .skel-grid { columns: 2; column-gap: 8px; margin-top: 12px; }
    @media (min-width: 480px) { .skel-grid { columns: 3; } }
    .skel-item {
      break-inside: avoid; margin-bottom: 8px; border-radius: 12px;
      background: linear-gradient(90deg,#f3f4f6 0%,#e5e7eb 50%,#f3f4f6 100%);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }
    @keyframes shimmer { from{background-position:-200% 0} to{background-position:200% 0} }

    /* ── header ── */
    .gal-hd {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;
    }
    .gal-title { font-size: 14px; font-weight: 600; color: var(--txt); }
    .gal-count { font-size: 12px; color: var(--txt2); font-weight: 400; margin-left: 6px; }
    .btn-add {
      display: flex; align-items: center; gap: 5px;
      font-size: 12px; font-weight: 600; padding: 7px 14px;
      border-radius: 10px; border: none; cursor: pointer;
      background: var(--green); color: white; font-family: inherit;
      transition: background .15s, transform .1s;
      position: relative;
    }
    .btn-add input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .btn-add:hover { background: #15803d; transform: translateY(-1px); }

    /* ── empty ── */
    .empty-state {
      text-align: center; padding: 40px 20px; color: var(--txt2);
    }
    .empty-icon {
      width: 56px; height: 56px; border-radius: 16px; background: #f3f4f6;
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 12px; font-size: 24px;
    }
    .empty-title { font-size: 14px; font-weight: 600; color: var(--txt); margin-bottom: 4px; }
    .empty-sub   { font-size: 12px; color: var(--txt2); }

    /* ── LIGHTBOX ── */
    .lb-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,.94);
      z-index: 9999; display: flex; align-items: center; justify-content: center;
      animation: lb-in .18s ease;
    }
    @keyframes lb-in { from{opacity:0} to{opacity:1} }

    .lb-inner {
      position: relative; max-width: min(90vw, 900px); width: 100%;
      display: flex; flex-direction: column; align-items: center;
    }

    .lb-media {
      max-height: 78vh; max-width: 100%;
      border-radius: 12px; display: block; object-fit: contain;
    }

    .lb-close {
      position: fixed; top: 16px; right: 16px;
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,.12); border: none;
      color: white; font-size: 22px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .lb-close:hover { background: rgba(255,255,255,.22); }

    .lb-nav {
      position: fixed; top: 50%; transform: translateY(-50%);
      width: 44px; height: 44px; border-radius: 50%;
      background: rgba(255,255,255,.12); border: none; color: white;
      font-size: 20px; cursor: pointer; display: flex;
      align-items: center; justify-content: center;
      transition: background .15s;
    }
    .lb-nav:hover { background: rgba(255,255,255,.25); }
    .lb-prev { left: 12px; }
    .lb-next { right: 12px; }
    .lb-nav:disabled { opacity: .2; cursor: default; }

    .lb-info {
      margin-top: 14px; text-align: center;
    }
    .lb-desc { color: rgba(255,255,255,.85); font-size: 14px; margin-bottom: 4px; }
    .lb-meta { color: rgba(255,255,255,.35); font-size: 11px; }
    .lb-counter {
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      background: rgba(255,255,255,.1); color: rgba(255,255,255,.7);
      font-size: 12px; font-weight: 600; padding: 4px 14px; border-radius: 99px;
    }
  `],
  template: `
<div class="mg">

  <!-- Header -->
  <div class="gal-hd">
    <div>
      <span class="gal-title">Photos & Vidéos</span>
      @if (medias().length) {
        <span class="gal-count">({{ medias().length }})</span>
      }
    </div>
    @if (canEdit && !pendingFile()) {
      <label class="btn-add">
        <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        Ajouter
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" (change)="onFileSelected($event)"/>
      </label>
    }
  </div>

  <!-- Upload pending -->
  @if (pendingFile()) {
    <div class="up-pending">
      <div class="up-file-row">
        <div class="up-file-icon">{{ pendingFile()!.type.startsWith('video') ? '🎬' : '🖼️' }}</div>
        <div style="flex:1;min-width:0">
          <div class="up-file-name">{{ pendingFile()!.name }}</div>
          <div class="up-file-size">{{ formatSize(pendingFile()!.size) }}</div>
        </div>
      </div>
      @if (uploading()) {
        <div class="prog-wrap">
          <div class="prog-label">
            <span>Envoi en cours…</span>
            <span>{{ uploadProgress() }}%</span>
          </div>
          <div class="prog-track">
            <div class="prog-fill" [style.width.%]="uploadProgress()"></div>
          </div>
        </div>
      } @else {
        <input class="up-input" type="text" placeholder="Description (optionnel)"
               [value]="pendingDescription()"
               (input)="pendingDescription.set($any($event.target).value)"/>
      }
      <div class="up-actions">
        <button class="btn-cancel" (click)="cancelUpload()" [disabled]="uploading()">Annuler</button>
        <button class="btn-upload" (click)="upload()" [disabled]="uploading()">
          {{ uploading() ? 'Envoi…' : 'Envoyer' }}
        </button>
      </div>
    </div>
  }

  <!-- Drop zone (shown when empty and can edit) -->
  @if (!pendingFile() && !loading() && !medias().length && canEdit) {
    <label class="drop-zone" [class.dragging]="dragging()"
           (dragover)="$event.preventDefault(); dragging.set(true)"
           (dragleave)="dragging.set(false)"
           (drop)="onDrop($event)">
      <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" (change)="onFileSelected($event)"/>
      <div class="drop-icon">
        <svg width="22" height="22" fill="none" stroke="#16a34a" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
      <div class="drop-title">Glissez vos photos ici</div>
      <div class="drop-sub">ou cliquez pour parcourir · JPG, PNG, WebP, MP4</div>
    </label>
  }

  <!-- Skeleton -->
  @if (loading()) {
    <div class="skel-grid">
      <div class="skel-item" style="height:120px"></div>
      <div class="skel-item" style="height:80px"></div>
      <div class="skel-item" style="height:100px"></div>
      <div class="skel-item" style="height:90px"></div>
      <div class="skel-item" style="height:110px"></div>
      <div class="skel-item" style="height:85px"></div>
    </div>
  }

  <!-- Gallery (masonry columns) -->
  @if (!loading() && medias().length) {
    <div class="gallery">
      @for (media of medias(); track media.id; let i = $index) {
        <div class="gallery-item" (click)="openLightbox(i)">
          @if (media.type === 'video') {
            <span class="gallery-type-badge">▶ Vidéo</span>
            <video [src]="media.fichier_url" preload="metadata"
                   style="pointer-events:none"></video>
          } @else {
            <img [src]="media.fichier_url" [alt]="media.description || media.fichier_nom"
                 loading="lazy"/>
          }
          <div class="gallery-overlay"></div>
          @if (media.description) {
            <div class="gallery-desc">{{ media.description }}</div>
          }
          @if (canEdit) {
            <button class="gallery-del" (click)="deleteMedia(media, $event)" title="Supprimer">
              <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          }
        </div>
      }
    </div>
  }

  <!-- Empty (read-only) -->
  @if (!loading() && !medias().length && !canEdit && !pendingFile()) {
    <div class="empty-state">
      <div class="empty-icon">📷</div>
      <div class="empty-title">Aucune photo</div>
      <div class="empty-sub">Aucun média enregistré pour le moment</div>
    </div>
  }

</div>

<!-- ══════ LIGHTBOX ══════ -->
@if (lbIndex() !== null) {
  <div class="lb-overlay" (click)="closeLightbox()">

    <button class="lb-close" (click)="closeLightbox()">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>

    <button class="lb-nav lb-prev" (click)="lbPrev($event)" [disabled]="lbIndex() === 0">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
    </button>
    <button class="lb-nav lb-next" (click)="lbNext($event)" [disabled]="lbIndex() === medias().length - 1">
      <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
    </button>

    <div class="lb-inner" (click)="$event.stopPropagation()">
      @if (currentMedia()?.type === 'video') {
        <video class="lb-media" [src]="currentMedia()!.fichier_url" controls autoplay></video>
      } @else {
        <img class="lb-media" [src]="currentMedia()!.fichier_url" [alt]="currentMedia()!.description || ''"/>
      }
      @if (currentMedia()?.description || currentMedia()?.fichier_nom) {
        <div class="lb-info">
          @if (currentMedia()?.description) {
            <div class="lb-desc">{{ currentMedia()!.description }}</div>
          }
          <div class="lb-meta">{{ currentMedia()!.fichier_nom }} · {{ formatSize(currentMedia()!.taille_octets ?? 0) }}</div>
        </div>
      }
    </div>

    <div class="lb-counter">{{ (lbIndex()! + 1) }} / {{ medias().length }}</div>
  </div>
}
  `,
})
export class MediaGalleryComponent implements OnInit, OnChanges {
  @Input() entityType!: 'champ' | 'culture';
  @Input() entityId!: number;
  @Input() canEdit = false;

  private api  = inject(ApiService);
  private notif = inject(NotificationService);

  loading         = signal(true);
  uploading       = signal(false);
  uploadProgress  = signal(0);
  medias          = signal<Media[]>([]);
  pendingFile     = signal<File | null>(null);
  pendingDescription = signal('');
  dragging        = signal(false);
  lbIndex         = signal<number | null>(null);

  currentMedia = computed(() => {
    const i = this.lbIndex();
    return i !== null ? this.medias()[i] ?? null : null;
  });

  ngOnInit(): void { this.loadMedias(); }
  ngOnChanges(): void { this.loadMedias(); }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (this.lbIndex() === null) return;
    if (e.key === 'ArrowRight') this.lbNext();
    if (e.key === 'ArrowLeft')  this.lbPrev();
    if (e.key === 'Escape')     this.closeLightbox();
  }

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

  onFileSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) { this.pendingFile.set(file); this.pendingDescription.set(''); }
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) { this.pendingFile.set(file); this.pendingDescription.set(''); }
  }

  cancelUpload(): void { this.pendingFile.set(null); this.pendingDescription.set(''); }

  upload(): void {
    const file = this.pendingFile();
    if (!file) return;
    const formData = new FormData();
    formData.append('fichier', file);
    if (this.pendingDescription()) formData.append('description', this.pendingDescription());

    this.uploading.set(true);
    this.uploadProgress.set(10);

    // Simulate progress while request is pending
    const ticker = setInterval(() => {
      if (this.uploadProgress() < 85) this.uploadProgress.update(v => v + 8);
    }, 300);

    const path = this.entityType === 'champ'
      ? `/api/champs/${this.entityId}/medias`
      : `/api/cultures/${this.entityId}/medias`;

    this.api.postFormData<Media>(path, formData).subscribe({
      next: media => {
        clearInterval(ticker);
        this.uploadProgress.set(100);
        setTimeout(() => {
          this.medias.update(list => [media, ...list]);
          this.pendingFile.set(null);
          this.pendingDescription.set('');
          this.uploading.set(false);
          this.uploadProgress.set(0);
          this.notif.success('Média ajouté avec succès.');
        }, 300);
      },
      error: err => {
        clearInterval(ticker);
        this.uploading.set(false);
        this.uploadProgress.set(0);
        this.notif.error(err.error?.message || 'Erreur lors de l\'envoi.');
      },
    });
  }

  deleteMedia(media: Media, event: Event): void {
    event.stopPropagation();
    if (!confirm('Supprimer ce média définitivement ?')) return;
    this.api.delete(`/api/medias/${media.id}`).subscribe({
      next: () => {
        this.medias.update(list => list.filter(m => m.id !== media.id));
        if (this.lbIndex() !== null) this.closeLightbox();
        this.notif.success('Média supprimé.');
      },
      error: err => this.notif.error(err.error?.message || 'Erreur lors de la suppression.'),
    });
  }

  openLightbox(i: number): void { this.lbIndex.set(i); }
  closeLightbox(): void { this.lbIndex.set(null); }
  lbPrev(e?: Event): void { e?.stopPropagation(); this.lbIndex.update(i => i !== null && i > 0 ? i - 1 : i); }
  lbNext(e?: Event): void { e?.stopPropagation(); this.lbIndex.update(i => i !== null && i < this.medias().length - 1 ? i + 1 : i); }

  formatSize(bytes: number): string {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }
}

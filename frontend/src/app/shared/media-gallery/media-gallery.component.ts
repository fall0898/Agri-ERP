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
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Mono:wght@400;500&display=swap');

    :host { display: block; }

    /* ── tokens ─────────────────────────────────────── */
    .gal-root {
      --sand:   #faf8f4;
      --earth:  #2a1e14;
      --forest: #1b3d2a;
      --moss:   #3d6b4f;
      --amber:  #c07c2a;
      --smoke:  #a09488;
      --border: #e8e2d9;
      --radius: 16px;
      font-family: 'DM Mono', monospace;
    }

    /* ── header ─────────────────────────────────────── */
    .gal-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 20px;
      gap: 12px;
    }
    .gal-title-block {}
    .gal-title {
      font-family: 'Fraunces', Georgia, serif;
      font-style: italic;
      font-weight: 300;
      font-size: 22px;
      color: var(--earth);
      line-height: 1.1;
      letter-spacing: -0.3px;
      margin: 0 0 4px;
    }
    .gal-subtitle {
      font-size: 11px;
      color: var(--smoke);
      letter-spacing: .5px;
      text-transform: uppercase;
    }
    .btn-ajouter {
      display: flex; align-items: center; gap: 6px;
      font-family: 'DM Mono', monospace;
      font-size: 11px; font-weight: 500;
      padding: 9px 16px;
      border-radius: 10px; border: 1.5px solid var(--forest);
      background: var(--forest); color: #fff;
      cursor: pointer; white-space: nowrap;
      transition: background .15s, transform .1s, box-shadow .15s;
      position: relative; overflow: hidden;
      letter-spacing: .3px;
    }
    .btn-ajouter input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .btn-ajouter:hover { background: #0f2a1c; transform: translateY(-1px); box-shadow: 0 4px 14px rgba(27,61,42,.25); }

    /* ── filter tabs ─────────────────────────────────── */
    .filter-tabs {
      display: flex; gap: 0; margin-bottom: 16px;
      background: var(--border); border-radius: 10px; padding: 3px;
    }
    .tab {
      flex: 1; padding: 7px 0; border: none; background: transparent;
      font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500;
      color: var(--smoke); cursor: pointer; border-radius: 8px;
      letter-spacing: .4px; text-transform: uppercase;
      transition: background .15s, color .15s;
    }
    .tab.active {
      background: white; color: var(--forest);
      box-shadow: 0 1px 4px rgba(0,0,0,.1);
    }
    .tab-count {
      display: inline-flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; border-radius: 50%;
      font-size: 9px; font-weight: 500; margin-left: 5px;
      background: rgba(0,0,0,.06); vertical-align: middle;
    }
    .tab.active .tab-count { background: rgba(27,61,42,.12); color: var(--forest); }

    /* ── upload zone ─────────────────────────────────── */
    .upload-zone {
      border: 2px dashed var(--border);
      border-radius: var(--radius);
      padding: 44px 24px;
      text-align: center;
      cursor: pointer;
      background: var(--sand);
      position: relative;
      transition: border-color .2s, background .2s;
      margin-bottom: 16px;
    }
    .upload-zone.drag-over {
      border-color: var(--moss);
      background: #f0f6f2;
    }
    .upload-zone input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .upload-icon-wrap {
      width: 60px; height: 60px; border-radius: 18px;
      background: linear-gradient(135deg, #e8f2ec 0%, #d4e8db 100%);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
      box-shadow: 0 2px 8px rgba(27,61,42,.12);
    }
    .upload-title {
      font-family: 'Fraunces', Georgia, serif;
      font-style: italic; font-weight: 300; font-size: 17px;
      color: var(--earth); margin-bottom: 6px;
    }
    .upload-sub {
      font-size: 11px; color: var(--smoke); letter-spacing: .3px;
    }
    .upload-limit {
      display: inline-block; margin-top: 12px;
      font-size: 10px; color: var(--smoke);
      background: var(--border); padding: 3px 10px; border-radius: 20px;
      letter-spacing: .3px;
    }

    /* ── pending file card ─────────────────────────── */
    .pending-card {
      background: white;
      border: 1.5px solid #c5dece;
      border-radius: var(--radius);
      padding: 18px;
      margin-bottom: 16px;
      box-shadow: 0 2px 12px rgba(27,61,42,.06);
    }
    .pending-preview {
      width: 100%; aspect-ratio: 16/7;
      border-radius: 10px; overflow: hidden;
      background: var(--border); margin-bottom: 14px;
      position: relative;
    }
    .pending-preview img { width: 100%; height: 100%; object-fit: cover; }
    .pending-preview-icon {
      width: 100%; height: 100%; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 8px;
      color: var(--smoke);
    }
    .pending-preview-icon span {
      font-size: 11px; letter-spacing: .3px;
    }
    .pending-meta {
      display: flex; align-items: center; gap: 10px; margin-bottom: 14px;
    }
    .pending-badge {
      font-size: 10px; font-weight: 500; padding: 3px 9px;
      border-radius: 20px; letter-spacing: .4px; text-transform: uppercase;
    }
    .pending-badge.photo { background: #e8f2ec; color: var(--forest); }
    .pending-badge.video { background: #fef3e2; color: var(--amber); }
    .pending-name {
      font-size: 12px; color: var(--earth); overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap; flex: 1;
    }
    .pending-size { font-size: 11px; color: var(--smoke); white-space: nowrap; }
    .pending-input {
      width: 100%; border: 1.5px solid var(--border);
      border-radius: 10px; padding: 10px 14px;
      font-size: 13px; font-family: 'DM Mono', monospace;
      color: var(--earth); background: var(--sand);
      outline: none; margin-bottom: 14px;
      box-sizing: border-box;
    }
    .pending-input:focus { border-color: var(--moss); box-shadow: 0 0 0 3px rgba(61,107,79,.1); }
    .pending-input::placeholder { color: var(--smoke); }
    .pending-actions { display: flex; gap: 10px; }
    .btn-cancel {
      flex: 1; padding: 10px; border-radius: 10px;
      border: 1.5px solid var(--border); background: white;
      font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500;
      color: var(--smoke); cursor: pointer;
      transition: border-color .15s, color .15s;
    }
    .btn-cancel:hover { border-color: var(--smoke); color: var(--earth); }
    .btn-send {
      flex: 2; padding: 10px; border-radius: 10px;
      border: none; background: var(--forest); color: white;
      font-family: 'DM Mono', monospace; font-size: 12px; font-weight: 500;
      cursor: pointer; transition: background .15s;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .btn-send:hover:not(:disabled) { background: #0f2a1c; }
    .btn-send:disabled { opacity: .5; cursor: not-allowed; }

    /* ── progress bar ─────────────────────────────────── */
    .prog-wrap { margin-bottom: 14px; }
    .prog-row { display: flex; justify-content: space-between; font-size: 11px; color: var(--smoke); margin-bottom: 6px; }
    .prog-track { height: 4px; background: var(--border); border-radius: 99px; overflow: hidden; }
    .prog-fill { height: 100%; background: var(--forest); border-radius: 99px; transition: width .3s ease; }

    /* ── gallery grid ─────────────────────────────────── */
    .grid-wrap { margin-top: 4px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    @media (min-width: 480px) {
      .grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
    }

    .grid-item {
      position: relative; border-radius: 12px; overflow: hidden;
      background: var(--border); cursor: pointer;
      aspect-ratio: 1;
      animation: grid-in .35s ease both;
    }
    @keyframes grid-in { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: scale(1); } }

    /* First item: big on desktop */
    @media (min-width: 480px) {
      .grid-item:first-child { grid-column: span 2; aspect-ratio: 2/1; }
    }

    .grid-item img, .grid-item video {
      width: 100%; height: 100%; object-fit: cover;
      display: block; transition: transform .3s ease;
    }
    .grid-item:hover img, .grid-item:hover video { transform: scale(1.05); }

    /* overlay */
    .grid-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(180deg, transparent 40%, rgba(26,30,20,.7) 100%);
      opacity: 0; transition: opacity .22s;
      display: flex; flex-direction: column; justify-content: flex-end;
      padding: 10px;
    }
    .grid-item:hover .grid-overlay { opacity: 1; }
    .grid-overlay-desc {
      color: rgba(255,255,255,.92); font-size: 11px;
      line-height: 1.4; margin-bottom: 2px;
    }
    .grid-overlay-meta { color: rgba(255,255,255,.5); font-size: 10px; }

    /* type badge */
    .type-badge {
      position: absolute; top: 8px; left: 8px;
      font-size: 9px; font-weight: 500; padding: 3px 8px;
      border-radius: 20px; letter-spacing: .5px; text-transform: uppercase;
      backdrop-filter: blur(6px);
    }
    .type-badge.photo { background: rgba(255,255,255,.2); color: white; }
    .type-badge.video { background: rgba(192,124,42,.75); color: white; }

    /* del btn */
    .grid-del {
      position: absolute; top: 8px; right: 8px;
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(220,38,38,.8); border: none; cursor: pointer;
      color: white; display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity .15s, transform .15s; transform: scale(.8);
    }
    .grid-item:hover .grid-del { opacity: 1; transform: scale(1); }
    .grid-del:hover { background: #dc2626; }

    /* ── skeleton ─────────────────────────────────── */
    .skel-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr); gap: 8px;
    }
    @media (min-width: 480px) {
      .skel-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .skel-item:first-child { grid-column: span 2; }
    }
    .skel-item {
      border-radius: 12px;
      background: linear-gradient(90deg, #f0ede8 0%, #e5e0d8 50%, #f0ede8 100%);
      background-size: 200% 100%;
      animation: skel-move 1.6s ease-in-out infinite;
    }
    @keyframes skel-move { from{background-position:-200% 0} to{background-position:200% 0} }

    /* ── empty ─────────────────────────────────────── */
    .empty {
      text-align: center; padding: 52px 20px;
      background: var(--sand); border-radius: var(--radius);
      border: 1.5px dashed var(--border);
    }
    .empty-leaf {
      width: 64px; height: 64px; border-radius: 20px;
      background: linear-gradient(135deg, #e8f2ec, #d4e8db);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 16px;
    }
    .empty-title {
      font-family: 'Fraunces', Georgia, serif;
      font-style: italic; font-weight: 300; font-size: 18px;
      color: var(--earth); margin-bottom: 6px;
    }
    .empty-sub { font-size: 11px; color: var(--smoke); letter-spacing: .3px; }

    /* ── LIGHTBOX ──────────────────────────────────── */
    .lb-backdrop {
      position: fixed; inset: 0;
      background: rgba(20,16,10,.96);
      z-index: 9999;
      display: flex; flex-direction: column;
      animation: lb-fade .18s ease;
    }
    @keyframes lb-fade { from{opacity:0} to{opacity:1} }

    /* top bar */
    .lb-topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 20px; flex-shrink: 0;
    }
    .lb-counter {
      font-size: 11px; color: rgba(255,255,255,.4); letter-spacing: .5px;
    }
    .lb-close {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,.08); border: none;
      color: rgba(255,255,255,.7); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .lb-close:hover { background: rgba(255,255,255,.16); }

    /* main image area */
    .lb-main {
      flex: 1; display: flex; align-items: center; justify-content: center;
      position: relative; padding: 0 60px; min-height: 0;
    }
    .lb-media {
      max-height: 100%; max-width: 100%;
      object-fit: contain; border-radius: 8px;
      animation: lb-img-in .2s ease;
    }
    @keyframes lb-img-in { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }

    .lb-nav-btn {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 42px; height: 42px; border-radius: 50%;
      background: rgba(255,255,255,.1); border: none;
      color: white; cursor: pointer; font-size: 18px;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .lb-nav-btn:hover { background: rgba(255,255,255,.2); }
    .lb-nav-btn:disabled { opacity: .15; cursor: default; }
    .lb-nav-btn.prev { left: 10px; }
    .lb-nav-btn.next { right: 10px; }

    /* info */
    .lb-info {
      flex-shrink: 0; padding: 10px 20px 8px; text-align: center;
    }
    .lb-desc { color: rgba(255,255,255,.8); font-size: 13px; margin-bottom: 3px; }
    .lb-fname { color: rgba(255,255,255,.3); font-size: 10px; letter-spacing: .3px; }

    /* thumbnail strip */
    .lb-strip {
      display: flex; gap: 6px; overflow-x: auto;
      padding: 10px 20px 14px;
      flex-shrink: 0; scrollbar-width: none;
    }
    .lb-strip::-webkit-scrollbar { display: none; }
    .lb-thumb {
      width: 52px; height: 52px; flex-shrink: 0;
      border-radius: 8px; overflow: hidden;
      cursor: pointer; opacity: .4;
      border: 2px solid transparent;
      transition: opacity .15s, border-color .15s;
    }
    .lb-thumb.active { opacity: 1; border-color: rgba(255,255,255,.6); }
    .lb-thumb:hover { opacity: .75; }
    .lb-thumb img, .lb-thumb video {
      width: 100%; height: 100%; object-fit: cover; display: block;
    }
    .lb-thumb-video {
      width: 100%; height: 100%; background: var(--earth);
      display: flex; align-items: center; justify-content: center;
    }
  `],
  template: `
<div class="gal-root">

  <!-- Header -->
  <div class="gal-header">
    <div class="gal-title-block">
      <h3 class="gal-title">Galerie</h3>
      <span class="gal-subtitle">{{ mediaCount() }} média{{ mediaCount() !== 1 ? 's' : '' }}</span>
    </div>
    @if (canEdit && !pendingFile()) {
      <label class="btn-ajouter">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        Ajouter
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" (change)="onFileSelected($event)"/>
      </label>
    }
  </div>

  <!-- Filter tabs (show only when there are medias of both types) -->
  @if (!loading() && medias().length > 0) {
    <div class="filter-tabs">
      <button class="tab" [class.active]="activeFilter() === 'all'" (click)="activeFilter.set('all')">
        Tout <span class="tab-count">{{ medias().length }}</span>
      </button>
      <button class="tab" [class.active]="activeFilter() === 'photo'" (click)="activeFilter.set('photo')">
        Photos <span class="tab-count">{{ photoCount() }}</span>
      </button>
      <button class="tab" [class.active]="activeFilter() === 'video'" (click)="activeFilter.set('video')">
        Vidéos <span class="tab-count">{{ videoCount() }}</span>
      </button>
    </div>
  }

  <!-- Pending file card -->
  @if (pendingFile()) {
    <div class="pending-card">
      <!-- Preview -->
      <div class="pending-preview">
        @if (previewUrl() && !pendingFile()!.type.startsWith('video')) {
          <img [src]="previewUrl()!" [alt]="pendingFile()!.name"/>
        } @else {
          <div class="pending-preview-icon">
            <svg width="28" height="28" fill="none" stroke="#a09488" stroke-width="1.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
            <span>{{ pendingFile()!.name }}</span>
          </div>
        }
      </div>
      <!-- Meta -->
      <div class="pending-meta">
        <span class="pending-badge" [class.photo]="!pendingFile()!.type.startsWith('video')" [class.video]="pendingFile()!.type.startsWith('video')">
          {{ pendingFile()!.type.startsWith('video') ? 'vidéo' : 'photo' }}
        </span>
        <span class="pending-name">{{ pendingFile()!.name }}</span>
        <span class="pending-size">{{ formatSize(pendingFile()!.size) }}</span>
      </div>
      <!-- Progress or form -->
      @if (uploading()) {
        <div class="prog-wrap">
          <div class="prog-row">
            <span>Envoi en cours…</span>
            <span>{{ uploadProgress() }}%</span>
          </div>
          <div class="prog-track">
            <div class="prog-fill" [style.width.%]="uploadProgress()"></div>
          </div>
        </div>
      } @else {
        <input class="pending-input" type="text" placeholder="Description (optionnel)"
               [value]="pendingDescription()"
               (input)="pendingDescription.set($any($event.target).value)"/>
      }
      <div class="pending-actions">
        <button class="btn-cancel" (click)="cancelUpload()" [disabled]="uploading()">Annuler</button>
        <button class="btn-send" (click)="upload()" [disabled]="uploading()">
          @if (uploading()) {
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" style="animation:spin .8s linear infinite"><path d="M12 2a10 10 0 0 1 10 10"/></svg>
            Envoi…
          } @else {
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Envoyer
          }
        </button>
      </div>
    </div>
  }

  <!-- Drop zone (empty + can edit) -->
  @if (!pendingFile() && !loading() && !medias().length && canEdit) {
    <label class="upload-zone" [class.drag-over]="dragging()"
           (dragover)="$event.preventDefault(); dragging.set(true)"
           (dragleave)="dragging.set(false)"
           (drop)="onDrop($event)">
      <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" (change)="onFileSelected($event)"/>
      <div class="upload-icon-wrap">
        <svg width="26" height="26" fill="none" stroke="#3d6b4f" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
      <div class="upload-title">Glissez vos photos ici</div>
      <p class="upload-sub">ou cliquez pour parcourir votre appareil</p>
      <span class="upload-limit">JPG · PNG · WebP · MP4 — max 50 Mo</span>
    </label>
  }

  <!-- Skeleton -->
  @if (loading()) {
    <div class="skel-grid">
      <div class="skel-item" style="aspect-ratio:2/1"></div>
      <div class="skel-item" style="aspect-ratio:1"></div>
      <div class="skel-item" style="aspect-ratio:1"></div>
      <div class="skel-item" style="aspect-ratio:1"></div>
      <div class="skel-item" style="aspect-ratio:1"></div>
    </div>
  }

  <!-- Grid -->
  @if (!loading() && filtered().length) {
    <div class="grid-wrap">
      <div class="grid">
        @for (m of filtered(); track m.id; let i = $index) {
          <div class="grid-item"
               [style.animation-delay]="(i * 40) + 'ms'"
               (click)="openLightbox(i)">

            <span class="type-badge" [class.photo]="m.type === 'photo'" [class.video]="m.type === 'video'">
              {{ m.type === 'video' ? '▶ vidéo' : 'photo' }}
            </span>

            @if (m.type === 'video') {
              <video [src]="m.fichier_url" preload="metadata" style="pointer-events:none"></video>
            } @else {
              <img [src]="m.fichier_url" [alt]="m.description || m.fichier_nom" loading="lazy"/>
            }

            <div class="grid-overlay">
              @if (m.description) {
                <div class="grid-overlay-desc">{{ m.description }}</div>
              }
              @if (m.date_prise) {
                <div class="grid-overlay-meta">{{ formatDate(m.date_prise) }}</div>
              }
            </div>

            @if (canEdit) {
              <button class="grid-del" (click)="deleteMedia(m, $event)" title="Supprimer">
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            }
          </div>
        }
      </div>
    </div>
  }

  <!-- Empty (read-only) -->
  @if (!loading() && !medias().length && !canEdit && !pendingFile()) {
    <div class="empty">
      <div class="empty-leaf">
        <svg width="28" height="28" fill="none" stroke="#3d6b4f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
      <div class="empty-title">Aucune photo</div>
      <p class="empty-sub">Aucun média n'a encore été ajouté</p>
    </div>
  }

</div>

<!-- ═══════════════════ LIGHTBOX ═══════════════════ -->
@if (lbIndex() !== null && filtered().length) {
  <div class="lb-backdrop" (click)="closeLightbox()">

    <!-- Top bar -->
    <div class="lb-topbar" (click)="$event.stopPropagation()">
      <span class="lb-counter">{{ (lbIndex()! + 1) }} / {{ filtered().length }}</span>
      <button class="lb-close" (click)="closeLightbox()">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Media -->
    <div class="lb-main" (click)="$event.stopPropagation()">
      <button class="lb-nav-btn prev" (click)="lbPrev()" [disabled]="lbIndex() === 0">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      @if (currentMedia()?.type === 'video') {
        <video class="lb-media" [src]="currentMedia()!.fichier_url" controls autoplay></video>
      } @else {
        <img class="lb-media" [src]="currentMedia()!.fichier_url" [alt]="currentMedia()!.description || ''"/>
      }

      <button class="lb-nav-btn next" (click)="lbNext()" [disabled]="lbIndex() === filtered().length - 1">
        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>

    <!-- Info -->
    @if (currentMedia()?.description || currentMedia()?.fichier_nom) {
      <div class="lb-info" (click)="$event.stopPropagation()">
        @if (currentMedia()?.description) {
          <div class="lb-desc">{{ currentMedia()!.description }}</div>
        }
        <div class="lb-fname">{{ currentMedia()!.fichier_nom }} · {{ formatSize(currentMedia()!.taille_octets ?? 0) }}</div>
      </div>
    }

    <!-- Thumbnail strip -->
    <div class="lb-strip" (click)="$event.stopPropagation()">
      @for (m of filtered(); track m.id; let i = $index) {
        <div class="lb-thumb" [class.active]="lbIndex() === i" (click)="lbIndex.set(i)">
          @if (m.type === 'video') {
            <div class="lb-thumb-video">
              <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg>
            </div>
          } @else {
            <img [src]="m.fichier_url" [alt]="m.fichier_nom" loading="lazy"/>
          }
        </div>
      }
    </div>

  </div>
}

<style>
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
  `,
})
export class MediaGalleryComponent implements OnInit, OnChanges {
  @Input() entityType!: 'champ' | 'culture';
  @Input() entityId!: number;
  @Input() canEdit = false;

  private api   = inject(ApiService);
  private notif = inject(NotificationService);

  loading          = signal(true);
  uploading        = signal(false);
  uploadProgress   = signal(0);
  medias           = signal<Media[]>([]);
  pendingFile      = signal<File | null>(null);
  pendingDescription = signal('');
  previewUrl       = signal<string | null>(null);
  dragging         = signal(false);
  lbIndex          = signal<number | null>(null);
  activeFilter     = signal<'all' | 'photo' | 'video'>('all');

  filtered = computed(() => {
    const f = this.activeFilter();
    return f === 'all' ? this.medias() : this.medias().filter(m => m.type === f);
  });

  mediaCount  = computed(() => this.medias().length);
  photoCount  = computed(() => this.medias().filter(m => m.type === 'photo').length);
  videoCount  = computed(() => this.medias().filter(m => m.type === 'video').length);

  currentMedia = computed(() => {
    const i = this.lbIndex();
    return i !== null ? this.filtered()[i] ?? null : null;
  });

  ngOnInit(): void  { this.loadMedias(); }
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
    if (!file) return;
    this.pendingFile.set(file);
    this.pendingDescription.set('');
    if (file.type.startsWith('image')) {
      const reader = new FileReader();
      reader.onload = ev => this.previewUrl.set(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      this.previewUrl.set(null);
    }
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      this.pendingFile.set(file);
      this.pendingDescription.set('');
      if (file.type.startsWith('image')) {
        const reader = new FileReader();
        reader.onload = ev => this.previewUrl.set(ev.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        this.previewUrl.set(null);
      }
    }
  }

  cancelUpload(): void {
    this.pendingFile.set(null);
    this.pendingDescription.set('');
    this.previewUrl.set(null);
  }

  upload(): void {
    const file = this.pendingFile();
    if (!file) return;
    const fd = new FormData();
    fd.append('fichier', file);
    if (this.pendingDescription()) fd.append('description', this.pendingDescription());

    this.uploading.set(true);
    this.uploadProgress.set(10);
    const ticker = setInterval(() => {
      if (this.uploadProgress() < 82) this.uploadProgress.update(v => v + 7);
    }, 350);

    const path = this.entityType === 'champ'
      ? `/api/champs/${this.entityId}/medias`
      : `/api/cultures/${this.entityId}/medias`;

    this.api.postFormData<Media>(path, fd).subscribe({
      next: media => {
        clearInterval(ticker);
        this.uploadProgress.set(100);
        setTimeout(() => {
          this.medias.update(list => [media, ...list]);
          this.cancelUpload();
          this.uploading.set(false);
          this.uploadProgress.set(0);
          this.notif.success('Média ajouté avec succès.');
        }, 350);
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
  closeLightbox(): void         { this.lbIndex.set(null); }
  lbPrev(): void { this.lbIndex.update(i => (i !== null && i > 0) ? i - 1 : i); }
  lbNext(): void { this.lbIndex.update(i => (i !== null && i < this.filtered().length - 1) ? i + 1 : i); }

  formatSize(bytes: number): string {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

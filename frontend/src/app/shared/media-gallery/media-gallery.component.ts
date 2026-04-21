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
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400;1,600&family=DM+Sans:wght@300;400;500&display=swap');

    :host { display: block; font-family: 'DM Sans', sans-serif; }

    * { box-sizing: border-box; }

    /* ── tokens ── */
    :host {
      --bg:        #fafaf8;
      --surface:   #ffffff;
      --border:    #e8e4de;
      --border-strong: #c8c2b8;
      --text:      #1a1714;
      --muted:     #8a857e;
      --forest:    #1a3828;
      --forest-lt: #264d38;
      --moss:      #4a7c5e;
      --amber:     #b5712a;
      --danger:    #c0392b;
      --radius:    12px;
    }

    /* ── header ── */
    .g-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 20px;
      gap: 12px;
    }
    .g-title-row { display: flex; align-items: baseline; gap: 10px; }
    .g-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-size: 20px;
      font-weight: 400;
      color: var(--text);
      margin: 0;
      line-height: 1;
    }
    .g-count {
      font-size: 11px;
      font-weight: 500;
      color: var(--muted);
      letter-spacing: .6px;
      text-transform: uppercase;
    }
    .btn-add {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      background: var(--forest);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: background .15s, transform .1s;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .btn-add input {
      position: absolute; inset: 0;
      opacity: 0; cursor: pointer; font-size: 0;
    }
    .btn-add:hover { background: var(--forest-lt); transform: translateY(-1px); }

    /* ── filter tabs ── */
    .g-tabs {
      display: flex;
      gap: 2px;
      background: var(--border);
      border-radius: 9px;
      padding: 3px;
      margin-bottom: 16px;
    }
    .g-tab {
      flex: 1;
      padding: 6px 0;
      border: none;
      background: transparent;
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      font-weight: 500;
      color: var(--muted);
      cursor: pointer;
      border-radius: 7px;
      transition: background .15s, color .15s;
      letter-spacing: .2px;
    }
    .g-tab.active {
      background: white;
      color: var(--forest);
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }
    .g-tab-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 17px;
      height: 17px;
      border-radius: 9px;
      font-size: 10px;
      margin-left: 4px;
      background: rgba(0,0,0,.07);
      padding: 0 4px;
      vertical-align: middle;
    }
    .g-tab.active .g-tab-badge {
      background: rgba(26,56,40,.1);
      color: var(--forest);
    }

    /* ── drop zone (empty state) ── */
    .drop-zone {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 20px;
      border: 1.5px dashed var(--border-strong);
      border-radius: var(--radius);
      background: var(--bg);
      text-align: center;
      cursor: pointer;
      position: relative;
      transition: border-color .2s, background .2s;
    }
    .drop-zone:hover, .drop-zone.over {
      border-color: var(--moss);
      background: #f2f7f4;
    }
    .drop-zone input {
      position: absolute; inset: 0;
      opacity: 0; cursor: pointer;
    }
    .dz-icon {
      width: 52px; height: 52px;
      border-radius: 14px;
      background: linear-gradient(135deg, #e4ede9 0%, #d3e4da 100%);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 14px;
      box-shadow: 0 2px 8px rgba(26,56,40,.1);
    }
    .dz-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-size: 16px;
      font-weight: 400;
      color: var(--text);
      margin-bottom: 6px;
    }
    .dz-sub {
      font-size: 12px;
      color: var(--muted);
      line-height: 1.5;
    }
    .dz-formats {
      display: inline-flex;
      gap: 6px;
      margin-top: 14px;
      flex-wrap: wrap;
      justify-content: center;
    }
    .dz-fmt {
      font-size: 10px;
      font-weight: 500;
      padding: 3px 8px;
      border-radius: 20px;
      background: var(--border);
      color: var(--muted);
      letter-spacing: .4px;
      text-transform: uppercase;
    }

    /* ── empty readonly ── */
    .empty-ro {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }
    .empty-ro-icon {
      width: 48px; height: 48px;
      border-radius: 14px;
      background: var(--border);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 12px;
    }
    .empty-ro-text {
      font-size: 13px;
      color: var(--muted);
    }

    /* ── pending upload card ── */
    .upload-card {
      background: #f7faf8;
      border: 1.5px solid #c5dece;
      border-radius: var(--radius);
      overflow: hidden;
      margin-bottom: 16px;
    }
    .upload-preview {
      width: 100%;
      aspect-ratio: 16/7;
      background: var(--border);
      overflow: hidden;
      position: relative;
    }
    .upload-preview img {
      width: 100%; height: 100%; object-fit: cover;
      display: block;
    }
    .upload-preview-ph {
      width: 100%; height: 100%;
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      gap: 8px; color: var(--muted);
    }
    .upload-preview-ph span { font-size: 11px; }
    .upload-body { padding: 14px 16px; }
    .upload-meta {
      display: flex; align-items: center;
      gap: 8px; margin-bottom: 12px;
    }
    .u-type {
      font-size: 10px; font-weight: 600;
      padding: 3px 8px; border-radius: 20px;
      letter-spacing: .5px; text-transform: uppercase;
    }
    .u-type.photo { background: #e0ede6; color: var(--forest); }
    .u-type.video { background: #fdefd9; color: var(--amber); }
    .u-name {
      font-size: 12px; color: var(--text);
      overflow: hidden; text-overflow: ellipsis;
      white-space: nowrap; flex: 1;
    }
    .u-size { font-size: 11px; color: var(--muted); white-space: nowrap; }
    .upload-input {
      width: 100%;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 13px;
      font-family: 'DM Sans', sans-serif;
      color: var(--text);
      background: white;
      outline: none;
      margin-bottom: 12px;
      transition: border-color .15s, box-shadow .15s;
    }
    .upload-input:focus {
      border-color: var(--moss);
      box-shadow: 0 0 0 3px rgba(74,124,94,.1);
    }
    .upload-input::placeholder { color: var(--muted); }
    .upload-progress { margin-bottom: 12px; }
    .u-prog-row {
      display: flex; justify-content: space-between;
      font-size: 11px; color: var(--muted); margin-bottom: 6px;
    }
    .u-prog-track {
      height: 3px; background: var(--border);
      border-radius: 99px; overflow: hidden;
    }
    .u-prog-fill {
      height: 100%; background: var(--forest);
      border-radius: 99px; transition: width .3s ease;
    }
    .upload-actions { display: flex; gap: 8px; }
    .btn-cancel {
      flex: 1; padding: 9px;
      border-radius: 8px;
      border: 1.5px solid var(--border);
      background: white;
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; font-weight: 500;
      color: var(--muted); cursor: pointer;
      transition: border-color .15s, color .15s;
    }
    .btn-cancel:hover { border-color: var(--muted); color: var(--text); }
    .btn-send {
      flex: 2; padding: 9px;
      border-radius: 8px;
      border: none;
      background: var(--forest); color: white;
      font-family: 'DM Sans', sans-serif;
      font-size: 12px; font-weight: 500;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center; gap: 6px;
      transition: background .15s;
    }
    .btn-send:hover:not(:disabled) { background: var(--forest-lt); }
    .btn-send:disabled { opacity: .5; cursor: not-allowed; }

    /* ── grid ── */
    .g-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    @media (min-width: 440px) {
      .g-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .g-item:first-child { grid-column: span 2; aspect-ratio: 16/9 !important; }
    }
    .g-item {
      position: relative;
      border-radius: 10px;
      overflow: hidden;
      background: var(--border);
      cursor: pointer;
      aspect-ratio: 1;
      animation: g-in .3s ease both;
    }
    @keyframes g-in { from { opacity: 0; transform: scale(.95); } to { opacity: 1; transform: scale(1); } }
    .g-item img, .g-item video {
      width: 100%; height: 100%;
      object-fit: cover; display: block;
      transition: transform .3s ease;
    }
    .g-item:hover img, .g-item:hover video { transform: scale(1.05); }

    .g-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(180deg, transparent 45%, rgba(10,16,12,.72) 100%);
      opacity: 0; transition: opacity .2s;
      display: flex; flex-direction: column;
      justify-content: flex-end; padding: 10px;
    }
    .g-item:hover .g-overlay { opacity: 1; }
    .g-ov-desc { color: rgba(255,255,255,.9); font-size: 11px; line-height: 1.4; margin-bottom: 2px; }
    .g-ov-date { color: rgba(255,255,255,.45); font-size: 10px; }

    .g-badge {
      position: absolute; top: 7px; left: 7px;
      font-size: 9px; font-weight: 600;
      padding: 3px 7px; border-radius: 20px;
      text-transform: uppercase; letter-spacing: .5px;
      backdrop-filter: blur(8px);
    }
    .g-badge.photo { background: rgba(255,255,255,.22); color: white; }
    .g-badge.video { background: rgba(181,113,42,.8); color: white; }

    .g-play {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 36px; height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,.25);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      pointer-events: none;
    }

    .g-del {
      position: absolute; top: 7px; right: 7px;
      width: 26px; height: 26px; border-radius: 50%;
      background: rgba(192,57,43,.85); border: none;
      color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transform: scale(.8);
      transition: opacity .15s, transform .15s;
    }
    .g-item:hover .g-del { opacity: 1; transform: scale(1); }
    .g-del:hover { background: var(--danger); }

    /* ── skeleton ── */
    .skel { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    @media (min-width: 440px) {
      .skel { grid-template-columns: repeat(3, 1fr); gap: 10px; }
      .skel-i:first-child { grid-column: span 2; aspect-ratio: 16/9 !important; }
    }
    .skel-i {
      border-radius: 10px; aspect-ratio: 1;
      background: linear-gradient(90deg, #eeebe6 0%, #e4dfd8 50%, #eeebe6 100%);
      background-size: 200% 100%;
      animation: skel .15s ease-in-out infinite;
    }
    @keyframes skel { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

    /* ── lightbox ── */
    .lb {
      position: fixed; inset: 0;
      background: rgba(10,12,10,.97);
      z-index: 9999;
      display: flex; flex-direction: column;
      animation: lb-in .18s ease;
    }
    @keyframes lb-in { from{opacity:0} to{opacity:1} }
    .lb-bar {
      display: flex; align-items: center;
      justify-content: space-between;
      padding: 12px 16px; flex-shrink: 0;
    }
    .lb-count { font-size: 11px; color: rgba(255,255,255,.35); letter-spacing: .5px; }
    .lb-x {
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(255,255,255,.07); border: none;
      color: rgba(255,255,255,.65); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .lb-x:hover { background: rgba(255,255,255,.14); }
    .lb-stage {
      flex: 1; display: flex;
      align-items: center; justify-content: center;
      position: relative; padding: 0 52px; min-height: 0;
    }
    .lb-media {
      max-height: 100%; max-width: 100%;
      object-fit: contain; border-radius: 6px;
      animation: lb-img .18s ease;
    }
    @keyframes lb-img { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
    .lb-nav {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 38px; height: 38px; border-radius: 50%;
      background: rgba(255,255,255,.09); border: none;
      color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .lb-nav:hover { background: rgba(255,255,255,.18); }
    .lb-nav:disabled { opacity: .15; cursor: default; }
    .lb-nav.p { left: 8px; }
    .lb-nav.n { right: 8px; }
    .lb-info {
      flex-shrink: 0; padding: 8px 16px 6px;
      text-align: center;
    }
    .lb-info-desc { color: rgba(255,255,255,.75); font-size: 12px; margin-bottom: 3px; }
    .lb-info-name { color: rgba(255,255,255,.3); font-size: 10px; letter-spacing: .3px; }
    .lb-strip {
      display: flex; gap: 5px;
      overflow-x: auto; padding: 8px 16px 14px;
      flex-shrink: 0; scrollbar-width: none;
    }
    .lb-strip::-webkit-scrollbar { display: none; }
    .lb-th {
      width: 48px; height: 48px; flex-shrink: 0;
      border-radius: 6px; overflow: hidden;
      cursor: pointer; opacity: .35;
      border: 2px solid transparent;
      transition: opacity .15s, border-color .15s;
    }
    .lb-th.on { opacity: 1; border-color: rgba(255,255,255,.55); }
    .lb-th:hover:not(.on) { opacity: .6; }
    .lb-th img, .lb-th video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .lb-th-vid {
      width: 100%; height: 100%; background: #1a1a18;
      display: flex; align-items: center; justify-content: center;
    }
  `],
  template: `
<div>

  <!-- Header -->
  <div class="g-header">
    <div class="g-title-row">
      <h3 class="g-title">Galerie</h3>
      @if (!loading()) {
        <span class="g-count">{{ medias().length }} média{{ medias().length !== 1 ? 's' : '' }}</span>
      }
    </div>
    @if (canEdit && !pendingFile()) {
      <label class="btn-add">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
        Ajouter
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" (change)="onFileSelected($event)"/>
      </label>
    }
  </div>

  <!-- Filter tabs — only when items exist -->
  @if (!loading() && medias().length > 0) {
    <div class="g-tabs">
      <button class="g-tab" [class.active]="activeFilter() === 'all'" (click)="activeFilter.set('all')">
        Tout <span class="g-tab-badge">{{ medias().length }}</span>
      </button>
      <button class="g-tab" [class.active]="activeFilter() === 'photo'" (click)="activeFilter.set('photo')">
        Photos <span class="g-tab-badge">{{ photoCount() }}</span>
      </button>
      <button class="g-tab" [class.active]="activeFilter() === 'video'" (click)="activeFilter.set('video')">
        Vidéos <span class="g-tab-badge">{{ videoCount() }}</span>
      </button>
    </div>
  }

  <!-- Pending upload card -->
  @if (pendingFile()) {
    <div class="upload-card">
      <!-- Preview -->
      <div class="upload-preview">
        @if (previewUrl() && !pendingFile()!.type.startsWith('video')) {
          <img [src]="previewUrl()!" [alt]="pendingFile()!.name"/>
        } @else {
          <div class="upload-preview-ph">
            <svg width="28" height="28" fill="none" stroke="#8a857e" stroke-width="1.5" stroke-linecap="round" viewBox="0 0 24 24">
              <path d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
            </svg>
            <span>{{ pendingFile()!.name }}</span>
          </div>
        }
      </div>
      <div class="upload-body">
        <div class="upload-meta">
          <span class="u-type" [class.photo]="!pendingFile()!.type.startsWith('video')" [class.video]="pendingFile()!.type.startsWith('video')">
            {{ pendingFile()!.type.startsWith('video') ? 'Vidéo' : 'Photo' }}
          </span>
          <span class="u-name">{{ pendingFile()!.name }}</span>
          <span class="u-size">{{ formatSize(pendingFile()!.size) }}</span>
        </div>
        @if (uploading()) {
          <div class="upload-progress">
            <div class="u-prog-row">
              <span>Envoi en cours…</span>
              <span>{{ uploadProgress() }}%</span>
            </div>
            <div class="u-prog-track">
              <div class="u-prog-fill" [style.width.%]="uploadProgress()"></div>
            </div>
          </div>
        } @else {
          <input class="upload-input" type="text" placeholder="Description (optionnel)"
                 [value]="pendingDescription()"
                 (input)="pendingDescription.set($any($event.target).value)"/>
        }
        <div class="upload-actions">
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
    </div>
  }

  <!-- Skeleton -->
  @if (loading()) {
    <div class="skel">
      <div class="skel-i" style="aspect-ratio:16/9"></div>
      <div class="skel-i"></div>
      <div class="skel-i"></div>
      <div class="skel-i"></div>
      <div class="skel-i"></div>
    </div>
  }

  <!-- Empty — can edit → drop zone -->
  @if (!loading() && !pendingFile() && medias().length === 0 && canEdit) {
    <label class="drop-zone" [class.over]="dragging()"
           (dragover)="$event.preventDefault(); dragging.set(true)"
           (dragleave)="dragging.set(false)"
           (drop)="onDrop($event)">
      <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4" (change)="onFileSelected($event)"/>
      <div class="dz-icon">
        <svg width="22" height="22" fill="none" stroke="#4a7c5e" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
      <div class="dz-title">Glissez vos photos ici</div>
      <p class="dz-sub">ou cliquez pour choisir un fichier</p>
      <div class="dz-formats">
        <span class="dz-fmt">JPG</span>
        <span class="dz-fmt">PNG</span>
        <span class="dz-fmt">WebP</span>
        <span class="dz-fmt">MP4</span>
        <span class="dz-fmt">50 Mo max</span>
      </div>
    </label>
  }

  <!-- Empty — read only -->
  @if (!loading() && !pendingFile() && medias().length === 0 && !canEdit) {
    <div class="empty-ro">
      <div class="empty-ro-icon">
        <svg width="22" height="22" fill="none" stroke="#8a857e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="3"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </div>
      <p class="empty-ro-text">Aucun média disponible</p>
    </div>
  }

  <!-- Media grid -->
  @if (!loading() && filtered().length > 0) {
    <div class="g-grid">
      @for (m of filtered(); track m.id; let i = $index) {
        <div class="g-item" [style.animation-delay]="(i * 35) + 'ms'" (click)="openLightbox(i)">

          <span class="g-badge" [class.photo]="m.type === 'photo'" [class.video]="m.type === 'video'">
            {{ m.type === 'video' ? '▶' : '◆' }} {{ m.type }}
          </span>

          @if (m.type === 'video') {
            <video [src]="m.fichier_url" preload="metadata" style="pointer-events:none"></video>
            <div class="g-play">
              <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg>
            </div>
          } @else {
            <img [src]="m.fichier_url" [alt]="m.description || m.fichier_nom" loading="lazy"/>
          }

          <div class="g-overlay">
            @if (m.description) {
              <div class="g-ov-desc">{{ m.description }}</div>
            }
            @if (m.date_prise) {
              <div class="g-ov-date">{{ formatDate(m.date_prise) }}</div>
            }
          </div>

          @if (canEdit) {
            <button class="g-del" (click)="deleteMedia(m, $event)" title="Supprimer">
              <svg width="10" height="10" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          }
        </div>
      }
    </div>
  }

</div>

<!-- ═══ LIGHTBOX ═══ -->
@if (lbIndex() !== null && filtered().length) {
  <div class="lb" (click)="closeLightbox()">
    <div class="lb-bar" (click)="$event.stopPropagation()">
      <span class="lb-count">{{ (lbIndex()! + 1) }} / {{ filtered().length }}</span>
      <button class="lb-x" (click)="closeLightbox()">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <div class="lb-stage" (click)="$event.stopPropagation()">
      <button class="lb-nav p" (click)="lbPrev()" [disabled]="lbIndex() === 0">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      @if (currentMedia()?.type === 'video') {
        <video class="lb-media" [src]="currentMedia()!.fichier_url" controls autoplay></video>
      } @else {
        <img class="lb-media" [src]="currentMedia()!.fichier_url" [alt]="currentMedia()!.description || ''"/>
      }

      <button class="lb-nav n" (click)="lbNext()" [disabled]="lbIndex() === filtered().length - 1">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>

    @if (currentMedia()?.description || currentMedia()?.fichier_nom) {
      <div class="lb-info" (click)="$event.stopPropagation()">
        @if (currentMedia()?.description) {
          <div class="lb-info-desc">{{ currentMedia()!.description }}</div>
        }
        <div class="lb-info-name">{{ currentMedia()!.fichier_nom }} · {{ formatSize(currentMedia()!.taille_octets ?? 0) }}</div>
      </div>
    }

    <div class="lb-strip" (click)="$event.stopPropagation()">
      @for (m of filtered(); track m.id; let i = $index) {
        <div class="lb-th" [class.on]="lbIndex() === i" (click)="lbIndex.set(i)">
          @if (m.type === 'video') {
            <div class="lb-th-vid">
              <svg width="12" height="12" fill="white" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg>
            </div>
          } @else {
            <img [src]="m.fichier_url" [alt]="m.fichier_nom" loading="lazy"/>
          }
        </div>
      }
    </div>
  </div>
}

<style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `,
})
export class MediaGalleryComponent implements OnInit, OnChanges {
  @Input() entityType!: 'champ' | 'culture';
  @Input() entityId!: number;
  @Input() canEdit = false;

  private api   = inject(ApiService);
  private notif = inject(NotificationService);

  loading            = signal(true);
  uploading          = signal(false);
  uploadProgress     = signal(0);
  medias             = signal<Media[]>([]);
  pendingFile        = signal<File | null>(null);
  pendingDescription = signal('');
  previewUrl         = signal<string | null>(null);
  dragging           = signal(false);
  lbIndex            = signal<number | null>(null);
  activeFilter       = signal<'all' | 'photo' | 'video'>('all');

  filtered     = computed(() => {
    const f = this.activeFilter();
    return f === 'all' ? this.medias() : this.medias().filter(m => m.type === f);
  });
  photoCount   = computed(() => this.medias().filter(m => m.type === 'photo').length);
  videoCount   = computed(() => this.medias().filter(m => m.type === 'video').length);
  currentMedia = computed(() => {
    const i = this.lbIndex();
    return i !== null ? this.filtered()[i] ?? null : null;
  });

  ngOnInit():    void { this.loadMedias(); }
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
      error: ()  => this.loading.set(false),
    });
  }

  onFileSelected(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.setFile(file);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging.set(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) this.setFile(file);
  }

  private setFile(file: File): void {
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
    return bytes < 1_048_576
      ? `${(bytes / 1024).toFixed(0)} Ko`
      : `${(bytes / 1_048_576).toFixed(1)} Mo`;
  }

  formatDate(date: string): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

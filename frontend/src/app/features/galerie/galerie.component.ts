import { Component, signal, inject, OnInit, computed, HostListener } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

interface GalerieMedia {
  id: number;
  type: 'photo' | 'video';
  fichier_url: string;
  fichier_path?: string;
  fichier_nom: string;
  taille_octets?: number;
  description?: string;
  date_prise?: string;
  created_at: string;
  culture?: { id: number; nom: string };
  champ?: { id: number; nom: string };
}

@Component({
  selector: 'app-galerie',
  standalone: true,
  imports: [],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Mono:wght@400;500&display=swap');

    :host { display: block; min-height: 100vh; background: #0a0a0a; }

    /* ── tokens ─── */
    .pg {
      --amber:  #c9922a;
      --amber2: #e8b04a;
      --smoke:  rgba(255,255,255,0.35);
      --dim:    rgba(255,255,255,0.12);
      --border: rgba(255,255,255,0.07);
      font-family: 'DM Mono', monospace;
      background: #0a0a0a;
      min-height: 100vh;
    }

    /* ── HERO HEADER ──────────────────────────────── */
    .hero {
      padding: 40px 24px 32px;
      position: relative;
      overflow: hidden;
    }
    @media (min-width: 768px) { .hero { padding: 56px 48px 40px; } }

    .hero::before {
      content: '';
      position: absolute; inset: 0;
      background: radial-gradient(ellipse 80% 60% at 10% 50%, rgba(201,146,42,.07) 0%, transparent 70%),
                  radial-gradient(ellipse 60% 80% at 90% 20%, rgba(255,255,255,.03) 0%, transparent 60%);
      pointer-events: none;
    }

    .hero-inner {
      display: flex; align-items: flex-end; justify-content: space-between;
      gap: 20px; position: relative;
    }

    .hero-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-style: italic; font-weight: 300;
      font-size: clamp(48px, 8vw, 96px);
      color: white; line-height: .9; letter-spacing: -2px;
      margin: 0;
    }
    .hero-title em {
      font-style: normal; color: var(--amber);
    }

    .hero-stats {
      display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
      flex-shrink: 0;
    }
    .stat-pill {
      display: flex; align-items: center; gap: 8px;
      background: var(--border); border: 1px solid rgba(255,255,255,.09);
      border-radius: 99px; padding: 5px 14px 5px 10px;
    }
    .stat-dot { width: 6px; height: 6px; border-radius: 50%; }
    .stat-dot.photo { background: var(--amber); }
    .stat-dot.video { background: #5b8fe8; }
    .stat-dot.all   { background: rgba(255,255,255,.4); }
    .stat-val {
      font-size: 13px; font-weight: 500; color: rgba(255,255,255,.9); letter-spacing: .3px;
    }
    .stat-lbl { font-size: 10px; color: var(--smoke); letter-spacing: .5px; text-transform: uppercase; }

    .hero-sub {
      margin-top: 10px; font-size: 12px; color: var(--smoke);
      letter-spacing: .5px; text-transform: uppercase;
    }

    /* ── FILTER BAR ───────────────────────────────── */
    .filter-bar {
      position: sticky; top: 0; z-index: 50;
      background: rgba(10,10,10,.9); backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border);
      padding: 0 24px;
    }
    @media (min-width: 768px) { .filter-bar { padding: 0 48px; } }

    .filter-inner {
      display: flex; align-items: center; gap: 0;
      overflow-x: auto; scrollbar-width: none;
      border-bottom: 1px solid transparent;
    }
    .filter-inner::-webkit-scrollbar { display: none; }

    .filter-tab {
      flex-shrink: 0;
      padding: 14px 0; margin-right: 28px;
      font-family: 'DM Mono', monospace;
      font-size: 11px; font-weight: 500; letter-spacing: .6px;
      text-transform: uppercase; color: var(--smoke);
      border: none; background: transparent; cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -1px; transition: color .15s, border-color .15s;
    }
    .filter-tab.active { color: var(--amber); border-bottom-color: var(--amber); }
    .filter-tab:hover:not(.active) { color: rgba(255,255,255,.7); }
    .filter-tab .cnt {
      margin-left: 6px; font-size: 9px;
      background: rgba(255,255,255,.08); padding: 1px 6px; border-radius: 99px;
    }
    .filter-tab.active .cnt { background: rgba(201,146,42,.2); color: var(--amber); }

    .filter-sep { width: 1px; height: 20px; background: var(--border); margin: 0 16px; flex-shrink: 0; }

    .source-chip {
      flex-shrink: 0;
      padding: 5px 12px; border-radius: 99px;
      font-family: 'DM Mono', monospace; font-size: 10px; font-weight: 500;
      letter-spacing: .4px; text-transform: uppercase;
      border: 1px solid var(--border); color: var(--smoke);
      background: transparent; cursor: pointer;
      transition: all .15s; margin-right: 8px;
    }
    .source-chip.active {
      background: rgba(201,146,42,.12); border-color: rgba(201,146,42,.3);
      color: var(--amber);
    }
    .source-chip:hover:not(.active) { border-color: rgba(255,255,255,.2); color: rgba(255,255,255,.7); }

    /* ── GRID ─────────────────────────────────────── */
    .grid-section { padding: 24px; }
    @media (min-width: 768px) { .grid-section { padding: 28px 48px; } }

    .masonry {
      columns: 2; column-gap: 10px;
    }
    @media (min-width: 640px)  { .masonry { columns: 3; column-gap: 12px; } }
    @media (min-width: 1024px) { .masonry { columns: 4; column-gap: 14px; } }
    @media (min-width: 1400px) { .masonry { columns: 5; column-gap: 14px; } }

    .m-item {
      break-inside: avoid;
      margin-bottom: 10px;
      border-radius: 10px;
      overflow: hidden;
      position: relative;
      cursor: pointer;
      background: #1a1a1a;
      animation: item-in .45s ease both;
    }
    @media (min-width: 640px) { .m-item { margin-bottom: 12px; border-radius: 12px; } }
    @keyframes item-in { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

    .m-item img, .m-item video {
      width: 100%; display: block;
      transition: transform .4s cubic-bezier(.25,.46,.45,.94);
    }
    .m-item:hover img, .m-item:hover video { transform: scale(1.04); }

    /* overlay */
    .m-overlay {
      position: absolute; inset: 0;
      background: linear-gradient(180deg, transparent 30%, rgba(0,0,0,.85) 100%);
      opacity: 0; transition: opacity .25s;
      display: flex; flex-direction: column; justify-content: flex-end;
      padding: 12px;
    }
    .m-item:hover .m-overlay { opacity: 1; }

    .m-desc {
      color: rgba(255,255,255,.92); font-size: 11px;
      line-height: 1.5; margin-bottom: 3px;
    }
    .m-source {
      color: var(--amber); font-size: 10px; letter-spacing: .3px;
    }
    .m-date {
      color: rgba(255,255,255,.35); font-size: 9px; margin-top: 2px;
    }

    /* badges */
    .m-type {
      position: absolute; top: 8px; left: 8px;
      font-size: 9px; font-weight: 500; padding: 3px 8px;
      border-radius: 99px; letter-spacing: .5px; text-transform: uppercase;
      backdrop-filter: blur(8px);
    }
    .m-type.photo { background: rgba(255,255,255,.15); color: rgba(255,255,255,.8); }
    .m-type.video { background: rgba(91,143,232,.6); color: white; }

    .m-del {
      position: absolute; top: 8px; right: 8px;
      width: 28px; height: 28px; border-radius: 50%;
      background: rgba(220,38,38,.75); border: none; cursor: pointer;
      color: white; display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity .15s, transform .15s;
      transform: scale(.75);
    }
    .m-item:hover .m-del { opacity: 1; transform: scale(1); }
    .m-del:hover { background: #dc2626; }

    /* video play icon */
    .m-play {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      pointer-events: none;
    }
    .m-play-circle {
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(0,0,0,.5); backdrop-filter: blur(4px);
      display: flex; align-items: center; justify-content: center;
      transition: transform .2s;
    }
    .m-item:hover .m-play-circle { transform: scale(1.1); }

    /* ── SKELETON ─────────────────────────────────── */
    .skel-masonry { columns: 2; column-gap: 10px; }
    @media (min-width: 640px)  { .skel-masonry { columns: 3; column-gap: 12px; } }
    @media (min-width: 1024px) { .skel-masonry { columns: 4; column-gap: 14px; } }
    .skel {
      break-inside: avoid; margin-bottom: 10px; border-radius: 10px;
      background: linear-gradient(90deg, #1a1a1a 0%, #242424 50%, #1a1a1a 100%);
      background-size: 200% 100%;
      animation: skel-sh 1.8s ease-in-out infinite;
    }
    @keyframes skel-sh { from{background-position:-200% 0} to{background-position:200% 0} }

    /* ── EMPTY ────────────────────────────────────── */
    .empty {
      display: flex; flex-direction: column; align-items: center;
      justify-content: center; padding: 80px 24px; text-align: center;
    }
    .empty-icon {
      width: 80px; height: 80px; border-radius: 24px;
      background: rgba(255,255,255,.04); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .empty-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-style: italic; font-weight: 300; font-size: 28px;
      color: rgba(255,255,255,.5); margin-bottom: 8px;
    }
    .empty-sub { font-size: 11px; color: rgba(255,255,255,.2); letter-spacing: .5px; }

    /* ── LIGHTBOX ─────────────────────────────────── */
    .lb {
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,.97);
      display: flex; flex-direction: column;
      animation: lb-in .2s ease;
    }
    @keyframes lb-in { from{opacity:0} to{opacity:1} }

    .lb-topbar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 20px; flex-shrink: 0;
      border-bottom: 1px solid rgba(255,255,255,.05);
    }
    .lb-source {
      display: flex; align-items: center; gap: 10px;
    }
    .lb-source-tag {
      font-size: 10px; letter-spacing: .5px; text-transform: uppercase;
      color: var(--amber); background: rgba(201,146,42,.12);
      padding: 3px 10px; border-radius: 99px;
      border: 1px solid rgba(201,146,42,.2);
    }
    .lb-counter { font-size: 11px; color: rgba(255,255,255,.3); letter-spacing: .5px; }
    .lb-close {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,.06); border: none;
      color: rgba(255,255,255,.6); cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .lb-close:hover { background: rgba(255,255,255,.12); }

    .lb-stage {
      flex: 1; display: flex; align-items: center; justify-content: center;
      position: relative; padding: 16px 64px; min-height: 0;
    }
    @media (max-width: 640px) { .lb-stage { padding: 12px 44px; } }

    .lb-media {
      max-height: 100%; max-width: 100%;
      object-fit: contain; border-radius: 6px;
      animation: lb-img .22s ease;
    }
    @keyframes lb-img { from{opacity:0;transform:scale(.96)} to{opacity:1;transform:scale(1)} }

    .lb-nav {
      position: absolute; top: 50%; transform: translateY(-50%);
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,.08); border: none;
      color: white; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s;
    }
    .lb-nav:hover { background: rgba(255,255,255,.16); }
    .lb-nav:disabled { opacity: .15; cursor: default; }
    .lb-nav.prev { left: 12px; }
    .lb-nav.next { right: 12px; }

    .lb-info {
      flex-shrink: 0; padding: 10px 24px 6px; text-align: center;
    }
    .lb-desc { color: rgba(255,255,255,.75); font-size: 13px; margin-bottom: 3px; }
    .lb-meta { color: rgba(255,255,255,.25); font-size: 10px; letter-spacing: .3px; }

    /* thumbnail strip */
    .lb-strip {
      flex-shrink: 0; display: flex; gap: 6px;
      overflow-x: auto; padding: 8px 20px 14px;
      scrollbar-width: none;
    }
    .lb-strip::-webkit-scrollbar { display: none; }
    .lb-thumb {
      width: 48px; height: 48px; flex-shrink: 0; border-radius: 7px;
      overflow: hidden; cursor: pointer; opacity: .3;
      border: 2px solid transparent; transition: opacity .15s, border-color .15s;
    }
    .lb-thumb.on { opacity: 1; border-color: var(--amber); }
    .lb-thumb:hover { opacity: .65; }
    .lb-thumb img, .lb-thumb video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .lb-thumb-vid {
      width: 100%; height: 100%; background: #111;
      display: flex; align-items: center; justify-content: center;
    }

    /* ── upload hint ──────────────────────────────── */
    .upload-hint {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 24px 0;
      font-size: 11px; color: rgba(255,255,255,.25); letter-spacing: .3px;
    }
    @media (min-width: 768px) { .upload-hint { padding: 10px 48px 0; } }
    .upload-hint a {
      color: var(--amber); text-decoration: none; border-bottom: 1px solid rgba(201,146,42,.3);
    }
  `],
  template: `
<div class="pg">

  <!-- ══ HERO ══════════════════════════════════════ -->
  <div class="hero">
    <div class="hero-inner">
      <div>
        <h1 class="hero-title">Ga<em>le</em>rie</h1>
        <p class="hero-sub">Chronique visuelle de vos terres</p>
      </div>
      <div class="hero-stats">
        <div class="stat-pill">
          <span class="stat-dot all"></span>
          <span class="stat-val">{{ total() }}</span>
          <span class="stat-lbl">médias</span>
        </div>
        @if (photoCount()) {
          <div class="stat-pill">
            <span class="stat-dot photo"></span>
            <span class="stat-val">{{ photoCount() }}</span>
            <span class="stat-lbl">photos</span>
          </div>
        }
        @if (videoCount()) {
          <div class="stat-pill">
            <span class="stat-dot video"></span>
            <span class="stat-val">{{ videoCount() }}</span>
            <span class="stat-lbl">vidéos</span>
          </div>
        }
      </div>
    </div>
  </div>

  <!-- ══ FILTER BAR ════════════════════════════════ -->
  @if (!loading() && medias().length > 0) {
    <div class="filter-bar">
      <div class="filter-inner">
        <!-- Type tabs -->
        <button class="filter-tab" [class.active]="typeFilter() === 'all'"
                (click)="typeFilter.set('all')">
          Tout <span class="cnt">{{ total() }}</span>
        </button>
        <button class="filter-tab" [class.active]="typeFilter() === 'photo'"
                (click)="typeFilter.set('photo')">
          Photos <span class="cnt">{{ photoCount() }}</span>
        </button>
        <button class="filter-tab" [class.active]="typeFilter() === 'video'"
                (click)="typeFilter.set('video')">
          Vidéos <span class="cnt">{{ videoCount() }}</span>
        </button>

        @if (sourceChips().length > 0) {
          <div class="filter-sep"></div>
          <!-- Source chips -->
          @for (chip of sourceChips(); track chip.key) {
            <button class="source-chip"
                    [class.active]="sourceFilter() === chip.key"
                    (click)="toggleSource(chip.key)">
              {{ chip.label }}
            </button>
          }
        }
      </div>
    </div>
  }

  <!-- ══ GRID ══════════════════════════════════════ -->
  <div class="grid-section">

    <!-- Skeleton -->
    @if (loading()) {
      <div class="skel-masonry">
        <div class="skel" style="height:180px"></div>
        <div class="skel" style="height:120px"></div>
        <div class="skel" style="height:220px"></div>
        <div class="skel" style="height:150px"></div>
        <div class="skel" style="height:200px"></div>
        <div class="skel" style="height:130px"></div>
        <div class="skel" style="height:170px"></div>
        <div class="skel" style="height:190px"></div>
        <div class="skel" style="height:140px"></div>
        <div class="skel" style="height:210px"></div>
        <div class="skel" style="height:160px"></div>
        <div class="skel" style="height:180px"></div>
      </div>
    }

    <!-- Masonry -->
    @if (!loading() && filtered().length) {
      <div class="masonry">
        @for (m of filtered(); track m.id; let i = $index) {
          <div class="m-item" [style.animation-delay]="(i * 30) + 'ms'" (click)="openLb(i)">

            <span class="m-type" [class.photo]="m.type==='photo'" [class.video]="m.type==='video'">
              {{ m.type === 'video' ? '▶ vidéo' : 'photo' }}
            </span>

            @if (m.type === 'video') {
              <video [src]="m.fichier_url" preload="metadata" style="pointer-events:none"></video>
              <div class="m-play">
                <div class="m-play-circle">
                  <svg width="14" height="14" fill="white" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg>
                </div>
              </div>
            } @else {
              <img [src]="m.fichier_url" [alt]="m.description || m.fichier_nom" loading="lazy"/>
            }

            <div class="m-overlay">
              @if (m.description) { <div class="m-desc">{{ m.description }}</div> }
              <div class="m-source">
                {{ m.champ?.nom ?? m.culture?.nom ?? '—' }}
              </div>
              @if (m.date_prise) {
                <div class="m-date">{{ formatDate(m.date_prise) }}</div>
              }
            </div>

            @if (auth.isAdmin()) {
              <button class="m-del" (click)="del(m, $event)" title="Supprimer">
                <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            }
          </div>
        }
      </div>
    }

    <!-- Empty -->
    @if (!loading() && !medias().length) {
      <div class="empty">
        <div class="empty-icon">
          <svg width="32" height="32" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
        <p class="empty-title">Aucune photo</p>
        <p class="empty-sub">Ajoutez des médias depuis vos champs ou cultures</p>
      </div>
    }

    <!-- No result after filter -->
    @if (!loading() && medias().length && !filtered().length) {
      <div class="empty">
        <div class="empty-icon">
          <svg width="28" height="28" fill="none" stroke="rgba(255,255,255,.2)" stroke-width="1.25" stroke-linecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <p class="empty-title">Aucun résultat</p>
        <p class="empty-sub" style="margin-top:4px">
          <button style="background:none;border:none;color:rgba(201,146,42,.7);cursor:pointer;font-family:inherit;font-size:11px" (click)="resetFilters()">Effacer les filtres</button>
        </p>
      </div>
    }
  </div>

</div>

<!-- ══ LIGHTBOX ════════════════════════════════════════ -->
@if (lbIdx() !== null && filtered().length) {
  <div class="lb" (click)="closeLb()">

    <!-- Topbar -->
    <div class="lb-topbar" (click)="$event.stopPropagation()">
      <div class="lb-source">
        @if (currentMedia()?.champ || currentMedia()?.culture) {
          <span class="lb-source-tag">
            {{ currentMedia()?.champ?.nom ?? currentMedia()?.culture?.nom }}
          </span>
        }
        <span class="lb-counter">{{ (lbIdx()! + 1) }} / {{ filtered().length }}</span>
      </div>
      <button class="lb-close" (click)="closeLb()">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Stage -->
    <div class="lb-stage" (click)="$event.stopPropagation()">
      <button class="lb-nav prev" (click)="lbPrev()" [disabled]="lbIdx() === 0">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>
      </button>

      @if (currentMedia()?.type === 'video') {
        <video class="lb-media" [src]="currentMedia()!.fichier_url" controls autoplay></video>
      } @else {
        <img class="lb-media" [src]="currentMedia()!.fichier_url" [alt]="currentMedia()!.description || ''"/>
      }

      <button class="lb-nav next" (click)="lbNext()" [disabled]="lbIdx() === filtered().length - 1">
        <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </button>
    </div>

    <!-- Info -->
    @if (currentMedia()?.description || currentMedia()?.date_prise) {
      <div class="lb-info" (click)="$event.stopPropagation()">
        @if (currentMedia()?.description) { <div class="lb-desc">{{ currentMedia()!.description }}</div> }
        @if (currentMedia()?.date_prise) { <div class="lb-meta">{{ formatDate(currentMedia()!.date_prise!) }}</div> }
      </div>
    }

    <!-- Strip -->
    <div class="lb-strip" (click)="$event.stopPropagation()">
      @for (m of filtered(); track m.id; let i = $index) {
        <div class="lb-thumb" [class.on]="lbIdx() === i" (click)="lbIdx.set(i)">
          @if (m.type === 'video') {
            <div class="lb-thumb-vid">
              <svg width="12" height="12" fill="rgba(255,255,255,.4)" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21"/></svg>
            </div>
          } @else {
            <img [src]="m.fichier_url" [alt]="m.fichier_nom" loading="lazy"/>
          }
        </div>
      }
    </div>

  </div>
}
  `,
})
export class GalerieComponent implements OnInit {
  private api  = inject(ApiService);
  private notif = inject(NotificationService);
  auth = inject(AuthService);

  loading     = signal(true);
  medias      = signal<GalerieMedia[]>([]);
  typeFilter  = signal<'all' | 'photo' | 'video'>('all');
  sourceFilter = signal<string | null>(null);
  lbIdx       = signal<number | null>(null);

  total      = computed(() => this.medias().length);
  photoCount = computed(() => this.medias().filter(m => m.type === 'photo').length);
  videoCount = computed(() => this.medias().filter(m => m.type === 'video').length);

  sourceChips = computed(() => {
    const seen = new Map<string, string>();
    this.medias().forEach(m => {
      if (m.champ)    seen.set(`champ-${m.champ.id}`,    m.champ.nom);
      if (m.culture)  seen.set(`culture-${m.culture.id}`, m.culture.nom);
    });
    return Array.from(seen.entries()).map(([key, label]) => ({ key, label }));
  });

  filtered = computed(() => {
    let list = this.medias();
    const t = this.typeFilter();
    const s = this.sourceFilter();
    if (t !== 'all') list = list.filter(m => m.type === t);
    if (s) {
      const [kind, id] = s.split('-');
      list = list.filter(m =>
        kind === 'champ' ? m.champ?.id === +id : m.culture?.id === +id
      );
    }
    return list;
  });

  currentMedia = computed(() => {
    const i = this.lbIdx();
    return i !== null ? this.filtered()[i] ?? null : null;
  });

  ngOnInit(): void { this.load(); }

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent): void {
    if (this.lbIdx() === null) return;
    if (e.key === 'ArrowRight') this.lbNext();
    if (e.key === 'ArrowLeft')  this.lbPrev();
    if (e.key === 'Escape')     this.closeLb();
  }

  load(): void {
    this.loading.set(true);
    this.api.get<GalerieMedia[]>('/api/medias').subscribe({
      next: res => { this.medias.set(Array.isArray(res) ? res : []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  toggleSource(key: string): void {
    this.sourceFilter.set(this.sourceFilter() === key ? null : key);
  }

  resetFilters(): void {
    this.typeFilter.set('all');
    this.sourceFilter.set(null);
  }

  del(m: GalerieMedia, e: Event): void {
    e.stopPropagation();
    if (!confirm('Supprimer ce média définitivement ?')) return;
    this.api.delete(`/api/medias/${m.id}`).subscribe({
      next: () => {
        this.medias.update(list => list.filter(x => x.id !== m.id));
        if (this.lbIdx() !== null) this.closeLb();
        this.notif.success('Média supprimé.');
      },
      error: err => this.notif.error(err.error?.message || 'Erreur.'),
    });
  }

  openLb(i: number): void { this.lbIdx.set(i); }
  closeLb(): void          { this.lbIdx.set(null); }
  lbPrev(): void { this.lbIdx.update(i => (i !== null && i > 0) ? i - 1 : i); }
  lbNext(): void { this.lbIdx.update(i => (i !== null && i < this.filtered().length - 1) ? i + 1 : i); }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}

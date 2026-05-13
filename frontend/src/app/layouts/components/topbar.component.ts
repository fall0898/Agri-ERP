import { Component, output, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule, SlicePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { OfflineService } from '../../core/services/offline.service';
import { CampagneService } from '../../core/services/campagne.service';
import { CampagneAgricole } from '../../core/models';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [RouterLink, CommonModule, SlicePipe],
  template: `
    <header class="flex flex-wrap items-center justify-between px-4 lg:px-6 shrink-0 py-2 lg:py-0 lg:h-16 gap-y-1"
            style="background: #FFFDF8; border-bottom: 1.5px solid #E5DDD2; box-shadow: 0 1px 4px rgba(26,48,32,.05);">

      <!-- Left: hamburger (mobile) -->
      <div class="flex items-center gap-3 h-10 lg:h-auto">
        <button (click)="menuToggle.emit()"
                class="lg:hidden p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
        <!-- Mobile logo -->
        <div class="lg:hidden flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl flex items-center justify-center"
               style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <span class="font-bold text-sm text-neutral-900">Agri-ERP</span>
        </div>
      </div>

      <!-- Centre: sélecteur de campagne — 2e ligne sur mobile, centre sur desktop -->
      <div class="order-3 lg:order-none w-full lg:w-auto lg:flex-1 relative flex justify-center pb-1 lg:pb-0">
        @if (campagneService.campagnes().length > 0) {
          <button (click)="toggleCampagneDropdown()"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
                  style="background:#f0fdf4;border:1px solid #bbf7d0;color:#15803d;">
            <span class="w-2 h-2 rounded-full flex-shrink-0"
                  [style.background]="campagneService.campagneActive()?.est_courante ? '#16a34a' : '#9ca3af'"></span>
            <span class="truncate max-w-32">{{ campagneService.campagneActive()?.nom ?? 'Toutes campagnes' }}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>

          @if (showCampagneDropdown()) {
            <div class="absolute top-full mt-1 left-1/2 -translate-x-1/2 w-72 rounded-xl overflow-hidden z-50 animate-fade-up"
                 style="box-shadow:0 8px 24px rgba(0,0,0,0.15);border:1px solid #e5e7eb;">
              <div style="background:#1a2332;padding:10px 16px;">
                <span style="color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:.6px;font-weight:600;">Changer de campagne</span>
              </div>
              <div style="background:#fff;">
                @for (c of campagneService.campagnes(); track c.id) {
                  <button (click)="selectCampagne(c)"
                          class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-neutral-50"
                          [style.background]="campagneService.campagneActive()?.id === c.id ? '#f0fdf4' : ''"
                          style="border-bottom:1px solid #f3f4f6;">
                    <span class="w-2 h-2 rounded-full flex-shrink-0"
                          [style.background]="c.est_courante ? '#16a34a' : '#d1d5db'"></span>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-semibold truncate"
                           [style.color]="campagneService.campagneActive()?.id === c.id ? '#15803d' : '#374151'">
                        {{ c.nom }}
                      </div>
                      <div class="text-xs" style="color:#9ca3af;">
                        {{ c.est_courante ? '● Campagne active' : 'Clôturée · ' + (c.date_debut | slice:0:7) + ' – ' + (c.date_fin | slice:0:7) }}
                      </div>
                    </div>
                    @if (campagneService.campagneActive()?.id === c.id) {
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    }
                  </button>
                }
                <a routerLink="/parametres" [queryParams]="{tab:'campagnes'}" (click)="showCampagneDropdown.set(false)"
                   class="flex items-center justify-center px-4 py-2.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                   style="border-top:1px solid #f3f4f6;">
                  Gérer les campagnes dans Paramètres →
                </a>
              </div>
            </div>
          }
        }
      </div>

      <!-- Right: actions -->
      <div class="flex items-center gap-1 h-10 lg:h-auto">

        <!-- Offline badge -->
        @if (!offline.isOnline() || offline.pendingCount() > 0) {
          <div class="lg:hidden flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium"
               [class]="offline.isOnline() ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01"/>
            </svg>
            @if (!offline.isOnline()) {
              <span>Hors ligne</span>
            }
            @if (offline.pendingCount() > 0) {
              <span>{{ offline.pendingCount() }} en attente</span>
            }
          </div>
        }

        <!-- Notifications -->
        <a routerLink="/notifications"
           class="relative p-2.5 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          @if (notifService.unreadCount() > 0) {
            <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500"></span>
          }
        </a>

        <!-- Separator -->
        <div class="w-px h-6 bg-neutral-200 mx-1"></div>

        <!-- Avatar dropdown -->
        <div class="relative">
          <button (click)="toggleAvatar()"
                  class="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-neutral-100 transition-colors">
            <div class="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0"
                 style="background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);">
              {{ (auth.user()?.nom || 'U').charAt(0).toUpperCase() }}
            </div>
            <div class="hidden sm:block text-left">
              <p class="text-sm font-semibold text-neutral-900 leading-tight">{{ auth.user()?.nom }}</p>
              <p class="text-xs text-neutral-500 capitalize leading-tight">{{ auth.user()?.role?.replace('_', ' ') }}</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 class="text-neutral-400 hidden sm:block transition-transform duration-200"
                 [class.rotate-180]="showAvatar()">
              <path d="M6 9l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          @if (showAvatar()) {
            <div class="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl z-50 overflow-hidden animate-fade-up"
                 style="box-shadow: 0 8px 24px -4px rgba(0,0,0,0.12), 0 2px 8px -2px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.06);">
              <!-- User info header -->
              <div class="px-4 py-3" style="border-bottom: 1px solid #f0efee;">
                <p class="text-sm font-semibold text-neutral-900 truncate">{{ auth.user()?.nom }}</p>
                <p class="text-xs text-neutral-500 truncate">{{ auth.user()?.email }}</p>
              </div>
              <!-- Menu items -->
              <div class="py-1.5">
                <a routerLink="/parametres" (click)="showAvatar.set(false)"
                   class="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
                  </svg>
                  Mon profil
                </a>
                <a routerLink="/abonnement" (click)="showAvatar.set(false)"
                   class="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Abonnement
                </a>
              </div>
              <div style="border-top: 1px solid #f0efee;" class="py-1.5">
                <button (click)="logout()"
                        class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
                  </svg>
                  Déconnexion
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </header>

    @if (showAvatar()) {
      <div class="fixed inset-0 z-40" (click)="showAvatar.set(false)"></div>
    }
    @if (showCampagneDropdown()) {
      <div class="fixed inset-0 z-40" (click)="showCampagneDropdown.set(false)"></div>
    }
  `,
})
export class TopbarComponent {
  menuToggle = output<void>();
  auth = inject(AuthService);
  notifService = inject(NotificationService);
  offline = inject(OfflineService);
  showAvatar = signal(false);
  campagneService = inject(CampagneService);
  showCampagneDropdown = signal(false);

  toggleAvatar(): void {
    this.showCampagneDropdown.set(false);
    this.showAvatar.update(v => !v);
  }

  logout(): void { this.auth.logout(); }

  toggleCampagneDropdown(): void {
    this.showAvatar.set(false);
    this.showCampagneDropdown.update(v => !v);
  }

  selectCampagne(c: CampagneAgricole): void {
    this.campagneService.basculer(c);
    this.showCampagneDropdown.set(false);
  }
}

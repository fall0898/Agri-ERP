import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationStart } from '@angular/router';
import { SidebarComponent } from './components/sidebar.component';
import { TopbarComponent } from './components/topbar.component';
import { NotificationService } from '../core/services/notification.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, SidebarComponent, TopbarComponent],
  template: `
    <div class="flex h-screen overflow-hidden" style="background: #F8F5EF;">
      <!-- Sidebar Desktop — masquée sur mobile, visible sur lg+ -->
      <div class="hidden lg:flex">
        <app-sidebar [collapsed]="sidebarCollapsed()"/>
      </div>

      <!-- Main container -->
      <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
        <app-topbar (menuToggle)="showMobileMenu.set(true)"/>

        <!-- Mobile Drawer -->
        @if (showMobileMenu()) {
          <div class="fixed inset-0 z-50 lg:hidden">
            <div class="fixed inset-0 bg-black/60 backdrop-blur-sm" (click)="showMobileMenu.set(false)"></div>
            <div class="fixed inset-y-0 left-0 w-64 shadow-2xl z-10 animate-slide-in-left"
                 style="background: #0f172a;">
              <app-sidebar/>
            </div>
          </div>
        }

        <!-- Page content -->
        <main class="flex-1 overflow-y-auto">
          <div class="main-content p-4 lg:p-6 max-w-screen-2xl mx-auto">
            <router-outlet/>
          </div>
        </main>
      </div>

      <!-- Bottom navbar mobile — invisible sur desktop -->
      <nav class="lg:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch"
           style="background:#FFFDF8; border-top:1.5px solid #E5DDD2; box-shadow:0 -2px 12px rgba(26,48,32,.06); padding-bottom:env(safe-area-inset-bottom);">
        <a routerLink="/tableau-de-bord" routerLinkActive="border-t-2"
           [routerLinkActiveOptions]="{exact:true}"
           style="--active-color:#1A3020"
           class="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-stone-400 text-xs font-semibold transition-colors"
           [style.color]="isActive('/tableau-de-bord') ? '#1A3020' : ''"
           [style.borderTopColor]="isActive('/tableau-de-bord') ? '#C49320' : 'transparent'">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span>Accueil</span>
        </a>
        <a routerLink="/cultures" routerLinkActive="border-t-2"
           class="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-stone-400 text-xs font-semibold transition-colors"
           [style.color]="isActive('/cultures') ? '#1A3020' : ''"
           [style.borderTopColor]="isActive('/cultures') ? '#C49320' : 'transparent'">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24">
            <path d="M12 2a10 10 0 0 0-6.88 17.26C6.28 18.5 8 17 8 17s1.5 3 4 3 4-3 4-3 1.72 1.5 2.88 2.26A10 10 0 0 0 12 2z"/>
          </svg>
          <span>Cultures</span>
        </a>
        <a routerLink="/finances" routerLinkActive="border-t-2"
           class="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-stone-400 text-xs font-semibold transition-colors"
           [style.color]="isActive('/finances') ? '#1A3020' : ''"
           [style.borderTopColor]="isActive('/finances') ? '#C49320' : 'transparent'">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24">
            <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          <span>Finances</span>
        </a>
        <a routerLink="/champs" routerLinkActive="border-t-2"
           class="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-stone-400 text-xs font-semibold transition-colors"
           [style.color]="isActive('/champs') ? '#1A3020' : ''"
           [style.borderTopColor]="isActive('/champs') ? '#C49320' : 'transparent'">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
          </svg>
          <span>Champs</span>
        </a>
        <a routerLink="/stocks" routerLinkActive="border-t-2"
           class="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-stone-400 text-xs font-semibold transition-colors"
           [style.color]="isActive('/stocks') ? '#1A3020' : ''"
           [style.borderTopColor]="isActive('/stocks') ? '#C49320' : 'transparent'">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
          </svg>
          <span>Stocks</span>
        </a>
      </nav>

      <!-- Sidebar collapse toggle (desktop) -->
      <button (click)="toggleSidebar()"
              class="hidden lg:flex fixed bottom-6 left-0 z-50 items-center justify-center w-6 h-10 rounded-r-xl transition-all duration-300 text-white hover:w-8"
              [style.left]="sidebarCollapsed() ? '64px' : '256px'"
              style="background: rgba(255,255,255,0.12); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.08); border-left: none;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
             [class.rotate-180]="sidebarCollapsed()">
          <path d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
    </div>
  `,
})
export class AuthLayoutComponent implements OnInit, OnDestroy {
  sidebarCollapsed = signal(false);
  showMobileMenu = signal(false);
  private notifService = inject(NotificationService);
  private router = inject(Router);
  private routerSub?: Subscription;

  ngOnInit(): void {
    this.notifService.startPolling();
    this.routerSub = this.router.events.pipe(
      filter(e => e instanceof NavigationStart)
    ).subscribe(() => this.showMobileMenu.set(false));
  }

  ngOnDestroy(): void {
    this.notifService.stopPolling();
    this.routerSub?.unsubscribe();
  }

  toggleSidebar(): void { this.sidebarCollapsed.update(v => !v); }
  isActive(path: string): boolean { return this.router.url === path || this.router.url.startsWith(path + '/'); }
}

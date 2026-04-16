import { Component, input, inject, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  badge?: boolean;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  template: `
    <aside [class]="collapsed() ? 'w-16' : 'w-64'"
           class="hidden lg:flex flex-col h-full transition-all duration-300 overflow-hidden shrink-0"
           style="background: #0f172a; border-right: 1px solid rgba(255,255,255,0.06);">

      <!-- Logo -->
      <div class="flex items-center h-16 px-4 shrink-0" style="border-bottom: 1px solid rgba(255,255,255,0.06);">
        @if (!collapsed()) {
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                 style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); box-shadow: 0 0 20px -4px rgba(34,197,94,0.5);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div>
              <p class="font-bold text-white text-sm leading-tight">Agri-ERP</p>
              <p class="text-xs" style="color: rgba(255,255,255,0.4);">Gestion agricole</p>
            </div>
          </div>
        } @else {
          <div class="w-9 h-9 rounded-xl flex items-center justify-center mx-auto shrink-0"
               style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
        }
      </div>

      <!-- Navigation -->
      <nav class="flex-1 py-3 overflow-y-auto" style="scrollbar-width: none;">
        @for (group of visibleGroups(); track group.label) {
          <div class="mb-1">
            @if (!collapsed()) {
              <p class="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest"
                 style="color: rgba(255,255,255,0.25);">{{ group.label }}</p>
            } @else {
              <div class="my-2 mx-3" style="height: 1px; background: rgba(255,255,255,0.06);"></div>
            }
            <ul class="px-2 space-y-0.5">
              @for (item of group.items; track item.route) {
                <li>
                  <a [routerLink]="item.route"
                     routerLinkActive="active-nav"
                     class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 relative group"
                     [class.justify-center]="collapsed()">
                    <span class="shrink-0 relative" [innerHTML]="item.icon"></span>
                    @if (!collapsed()) {
                      <span class="flex-1 truncate">{{ item.label }}</span>
                      @if (item.badge && notifService.unreadCount() > 0) {
                        <span class="ml-auto flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold text-white"
                              style="background: #ef4444; font-size: 10px;">
                          {{ notifService.unreadCount() > 9 ? '9+' : notifService.unreadCount() }}
                        </span>
                      }
                    } @else {
                      @if (item.badge && notifService.unreadCount() > 0) {
                        <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style="background: #ef4444;"></span>
                      }
                      <!-- Tooltip -->
                      <span class="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap
                                   opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                            style="background: #1e293b; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                        {{ item.label }}
                      </span>
                    }
                  </a>
                </li>
              }
            </ul>
          </div>
        }

        <!-- Diagnostic IA -->
        @if (!collapsed()) {
          <div class="px-2 pt-2">
            <a routerLink="/diagnostic" routerLinkActive="active-nav"
               class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150"
               style="background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15);">
              <span class="shrink-0" [innerHTML]="iconDiagnostic"></span>
              <span style="color: #4ade80;">Diagnostic IA</span>
              <span class="ml-auto text-xs px-1.5 py-0.5 rounded-md font-semibold"
                    style="background: rgba(34,197,94,0.15); color: #4ade80;">IA</span>
            </a>
          </div>
        } @else {
          <div class="px-2 pt-2">
            <a routerLink="/diagnostic" routerLinkActive="active-nav"
               class="nav-link flex items-center justify-center px-3 py-2.5 rounded-xl transition-all duration-150 relative group"
               style="background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.15);">
              <span [innerHTML]="iconDiagnostic"></span>
              <span class="absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white whitespace-nowrap
                           opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
                    style="background: #1e293b; border: 1px solid rgba(255,255,255,0.1);">
                Diagnostic IA
              </span>
            </a>
          </div>
        }
      </nav>

      <!-- Organisation card -->
      <div class="shrink-0 p-3" style="border-top: 1px solid rgba(255,255,255,0.06);">
        @if (!collapsed()) {
          <div class="flex items-center gap-3 px-3 py-2.5 rounded-xl" style="background: rgba(255,255,255,0.04);">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold text-sm text-white"
                 style="background: linear-gradient(135deg, #1d4ed8, #3b82f6);">
              {{ (auth.organisation()?.nom || 'A').charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold text-white truncate">{{ auth.organisation()?.nom }}</p>
              <div class="flex items-center gap-1 mt-0.5">
                <span class="w-1.5 h-1.5 rounded-full" [style.background]="planColor(auth.organisation()?.plan)"></span>
                <span class="text-xs capitalize" style="color: rgba(255,255,255,0.4);">{{ auth.organisation()?.plan }}</span>
              </div>
            </div>
          </div>
        } @else {
          <div class="flex items-center justify-center">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm text-white"
                 style="background: linear-gradient(135deg, #1d4ed8, #3b82f6);">
              {{ (auth.organisation()?.nom || 'A').charAt(0).toUpperCase() }}
            </div>
          </div>
        }
      </div>
    </aside>

    <style>
      .nav-link { color: rgba(255,255,255,0.5); }
      .nav-link:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.05); }
      .nav-link.active-nav { color: #4ade80 !important; background: rgba(34,197,94,0.1) !important; }
      .nav-link.active-nav svg { color: #4ade80; }
    </style>
  `,
})
export class SidebarComponent {
  collapsed = input(false);
  auth = inject(AuthService);
  notifService = inject(NotificationService);

  readonly iconDiagnostic = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6M8 11h6"/></svg>`;

  private readonly allGroups: NavGroup[] = [
    {
      label: 'Principal',
      items: [
        { label: 'Tableau de bord', route: '/tableau-de-bord', icon: this.svg('M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z') },
        { label: 'Champs',          route: '/champs',          icon: this.svg('M2 20h20M5 20V8l7-5 7 5v12') },
        { label: 'Cultures',        route: '/cultures',        icon: this.svg('M12 2a5 5 0 0 0-5 5c0 3 5 11 5 11s5-8 5-11a5 5 0 0 0-5-5z') },
        { label: 'Stocks',          route: '/stocks',          icon: this.svg('M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z') },
      ]
    },
    {
      label: 'Finance',
      items: [
        { label: 'Dépenses', route: '/depenses', icon: this.svg('M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6') },
        { label: 'Ventes',   route: '/ventes',   icon: this.svg('M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-10 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4z') },
        { label: 'Finances', route: '/finances', icon: this.svg('M18 20V10M12 20V4M6 20v-6') },
      ]
    },
    {
      label: 'Équipe',
      items: [
        { label: 'Employés', route: '/employes', icon: this.svg('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87') },
        { label: 'Tâches',   route: '/taches',   icon: this.svg('M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11') },
        { label: 'Calendrier', route: '/calendrier', icon: this.svg('M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z') },
      ]
    },
    {
      label: 'Outils',
      items: [
        { label: 'Import CSV',     route: '/import',          icon: this.svg('M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-8-4-4-4 4M12 12V4'),  adminOnly: true },
        { label: 'Notifications',  route: '/notifications',   icon: this.svg('M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0'), badge: true },
        { label: 'Utilisateurs',   route: '/utilisateurs',    icon: this.svg('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'), adminOnly: true },
        { label: 'Abonnement',     route: '/abonnement',      icon: this.svg('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z') },
        { label: 'Paramètres',     route: '/parametres',      icon: this.svg('M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z') },
        { label: 'Super Admin',    route: '/admin',           icon: this.svg('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'), superAdminOnly: true },
      ]
    },
  ];

  visibleGroups = computed(() => {
    return this.allGroups.map(g => ({
      ...g,
      items: g.items.filter(item =>
        (!item.adminOnly || this.auth.isAdmin()) &&
        (!item.superAdminOnly || this.auth.isSuperAdmin())
      )
    })).filter(g => g.items.length > 0);
  });

  private svg(path: string): string {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
  }

  planColor(plan?: string): string {
    return plan === 'pro' ? '#3b82f6' : plan === 'entreprise' ? '#22c55e' : '#6b7280';
  }
}

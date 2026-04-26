import { Component, signal, inject, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';

@Component({
  selector: 'app-whatsapp',
  standalone: true,
  imports: [DateFrPipe],
  template: `
    <div class="pg-wrap space-y-6">

      <div>
        <h1>Agent WhatsApp</h1>
        <p class="pg-sub">Statut des utilisateurs et historique des alertes culturales</p>
      </div>

      <!-- Utilisateurs -->
      <div class="card">
        <h2 class="text-base font-semibold text-neutral-900 mb-4">Utilisateurs</h2>
        @if (loading()) {
          <div class="animate-pulse space-y-3">
            @for (i of [1,2,3]; track i) {
              <div class="h-14 bg-neutral-100 rounded-lg"></div>
            }
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-neutral-100">
                  <th class="text-left py-2 pr-4 text-neutral-500 font-medium">Nom</th>
                  <th class="text-left py-2 pr-4 text-neutral-500 font-medium">WhatsApp</th>
                  <th class="text-left py-2 pr-4 text-neutral-500 font-medium">Langue</th>
                  <th class="text-left py-2 pr-4 text-neutral-500 font-medium">Arrosage</th>
                  <th class="text-left py-2 pr-4 text-neutral-500 font-medium">Onboard&#233;</th>
                  <th class="text-left py-2 text-neutral-500 font-medium">Alertes</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-50">
                @for (user of users(); track user.id) {
                  <tr class="hover:bg-neutral-50">
                    <td class="py-3 pr-4">
                      <div class="font-medium text-neutral-900">{{ user.nom }}</div>
                      <div class="text-xs text-neutral-400">{{ user.email }}</div>
                    </td>
                    <td class="py-3 pr-4">
                      @if (user.whatsapp_lie) {
                        <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          &#10003; {{ user.phone_number }}
                        </span>
                      } @else {
                        <span class="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
                          Non li&#233;
                        </span>
                      }
                    </td>
                    <td class="py-3 pr-4 text-neutral-600">
                      {{ formatLangue(user.langue) }}
                    </td>
                    <td class="py-3 pr-4 text-neutral-600">
                      {{ formatArrosage(user.systeme_arrosage) }}
                    </td>
                    <td class="py-3 pr-4">
                      @if (user.onboarde) {
                        <span class="text-xs text-green-600">&#10003;</span>
                      } @else {
                        <span class="text-xs text-neutral-400">&#8212;</span>
                      }
                    </td>
                    <td class="py-3">
                      <button
                        (click)="toggleAlertes(user)"
                        class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                        [class.bg-primary-500]="user.alertes_whatsapp_actives"
                        [class.bg-neutral-200]="!user.alertes_whatsapp_actives">
                        <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"
                              [class.translate-x-4]="user.alertes_whatsapp_actives"
                              [class.translate-x-0.5]="!user.alertes_whatsapp_actives">
                        </span>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Alertes envoy&#233;es -->
      <div class="card">
        <h2 class="text-base font-semibold text-neutral-900 mb-4">Derni&#232;res alertes culturales envoy&#233;es</h2>
        @if (alertes().length === 0 && !loading()) {
          <p class="text-sm text-neutral-400 text-center py-8">Aucune alerte envoy&#233;e.</p>
        } @else {
          <div class="space-y-2">
            @for (alerte of alertes(); track alerte.id) {
              <div class="flex items-center gap-3 p-3 rounded-lg bg-neutral-50">
                <span class="text-lg">&#127807;</span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-neutral-900">
                    {{ alerte.culture?.nom ?? '&#8212;' }}
                    <span class="text-xs text-neutral-400 ml-1">({{ alerte.culture?.type_culture ?? '' }})</span>
                  </div>
                  <div class="text-xs text-neutral-500">{{ alerte.type }}</div>
                </div>
                <div class="text-xs text-neutral-400 shrink-0">{{ alerte.sent_at | dateFr }}</div>
              </div>
            }
          </div>
        }
      </div>

    </div>
  `,
})
export class WhatsappComponent implements OnInit {
  private api   = inject(ApiService);
  private notif = inject(NotificationService);

  loading = signal(true);
  users   = signal<any[]>([]);
  alertes = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any>('/api/whatsapp/admin').subscribe({
      next: res => {
        this.users.set(res.users ?? []);
        this.alertes.set(res.alertes ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  formatLangue(langue: string | null | undefined): string {
    if (langue === 'wo') return 'Wolof';
    if (langue === 'fr') return 'Français';
    return '—';
  }

  formatArrosage(systeme: string | null | undefined): string {
    if (!systeme) return '—';
    return systeme.replace(/_/g, '-');
  }

  toggleAlertes(user: any): void {
    const newVal = !user.alertes_whatsapp_actives;
    this.api.patch<any>(`/api/whatsapp/admin/users/${user.id}/alertes`, {
      alertes_whatsapp_actives: newVal,
    }).subscribe({
      next: () => {
        user.alertes_whatsapp_actives = newVal;
        this.users.update(u => [...u]);
        this.notif.success(newVal ? 'Alertes WhatsApp activées' : 'Alertes WhatsApp désactivées');
      },
      error: () => {
        this.notif.error('Erreur lors de la mise à jour des alertes');
      },
    });
  }
}

import { Component, signal, inject, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DateFrPipe],
  template: `
    <div class="pg-wrap space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1>Notifications</h1>
          <p class="pg-sub">Alertes et informations importantes</p>
        </div>
        @if (unread() > 0) {
          <button (click)="markAllRead()" class="btn-secondary h-9 px-4 text-sm">
            Tout marquer comme lu ({{ unread() }})
          </button>
        }
      </div>

      @if (loading()) {
        <div class="space-y-3">
          @for (i of [1,2,3,4,5]; track i) { <div class="card animate-pulse h-16 bg-neutral-100"></div> }
        </div>
      } @else if (items().length) {
        <div class="space-y-2">
          @for (item of items(); track item.id) {
            <div class="card flex items-start gap-4 cursor-pointer hover:border-primary-200 transition-colors"
                 [class.bg-primary-50]="!item.lu" (click)="markRead(item)">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                   [class.bg-amber-100]="item.type === 'stock_bas'"
                   [class.bg-blue-100]="item.type !== 'stock_bas'">
                {{ item.type === 'stock_bas' ? '⚠️' : '🔔' }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-neutral-900">{{ item.message }}</p>
                <p class="text-xs text-neutral-400 mt-0.5">{{ item.created_at | dateFr }}</p>
              </div>
              @if (!item.lu) {
                <div class="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2"></div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="card text-center py-16">
          <div class="text-5xl mb-4">🔔</div>
          <h3 class="font-semibold text-neutral-900 mb-2">Aucune notification</h3>
          <p class="text-neutral-500 text-sm">Vous serez alerté ici en cas d'événements importants.</p>
        </div>
      }
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(NotificationService);

  loading = signal(true);
  items = signal<any[]>([]);
  unread = () => this.items().filter(n => !n.lu).length;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.get<any>('/api/notifications').subscribe({
      next: res => { this.items.set(res.data?.data || res.data || []); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  markRead(n: any): void {
    if (n.lu) return;
    this.api.post(`/api/notifications/${n.id}/lue`, {}).subscribe({
      next: () => { n.lu = true; this.items.update(list => [...list]); },
    });
  }

  markAllRead(): void {
    this.api.post('/api/notifications/tout-lire', {}).subscribe({
      next: () => {
        this.items.update(list => list.map(n => ({ ...n, lu: true })));
        this.toast.success('Toutes les notifications marquées comme lues.');
      },
    });
  }
}

import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet/>

    <!-- Toast container -->
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none" style="max-width: 380px;">
      @for (toast of notif.toasts(); track toast.id) {
        <div class="pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-lg text-sm font-medium animate-slide-in"
             [class]="toastClass(toast.type)">
          <span class="text-lg leading-none mt-0.5">{{ toastIcon(toast.type) }}</span>
          <span class="flex-1">{{ toast.message }}</span>
          <button (click)="notif.remove(toast.id)" class="ml-1 opacity-60 hover:opacity-100 text-lg leading-none">&times;</button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { opacity: 0; transform: translateX(100%); }
      to   { opacity: 1; transform: translateX(0); }
    }
    .animate-slide-in { animation: slide-in 0.2s ease-out; }
  `],
})
export class AppComponent {
  notif = inject(NotificationService);

  toastClass(type: string): string {
    return {
      success: 'bg-green-600 text-white',
      error:   'bg-red-600 text-white',
      warning: 'bg-amber-500 text-white',
      info:    'bg-blue-600 text-white',
    }[type] ?? 'bg-neutral-800 text-white';
  }

  toastIcon(type: string): string {
    return { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }[type] ?? '🔔';
  }
}

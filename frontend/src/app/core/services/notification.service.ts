import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);

  private _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  /** Unread notification badge count — polled every 60s */
  readonly unreadCount = signal(0);

  private pollInterval: ReturnType<typeof setInterval> | null = null;

  startPolling(): void {
    this.fetchUnreadCount();
    if (!this.pollInterval) {
      this.pollInterval = setInterval(() => this.fetchUnreadCount(), 60_000);
    }
  }

  stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private fetchUnreadCount(): void {
    this.http.get<{ count: number }>('/api/notifications/non-lues/count').subscribe({
      next: res => this.unreadCount.set(res.count ?? 0),
      error: () => {},
    });
  }

  success(message: string, duration = 4000): void {
    this.add({ type: 'success', message, duration });
  }

  error(message: string, duration = 6000): void {
    this.add({ type: 'error', message, duration });
  }

  warning(message: string, duration = 5000): void {
    this.add({ type: 'warning', message, duration });
  }

  info(message: string, duration = 4000): void {
    this.add({ type: 'info', message, duration });
  }

  remove(id: string): void {
    this._toasts.update(toasts => toasts.filter(t => t.id !== id));
  }

  private add(toast: Omit<Toast, 'id'>): void {
    const id = Math.random().toString(36).substr(2, 9);
    this._toasts.update(toasts => [...toasts, { ...toast, id }]);
    if (toast.duration) {
      setTimeout(() => this.remove(id), toast.duration);
    }
  }
}

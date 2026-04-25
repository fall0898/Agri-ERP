import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { OfflineQueueService, QueuedRequest } from './offline-queue.service';

@Injectable({ providedIn: 'root' })
export class OfflineService {
  private http  = inject(HttpClient);
  private queue = inject(OfflineQueueService);

  isOnline     = signal(navigator.onLine);
  pendingCount = signal(0);

  constructor() {
    window.addEventListener('online',  () => {
      this.isOnline.set(true);
      this.replayQueue();
    });
    window.addEventListener('offline', () => {
      this.isOnline.set(false);
    });

    this.refreshCount();
  }

  async queueRequest(url: string, body: any): Promise<void> {
    await this.queue.add({ url, body, timestamp: Date.now() });
    await this.refreshCount();
  }

  async replayQueue(): Promise<void> {
    const items = await this.queue.getAll();
    for (const item of items) {
      try {
        await firstValueFrom(this.http.post(item.url, item.body));
        await this.queue.remove(item.id!);
      } catch {
        // Leave in queue if request still fails
      }
    }
    await this.refreshCount();
  }

  private async refreshCount(): Promise<void> {
    this.pendingCount.set(await this.queue.count());
  }
}

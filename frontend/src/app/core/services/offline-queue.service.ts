import { Injectable } from '@angular/core';

export interface QueuedRequest {
  id?: number;
  url: string;
  body: any;
  timestamp: number;
}

@Injectable({ providedIn: 'root' })
export class OfflineQueueService {
  private readonly DB_NAME = 'agri-erp-offline';
  private readonly STORE   = 'queue';
  private readonly VERSION = 1;
  private db: IDBDatabase | null = null;

  private open(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.DB_NAME, this.VERSION);
      req.onupgradeneeded = e => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE)) {
          db.createObjectStore(this.STORE, { keyPath: 'id', autoIncrement: true });
        }
      };
      req.onsuccess = e => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve(this.db);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async add(entry: Omit<QueuedRequest, 'id'>): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(this.STORE, 'readwrite');
      const req = tx.objectStore(this.STORE).add(entry);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  async getAll(): Promise<QueuedRequest[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(this.STORE, 'readonly');
      const req = tx.objectStore(this.STORE).getAll();
      req.onsuccess = () => resolve(req.result as QueuedRequest[]);
      req.onerror   = () => reject(req.error);
    });
  }

  async remove(id: number): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(this.STORE, 'readwrite');
      const req = tx.objectStore(this.STORE).delete(id);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  async count(): Promise<number> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(this.STORE, 'readonly');
      const req = tx.objectStore(this.STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror   = () => reject(req.error);
    });
  }
}

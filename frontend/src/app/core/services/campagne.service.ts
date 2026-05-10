import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CampagneAgricole } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CampagneService {
  private readonly STORAGE_KEY = 'agri_campagne_id';
  private readonly base = environment.apiBaseUrl;
  private http = inject(HttpClient);

  campagnes      = signal<CampagneAgricole[]>([]);
  campagneActive = signal<CampagneAgricole | null>(null);
  estFiltre      = computed(() => this.campagneActive() !== null);

  charger(): void {
    this.http.get<CampagneAgricole[]>(`${this.base}/api/campagnes`).subscribe({
      next: list => {
        this.campagnes.set(list);

        const savedId = localStorage.getItem(this.STORAGE_KEY);
        if (savedId) {
          const found = list.find(c => c.id === Number(savedId));
          if (found) {
            this.campagneActive.set(found);
            return;
          }
        }
        const courante = list.find(c => c.est_courante) ?? null;
        this.campagneActive.set(courante);
        if (courante) {
          localStorage.setItem(this.STORAGE_KEY, String(courante.id));
        }
      },
    });
  }

  basculer(c: CampagneAgricole): void {
    this.campagneActive.set(c);
    localStorage.setItem(this.STORAGE_KEY, String(c.id));
  }

  reinitialiser(): void {
    this.campagneActive.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  setCourante(id: number): void {
    this.http.patch(`${this.base}/api/campagnes/${id}/courante`, {}).subscribe({
      next: () => this.charger(),
    });
  }

  creer(data: { nom: string; date_debut: string; date_fin: string; notes?: string }): ReturnType<HttpClient['post']> {
    return this.http.post<CampagneAgricole>(`${this.base}/api/campagnes`, data);
  }
}

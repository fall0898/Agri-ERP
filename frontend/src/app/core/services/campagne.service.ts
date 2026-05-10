import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CampagneAgricole } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CampagneService {
  private readonly STORAGE_KEY = 'agri-erp_campagne_id';
  private readonly base = environment.apiBaseUrl;
  private http = inject(HttpClient);

  private readonly _campagnes      = signal<CampagneAgricole[]>([]);
  private readonly _campagneActive = signal<CampagneAgricole | null>(null);

  readonly campagnes      = this._campagnes.asReadonly();
  readonly campagneActive = this._campagneActive.asReadonly();
  readonly estFiltre      = computed(() => this._campagneActive() !== null);

  charger(): void {
    this.http.get<CampagneAgricole[]>(`${this.base}/api/campagnes`).subscribe({
      next: list => {
        this._campagnes.set(list);

        const savedId = localStorage.getItem(this.STORAGE_KEY);
        if (savedId) {
          const found = list.find(c => c.id === Number(savedId));
          if (found) {
            this._campagneActive.set(found);
            return;
          }
        }
        const courante = list.find(c => c.est_courante) ?? null;
        this._campagneActive.set(courante);
        if (courante) {
          localStorage.setItem(this.STORAGE_KEY, String(courante.id));
        }
      },
      error: () => {},
    });
  }

  basculer(c: CampagneAgricole): void {
    this._campagneActive.set(c);
    localStorage.setItem(this.STORAGE_KEY, String(c.id));
  }

  reinitialiser(): void {
    this._campagneActive.set(null);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  setCourante(id: number): void {
    this.http.patch(`${this.base}/api/campagnes/${id}/courante`, {}).subscribe({
      next: () => this.charger(),
      error: () => {},
    });
  }

  creer(data: { nom: string; date_debut: string; date_fin: string; notes?: string }): Observable<CampagneAgricole> {
    return this.http.post<CampagneAgricole>(`${this.base}/api/campagnes`, data);
  }
}

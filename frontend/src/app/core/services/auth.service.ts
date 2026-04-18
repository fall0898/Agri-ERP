import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AuthResponse, User, Organisation } from '../models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'agri-erp_token';
  private readonly USER_KEY = 'agri-erp_user';

  private _user = signal<User | null>(this.loadUser());
  private _token = signal<string | null>(localStorage.getItem(this.TOKEN_KEY));

  readonly user = this._user.asReadonly();
  readonly token = this._token.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly isAdmin = computed(() => {
    const u = this._user();
    return u?.role === 'admin' || u?.role === 'super_admin';
  });
  readonly isSuperAdmin = computed(() => this._user()?.role === 'super_admin');
  readonly organisation = computed(() => this._user()?.organisation ?? null);

  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/api/auth/login`, credentials).pipe(
      tap(res => this.setSession(res))
    );
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/api/auth/register`, data).pipe(
      tap(res => this.setSession(res))
    );
  }

  logout(): void {
    this.http.post(`${this.base}/api/auth/logout`, {}).subscribe();
    this.clearSession();
    this.router.navigate(['/']);
  }

  refreshUser(): Observable<User> {
    return this.http.get<User>(`${this.base}/api/auth/user`).pipe(
      tap(user => {
        this._user.set(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      })
    );
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.base}/api/auth/user`, data).pipe(
      tap(user => {
        this._user.set(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      })
    );
  }

  getToken(): string | null {
    return this._token();
  }

  getCurrentOrganisation(): Organisation | null {
    return this._user()?.organisation ?? null;
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, res.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));
    this._token.set(res.token);
    this._user.set(res.user);
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._token.set(null);
    this._user.set(null);
  }

  private loadUser(): User | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

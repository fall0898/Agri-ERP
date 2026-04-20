import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

const phoneValidator: ValidatorFn = (control: AbstractControl) => {
  const raw = (control.value || '').replace(/[\s\-\.\(\)]/g, '');
  const local = raw.replace(/^(\+?221|00221)/, '');
  return /^[0-9]{8,9}$/.test(local) ? null : { invalidPhone: true };
};

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    :host { display: block; }

    .auth-bg {
      min-height: 100vh;
      background: radial-gradient(ellipse at 20% 20%, #253d27 0%, #111F12 50%, #0a130b 100%);
      font-family: 'DM Sans', system-ui, sans-serif;
      position: relative;
      display: flex;
      overflow: hidden;
    }

    .bg-star { position: absolute; border-radius: 50%; background: rgba(255,255,255,0.65); pointer-events: none; }
    .bg-glow { position: absolute; border-radius: 50%; pointer-events: none;
      background: radial-gradient(circle, rgba(201,154,46,0.08) 0%, transparent 70%); }
    .bg-ground {
      position: absolute; bottom: 0; left: 0; right: 0; height: 80px;
      background: #1a3d1c; pointer-events: none;
      clip-path: polygon(0% 60%, 3% 40%, 6% 55%, 10% 30%, 13% 50%, 17% 20%, 20% 45%, 25% 35%, 28% 55%, 32% 25%, 35% 50%, 40% 40%, 43% 60%, 47% 30%, 50% 50%, 53% 35%, 57% 55%, 60% 25%, 63% 45%, 67% 30%, 70% 55%, 73% 40%, 77% 60%, 80% 45%, 83% 55%, 87% 35%, 90% 50%, 93% 40%, 97% 55%, 100% 45%, 100% 100%, 0% 100%);
    }

    /* Desktop left panel */
    .panel-left {
      display: none;
      position: relative;
      flex: 1;
      overflow: hidden;
      flex-direction: column;
      justify-content: flex-end;
      padding: 48px;
    }
    @media (min-width: 1024px) { .panel-left { display: flex; } }
    .panel-left img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .panel-overlay { position: absolute; inset: 0;
      background: linear-gradient(to top, #0a130b 0%, rgba(10,19,11,0.55) 45%, rgba(10,19,11,0.15) 100%); }
    .panel-content { position: relative; z-index: 2; }

    .panel-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
    .panel-logo-icon { width: 44px; height: 44px; background: #C99A2E; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .panel-logo-text { font-size: 20px; font-weight: 700; color: #fff; }
    .panel-logo-sub { font-size: 9px; color: rgba(255,255,255,0.35); letter-spacing: 0.12em; text-transform: uppercase; }
    .panel-title { font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 900;
      line-height: 1.2; color: #fff; margin-bottom: 10px; }
    .panel-sub { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; margin-bottom: 24px; }
    .panel-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .panel-stat { background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px; padding: 14px 10px; text-align: center; }
    .panel-stat-n { font-size: 20px; font-weight: 700; color: #fff; }
    .panel-stat-l { font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 2px; }

    /* Right form panel */
    .panel-right {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 32px 20px 100px;
      position: relative;
      z-index: 10;
      min-height: 100vh;
      overflow-y: auto;
    }
    @media (min-width: 1024px) { .panel-right { flex: 0 0 480px; padding: 48px 52px 100px; } }

    .form-card { width: 100%; max-width: 390px; }

    /* Mobile logo */
    .mob-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }
    @media (min-width: 1024px) { .mob-logo { display: none; } }
    .logo-icon { width: 44px; height: 44px; background: #C99A2E; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .logo-name { font-weight: 700; font-size: 18px; color: #fff; }
    .logo-name span { color: #C99A2E; }
    .logo-sub { font-size: 9px; color: rgba(255,255,255,0.35); letter-spacing: 0.12em; text-transform: uppercase; }

    .badge { display: inline-flex; align-items: center; gap: 6px;
      background: rgba(201,154,46,0.12); border: 1px solid rgba(201,154,46,0.25);
      border-radius: 100px; padding: 6px 12px; font-size: 11px; color: #C99A2E;
      font-weight: 500; margin-bottom: 16px; }

    .auth-title { font-family: 'Playfair Display', Georgia, serif; font-weight: 900;
      font-size: 30px; line-height: 1.1; color: #fff; margin-bottom: 8px; }
    .auth-title em { color: #C99A2E; font-style: italic; }
    .auth-sub { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; margin-bottom: 28px; }

    /* Fields */
    .field { margin-bottom: 18px; }
    .field-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.45);
      text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;
      display: flex; align-items: center; justify-content: space-between; }
    .field-lbl a { color: #C99A2E; text-decoration: none; font-size: 11px;
      text-transform: none; letter-spacing: 0; font-weight: 500; }

    .auth-input { width: 100%; background: rgba(255,255,255,0.07);
      border: 1.5px solid rgba(255,255,255,0.1); border-radius: 14px;
      padding: 15px 18px; color: #fff; font-family: 'DM Sans', sans-serif;
      font-size: 15px; outline: none; transition: border-color 0.2s, background 0.2s;
      appearance: none; -webkit-appearance: none; box-sizing: border-box; }
    .auth-input::placeholder { color: rgba(255,255,255,0.2); }
    .auth-input:focus { border-color: #C99A2E; background: rgba(255,255,255,0.1); }
    .auth-input.err { border-color: rgba(248,113,113,0.7); }

    .phone-group { display: flex; gap: 8px; }
    .phone-prefix { background: rgba(255,255,255,0.07); border: 1.5px solid rgba(255,255,255,0.1);
      border-radius: 14px; padding: 15px 16px; color: #fff; font-family: 'DM Sans', sans-serif;
      font-size: 15px; font-weight: 600; flex-shrink: 0; min-width: 72px; text-align: center; }

    .pwd-wrap { position: relative; }
    .pwd-wrap .auth-input { padding-right: 50px; }
    .eye-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
      background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.3);
      padding: 4px; transition: color 0.2s; line-height: 1; }
    .eye-btn:hover { color: #C99A2E; }

    .field-err { font-size: 11px; color: #f87171; margin-top: 5px; }

    .btn-gold { width: 100%; padding: 17px; background: #C99A2E; border: none;
      border-radius: 16px; color: #000; font-family: 'DM Sans', sans-serif;
      font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s;
      margin-bottom: 16px; letter-spacing: 0.02em;
      display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-gold:hover:not(:disabled) { background: #E2B84A; transform: translateY(-1px); }
    .btn-gold:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .err-box { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3);
      border-radius: 12px; padding: 12px 16px; font-size: 13px; color: #fca5a5; margin-bottom: 16px; }

    .trust-row { display: flex; align-items: center; gap: 6px; margin-top: 12px;
      padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
    .trust-item { flex: 1; text-align: center; font-size: 9px; color: rgba(255,255,255,0.2); line-height: 1.4; }
    .trust-sep { width: 1px; height: 24px; background: rgba(255,255,255,0.06); flex-shrink: 0; }

    .switch-link { text-align: center; font-size: 13px; color: rgba(255,255,255,0.35); margin-top: 20px; }
    .switch-link a { color: #C99A2E; text-decoration: none; font-weight: 600; }

    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }
  `],
  template: `
    <div class="auth-bg">

      <!-- Background -->
      <div class="bg-star" style="width:2px;height:2px;top:8%;left:15%;opacity:.8;"></div>
      <div class="bg-star" style="width:1.5px;height:1.5px;top:12%;left:70%;opacity:.6;"></div>
      <div class="bg-star" style="width:2px;height:2px;top:6%;left:45%;opacity:.9;"></div>
      <div class="bg-star" style="width:1px;height:1px;top:18%;left:25%;opacity:.5;"></div>
      <div class="bg-star" style="width:2px;height:2px;top:5%;left:82%;opacity:.7;"></div>
      <div class="bg-star" style="width:1.5px;height:1.5px;top:22%;left:58%;opacity:.4;"></div>
      <div class="bg-star" style="width:1px;height:1px;top:3%;left:33%;opacity:.6;"></div>
      <div class="bg-star" style="width:2px;height:2px;top:15%;left:88%;opacity:.5;"></div>
      <div class="bg-star" style="width:1px;height:1px;top:30%;left:10%;opacity:.3;"></div>
      <div class="bg-glow" style="width:480px;height:480px;top:-120px;left:-100px;"></div>
      <div class="bg-glow" style="width:320px;height:320px;bottom:80px;right:-60px;"></div>
      <div class="bg-ground"></div>

      <!-- Desktop left panel -->
      <div class="panel-left">
        <img src="https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200&q=85&fit=crop&crop=center" alt="" />
        <div class="panel-overlay"></div>
        <div class="panel-content">
          <div class="panel-logo">
            <div class="panel-logo-icon">
              <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                <path d="M18 28C18 28 10 22 10 15C10 10.58 13.58 7 18 7C22.42 7 26 10.58 26 15C26 22 18 28 18 28Z" fill="#1C3A1E"/>
                <path d="M18 7V22M14 12C15.5 14 18 15 18 15C18 15 20.5 14 22 12" stroke="#C99A2E" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="18" cy="28" r="2" fill="#1C3A1E"/>
              </svg>
            </div>
            <div>
              <div class="panel-logo-text">Agri-ERP</div>
              <div class="panel-logo-sub">Afrique de l'Ouest</div>
            </div>
          </div>
          <div class="panel-title">L'ERP agricole<br>pensé pour l'Afrique</div>
          <div class="panel-sub">Gérez vos champs, stocks, finances et employés depuis un seul outil.</div>
          <div class="panel-stats">
            <div class="panel-stat"><div class="panel-stat-n">500+</div><div class="panel-stat-l">Exploitants</div></div>
            <div class="panel-stat"><div class="panel-stat-n">12</div><div class="panel-stat-l">Pays</div></div>
            <div class="panel-stat"><div class="panel-stat-n">98%</div><div class="panel-stat-l">Satisfaction</div></div>
          </div>
        </div>
      </div>

      <!-- Form panel -->
      <div class="panel-right">
        <div class="form-card">

          <!-- Logo (mobile only) -->
          <div class="mob-logo">
            <div class="logo-icon">
              <svg width="24" height="24" viewBox="0 0 36 36" fill="none">
                <path d="M18 28C18 28 10 22 10 15C10 10.58 13.58 7 18 7C22.42 7 26 10.58 26 15C26 22 18 28 18 28Z" fill="#1C3A1E"/>
                <path d="M18 7V22M14 12C15.5 14 18 15 18 15C18 15 20.5 14 22 12" stroke="#C99A2E" stroke-width="1.8" stroke-linecap="round"/>
                <circle cx="18" cy="28" r="2" fill="#1C3A1E"/>
              </svg>
            </div>
            <div>
              <div class="logo-name">Agri<span>-ERP</span></div>
              <div class="logo-sub">Afrique de l'Ouest</div>
            </div>
          </div>

          <div class="badge">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="#C99A2E" stroke-width="1.2"/>
              <path d="M4 6l1.5 1.5L8 4" stroke="#C99A2E" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Connexion sécurisée
          </div>

          <h1 class="auth-title">Bon retour<br><em>dans vos champs.</em></h1>
          <p class="auth-sub">Accédez à votre espace de gestion agricole</p>

          <form [formGroup]="form" (ngSubmit)="submit()" autocomplete="off">

            <div class="field">
              <div class="field-lbl">Numéro de téléphone</div>
              <div class="phone-group">
                <div class="phone-prefix">+221</div>
                <input type="tel" formControlName="telephone"
                       class="auth-input"
                       [class.err]="form.get('telephone')?.touched && form.get('telephone')?.invalid"
                       placeholder="77 000 00 00" inputmode="numeric" autocomplete="tel" />
              </div>
              @if (form.get('telephone')?.touched) {
                @if (form.get('telephone')?.errors?.['required']) {
                  <div class="field-err">Numéro de téléphone requis.</div>
                } @else if (form.get('telephone')?.errors?.['invalidPhone']) {
                  <div class="field-err">Numéro invalide — ex: 770809798</div>
                }
              }
            </div>

            <div class="field">
              <div class="field-lbl">
                Mot de passe
                <a routerLink="/mot-de-passe-oublie">Oublié ?</a>
              </div>
              <div class="pwd-wrap">
                <input [type]="showPassword() ? 'text' : 'password'" formControlName="password"
                       class="auth-input" placeholder="Min. 8 caractères" autocomplete="off" />
                <button type="button" class="eye-btn" (click)="togglePassword()">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    @if (showPassword()) {
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    } @else {
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    }
                  </svg>
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <div class="field-err">Le mot de passe est obligatoire.</div>
              }
            </div>

            @if (errorMsg()) {
              <div class="err-box">{{ errorMsg() }}</div>
            }

            <button type="submit" class="btn-gold" [disabled]="loading() || form.invalid">
              @if (loading()) {
                <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                  <path d="M12 2a10 10 0 0 1 10 10"/>
                </svg>
                Connexion...
              } @else {
                Se connecter →
              }
            </button>

          </form>

          <div class="trust-row">
            <div class="trust-item">Orange Money<br>& Wave</div>
            <div class="trust-sep"></div>
            <div class="trust-item">Données<br>sécurisées</div>
            <div class="trust-sep"></div>
            <div class="trust-item">Support<br>WhatsApp</div>
          </div>

          <div class="switch-link">
            Pas encore de compte ?
            <a routerLink="/inscription">Essai gratuit 7 jours</a>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notif = inject(NotificationService);

  loading = signal(false);
  showPassword = signal(false);
  togglePassword(): void { this.showPassword.update(v => !v); }
  errorMsg = signal('');

  form = this.fb.group({
    telephone: ['', [Validators.required, phoneValidator]],
    password:  ['', Validators.required],
  });

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.login(this.form.value as any).subscribe({
      next: () => {
        this.router.navigate(['/tableau-de-bord']);
      },
      error: err => {
        this.loading.set(false);
        this.errorMsg.set(err.error?.errors?.telephone?.[0] || 'Numéro ou mot de passe incorrect.');
      },
    });
  }
}

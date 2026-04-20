import { Component, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

function passwordMatch(control: AbstractControl) {
  const pwd = control.get('password')?.value;
  const confirm = control.get('password_confirmation')?.value;
  if (pwd && confirm && pwd !== confirm) {
    control.get('password_confirmation')?.setErrors({ mismatch: true });
  } else {
    const err = control.get('password_confirmation')?.errors;
    if (err) { delete err['mismatch']; control.get('password_confirmation')?.setErrors(Object.keys(err).length ? err : null); }
  }
  return null;
}

const phoneValidator: ValidatorFn = (control: AbstractControl) => {
  const raw = (control.value || '').replace(/[\s\-\.\(\)]/g, '');
  const local = raw.replace(/^(\+?221|00221)/, '');
  return /^[0-9]{8,9}$/.test(local) ? null : { invalidPhone: true };
};

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@300;400;500;600;700&display=swap');
    :host { display: block; }

    .auth-bg {
      min-height: 100vh;
      background: radial-gradient(ellipse at 80% 20%, #253d27 0%, #111F12 50%, #0a130b 100%);
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
      background: linear-gradient(to top, #0a130b 0%, rgba(10,19,11,0.6) 40%, rgba(26,61,28,0.2) 100%); }
    .panel-content { position: relative; z-index: 2; }

    .panel-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 32px; }
    .panel-logo-icon { width: 44px; height: 44px; background: #C99A2E; border-radius: 12px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .panel-logo-text { font-size: 20px; font-weight: 700; color: #fff; }
    .panel-logo-sub { font-size: 9px; color: rgba(255,255,255,0.35); letter-spacing: 0.12em; text-transform: uppercase; }
    .panel-title { font-family: 'Playfair Display', Georgia, serif; font-size: 26px; font-weight: 900;
      line-height: 1.2; color: #fff; margin-bottom: 10px; }
    .panel-sub { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; margin-bottom: 24px; }
    .panel-avantages { display: flex; flex-direction: column; gap: 10px; }
    .panel-av { display: flex; align-items: center; gap: 12px;
      background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px; padding: 14px 16px; }
    .panel-av-icon { font-size: 20px; flex-shrink: 0; }
    .panel-av-text { font-size: 13px; font-weight: 600; color: #fff; }
    .panel-av-sub { font-size: 11px; color: rgba(255,255,255,0.4); }
    .panel-price { margin-top: 16px; background: rgba(201,154,46,0.1); border: 1px solid rgba(201,154,46,0.25);
      border-radius: 14px; padding: 14px 16px; }
    .panel-price-lbl { font-size: 11px; color: rgba(201,154,46,0.7); font-weight: 600; margin-bottom: 4px; }
    .panel-price-val { font-size: 14px; color: #fff; font-weight: 700; }

    /* Form panel */
    .panel-right {
      flex: 1;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 32px 20px 100px;
      position: relative;
      z-index: 10;
      overflow-y: auto;
      min-height: 100vh;
    }
    @media (min-width: 1024px) { .panel-right { flex: 0 0 480px; padding: 48px 52px 100px; align-items: center; } }

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
      font-size: 28px; line-height: 1.1; color: #fff; margin-bottom: 8px; }
    .auth-title em { color: #C99A2E; font-style: italic; }
    .auth-sub { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; margin-bottom: 24px; }

    /* Step dots */
    .step-dots { display: flex; gap: 6px; margin-bottom: 28px; }
    .step-dot { height: 3px; border-radius: 2px; flex: 1;
      background: rgba(255,255,255,0.12); transition: background 0.3s; }
    .step-dot.on { background: #C99A2E; }

    /* Fields */
    .field { margin-bottom: 18px; }
    .field-lbl { font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.45);
      text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; display: block; }
    .field-hint { font-size: 10px; color: rgba(255,255,255,0.25); margin-top: 6px; }

    .auth-input { width: 100%; background: rgba(255,255,255,0.07);
      border: 1.5px solid rgba(255,255,255,0.1); border-radius: 14px;
      padding: 15px 18px; color: #fff; font-family: 'DM Sans', sans-serif;
      font-size: 15px; outline: none; transition: border-color 0.2s, background 0.2s;
      appearance: none; -webkit-appearance: none; box-sizing: border-box; }
    .auth-input::placeholder { color: rgba(255,255,255,0.2); }
    .auth-input:focus { border-color: #C99A2E; background: rgba(255,255,255,0.1); }
    .auth-input.err { border-color: rgba(248,113,113,0.7); }
    select.auth-input { color: rgba(255,255,255,0.7); }
    select.auth-input option { background: #1C3A1E; color: #fff; }

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

    /* Buttons */
    .btn-gold { width: 100%; padding: 17px; background: #C99A2E; border: none;
      border-radius: 16px; color: #000; font-family: 'DM Sans', sans-serif;
      font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s;
      letter-spacing: 0.02em; display: flex; align-items: center; justify-content: center; gap: 8px; }
    .btn-gold:hover:not(:disabled) { background: #E2B84A; transform: translateY(-1px); }
    .btn-gold:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

    .btn-ghost { padding: 16px; background: rgba(255,255,255,0.06);
      border: 1.5px solid rgba(255,255,255,0.1); border-radius: 16px;
      color: #fff; font-family: 'DM Sans', sans-serif; font-weight: 500;
      font-size: 14px; cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; }
    .btn-ghost:hover { background: rgba(255,255,255,0.1); }

    .btn-row { display: flex; gap: 10px; }
    .btn-row .btn-ghost { flex: 1; }
    .btn-row .btn-gold { flex: 2; }

    .info-box { background: rgba(201,154,46,0.08); border: 1px solid rgba(201,154,46,0.15);
      border-radius: 12px; padding: 14px 16px; margin-bottom: 18px; }
    .info-box p { font-size: 11px; color: rgba(255,255,255,0.5); line-height: 1.7; }
    .info-box a { color: #C99A2E; text-decoration: none; }

    .err-box { background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3);
      border-radius: 12px; padding: 12px 16px; font-size: 13px; color: #fca5a5; margin-bottom: 16px; }

    .trust-row { display: flex; align-items: center; gap: 6px; margin-top: 16px;
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
      <div class="bg-star" style="width:2px;height:2px;top:6%;left:20%;opacity:.8;"></div>
      <div class="bg-star" style="width:1.5px;height:1.5px;top:10%;left:65%;opacity:.6;"></div>
      <div class="bg-star" style="width:2px;height:2px;top:4%;left:40%;opacity:.9;"></div>
      <div class="bg-star" style="width:1px;height:1px;top:16%;left:78%;opacity:.5;"></div>
      <div class="bg-star" style="width:2px;height:2px;top:8%;left:88%;opacity:.7;"></div>
      <div class="bg-star" style="width:1.5px;height:1.5px;top:20%;left:52%;opacity:.4;"></div>
      <div class="bg-star" style="width:1px;height:1px;top:25%;left:8%;opacity:.35;"></div>
      <div class="bg-star" style="width:1.5px;height:1.5px;top:3%;left:55%;opacity:.6;"></div>
      <div class="bg-glow" style="width:500px;height:500px;top:-140px;right:-100px;"></div>
      <div class="bg-glow" style="width:340px;height:340px;bottom:60px;left:-80px;"></div>
      <div class="bg-ground"></div>

      <!-- Desktop left panel -->
      <div class="panel-left">
        <img src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200&q=85&fit=crop&crop=center" alt="" />
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
          <div class="panel-title">Rejoignez 500+<br>agriculteurs</div>
          <div class="panel-sub">7 jours gratuits. Paiement mobile via Orange Money ou Wave après l'essai.</div>
          <div class="panel-avantages">
            @for (av of avantages; track av.text) {
              <div class="panel-av">
                <div class="panel-av-icon">{{ av.icon }}</div>
                <div>
                  <div class="panel-av-text">{{ av.text }}</div>
                  <div class="panel-av-sub">{{ av.sub }}</div>
                </div>
              </div>
            }
          </div>
          <div class="panel-price">
            <div class="panel-price-lbl">Tarif transparent</div>
            <div class="panel-price-val">10 000 FCFA / mois · Orange Money &amp; Wave</div>
          </div>
        </div>
      </div>

      <!-- Form panel -->
      <div class="panel-right">
        <div class="form-card">

          <!-- Mobile logo -->
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

          <div class="badge">🌱 7 jours gratuits · Sans engagement</div>

          <h1 class="auth-title">Créez votre<br>compte <em>Agri-ERP.</em></h1>
          <p class="auth-sub">Paiement mobile via Orange Money ou Wave.</p>

          <!-- Step dots -->
          <div class="step-dots">
            <div class="step-dot" [class.on]="step() >= 1"></div>
            <div class="step-dot" [class.on]="step() >= 2"></div>
            <div class="step-dot" [class.on]="step() >= 3"></div>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" autocomplete="off">

            <!-- ─── STEP 1: Identité ─── -->
            @if (step() === 1) {
              <div class="field">
                <label class="field-lbl">Votre nom complet *</label>
                <input type="text" formControlName="nom" class="auth-input"
                       [class.err]="f['nom'].touched && f['nom'].invalid"
                       placeholder="Jean Diallo" autocomplete="off" />
                @if (f['nom'].touched && f['nom'].invalid) {
                  <div class="field-err">Nom requis.</div>
                }
              </div>

              <div class="field">
                <label class="field-lbl">Numéro de téléphone *</label>
                <div class="phone-group">
                  <div class="phone-prefix">+221</div>
                  <input type="tel" formControlName="telephone" class="auth-input"
                         [class.err]="f['telephone'].touched && f['telephone'].invalid"
                         placeholder="77 000 00 00" inputmode="numeric" autocomplete="tel" />
                </div>
                @if (f['telephone'].touched) {
                  @if (f['telephone'].errors?.['required']) {
                    <div class="field-err">Numéro requis.</div>
                  } @else if (f['telephone'].errors?.['invalidPhone']) {
                    <div class="field-err">Numéro invalide — ex: 770809798</div>
                  }
                }
                <div class="field-hint">Saisissez votre numéro sans l'indicatif pays</div>
              </div>

              <div class="field">
                <label class="field-lbl">Nom de l'exploitation *</label>
                <input type="text" formControlName="nom_organisation" class="auth-input"
                       [class.err]="f['nom_organisation'].touched && f['nom_organisation'].invalid"
                       placeholder="Ferme du Soleil" autocomplete="off" />
                @if (f['nom_organisation'].touched && f['nom_organisation'].invalid) {
                  <div class="field-err">Nom de l'exploitation requis.</div>
                }
              </div>

              <button type="button" class="btn-gold" (click)="goNext()" style="margin-top:8px;">
                Continuer →
              </button>
            }

            <!-- ─── STEP 2: Localisation ─── -->
            @if (step() === 2) {
              <div class="field">
                <label class="field-lbl">Pays</label>
                <select formControlName="pays" class="auth-input">
                  <option value="">Sélectionner un pays</option>
                  @for (p of paysList; track p.code) {
                    <option [value]="p.code">{{ p.nom }}</option>
                  }
                </select>
              </div>

              <div class="info-box" style="margin-top:4px;">
                <p>
                  ✅ 7 jours d'essai complet, sans carte bancaire.<br>
                  📱 Paiement ensuite via <strong style="color:rgba(255,255,255,0.7);">Orange Money</strong> ou <strong style="color:rgba(255,255,255,0.7);">Wave</strong>.<br>
                  🔒 Vos données restent privées et sécurisées.
                </p>
              </div>

              <div class="btn-row" style="margin-top:8px;">
                <button type="button" class="btn-ghost" (click)="step.set(1)">← Retour</button>
                <button type="button" class="btn-gold" (click)="goNext()">Continuer →</button>
              </div>
            }

            <!-- ─── STEP 3: Mot de passe ─── -->
            @if (step() === 3) {
              <div class="field">
                <label class="field-lbl">Mot de passe *</label>
                <div class="pwd-wrap">
                  <input [type]="showPassword() ? 'text' : 'password'" formControlName="password"
                         class="auth-input" [class.err]="f['password'].touched && f['password'].invalid"
                         placeholder="Min. 8 caractères" autocomplete="off" />
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
                @if (f['password'].touched && f['password'].invalid) {
                  <div class="field-err">Mot de passe min. 8 caractères requis.</div>
                }
              </div>

              <div class="field">
                <label class="field-lbl">Confirmer le mot de passe *</label>
                <div class="pwd-wrap">
                  <input [type]="showPassword() ? 'text' : 'password'" formControlName="password_confirmation"
                         class="auth-input" [class.err]="f['password_confirmation'].touched && f['password_confirmation'].errors?.['mismatch']"
                         placeholder="Répétez le mot de passe" autocomplete="off" />
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
                @if (f['password_confirmation'].touched && f['password_confirmation'].errors?.['mismatch']) {
                  <div class="field-err">Les mots de passe ne correspondent pas.</div>
                }
              </div>

              <div class="info-box">
                <p>
                  En créant un compte, vous acceptez nos
                  <a href="#">Conditions d'utilisation</a> et notre
                  <a href="#">Politique de confidentialité</a>.
                </p>
              </div>

              @if (errorMsg()) {
                <div class="err-box">{{ errorMsg() }}</div>
              }

              <div class="btn-row">
                <button type="button" class="btn-ghost" (click)="step.set(2)">← Retour</button>
                <button type="submit" class="btn-gold" [disabled]="loading()">
                  @if (loading()) {
                    <svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
                      <path d="M12 2a10 10 0 0 1 10 10"/>
                    </svg>
                    Création...
                  } @else {
                    Créer mon compte
                  }
                </button>
              </div>

              <div class="trust-row">
                <div class="trust-item">Orange Money<br>& Wave</div>
                <div class="trust-sep"></div>
                <div class="trust-item">Aucune carte<br>requise</div>
                <div class="trust-sep"></div>
                <div class="trust-item">Annulez<br>quand vous voulez</div>
              </div>
            }

          </form>

          <div class="switch-link">
            Déjà un compte ?
            <a routerLink="/connexion">Se connecter</a>
          </div>

        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notif = inject(NotificationService);

  step = signal(1);
  loading = signal(false);
  showPassword = signal(false);
  togglePassword(): void { this.showPassword.update(v => !v); }
  errorMsg = signal('');

  avantages = [
    { icon: '🗺️', text: 'Gestion complète des champs', sub: 'Cultures, intrants, calendrier agricole' },
    { icon: '📊', text: 'Finances et rentabilité', sub: 'Dépenses, ventes, bilans automatiques' },
    { icon: '⛅', text: 'Météo et alertes intelligentes', sub: 'Prévisions adaptées à votre exploitation' },
  ];

  paysList = [
    { code: 'SN', nom: 'Sénégal' }, { code: 'CI', nom: "Côte d'Ivoire" },
    { code: 'ML', nom: 'Mali' }, { code: 'BF', nom: 'Burkina Faso' },
    { code: 'GN', nom: 'Guinée' }, { code: 'TG', nom: 'Togo' },
    { code: 'BJ', nom: 'Bénin' }, { code: 'NE', nom: 'Niger' },
    { code: 'CM', nom: 'Cameroun' }, { code: 'GA', nom: 'Gabon' },
    { code: 'CD', nom: 'RD Congo' }, { code: 'MG', nom: 'Madagascar' },
  ];

  form = this.fb.group({
    nom:                  ['', Validators.required],
    telephone:            ['', [Validators.required, phoneValidator]],
    nom_organisation:     ['', Validators.required],
    pays:                 [''],
    password:             ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation:['', Validators.required],
  }, { validators: passwordMatch });

  get f() { return this.form.controls; }

  goNext(): void {
    if (this.step() === 1) {
      ['nom', 'telephone', 'nom_organisation'].forEach(c => this.form.get(c)?.markAsTouched());
      const valid = ['nom', 'telephone', 'nom_organisation'].every(c => this.form.get(c)?.valid);
      if (valid) this.step.set(2);
    } else if (this.step() === 2) {
      this.step.set(3);
    }
  }

  submit(): void {
    ['password', 'password_confirmation'].forEach(c => this.form.get(c)?.markAsTouched());
    if (this.form.invalid) return;

    this.loading.set(true);
    this.errorMsg.set('');

    this.auth.register(this.form.value as any).subscribe({
      next: () => {
        this.notif.success('Compte créé ! Bienvenue sur Agri-ERP.');
        this.router.navigate(['/onboarding']);
      },
      error: err => {
        this.loading.set(false);
        const errors = err.error?.errors;
        if (errors) {
          const first = Object.values(errors)[0] as string[];
          this.errorMsg.set(first[0]);
        } else {
          this.errorMsg.set('Une erreur est survenue. Veuillez réessayer.');
        }
      },
    });
  }
}

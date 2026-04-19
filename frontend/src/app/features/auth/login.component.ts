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
  template: `
    <div class="min-h-screen flex bg-stone-900 lg:bg-neutral-50 relative overflow-hidden">

      <!-- Mobile background: champ d'oignons à l'aube (lg:hidden) -->
      <div class="lg:hidden absolute inset-0 z-0" aria-hidden="true">
        <svg class="w-full h-full" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="lsk" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#020b05"/>
              <stop offset="28%" stop-color="#0a1e0c"/>
              <stop offset="52%" stop-color="#102814"/>
              <stop offset="68%" stop-color="#1a4020"/>
              <stop offset="78%" stop-color="#2c6028"/>
              <stop offset="86%" stop-color="#5e8018"/>
              <stop offset="92%" stop-color="#aa7a10"/>
              <stop offset="96%" stop-color="#c86808"/>
              <stop offset="100%" stop-color="#8a3e04"/>
            </linearGradient>
            <radialGradient id="lgl" cx="50%" cy="71%" r="48%">
              <stop offset="0%" stop-color="#ffaa20" stop-opacity="0.6"/>
              <stop offset="40%" stop-color="#ff6800" stop-opacity="0.25"/>
              <stop offset="100%" stop-color="#ff3300" stop-opacity="0"/>
            </radialGradient>
            <linearGradient id="lfld" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#1a4010"/>
              <stop offset="100%" stop-color="#071208"/>
            </linearGradient>
            <linearGradient id="lsoil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#0e1e08"/>
              <stop offset="100%" stop-color="#060e04"/>
            </linearGradient>
          </defs>

          <!-- Sky -->
          <rect width="390" height="844" fill="url(#lsk)"/>
          <!-- Glow horizon -->
          <ellipse cx="195" cy="602" rx="300" ry="180" fill="url(#lgl)"/>

          <!-- Stars -->
          <g fill="white">
            <circle cx="22" cy="32" r="1.1" opacity="0.7"/>
            <circle cx="58" cy="18" r="0.8" opacity="0.5"/>
            <circle cx="12" cy="62" r="0.7" opacity="0.4"/>
            <circle cx="45" cy="78" r="1.2" opacity="0.6"/>
            <circle cx="88" cy="25" r="1.5" opacity="0.8"/>
            <circle cx="35" cy="105" r="0.9" opacity="0.4"/>
            <circle cx="128" cy="22" r="1.0" opacity="0.6"/>
            <circle cx="165" cy="42" r="0.7" opacity="0.4"/>
            <circle cx="198" cy="15" r="1.6" opacity="0.85"/>
            <circle cx="238" cy="35" r="0.9" opacity="0.5"/>
            <circle cx="268" cy="22" r="1.1" opacity="0.6"/>
            <circle cx="312" cy="28" r="1.3" opacity="0.7"/>
            <circle cx="348" cy="12" r="0.8" opacity="0.4"/>
            <circle cx="375" cy="45" r="1.0" opacity="0.5"/>
            <circle cx="358" cy="72" r="0.7" opacity="0.3"/>
            <circle cx="15" cy="142" r="0.8" opacity="0.4"/>
            <circle cx="52" cy="165" r="1.0" opacity="0.5"/>
            <circle cx="95" cy="138" r="1.3" opacity="0.6"/>
            <circle cx="142" cy="158" r="0.7" opacity="0.3"/>
            <circle cx="188" cy="148" r="1.1" opacity="0.5"/>
            <circle cx="225" cy="162" r="0.8" opacity="0.4"/>
            <circle cx="268" cy="145" r="1.4" opacity="0.7"/>
            <circle cx="308" cy="155" r="0.9" opacity="0.4"/>
            <circle cx="345" cy="142" r="0.7" opacity="0.3"/>
            <circle cx="378" cy="165" r="1.0" opacity="0.5"/>
            <circle cx="28" cy="225" r="0.7" opacity="0.3"/>
            <circle cx="72" cy="242" r="1.0" opacity="0.4"/>
            <circle cx="118" cy="212" r="0.8" opacity="0.3"/>
            <circle cx="178" cy="235" r="0.9" opacity="0.4"/>
            <circle cx="222" cy="218" r="0.7" opacity="0.3"/>
            <circle cx="272" cy="238" r="1.1" opacity="0.4"/>
            <circle cx="318" cy="222" r="0.8" opacity="0.3"/>
            <circle cx="362" cy="245" r="0.7" opacity="0.25"/>
            <circle cx="45" cy="298" r="0.7" opacity="0.25"/>
            <circle cx="125" cy="315" r="0.8" opacity="0.25"/>
            <circle cx="205" cy="305" r="0.6" opacity="0.2"/>
            <circle cx="288" cy="322" r="0.7" opacity="0.2"/>
            <circle cx="355" cy="308" r="0.8" opacity="0.25"/>
            <circle cx="75" cy="375" r="0.6" opacity="0.15"/>
            <circle cx="168" cy="388" r="0.7" opacity="0.15"/>
            <circle cx="248" cy="372" r="0.5" opacity="0.12"/>
            <circle cx="338" cy="385" r="0.6" opacity="0.15"/>
            <circle cx="42" cy="448" r="0.5" opacity="0.1"/>
            <circle cx="152" cy="462" r="0.6" opacity="0.1"/>
            <circle cx="242" cy="445" r="0.5" opacity="0.08"/>
            <circle cx="342" cy="458" r="0.5" opacity="0.1"/>
          </g>

          <!-- Sun disk -->
          <circle cx="195" cy="600" r="20" fill="#ffd040" opacity="0.9"/>
          <circle cx="195" cy="600" r="11" fill="#fff0a0" opacity="0.98"/>

          <!-- Distant hill silhouette -->
          <path d="M0 592 Q40 568 90 575 Q135 581 160 562 Q185 547 210 560 Q240 572 275 557 Q308 542 340 550 Q368 557 390 547 L390 618 Q368 610 340 614 Q308 617 275 620 Q240 622 210 620 Q185 617 160 620 Q135 622 90 620 Q40 617 0 622 Z" fill="#060e04"/>

          <!-- Field base -->
          <rect x="0" y="612" width="390" height="232" fill="url(#lfld)"/>

          <!-- Onion field rows: alternating soil/green, perspective (thin far → wide near) -->
          <rect x="0" y="612" width="390" height="6"  fill="url(#lsoil)"/>
          <rect x="0" y="618" width="390" height="7"  fill="#24400e"/>
          <rect x="0" y="625" width="390" height="9"  fill="url(#lsoil)"/>
          <rect x="0" y="634" width="390" height="12" fill="#2d5212"/>
          <rect x="0" y="646" width="390" height="16" fill="url(#lsoil)"/>
          <rect x="0" y="662" width="390" height="20" fill="#386418"/>
          <rect x="0" y="682" width="390" height="26" fill="url(#lsoil)"/>
          <rect x="0" y="708" width="390" height="34" fill="#42761e"/>
          <rect x="0" y="742" width="390" height="44" fill="url(#lsoil)"/>
          <rect x="0" y="786" width="390" height="58" fill="#4e8824"/>

          <!-- Onion leaf arcs — row 6 (mid-distance, small) -->
          <path d="M5,682 Q8,675 11,682 M19,682 Q22,675 25,682 M33,682 Q36,675 39,682 M47,682 Q50,675 53,682 M61,682 Q64,675 67,682 M75,682 Q78,675 81,682 M89,682 Q92,675 95,682 M103,682 Q106,675 109,682 M117,682 Q120,675 123,682 M131,682 Q134,675 137,682 M145,682 Q148,675 151,682 M159,682 Q162,675 165,682 M173,682 Q176,675 179,682 M187,682 Q190,675 193,682 M201,682 Q204,675 207,682 M215,682 Q218,675 221,682 M229,682 Q232,675 235,682 M243,682 Q246,675 249,682 M257,682 Q260,675 263,682 M271,682 Q274,675 277,682 M285,682 Q288,675 291,682 M299,682 Q302,675 305,682 M313,682 Q316,675 319,682 M327,682 Q330,675 333,682 M341,682 Q344,675 347,682 M355,682 Q358,675 361,682 M369,682 Q372,675 375,682 M383,682 Q386,675 389,682" stroke="#5a8c28" stroke-width="1.2" fill="none"/>

          <!-- Onion leaf arcs — row 8 (medium) -->
          <path d="M5,742 Q10,727 15,742 M23,742 Q28,727 33,742 M41,742 Q46,727 51,742 M59,742 Q64,727 69,742 M77,742 Q82,727 87,742 M95,742 Q100,727 105,742 M113,742 Q118,727 123,742 M131,742 Q136,727 141,742 M149,742 Q154,727 159,742 M167,742 Q172,727 177,742 M185,742 Q190,727 195,742 M203,742 Q208,727 213,742 M221,742 Q226,727 231,742 M239,742 Q244,727 249,742 M257,742 Q262,727 267,742 M275,742 Q280,727 285,742 M293,742 Q298,727 303,742 M311,742 Q316,727 321,742 M329,742 Q334,727 339,742 M347,742 Q352,727 357,742 M365,742 Q370,727 375,742 M383,742 Q388,727 393,742" stroke="#6aa434" stroke-width="1.5" fill="none"/>

          <!-- Onion leaf arcs — row 10 (foreground, bold) -->
          <path d="M3,844 Q11,812 19,844 M25,844 Q33,812 41,844 M47,844 Q55,812 63,844 M69,844 Q77,812 85,844 M91,844 Q99,812 107,844 M113,844 Q121,812 129,844 M135,844 Q143,812 151,844 M157,844 Q165,812 173,844 M179,844 Q187,812 195,844 M201,844 Q209,812 217,844 M223,844 Q231,812 239,844 M245,844 Q253,812 261,844 M267,844 Q275,812 283,844 M289,844 Q297,812 305,844 M311,844 Q319,812 327,844 M333,844 Q341,812 349,844 M355,844 Q363,812 371,844 M377,844 Q385,812 393,844" stroke="#7ec044" stroke-width="2.2" fill="none"/>

          <!-- Baobab silhouette (right) -->
          <path d="M 332 616 Q 336 578 338 548 L 338 528 L 352 528 Q 354 548 356 578 Q 358 608 362 626 Z" fill="#050c04" opacity="0.88"/>
          <path d="M 338 534 Q 308 510 280 517 M 348 530 Q 378 506 406 512 M 343 528 Q 340 502 338 480 M 340 532 Q 320 506 312 490 M 346 531 Q 366 504 374 488" stroke="#050c04" stroke-width="6" fill="none" stroke-linecap="round" opacity="0.88"/>
          <ellipse cx="344" cy="483" rx="58" ry="36" fill="#050c04" opacity="0.85"/>
          <ellipse cx="318" cy="500" rx="35" ry="21" fill="#050c04" opacity="0.82"/>
          <ellipse cx="372" cy="498" rx="38" ry="20" fill="#050c04" opacity="0.82"/>
        </svg>
      </div>

      <!-- Left panel — image de fond (desktop only) -->
      <div class="hidden lg:flex lg:flex-1 relative items-end p-12 overflow-hidden z-10">
        <img
          src="https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200&q=85&fit=crop&crop=center"
          alt="Agriculteur au coucher du soleil"
          class="absolute inset-0 w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent"></div>

        <div class="relative z-10 max-w-md">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span class="text-white font-bold text-xs">ERP</span>
            </div>
            <span class="text-xl font-bold text-white">Agri-ERP</span>
          </div>
          <h2 class="text-2xl font-bold text-white mb-3 leading-snug">
            L'ERP agricole pensé<br>pour l'Afrique
          </h2>
          <p class="text-neutral-300 text-sm mb-6">
            Gérez vos champs, stocks, finances et employés depuis un seul outil.
          </p>
          <div class="grid grid-cols-3 gap-3">
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div class="text-xl font-bold text-white">500+</div>
              <div class="text-neutral-400 text-xs">Exploitants</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div class="text-xl font-bold text-white">12</div>
              <div class="text-neutral-400 text-xs">Pays</div>
            </div>
            <div class="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
              <div class="text-xl font-bold text-white">98%</div>
              <div class="text-neutral-400 text-xs">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right panel (form) -->
      <div class="flex-1 flex items-center justify-center px-4 py-8 lg:px-6 lg:py-12 relative z-10">
        <div class="w-full max-w-md bg-white/92 backdrop-blur-2xl rounded-2xl shadow-2xl ring-1 ring-white/20 px-6 py-8
                    lg:bg-transparent lg:shadow-none lg:rounded-none lg:ring-0 lg:backdrop-blur-none lg:px-0 lg:py-0">

          <!-- Logo mobile -->
          <div class="lg:hidden flex items-center gap-2 mb-8">
            <div class="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <span class="text-white font-bold text-xs">ERP</span>
            </div>
            <span class="text-xl font-bold text-neutral-900">Agri-ERP</span>
          </div>

          <div class="mb-8">
            <h2 class="text-2xl font-bold text-neutral-900">Connexion</h2>
            <p class="text-neutral-500 mt-1">Accédez à votre espace de gestion agricole</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-5" autocomplete="off">

            <div>
              <label class="form-label">Numéro de téléphone</label>
              <div class="flex gap-2">
                <span class="form-input w-20 shrink-0 flex items-center justify-center text-neutral-500 text-sm font-medium cursor-default select-none" style="background:#f5f5f4;">+221</span>
                <input type="tel" formControlName="telephone" class="form-input flex-1"
                       placeholder="77 000 00 00" autocomplete="tel" inputmode="numeric"/>
              </div>
              @if (form.get('telephone')?.touched) {
                @if (form.get('telephone')?.errors?.['required']) {
                  <p class="form-error">Numéro de téléphone requis.</p>
                } @else if (form.get('telephone')?.errors?.['invalidPhone']) {
                  <p class="form-error">Numéro invalide — ex: 770809798</p>
                }
              }
            </div>

            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="form-label mb-0">Mot de passe</label>
                <a routerLink="/mot-de-passe-oublie" class="text-xs text-primary-600 hover:underline">Oublié ?</a>
              </div>
              <div class="relative">
                <input [type]="showPassword() ? 'text' : 'password'" formControlName="password"
                       class="form-input pr-10" placeholder="••••••••" autocomplete="off"/>
                <button type="button" (click)="togglePassword()"
                        class="absolute inset-y-0 right-0 px-3 text-neutral-400 hover:text-neutral-600">
                  {{ showPassword() ? '🙈' : '👁️' }}
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="form-error">Le mot de passe est obligatoire.</p>
              }
            </div>

            @if (errorMsg()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
                {{ errorMsg() }}
              </div>
            }

            <button type="submit" [disabled]="loading() || form.invalid"
                    class="btn-primary w-full justify-center h-11">
              @if (loading()) {
                <svg class="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Connexion en cours...
              } @else {
                Se connecter
              }
            </button>
          </form>

          <p class="text-center text-sm text-neutral-500 mt-6">
            Pas encore de compte ?
            <a routerLink="/inscription" class="text-primary-600 font-medium hover:underline">Essai gratuit 7 jours</a>
          </p>
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

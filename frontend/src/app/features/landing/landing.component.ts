import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CommonModule],
  template: `
  <div class="min-h-screen overflow-x-hidden" style="background:#fafaf9;font-family:'Inter',sans-serif;">

    <!-- ══════════ NAVBAR ══════════ -->
    <nav [class.nav-scrolled]="scrolled()" class="lp-nav fixed top-0 inset-x-0 z-50 transition-all duration-300">
      <div class="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
               style="background:linear-gradient(135deg,#16a34a,#22c55e);box-shadow:0 0 18px -4px rgba(34,197,94,.5);">
            <svg width="17" height="17" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
          <span class="text-lg font-bold transition-colors" [style.color]="scrolled()?'#1c1917':'white'">Agri-ERP</span>
        </div>
        <!-- Links -->
        <div class="hidden md:flex items-center gap-7 text-sm font-medium">
          @for(l of navLinks; track l.label) {
            <a [href]="l.href" class="lp-navlink transition-colors" [class.lp-navlink-dark]="scrolled()">{{ l.label }}</a>
          }
        </div>
        <!-- CTA -->
        <div class="flex items-center gap-3">
          <a routerLink="/connexion" class="text-sm font-medium px-4 py-2 rounded-xl transition-all"
             [style.color]="scrolled()?'#44403c':'rgba(255,255,255,.85)'"
             [style.background]="scrolled()?'#f5f5f4':'rgba(255,255,255,.12)'"
             [style.border]="scrolled()?'1px solid #e5e5e4':'1px solid rgba(255,255,255,.2)'">Connexion</a>
          <a routerLink="/inscription"
             class="inline-flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-white transition-all"
             style="background:linear-gradient(135deg,#16a34a,#22c55e);box-shadow:0 4px 14px -2px rgba(22,163,74,.45);">
            <span class="hidden sm:inline">Essai gratuit</span>
            <span class="sm:hidden">Essai</span>
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
          </a>
        </div>
      </div>
    </nav>

    <!-- ══════════ URGENCY BAR ══════════ -->
    <div class="fixed top-16 inset-x-0 z-40 flex items-center justify-center gap-2 py-1.5 text-xs font-semibold text-white"
         style="background:linear-gradient(90deg,#166534,#15803d);border-bottom:1px solid rgba(255,255,255,.1);">
      <span class="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse inline-block shrink-0"></span>
      <span class="hidden sm:inline">🌾 Offre de lancement — Prix garanti à vie pour les 50 premiers inscrits · Il reste</span>
      <span class="sm:hidden">🌾 Offre de lancement · Il reste</span>
      <span class="px-2 py-0.5 rounded-md font-bold whitespace-nowrap" style="background:rgba(255,255,255,.2);">23 places</span>
    </div>

    <!-- ══════════ HERO ══════════ -->
    <section class="relative min-h-screen flex items-center overflow-hidden pt-24">
      <div class="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1800&q=85&fit=crop" alt="" class="w-full h-full object-cover"/>
        <div class="absolute inset-0" style="background:linear-gradient(120deg,rgba(5,46,22,.82) 0%,rgba(10,50,25,.58) 40%,rgba(0,15,5,.22) 100%);"></div>
        <div class="absolute inset-0 opacity-10" style="background-image:linear-gradient(rgba(255,255,255,.15) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.15) 1px,transparent 1px);background-size:60px 60px;"></div>
      </div>
      <div class="absolute top-1/3 right-1/4 w-80 h-80 rounded-full opacity-15 animate-float pointer-events-none" style="background:radial-gradient(circle,#22c55e,transparent);filter:blur(60px);"></div>

      <div class="relative z-10 max-w-7xl mx-auto px-5 lg:px-8 py-20 w-full">
        <div class="grid lg:grid-cols-2 gap-16 items-center">

          <!-- Texte -->
          <div class="animate-fade-up">
            <div class="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-sm font-semibold mb-8"
                 style="background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.28);color:#4ade80;backdrop-filter:blur(8px);">
              <div class="flex -space-x-1.5">
                @for(c of avatarColors; track c) {
                  <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white"
                       [style.background]="c" style="border-color:rgba(5,46,22,.8);">{{ c[0] }}</div>
                }
              </div>
              +500 agriculteurs nous font déjà confiance
            </div>

            <h1 class="text-5xl lg:text-6xl font-bold text-white leading-tight mb-5" style="letter-spacing:-0.025em;">
              Sachez exactement<br>
              <span style="background:linear-gradient(90deg,#4ade80,#86efac);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
                combien gagne chaque<br>champ
              </span>
              — ce soir.
            </h1>
            <p class="text-xl leading-relaxed mb-3" style="color:rgba(255,255,255,.70);">
              Agri-ERP remplace vos cahiers par un tableau de bord qui suit champs, stocks, employés et finances.
              <strong class="text-white">En 10 minutes par jour.</strong>
            </p>
            <p class="text-base mb-10" style="color:rgba(255,255,255,.4);">
              Générez les bilans qu'un comptable facturerait 50 000 FCFA — automatiquement.
            </p>

            <div class="flex flex-wrap gap-4 mb-8">
              <a routerLink="/inscription"
                 class="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-base text-white transition-all"
                 style="background:linear-gradient(135deg,#16a34a,#22c55e);box-shadow:0 8px 28px -4px rgba(22,163,74,.55);"
                 onmouseenter="this.style.transform='translateY(-2px)'"
                 onmouseleave="this.style.transform='none'">
                Démarrer gratuitement — 7 jours
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </a>
              <a routerLink="/connexion"
                 class="inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-base text-white transition-all"
                 style="background:rgba(255,255,255,.09);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(12px);">
                <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Voir la démo
              </a>
            </div>

            <div class="flex flex-wrap gap-5">
              @for(t of heroTrust; track t) {
                <div class="flex items-center gap-2 text-sm" style="color:rgba(255,255,255,.48);">
                  <svg width="13" height="13" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                  {{ t }}
                </div>
              }
            </div>
          </div>

          <!-- Mockup dashboard -->
          <div class="hidden lg:block animate-fade-up" style="animation-delay:.12s;">
            <div class="relative">
              <div class="rounded-3xl p-5 shadow-2xl"
                   style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.11);backdrop-filter:blur(24px);">
                <div class="flex items-center gap-2 mb-4">
                  <div class="w-3 h-3 rounded-full" style="background:#ef4444;"></div>
                  <div class="w-3 h-3 rounded-full" style="background:#f59e0b;"></div>
                  <div class="w-3 h-3 rounded-full" style="background:#22c55e;"></div>
                  <div class="flex-1 mx-3 h-4 rounded-md" style="background:rgba(255,255,255,.08);"></div>
                  <span class="text-xs font-medium" style="color:rgba(255,255,255,.35);">Agri-ERP</span>
                </div>
                <div class="grid grid-cols-3 gap-2.5 mb-4">
                  @for(k of mockKpis; track k.label) {
                    <div class="rounded-2xl p-3.5" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.07);">
                      <div class="text-xs mb-1" style="color:rgba(255,255,255,.38);">{{ k.label }}</div>
                      <div class="font-bold text-white text-sm">{{ k.value }}</div>
                      <div class="text-xs mt-1 font-semibold" style="color:#4ade80;">{{ k.delta }}</div>
                    </div>
                  }
                </div>
                <div class="rounded-2xl p-4 mb-3" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);">
                  <div class="flex items-center justify-between mb-3">
                    <span class="text-xs font-medium" style="color:rgba(255,255,255,.45);">Bénéfice net / mois</span>
                    <span class="text-xs font-bold" style="color:#4ade80;">+23%</span>
                  </div>
                  <div class="flex items-end gap-1.5 h-16">
                    @for(b of mockBars; track $index) {
                      <div class="flex-1 rounded-t-md transition-all" [style.height]="b+'px'"
                           [style.background]="b > 50 ? 'rgba(34,197,94,.85)' : 'rgba(34,197,94,.35)'"></div>
                    }
                  </div>
                </div>
                @for(r of mockRows; track r.name) {
                  <div class="flex items-center gap-3 py-2.5" style="border-bottom:1px solid rgba(255,255,255,.05);">
                    <div class="w-2 h-2 rounded-full shrink-0" [style.background]="r.color"></div>
                    <span class="flex-1 text-xs" style="color:rgba(255,255,255,.65);">{{ r.name }}</span>
                    <span class="text-xs font-bold" style="color:#4ade80;">{{ r.val }}</span>
                  </div>
                }
              </div>
              <!-- Floating badges -->
              <div class="absolute -left-12 top-8 bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl animate-float" style="min-width:162px;animation-delay:-1s;">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style="background:#f0fdf4;">
                  <svg width="16" height="16" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>
                </div>
                <div>
                  <div class="text-xs text-neutral-400 leading-tight">Ce mois-ci</div>
                  <div class="text-sm font-bold text-neutral-900">+412 000 F</div>
                </div>
              </div>
              <div class="absolute -right-10 bottom-14 bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl animate-float" style="min-width:158px;animation-delay:-2.2s;">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style="background:#fef3c7;">
                  <svg width="16" height="16" fill="none" stroke="#d97706" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                </div>
                <div>
                  <div class="text-xs text-neutral-400 leading-tight">Tâches aujourd'hui</div>
                  <div class="text-sm font-bold text-neutral-900">4 sur 6 ✓</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce">
        <span class="text-xs" style="color:rgba(255,255,255,.3);">Défiler</span>
        <svg width="18" height="18" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
      </div>
    </section>

    <!-- ══════════ PAIN ══════════ -->
    <section style="background:#1c1917;" class="py-14">
      <div class="max-w-5xl mx-auto px-5 lg:px-8 text-center">
        <p class="text-xs font-bold uppercase tracking-widest mb-8" style="color:rgba(255,255,255,.28);">Vous reconnaissez-vous dans ces situations ?</p>
        <div class="grid md:grid-cols-3 gap-4">
          @for(p of pains; track p.q) {
            <div class="rounded-2xl p-6 text-left" style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);">
              <div class="text-3xl mb-4">{{ p.icon }}</div>
              <p class="text-sm leading-relaxed" style="color:rgba(255,255,255,.58);">"{{ p.q }}"</p>
            </div>
          }
        </div>
        <div class="mt-8 inline-flex items-center gap-3 px-6 py-3 rounded-2xl"
             style="background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.22);">
          <svg width="15" height="15" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
          <span class="text-sm font-semibold" style="color:#4ade80;">Agri-ERP résout ces 3 problèmes — en moins de 10 minutes par jour.</span>
        </div>
      </div>
    </section>

    <!-- ══════════ STATS ══════════ -->
    <section style="background:linear-gradient(135deg,#052e16,#14532d);" class="py-16 relative overflow-hidden">
      <div class="absolute inset-0 opacity-15" style="background:radial-gradient(ellipse at 20% 50%,#4ade80,transparent 60%),radial-gradient(ellipse at 80% 50%,#22c55e,transparent 60%);"></div>
      <div class="relative max-w-5xl mx-auto px-5 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        @for(s of stats; track s.label) {
          <div>
            <div class="text-4xl lg:text-5xl font-bold text-white mb-1.5 tabular-nums">{{ s.value }}</div>
            <div class="text-sm font-medium" style="color:rgba(74,222,128,.65);">{{ s.label }}</div>
          </div>
        }
      </div>
    </section>

    <!-- ══════════ BÉNÉFICES ══════════ -->
    <section class="py-24">
      <div class="max-w-6xl mx-auto px-5 lg:px-8">
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5"
               style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0;">
            Ce que vous gagnez vraiment
          </div>
          <h2 class="text-4xl font-bold text-neutral-900 mb-4" style="letter-spacing:-0.025em;">
            Pas un logiciel.<br>
            <span style="background:linear-gradient(135deg,#16a34a,#22c55e);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">Un associé qui compte tout.</span>
          </h2>
          <p class="text-lg text-neutral-500 max-w-xl mx-auto">Chaque minute dans Agri-ERP produit des données que vous pourrez montrer à votre banque et vos associés.</p>
        </div>

        <div class="grid md:grid-cols-2 gap-5">
          @for(b of benefits; track b.title) {
            <div class="flex gap-5 p-7 rounded-3xl bg-white group cursor-default"
                 style="border:1px solid #f0efee;box-shadow:0 2px 8px rgba(0,0,0,.03);transition:all .2s;"
                 onmouseenter="this.style.boxShadow='0 16px 40px -8px rgba(22,163,74,.12)';this.style.borderColor='#bbf7d0';this.style.transform='translateY(-2px)'"
                 onmouseleave="this.style.boxShadow='0 2px 8px rgba(0,0,0,.03)';this.style.borderColor='#f0efee';this.style.transform='none'">
              <div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-2xl" [style.background]="b.bg">{{ b.icon }}</div>
              <div>
                <h3 class="font-bold text-neutral-900 mb-1.5">{{ b.title }}</h3>
                <p class="text-sm text-neutral-500 leading-relaxed mb-3">{{ b.desc }}</p>
                <div class="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full" [style.background]="b.tagBg" [style.color]="b.tagColor">
                  <svg width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                  {{ b.result }}
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ══════════ VALUE STACK ══════════ -->
    <section style="background:#fafaf9;border-top:1px solid #f0efee;border-bottom:1px solid #f0efee;" class="py-20">
      <div class="max-w-4xl mx-auto px-5 lg:px-8">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-neutral-900 mb-3" style="letter-spacing:-0.02em;">Ce que vous obtenez — et ce que ça vaut</h2>
          <p class="text-neutral-500">Séparément, ces outils vous coûteraient une fortune chaque mois.</p>
        </div>
        <div class="bg-white rounded-3xl overflow-hidden" style="border:1px solid #f0efee;box-shadow:0 4px 24px rgba(0,0,0,.05);">
          @for(item of valueStack; track item.name; let last = $last) {
            <div class="flex items-center gap-4 px-7 py-4" [style.border-bottom]="last?'none':'1px solid #f8f7f6'">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background:#f0fdf4;">
                <svg width="13" height="13" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
              <span class="flex-1 text-sm font-medium text-neutral-800">{{ item.name }}</span>
              <span class="text-sm font-bold tabular-nums" style="color:#d1d5db;text-decoration:line-through;">{{ item.price }}</span>
            </div>
          }
          <div class="px-7 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style="background:linear-gradient(135deg,#052e16,#134e2a);">
            <div>
              <span class="text-xs font-bold uppercase tracking-widest" style="color:rgba(74,222,128,.7);">Valeur totale estimée</span>
              <div class="text-2xl font-bold text-white opacity-50 line-through tabular-nums mt-0.5">65 000 FCFA/mois</div>
            </div>
            <div class="text-right">
              <span class="text-xs font-bold uppercase tracking-widest" style="color:rgba(74,222,128,.7);">Votre prix aujourd'hui</span>
              <div class="text-4xl font-bold text-white tabular-nums mt-0.5">10 000 <span class="text-base font-normal opacity-50">FCFA/mois</span></div>
            </div>
          </div>
        </div>
        <p class="text-center text-sm text-neutral-400 mt-5">
          Soit <strong class="text-neutral-700">333 FCFA par jour</strong> — pour piloter toute votre exploitation.
        </p>
      </div>
    </section>

    <!-- ══════════ FONCTIONNALITÉS ══════════ -->
    <section id="fonctionnalites" class="py-24">
      <div class="max-w-7xl mx-auto px-5 lg:px-8">
        <div class="text-center mb-16">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5"
               style="background:#f0fdf4;color:#16a34a;border:1px solid #dcfce7;">
            <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            15 modules inclus, aucun supplément
          </div>
          <h2 class="text-4xl font-bold text-neutral-900 mb-4" style="letter-spacing:-0.025em;">Tout ce qu'il vous faut,<br>rien de superflu</h2>
          <p class="text-lg text-neutral-500 max-w-xl mx-auto">Conçu pour un agriculteur, pas pour un comptable.</p>
        </div>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          @for(f of features; track f.title) {
            <div class="group bg-white rounded-2xl p-6 relative overflow-hidden"
                 style="border:1px solid #f0efee;box-shadow:0 1px 4px rgba(0,0,0,.03);transition:all .2s;"
                 onmouseenter="this.style.boxShadow='0 12px 32px -6px rgba(22,163,74,.11)';this.style.borderColor='#bbf7d0';this.style.transform='translateY(-2px)'"
                 onmouseleave="this.style.boxShadow='0 1px 4px rgba(0,0,0,.03)';this.style.borderColor='#f0efee';this.style.transform='none'">
              <div class="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-xl" [style.background]="f.bg">{{ f.icon }}</div>
              <h3 class="font-semibold text-neutral-900 mb-2">{{ f.title }}</h3>
              <p class="text-sm text-neutral-500 leading-relaxed">{{ f.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ══════════ BENTO ══════════ -->
    <section class="pb-24 max-w-7xl mx-auto px-5 lg:px-8">
      <div class="grid md:grid-cols-3 gap-5">
        <div class="md:col-span-2 rounded-3xl p-8 relative overflow-hidden min-h-56 flex flex-col justify-between"
             style="background:linear-gradient(135deg,#052e16,#134e2a);">
          <div class="absolute inset-0 opacity-20" style="background:radial-gradient(circle at 30% 50%,#4ade80,transparent 60%);"></div>
          <div class="relative">
            <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-4"
                 style="background:rgba(74,222,128,.15);color:#4ade80;border:1px solid rgba(74,222,128,.25);">✦ Intelligence Artificielle</div>
            <h3 class="text-2xl font-bold text-white mb-2">Diagnostic phytosanitaire par IA</h3>
            <p class="text-sm leading-relaxed" style="color:rgba(255,255,255,.55);">Une photo, 10 secondes : maladie identifiée, traitements disponibles au Sénégal listés immédiatement.</p>
          </div>
          <div class="flex gap-2 flex-wrap relative">
            @for(tag of aiTags; track tag) {
              <span class="px-3 py-1.5 rounded-full text-xs font-medium" style="background:rgba(255,255,255,.08);color:rgba(255,255,255,.65);border:1px solid rgba(255,255,255,.1);">{{ tag }}</span>
            }
          </div>
        </div>
        <div class="rounded-3xl p-8 min-h-56 flex flex-col justify-between" style="background:linear-gradient(160deg,#1e40af,#3b82f6);">
          <div class="w-12 h-12 rounded-2xl flex items-center justify-center" style="background:rgba(255,255,255,.15);">
            <svg width="22" height="22" fill="none" stroke="white" stroke-width="1.75" stroke-linecap="round" viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/></svg>
          </div>
          <div>
            <h3 class="text-xl font-bold text-white mb-1.5">100% mobile</h3>
            <p class="text-sm" style="color:rgba(255,255,255,.6);">Gérez depuis votre téléphone, au champ, sans ordinateur.</p>
          </div>
        </div>
        <div class="rounded-3xl p-8 min-h-48 flex flex-col justify-between" style="background:#fffbeb;border:1px solid #fde68a;">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center" style="background:#f59e0b;">
              <svg width="17" height="17" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
            </div>
            <span class="font-bold text-neutral-900">Paiement 100% mobile</span>
          </div>
          <p class="text-sm text-neutral-600 leading-relaxed"><strong>Orange Money</strong> ou <strong>Wave</strong>. Pas de carte bancaire requise.</p>
        </div>
        <div class="rounded-3xl p-8 min-h-48 flex flex-col justify-between" style="background:#f0fdf4;border:1px solid #bbf7d0;">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style="background:#dcfce7;">
            <svg width="20" height="20" fill="none" stroke="#16a34a" stroke-width="1.75" stroke-linecap="round" viewBox="0 0 24 24"><path d="M1 6l4.5 4.5M6.5 2.5l11 11M16.5 6l4.5 4.5"/><circle cx="12" cy="17" r="3"/></svg>
          </div>
          <div>
            <h3 class="font-bold text-neutral-900 mb-1">Fonctionne hors ligne</h3>
            <p class="text-sm text-neutral-500">Saisissez sans connexion. Synchronisation automatique au retour du réseau.</p>
          </div>
        </div>
        <div class="rounded-3xl p-8 min-h-48 flex flex-col justify-between" style="background:linear-gradient(135deg,#4f46e5,#7c3aed);">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center mb-3" style="background:rgba(255,255,255,.15);">
            <svg width="20" height="20" fill="none" stroke="white" stroke-width="1.75" stroke-linecap="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/></svg>
          </div>
          <div>
            <h3 class="font-bold text-white mb-1">Export bilan Excel & PDF</h3>
            <p class="text-sm" style="color:rgba(255,255,255,.65);">Prêt pour votre banquier en 1 clic. Professionnel.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════════ TÉMOIGNAGES ══════════ -->
    <section id="temoignages" style="background:#fafaf9;border-top:1px solid #f0efee;" class="py-24">
      <div class="max-w-6xl mx-auto px-5 lg:px-8">
        <div class="text-center mb-14">
          <div class="flex justify-center gap-0.5 mb-3">
            @for(s of [1,2,3,4,5]; track s) {
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fbbf24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            }
          </div>
          <h2 class="text-4xl font-bold text-neutral-900 mb-2" style="letter-spacing:-0.025em;">Ils ont arrêté les cahiers</h2>
          <p class="text-neutral-500">Note moyenne <strong class="text-neutral-900">4.9/5</strong> · Plus de 120 avis vérifiés</p>
        </div>

        <!-- Témoignage vedette -->
        <div class="rounded-3xl p-8 lg:p-10 mb-8 relative overflow-hidden"
             style="background:linear-gradient(135deg,#052e16,#134e2a);">
          <div class="absolute -right-10 -top-10 w-56 h-56 rounded-full opacity-10" style="background:radial-gradient(circle,#4ade80,transparent);"></div>
          <div class="relative grid md:grid-cols-3 gap-8 items-center">
            <div class="md:col-span-2">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="rgba(74,222,128,.25)" class="mb-5">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/>
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/>
              </svg>
              <p class="text-xl font-semibold text-white leading-relaxed mb-6" style="letter-spacing:-0.01em;">
                "Depuis Agri-ERP, je sais exactement ce que je gagne sur chaque parcelle. Mon banquier m'a accordé un crédit de 3 millions FCFA grâce aux bilans que j'ai sortis de l'application."
              </p>
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 rounded-full flex items-center justify-center font-bold text-white" style="background:linear-gradient(135deg,#16a34a,#22c55e);">O</div>
                <div>
                  <div class="font-semibold text-white">Oumar Sall</div>
                  <div class="text-sm" style="color:rgba(74,222,128,.7);">Agriculteur, Thiès · 8 champs · Client depuis 14 mois</div>
                </div>
              </div>
            </div>
            <div class="rounded-2xl p-6" style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);">
              <p class="text-xs font-bold uppercase tracking-widest mb-5" style="color:rgba(74,222,128,.7);">Résultats obtenus</p>
              @for(r of oumarResults; track r.label) {
                <div class="mb-5 last:mb-0">
                  <div class="text-2xl font-bold text-white tabular-nums">{{ r.value }}</div>
                  <div class="text-xs mt-0.5" style="color:rgba(255,255,255,.4);">{{ r.label }}</div>
                </div>
              }
            </div>
          </div>
        </div>

        <div class="grid md:grid-cols-3 gap-5">
          @for(t of temoignages; track t.nom) {
            <div class="bg-white rounded-3xl p-7 flex flex-col" style="border:1px solid #f0efee;box-shadow:0 2px 8px rgba(0,0,0,.03);">
              <div class="flex gap-0.5 mb-4">
                @for(s of [1,2,3,4,5]; track s) {
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                }
              </div>
              <p class="text-neutral-600 text-sm leading-relaxed flex-1 mb-5">"{{ t.texte }}"</p>
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0" [style.background]="t.color">{{ t.nom[0] }}</div>
                <div>
                  <div class="font-semibold text-neutral-900 text-sm">{{ t.nom }}</div>
                  <div class="text-neutral-400 text-xs">{{ t.lieu }}</div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ══════════ TARIFS ══════════ -->
    <section id="tarifs" class="py-24">
      <div class="max-w-5xl mx-auto px-5 lg:px-8">
        <div class="text-center mb-14">
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5"
               style="background:#f0fdf4;color:#16a34a;border:1px solid #dcfce7;">
            💡 Transparent, sans surprise
          </div>
          <h2 class="text-4xl font-bold text-neutral-900 mb-3" style="letter-spacing:-0.025em;">
            333 FCFA par jour.<br>C'est tout.
          </h2>
          <p class="text-lg text-neutral-500">Pour piloter toute votre exploitation agricole.</p>
        </div>

        <div class="grid md:grid-cols-3 gap-6 items-start">
          <!-- Gratuit -->
          <div class="bg-white rounded-3xl p-8 flex flex-col" style="border:1px solid #f0efee;box-shadow:0 2px 8px rgba(0,0,0,.04);">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style="background:#f0fdf4;">
              <svg width="18" height="18" fill="none" stroke="#16a34a" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 class="text-xl font-bold text-neutral-900 mb-1">Gratuit</h3>
            <p class="text-sm text-neutral-400 mb-5">Pour tester sans risque</p>
            <div class="flex items-baseline gap-1 mb-7">
              <span class="text-4xl font-bold text-neutral-900">0</span>
              <span class="text-neutral-400 text-sm">FCFA/mois</span>
            </div>
            <ul class="space-y-3 text-sm text-neutral-600 flex-1 mb-8">
              @for(f of planFree; track f.text) {
                <li class="flex items-center gap-2.5">
                  <span [style.color]="f.ok?'#22c55e':'#d1d5db'" class="font-bold text-base leading-none">{{ f.ok?'✓':'✗' }}</span>
                  <span [class.text-neutral-400]="!f.ok">{{ f.text }}</span>
                </li>
              }
            </ul>
            <a routerLink="/inscription" class="block text-center py-3 rounded-2xl text-sm font-semibold transition-all"
               style="border:1.5px solid #22c55e;color:#16a34a;"
               onmouseenter="this.style.background='#f0fdf4'" onmouseleave="this.style.background='transparent'">
              Commencer gratuitement
            </a>
          </div>

          <!-- Pro -->
          <div class="relative rounded-3xl p-8 flex flex-col" style="background:linear-gradient(145deg,#052e16,#134e2a);box-shadow:0 24px 60px -12px rgba(22,163,74,.35);">
            <div class="absolute -top-4 left-1/2 -translate-x-1/2">
              <span class="px-5 py-1.5 rounded-full text-xs font-bold text-white shadow-lg"
                    style="background:linear-gradient(90deg,#16a34a,#22c55e);">⭐ Le plus populaire</span>
            </div>
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style="background:rgba(74,222,128,.15);">
              <svg width="18" height="18" fill="none" stroke="#4ade80" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            </div>
            <h3 class="text-xl font-bold text-white mb-1">Pro</h3>
            <p class="text-sm mb-5" style="color:rgba(74,222,128,.6);">Abonnement Pro : le forfait le plus populaire pour les exploitations qui veulent tout suivre.</p>
            <div class="flex items-baseline gap-1 mb-2">
              <span class="text-4xl font-bold text-white tabular-nums">10 000</span>
              <span class="text-sm" style="color:rgba(255,255,255,.45);">FCFA/mois</span>
            </div>
            <p class="text-xs mb-7" style="color:rgba(74,222,128,.6);">ou 100 000 F/an — 2 mois offerts</p>
            <ul class="space-y-3 text-sm flex-1 mb-8" style="color:rgba(255,255,255,.7);">
              @for(f of planPro; track f) {
                <li class="flex items-center gap-2.5">
                  <svg width="13" height="13" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                  {{ f }}
                </li>
              }
            </ul>
            <a routerLink="/inscription"
               class="block text-center py-3.5 rounded-2xl text-sm font-bold text-white transition-all"
               style="background:linear-gradient(135deg,#16a34a,#22c55e);box-shadow:0 4px 16px rgba(22,163,74,.4);"
               onmouseenter="this.style.opacity='0.9'" onmouseleave="this.style.opacity='1'">
              Démarrer — 7 jours gratuits →
            </a>
          </div>

          <!-- Entreprise -->
          <div class="bg-white rounded-3xl p-8 flex flex-col" style="border:1px solid #f0efee;box-shadow:0 2px 8px rgba(0,0,0,.04);">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style="background:#eff6ff;">
              <svg width="18" height="18" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <h3 class="text-xl font-bold text-neutral-900 mb-1">Entreprise</h3>
            <p class="text-sm text-neutral-400 mb-5">Coopératives & ONG</p>
            <div class="flex items-baseline gap-1 mb-7">
              <span class="text-3xl font-bold text-neutral-900">Sur devis</span>
            </div>
            <ul class="space-y-3 text-sm text-neutral-600 flex-1 mb-8">
              @for(f of planEntreprise; track f) {
                <li class="flex items-center gap-2.5">
                  <svg width="13" height="13" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
                  {{ f }}
                </li>
              }
            </ul>
            <a routerLink="/inscription" class="block text-center py-3 rounded-2xl text-sm font-semibold transition-all"
               style="border:1.5px solid #e7e5e4;color:#44403c;"
               onmouseenter="this.style.background='#f5f5f4'" onmouseleave="this.style.background='transparent'">
              Nous contacter
            </a>
          </div>
        </div>

        <!-- Garantie -->
        <div class="mt-10 rounded-3xl p-7 flex items-start gap-5" style="background:#f0fdf4;border:1.5px solid #bbf7d0;">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0" style="background:#dcfce7;">
            <svg width="26" height="26" fill="none" stroke="#16a34a" stroke-width="1.75" stroke-linecap="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </div>
          <div>
            <h3 class="font-bold text-neutral-900 mb-1.5">Garantie 30 jours — satisfait ou remboursé</h3>
            <p class="text-sm text-neutral-600 leading-relaxed">Si après 30 jours Agri-ERP ne vous a pas permis d'identifier au moins une dépense inutile ou un champ non rentable, <strong>nous vous remboursons intégralement</strong>. Sans questions, sans délai.</p>
          </div>
        </div>
        <p class="text-center text-sm text-neutral-400 mt-6">✓ 7 jours gratuits &nbsp;·&nbsp; ✓ Sans carte bancaire &nbsp;·&nbsp; ✓ Résiliable à tout moment</p>
      </div>
    </section>

    <!-- ══════════ CTA FINAL ══════════ -->
    <section class="relative py-28 overflow-hidden">
      <div class="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&q=85&fit=crop" alt="" class="w-full h-full object-cover"/>
        <div class="absolute inset-0" style="background:linear-gradient(135deg,rgba(5,46,22,.82),rgba(15,79,36,.70));"></div>
        <div class="absolute inset-0 opacity-10" style="background-image:radial-gradient(circle at 20% 50%,#4ade80,transparent 55%),radial-gradient(circle at 80% 50%,#22c55e,transparent 55%);"></div>
      </div>
      <div class="relative z-10 text-center max-w-2xl mx-auto px-5 lg:px-8">
        <div class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold mb-8"
             style="background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#fca5a5;">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          Offre de lancement — expire le 30 avril 2026
        </div>
        <h2 class="text-4xl lg:text-5xl font-bold text-white mb-4" style="letter-spacing:-0.025em;">
          La saison hivernage<br>commence dans 6 semaines.
        </h2>
        <p class="text-lg mb-3" style="color:rgba(255,255,255,.58);">
          Chaque semaine sans Agri-ERP = une semaine de données perdues pour toujours.
        </p>
        <p class="text-sm mb-10" style="color:rgba(255,255,255,.38);">
          Ceux qui configurent leurs champs <strong class="text-white">avant</strong> le début de saison récoltent 3× plus d'insights.
        </p>
        <a routerLink="/inscription"
           class="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-lg transition-all"
           style="background:white;color:#15803d;box-shadow:0 12px 40px rgba(0,0,0,.25);"
           onmouseenter="this.style.transform='translateY(-3px)';this.style.boxShadow='0 18px 50px rgba(0,0,0,.3)'"
           onmouseleave="this.style.transform='none';this.style.boxShadow='0 12px 40px rgba(0,0,0,.25)'">
          Je démarre maintenant — 7 jours gratuits
          <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </a>
        <p class="mt-5 text-sm" style="color:rgba(255,255,255,.32);">Aucune carte bancaire · Orange Money &amp; Wave acceptés · Annulable à tout moment</p>

        <div class="mt-10 grid grid-cols-3 gap-4 max-w-md mx-auto">
          @for(obj of objections; track obj.q) {
            <div class="rounded-2xl p-4 text-center" style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);">
              <div class="text-xl mb-1.5">{{ obj.icon }}</div>
              <p class="text-xs font-semibold text-white mb-0.5">{{ obj.q }}</p>
              <p class="text-xs" style="color:rgba(255,255,255,.42);">{{ obj.a }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- ══════════ FOOTER ══════════ -->
    <footer style="background:#0c0a09;" class="py-14">
      <div class="max-w-7xl mx-auto px-5 lg:px-8">
        <div class="grid md:grid-cols-4 gap-10 mb-12">
          <div class="md:col-span-2">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background:linear-gradient(135deg,#16a34a,#22c55e);">
                <svg width="16" height="16" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <span class="text-lg font-bold text-white">Agri-ERP</span>
            </div>
            <p class="text-sm leading-relaxed mb-5" style="color:rgba(255,255,255,.35);">
              L'ERP agricole pensé pour l'Afrique francophone. Champs, finances, stocks et équipe dans un seul outil.
            </p>
            <div class="flex gap-2">
              @for(pay of ['Wave','Orange Money']; track pay) {
                <span class="px-3 py-1.5 rounded-lg text-xs font-medium" style="background:rgba(255,255,255,.06);color:rgba(255,255,255,.45);border:1px solid rgba(255,255,255,.08);">{{ pay }}</span>
              }
            </div>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-white mb-4">Produit</h4>
            <ul class="space-y-3 text-sm" style="color:rgba(255,255,255,.38);">
              @for(l of ['Fonctionnalités','Tarifs','Témoignages','Diagnostic IA']; track l) {
                <li><a href="#" class="hover:text-white transition-colors">{{ l }}</a></li>
              }
            </ul>
          </div>
          <div>
            <h4 class="text-sm font-semibold text-white mb-4">Support</h4>
            <ul class="space-y-3 text-sm" style="color:rgba(255,255,255,.38);">
              @for(l of footerLinks; track l) {
                <li><a href="#" class="hover:text-white transition-colors">{{ l }}</a></li>
              }
            </ul>
          </div>
        </div>
        <div style="border-top:1px solid rgba(255,255,255,.06);" class="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p class="text-sm" style="color:rgba(255,255,255,.22);">© 2026 Agri-ERP. Conçu avec ❤️ pour l'agriculture africaine.</p>
          <div class="flex gap-2 flex-wrap justify-center">
            @for(c of footerCountries; track c) {
              <span class="text-xs px-3 py-1 rounded-full" style="background:rgba(255,255,255,.05);color:rgba(255,255,255,.28);">{{ c }}</span>
            }
          </div>
        </div>
      </div>
    </footer>
  </div>

  <style>
    .lp-nav { background: transparent; }
    .lp-nav.nav-scrolled { background: rgba(255,255,255,.96); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(0,0,0,.05); box-shadow: 0 1px 10px rgba(0,0,0,.06); }
    .lp-navlink { color: rgba(255,255,255,.70); }
    .lp-navlink:hover { color: white; }
    .lp-navlink.lp-navlink-dark { color: #78716c; }
    .lp-navlink.lp-navlink-dark:hover { color: #1c1917; }
  </style>
  `,
})
export class LandingComponent implements OnInit, OnDestroy {
  scrolled = signal(false);
  private onScroll = () => this.scrolled.set(window.scrollY > 28);
  ngOnInit(): void { window.addEventListener('scroll', this.onScroll, { passive: true }); }
  ngOnDestroy(): void { window.removeEventListener('scroll', this.onScroll); }

  navLinks = [
    { label: 'Fonctionnalités', href: '#fonctionnalites' },
    { label: 'Tarifs', href: '#tarifs' },
    { label: 'Témoignages', href: '#temoignages' },
  ];

  avatarColors = ['#16a34a', '#2563eb', '#d97706', '#7c3aed'];
  heroTrust = ['7 jours gratuits', 'Paiement mobile Orange Money/Wave', 'Résiliable à tout moment'];

  mockKpis = [
    { label: 'Revenus', value: '1.4M F', delta: '+18% ce mois' },
    { label: 'Champs', value: '12', delta: '+2 récents' },
    { label: 'Bénéfice', value: '+412K', delta: '↑ vs N-1' },
  ];
  mockBars = [30, 45, 38, 62, 52, 74, 58, 80];
  mockRows = [
    { name: 'Champ Oignons — Thiès', val: '+320 000 F', color: '#22c55e' },
    { name: 'Champ Tomates — Kaolack', val: '+195 000 F', color: '#3b82f6' },
    { name: 'Champ Mil — Saint-Louis', val: '+87 000 F', color: '#f59e0b' },
  ];

  stats = [
    { value: '500+', label: 'Exploitants actifs' },
    { value: '12', label: 'Pays couverts' },
    { value: '3 200+', label: 'Champs gérés' },
    { value: '98%', label: 'Satisfaction client' },
  ];

  pains = [
    { icon: '😓', q: 'Je ne sais jamais si ma saison a été rentable avant que tout soit terminé.' },
    { icon: '📋', q: 'Je paye mes employés mais je ne retrouve plus les traces des avances que je leur ai données.' },
    { icon: '🏦', q: 'La banque me demande des bilans financiers et je n\'ai rien à leur montrer.' },
  ];

  benefits = [
    { icon: '📊', title: 'Vous savez ce que gagne chaque champ — en temps réel', desc: 'Chaque vente et dépense mise à jour instantanément par parcelle. Fini d\'attendre la fin de saison.', result: 'Décision en 30 secondes, pas en 3 semaines', bg: '#f0fdf4', tagBg: '#dcfce7', tagColor: '#15803d' },
    { icon: '🏦', title: 'Votre banque vous prend enfin au sérieux', desc: 'Exportez un bilan financier 3 feuilles en 1 clic — celui qu\'un comptable facturerait 50 000 FCFA.', result: 'Crédits agricoles plus faciles à obtenir', bg: '#eff6ff', tagBg: '#dbeafe', tagColor: '#1e40af' },
    { icon: '👥', title: 'Fini les conflits avec vos employés sur les avances', desc: 'Chaque financement, remboursement et salaire tracé. La preuve est là, pour vous et pour eux.', result: 'Zéro litige, relation de confiance', bg: '#fff7ed', tagBg: '#fef3c7', tagColor: '#92400e' },
    { icon: '🔬', title: 'Vous traitez la bonne maladie, pas la mauvaise', desc: 'Une photo de votre plante malade et l\'IA identifie la maladie + les produits disponibles au Sénégal.', result: 'Réduisez les pertes de culture de 30%', bg: '#f5f3ff', tagBg: '#ede9fe', tagColor: '#5b21b6' },
  ];

  valueStack = [
    { name: 'Logiciel de comptabilité agricole', price: '25 000 F/mois' },
    { name: 'Gestion des stocks & alertes automatiques', price: '8 000 F/mois' },
    { name: 'Logiciel paie & gestion employés', price: '12 000 F/mois' },
    { name: 'Diagnostic IA phytosanitaire', price: '5 000 F/consultation' },
    { name: 'Export bilans Excel (comptable professionnel)', price: '15 000 F/bilan' },
  ];

  features = [
    { icon: '🗺️', title: 'Gestion des champs', desc: 'Parcelles, superficies, photos et historique complet par saison.', bg: '#f0fdf4' },
    { icon: '🌱', title: 'Suivi des cultures', desc: 'Cycles, intrants utilisés, stade et rentabilité par culture.', bg: '#fffbeb' },
    { icon: '📦', title: 'Stocks & alertes', desc: 'Engrais, semences, pesticides — alerte seuil bas automatique.', bg: '#eff6ff' },
    { icon: '💸', title: 'Dépenses catégorisées', desc: 'Intrants, salaires, carburant, matériel et financement individuel.', bg: '#fef2f2' },
    { icon: '💰', title: 'Ventes & Reçus PDF', desc: 'Saisissez une vente, le reçu PDF est généré instantanément.', bg: '#f0fdf4' },
    { icon: '📊', title: 'Finances & Export Excel', desc: 'Rentabilité par champ, export bilan 3 feuilles en 1 clic.', bg: '#f5f3ff' },
    { icon: '👥', title: 'Employés & Salaires', desc: 'Équipe, paie, avances et remboursements entièrement tracés.', bg: '#fff7ed' },
    { icon: '✅', title: 'Tâches & Planning', desc: 'Assignez, suivez, validez. Aucun travail n\'est oublié.', bg: '#ecfdf5' },
    { icon: '⛅', title: 'Météo agricole locale', desc: 'Prévisions par parcelle pour planifier vos travaux au bon moment.', bg: '#eff6ff' },
    { icon: '🔔', title: 'Notifications & Emails', desc: 'Alertes automatiques sur stocks, paiements et tâches.', bg: '#fef2f2' },
    { icon: '📥', title: 'Import CSV', desc: 'Importez vos données existantes en quelques secondes.', bg: '#fffbeb' },
    { icon: '📲', title: 'Orange Money & Wave', desc: 'Abonnez-vous avec vos solutions de paiement mobile habituelles.', bg: '#fff7ed' },
  ];

  aiTags = ['Maladies fongiques', 'Ravageurs', 'Carences', 'Traitement local'];

  oumarResults = [
    { value: '3 000 000 F', label: 'Crédit agricole obtenu grâce aux bilans' },
    { value: '+34%', label: 'Rentabilité améliorée en 1 saison' },
    { value: '0 cahier', label: 'Toute la gestion sur téléphone' },
  ];

  temoignages = [
    { nom: 'Aïssatou Diop', lieu: 'Kaolack · 3 champs · Pro 8 mois', texte: 'Le suivi des intrants m\'a évité deux ruptures de stock. J\'ai économisé l\'équivalent de 3 abonnements annuels en une seule saison.', color: 'linear-gradient(135deg,#2563eb,#3b82f6)' },
    { nom: 'Ibrahima Ndiaye', lieu: 'Saint-Louis · 12 champs · Pro 18 mois', texte: 'Je gère 4 employés et 12 parcelles depuis mon téléphone. Le suivi des avances a éliminé tous les conflits au moment de la paie.', color: 'linear-gradient(135deg,#d97706,#f59e0b)' },
    { nom: 'Fatou Ba', lieu: 'Ziguinchor · 5 champs · Pro 6 mois', texte: 'J\'ai découvert que l\'un de mes champs me coûtait plus qu\'il ne rapportait. Sans Agri-ERP, j\'aurais continué à perdre de l\'argent sans le savoir.', color: 'linear-gradient(135deg,#7c3aed,#8b5cf6)' },
  ];

  planFree = [
    { ok: true, text: '1 champ, 1 culture' },
    { ok: true, text: '1 utilisateur inclus' },
    { ok: true, text: 'Tableau de bord & suivi dépenses' },
    { ok: false, text: 'Export Excel & PDF' },
    { ok: false, text: 'Météo agricole' },
    { ok: false, text: 'Diagnostic IA' },
  ];

  planPro = [
    '20 champs & cultures illimitées',
    '5 utilisateurs inclus',
    'Export Excel 3 feuilles & PDF',
    'Météo agricole par parcelle',
    'Diagnostic IA illimité',
    'Import CSV en masse',
    'Gestion d’abonnement mobile Orange Money/Wave',
    'Financements & remboursements',
  ];

  planEntreprise = [
    'Champs & utilisateurs illimités',
    'Import données historiques',
    'API dédiée',
    'Gestionnaire de compte attitré',
    'Support prioritaire 7j/7',
    'Formation équipe incluse',
  ];

  objections = [
    { icon: '🕐', q: 'Trop compliqué ?', a: 'Opérationnel en 15 min' },
    { icon: '📶', q: 'Sans internet ?', a: '100% hors ligne' },
    { icon: '🔒', q: 'Mes données ?', a: 'Cryptées & privées' },
  ];

  footerLinks = ['Connexion', 'Inscription', "Conditions d'utilisation", 'Confidentialité'];
  footerCountries = ['🇸🇳 Sénégal', '🇲🇱 Mali', '🇧🇫 Burkina', "🇨🇮 Côte d'Ivoire"];
}

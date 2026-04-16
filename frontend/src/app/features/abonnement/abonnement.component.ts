import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { CurrencyFcfaPipe } from '../../core/pipes/currency-fcfa.pipe';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';

@Component({
  selector: 'app-abonnement',
  standalone: true,
  imports: [CurrencyFcfaPipe, DateFrPipe, ReactiveFormsModule],
  styles: [`
    :host {
      --ab-bg: #F8F5EF;
      --ab-cream: #FFFDF8;
      --ab-forest: #1A3020;
      --ab-forest-mid: #254830;
      --ab-gold: #C49320;
      --ab-gold-light: rgba(196,147,32,0.12);
      --ab-terracotta: #B05832;
      --ab-border: #E2D9CC;
      --ab-muted: #7A6E60;
      --ab-text: #251E14;
      display: block;
      margin: -16px;
      background: var(--ab-bg);
      min-height: calc(100vh - 64px);
      font-family: 'Nunito', sans-serif;
      color: var(--ab-text);
    }

    @media (min-width: 1024px) { :host { margin: -24px; } }

    /* ── Wrap & background ── */
    .ab-wrap {
      padding: 36px 16px 72px;
      background:
        radial-gradient(ellipse 60% 50% at 90% 5%,  rgba(196,147,32,.07) 0%, transparent 55%),
        radial-gradient(ellipse 50% 60% at 5%  90%,  rgba(176,88,50,.05)  0%, transparent 55%),
        var(--ab-bg);
    }

    @media (min-width: 768px)  { .ab-wrap { padding: 52px 32px 80px; } }
    @media (min-width: 1024px) { .ab-wrap { padding: 60px 48px 96px; } }

    /* ── Header ── */
    .ab-header {
      text-align: center;
      margin-bottom: 52px;
      animation: abUp .5s ease both;
    }

    .ab-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 10.5px;
      font-weight: 700;
      letter-spacing: .14em;
      text-transform: uppercase;
      color: var(--ab-terracotta);
      margin-bottom: 14px;
    }
    .ab-eyebrow::before, .ab-eyebrow::after {
      content: '';
      display: block;
      width: 28px; height: 1px;
      background: currentColor;
      opacity: .45;
    }

    .ab-header h1 {
      font-family: 'Playfair Display', serif;
      font-size: clamp(2rem, 4vw, 2.9rem);
      font-weight: 700;
      color: var(--ab-forest);
      line-height: 1.15;
      margin: 0 0 10px;
    }

    .ab-header p { color: var(--ab-muted); font-size: 15px; margin: 0; }

    .ab-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--ab-forest);
      color: #d4f0d8;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 16px;
      border-radius: 100px;
      margin-top: 22px;
    }
    .ab-chip .dot {
      width: 7px; height: 7px;
      background: #4ADE80;
      border-radius: 50%;
      animation: abPulse 2s ease infinite;
    }

    /* ── Alert banners ── */
    .ab-alert {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 18px; border-radius: 14px;
      margin: 0 auto 28px; max-width: 700px;
      font-size: 13.5px;
      animation: abUp .4s ease both;
    }
    .ab-alert-warning { background:#FFF8E6; border:1px solid #F5CC5A; color:#7A5B00; }
    .ab-alert-success { background:#F0FDF4; border:1px solid #86EFAC; color:#15532A; }
    .ab-alert-error   { background:#FEF2F2; border:1px solid #FCA5A5; color:#991B1B; }

    .ab-alert-icon {
      width:36px; height:36px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:15px; flex-shrink:0;
    }
    .ab-alert-warning .ab-alert-icon { background:#FFF0B8; }
    .ab-alert-success .ab-alert-icon { background:#DCFCE7; }
    .ab-alert-error   .ab-alert-icon { background:#FEE2E2; }

    /* ── Plans grid ── */
    .ab-plans {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      max-width: 1100px;
      margin: 0 auto 56px;
    }
    @media (min-width: 768px) {
      .ab-plans { grid-template-columns: repeat(3,1fr); align-items: start; }
    }

    /* ── Plan card base ── */
    .plan-card {
      position: relative;
      background: var(--ab-cream);
      border: 1.5px solid var(--ab-border);
      border-radius: 22px;
      padding: 28px 24px 26px;
      overflow: hidden;
      transition: transform .2s ease, box-shadow .2s ease;
      animation: abUp .55s ease both;
    }
    .plan-card:nth-child(1) { animation-delay:.05s }
    .plan-card:nth-child(2) { animation-delay:.15s }
    .plan-card:nth-child(3) { animation-delay:.25s }

    .plan-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 44px rgba(26,48,32,.1);
    }

    /* Pro — featured */
    .plan-card.is-pro {
      border-color: var(--ab-gold);
      background: linear-gradient(148deg,#FFFEF9 0%,#FFFBEC 100%);
      box-shadow: 0 8px 36px rgba(196,147,32,.16);
      transform: scale(1.03);
    }
    .plan-card.is-pro:hover {
      transform: scale(1.03) translateY(-4px);
      box-shadow: 0 18px 52px rgba(196,147,32,.24);
    }
    .plan-card.is-pro::before {
      content: '';
      position: absolute; top:0; left:0; right:0; height:3px;
      background: linear-gradient(90deg,transparent,var(--ab-gold),transparent);
      animation: abShimmer 3.5s ease infinite;
    }

    /* Entreprise — dark */
    .plan-card.is-ent {
      background: var(--ab-forest);
      border-color: transparent;
      color: #d4f0d8;
    }
    .plan-card.is-ent:hover {
      transform: translateY(-4px);
      box-shadow: 0 14px 44px rgba(26,48,32,.35);
    }

    /* Current state ring */
    .plan-card.is-current         { box-shadow: 0 0 0 3px rgba(74,222,128,.25); border-color: #4ADE80 !important; }
    .plan-card.is-pro.is-current  { box-shadow: 0 8px 36px rgba(196,147,32,.16), 0 0 0 3px rgba(196,147,32,.3); }

    /* ── Badge ── */
    .plan-badge {
      display: inline-block;
      font-size: 10px; font-weight: 700;
      letter-spacing: .1em; text-transform: uppercase;
      padding: 4px 12px; border-radius: 100px;
      margin-bottom: 18px;
    }
    .badge-recommend { background: var(--ab-gold); color: var(--ab-forest); }
    .badge-current   { background: rgba(74,222,128,.18); color: #16A34A; }
    .badge-ent       { background: rgba(255,255,255,.1); color: rgba(255,255,255,.75); }

    /* ── Icon & name ── */
    .plan-icon { font-size:30px; display:block; margin-bottom:8px; }

    .plan-name {
      font-family: 'Playfair Display', serif;
      font-size: 1.65rem; font-weight: 700;
      color: var(--ab-forest); margin:0 0 14px;
    }
    .plan-card.is-ent .plan-name { color:#E8F4EA; }

    /* ── Pricing ── */
    .plan-amount {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 2.9rem; font-weight: 700;
      color: var(--ab-forest); line-height:1;
    }
    .plan-card.is-pro .plan-amount  { color: var(--ab-gold); }
    .plan-card.is-ent .plan-amount  { color: #fff; }

    .plan-devis {
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 2rem; font-weight: 700;
      color: rgba(255,255,255,.9);
    }

    .plan-period { font-size:12px; color:var(--ab-muted); margin-top:5px; margin-bottom:12px; }
    .plan-card.is-ent .plan-period { color:rgba(255,255,255,.45); }

    .plan-validity {
      display: inline-flex; align-items:center; gap:5px;
      font-size:11px; font-weight:700; letter-spacing:.06em; text-transform:uppercase;
      color: var(--ab-terracotta); margin-bottom:16px;
    }
    .plan-card.is-ent .plan-validity { color:rgba(196,235,200,.7); }

    /* ── Divider ── */
    .plan-divider { height:1px; background:var(--ab-border); margin:16px 0; }
    .plan-card.is-ent .plan-divider { background:rgba(255,255,255,.1); }
    .plan-card.is-pro .plan-divider { background:rgba(196,147,32,.22); }

    /* ── Features ── */
    .plan-features { list-style:none; padding:0; margin:0 0 24px; display:flex; flex-direction:column; gap:9px; }
    .plan-features li { display:flex; align-items:center; gap:9px; font-size:13.5px; font-weight:500; }
    .plan-card.is-ent .plan-features li { color:rgba(255,255,255,.8); }

    .feat-ck {
      width:18px; height:18px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:9px; flex-shrink:0; font-weight:900;
    }
    .ck-green { background:rgba(74,222,128,.15); color:#16A34A; }
    .ck-gold  { background:rgba(196,147,32,.15); color:var(--ab-gold); }
    .ck-white { background:rgba(255,255,255,.12); color:rgba(255,255,255,.65); }

    /* ── CTA buttons ── */
    .plan-cta {
      width:100%; padding:12px 20px; border-radius:12px;
      font-family:'Nunito',sans-serif; font-size:14px; font-weight:700;
      border:none; cursor:pointer; transition:all .2s ease; text-align:center; display:block;
    }
    .cta-active    { background:rgba(74,222,128,.12); color:#16A34A; cursor:default; }
    .cta-pro       { background:var(--ab-gold); color:var(--ab-forest); }
    .cta-pro:hover { background:#B8851C; transform:translateY(-1px); }
    .cta-retro     { background:transparent; color:var(--ab-muted); border:1.5px solid var(--ab-border); }
    .cta-retro:hover { border-color:var(--ab-terracotta); color:var(--ab-terracotta); }
    .cta-ent       { background:rgba(255,255,255,.1); color:#E8F4EA; border:1.5px solid rgba(255,255,255,.18); }
    .cta-ent:hover { background:rgba(255,255,255,.18); }

    /* ── History ── */
    .ab-history { max-width:1100px; margin:0 auto; animation:abUp .55s .28s ease both; }

    .ab-history-title {
      font-family:'Playfair Display',serif;
      font-size:1.2rem; font-weight:700; color:var(--ab-forest);
      padding-bottom:14px; margin-bottom:16px; border-bottom:1.5px solid var(--ab-border);
    }

    .ab-table { width:100%; border-collapse:separate; border-spacing:0; font-size:13px; }

    .ab-table th {
      text-align:left; font-size:10px; font-weight:700; letter-spacing:.1em;
      text-transform:uppercase; color:var(--ab-muted);
      padding:8px 12px;
      background:rgba(26,48,32,.04);
    }
    .ab-table th:first-child { border-radius:8px 0 0 8px; }
    .ab-table th:last-child  { border-radius:0 8px 8px 0; }

    .ab-table td { padding:12px; color:var(--ab-text); border-bottom:1px solid var(--ab-border); }
    .ab-table tr:last-child td { border-bottom:none; }

    .spill { display:inline-block; font-size:11px; font-weight:700; padding:3px 10px; border-radius:100px; }
    .spill-green   { background:rgba(74,222,128,.12); color:#16A34A; }
    .spill-amber   { background:rgba(245,200,66,.15); color:#92600A; }
    .spill-red     { background:rgba(248,113,113,.12); color:#991B1B; }
    .spill-neutral { background:rgba(120,110,100,.1); color:#7A6E60; }

    /* ── Modal overlay ── */
    .ab-overlay {
      position:fixed; inset:0;
      background:rgba(26,48,32,.65);
      backdrop-filter:blur(8px);
      z-index:50; display:flex; align-items:center; justify-content:center; padding:16px;
      animation:abFade .25s ease both;
    }

    .ab-modal {
      background:var(--ab-cream); border-radius:24px;
      width:100%; max-width:440px; overflow:hidden;
      box-shadow:0 32px 80px rgba(26,48,32,.35);
      animation:abUp .3s ease both;
    }

    .ab-modal-head {
      padding:22px 24px 18px; border-bottom:1px solid var(--ab-border);
      display:flex; align-items:flex-start; justify-content:space-between; gap:12px;
    }
    .ab-modal-title { font-family:'Playfair Display',serif; font-size:1.2rem; font-weight:700; color:var(--ab-forest); }
    .ab-modal-sub   { font-size:12.5px; color:var(--ab-muted); margin-top:3px; }
    .ab-modal-x {
      width:32px; height:32px; border-radius:50%; border:none;
      background:rgba(26,48,32,.06); color:var(--ab-muted); font-size:18px;
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      flex-shrink:0; transition:background .15s;
    }
    .ab-modal-x:hover { background:rgba(26,48,32,.12); }

    .ab-modal-body { padding:24px; }

    .fm-label {
      display:block; font-size:11px; font-weight:700; letter-spacing:.07em;
      text-transform:uppercase; color:var(--ab-muted); margin-bottom:9px;
    }

    .ab-radio-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:20px; }
    .ab-radio-label { cursor:pointer; }
    .ab-radio-label input { display:none; }
    .ab-radio-box {
      border:1.5px solid var(--ab-border); border-radius:12px;
      padding:12px; text-align:center; transition:all .15s; background:white;
    }
    .ab-radio-label input:checked + .ab-radio-box {
      border-color:var(--ab-gold); background:rgba(196,147,32,.06);
    }
    .rb-title { font-size:13px; font-weight:700; color:var(--ab-forest); }
    .rb-price { font-size:12px; color:var(--ab-terracotta); font-weight:600; margin-top:3px; }
    .rb-note  { font-size:10px; color:#16A34A; font-weight:700; margin-top:3px; }

    .ab-tel {
      width:100%; padding:11px 14px;
      border:1.5px solid var(--ab-border); border-radius:10px;
      font-family:'Nunito',sans-serif; font-size:14px; color:var(--ab-text);
      background:white; outline:none; transition:border-color .15s; box-sizing:border-box;
    }
    .ab-tel:focus { border-color:var(--ab-gold); box-shadow:0 0 0 3px rgba(196,147,32,.1); }

    .ab-summary {
      background:rgba(26,48,32,.04); border-radius:12px; padding:14px; margin:16px 0; font-size:13px;
    }
    .ab-sum-row   { display:flex; justify-content:space-between; margin-bottom:8px; color:var(--ab-text); }
    .ab-sum-total {
      display:flex; justify-content:space-between; font-weight:700; color:var(--ab-forest);
      font-size:14px; border-top:1px solid var(--ab-border); padding-top:10px;
    }

    .ab-modal-actions { display:flex; gap:10px; }
    .ab-btn-cancel {
      flex:1; padding:11px; border-radius:10px; border:1.5px solid var(--ab-border);
      background:white; color:var(--ab-muted); font-family:'Nunito',sans-serif;
      font-size:14px; font-weight:600; cursor:pointer; transition:all .15s;
    }
    .ab-btn-cancel:hover { border-color:var(--ab-terracotta); color:var(--ab-terracotta); }

    .ab-btn-pay {
      flex:2; padding:11px; border-radius:10px; border:none;
      background:var(--ab-gold); color:var(--ab-forest);
      font-family:'Nunito',sans-serif; font-size:14px; font-weight:700;
      cursor:pointer; transition:all .15s;
    }
    .ab-btn-pay:hover:not(:disabled) { background:#B8851C; transform:translateY(-1px); }
    .ab-btn-pay:disabled { opacity:.6; cursor:not-allowed; }

    /* ── Payment pending step ── */
    .ab-pending { padding:32px 24px; text-align:center; }

    .ab-p-icon {
      width:64px; height:64px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:28px; margin:0 auto 20px;
    }

    .ab-p-title {
      font-family:'Playfair Display',serif; font-size:1.3rem; font-weight:700;
      color:var(--ab-forest); margin-bottom:10px;
    }
    .ab-p-desc { font-size:13.5px; color:var(--ab-muted); line-height:1.65; margin-bottom:20px; }

    .ab-ref {
      background:rgba(26,48,32,.04); border-radius:10px; padding:12px; margin-bottom:16px;
    }
    .ab-ref-lbl { font-size:11px; color:var(--ab-muted); margin-bottom:4px; }
    .ab-ref-val { font-family:monospace; font-size:13px; font-weight:700; color:var(--ab-forest); letter-spacing:.05em; }

    .ab-btn-link {
      display:block; text-align:center; padding:11px; border-radius:10px;
      background:rgba(26,48,32,.06); color:var(--ab-forest); font-size:13px; font-weight:600;
      cursor:pointer; text-decoration:none; margin-bottom:10px; transition:background .15s;
    }
    .ab-btn-link:hover { background:rgba(26,48,32,.1); }

    .ab-btn-verify {
      width:100%; padding:12px; border-radius:10px; border:none;
      background:var(--ab-forest); color:white;
      font-family:'Nunito',sans-serif; font-size:14px; font-weight:700;
      cursor:pointer; transition:all .15s; margin-bottom:10px;
    }
    .ab-btn-verify:hover:not(:disabled) { background:var(--ab-forest-mid); }
    .ab-btn-verify:disabled { opacity:.6; cursor:not-allowed; }

    .ab-btn-skip {
      background:none; border:none; color:var(--ab-muted); font-family:'Nunito',sans-serif;
      font-size:13px; cursor:pointer; padding:6px; width:100%; transition:color .15s;
    }
    .ab-btn-skip:hover { color:var(--ab-terracotta); }

    /* ── Keyframes ── */
    @keyframes abUp {
      from { opacity:0; transform:translateY(18px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes abFade {
      from { opacity:0; } to { opacity:1; }
    }
    @keyframes abPulse {
      0%,100% { opacity:1; } 50% { opacity:.35; }
    }
    @keyframes abShimmer {
      0%   { opacity:0; background-position:-200% center; }
      30%  { opacity:1; }
      70%  { opacity:1; }
      100% { opacity:0; }
    }
  `],
  template: `
    <div class="ab-wrap">

      <!-- ── Header ── -->
      <header class="ab-header">
        <div class="ab-eyebrow">Agri-ERP</div>
        <h1>Choisissez votre plan</h1>
        <p>Simple, transparent, adapté à votre exploitation</p>
        @if (auth.organisation()) {
          <div class="ab-chip">
            <span class="dot"></span>
            Plan <strong style="margin-left:3px">{{ planLabel() }}</strong>&nbsp;actif
            @if (auth.organisation()?.plan_expire_at) {
              &nbsp;— expire le&nbsp;{{ auth.organisation()!.plan_expire_at | dateFr }}
            }
          </div>
        }
      </header>

      <!-- ── Status banners ── -->
      @if (statutPaiement() === 'attente') {
        <div class="ab-alert ab-alert-warning">
          <div class="ab-alert-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" style="animation:abPulse 1s ease infinite">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div>
            <div style="font-weight:700">Vérification en cours…</div>
            <div style="font-size:12px;opacity:.7;margin-top:2px">Cela peut prendre jusqu'à 60 secondes.</div>
          </div>
        </div>
      }
      @if (statutPaiement() === 'succes') {
        <div class="ab-alert ab-alert-success">
          <div class="ab-alert-icon">✓</div>
          <div style="font-weight:700">Paiement confirmé — votre plan a été mis à jour !</div>
        </div>
      }
      @if (statutPaiement() === 'erreur') {
        <div class="ab-alert ab-alert-error">
          <div class="ab-alert-icon">✕</div>
          <div style="font-weight:700">Paiement non confirmé. Contactez le support si vous avez été débité.</div>
        </div>
      }

      <!-- ── Plans ── -->
      <div class="ab-plans">

        <!-- Gratuit -->
        <div class="plan-card" [class.is-current]="currentPlan() === 'gratuit'">
          @if (currentPlan() === 'gratuit') {
            <span class="plan-badge badge-current">Plan actuel</span>
          }
          <span class="plan-icon">🌱</span>
          <div class="plan-name">Gratuit</div>
          <div class="plan-amount">0</div>
          <div class="plan-period">FCFA</div>
          <div class="plan-validity">⏱ Essai 7 jours</div>
          <div class="plan-divider"></div>
          <ul class="plan-features">
            @for (f of plans[0].features; track f) {
              <li><span class="feat-ck ck-green">✓</span>{{ f }}</li>
            }
          </ul>
          @if (currentPlan() === 'gratuit') {
            <div class="plan-cta cta-active">Plan actuel</div>
          } @else {
            <button class="plan-cta cta-retro" (click)="retrograder()">Rétrograder</button>
          }
        </div>

        <!-- Pro — featured -->
        <div class="plan-card is-pro" [class.is-current]="currentPlan() === 'pro'">
          @if (currentPlan() === 'pro') {
            <span class="plan-badge badge-current">Plan actuel</span>
          } @else {
            <span class="plan-badge badge-recommend">⭐ Recommandé</span>
          }
          <span class="plan-icon">🌾</span>
          <div class="plan-name">Pro</div>
          <div class="plan-amount">10 000</div>
          <div class="plan-period">FCFA / mois</div>
          <div class="plan-validity">♻ Mensuel renouvelable</div>
          <div class="plan-divider"></div>
          <ul class="plan-features">
            @for (f of plans[1].features; track f) {
              <li><span class="feat-ck ck-gold">✓</span>{{ f }}</li>
            }
          </ul>
          @if (currentPlan() === 'pro') {
            <div class="plan-cta cta-active">Plan actuel</div>
          } @else {
            <button class="plan-cta cta-pro" (click)="ouvrirPaiement(plans[1])">Souscrire au Pro</button>
          }
        </div>

        <!-- Entreprise — dark -->
        <div class="plan-card is-ent" [class.is-current]="currentPlan() === 'entreprise'">
          @if (currentPlan() === 'entreprise') {
            <span class="plan-badge" style="background:rgba(74,222,128,.18);color:#86EFAC">Plan actuel</span>
          } @else {
            <span class="plan-badge badge-ent">Sur devis</span>
          }
          <span class="plan-icon">🏭</span>
          <div class="plan-name">Entreprise</div>
          <div class="plan-devis">Sur devis</div>
          <div class="plan-period">Contact pour tarification</div>
          <div class="plan-validity">✦ Accompagnement inclus</div>
          <div class="plan-divider"></div>
          <ul class="plan-features">
            @for (f of plans[2].features; track f) {
              <li><span class="feat-ck ck-white">✓</span>{{ f }}</li>
            }
          </ul>
          @if (currentPlan() === 'entreprise') {
            <div class="plan-cta cta-active" style="background:rgba(74,222,128,.15);color:#86EFAC">Plan actuel</div>
          } @else {
            <button class="plan-cta cta-ent" (click)="contactEntreprise()">Nous contacter</button>
          }
        </div>

      </div>

      <!-- ── Historique ── -->
      @if (historique().length) {
        <div class="ab-history">
          <div class="ab-history-title">Historique des paiements</div>
          <div style="overflow-x:auto">
            <table class="ab-table">
              <thead>
                <tr>
                  <th>Plan</th><th>Référence</th>
                  <th style="text-align:right">Montant</th>
                  <th>Moyen</th><th>Statut</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                @for (h of historique(); track h.id) {
                  <tr>
                    <td style="font-weight:600;text-transform:capitalize">{{ h.plan }}</td>
                    <td style="font-family:monospace;font-size:11px;color:var(--ab-muted)">{{ h.reference_paiement ?? '—' }}</td>
                    <td style="text-align:right;font-weight:600">
                      @if (h.montant_fcfa > 0) { {{ h.montant_fcfa | currencyFcfa }} } @else { Gratuit }
                    </td>
                    <td style="font-size:13px">
                      @if (h.processeur_paiement === 'wave') { 🌊 Wave }
                      @else if (h.processeur_paiement === 'orange_money') { 🟠 Orange Money }
                      @else { — }
                    </td>
                    <td>
                      <span class="spill"
                            [class.spill-green]="h.statut === 'confirme' || h.statut === 'paye'"
                            [class.spill-amber]="h.statut === 'en_attente'"
                            [class.spill-red]="h.statut === 'echoue'"
                            [class.spill-neutral]="h.statut !== 'confirme' && h.statut !== 'paye' && h.statut !== 'en_attente' && h.statut !== 'echoue'">
                        {{ statutLabel(h.statut) }}
                      </span>
                    </td>
                    <td style="color:var(--ab-muted);font-size:12px">{{ h.debut | dateFr }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ── Modal paiement ── -->
      @if (showModalPaiement()) {
        <div class="ab-overlay" (click)="fermerModal()">
          <div class="ab-modal" (click)="$event.stopPropagation()">

            @if (!paiementInitie()) {
              <!-- Étape 1 : choix -->
              <div class="ab-modal-head">
                <div>
                  <div class="ab-modal-title">Souscrire au plan {{ planSelectionne()?.nom }}</div>
                  <div class="ab-modal-sub">Choisissez votre mode de paiement</div>
                </div>
                <button class="ab-modal-x" (click)="fermerModal()">&times;</button>
              </div>
              <form [formGroup]="formPaiement" (ngSubmit)="initierPaiement()" class="ab-modal-body">

                <div>
                  <div class="fm-label">Périodicité</div>
                  <div class="ab-radio-grid">
                    <label class="ab-radio-label">
                      <input type="radio" formControlName="periodicite" value="mensuel"/>
                      <div class="ab-radio-box">
                        <div class="rb-title">Mensuel</div>
                        <div class="rb-price">{{ planSelectionne()?.prix_mensuel | currencyFcfa }}/mois</div>
                      </div>
                    </label>
                    <label class="ab-radio-label">
                      <input type="radio" formControlName="periodicite" value="annuel"/>
                      <div class="ab-radio-box">
                        <div class="rb-title">Annuel</div>
                        <div class="rb-price">{{ planSelectionne()?.prix_annuel | currencyFcfa }}/an</div>
                        <div class="rb-note">2 mois offerts</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <div class="fm-label">Moyen de paiement</div>
                  <div class="ab-radio-grid">
                    <label class="ab-radio-label">
                      <input type="radio" formControlName="processeur" value="wave"/>
                      <div class="ab-radio-box">
                        <div style="font-size:24px;margin-bottom:4px">🌊</div>
                        <div class="rb-title">Wave</div>
                      </div>
                    </label>
                    <label class="ab-radio-label">
                      <input type="radio" formControlName="processeur" value="orange_money"/>
                      <div class="ab-radio-box">
                        <div style="font-size:24px;margin-bottom:4px">🟠</div>
                        <div class="rb-title">Orange Money</div>
                      </div>
                    </label>
                  </div>
                </div>

                <div style="margin-bottom:16px">
                  <div class="fm-label">Numéro de téléphone</div>
                  <input type="tel" formControlName="telephone" class="ab-tel" placeholder="ex: +221 77 000 00 00"/>
                  @if (formPaiement.get('telephone')?.invalid && formPaiement.get('telephone')?.touched) {
                    <div style="color:var(--ab-terracotta);font-size:12px;margin-top:5px">Numéro requis.</div>
                  }
                </div>

                <div class="ab-summary">
                  <div class="ab-sum-row">
                    <span>Plan {{ planSelectionne()?.nom }}</span>
                    <span>{{ formPaiement.value.periodicite === 'annuel'
                      ? (planSelectionne()?.prix_annuel | currencyFcfa)
                      : (planSelectionne()?.prix_mensuel | currencyFcfa) }}</span>
                  </div>
                  <div class="ab-sum-total">
                    <span>Total à payer</span>
                    <span style="color:var(--ab-gold)">{{ formPaiement.value.periodicite === 'annuel'
                      ? (planSelectionne()?.prix_annuel | currencyFcfa)
                      : (planSelectionne()?.prix_mensuel | currencyFcfa) }}</span>
                  </div>
                </div>

                <div class="ab-modal-actions">
                  <button type="button" class="ab-btn-cancel" (click)="fermerModal()">Annuler</button>
                  <button type="submit" class="ab-btn-pay" [disabled]="saving() || formPaiement.invalid">
                    {{ saving() ? 'Traitement…' : 'Payer maintenant' }}
                  </button>
                </div>
              </form>

            } @else {
              <!-- Étape 2 : confirmation -->
              <div class="ab-pending">
                <div class="ab-p-icon" [style.background]="formPaiement.value.processeur === 'wave' ? '#E0F2FE' : '#FFF3E0'">
                  {{ formPaiement.value.processeur === 'wave' ? '🌊' : '🟠' }}
                </div>
                <div class="ab-p-title">Paiement en attente</div>
                <div class="ab-p-desc">
                  @if (formPaiement.value.processeur === 'wave') {
                    Ouvrez votre application Wave et confirmez le paiement de
                    <strong>{{ planSelectionne()?.prix_mensuel | currencyFcfa }}</strong>.
                  } @else {
                    Composez le code USSD Orange Money pour confirmer le paiement de
                    <strong>{{ planSelectionne()?.prix_mensuel | currencyFcfa }}</strong>.
                  }
                </div>
                @if (referencePaiement()) {
                  <div class="ab-ref">
                    <div class="ab-ref-lbl">Référence de paiement</div>
                    <div class="ab-ref-val">{{ referencePaiement() }}</div>
                  </div>
                }
                @if (lienPaiement()) {
                  <a [href]="lienPaiement()!" target="_blank" class="ab-btn-link">
                    {{ formPaiement.value.processeur === 'wave' ? '🌊 Ouvrir Wave' : '📱 Ouvrir Orange Money' }}
                  </a>
                }
                <button class="ab-btn-verify" (click)="verifierPaiement()" [disabled]="saving()">
                  {{ saving() ? 'Vérification…' : "✓ J'ai payé — Vérifier" }}
                </button>
                <button class="ab-btn-skip" (click)="fermerModal()">Annuler</button>
              </div>
            }

          </div>
        </div>
      }

    </div>
  `,
})
export class AbonnementComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private notif = inject(NotificationService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  auth = inject(AuthService);

  saving          = signal(false);
  showModalPaiement = signal(false);
  planSelectionne = signal<any>(null);
  paiementInitie  = signal(false);
  lienPaiement    = signal<string | null>(null);
  referencePaiement = signal<string | null>(null);
  numeroMarchand  = signal<string | null>(null);
  historique      = signal<any[]>([]);
  paiementEnCours = signal(false);
  referenceId     = signal<string | null>(null);
  statutPaiement  = signal<'idle' | 'attente' | 'succes' | 'erreur'>('idle');

  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  currentPlan = () => this.auth.organisation()?.plan ?? 'gratuit';
  planLabel   = () => ({ gratuit: 'Gratuit', pro: 'Pro', entreprise: 'Entreprise' }[this.currentPlan()] ?? this.currentPlan());
  statutLabel = (s: string) => ({ confirme: 'Confirmé', paye: 'Payé', en_attente: 'En attente', echoue: 'Échoué' }[s] ?? s);

  plans = [
    {
      id: 'gratuit', nom: 'Gratuit', prix_mensuel: 0, prix_annuel: 0,
      features: ['1 champ', '1 culture', '1 utilisateur', 'Tableau de bord', 'Dépenses & ventes'],
    },
    {
      id: 'pro', nom: 'Pro', prix_mensuel: 10000, prix_annuel: 100000,
      features: ['2 champs & 3 cultures', '2 utilisateurs inclus', 'Export Excel 3 feuilles & PDF', 'Import CSV en masse', 'Paiement mobile Orange Money/Wave',],
    },
    {
      id: 'entreprise', nom: 'Entreprise', prix_mensuel: null as number | null, prix_annuel: null as number | null,
      features: ['Champs & utilisateurs illimités', 'Export & import illimités', 'API dédiée', 'Accompagnement dédié', 'Support prioritaire 7j/7', 'Formation équipe incluse'],
      sur_devis: true,
    },
  ];

  formPaiement = this.fb.group({
    periodicite: ['mensuel', Validators.required],
    processeur:  ['wave',    Validators.required],
    telephone:   ['', [Validators.required, Validators.minLength(8)]],
  });

  ngOnInit(): void {
    this.api.get<any>('/api/abonnement/historique').subscribe({
      next: res => this.historique.set(res.data ?? []),
    });
    this.route.queryParams.subscribe(params => {
      const statut = params['statut'];
      const ref    = params['ref'];
      if (statut === 'succes' && ref) { this.statutPaiement.set('attente'); this.demarrerPolling(ref); }
      else if (statut === 'erreur' || statut === 'annule') { this.statutPaiement.set('erreur'); }
    });
  }

  ngOnDestroy(): void { this.arreterPolling(); }

  ouvrirPaiement(plan: any): void {
    this.planSelectionne.set(plan);
    this.paiementInitie.set(false);
    this.lienPaiement.set(null);
    this.referencePaiement.set(null);
    this.numeroMarchand.set(null);
    this.formPaiement.reset({ periodicite: 'mensuel', processeur: 'wave', telephone: '' });
    this.showModalPaiement.set(true);
  }

  fermerModal(): void {
    this.showModalPaiement.set(false);
    this.planSelectionne.set(null);
    this.paiementInitie.set(false);
    this.arreterPolling();
    this.paiementEnCours.set(false);
    this.api.get<any>('/api/abonnement/historique').subscribe({
      next: res => this.historique.set(res.data ?? []),
    });
  }

  initierPaiement(): void {
    if (this.formPaiement.invalid) { this.formPaiement.markAllAsTouched(); return; }
    if (this.paiementEnCours()) return;
    this.saving.set(true);
    this.paiementEnCours.set(true);
    this.api.post<any>('/api/abonnement/paiement/initier', {
      plan:        this.planSelectionne()!.id,
      periodicite: this.formPaiement.value.periodicite,
      processeur:  this.formPaiement.value.processeur,
      telephone:   this.formPaiement.value.telephone,
    }).subscribe({
      next: res => {
        this.saving.set(false);
        const lien = res.payment_url ?? res.lien_paiement ?? null;
        const ref  = res.reference_id ?? res.reference ?? null;
        this.lienPaiement.set(lien);
        this.referencePaiement.set(ref);
        this.numeroMarchand.set(res.numero_marchand || null);
        this.paiementInitie.set(true);
        if (ref) { this.referenceId.set(ref); this.statutPaiement.set('attente'); this.demarrerPolling(ref); }
        if (lien && res.payment_url) { window.location.href = lien; }
      },
      error: err => {
        this.saving.set(false);
        this.paiementEnCours.set(false);
        this.notif.error(err.error?.message || 'Erreur lors de l\'initiation du paiement.');
      },
    });
  }

  verifierPaiement(): void {
    if (!this.referencePaiement()) return;
    this.saving.set(true);
    this.api.post<any>('/api/abonnement/paiement/verifier', { reference_id: this.referencePaiement() }).subscribe({
      next: res => {
        this.saving.set(false);
        if (res.statut === 'reussi' || res.statut === 'paye' || res.statut === 'confirme') {
          this.notif.success('Paiement confirmé ! Votre plan a été mis à jour.');
          this.auth.refreshUser().subscribe();
          this.fermerModal();
        } else {
          this.notif.error('Paiement non encore confirmé. Réessayez dans quelques instants.');
        }
      },
      error: err => {
        this.saving.set(false);
        this.notif.error(err.error?.message || 'Erreur lors de la vérification.');
      },
    });
  }

  contactEntreprise(): void {
    window.open('mailto:contact@kadiaragro.com?subject=Demande%20plan%20Entreprise%20-%20KadiarAgro', '_blank');
  }

  retrograder(): void {
    if (!confirm('Rétrograder vers le plan Gratuit ? Vous perdrez l\'accès aux fonctionnalités avancées.')) return;
    this.api.post('/api/abonnement/changer', { plan: 'gratuit' }).subscribe({
      next: () => { this.notif.success('Plan rétrogradé vers Gratuit (valide 7 jours).'); this.auth.refreshUser().subscribe(); },
      error: err => this.notif.error(err.error?.message || 'Erreur.'),
    });
  }

  private demarrerPolling(referenceId: string): void {
    let tentatives = 0;
    const MAX = 20;
    this.pollingInterval = setInterval(() => {
      if (++tentatives > MAX) {
        this.arreterPolling();
        this.statutPaiement.set('erreur');
        this.paiementEnCours.set(false);
        return;
      }
      this.api.get<{ statut: string }>(`/api/abonnement/paiement/verifier?reference_id=${referenceId}`).subscribe({
        next: res => {
          if (['reussi','paye','confirme'].includes(res.statut)) {
            this.arreterPolling();
            this.statutPaiement.set('succes');
            this.paiementEnCours.set(false);
            this.notif.success('Paiement confirmé ! Votre plan a été mis à jour.');
            this.chargerDonnees();
          } else if (res.statut === 'echoue') {
            this.arreterPolling();
            this.statutPaiement.set('erreur');
            this.paiementEnCours.set(false);
          }
        },
        error: () => {},
      });
    }, 3000);
  }

  private arreterPolling(): void {
    if (this.pollingInterval) { clearInterval(this.pollingInterval); this.pollingInterval = null; }
  }

  private chargerDonnees(): void {
    this.auth.refreshUser().subscribe();
    this.api.get<any>('/api/abonnement/historique').subscribe({
      next: res => this.historique.set(res.data ?? []),
    });
  }
}

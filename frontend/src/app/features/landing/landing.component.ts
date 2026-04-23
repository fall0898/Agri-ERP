import { Component, OnInit, OnDestroy, HostListener, PLATFORM_ID, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink],
  styles: [`
    :host { display: block; }

    :root {
      --g-deep:  #1A3020; --g-mid: #2D5A35; --g-light: #4A8C55;
      --gold: #C49320; --gold-l: #E8B840;
      --cream: #F8F5EF; --cream-d: #EDE8DF;
      --text: #0F1E14; --muted: #4A6352;
    }

    .lp { font-family: 'DM Sans', system-ui, sans-serif; background: #F8F5EF;
      color: #0F1E14; overflow-x: hidden; }

    .serif { font-family: 'Playfair Display', Georgia, serif; }

    .btn { display: inline-flex; align-items: center; gap: 8px;
      padding: 14px 28px; border-radius: 100px; font-size: 15px;
      font-weight: 600; text-decoration: none; cursor: pointer;
      transition: all .25s ease; border: none; font-family: inherit; white-space: nowrap; }
    .btn-gold { background: #C49320; color: #fff; box-shadow: 0 4px 20px rgba(196,147,32,.4); }
    .btn-gold:hover { background: #E8B840; box-shadow: 0 8px 32px rgba(196,147,32,.55); transform: translateY(-2px); }
    .btn-ghost { background: rgba(255,255,255,.08); color: rgba(255,255,255,.85);
      border: 1.5px solid rgba(255,255,255,.22); }
    .btn-ghost:hover { background: rgba(255,255,255,.15); border-color: rgba(255,255,255,.5); }
    .btn-outline { background: transparent; color: #1A3020; border: 2px solid #1A3020; }
    .btn-outline:hover { background: #1A3020; color: #fff; }

    .reveal { opacity: 0; transform: translateY(28px);
      transition: opacity .7s ease, transform .7s ease; }
    .reveal.in { opacity: 1; transform: none; }
    .d1 { transition-delay: .1s; } .d2 { transition-delay: .2s; }
    .d3 { transition-delay: .3s; } .d4 { transition-delay: .4s; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(28px); }
      to   { opacity: 1; transform: none; }
    }

    /* NAV */
    .lp-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 200;
      padding: 22px 0; transition: background .35s, padding .35s, box-shadow .35s; }
    .lp-nav.scrolled { background: rgba(10,21,13,.92); backdrop-filter: blur(16px);
      padding: 14px 0; box-shadow: 0 2px 32px rgba(0,0,0,.2); }
    .nav-in { max-width: 1160px; margin: 0 auto; padding: 0 24px;
      display: flex; align-items: center; justify-content: space-between; }
    .nav-logo { display: flex; align-items: center; gap: 10px; text-decoration: none; }
    .nav-logo-mark { width: 38px; height: 38px; background: #C49320; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; }
    .nav-logo-text { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 700; color: #fff; }
    .nav-links { display: flex; gap: 36px; list-style: none; }
    .nav-links a { color: rgba(255,255,255,.65); text-decoration: none;
      font-size: 14px; font-weight: 500; transition: color .2s; }
    .nav-links a:hover { color: #fff; }
    @media (max-width: 760px) { .nav-links { display: none; } }

    /* HERO */
    .hero { min-height: 100vh; background: #1A3020; position: relative;
      display: flex; align-items: center; overflow: hidden; }
    .hero::before { content: ''; position: absolute; inset: 0; pointer-events: none;
      background-image: repeating-linear-gradient(0deg,transparent,transparent 24px,
        rgba(74,140,85,.055) 24px,rgba(74,140,85,.055) 26px); }
    .hero-glow { position: absolute; top: -80px; right: -80px; width: 640px; height: 640px;
      pointer-events: none; background: radial-gradient(circle,rgba(196,147,32,.13) 0%,transparent 68%); }
    .hero-glow2 { position: absolute; bottom: -120px; left: -80px; width: 480px; height: 480px;
      pointer-events: none; background: radial-gradient(circle,rgba(107,66,38,.18) 0%,transparent 70%); }
    .hero-inner { max-width: 1160px; margin: 0 auto; padding: 130px 24px 90px;
      display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
      position: relative; z-index: 2; }

    .hero-badge { display: inline-flex; align-items: center; gap: 8px;
      background: rgba(196,147,32,.14); border: 1px solid rgba(196,147,32,.3);
      border-radius: 100px; padding: 6px 16px; color: #E8B840;
      font-size: 13px; font-weight: 500; margin-bottom: 24px;
      animation: fadeUp .7s ease .05s both; }
    .hero h1 { font-size: clamp(38px,4.8vw,68px); line-height: 1.06; color: #fff;
      font-weight: 900; margin-bottom: 24px; animation: fadeUp .8s ease .2s both; }
    .hero h1 em { display: block; font-style: italic; color: #E8B840; }
    .hero-sub { font-size: 17px; line-height: 1.75; color: rgba(255,255,255,.62);
      max-width: 480px; margin-bottom: 40px; animation: fadeUp .7s ease .35s both; }
    .hero-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 14px;
      margin-bottom: 32px; animation: fadeUp .7s ease .5s both; }
    .hero-trust { display: flex; align-items: center; gap: 8px;
      color: rgba(255,255,255,.35); font-size: 13px; animation: fadeUp .7s ease .65s both; }

    /* PHONE */
    .phone-wrap { display: flex; justify-content: center; align-items: center;
      position: relative; animation: fadeUp .9s ease .3s both; }
    .phone-halo { position: absolute; width: 340px; height: 340px;
      background: radial-gradient(circle,rgba(196,147,32,.18) 0%,transparent 68%);
      border-radius: 50%; pointer-events: none; }
    .phone { width: 234px; background: #080f09; border-radius: 44px; padding: 11px;
      box-shadow: 0 0 0 1px rgba(255,255,255,.09),0 48px 96px rgba(0,0,0,.55),
        inset 0 1px 0 rgba(255,255,255,.06);
      transform: perspective(1000px) rotateY(-7deg) rotateX(4deg);
      transition: transform .5s ease; }
    .phone:hover { transform: perspective(1000px) rotateY(-3deg) rotateX(2deg); }
    .phone-screen { background: #F8F5EF; border-radius: 34px; overflow: hidden; height: 462px; }

    .m-nav { background: #1A3020; padding: 14px 14px 11px;
      display: flex; align-items: center; justify-content: space-between; }
    .m-logo { font-family: 'Playfair Display',serif; font-size: 13px; font-weight: 700; color: #fff; }
    .m-av { width: 24px; height: 24px; background: #C49320; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 10px; font-weight: 700; }
    .m-body { padding: 12px 12px 8px; }
    .m-hi { font-size: 10px; color: #4A6352; }
    .m-title { font-size: 13px; font-weight: 700; color: #0F1E14; margin-bottom: 12px; }
    .m-kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 12px; }
    .m-kpi { background: #fff; border-radius: 11px; padding: 9px; box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .m-kpi-l { font-size: 8px; color: #4A6352; margin-bottom: 2px; }
    .m-kpi-v { font-size: 15px; font-weight: 700; color: #0F1E14; }
    .m-kpi-d { font-size: 8px; font-weight: 600; margin-top: 1px; }
    .m-kpi-d.up { color: #27814A; } .m-kpi-d.dn { color: #C0392B; }
    .m-chart { background: #fff; border-radius: 11px; padding: 9px; margin-bottom: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,.06); }
    .m-chart-lbl { font-size: 8px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .5px; color: #0F1E14; margin-bottom: 7px; }
    .m-bars { display: flex; align-items: flex-end; gap: 5px; height: 46px; }
    .m-bg { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px; }
    .m-bp { display: flex; align-items: flex-end; gap: 2px; height: 38px; }
    .m-b { width: 7px; border-radius: 3px 3px 0 0; background: #4A8C55; }
    .m-b.d { background: rgba(196,147,32,.45); }
    .m-bl { font-size: 6.5px; color: #4A6352; }
    .m-sec { font-size: 8px; font-weight: 700; text-transform: uppercase;
      letter-spacing: .5px; color: #0F1E14; margin-bottom: 7px; }
    .m-task { background: #fff; border-radius: 9px; padding: 7px 9px; margin-bottom: 5px;
      display: flex; align-items: center; gap: 7px; box-shadow: 0 1px 4px rgba(0,0,0,.05); }
    .m-dot { width: 7px; height: 7px; border-radius: 50%; background: #4A8C55; flex-shrink: 0; }
    .m-dot.u { background: #E74C3C; }
    .m-task-t { font-size: 8.5px; font-weight: 500; color: #0F1E14; }
    .m-task-d { font-size: 7.5px; color: #4A6352; margin-left: auto; }

    /* PROOF BAR */
    .proof-bar { background: #2D5A35; padding: 22px 0; }
    .proof-bar-in { max-width: 1160px; margin: 0 auto; padding: 0 24px;
      display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 48px; }
    .ps { text-align: center; }
    .ps-n { font-family: 'Playfair Display',serif; font-size: 30px; font-weight: 700;
      color: #E8B840; line-height: 1; }
    .ps-t { font-size: 12px; color: rgba(255,255,255,.6); margin-top: 4px; }
    .pdiv { width: 1px; height: 38px; background: rgba(255,255,255,.12); }
    @media (max-width: 580px) { .pdiv { display: none; } }

    /* SECTIONS */
    .sec { padding: 96px 0; }
    .container { max-width: 1160px; margin: 0 auto; padding: 0 24px; }
    .sec-tag { display: inline-block; padding: 4px 14px; border-radius: 100px;
      background: rgba(196,147,32,.12); color: #C49320;
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 1px; margin-bottom: 16px; }
    .sec-h { font-size: clamp(28px,3.5vw,46px); line-height: 1.18; margin-bottom: 16px; }
    .sec-p { font-size: 17px; color: #4A6352; line-height: 1.75; max-width: 540px; }

    /* PROBLEM */
    .pb-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 56px; }
    .pb-card { background: #fff; border-radius: 22px; padding: 32px;
      border: 1px solid rgba(0,0,0,.06); transition: transform .3s, box-shadow .3s; }
    .pb-card:hover { transform: translateY(-5px); box-shadow: 0 24px 48px rgba(0,0,0,.09); }
    .pb-ic { width: 50px; height: 50px; background: #FEF3F2; border-radius: 14px;
      display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 20px; }
    .pb-card h3 { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
    .pb-card p { font-size: 14px; color: #4A6352; line-height: 1.7; }

    /* FEATURES */
    .feat-sec { background: #1A3020; padding: 96px 0; }
    .feat-grid { display: grid; grid-template-columns: repeat(3,1fr); margin-top: 56px;
      border-radius: 24px; overflow: hidden; border: 1px solid rgba(255,255,255,.07); }
    .feat-cell { background: rgba(255,255,255,.025); padding: 36px 30px;
      border-right: 1px solid rgba(255,255,255,.07);
      border-bottom: 1px solid rgba(255,255,255,.07); transition: background .3s; }
    .feat-cell:hover { background: rgba(255,255,255,.07); }
    .feat-ic { width: 46px; height: 46px; background: rgba(196,147,32,.15); border-radius: 13px;
      display: flex; align-items: center; justify-content: center; font-size: 20px; margin-bottom: 16px; }
    .feat-cell h3 { font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 8px; }
    .feat-cell p { font-size: 13px; color: rgba(255,255,255,.48); line-height: 1.65; }

    /* TESTIMONIAL */
    .testi-sec { background: #EDE8DF; padding: 96px 0; }
    .testi-card { background: #fff; border-radius: 28px; padding: 56px; max-width: 780px;
      margin: 0 auto; box-shadow: 0 24px 64px rgba(26,48,32,.09);
      border: 1px solid rgba(26,48,32,.06); text-align: center; }
    .testi-stars { color: #C49320; font-size: 18px; margin-bottom: 28px; }
    .testi-quote { font-family: 'Playfair Display',serif; font-size: clamp(20px,2.8vw,30px);
      font-style: italic; color: #1A3020; line-height: 1.45; margin-bottom: 36px; }
    .testi-quote span { color: #C49320; }
    .testi-author { display: flex; align-items: center; justify-content: center; gap: 14px; }
    .testi-av { width: 52px; height: 52px; background: #4A8C55; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-family: 'Playfair Display',serif; font-size: 22px; font-weight: 700; color: #fff; }
    .testi-n { font-weight: 700; font-size: 16px; text-align: left; }
    .testi-r { font-size: 13px; color: #4A6352; }

    /* PRICING */
    .price-sec { padding: 96px 0; }
    .price-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 24px;
      max-width: 780px; margin: 56px auto 0; }
    .price-card { background: #fff; border-radius: 24px; padding: 40px;
      border: 1.5px solid rgba(0,0,0,.08); transition: transform .3s, box-shadow .3s; }
    .price-card:hover { transform: translateY(-4px); box-shadow: 0 24px 56px rgba(0,0,0,.1); }
    .price-badge-tag { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 16px; }
    .price-badge-tag.green { background: #2D5A35; color: #fff; }
    .price-badge-tag.gold { background: #C49320; color: #fff; }
    .price-renew { font-size: 11.5px; font-weight: 700; color: #C49320; letter-spacing: .05em; text-transform: uppercase; margin-bottom: 20px; display: flex; align-items: center; gap: 5px; }
    .price-card.dark { background: #1A3020; border-color: #2D5A35; }
    .price-card.dark .price-name { color: #fff; }
    .price-card.dark .price-amt { color: #fff; font-style: italic; font-size: 38px; }
    .price-card.dark .price-per { color: rgba(255,255,255,.45); }
    .price-card.dark .price-list li { color: rgba(255,255,255,.78); border-color: rgba(255,255,255,.07); }
    .price-card.dark .price-list li::before { color: rgba(255,255,255,.4); }
    .price-card.dark .price-badge-tag.green { background: #3D7A46; }
    .price-card.hot { background: #FFFFF8; border-color: #C49320;
      box-shadow: 0 0 0 2px #C49320, 0 28px 60px rgba(196,147,32,.18); }
    .price-badge { display: inline-block; padding: 4px 13px; background: #C49320; color: #fff;
      border-radius: 100px; font-size: 11px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .5px; margin-bottom: 18px; }
    .price-name { font-size: 22px; font-weight: 800; margin-bottom: 4px; color: #1A3020; }
    .price-amt { font-family: 'Playfair Display',serif; font-size: 50px; font-weight: 700;
      line-height: 1.1; margin: 12px 0 4px; color: #1A3020; }
    .price-card.hot .price-amt { color: #C49320; }
    .price-per { font-size: 13px; color: #4A6352; margin-bottom: 12px; }
    .price-list { list-style: none; margin-bottom: 30px; }
    .price-list li { display: flex; align-items: center; gap: 10px; padding: 9px 0;
      font-size: 14px; border-bottom: 1px solid rgba(0,0,0,.05); }
    .price-list li::before { content: '✓'; font-weight: 800; font-size: 15px;
      color: #4A8C55; flex-shrink: 0; }
    .price-pay { font-size: 11.5px; color: #6B8C73; margin-top: 16px;
      padding-top: 14px; border-top: 1px solid rgba(0,0,0,.06);
      display: flex; align-items: center; gap: 6px; }
    .price-essai-tag { display: inline-block; font-size: 11px; font-weight: 700;
      color: #C0392B; letter-spacing: .06em; text-transform: uppercase; margin-bottom: 16px; }
    .btn-outline-dark { background: transparent; border: 2px solid #D0D5C8; color: #4A6352;
      padding: 13px 24px; border-radius: 12px; font-weight: 600; font-size: 15px;
      text-align: center; display: block; transition: all .18s; }
    .btn-outline-dark:hover { border-color: #4A8C55; color: #1A3020; }

    /* CTA */
    .cta-sec { background: #1A3020; padding: 96px 0; text-align: center; position: relative; overflow: hidden; }
    .cta-sec::before { content: ''; position: absolute; top: -160px; left: 50%;
      transform: translateX(-50%); width: 900px; height: 450px;
      background: radial-gradient(ellipse,rgba(196,147,32,.13) 0%,transparent 68%); pointer-events: none; }
    .cta-sec::after { content: ''; position: absolute; inset: 0; pointer-events: none;
      background-image: repeating-linear-gradient(0deg,transparent,transparent 24px,
        rgba(74,140,85,.04) 24px,rgba(74,140,85,.04) 26px); }
    .cta-inner { position: relative; z-index: 2; }
    .cta-h { font-size: clamp(30px,4vw,52px); color: #fff; margin-bottom: 18px; }
    .cta-h em { color: #E8B840; font-style: italic; }
    .cta-p { color: rgba(255,255,255,.5); font-size: 17px; margin-bottom: 40px; }
    .cta-trust { margin-top: 22px; font-size: 12.5px; color: rgba(255,255,255,.3); }

    /* FOOTER */
    footer { background: #070e08; padding: 48px 0 28px; }
    .foot-in { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px; }
    .foot-logo { font-family: 'Playfair Display',serif; font-size: 20px; font-weight: 700; color: rgba(255,255,255,.8); }
    .foot-links { display: flex; gap: 28px; list-style: none; }
    .foot-links a { color: rgba(255,255,255,.35); text-decoration: none; font-size: 13px; transition: color .2s; }
    .foot-links a:hover { color: rgba(255,255,255,.75); }
    .foot-copy { font-size: 12px; color: rgba(255,255,255,.2); text-align: center; width: 100%;
      margin-top: 28px; padding-top: 22px; border-top: 1px solid rgba(255,255,255,.05); }

    /* WHATSAPP FLOAT */
    .wa-btn {
      position: fixed; bottom: 28px; right: 28px; z-index: 999;
      display: flex; align-items: center; gap: 10px;
      background: #25D366; color: #fff;
      padding: 14px 20px 14px 16px;
      border-radius: 100px; text-decoration: none;
      font-size: 14px; font-weight: 600;
      box-shadow: 0 6px 28px rgba(37,211,102,.45);
      transition: transform .25s, box-shadow .25s;
    }
    .wa-btn:hover {
      transform: translateY(-3px) scale(1.03);
      box-shadow: 0 10px 36px rgba(37,211,102,.6);
    }
    .wa-btn svg { flex-shrink: 0; }
    @keyframes waPulse {
      0%,100% { box-shadow: 0 6px 28px rgba(37,211,102,.45), 0 0 0 0 rgba(37,211,102,.4); }
      50%      { box-shadow: 0 6px 28px rgba(37,211,102,.45), 0 0 0 10px rgba(37,211,102,0); }
    }
    .wa-btn { animation: waPulse 2.5s ease infinite; }
    .wa-btn:hover { animation: none; }
    @media (max-width: 480px) {
      .wa-btn span { display: none; }
      .wa-btn { padding: 14px; border-radius: 50%; bottom: 20px; right: 20px; }
    }

    @media (max-width: 900px) {
      .hero-inner { grid-template-columns: 1fr; padding: 110px 24px 64px; }
      .phone-wrap { display: none; }
      .pb-grid { grid-template-columns: 1fr; }
      .feat-grid { grid-template-columns: 1fr 1fr; }
      .price-grid { grid-template-columns: 1fr; max-width: 480px; }
    }
    @media (max-width: 640px) {
      .feat-grid { grid-template-columns: 1fr; }
      .testi-card { padding: 32px 20px; }
      .hero-actions { flex-direction: column; align-items: flex-start; }
    }
  `],
  template: `
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet">

  <div class="lp">

    <!-- NAV -->
    <nav class="lp-nav" [class.scrolled]="navScrolled">
      <div class="nav-in">
        <a routerLink="/" class="nav-logo">
          <div class="nav-logo-mark">
            <svg width="20" height="20" fill="none" stroke="#fff" stroke-width="2.5" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 0 0-6.88 17.26C6.28 18.5 8 17 8 17s1.5 3 4 3 4-3 4-3 1.72 1.5 2.88 2.26A10 10 0 0 0 12 2z"/>
            </svg>
          </div>
          <span class="nav-logo-text serif">Agri-ERP</span>
        </a>
        <ul class="nav-links">
          <li><a href="#features">Fonctionnalités</a></li>
          <li><a href="#tarifs">Tarifs</a></li>
        </ul>
        <div style="display:flex;align-items:center;gap:10px;">
          <a routerLink="/connexion" class="btn btn-ghost" style="padding:10px 20px;font-size:14px;">
            Se connecter
          </a>
          <a routerLink="/inscription" class="btn btn-gold" style="padding:10px 22px;font-size:14px;">
            Essai gratuit →
          </a>
        </div>
      </div>
    </nav>

    <!-- HERO -->
    <section class="hero">
      <div class="hero-glow"></div>
      <div class="hero-glow2"></div>
      <div class="hero-inner">
        <div>
          <div class="hero-badge">🌾 &nbsp;7 jours gratuits — aucune carte bancaire</div>
          <h1 class="serif">
            Pilotez votre exploitation
            <em>comme jamais.</em>
          </h1>
          <p class="hero-sub">
            Le premier ERP agricole pensé pour l'Afrique de l'Ouest.
            Gérez vos champs, stocks, finances et employés depuis votre téléphone —
            en FCFA, en français.
          </p>
          <div class="hero-actions">
            <a routerLink="/inscription" class="btn btn-gold" style="padding:16px 32px;font-size:16px;">
              Commencer gratuitement
              <svg width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
            <a href="#features" class="btn btn-ghost">Voir les fonctionnalités</a>
          </div>
          <div class="hero-trust">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Paiement Orange Money &amp; Wave · Données sécurisées · Sans engagement
          </div>
        </div>

        <div class="phone-wrap">
          <div class="phone-halo"></div>
          <div class="phone">
            <div class="phone-screen">
              <div class="m-nav">
                <span class="m-logo serif">Agri-ERP</span>
                <div style="display:flex;align-items:center;gap:8px;">
                  <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2" viewBox="0 0 24 24"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  <div class="m-av">K</div>
                </div>
              </div>
              <div class="m-body">
                <div class="m-hi">Bonjour, Kadiar 👋</div>
                <div class="m-title">Tableau de bord</div>
                <div class="m-kpis">
                  <div class="m-kpi"><div class="m-kpi-l">Ventes</div><div class="m-kpi-v">6,4M</div><div class="m-kpi-d up">↑ +12%</div></div>
                  <div class="m-kpi"><div class="m-kpi-l">Dépenses</div><div class="m-kpi-v">5,6M</div><div class="m-kpi-d dn">↑ +3%</div></div>
                </div>
                <div class="m-chart">
                  <div class="m-chart-lbl">Finances — FCFA</div>
                  <div class="m-bars">
                    <div class="m-bg"><div class="m-bp"><div class="m-b" style="height:26px"></div><div class="m-b d" style="height:20px"></div></div><div class="m-bl">Jan</div></div>
                    <div class="m-bg"><div class="m-bp"><div class="m-b" style="height:34px"></div><div class="m-b d" style="height:26px"></div></div><div class="m-bl">Fév</div></div>
                    <div class="m-bg"><div class="m-bp"><div class="m-b" style="height:38px"></div><div class="m-b d" style="height:30px"></div></div><div class="m-bl">Mar</div></div>
                    <div class="m-bg"><div class="m-bp"><div class="m-b" style="height:44px"></div><div class="m-b d" style="height:34px"></div></div><div class="m-bl">Avr</div></div>
                    <div class="m-bg"><div class="m-bp"><div class="m-b" style="height:38px"></div><div class="m-b d" style="height:29px"></div></div><div class="m-bl">Mai</div></div>
                  </div>
                </div>
                <div class="m-sec">Tâches urgentes</div>
                <div class="m-task"><div class="m-dot u"></div><div class="m-task-t">Traitement parcelle B</div><div class="m-task-d">Auj.</div></div>
                <div class="m-task"><div class="m-dot"></div><div class="m-task-t">Payer salaires ouvriers</div><div class="m-task-d">Dem.</div></div>
                <div class="m-task"><div class="m-dot"></div><div class="m-task-t">Récolte oignons — Champ A</div><div class="m-task-d">Sam.</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PROOF BAR -->
    <div class="proof-bar">
      <div class="proof-bar-in">
        <div class="ps"><div class="ps-n serif">500+</div><div class="ps-t">Exploitants actifs</div></div>
        <div class="pdiv"></div>
        <div class="ps"><div class="ps-n serif">12</div><div class="ps-t">Pays couverts</div></div>
        <div class="pdiv"></div>
        <div class="ps"><div class="ps-n serif">4.9★</div><div class="ps-t">Satisfaction client</div></div>
        <div class="pdiv"></div>
        <div class="ps"><div class="ps-n serif">2 min</div><div class="ps-t">Pour démarrer</div></div>
      </div>
    </div>

    <!-- PROBLÈME -->
    <section class="sec">
      <div class="container">
        <div class="reveal"><div class="sec-tag">Le problème</div>
          <h2 class="serif sec-h">Gérer sans outil, c'est perdre<br>de l'argent chaque saison.</h2>
          <p class="sec-p">Les exploitants qui gèrent tout de mémoire perdent en moyenne <strong>30% de leur marge</strong> faute de visibilité. Agri-ERP change ça.</p>
        </div>
        <div class="pb-grid">
          <div class="pb-card reveal d1"><div class="pb-ic">📋</div><h3>Pas de visibilité financière</h3><p>Impossible de savoir si la saison est rentable avant la fin. Les dépenses se perdent, les ventes ne sont pas tracées.</p></div>
          <div class="pb-card reveal d2"><div class="pb-ic">🌿</div><h3>Cultures gérées à l'aveugle</h3><p>Sans suivi des intrants et rendements par parcelle, difficile d'optimiser sa production d'une saison à l'autre.</p></div>
          <div class="pb-card reveal d3"><div class="pb-ic">👷</div><h3>Salaires et avances non maîtrisés</h3><p>Conflits sur les paiements, salaires oubliés, avances non remboursées — sans outil, c'est du stress permanent.</p></div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section class="feat-sec" id="features">
      <div class="container">
        <div class="reveal" style="text-align:center;">
          <div class="sec-tag" style="background:rgba(196,147,32,.15);color:#E8B840;">La solution</div>
          <h2 class="serif sec-h" style="color:#fff;max-width:620px;margin:0 auto;">Tout ce dont votre exploitation<br>a besoin. Un seul outil.</h2>
        </div>
        <div class="feat-grid">
          <div class="feat-cell reveal d1"><div class="feat-ic">🗺️</div><h3>Gestion des champs</h3><p>Suivez chaque parcelle, culture, rendement. Historique complet par champ, alertes et calendrier agricole.</p></div>
          <div class="feat-cell reveal d2"><div class="feat-ic">📦</div><h3>Stocks &amp; intrants</h3><p>Alertes de seuil automatiques. Mouvements de stock tracés. Gestion des semences, engrais et produits phyto.</p></div>
          <div class="feat-cell reveal d3"><div class="feat-ic">💰</div><h3>Finances complètes</h3><p>Dépenses, ventes, bilan net en FCFA. Comparaison de saisons. Export Excel pour votre comptable.</p></div>
          <div class="feat-cell reveal d1"><div class="feat-ic">👷</div><h3>Employés &amp; salaires</h3><p>Fiche employé, paiement des salaires, avances individuelles remboursables. Tout tracé automatiquement.</p></div>
          <div class="feat-cell reveal d2"><div class="feat-ic">🤖</div><h3>Diagnostic IA des plantes</h3><p>Photographiez une maladie → diagnostic et traitement adapté à l'Afrique de l'Ouest. Powered by Claude AI.</p></div>
          <div class="feat-cell reveal d3"><div class="feat-ic">⛅</div><h3>Météo par parcelle</h3><p>Prévisions météo localisées pour chaque champ. Anticipez les risques climatiques avant qu'il ne soit trop tard.</p></div>
        </div>
      </div>
    </section>

    <!-- TÉMOIGNAGE -->
    <section class="testi-sec">
      <div class="container">
        <div class="testi-card reveal">
          <div class="testi-stars">★★★★★</div>
          <p class="testi-quote serif">"Avant Agri-ERP, je ne savais jamais si ma saison était rentable. Aujourd'hui je vois <span>tout en temps réel</span> — mes ventes, mes dépenses, mes employés. J'ai économisé plus de <span>800 000 FCFA</span> cette saison rien qu'en évitant les pertes de stocks."</p>
          <div class="testi-author">
            <div class="testi-av serif">M</div>
            <div><div class="testi-n">Mamadou Diallo</div><div class="testi-r">Exploitant oignon — Podor, Sénégal</div></div>
          </div>
        </div>
      </div>
    </section>

    <!-- TARIFS -->
    <section class="price-sec" id="tarifs">
      <div class="container" style="text-align:center;">
        <div class="reveal">
          <div class="sec-tag">Tarifs</div>
          <h2 class="serif sec-h">Simple, transparent, africain.</h2>
          <p class="sec-p" style="margin:0 auto;">Payez via Orange Money ou Wave — depuis votre téléphone. Pas de carte bancaire, pas de surprise.</p>
        </div>
        <div class="price-grid">

          <!-- Gratuit -->
          <div class="price-card reveal d1" style="text-align:left;">
            <div class="text-4xl mb-3">🌱</div>
            <div class="price-name">Gratuit</div>
            <div class="price-amt serif">0</div>
            <div class="price-per">FCFA</div>
            <div class="price-essai-tag">⏱ ESSAI 7 JOURS</div>
            <hr style="border:none;border-top:1px solid #E8EDE5;margin:16px 0 20px;"/>
            <ul class="price-list">
              <li>1 champ</li>
              <li>1 culture</li>
              <li>1 utilisateur</li>
              <li>Tableau de bord</li>
              <li>Dépenses &amp; ventes</li>
            </ul>
            <a routerLink="/inscription" class="btn-outline-dark">Commencer gratuitement</a>
          </div>

          <!-- Pro -->
          <div class="price-card hot reveal d2" style="text-align:left;">
            <div class="price-badge">⭐ Recommandé</div>
            <div class="text-4xl mb-3">🌾</div>
            <div class="price-name">Pro</div>
            <div class="price-amt serif">10 000</div>
            <div class="price-per">FCFA / mois</div>
            <div class="price-renew">🔄 MENSUEL RENOUVELABLE</div>
            <hr style="border:none;border-top:1px solid rgba(196,147,32,.25);margin:0 0 20px;"/>
            <ul class="price-list">
              <li>2 champs &amp; 3 cultures</li>
              <li>2 utilisateurs inclus</li>
              <li>Export Excel 3 feuilles &amp; PDF</li>
              <li>Import CSV en masse</li>
              <li>Paiement mobile Orange Money/Wave</li>
            </ul>
            <a routerLink="/inscription" class="btn btn-gold" style="width:100%;justify-content:center;">Souscrire au Pro</a>
          </div>

          <!-- Entreprise -->
          <div class="price-card dark reveal d3" style="text-align:left;">
            <div class="price-badge-tag green">✦ ENTREPRISE</div>
            <div class="text-4xl mb-3">🏭</div>
            <div class="price-name">Entreprise</div>
            <div class="price-amt serif" style="font-style:italic;">Sur devis</div>
            <div class="price-per" style="color:rgba(255,255,255,.45);">Contact pour tarification</div>
            <div class="price-badge-tag green" style="margin-bottom:20px;">✦ ACCOMPAGNEMENT INCLUS</div>
            <ul class="price-list">
              <li>Champs &amp; utilisateurs illimités</li>
              <li>Export &amp; import illimités</li>
              <li>API dédiée</li>
              <li>Accompagnement dédié</li>
              <li>Support prioritaire 7j/7</li>
              <li>Formation équipe incluse</li>
            </ul>
            <a href="https://wa.me/221770809798?text=Bonjour%2C%20je%20suis%20int%C3%A9ress%C3%A9%20par%20le%20forfait%20Entreprise%20d%27Agri-ERP.%20Pouvez-vous%20me%20donner%20plus%20d%27informations%20sur%20la%20tarification%20%3F" target="_blank" rel="noopener" class="btn btn-outline" style="width:100%;justify-content:center;gap:8px;border-color:rgba(255,255,255,.25);color:#fff;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white" style="flex-shrink:0;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L.057 23.882l6.244-1.637A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.012-1.374l-.36-.213-3.705.972.988-3.61-.234-.37A9.818 9.818 0 1112 21.818z"/></svg>
              Nous contacter sur WhatsApp
            </a>
          </div>

        </div>
      </div>
    </section>

    <!-- CTA FINALE -->
    <section class="cta-sec">
      <div class="cta-inner container">
        <h2 class="serif cta-h reveal">Votre prochaine saison sera<br><em>votre meilleure saison.</em></h2>
        <p class="cta-p reveal d1">Rejoignez 500+ exploitants qui pilotent leur ferme avec Agri-ERP.</p>
        <div class="reveal d2">
          <a routerLink="/inscription" class="btn btn-gold" style="padding:18px 40px;font-size:17px;">
            Commencer gratuitement — 7 jours
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
        </div>
        <p class="cta-trust reveal d3">Aucune carte bancaire · Orange Money &amp; Wave · Résiliable à tout moment</p>
      </div>
    </section>

    <!-- FOOTER -->
    <footer>
      <div class="container">
        <div class="foot-in">
          <div class="foot-logo serif">Agri-ERP</div>
          <ul class="foot-links">
            <li><a href="#features">Fonctionnalités</a></li>
            <li><a href="#tarifs">Tarifs</a></li>
            <li><a routerLink="/connexion">Connexion</a></li>
            <li><a routerLink="/inscription">S'inscrire</a></li>
          </ul>
        </div>
        <div class="foot-copy">© 2025 Agri-ERP — L'ERP agricole de l'Afrique de l'Ouest</div>
      </div>
    </footer>

  <!-- WHATSAPP FLOAT -->
  <a href="https://wa.me/221770809798?text=Bonjour%2C%20je%20voudrais%20en%20savoir%20plus%20sur%20Agri-ERP"
     target="_blank" rel="noopener" class="wa-btn">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
    </svg>
    <span>Contactez-nous</span>
  </a>

  </div>
  `,
})
export class LandingComponent implements OnInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  navScrolled = false;
  private io?: IntersectionObserver;

  @HostListener('window:scroll')
  onScroll() { this.navScrolled = window.scrollY > 60; }

  ngOnInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); this.io?.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -56px 0px' });
    setTimeout(() => {
      document.querySelectorAll('.reveal').forEach(el => this.io?.observe(el));
    }, 100);
  }

  ngOnDestroy() { this.io?.disconnect(); }
}

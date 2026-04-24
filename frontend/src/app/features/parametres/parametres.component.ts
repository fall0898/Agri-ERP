import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

interface PlanData {
  organisation: any;
  plan_effectif: string;
  limites: {
    max_champs: number | null;
    max_users: number | null;
    max_cultures: number | null;
    export_excel: boolean;
    import_csv: boolean;
    meteo: boolean;
  };
  usage: {
    nb_champs: number;
    nb_users: number;
    nb_cultures: number;
  };
}

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [ReactiveFormsModule],
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

    *, *::before, *::after { box-sizing: border-box; }
    :host {
      display: block;
      font-family: 'DM Sans', sans-serif;
      --text:      #18181b;
      --sub:       #71717a;
      --border:    #e4e4e7;
      --bg:        #fafafa;
      --surface:   #ffffff;
      --green:     #166534;
      --green-lt:  #16a34a;
      --green-bg:  #f0fdf4;
      --green-mid: #dcfce7;
      --amber:     #92400e;
      --amber-bg:  #fffbeb;
      --red:       #991b1b;
      --red-bg:    #fef2f2;
      --r:         10px;
    }

    /* ── layout ── */
    .p-shell {
      max-width: 960px;
      margin: 0 auto;
      padding: 32px 20px 60px;
    }
    .p-page-header { margin-bottom: 32px; }
    .p-page-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 26px;
      font-weight: 400;
      color: var(--text);
      margin: 0 0 4px;
    }
    .p-page-sub {
      font-size: 14px;
      color: var(--sub);
    }

    .p-grid {
      display: grid;
      grid-template-columns: 200px 1fr;
      gap: 20px;
      align-items: start;
    }
    @media (max-width: 640px) {
      .p-grid { grid-template-columns: 1fr; }
      .p-nav { display: flex; overflow-x: auto; gap: 4px; scrollbar-width: none; }
      .p-nav::-webkit-scrollbar { display: none; }
    }

    /* ── sidebar nav ── */
    .p-nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r);
      padding: 6px;
    }
    @media (max-width: 640px) {
      .p-nav { flex-direction: row; border-radius: var(--r); padding: 4px; }
    }
    .p-nav-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 500;
      color: var(--sub);
      cursor: pointer;
      text-align: left;
      transition: background .15s, color .15s;
      white-space: nowrap;
    }
    .p-nav-btn:hover { background: var(--bg); color: var(--text); }
    .p-nav-btn.active {
      background: var(--green-bg);
      color: var(--green);
    }
    .p-nav-icon {
      width: 32px; height: 32px;
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      background: var(--border);
      flex-shrink: 0;
      transition: background .15s;
    }
    .p-nav-btn.active .p-nav-icon { background: var(--green-mid); }
    @media (max-width: 640px) {
      .p-nav-btn { padding: 8px 10px; gap: 6px; }
      .p-nav-icon { width: 26px; height: 26px; border-radius: 6px; }
      .p-nav-label { display: none; }
    }

    /* ── content card ── */
    .p-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r);
      overflow: hidden;
    }
    .p-card-header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid var(--border);
    }
    .p-card-title {
      font-family: 'Playfair Display', Georgia, serif;
      font-style: italic;
      font-size: 18px;
      font-weight: 400;
      color: var(--text);
      margin: 0 0 3px;
    }
    .p-card-desc { font-size: 12px; color: var(--sub); }
    .p-card-body { padding: 24px; }

    /* ── form fields ── */
    .f-row { margin-bottom: 16px; }
    .f-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 16px;
    }
    @media (max-width: 480px) { .f-grid-2 { grid-template-columns: 1fr; } }
    .f-label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: var(--sub);
      letter-spacing: .3px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .f-input, .f-select {
      width: 100%;
      padding: 10px 12px;
      border: 1.5px solid var(--border);
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      color: var(--text);
      background: var(--surface);
      outline: none;
      transition: border-color .15s, box-shadow .15s;
      appearance: none;
    }
    .f-input:focus, .f-select:focus {
      border-color: var(--green-lt);
      box-shadow: 0 0 0 3px rgba(22,163,74,.1);
    }
    .f-input:disabled, .f-input[readonly] {
      background: var(--bg);
      color: var(--sub);
      cursor: not-allowed;
    }
    .f-input::placeholder { color: #a1a1aa; }
    .f-hint { font-size: 11px; color: var(--sub); margin-top: 4px; }
    .f-divider { height: 1px; background: var(--border); margin: 20px 0; }

    /* ── buttons ── */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      background: var(--green);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background .15s, transform .1s;
    }
    .btn-primary:hover:not(:disabled) { background: #14532d; transform: translateY(-1px); }
    .btn-primary:disabled { opacity: .55; cursor: not-allowed; }
    .btn-danger {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 18px;
      background: var(--red-bg);
      color: var(--red);
      border: 1.5px solid #fca5a5;
      border-radius: 8px;
      font-family: 'DM Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: background .15s;
    }
    .btn-danger:hover { background: #fee2e2; }

    /* ── plan card ── */
    .plan-banner {
      border-radius: 10px;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .plan-banner.gratuit { background: var(--amber-bg); border: 1.5px solid #fde68a; }
    .plan-banner.pro     { background: var(--green-bg); border: 1.5px solid var(--green-mid); }
    .plan-banner.entreprise { background: #f5f3ff; border: 1.5px solid #ddd6fe; }
    .plan-name {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: .5px;
    }
    .plan-banner.gratuit .plan-name { color: var(--amber); }
    .plan-banner.pro     .plan-name { color: var(--green); }
    .plan-banner.entreprise .plan-name { color: #5b21b6; }
    .plan-desc { font-size: 12px; color: var(--sub); margin-top: 2px; }
    .plan-upgrade {
      padding: 7px 14px;
      border-radius: 8px;
      border: none;
      font-family: 'DM Sans', sans-serif;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      background: var(--green);
      color: white;
      white-space: nowrap;
      flex-shrink: 0;
    }

    /* ── usage bars ── */
    .usage-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    @media (max-width: 480px) { .usage-grid { grid-template-columns: 1fr; } }
    .usage-item {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 12px 14px;
    }
    .usage-label {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .4px;
      color: var(--sub);
      margin-bottom: 8px;
    }
    .usage-bar-track {
      height: 5px;
      background: var(--border);
      border-radius: 99px;
      overflow: hidden;
      margin-bottom: 6px;
    }
    .usage-bar-fill {
      height: 100%;
      border-radius: 99px;
      transition: width .4s ease;
    }
    .usage-bar-fill.ok     { background: var(--green-lt); }
    .usage-bar-fill.warn   { background: #f59e0b; }
    .usage-bar-fill.full   { background: #ef4444; }
    .usage-numbers { font-size: 12px; color: var(--sub); }
    .usage-numbers strong { color: var(--text); }
    .usage-unlimited { font-size: 12px; color: var(--green); font-weight: 500; }

    /* ── features grid ── */
    .feat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }
    @media (max-width: 440px) { .feat-grid { grid-template-columns: 1fr; } }
    .feat-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      background: var(--bg);
      font-size: 12px;
      color: var(--sub);
    }
    .feat-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .feat-dot.on  { background: var(--green-lt); }
    .feat-dot.off { background: #d4d4d8; }

    /* ── toggle ── */
    .notif-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 0;
      border-bottom: 1px solid var(--border);
    }
    .notif-row:last-child { border-bottom: none; }
    .notif-label { font-size: 13px; font-weight: 500; color: var(--text); margin-bottom: 2px; }
    .notif-desc { font-size: 11px; color: var(--sub); }
    .toggle {
      width: 42px; height: 24px;
      border-radius: 12px;
      border: none;
      cursor: pointer;
      position: relative;
      flex-shrink: 0;
      transition: background .2s;
      margin-left: 16px;
    }
    .toggle.on  { background: var(--green-lt); }
    .toggle.off { background: #d4d4d8; }
    .toggle-thumb {
      position: absolute;
      top: 3px; left: 3px;
      width: 18px; height: 18px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 1px 3px rgba(0,0,0,.15);
      transition: transform .2s;
    }
    .toggle.on .toggle-thumb { transform: translateX(18px); }

    /* ── whatsapp section ── */
    .wa-linked-banner {
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--green-bg);
      border: 1.5px solid var(--green-mid);
      border-radius: 10px;
      padding: 16px 18px;
      margin-bottom: 20px;
    }
    .wa-linked-icon { font-size: 24px; }
    .wa-linked-title { font-size: 13px; font-weight: 600; color: var(--green); margin-bottom: 2px; }
    .wa-linked-phone { font-size: 15px; font-weight: 700; color: var(--text); }
    .wa-instructions {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 16px 18px;
      margin-bottom: 20px;
    }
    .wa-step-title { font-size: 12px; font-weight: 600; color: var(--sub); text-transform: uppercase; letter-spacing: .3px; margin: 0 0 10px; }
    .wa-steps { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; }
    .wa-steps li { font-size: 13px; color: var(--text); }
    .wa-steps em { color: var(--green); font-style: italic; }
    .wa-intro {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      background: #f0f9ff;
      border: 1.5px solid #bae6fd;
      border-radius: 10px;
      padding: 16px 18px;
    }
    .wa-intro-icon { font-size: 28px; }
    .wa-intro-title { font-size: 14px; font-weight: 600; color: #0369a1; margin-bottom: 4px; }
    .wa-intro-desc { font-size: 13px; color: #0284c7; }
    .f-input-error { border-color: #ef4444 !important; }
    .f-error { font-size: 11px; color: var(--red); margin-top: 4px; }
  `],
  template: `
<div class="p-shell">

  <!-- Page header -->
  <div class="p-page-header">
    <h1 class="p-page-title">Paramètres</h1>
    <p class="p-page-sub">Gérez votre profil et votre exploitation</p>
  </div>

  <div class="p-grid">

    <!-- Sidebar nav -->
    <nav class="p-nav">
      @for (t of tabs; track t.id) {
        <button class="p-nav-btn" [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
          <span class="p-nav-icon" [innerHTML]="t.icon"></span>
          <span class="p-nav-label">{{ t.label }}</span>
        </button>
      }
    </nav>

    <!-- Content -->
    <div>

      <!-- ── Profil ── -->
      @if (activeTab() === 'profil') {
        <div class="p-card">
          <div class="p-card-header">
            <div class="p-card-title">Mon profil</div>
            <div class="p-card-desc">Informations personnelles du compte</div>
          </div>
          <div class="p-card-body">
            <form [formGroup]="profilForm" (ngSubmit)="saveProfil()">
              <div class="f-grid-2">
                <div>
                  <label class="f-label">Prénom</label>
                  <input type="text" formControlName="prenom" class="f-input" placeholder="Votre prénom"/>
                </div>
                <div>
                  <label class="f-label">Nom</label>
                  <input type="text" formControlName="nom" class="f-input" placeholder="Votre nom"/>
                </div>
              </div>
              <div class="f-row">
                <label class="f-label">Email</label>
                <input type="email" formControlName="email" class="f-input" readonly/>
                <p class="f-hint">L'adresse email ne peut pas être modifiée</p>
              </div>
              <div class="f-row">
                <label class="f-label">Téléphone</label>
                <input type="tel" formControlName="telephone" class="f-input" placeholder="+221 77 000 00 00"/>
              </div>
              <button type="submit" class="btn-primary" [disabled]="savingProfil()">
                @if (savingProfil()) {
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" style="animation:spin .8s linear infinite"><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                }
                {{ savingProfil() ? 'Enregistrement…' : 'Sauvegarder' }}
              </button>
            </form>
          </div>
        </div>
      }

      <!-- ── Mot de passe ── -->
      @if (activeTab() === 'motdepasse') {
        <div class="p-card">
          <div class="p-card-header">
            <div class="p-card-title">Mot de passe</div>
            <div class="p-card-desc">Changez votre mot de passe de connexion</div>
          </div>
          <div class="p-card-body">
            <form [formGroup]="passwordForm" (ngSubmit)="savePassword()">
              <div class="f-row">
                <label class="f-label">Mot de passe actuel</label>
                <input type="password" formControlName="current_password" class="f-input" placeholder="••••••••"/>
              </div>
              <div class="f-divider"></div>
              <div class="f-row">
                <label class="f-label">Nouveau mot de passe</label>
                <input type="password" formControlName="password" class="f-input" placeholder="8 caractères minimum"/>
                <p class="f-hint">Minimum 8 caractères</p>
              </div>
              <div class="f-row">
                <label class="f-label">Confirmer le nouveau mot de passe</label>
                <input type="password" formControlName="password_confirmation" class="f-input" placeholder="••••••••"/>
              </div>
              <button type="submit" class="btn-primary" [disabled]="savingPassword() || passwordForm.invalid">
                @if (savingPassword()) {
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" style="animation:spin .8s linear infinite"><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                }
                {{ savingPassword() ? 'Modification…' : 'Changer le mot de passe' }}
              </button>
            </form>
          </div>
        </div>
      }

      <!-- ── Exploitation ── -->
      @if (activeTab() === 'organisation') {
        <div class="p-card" style="margin-bottom: 16px;">
          <div class="p-card-header">
            <div class="p-card-title">Plan & utilisation</div>
            <div class="p-card-desc">Votre abonnement actuel et l'utilisation des ressources</div>
          </div>
          <div class="p-card-body">
            @if (planData()) {
              <!-- Plan banner -->
              <div class="plan-banner" [class]="planData()!.plan_effectif">
                <div>
                  <div class="plan-name">Plan {{ planData()!.plan_effectif }}</div>
                  <div class="plan-desc">
                    @if (planData()!.plan_effectif === 'gratuit') { Essai gratuit — fonctionnalités limitées }
                    @if (planData()!.plan_effectif === 'pro') { Accès complet aux fonctionnalités Pro }
                    @if (planData()!.plan_effectif === 'entreprise') { Accès illimité à toutes les fonctionnalités }
                  </div>
                </div>
                @if (planData()!.plan_effectif !== 'entreprise') {
                  <button class="plan-upgrade" (click)="goToAbonnement()">Upgrader</button>
                }
              </div>

              <!-- Usage bars -->
              <div class="usage-grid">
                <div class="usage-item">
                  <div class="usage-label">Champs</div>
                  @if (planData()!.limites.max_champs !== null) {
                    <div class="usage-bar-track">
                      <div class="usage-bar-fill"
                           [class]="usageClass(planData()!.usage.nb_champs, planData()!.limites.max_champs!)"
                           [style.width.%]="usagePct(planData()!.usage.nb_champs, planData()!.limites.max_champs!)">
                      </div>
                    </div>
                    <div class="usage-numbers"><strong>{{ planData()!.usage.nb_champs }}</strong> / {{ planData()!.limites.max_champs }}</div>
                  } @else {
                    <div class="usage-unlimited">Illimité</div>
                    <div class="usage-numbers"><strong>{{ planData()!.usage.nb_champs }}</strong> champs</div>
                  }
                </div>
                <div class="usage-item">
                  <div class="usage-label">Cultures</div>
                  @if (planData()!.limites.max_cultures !== null) {
                    <div class="usage-bar-track">
                      <div class="usage-bar-fill"
                           [class]="usageClass(planData()!.usage.nb_cultures, planData()!.limites.max_cultures!)"
                           [style.width.%]="usagePct(planData()!.usage.nb_cultures, planData()!.limites.max_cultures!)">
                      </div>
                    </div>
                    <div class="usage-numbers"><strong>{{ planData()!.usage.nb_cultures }}</strong> / {{ planData()!.limites.max_cultures }}</div>
                  } @else {
                    <div class="usage-unlimited">Illimité</div>
                    <div class="usage-numbers"><strong>{{ planData()!.usage.nb_cultures }}</strong> cultures</div>
                  }
                </div>
                <div class="usage-item">
                  <div class="usage-label">Utilisateurs</div>
                  @if (planData()!.limites.max_users !== null) {
                    <div class="usage-bar-track">
                      <div class="usage-bar-fill"
                           [class]="usageClass(planData()!.usage.nb_users, planData()!.limites.max_users!)"
                           [style.width.%]="usagePct(planData()!.usage.nb_users, planData()!.limites.max_users!)">
                      </div>
                    </div>
                    <div class="usage-numbers"><strong>{{ planData()!.usage.nb_users }}</strong> / {{ planData()!.limites.max_users }}</div>
                  } @else {
                    <div class="usage-unlimited">Illimité</div>
                    <div class="usage-numbers"><strong>{{ planData()!.usage.nb_users }}</strong> utilisateurs</div>
                  }
                </div>
              </div>

              <!-- Features -->
              <div class="feat-grid">
                <div class="feat-row">
                  <span class="feat-dot" [class.on]="planData()!.limites.export_excel" [class.off]="!planData()!.limites.export_excel"></span>
                  Export Excel
                </div>
                <div class="feat-row">
                  <span class="feat-dot" [class.on]="planData()!.limites.import_csv" [class.off]="!planData()!.limites.import_csv"></span>
                  Import CSV
                </div>
                <div class="feat-row">
                  <span class="feat-dot" [class.on]="planData()!.limites.meteo" [class.off]="!planData()!.limites.meteo"></span>
                  Météo en temps réel
                </div>
              </div>
            } @else {
              <div style="text-align:center;padding:24px;color:#71717a;font-size:13px;">Chargement…</div>
            }
          </div>
        </div>

        @if (auth.isAdmin()) {
          <div class="p-card">
            <div class="p-card-header">
              <div class="p-card-title">Informations de l'exploitation</div>
              <div class="p-card-desc">Nom, coordonnées et paramètres de campagne</div>
            </div>
            <div class="p-card-body">
              <form [formGroup]="orgForm" (ngSubmit)="saveOrg()">
                <div class="f-row">
                  <label class="f-label">Nom de l'exploitation</label>
                  <input type="text" formControlName="nom" class="f-input" placeholder="Ex : Exploitation Kadiar"/>
                </div>
                <div class="f-row">
                  <label class="f-label">Téléphone</label>
                  <input type="tel" formControlName="telephone" class="f-input" placeholder="+221 77 000 00 00"/>
                </div>
                <div class="f-row">
                  <label class="f-label">Devise</label>
                  <select formControlName="devise" class="f-select">
                    <option value="FCFA">FCFA (Franc CFA)</option>
                    <option value="EUR">EUR (Euro)</option>
                    <option value="USD">USD (Dollar)</option>
                    <option value="GNF">GNF (Franc guinéen)</option>
                    <option value="XOF">XOF (Franc CFA BCEAO)</option>
                  </select>
                </div>
                <div class="f-divider"></div>
                <div class="f-row">
                  <label class="f-label">Début de campagne agricole</label>
                  <div class="f-grid-2" style="margin-bottom:0">
                    <div>
                      <label class="f-label" style="font-size:10px;">Mois</label>
                      <select formControlName="campagne_debut_mois" class="f-select">
                        @for (m of mois; track m.v) {
                          <option [value]="m.v">{{ m.l }}</option>
                        }
                      </select>
                    </div>
                    <div>
                      <label class="f-label" style="font-size:10px;">Jour</label>
                      <select formControlName="campagne_debut_jour" class="f-select">
                        @for (j of jours; track j) {
                          <option [value]="j">{{ j }}</option>
                        }
                      </select>
                    </div>
                  </div>
                  <p class="f-hint" style="margin-top:8px;">Définit le début de l'année agricole pour les rapports financiers</p>
                </div>
                <button type="submit" class="btn-primary" [disabled]="savingOrg()">
                  @if (savingOrg()) {
                    <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" style="animation:spin .8s linear infinite"><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                  }
                  {{ savingOrg() ? 'Enregistrement…' : 'Sauvegarder' }}
                </button>
              </form>
            </div>
          </div>
        }
      }

      <!-- ── Notifications ── -->
      @if (activeTab() === 'notifications') {
        <div class="p-card">
          <div class="p-card-header">
            <div class="p-card-title">Notifications</div>
            <div class="p-card-desc">Choisissez les alertes que vous souhaitez recevoir</div>
          </div>
          <div class="p-card-body">
            @for (pref of notifPrefs; track pref.key) {
              <div class="notif-row">
                <div>
                  <div class="notif-label">{{ pref.label }}</div>
                  <div class="notif-desc">{{ pref.desc }}</div>
                </div>
                <button class="toggle" [class.on]="prefEnabled(pref.key)" [class.off]="!prefEnabled(pref.key)"
                        (click)="togglePref(pref.key)">
                  <span class="toggle-thumb"></span>
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- ── WhatsApp ── -->
      @if (activeTab() === 'whatsapp') {
        <div class="p-card">
          <div class="p-card-header">
            <div class="p-card-title">Assistant WhatsApp</div>
            <div class="p-card-desc">Liez votre numéro WhatsApp pour gérer votre exploitation en Wolof ou en français</div>
          </div>
          <div class="p-card-body">
            @if (waLinked()) {
              <!-- Linked state -->
              <div class="wa-linked-banner">
                <div class="wa-linked-icon">✅</div>
                <div>
                  <div class="wa-linked-title">Numéro lié</div>
                  <div class="wa-linked-phone">{{ waPhone() }}</div>
                </div>
              </div>
              <div class="wa-instructions">
                <p class="wa-step-title">Comment utiliser l'assistant :</p>
                <ol class="wa-steps">
                  <li>Enregistrez ce numéro dans vos contacts : <strong>{{ waBotNum() }}</strong></li>
                  <li>Envoyez un message WhatsApp (texte ou vocal en Wolof/Français)</li>
                  <li>Exemples : <em>"Maa ngi jënd 3 sac urée 15 000 FCFA"</em> ou <em>"J'ai vendu 100 kg de tomates à 400 FCFA"</em></li>
                  <li>L'IA comprend et enregistre directement dans Agri-ERP après confirmation</li>
                </ol>
              </div>
              <button class="btn-danger" (click)="unlinkWhatsapp()" [disabled]="waLoading()">
                {{ waLoading() ? 'Déliaison…' : 'Délier ce numéro' }}
              </button>
            } @else {
              <!-- Not linked state -->
              <div class="wa-intro">
                <div class="wa-intro-icon">📱</div>
                <div>
                  <div class="wa-intro-title">Gérez votre exploitation par WhatsApp</div>
                  <div class="wa-intro-desc">Ajoutez des dépenses, ventes, consultez vos finances — par message vocal ou texte en Wolof ou Français.</div>
                </div>
              </div>
              <div class="f-row" style="margin-top: 20px;">
                <label class="f-label">Votre numéro WhatsApp</label>
                <input type="tel" class="f-input" placeholder="+221771234567"
                       [value]="waInput()"
                       (input)="waInput.set($any($event.target).value)"
                       [class.f-input-error]="waError()"/>
                @if (waError()) {
                  <p class="f-error">{{ waError() }}</p>
                }
                <p class="f-hint">Format international requis : +221XXXXXXXXX</p>
              </div>
              <button class="btn-primary" (click)="linkWhatsapp()" [disabled]="waLoading() || !waInput()">
                @if (waLoading()) {
                  <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" viewBox="0 0 24 24" style="animation:spin .8s linear infinite"><path d="M12 2a10 10 0 0 1 10 10"/></svg>
                }
                {{ waLoading() ? 'Liaison en cours…' : 'Lier mon numéro WhatsApp' }}
              </button>
            }
          </div>
        </div>
      }

    </div>
  </div>
</div>

<style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `,
})
export class ParametresComponent implements OnInit {
  private api   = inject(ApiService);
  private notif = inject(NotificationService);
  private fb    = inject(FormBuilder);
  auth          = inject(AuthService);

  activeTab      = signal<string>('profil');
  savingProfil   = signal(false);
  savingPassword = signal(false);
  savingOrg      = signal(false);
  prefs          = signal<Record<string, boolean>>({});
  planData       = signal<PlanData | null>(null);

  waLinked  = signal(false);
  waPhone   = signal<string | null>(null);
  waBotNum  = signal('');
  waLoading = signal(false);
  waInput   = signal('');
  waError   = signal('');

  tabs = [
    { id: 'profil',        label: 'Mon profil',    icon: this.svg('M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z') },
    { id: 'motdepasse',    label: 'Mot de passe',  icon: this.svg('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z') },
    { id: 'organisation',  label: 'Exploitation',  icon: this.svg('M2 20h20M5 20V8l7-5 7 5v12') },
    { id: 'notifications', label: 'Notifications', icon: this.svg('M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0') },
    { id: 'whatsapp', label: 'WhatsApp', icon: this.svg('M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z') },
  ];

  notifPrefs = [
    { key: 'stock_bas',       label: 'Alertes stock bas',      desc: 'Notifié quand un stock passe sous le seuil d\'alerte' },
    { key: 'tache_echeance',  label: 'Échéances de tâches',    desc: 'Rappel avant la date d\'échéance d\'une tâche' },
    { key: 'paiement_salaire',label: 'Paiements de salaires',  desc: 'Confirmation lors d\'un paiement de salaire' },
    { key: 'finance',         label: 'Résumé financier',       desc: 'Résumé financier mensuel automatique' },
  ];

  mois = [
    { v: 1, l: 'Janvier' }, { v: 2, l: 'Février' },  { v: 3, l: 'Mars' },
    { v: 4, l: 'Avril' },   { v: 5, l: 'Mai' },       { v: 6, l: 'Juin' },
    { v: 7, l: 'Juillet' }, { v: 8, l: 'Août' },      { v: 9, l: 'Septembre' },
    { v: 10, l: 'Octobre' },{ v: 11, l: 'Novembre' }, { v: 12, l: 'Décembre' },
  ];
  jours = Array.from({ length: 28 }, (_, i) => i + 1);

  profilForm = this.fb.group({
    prenom:    [''],
    nom:       [''],
    email:     [{ value: '', disabled: true }],
    telephone: [''],
  });

  passwordForm = this.fb.group({
    current_password:      ['', Validators.required],
    password:              ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', Validators.required],
  });

  orgForm = this.fb.group({
    nom:                  [''],
    telephone:            [''],
    devise:               ['FCFA'],
    campagne_debut_mois:  [1],
    campagne_debut_jour:  [1],
  });

  ngOnInit(): void {
    const user = this.auth.user();
    if (user) {
      this.profilForm.patchValue({
        prenom: user.prenom ?? '',
        nom: user.nom,
        email: user.email,
        telephone: user.telephone ?? '',
      });
      if (user.preferences_notification) {
        this.prefs.set(user.preferences_notification as Record<string, boolean>);
      }
    }

    // Load org + plan data
    this.api.get<PlanData>('/api/parametres').subscribe({
      next: data => {
        this.planData.set(data);
        if (data.organisation) {
          this.orgForm.patchValue({
            nom:                 data.organisation.nom ?? '',
            telephone:           data.organisation.telephone ?? '',
            devise:              data.organisation.devise ?? 'FCFA',
            campagne_debut_mois: data.organisation.campagne_debut_mois ?? 1,
            campagne_debut_jour: data.organisation.campagne_debut_jour ?? 1,
          });
        }
      },
    });

    this.loadWhatsappStatus();
  }

  prefEnabled(key: string): boolean { return this.prefs()[key] !== false; }

  togglePref(key: string): void {
    this.prefs.update(p => ({ ...p, [key]: !this.prefEnabled(key) }));
    this.api.put('/api/parametres/preferences-notification', {
      preferences_notification: this.prefs(),
    }).subscribe();
  }

  saveProfil(): void {
    this.savingProfil.set(true);
    this.api.put('/api/auth/user', this.profilForm.getRawValue()).subscribe({
      next: () => {
        this.notif.success('Profil mis à jour.');
        this.savingProfil.set(false);
        this.auth.refreshUser().subscribe();
      },
      error: err => {
        this.savingProfil.set(false);
        this.notif.error(err.error?.message || 'Erreur lors de la mise à jour.');
      },
    });
  }

  savePassword(): void {
    this.savingPassword.set(true);
    this.api.put('/api/auth/password', this.passwordForm.value).subscribe({
      next: () => {
        this.notif.success('Mot de passe modifié avec succès.');
        this.savingPassword.set(false);
        this.passwordForm.reset();
      },
      error: err => {
        this.savingPassword.set(false);
        this.notif.error(err.error?.message || 'Erreur lors du changement de mot de passe.');
      },
    });
  }

  saveOrg(): void {
    this.savingOrg.set(true);
    this.api.put('/api/parametres', this.orgForm.value).subscribe({
      next: () => {
        this.notif.success('Exploitation mise à jour.');
        this.savingOrg.set(false);
        this.auth.refreshUser().subscribe();
      },
      error: err => {
        this.savingOrg.set(false);
        this.notif.error(err.error?.message || 'Erreur lors de la mise à jour.');
      },
    });
  }

  goToAbonnement(): void {
    window.location.href = '/abonnement';
  }

  usagePct(used: number, max: number): number {
    return max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  }

  usageClass(used: number, max: number): string {
    const pct = this.usagePct(used, max);
    if (pct >= 100) return 'full';
    if (pct >= 75)  return 'warn';
    return 'ok';
  }

  loadWhatsappStatus(): void {
    this.api.get<{ linked: boolean; phone_number: string | null; bot_number: string }>(
      '/api/parametres/whatsapp'
    ).subscribe({
      next: data => {
        this.waLinked.set(data.linked);
        this.waPhone.set(data.phone_number);
        this.waBotNum.set(data.bot_number);
      },
      error: () => { /* non-critical, silently ignore */ },
    });
  }

  linkWhatsapp(): void {
    this.waError.set('');
    const phone = this.waInput().trim();
    if (!/^\+\d{10,15}$/.test(phone)) {
      this.waError.set('Format invalide. Exemple : +221771234567');
      return;
    }
    this.waLoading.set(true);
    this.api.post<{ phone_number: string }>('/api/parametres/whatsapp', { phone_number: phone }).subscribe({
      next: res => {
        this.waLinked.set(true);
        this.waPhone.set(res.phone_number);
        this.waLoading.set(false);
        this.waInput.set('');
        this.notif.success('Numéro WhatsApp lié avec succès !');
      },
      error: err => {
        this.waLoading.set(false);
        this.waError.set(err.error?.message || 'Erreur lors de la liaison.');
      },
    });
  }

  unlinkWhatsapp(): void {
    this.waLoading.set(true);
    this.api.delete('/api/parametres/whatsapp').subscribe({
      next: () => {
        this.waLinked.set(false);
        this.waPhone.set(null);
        this.waLoading.set(false);
        this.notif.success('Numéro WhatsApp délié.');
      },
      error: () => {
        this.waLoading.set(false);
        this.notif.error('Erreur lors de la déliaison. Réessayez.');
      },
    });
  }

  private svg(path: string): string {
    return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="${path}"/></svg>`;
  }
}

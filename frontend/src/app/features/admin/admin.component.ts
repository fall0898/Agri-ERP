import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
import { CurrencyFcfaPipe } from '../../core/pipes/currency-fcfa.pipe';
import { DateFrPipe } from '../../core/pipes/date-fr.pipe';

interface Tenant {
  id: number;
  nom: string;
  plan: string;
  est_active: boolean;
  est_suspendue?: boolean;
  pays?: string;
  plan_expire_at?: string;
  created_at: string;
  users?: { id: number; nom: string; email: string }[];
}

interface AdminUser {
  id: number;
  nom: string;
  email: string;
  role: string;
  telephone?: string;
  est_actif: boolean;
  created_at: string;
  organisation?: { id: number; nom: string; plan: string } | null;
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CurrencyFcfaPipe, DateFrPipe, ReactiveFormsModule],
  template: `
    <div class="pg-wrap space-y-6">

      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1>Super Admin</h1>
          <p class="pg-sub">Vue plateforme — toutes les organisations</p>
        </div>
        <button (click)="charger()"
                class="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-neutral-600">
          ↺ Actualiser
        </button>
      </div>

      <!-- Stats globales -->
      @if (stats()) {
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="card text-center">
            <div class="text-3xl font-bold text-primary-600">{{ stats().nb_organisations }}</div>
            <div class="text-xs text-neutral-500 mt-1">Organisations totales</div>
          </div>
          <div class="card text-center">
            <div class="text-3xl font-bold text-green-600">{{ stats().nb_organisations_actives }}</div>
            <div class="text-xs text-neutral-500 mt-1">Organisations actives</div>
          </div>
          <div class="card text-center">
            <div class="text-3xl font-bold text-blue-600">{{ stats().nb_users }}</div>
            <div class="text-xs text-neutral-500 mt-1">Utilisateurs inscrits</div>
          </div>
          <div class="card text-center">
            <div class="text-3xl font-bold text-amber-600">{{ stats().nb_inscriptions_ce_mois }}</div>
            <div class="text-xs text-neutral-500 mt-1">Nouvelles inscriptions</div>
            <div class="text-xs text-neutral-400">ce mois</div>
          </div>
        </div>

        <div class="card bg-gradient-to-r from-primary-500 to-primary-600 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-primary-100 text-sm">Volume total des ventes sur la plateforme</p>
              <p class="text-3xl font-bold mt-1">{{ stats().total_ventes_plateforme | currencyFcfa }}</p>
            </div>
            <div class="text-5xl opacity-30">💰</div>
          </div>
        </div>

        @if (stats().nb_organisations_par_plan) {
          <div class="card">
            <h3 class="font-semibold text-neutral-800 mb-4">Répartition par plan</h3>
            <div class="flex flex-wrap gap-3">
              @for (entry of planEntries(); track entry.plan) {
                <div class="flex items-center gap-3 px-4 py-3 rounded-xl border border-neutral-100 bg-neutral-50">
                  <div class="w-3 h-3 rounded-full" [style.background-color]="planColor(entry.plan)"></div>
                  <span class="font-medium text-neutral-700 capitalize">{{ entry.plan }}</span>
                  <span class="text-xl font-bold" [style.color]="planColor(entry.plan)">{{ entry.total }}</span>
                </div>
              }
            </div>
          </div>
        }
      }

      <!-- Tabs -->
      <div class="border-b border-neutral-200">
        <nav class="flex gap-6">
          <button (click)="onglet.set('organisations')"
                  class="pb-3 text-sm font-medium border-b-2 transition-colors"
                  [class.border-primary-500]="onglet() === 'organisations'"
                  [class.text-primary-600]="onglet() === 'organisations'"
                  [class.border-transparent]="onglet() !== 'organisations'"
                  [class.text-neutral-500]="onglet() !== 'organisations'">
            Organisations
          </button>
          <button (click)="onglet.set('utilisateurs')"
                  class="pb-3 text-sm font-medium border-b-2 transition-colors"
                  [class.border-primary-500]="onglet() === 'utilisateurs'"
                  [class.text-primary-600]="onglet() === 'utilisateurs'"
                  [class.border-transparent]="onglet() !== 'utilisateurs'"
                  [class.text-neutral-500]="onglet() !== 'utilisateurs'">
            Utilisateurs
          </button>
        </nav>
      </div>

      <!-- ===== ONGLET ORGANISATIONS ===== -->
      @if (onglet() === 'organisations') {
        <div class="flex items-center gap-3 flex-wrap">
          <input type="text" [value]="recherche" (input)="onRecherche($event)"
                 placeholder="Rechercher une organisation..."
                 class="form-input text-sm h-9 py-0 flex-1 min-w-48" />
          <select (change)="onFiltreStatut($event)" class="form-input text-sm h-9 py-0 w-40">
            <option value="">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="inactive">Désactivées</option>
          </select>
          <select (change)="onFiltrePlan($event)" class="form-input text-sm h-9 py-0 w-36">
            <option value="">Tous les plans</option>
            <option value="gratuit">Gratuit</option>
            <option value="pro">Pro</option>
            <option value="entreprise">Entreprise</option>
          </select>
          <button (click)="ouvrirModalOrg()"
                  class="btn-primary text-sm px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap">
            + Nouvelle organisation
          </button>
        </div>

        <div class="card p-0 overflow-hidden">
          @if (chargement()) {
            <div class="flex items-center justify-center py-16">
              <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (tenantsFiltres().length) {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th class="text-left py-3 px-4 text-neutral-500 font-medium">Organisation</th>
                    <th class="text-left py-3 px-4 text-neutral-500 font-medium">Admin</th>
                    <th class="text-center py-3 px-4 text-neutral-500 font-medium">Plan</th>
                    <th class="text-center py-3 px-4 text-neutral-500 font-medium">Statut</th>
                    <th class="text-left py-3 px-4 text-neutral-500 font-medium">Pays</th>
                    <th class="text-left py-3 px-4 text-neutral-500 font-medium">Inscription</th>
                    <th class="text-center py-3 px-4 text-neutral-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (tenant of tenantsFiltres(); track tenant.id) {
                    <tr class="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td class="py-3 px-4">
                        <div class="flex items-center gap-3">
                          <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-sm"
                               [style.background-color]="planColor(tenant.plan)">
                            {{ tenant.nom.charAt(0).toUpperCase() }}
                          </div>
                          <div>
                            <div class="font-semibold text-neutral-900">{{ tenant.nom }}</div>
                            <div class="text-xs text-neutral-400">#{{ tenant.id }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="py-3 px-4">
                        @if (tenant.users?.[0]; as admin) {
                          <div class="text-neutral-700">{{ admin.nom }}</div>
                          <div class="text-xs text-neutral-400">{{ admin.email }}</div>
                        } @else {
                          <span class="text-neutral-400 text-xs">—</span>
                        }
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                              [style.background-color]="planColor(tenant.plan) + '20'"
                              [style.color]="planColor(tenant.plan)">
                          {{ tenant.plan }}
                        </span>
                        @if (tenant.plan_expire_at) {
                          <div class="text-xs text-neutral-400 mt-0.5">exp. {{ tenant.plan_expire_at | dateFr }}</div>
                        }
                      </td>
                      <td class="py-3 px-4 text-center">
                        @if (tenant.est_suspendue) {
                          <span class="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-medium">
                            <span class="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>Suspendue
                          </span>
                        } @else if (tenant.est_active) {
                          <span class="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>Active
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-medium">
                            <span class="w-1.5 h-1.5 bg-red-400 rounded-full"></span>Désactivée
                          </span>
                        }
                      </td>
                      <td class="py-3 px-4 text-neutral-600">{{ tenant.pays || '—' }}</td>
                      <td class="py-3 px-4 text-neutral-500 text-xs">{{ tenant.created_at | dateFr }}</td>
                      <td class="py-3 px-4">
                        <div class="flex items-center justify-center gap-1.5 flex-wrap">
                          <button (click)="toggleTenantActif(tenant)"
                                  [disabled]="toggling() === tenant.id"
                                  class="text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                                  [class.bg-red-50]="tenant.est_active"
                                  [class.text-red-600]="tenant.est_active"
                                  [class.bg-green-50]="!tenant.est_active"
                                  [class.text-green-600]="!tenant.est_active">
                            {{ toggling() === tenant.id ? '...' : (tenant.est_active ? 'Désactiver' : 'Activer') }}
                          </button>
                          <button (click)="ouvrirModalPlan(tenant)"
                                  class="text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors font-medium">
                            Plan
                          </button>
                          <button (click)="supprimerOrg(tenant)"
                                  [disabled]="supprimantOrg() === tenant.id"
                                  class="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                            {{ supprimantOrg() === tenant.id ? '...' : 'Supprimer' }}
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="px-4 py-3 border-t border-neutral-100 flex items-center justify-between">
              <p class="text-xs text-neutral-500">
                {{ tenantsFiltres().length }} organisation(s) sur {{ tenants().length }}
              </p>
            </div>
          } @else {
            <div class="text-center py-16">
              <p class="text-neutral-500">Aucune organisation trouvée.</p>
            </div>
          }
        </div>
      }

      <!-- ===== ONGLET UTILISATEURS ===== -->
      @if (onglet() === 'utilisateurs') {
        <div class="flex items-center gap-3 flex-wrap">
          <input type="text" [value]="rechercheUser" (input)="onRechercheUser($event)"
                 placeholder="Rechercher un utilisateur..."
                 class="form-input text-sm h-9 py-0 flex-1 min-w-48" />
          <button (click)="ouvrirModalUser(null)"
                  class="btn-primary text-sm px-4 py-2 rounded-lg flex items-center gap-2">
            + Ajouter un utilisateur
          </button>
        </div>

        <div class="card p-0 overflow-hidden">
          @if (chargementUsers()) {
            <div class="flex items-center justify-center py-16">
              <div class="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          } @else if (usersFiltres().length) {
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-neutral-50 border-b border-neutral-100">
                  <tr>
                    <th class="text-left py-3 px-4 text-neutral-500 font-medium">Utilisateur</th>
                    <th class="text-left py-3 px-4 text-neutral-500 font-medium">Organisation</th>
                    <th class="text-center py-3 px-4 text-neutral-500 font-medium">Rôle</th>
                    <th class="text-center py-3 px-4 text-neutral-500 font-medium">Statut</th>
                    <th class="text-left py-3 px-4 text-neutral-500 font-medium">Inscription</th>
                    <th class="text-center py-3 px-4 text-neutral-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (u of usersFiltres(); track u.id) {
                    <tr class="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                      <td class="py-3 px-4">
                        <div class="font-semibold text-neutral-900">{{ u.nom }}</div>
                        @if (u.telephone) {
                          <div class="text-xs text-neutral-400">{{ u.telephone }}</div>
                        }
                      </td>
                      <td class="py-3 px-4">
                        @if (u.organisation) {
                          <div class="text-neutral-700">{{ u.organisation.nom }}</div>
                          <span class="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                                [style.background-color]="planColor(u.organisation.plan) + '20'"
                                [style.color]="planColor(u.organisation.plan)">
                            {{ u.organisation.plan }}
                          </span>
                        } @else {
                          <span class="text-neutral-400 text-xs">—</span>
                        }
                      </td>
                      <td class="py-3 px-4 text-center">
                        <span class="text-xs px-2.5 py-1 rounded-full font-medium"
                              [class.bg-purple-100]="u.role === 'super_admin'"
                              [class.text-purple-700]="u.role === 'super_admin'"
                              [class.bg-blue-100]="u.role === 'admin'"
                              [class.text-blue-700]="u.role === 'admin'"
                              [class.bg-neutral-100]="u.role === 'lecteur'"
                              [class.text-neutral-600]="u.role === 'lecteur'">
                          {{ roleLabel(u.role) }}
                        </span>
                      </td>
                      <td class="py-3 px-4 text-center">
                        @if (u.est_actif) {
                          <span class="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>Actif
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1 text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-medium">
                            <span class="w-1.5 h-1.5 bg-red-400 rounded-full"></span>Bloqué
                          </span>
                        }
                      </td>
                      <td class="py-3 px-4 text-neutral-500 text-xs">{{ u.created_at | dateFr }}</td>
                      <td class="py-3 px-4">
                        <div class="flex items-center justify-center gap-2">
                          <button (click)="ouvrirModalUser(u)"
                                  class="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors">
                            Modifier
                          </button>
                          <button (click)="toggleUserActif(u)"
                                  [disabled]="togglingUser() === u.id"
                                  class="text-xs px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                                  [class.bg-red-50]="u.est_actif"
                                  [class.text-red-600]="u.est_actif"
                                  [class.bg-green-50]="!u.est_actif"
                                  [class.text-green-600]="!u.est_actif">
                            {{ togglingUser() === u.id ? '...' : (u.est_actif ? 'Bloquer' : 'Activer') }}
                          </button>
                          <button (click)="supprimerUser(u)"
                                  class="text-xs px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors">
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            <div class="px-4 py-3 border-t border-neutral-100">
              <p class="text-xs text-neutral-500">{{ usersFiltres().length }} utilisateur(s) sur {{ users().length }}</p>
            </div>
          } @else {
            <div class="text-center py-16">
              <p class="text-neutral-500">Aucun utilisateur trouvé.</p>
            </div>
          }
        </div>
      }

    </div>

    <!-- ===== MODAL UTILISATEUR ===== -->
    @if (modalUser()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" (click)="fermerModalUser()">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-100">
            <h2 class="text-lg font-semibold text-neutral-900">{{ titreModalUser() }}</h2>
            <button (click)="fermerModalUser()" class="text-neutral-400 hover:text-neutral-600 text-2xl leading-none">×</button>
          </div>

          <form [formGroup]="formUser" (ngSubmit)="sauvegarderUser()" class="px-6 py-5 space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="form-label">Nom complet *</label>
                <input formControlName="nom" type="text" class="form-input" placeholder="Ex: Mamadou Diallo" />
              </div>
              <div class="col-span-2">
                <label class="form-label">Téléphone * <span class="text-neutral-400 font-normal">(identifiant de connexion)</span></label>
                <div class="flex gap-2">
                  <span class="flex items-center px-3 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-600 text-sm">+221</span>
                  <input formControlName="telephone" type="tel" class="form-input flex-1"
                         placeholder="77 000 0000" />
                </div>
              </div>
              <div class="col-span-2">
                <label class="form-label">
                  {{ userEdite() ? 'Nouveau mot de passe (laisser vide pour ne pas changer)' : 'Mot de passe *' }}
                </label>
                <input formControlName="password" type="password" class="form-input" placeholder="Min. 6 caractères" />
              </div>
              <div>
                <label class="form-label">Rôle *</label>
                <select formControlName="role" class="form-input">
                  <option value="lecteur">Lecteur</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              <div class="col-span-2">
                <label class="form-label">Organisation</label>
                <select formControlName="organisation_id" class="form-input">
                  <option [value]="null">— Aucune organisation —</option>
                  @for (t of tenants(); track t.id) {
                    <option [value]="t.id">{{ t.nom }} ({{ t.plan }})</option>
                  }
                </select>
              </div>
            </div>

            @if (erreurUser()) {
              <p class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ erreurUser() }}</p>
            }

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" (click)="fermerModalUser()"
                      class="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-700">
                Annuler
              </button>
              <button type="submit" [disabled]="savingUser()"
                      class="btn-primary px-5 py-2 text-sm rounded-lg disabled:opacity-60">
                {{ savingUser() ? 'Enregistrement...' : (userEdite() ? 'Enregistrer' : 'Créer') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ===== MODAL ORGANISATION ===== -->
    @if (modalOrg()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" (click)="fermerModalOrg()">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-100">
            <h2 class="text-lg font-semibold text-neutral-900">Nouvelle organisation</h2>
            <button (click)="fermerModalOrg()" class="text-neutral-400 hover:text-neutral-600 text-2xl leading-none">×</button>
          </div>

          <form [formGroup]="formOrg" (ngSubmit)="sauvegarderOrg()" class="px-6 py-5 space-y-4">

            <p class="text-xs text-neutral-500 bg-neutral-50 px-3 py-2 rounded-lg">
              Informations de l'organisation
            </p>

            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2">
                <label class="form-label">Nom de l'organisation *</label>
                <input formControlName="nom" type="text" class="form-input" placeholder="Ex: Ferme Diallo" />
              </div>
              <div>
                <label class="form-label">Plan *</label>
                <select formControlName="plan" class="form-input">
                  <option value="gratuit">Gratuit (7 jours)</option>
                  <option value="pro">Pro (1 an)</option>
                  <option value="entreprise">Entreprise</option>
                </select>
              </div>
              <div>
                <label class="form-label">Pays</label>
                <input formControlName="pays" type="text" class="form-input" placeholder="Sénégal" />
              </div>
              <div class="col-span-2">
                <label class="form-label">Email de contact</label>
                <input formControlName="email_contact" type="email" class="form-input" placeholder="contact@exemple.com" />
              </div>
            </div>

            <div class="border-t border-neutral-100 pt-4">
              <p class="text-xs text-neutral-500 bg-neutral-50 px-3 py-2 rounded-lg mb-4">
                Compte administrateur (optionnel — vous pourrez en créer un après)
              </p>
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="form-label">Nom de l'admin</label>
                  <input formControlName="admin_nom" type="text" class="form-input" placeholder="Ex: Mamadou Diallo" />
                </div>
                <div class="col-span-2">
                  <label class="form-label">Téléphone de l'admin <span class="text-neutral-400">(identifiant connexion)</span></label>
                  <div class="flex gap-2">
                    <span class="flex items-center px-3 bg-neutral-100 border border-neutral-200 rounded-lg text-neutral-600 text-sm">+221</span>
                    <input formControlName="admin_telephone" type="tel" class="form-input flex-1" placeholder="77 000 0000" />
                  </div>
                </div>
                <div class="col-span-2">
                  <label class="form-label">Mot de passe admin <span class="text-neutral-400">(défaut: password)</span></label>
                  <input formControlName="admin_password" type="password" class="form-input" placeholder="Min. 6 caractères" />
                </div>
              </div>
            </div>

            @if (erreurOrg()) {
              <p class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ erreurOrg() }}</p>
            }

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" (click)="fermerModalOrg()"
                      class="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-700">
                Annuler
              </button>
              <button type="submit" [disabled]="savingOrg()"
                      class="btn-primary px-5 py-2 text-sm rounded-lg disabled:opacity-60">
                {{ savingOrg() ? 'Création...' : 'Créer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ===== MODAL CHANGER PLAN ===== -->
    @if (modalPlan()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" (click)="fermerModalPlan()">
        <div class="bg-white rounded-2xl shadow-xl w-full max-w-md" (click)="$event.stopPropagation()">
          <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-neutral-100">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">Changer le plan</h2>
              @if (tenantPlanEdite()) {
                <p class="text-sm text-neutral-500 mt-0.5">{{ tenantPlanEdite()!.nom }}</p>
              }
            </div>
            <button (click)="fermerModalPlan()" class="text-neutral-400 hover:text-neutral-600 text-2xl leading-none">×</button>
          </div>

          <form [formGroup]="formPlan" (ngSubmit)="changerPlan()" class="px-6 py-5 space-y-4">

            @if (tenantPlanEdite()) {
              <div class="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                <span class="text-sm text-neutral-500">Plan actuel :</span>
                <span class="text-sm font-semibold capitalize px-2.5 py-0.5 rounded-full"
                      [style.background-color]="planColor(tenantPlanEdite()!.plan) + '20'"
                      [style.color]="planColor(tenantPlanEdite()!.plan)">
                  {{ tenantPlanEdite()!.plan }}
                </span>
                @if (tenantPlanEdite()!.plan_expire_at) {
                  <span class="text-xs text-neutral-400 ml-auto">expire {{ tenantPlanEdite()!.plan_expire_at | dateFr }}</span>
                }
              </div>
            }

            <div>
              <label class="form-label">Nouveau plan *</label>
              <select formControlName="plan" class="form-input">
                <option value="gratuit">Gratuit</option>
                <option value="pro">Pro</option>
                <option value="entreprise">Entreprise</option>
              </select>
            </div>

            @if (formPlan.value.plan !== 'gratuit') {
              <div>
                <label class="form-label">Durée (mois) <span class="text-neutral-400 font-normal">— laisser vide pour la durée par défaut</span></label>
                <input formControlName="duree_mois" type="number" min="1" max="120" class="form-input"
                       [placeholder]="formPlan.value.plan === 'pro' ? '12 mois par défaut' : '120 mois par défaut'" />
              </div>
            }

            <div class="p-3 rounded-xl text-sm"
                 [class.bg-blue-50]="formPlan.value.plan === 'pro'"
                 [class.text-blue-700]="formPlan.value.plan === 'pro'"
                 [class.bg-purple-50]="formPlan.value.plan === 'entreprise'"
                 [class.text-purple-700]="formPlan.value.plan === 'entreprise'"
                 [class.bg-neutral-50]="formPlan.value.plan === 'gratuit'"
                 [class.text-neutral-600]="formPlan.value.plan === 'gratuit'">
              @if (formPlan.value.plan === 'gratuit') {
                Accès limité — 1 champ, 1 utilisateur, 1 culture. Pas d'export ni d'import.
              } @else if (formPlan.value.plan === 'pro') {
                Accès Pro — 2 champs, 2 utilisateurs, 3 cultures. Export Excel et import CSV inclus.
              } @else {
                Accès Entreprise — illimité sur tous les modules.
              }
            </div>

            @if (erreurPlan()) {
              <p class="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{{ erreurPlan() }}</p>
            }

            <div class="flex justify-end gap-3 pt-2">
              <button type="button" (click)="fermerModalPlan()"
                      class="px-4 py-2 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-700">
                Annuler
              </button>
              <button type="submit" [disabled]="savingPlan()"
                      class="btn-primary px-5 py-2 text-sm rounded-lg disabled:opacity-60">
                {{ savingPlan() ? 'Mise à jour...' : 'Appliquer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
})
export class AdminComponent implements OnInit {
  private api   = inject(ApiService);
  private notif = inject(NotificationService);
  private fb    = inject(FormBuilder);

  chargement = signal(true);
  stats = signal<any>(null);
  tenants = signal<Tenant[]>([]);
  toggling = signal<number | null>(null);
  supprimantOrg = signal<number | null>(null);

  onglet = signal<'organisations' | 'utilisateurs'>('organisations');

  users = signal<AdminUser[]>([]);
  chargementUsers = signal(false);
  togglingUser = signal<number | null>(null);
  rechercheUser = '';

  // Modal utilisateur
  modalUser = signal(false);
  userEdite = signal<AdminUser | null>(null);
  savingUser = signal(false);
  erreurUser = signal('');
  titreModalUser = computed(() => this.userEdite() ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur');

  formUser = this.fb.group({
    nom:             ['', Validators.required],
    telephone:       ['', Validators.required],
    password:        [''],
    role:            ['lecteur', Validators.required],
    organisation_id: [null as number | null],
  });

  // Modal organisation
  modalOrg = signal(false);
  savingOrg = signal(false);
  erreurOrg = signal('');

  formOrg = this.fb.group({
    nom:             ['', Validators.required],
    plan:            ['gratuit', Validators.required],
    pays:            ['Sénégal'],
    email_contact:   [''],
    admin_nom:       [''],
    admin_telephone: [''],
    admin_password:  [''],
  });

  // Modal changer plan
  modalPlan = signal(false);
  tenantPlanEdite = signal<Tenant | null>(null);
  savingPlan = signal(false);
  erreurPlan = signal('');

  formPlan = this.fb.group({
    plan:       ['pro', Validators.required],
    duree_mois: [null as number | null],
  });

  recherche = '';
  filtreStatut = '';
  filtrePlan = '';
  page = signal(1);

  tenantsFiltres = computed(() => {
    let list = this.tenants();
    if (this.recherche) {
      const q = this.recherche.toLowerCase();
      list = list.filter(t =>
        t.nom.toLowerCase().includes(q) ||
        t.users?.some(u => u.nom.toLowerCase().includes(q))
      );
    }
    if (this.filtreStatut === 'active')   list = list.filter(t => t.est_active);
    if (this.filtreStatut === 'inactive') list = list.filter(t => !t.est_active);
    if (this.filtrePlan) list = list.filter(t => t.plan === this.filtrePlan);
    return list;
  });

  usersFiltres = computed(() => {
    if (!this.rechercheUser) return this.users();
    const q = this.rechercheUser.toLowerCase();
    return this.users().filter(u =>
      u.nom.toLowerCase().includes(q) ||
      (u.telephone ?? '').includes(q) ||
      (u.organisation?.nom ?? '').toLowerCase().includes(q)
    );
  });

  planEntries = computed(() => {
    const par = this.stats()?.nb_organisations_par_plan ?? {};
    return Object.entries(par).map(([plan, total]) => ({ plan, total }));
  });

  ngOnInit(): void {
    this.charger();
  }

  charger(): void {
    this.chargement.set(true);

    this.api.get<any>('/api/admin/stats').subscribe({
      next: res => this.stats.set(res),
      error: () => {},
    });

    this.api.get<any>('/api/admin/tenants?per_page=200').subscribe({
      next: res => {
        const data = res.data ?? res;
        this.tenants.set(Array.isArray(data) ? data : data.data ?? []);
        this.chargement.set(false);
      },
      error: () => this.chargement.set(false),
    });

    this.chargerUsers();
  }

  chargerUsers(): void {
    this.chargementUsers.set(true);
    this.api.get<AdminUser[]>('/api/admin/users').subscribe({
      next: res => {
        this.users.set(Array.isArray(res) ? res : (res as any).data ?? []);
        this.chargementUsers.set(false);
      },
      error: () => this.chargementUsers.set(false),
    });
  }

  // ── Utilisateur ───────────────────────────────────────────────────────────
  ouvrirModalUser(user: AdminUser | null): void {
    this.userEdite.set(user);
    this.erreurUser.set('');
    this.formUser.reset({
      nom:             user?.nom ?? '',
      telephone:       user?.telephone ?? '',
      password:        '',
      role:            user?.role ?? 'lecteur',
      organisation_id: user?.organisation?.id ?? null,
    });
    if (!user) {
      this.formUser.get('password')!.setValidators([Validators.required, Validators.minLength(6)]);
    } else {
      this.formUser.get('password')!.setValidators([Validators.minLength(6)]);
    }
    this.formUser.get('password')!.updateValueAndValidity();
    this.modalUser.set(true);
  }

  fermerModalUser(): void { this.modalUser.set(false); }

  sauvegarderUser(): void {
    if (this.formUser.invalid) return;
    this.savingUser.set(true);
    this.erreurUser.set('');

    const val = this.formUser.value;
    const payload: any = {
      nom:             val.nom,
      telephone:       val.telephone,
      role:            val.role,
      organisation_id: val.organisation_id || null,
    };
    if (val.password) payload['password'] = val.password;

    const user = this.userEdite();
    const req = user
      ? this.api.put<AdminUser>(`/api/admin/users/${user.id}`, payload)
      : this.api.post<AdminUser>('/api/admin/users', payload);

    req.subscribe({
      next: saved => {
        if (user) {
          this.users.update(list => list.map(u => u.id === saved.id ? saved : u));
        } else {
          this.users.update(list => [saved, ...list]);
        }
        this.savingUser.set(false);
        this.fermerModalUser();
      },
      error: err => {
        const errors = err?.error?.errors;
        const msg = errors
          ? Object.values(errors).flat().join(' ')
          : (err?.error?.message ?? 'Une erreur est survenue.');
        this.erreurUser.set(msg as string);
        this.savingUser.set(false);
      },
    });
  }

  toggleUserActif(user: AdminUser): void {
    this.togglingUser.set(user.id);
    this.api.patch<any>(`/api/admin/users/${user.id}/activer`, {}).subscribe({
      next: res => {
        this.users.update(list =>
          list.map(u => u.id === user.id ? { ...u, est_actif: res.user?.est_actif ?? !u.est_actif } : u)
        );
        this.togglingUser.set(null);
      },
      error: () => this.togglingUser.set(null),
    });
  }

  supprimerUser(user: AdminUser): void {
    if (!confirm(`Supprimer définitivement ${user.nom} ?`)) return;
    this.api.delete<any>(`/api/admin/users/${user.id}`).subscribe({
      next: () => {
        this.users.update(list => list.filter(u => u.id !== user.id));
        this.notif.success(`Utilisateur "${user.nom}" supprimé.`);
      },
      error: err => this.notif.error(err?.error?.message || 'Erreur lors de la suppression.'),
    });
  }

  // ── Organisation ──────────────────────────────────────────────────────────
  ouvrirModalOrg(): void {
    this.erreurOrg.set('');
    this.formOrg.reset({ nom: '', plan: 'gratuit', pays: 'Sénégal', email_contact: '', admin_nom: '', admin_telephone: '', admin_password: '' });
    this.modalOrg.set(true);
  }

  fermerModalOrg(): void { this.modalOrg.set(false); }

  sauvegarderOrg(): void {
    if (this.formOrg.invalid) return;
    this.savingOrg.set(true);
    this.erreurOrg.set('');

    const val = this.formOrg.value;
    const payload: any = {
      nom:           val.nom,
      plan:          val.plan,
      pays:          val.pays || null,
      email_contact: val.email_contact || null,
    };
    if (val.admin_telephone) {
      payload['admin_nom']       = val.admin_nom || 'Admin';
      payload['admin_telephone'] = val.admin_telephone;
      payload['admin_password']  = val.admin_password || 'password';
    }

    this.api.post<any>('/api/admin/tenants', payload).subscribe({
      next: res => {
        const org = res.organisation;
        this.tenants.update(list => [{ ...org, users: [] }, ...list]);
        this.savingOrg.set(false);
        this.fermerModalOrg();
        this.notif.success('Organisation créée avec succès.');
        if (res.admin) this.chargerUsers();
      },
      error: err => {
        const errors = err?.error?.errors;
        const msg = errors
          ? Object.values(errors).flat().join(' ')
          : (err?.error?.message ?? 'Une erreur est survenue.');
        this.erreurOrg.set(msg as string);
        this.savingOrg.set(false);
      },
    });
  }

  supprimerOrg(tenant: Tenant): void {
    if (!confirm(`Supprimer définitivement "${tenant.nom}" et toutes ses données ?\n\nCette action est irréversible.`)) return;
    this.supprimantOrg.set(tenant.id);
    this.api.delete<any>(`/api/admin/tenants/${tenant.id}`).subscribe({
      next: () => {
        this.tenants.update(list => list.filter(t => t.id !== tenant.id));
        this.supprimantOrg.set(null);
        this.notif.success(`Organisation "${tenant.nom}" supprimée.`);
      },
      error: err => {
        this.supprimantOrg.set(null);
        this.notif.error(err?.error?.message || 'Erreur lors de la suppression.');
      },
    });
  }

  // ── Changer plan ──────────────────────────────────────────────────────────
  ouvrirModalPlan(tenant: Tenant): void {
    this.tenantPlanEdite.set(tenant);
    this.erreurPlan.set('');
    this.formPlan.reset({ plan: tenant.plan as any, duree_mois: null });
    this.modalPlan.set(true);
  }

  fermerModalPlan(): void { this.modalPlan.set(false); }

  changerPlan(): void {
    if (this.formPlan.invalid) return;
    const tenant = this.tenantPlanEdite();
    if (!tenant) return;

    this.savingPlan.set(true);
    this.erreurPlan.set('');

    const val = this.formPlan.value;
    const payload: any = { plan: val.plan };
    if (val.duree_mois) payload['duree_mois'] = val.duree_mois;

    this.api.patch<any>(`/api/admin/tenants/${tenant.id}/plan`, payload).subscribe({
      next: res => {
        const updated = res.organisation;
        this.tenants.update(list =>
          list.map(t => t.id === tenant.id
            ? { ...t, plan: updated.plan, plan_expire_at: updated.plan_expire_at, est_suspendue: false }
            : t
          )
        );
        this.savingPlan.set(false);
        this.fermerModalPlan();
        this.notif.success('Plan mis à jour avec succès.');
      },
      error: err => {
        const msg = err?.error?.message ?? 'Une erreur est survenue.';
        this.erreurPlan.set(msg);
        this.savingPlan.set(false);
      },
    });
  }

  // ── Tenant actif toggle ───────────────────────────────────────────────────
  toggleTenantActif(tenant: Tenant): void {
    this.toggling.set(tenant.id);
    this.api.patch<any>(`/api/admin/tenants/${tenant.id}/activer`, {}).subscribe({
      next: res => {
        const updated = res.organisation ?? res;
        this.tenants.update(list =>
          list.map(t => t.id === tenant.id ? { ...t, est_active: updated.est_active ?? !t.est_active } : t)
        );
        this.toggling.set(null);
        this.notif.success(updated.est_active ? 'Organisation activée.' : 'Organisation désactivée.');
      },
      error: err => {
        this.toggling.set(null);
        this.notif.error(err?.error?.message || 'Erreur lors de la mise à jour.');
      },
    });
  }

  onRecherche(event: Event): void {
    this.recherche = (event.target as HTMLInputElement).value;
    this.page.set(1);
  }

  onFiltreStatut(event: Event): void {
    this.filtreStatut = (event.target as HTMLSelectElement).value;
    this.page.set(1);
  }

  onFiltrePlan(event: Event): void {
    this.filtrePlan = (event.target as HTMLSelectElement).value;
    this.page.set(1);
  }

  onRechercheUser(event: Event): void {
    this.rechercheUser = (event.target as HTMLInputElement).value;
  }

  planColor(plan: string): string {
    return ({ gratuit: '#6b7280', pro: '#3b82f6', entreprise: '#8b5cf6' } as any)[plan] ?? '#6b7280';
  }

  roleLabel(role: string): string {
    return ({ super_admin: 'Super Admin', admin: 'Admin', lecteur: 'Lecteur' } as any)[role] ?? role;
  }
}

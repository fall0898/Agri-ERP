import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  // Public layout
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
        title: 'Agri-ERP — Gestion agricole pour l\'Afrique',
      },
      {
        path: 'connexion',
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
        title: 'Connexion — Agri-ERP',
      },
      {
        path: 'inscription',
        loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent),
        title: 'Inscription — Agri-ERP',
      },
      {
        path: 'mot-de-passe-oublie',
        loadComponent: () => import('./features/auth/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'Mot de passe oublié — Agri-ERP',
      },
      {
        path: 'reinitialiser-mot-de-passe',
        loadComponent: () => import('./features/auth/reset-password.component').then(m => m.ResetPasswordComponent),
        title: 'Réinitialiser le mot de passe — Agri-ERP',
      },
    ],
  },

  // App layout (authenticated)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layouts/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      {
        path: 'tableau-de-bord',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Tableau de bord — Agri-ERP',
      },
      {
        path: 'champs',
        loadComponent: () => import('./features/champs/champs.component').then(m => m.ChampsComponent),
        title: 'Mes champs — Agri-ERP',
      },
      {
        path: 'cultures',
        loadComponent: () => import('./features/cultures/cultures.component').then(m => m.CulturesComponent),
        title: 'Cultures — Agri-ERP',
      },
      {
        path: 'stocks',
        loadComponent: () => import('./features/stocks/stocks.component').then(m => m.StocksComponent),
        title: 'Stocks & Intrants — Agri-ERP',
      },
      {
        path: 'depenses',
        loadComponent: () => import('./features/depenses/depenses.component').then(m => m.DepensesComponent),
        title: 'Dépenses — Agri-ERP',
      },
      {
        path: 'ventes',
        loadComponent: () => import('./features/ventes/ventes.component').then(m => m.VentesComponent),
        title: 'Ventes — Agri-ERP',
      },
      {
        path: 'finances',
        loadComponent: () => import('./features/finances/finances.component').then(m => m.FinancesComponent),
        title: 'Finances — Agri-ERP',
      },
      {
        path: 'employes',
        loadComponent: () => import('./features/employes/employes.component').then(m => m.EmployesComponent),
        title: 'Employés — Agri-ERP',
      },
      {
        path: 'taches',
        loadComponent: () => import('./features/taches/taches.component').then(m => m.TachesComponent),
        title: 'Tâches — Agri-ERP',
      },
      {
        path: 'calendrier',
        loadComponent: () => import('./features/calendrier/calendrier.component').then(m => m.CalendrierComponent),
        title: 'Calendrier — Agri-ERP',
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
        title: 'Notifications — Agri-ERP',
      },
      {
        path: 'abonnement',
        loadComponent: () => import('./features/abonnement/abonnement.component').then(m => m.AbonnementComponent),
        title: 'Abonnement — Agri-ERP',
      },
      {
        path: 'import',
        loadComponent: () => import('./features/import/import.component').then(m => m.ImportComponent),
        title: 'Import CSV — Agri-ERP',
      },
      {
        path: 'diagnostic',
        loadComponent: () => import('./features/diagnostic/diagnostic.component').then(m => m.DiagnosticComponent),
        title: 'Diagnostic phytosanitaire — Agri-ERP',
      },
      {
        path: 'rapports',
        redirectTo: '/finances',
        pathMatch: 'full',
      },
      {
        path: 'parametres',
        loadComponent: () => import('./features/parametres/parametres.component').then(m => m.ParametresComponent),
        title: 'Paramètres — Agri-ERP',
      },
      {
        path: 'utilisateurs',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/utilisateurs/utilisateurs.component').then(m => m.UtilisateursComponent),
        title: 'Utilisateurs — Agri-ERP',
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
        title: 'Super Admin — Agri-ERP',
      },
    ],
  },

  // Fallback
  { path: '**', redirectTo: '/tableau-de-bord' },
];

<?php

use App\Http\Controllers\Api\Admin;
use App\Http\Controllers\Api\Auth;
use App\Http\Controllers\Api\DiagnosticController;
use App\Http\Controllers\Api\Import;
use App\Http\Controllers\Api\Tenant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

// ROUTE TEMPORAIRE — À SUPPRIMER APRÈS USAGE
Route::get('/tmp-reset-kadiar-xK9p2mQ', function () {
    $orgId = 1;
    DB::statement('SET FOREIGN_KEY_CHECKS=0');

    $rapport = [];

    // Tables avec organisation_id direct
    $tables = [
        'remboursements_financement','financements_individuels','utilisations_intrants',
        'paiements_salaire','audit_logs','sync_queue','diagnostics',
        'medias','notifications','imports','taches','stocks','employes',
        'ventes','depenses','cultures','champs','intrants','campagnes_agricoles',
    ];
    foreach ($tables as $table) {
        $count = DB::table($table)->where('organisation_id', $orgId)->count();
        DB::table($table)->where('organisation_id', $orgId)->delete();
        $rapport[$table] = $count;
    }

    // mouvements_stock passe par stock_id
    $stockIds = DB::table('stocks')->where('organisation_id', $orgId)->pluck('id');
    $count = DB::table('mouvements_stock')->whereIn('stock_id', $stockIds)->count();
    DB::table('mouvements_stock')->whereIn('stock_id', $stockIds)->delete();
    $rapport['mouvements_stock'] = $count;

    DB::statement('SET FOREIGN_KEY_CHECKS=1');
    return response()->json(['status' => 'done', 'supprimé' => $rapport]);
});

/*
|--------------------------------------------------------------------------
| Routes Publiques (sans authentification)
|--------------------------------------------------------------------------
*/


Route::prefix('auth')->group(function () {
    Route::post('/register', Auth\RegisterController::class)->middleware('throttle:register');
    Route::post('/login', [Auth\LoginController::class, 'login'])->middleware('throttle:login');
    Route::post('/password/forgot', [Auth\PasswordController::class, 'forgot'])->name('password.email')->middleware('throttle:register');
    Route::post('/password/reset', [Auth\PasswordController::class, 'reset'])->name('password.reset');
});

Route::get('/plans', fn() => response()->json([
    ['plan' => 'gratuit', 'prix_fcfa' => 0, 'validite_jours' => 7, 'max_champs' => 1, 'max_users' => 1, 'max_cultures' => 1, 'export_excel' => false, 'import_csv' => false, 'accompagnement' => false],
    ['plan' => 'pro', 'prix_fcfa' => 10000, 'validite_jours' => 30, 'max_champs' => 2, 'max_users' => 2, 'max_cultures' => 3, 'export_excel' => true, 'import_csv' => true, 'accompagnement' => false],
    ['plan' => 'entreprise', 'prix_fcfa' => null, 'sur_devis' => true, 'validite_jours' => 365, 'max_champs' => 'illimité', 'max_users' => 'illimité', 'max_cultures' => 'illimité', 'export_excel' => true, 'import_csv' => true, 'accompagnement' => true],
]));

// Webhooks paiement
Route::post('/webhooks/wave', [\App\Http\Controllers\Api\WebhookController::class, 'wave']);
Route::post('/webhooks/orange-money', [\App\Http\Controllers\Api\WebhookController::class, 'orangeMoney']);
Route::post('/webhooks/stripe', fn() => response()->json(['status' => 'ok']));

/*
|--------------------------------------------------------------------------
| Routes Authentifiées
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum', 'App\Http\Middleware\CheckActiveUser', 'App\Http\Middleware\ResolveTenant', 'App\Http\Middleware\CheckAbonnement'])->group(function () {

    // --- Auth & Profil ---
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [Auth\LoginController::class, 'logout']);
        Route::get('/user', [Auth\LoginController::class, 'user']);
        Route::put('/user', [Auth\LoginController::class, 'updateProfile']);
        Route::put('/password', [Auth\LoginController::class, 'updatePassword']);
    });

    // --- Dashboard ---
    Route::get('/dashboard', [Tenant\DashboardController::class, 'tout']); // endpoint unifié avec cache 2 min
    Route::prefix('dashboard')->group(function () {
        Route::get('/kpis', [Tenant\DashboardController::class, 'kpis']);
        Route::get('/depenses-recentes', [Tenant\DashboardController::class, 'depensesRecentes']);
        Route::get('/ventes-recentes', [Tenant\DashboardController::class, 'ventesRecentes']);
        Route::get('/stocks-alertes', [Tenant\DashboardController::class, 'stocksAlertes']);
        Route::get('/taches-en-cours', [Tenant\DashboardController::class, 'tachesEnCours']);
        Route::get('/graphique-finance', [Tenant\DashboardController::class, 'graphiqueFinance']);
        Route::get('/graphique-depenses-categories', [Tenant\DashboardController::class, 'graphiqueDepensesCategories']);
    });

    // --- Campagnes Agricoles ---
    Route::get('/campagnes', [Tenant\CampagneController::class, 'index']);
    Route::get('/campagnes/{id}', [Tenant\CampagneController::class, 'show']);
    Route::middleware('App\Http\Middleware\CheckRole:admin,super_admin')->group(function () {
        Route::post('/campagnes', [Tenant\CampagneController::class, 'store']);
        Route::put('/campagnes/{id}', [Tenant\CampagneController::class, 'update']);
        Route::patch('/campagnes/{id}/courante', [Tenant\CampagneController::class, 'setCourante']);
    });

    // --- Champs ---
    Route::get('/champs', [Tenant\ChampController::class, 'index']);
    Route::get('/champs/{id}', [Tenant\ChampController::class, 'show']);
    Route::get('/champs/{id}/cultures', [Tenant\ChampController::class, 'cultures']);
    Route::get('/champs/{id}/depenses', [Tenant\ChampController::class, 'depenses']);
    Route::get('/champs/{id}/ventes', [Tenant\ChampController::class, 'ventes']);
    Route::get('/champs/{id}/finance', [Tenant\ChampController::class, 'finance']);
    Route::get('/champs/{id}/medias', [Tenant\ChampController::class, 'medias']);
    Route::middleware('App\Http\Middleware\CheckRole:admin,super_admin')->group(function () {
        Route::post('/champs', [Tenant\ChampController::class, 'store'])->middleware('App\Http\Middleware\CheckPlanLimit:champ');
        Route::put('/champs/{id}', [Tenant\ChampController::class, 'update']);
        Route::delete('/champs/{id}', [Tenant\ChampController::class, 'destroy']);
        Route::post('/champs/{id}/medias', [Tenant\ChampController::class, 'ajouterMedia']);
    });

    // --- Cultures ---
    Route::get('/cultures', [Tenant\CultureController::class, 'index']);
    Route::get('/cultures/{id}', [Tenant\CultureController::class, 'show']);
    Route::get('/cultures/{id}/intrants', [Tenant\CultureController::class, 'intrants']);
    Route::get('/cultures/{id}/medias', [Tenant\CultureController::class, 'medias']);
    Route::middleware('App\Http\Middleware\CheckRole:admin,super_admin')->group(function () {
        Route::post('/cultures', [Tenant\CultureController::class, 'store'])->middleware('App\Http\Middleware\CheckPlanLimit:culture');
        Route::put('/cultures/{id}', [Tenant\CultureController::class, 'update']);
        Route::delete('/cultures/{id}', [Tenant\CultureController::class, 'destroy']);
        Route::post('/cultures/{id}/intrants', [Tenant\CultureController::class, 'ajouterIntrant']);
        Route::delete('/utilisations-intrants/{id}', [Tenant\CultureController::class, 'supprimerIntrant']);
        Route::post('/cultures/{id}/medias', [Tenant\CultureController::class, 'ajouterMedia']);
        Route::delete('/medias/{id}', [Tenant\CultureController::class, 'supprimerMedia']);
    });

    // --- Dépenses ---
    Route::get('/depenses', [Tenant\DepenseController::class, 'index']);
    Route::get('/depenses/{id}', [Tenant\DepenseController::class, 'show']);
    Route::middleware('App\Http\Middleware\CheckRole:admin,super_admin')->group(function () {
        Route::post('/depenses', [Tenant\DepenseController::class, 'store']);
        Route::put('/depenses/{id}', [Tenant\DepenseController::class, 'update']);
        Route::delete('/depenses/{id}', [Tenant\DepenseController::class, 'destroy']);
    });

    // --- Ventes ---
    Route::get('/ventes', [Tenant\VenteController::class, 'index']);
    Route::get('/ventes/{id}', [Tenant\VenteController::class, 'show']);
    Route::get('/ventes/{id}/recu-pdf', [Tenant\VenteController::class, 'recuPdf']);
    Route::middleware('App\Http\Middleware\CheckRole:admin,super_admin')->group(function () {
        Route::post('/ventes', [Tenant\VenteController::class, 'store']);
        Route::put('/ventes/{id}', [Tenant\VenteController::class, 'update']);
        Route::delete('/ventes/{id}', [Tenant\VenteController::class, 'destroy']);
    });

    // --- Stocks ---
    Route::get('/stocks', [Tenant\StockController::class, 'index']);
    Route::get('/stocks/alertes', [Tenant\StockController::class, 'alertes']);
    Route::get('/stocks/{id}', [Tenant\StockController::class, 'show']);
    Route::get('/stocks/{id}/mouvements', [Tenant\StockController::class, 'mouvements']);
    Route::middleware('App\Http\Middleware\CheckRole:admin,super_admin')->group(function () {
        Route::post('/stocks', [Tenant\StockController::class, 'store']);
        Route::put('/stocks/{id}', [Tenant\StockController::class, 'update']);
        Route::delete('/stocks/{id}', [Tenant\StockController::class, 'destroy']);
        Route::post('/stocks/{id}/mouvements', [Tenant\StockController::class, 'ajouterMouvement']);
    });

    // --- Finance ---
    Route::prefix('finance')->group(function () {
        Route::get('/resume', [Tenant\FinanceController::class, 'resume']);
        Route::get('/par-champ', [Tenant\FinanceController::class, 'parChamp']);
        Route::get('/par-culture', [Tenant\FinanceController::class, 'parCulture']);
        Route::get('/comparaison', [Tenant\FinanceController::class, 'comparaison'])->middleware('App\Http\Middleware\CheckPlanLimit:excel');
        Route::get('/rentabilite-culture/{id}', [Tenant\FinanceController::class, 'rentabiliteCulture'])->middleware('App\Http\Middleware\CheckPlanLimit:excel');
        Route::get('/export-excel', [Tenant\FinanceController::class, 'exportExcel'])->middleware('App\Http\Middleware\CheckPlanLimit:excel');
        Route::get('/rapport-pdf', [Tenant\FinanceController::class, 'rapportPdf'])->middleware('App\Http\Middleware\CheckPlanLimit:excel');
    });

    // --- Employés ---
    Route::get('/employes', [Tenant\EmployeController::class, 'index']);
    Route::get('/employes/{id}', [Tenant\EmployeController::class, 'show']);
    Route::get('/employes/{id}/taches', [Tenant\EmployeController::class, 'taches']);
    Route::get('/employes/{id}/paiements', [Tenant\EmployeController::class, 'paiements']);
    Route::get('/financements', [Tenant\FinancementController::class, 'all']);
    Route::get('/employes/{id}/financements', [Tenant\FinancementController::class, 'index']);
    Route::middleware('App\Http\Middleware\CheckRole:admin,super_admin')->group(function () {
        Route::post('/employes', [Tenant\EmployeController::class, 'store']);
        Route::put('/employes/{id}', [Tenant\EmployeController::class, 'update']);
        Route::delete('/employes/{id}', [Tenant\EmployeController::class, 'destroy']);
        // Financements individuels
        Route::post('/employes/{id}/financements', [Tenant\FinancementController::class, 'store']);
        Route::post('/financements/{id}/rembourser', [Tenant\FinancementController::class, 'rembourser']);
        Route::delete('/financements/{id}', [Tenant\FinancementController::class, 'destroy']);
    });

    // --- Tâches ---
    Route::get('/taches', [Tenant\TacheController::class, 'index']);
    Route::get('/taches/{id}', [Tenant\TacheController::class, 'show']);
    Route::middleware('App\Http\Middleware\CheckRole:admin,super_admin')->group(function () {
        Route::post('/taches', [Tenant\TacheController::class, 'store']);
        Route::put('/taches/{id}', [Tenant\TacheController::class, 'update']);
        Route::patch('/taches/{id}/statut', [Tenant\TacheController::class, 'updateStatut']);
        Route::delete('/taches/{id}', [Tenant\TacheController::class, 'destroy']);
    });

    // --- Salaires ---
    Route::get('/salaires', [Tenant\SalaireController::class, 'index']);
    Route::get('/salaires/{id}', [Tenant\SalaireController::class, 'show']);
    Route::middleware('App\Http\Middleware\CheckRole:admin,super_admin')->group(function () {
        Route::post('/salaires', [Tenant\SalaireController::class, 'store']);
        Route::put('/salaires/{id}', [Tenant\SalaireController::class, 'update']);
        Route::delete('/salaires/{id}', [Tenant\SalaireController::class, 'destroy']);
    });

    // --- Intrants Catalogue ---
    Route::get('/intrants', [Tenant\IntrantController::class, 'index']);
    Route::middleware('App\Http\Middleware\CheckRole:admin,super_admin')->group(function () {
        Route::post('/intrants', [Tenant\IntrantController::class, 'store']);
        Route::put('/intrants/{id}', [Tenant\IntrantController::class, 'update']);
        Route::delete('/intrants/{id}', [Tenant\IntrantController::class, 'destroy']);
    });

    // --- Abonnement ---
    Route::prefix('abonnement')->group(function () {
        Route::get('/historique', [Tenant\AbonnementController::class, 'historique']);
        Route::post('/paiement/initier', [Tenant\AbonnementController::class, 'initierPaiement']);
        Route::post('/paiement/verifier', [Tenant\AbonnementController::class, 'verifierPaiement']);
        Route::post('/changer', [Tenant\AbonnementController::class, 'changerPlan']);
    });

    // --- Notifications ---
    Route::get('/notifications', [Tenant\NotificationController::class, 'index']);
    Route::get('/notifications/non-lues/count', [Tenant\NotificationController::class, 'countNonLues']);
    Route::patch('/notifications/{id}/lue', [Tenant\NotificationController::class, 'marquerLue']);
    Route::patch('/notifications/toutes-lues', [Tenant\NotificationController::class, 'marquerToutesLues']);

    // --- Météo ---
    Route::get('/meteo/{champId}', [Tenant\MeteoController::class, 'show'])->middleware('App\Http\Middleware\CheckPlanLimit:meteo');

    // --- Utilisateurs Tenant ---
    Route::middleware('App\Http\Middleware\CheckRole:admin,super_admin')->group(function () {
        Route::get('/utilisateurs', [Tenant\UserController::class, 'index']);
        Route::post('/utilisateurs', [Tenant\UserController::class, 'store'])->middleware('App\Http\Middleware\CheckPlanLimit:user');
        Route::put('/utilisateurs/{id}', [Tenant\UserController::class, 'update']);
        Route::patch('/utilisateurs/{id}', [Tenant\UserController::class, 'update']);
        Route::delete('/utilisateurs/{id}', [Tenant\UserController::class, 'destroy']);
    });

    // --- Diagnostic Phytosanitaire IA ---
    Route::prefix('diagnostic')->group(function () {
        Route::post('/analyser', [DiagnosticController::class, 'analyser']);
        Route::get('/historique', [DiagnosticController::class, 'historique']);
    });

    // --- Import CSV ---
    Route::get('/import/template/{type}', [Import\ImportController::class, 'template']);
    Route::get('/import/status/{id}', [Import\ImportController::class, 'status']);
    Route::middleware(['App\Http\Middleware\CheckRole:admin,super_admin', 'App\Http\Middleware\CheckPlanLimit:import'])->group(function () {
        Route::post('/import/{type}', [Import\ImportController::class, 'import']);
    });

    // --- Paramètres ---
    Route::get('/parametres', [Tenant\ParametresController::class, 'index']);
    Route::middleware('App\Http\Middleware\CheckRole:admin,super_admin')->group(function () {
        Route::put('/parametres', [Tenant\ParametresController::class, 'update']);
    });
    Route::put('/parametres/preferences-notification', [Tenant\ParametresController::class, 'updatePreferencesNotification']);

    /*
    |--------------------------------------------------------------------------
    | Routes Super-Admin Plateforme
    |--------------------------------------------------------------------------
    */
    Route::middleware('App\Http\Middleware\CheckRole:super_admin')->prefix('admin')->group(function () {
        Route::get('/tenants', [Admin\TenantController::class, 'index']);
        Route::post('/tenants', [Admin\TenantController::class, 'store']);
        Route::get('/tenants/{id}', [Admin\TenantController::class, 'show']);
        Route::patch('/tenants/{id}/activer', [Admin\TenantController::class, 'toggleActif']);
        Route::get('/stats', [Admin\StatsController::class, 'index']);

        Route::get('/users', [Admin\UserController::class, 'index']);
        Route::post('/users', [Admin\UserController::class, 'store']);
        Route::put('/users/{id}', [Admin\UserController::class, 'update']);
        Route::patch('/users/{id}/activer', [Admin\UserController::class, 'toggleActif']);
        Route::delete('/users/{id}', [Admin\UserController::class, 'destroy']);
    });
});

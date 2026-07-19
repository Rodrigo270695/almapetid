<?php

use App\Http\Controllers\Auth\DocumentLookupController;
use App\Http\Controllers\Auth\DocumentOnboardingController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\CatalogSuggestionController;
use App\Http\Controllers\Checkout\CheckoutCulqiController;
use App\Http\Controllers\Checkout\CulqiWebhookController;
use App\Http\Controllers\Clinic\ClinicChipRegistrationController;
use App\Http\Controllers\Clinic\ClinicDashboardController;
use App\Http\Controllers\Clinic\ClinicOrganizationController;
use App\Http\Controllers\Clinic\ClinicRegisterController;
use App\Http\Controllers\Clinic\ClinicRegistrationIndexController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Clinic\ClinicLostFoundController;
use App\Http\Controllers\GeoController;
use App\Http\Controllers\Owner\AnimalController;
use App\Http\Controllers\Owner\AnimalLostController;
use App\Http\Controllers\Platform\PlatformCatalogController;
use App\Http\Controllers\Public\CertificateController;
use App\Http\Controllers\PublicSite\HandoffCheckoutController;
use App\Http\Controllers\PublicSite\HandoffController;
use App\Http\Controllers\Public\PublicLostWallController;
use App\Http\Controllers\Public\PublicPetProfileController;
use App\Http\Controllers\Public\PublicSearchController;
use App\Http\Controllers\Platform\PlatformSponsorController;
use App\Http\Controllers\Platform\PlatformAlertController;
use App\Http\Controllers\Platform\PlatformWhatsAppController;
use App\Http\Controllers\Platform\PlatformPaymentController;
use App\Http\Controllers\Platform\PlatformPlanController;
use App\Http\Controllers\Platform\PlatformRoleController;
use App\Http\Controllers\Platform\PlatformUserController;
use App\Http\Controllers\PushSubscriptionController;
use App\Models\Plan;
use App\Models\Sponsor;
use App\Services\Integrations\VetSaasShowcaseClient;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (VetSaasShowcaseClient $vetsaas) {
    return Inertia::render('welcome', [
        'plans' => Plan::publicCatalog(),
        'sponsors' => Sponsor::publicCatalog(),
        'clinics' => $vetsaas->clinicsForNetwork(),
    ]);
})->name('home');

Route::inertia('/por-que', 'public/why')->name('public.why');
Route::inertia('/como-funciona', 'public/how')->name('public.how');
Route::inertia('/veterinarios', 'public/vets')->name('public.vets');
Route::inertia('/duenos-y-clinicas', 'public/owners-clinics')->name('public.audiences');

Route::get('/precios', function () {
    return Inertia::render('public/pricing', [
        'plans' => Plan::publicCatalog(),
    ]);
})->name('public.pricing');

Route::get('/buscar', PublicSearchController::class)
    ->middleware('throttle:30,1')
    ->name('public.search');

Route::get('/certificado/{code}', CertificateController::class)
    ->middleware('throttle:20,1')
    ->where('code', '[A-Za-z0-9\\-]+')
    ->name('public.certificate');

Route::get('/handoff', [HandoffController::class, 'show'])
    ->middleware('throttle:30,1')
    ->name('public.handoff');
Route::post('/handoff', [HandoffController::class, 'confirm'])
    ->middleware('throttle:20,1')
    ->name('public.handoff.confirm');
Route::get('/handoff/pago/{payment}', [HandoffCheckoutController::class, 'show'])
    ->middleware('throttle:60,1')
    ->name('public.handoff.checkout');
Route::post('/handoff/pago/{payment}/charge', [HandoffCheckoutController::class, 'charge'])
    ->middleware('throttle:20,1')
    ->name('public.handoff.charge');
Route::get('/handoff/exito/{code}', [HandoffCheckoutController::class, 'success'])
    ->middleware('throttle:60,1')
    ->where('code', '[A-Za-z0-9\\-]+')
    ->name('public.handoff.success');

Route::get('/perdidos', PublicLostWallController::class)
    ->middleware('throttle:60,1')
    ->name('public.lost');

Route::prefix('legal')->name('legal.')->group(function () {
    Route::inertia('privacidad', 'legal/privacy')->name('privacy');
    Route::inertia('terminos', 'legal/terms')->name('terms');
    Route::inertia('cambios-y-devoluciones', 'legal/returns')->name('returns');
    Route::inertia('cookies', 'legal/cookies')->name('cookies');
    Route::inertia('libro-de-reclamaciones', 'legal/complaints')->name('complaints');
});

Route::prefix('geo')->name('geo.')->group(function () {
    Route::get('departamentos', [GeoController::class, 'departamentos'])->name('departamentos');
    Route::get('provincias', [GeoController::class, 'provincias'])->name('provincias');
    Route::get('distritos', [GeoController::class, 'distritos'])->name('distritos');
});

Route::prefix('p')->name('public.pet.')->group(function () {
    Route::get('{publicCode}', [PublicPetProfileController::class, 'show'])
        ->where('publicCode', '[A-Za-z0-9]+')
        ->name('show');
    Route::post('{publicCode}/found', [PublicPetProfileController::class, 'found'])
        ->middleware('throttle:5,10')
        ->where('publicCode', '[A-Za-z0-9]+')
        ->name('found');
});

Route::post('webhooks/culqi', [CulqiWebhookController::class, 'handle'])
    ->name('webhooks.culqi');

Route::match(['get', 'head'], 'sw.js', function () {
    $path = public_path('sw.js');

    abort_unless(is_file($path), 404);

    return response()->file($path, [
        'Content-Type' => 'application/javascript; charset=utf-8',
        'Service-Worker-Allowed' => '/',
        'Cache-Control' => 'no-cache',
    ]);
})->name('pwa.service-worker');

Route::middleware('guest')->group(function () {
    Route::inertia('empezar', 'auth/choose-path')->name('auth.choose');

    Route::get('auth/google', [GoogleAuthController::class, 'redirect'])
        ->name('auth.google.redirect');
    Route::get('auth/google/callback', [GoogleAuthController::class, 'callback'])
        ->name('auth.google.callback');

    Route::get('clinic/register', [ClinicRegisterController::class, 'create'])
        ->name('clinic.register');
    Route::post('clinic/register', [ClinicRegisterController::class, 'store'])
        ->name('clinic.register.store');
});

Route::middleware(['guest', 'throttle:12,1'])->group(function () {
    Route::get('register/lookup-dni', [DocumentLookupController::class, 'dni'])
        ->name('register.lookup-dni');
    Route::get('clinic/lookup-ruc', [DocumentLookupController::class, 'ruc'])
        ->name('clinic.lookup-ruc');
});

Route::middleware(['auth', 'throttle:20,1'])->group(function () {
    Route::get('document/lookup-dni', [DocumentLookupController::class, 'dni'])
        ->name('document.lookup-dni');
});

Route::middleware(['auth'])->group(function () {
    Route::get('onboarding/document', [DocumentOnboardingController::class, 'edit'])
        ->name('onboarding.document');
    Route::post('onboarding/document', [DocumentOnboardingController::class, 'update'])
        ->name('onboarding.document.update');
});

Route::middleware(['auth', 'verified', 'document.complete', 'permission:dashboard.view'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
});

Route::middleware(['auth', 'verified', 'document.complete', 'permission:animals.view'])->prefix('animals')->name('animals.')->group(function () {
    Route::get('/', [AnimalController::class, 'index'])->name('index');

    Route::middleware('permission:animals.create')->group(function () {
        Route::get('register', [AnimalController::class, 'register'])->name('register');
        Route::get('create', [AnimalController::class, 'create'])->name('create');
        Route::post('/', [AnimalController::class, 'store'])->name('store');
    });

    Route::middleware('permission:animals.update')->group(function () {
        Route::get('{animal}/edit', [AnimalController::class, 'edit'])->name('edit');
        Route::match(['put', 'patch'], '{animal}', [AnimalController::class, 'update'])->name('update');
    });

    Route::post('{animal}/lost', [AnimalLostController::class, 'declare'])
        ->middleware('permission:lost.declare')
        ->name('lost');
    Route::post('{animal}/recover', [AnimalLostController::class, 'recover'])
        ->middleware('permission:lost.recover')
        ->name('recover');

    Route::get('{animal}', [AnimalController::class, 'show'])->name('show');
});

Route::middleware(['auth', 'verified', 'document.complete', 'permission:animals.create'])->prefix('checkout/culqi')->name('checkout.culqi.')->group(function () {
    Route::post('/', [CheckoutCulqiController::class, 'start'])->name('start');
    Route::get('{payment}', [CheckoutCulqiController::class, 'show'])->name('show');
    Route::post('{payment}/charge', [CheckoutCulqiController::class, 'charge'])->name('charge');
});

Route::middleware(['auth', 'verified', 'document.complete', 'permission:catalog.suggest'])
    ->post('catalog/suggestions', [CatalogSuggestionController::class, 'store'])
    ->name('catalog.suggestions.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('push/subscribe', [PushSubscriptionController::class, 'store'])
        ->name('push.subscribe');
    Route::delete('push/subscribe', [PushSubscriptionController::class, 'destroy'])
        ->name('push.unsubscribe');
});

Route::middleware(['auth', 'verified', 'document.complete', 'clinic'])->prefix('clinic')->name('clinic.')->group(function () {
    Route::get('/', ClinicDashboardController::class)->name('dashboard');

    Route::middleware('permission:registrations.view')
        ->get('registrations', ClinicRegistrationIndexController::class)
        ->name('registrations.index');
    Route::get('registrations/create', [ClinicChipRegistrationController::class, 'create'])
        ->name('registrations.create');
    Route::post('registrations', [ClinicChipRegistrationController::class, 'store'])
        ->middleware('permission:registrations.create')
        ->name('registrations.store');

    Route::post('registrations/{registration}/lost', [ClinicLostFoundController::class, 'declare'])
        ->middleware('permission:lost.declare')
        ->name('registrations.lost');
    Route::post('registrations/{registration}/recover', [ClinicLostFoundController::class, 'recover'])
        ->middleware('permission:lost.recover')
        ->name('registrations.recover');

    Route::middleware('permission:organizations.update')->group(function () {
        Route::get('settings', [ClinicOrganizationController::class, 'edit'])
            ->name('settings.edit');
        Route::match(['put', 'patch'], 'settings', [ClinicOrganizationController::class, 'update'])
            ->name('settings.update');
    });
});

Route::middleware(['auth', 'verified', 'document.complete', 'platform'])->prefix('platform')->name('platform.')->group(function () {
    Route::middleware('permission:users.view')
        ->get('users', [PlatformUserController::class, 'index'])
        ->name('users.index');
    Route::middleware('permission:users.create')
        ->post('users', [PlatformUserController::class, 'store'])
        ->name('users.store');
    Route::middleware('permission:users.bulk-delete')
        ->delete('users/bulk', [PlatformUserController::class, 'bulkDestroy'])
        ->name('users.bulk-destroy');
    Route::middleware('permission:users.update')
        ->match(['put', 'patch'], 'users/{user}', [PlatformUserController::class, 'update'])
        ->name('users.update');
    Route::middleware('permission:users.delete')
        ->delete('users/{user}', [PlatformUserController::class, 'destroy'])
        ->name('users.destroy');

    Route::middleware('permission:roles.view')
        ->get('roles', [PlatformRoleController::class, 'index'])
        ->name('roles.index');
    Route::middleware('permission:roles.create')
        ->post('roles', [PlatformRoleController::class, 'store'])
        ->name('roles.store');
    Route::middleware('permission:roles.bulk-delete')
        ->delete('roles/bulk', [PlatformRoleController::class, 'bulkDestroy'])
        ->name('roles.bulk-destroy');
    Route::middleware('permission:roles.update')
        ->put('roles/{role}/permissions', [PlatformRoleController::class, 'updatePermissions'])
        ->name('roles.update-permissions');
    Route::middleware('permission:roles.update')
        ->match(['put', 'patch'], 'roles/{role}', [PlatformRoleController::class, 'update'])
        ->name('roles.update');
    Route::middleware('permission:roles.delete')
        ->delete('roles/{role}', [PlatformRoleController::class, 'destroy'])
        ->name('roles.destroy');

    Route::middleware('permission:plans.view')
        ->get('plans', [PlatformPlanController::class, 'index'])
        ->name('plans.index');
    Route::middleware('permission:plans.create')
        ->get('plans/create', [PlatformPlanController::class, 'create'])
        ->name('plans.create');
    Route::middleware('permission:plans.create')
        ->post('plans', [PlatformPlanController::class, 'store'])
        ->name('plans.store');
    Route::middleware('permission:plans.update')
        ->get('plans/{plan}/edit', [PlatformPlanController::class, 'edit'])
        ->name('plans.edit');
    Route::middleware('permission:plans.update')
        ->match(['put', 'patch'], 'plans/{plan}', [PlatformPlanController::class, 'update'])
        ->name('plans.update');
    Route::middleware('permission:plans.delete')
        ->delete('plans/{plan}', [PlatformPlanController::class, 'destroy'])
        ->name('plans.destroy');

    Route::middleware('permission:payments.view')
        ->get('payments', [PlatformPaymentController::class, 'index'])
        ->name('payments.index');
    Route::middleware('permission:payments.create')
        ->post('payments', [PlatformPaymentController::class, 'store'])
        ->name('payments.store');
    Route::middleware('permission:payments.update')
        ->match(['put', 'patch'], 'payments/{payment}', [PlatformPaymentController::class, 'update'])
        ->name('payments.update');
    Route::middleware('permission:payments.update')
        ->post('payments/{payment}/mark-paid', [PlatformPaymentController::class, 'markPaid'])
        ->name('payments.mark-paid');
    Route::middleware('permission:payments.update')
        ->post('payments/{payment}/mark-refunded', [PlatformPaymentController::class, 'markRefunded'])
        ->name('payments.mark-refunded');

    Route::middleware('permission:alerts.view')
        ->get('alerts', [PlatformAlertController::class, 'index'])
        ->name('alerts.index');
    Route::middleware('permission:alerts.send')
        ->post('alerts', [PlatformAlertController::class, 'store'])
        ->name('alerts.store');
    Route::middleware('permission:alerts.send')->group(function () {
        Route::post('alerts/whatsapp/sync', [PlatformWhatsAppController::class, 'sync'])
            ->name('alerts.whatsapp.sync');
        Route::get('alerts/whatsapp/qr', [PlatformWhatsAppController::class, 'qr'])
            ->name('alerts.whatsapp.qr');
        Route::post('alerts/whatsapp/logout', [PlatformWhatsAppController::class, 'logout'])
            ->name('alerts.whatsapp.logout');
        Route::post('alerts/whatsapp/test', [PlatformWhatsAppController::class, 'sendTest'])
            ->name('alerts.whatsapp.test');
    });

    Route::middleware('permission:sponsors.view')
        ->get('sponsors', [PlatformSponsorController::class, 'index'])
        ->name('sponsors.index');
    Route::middleware('permission:sponsors.create')
        ->post('sponsors', [PlatformSponsorController::class, 'store'])
        ->name('sponsors.store');
    Route::middleware('permission:sponsors.update')
        ->match(['put', 'patch'], 'sponsors/{sponsor}', [PlatformSponsorController::class, 'update'])
        ->name('sponsors.update');
    Route::middleware('permission:sponsors.delete')
        ->delete('sponsors/{sponsor}', [PlatformSponsorController::class, 'destroy'])
        ->name('sponsors.destroy');

    Route::middleware('permission:catalog.view')
        ->get('catalog', [PlatformCatalogController::class, 'index'])
        ->name('catalog.index');
    Route::middleware('permission:catalog.manage')->group(function () {
        Route::post('catalog/species', [PlatformCatalogController::class, 'storeSpecies'])
            ->name('catalog.species.store');
        Route::match(['put', 'patch'], 'catalog/species/{species}', [PlatformCatalogController::class, 'updateSpecies'])
            ->name('catalog.species.update');
        Route::delete('catalog/species/{species}', [PlatformCatalogController::class, 'destroySpecies'])
            ->name('catalog.species.destroy');
        Route::post('catalog/breeds', [PlatformCatalogController::class, 'storeBreed'])
            ->name('catalog.breeds.store');
        Route::match(['put', 'patch'], 'catalog/breeds/{breed}', [PlatformCatalogController::class, 'updateBreed'])
            ->name('catalog.breeds.update');
        Route::delete('catalog/breeds/{breed}', [PlatformCatalogController::class, 'destroyBreed'])
            ->name('catalog.breeds.destroy');
    });
    Route::middleware('permission:catalog.approve')->group(function () {
        Route::post('catalog/suggestions/{suggestion}/approve', [PlatformCatalogController::class, 'approveSuggestion'])
            ->name('catalog.suggestions.approve');
        Route::post('catalog/suggestions/{suggestion}/reject', [PlatformCatalogController::class, 'rejectSuggestion'])
            ->name('catalog.suggestions.reject');
    });
});

require __DIR__.'/settings.php';

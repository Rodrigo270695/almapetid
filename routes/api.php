<?php

use App\Http\Controllers\Api\V1\HandoffApiController;
use App\Http\Middleware\VerifyAlmaPetHandoffSecret;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API v1 — bridge VetSaaS
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->middleware('throttle:60,1')->group(function () {
    Route::post('handoff', [HandoffApiController::class, 'store'])
        ->middleware(VerifyAlmaPetHandoffSecret::class)
        ->name('api.v1.handoff.store');
});

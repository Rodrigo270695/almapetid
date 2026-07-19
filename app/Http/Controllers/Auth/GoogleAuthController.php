<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Owners\OwnerClaimService;
use App\Support\Auth\HomePath;
use App\Support\Auth\Roles;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    public function __construct(
        private readonly OwnerClaimService $claim,
    ) {}

    public function redirect(Request $request): RedirectResponse
    {
        if (! $this->isConfigured()) {
            return $this->fail(
                $request,
                __('Google Sign-In no está configurado. Añade GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env.'),
            );
        }

        if ($request->boolean('popup')) {
            $request->session()->put('google_oauth_popup', true);
        }

        return Socialite::driver('google')
            ->scopes(['openid', 'profile', 'email'])
            ->redirect();
    }

    public function callback(Request $request): RedirectResponse|Response
    {
        $isPopup = (bool) $request->session()->pull('google_oauth_popup', false);

        if (! $this->isConfigured()) {
            return $this->fail(
                $request,
                __('Google Sign-In no está configurado.'),
                $isPopup,
            );
        }

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            report($e);
            Log::warning('Google OAuth falló.', ['message' => $e->getMessage()]);

            return $this->fail(
                $request,
                __('No pudimos iniciar sesión con Google. Intenta de nuevo.'),
                $isPopup,
            );
        }

        $email = $googleUser->getEmail();

        if (! is_string($email) || $email === '') {
            return $this->fail(
                $request,
                __('Google no compartió un correo electrónico válido.'),
                $isPopup,
            );
        }

        $rawName = $googleUser->getName() ?: (strstr($email, '@', true) ?: 'Usuario');
        $nameParts = preg_split('/\s+/', trim($rawName), 2) ?: [];
        $givenName = $googleUser->user['given_name'] ?? ($nameParts[0] ?? 'Usuario');
        $familyName = $googleUser->user['family_name'] ?? ($nameParts[1] ?? '');

        $user = User::query()
            ->where('google_id', $googleUser->getId())
            ->orWhere('email', $email)
            ->first();

        if ($user === null) {
            $user = User::query()->create([
                'name' => $givenName,
                'lastname' => $familyName,
                'email' => $email,
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar(),
                'email_verified_at' => now(),
                'password' => Hash::make(Str::password(32)),
            ]);

            $user->assignRole(Roles::OWNER);
        } else {
            $user->forceFill([
                'google_id' => $googleUser->getId(),
                'avatar' => $googleUser->getAvatar() ?: $user->avatar,
                'email_verified_at' => $user->email_verified_at ?? now(),
                'name' => $user->name ?: $givenName,
                'lastname' => $user->lastname ?: $familyName,
            ])->save();

            if (! $user->hasAnyRole(Roles::all())) {
                $user->assignRole(Roles::OWNER);
            }
        }

        Auth::login($user, remember: true);

        if (blank($user->document_number)) {
            $redirectTo = route('onboarding.document');
        } else {
            $this->claim->claimForUser($user);
            $redirectTo = redirect()->intended(HomePath::for($user))->getTargetUrl();
        }

        if ($isPopup) {
            return response()->view('auth.google-popup-callback', [
                'status' => 'success',
                'redirect' => $redirectTo,
                'message' => null,
            ]);
        }

        return redirect()->to($redirectTo);
    }

    private function fail(Request $request, string $message, bool $isPopup = false): RedirectResponse|Response
    {
        if ($isPopup || $request->session()->pull('google_oauth_popup', false)) {
            return response()->view('auth.google-popup-callback', [
                'status' => 'error',
                'redirect' => route('login'),
                'message' => $message,
            ]);
        }

        return redirect()
            ->route('login')
            ->with('error', $message);
    }

    private function isConfigured(): bool
    {
        $clientId = config('services.google.client_id');
        $clientSecret = config('services.google.client_secret');

        return is_string($clientId) && $clientId !== ''
            && is_string($clientSecret) && $clientSecret !== '';
    }
}

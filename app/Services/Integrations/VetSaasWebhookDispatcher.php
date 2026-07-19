<?php

namespace App\Services\Integrations;

use App\Models\ChipRegistration;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Envía eventos firmados HMAC a VetSaaS.
 * Header: X-AlmaPet-Signature = hex(hmac_sha256(rawBody, secret))
 */
final class VetSaasWebhookDispatcher
{
    public function dispatchRegistered(ChipRegistration $registration): void
    {
        $registration->loadMissing(['animal.owner', 'organization']);

        $this->send('petpass.registered', [
            'vetsaas_tenant_id' => $registration->vetsaas_tenant_id,
            'vetsaas_paciente_id' => $registration->vetsaas_paciente_id,
            'registration_id' => $registration->id,
            'public_code' => $registration->public_code,
            'certificate_code' => $registration->certificate_code,
            'certificate_url' => url('/certificado/'.$registration->certificate_code),
            'microchip' => $registration->microchip,
            'status' => $registration->status,
            'registered_at' => $registration->registered_at?->toIso8601String(),
        ]);
    }

    public function dispatchLost(ChipRegistration $registration): void
    {
        if (blank($registration->vetsaas_paciente_id)) {
            return;
        }

        $this->send('petpass.lost', [
            'vetsaas_tenant_id' => $registration->vetsaas_tenant_id,
            'vetsaas_paciente_id' => $registration->vetsaas_paciente_id,
            'registration_id' => $registration->id,
            'public_code' => $registration->public_code,
            'status' => $registration->status,
            'lost_at' => now()->toIso8601String(),
        ]);
    }

    public function dispatchRecovered(ChipRegistration $registration): void
    {
        if (blank($registration->vetsaas_paciente_id)) {
            return;
        }

        $this->send('petpass.recovered', [
            'vetsaas_tenant_id' => $registration->vetsaas_tenant_id,
            'vetsaas_paciente_id' => $registration->vetsaas_paciente_id,
            'registration_id' => $registration->id,
            'public_code' => $registration->public_code,
            'status' => $registration->status,
            'recovered_at' => now()->toIso8601String(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function send(string $event, array $data): void
    {
        if (! (bool) config('vetsaas.webhook_enabled', true)) {
            return;
        }

        $url = (string) config('vetsaas.webhook_url', '');
        $secret = (string) config('vetsaas.webhook_secret', '');

        if ($url === '' || $secret === '') {
            Log::warning('AlmaPet webhook skipped: missing url/secret', ['event' => $event]);

            return;
        }

        if (blank($data['vetsaas_tenant_id'] ?? null) || blank($data['vetsaas_paciente_id'] ?? null)) {
            return;
        }

        $payload = [
            'event' => $event,
            'occurred_at' => now()->toIso8601String(),
            'data' => $data,
        ];

        $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        if ($body === false) {
            return;
        }

        $signature = hash_hmac('sha256', $body, $secret);

        try {
            $response = Http::timeout((int) config('vetsaas.timeout_seconds', 12))
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'X-AlmaPet-Signature' => $signature,
                    'X-PetPass-Signature' => $signature,
                ])
                ->withBody($body, 'application/json')
                ->post($url);

            if (! $response->successful()) {
                Log::warning('AlmaPet webhook failed', [
                    'event' => $event,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $e) {
            Log::error('AlmaPet webhook exception', [
                'event' => $event,
                'message' => $e->getMessage(),
            ]);
        }
    }
}

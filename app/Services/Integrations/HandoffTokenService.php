<?php

namespace App\Services\Integrations;

use App\Models\HandoffToken;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class HandoffTokenService
{
    /**
     * @param  array<string, mixed>  $payload
     * @return array{token: string, url: string, expires_at: string}
     */
    public function issue(array $payload): array
    {
        $microchip = preg_replace('/\D+/', '', (string) ($payload['microchip'] ?? '')) ?? '';
        if (strlen($microchip) < 9 || strlen($microchip) > 20) {
            throw ValidationException::withMessages([
                'microchip' => 'Microchip inválido.',
            ]);
        }

        $tenantId = (string) ($payload['vetsaas_tenant_id'] ?? '');
        $pacienteId = (string) ($payload['vetsaas_paciente_id'] ?? '');
        if ($tenantId === '' || $pacienteId === '') {
            throw ValidationException::withMessages([
                'vetsaas_tenant_id' => 'Faltan identificadores VetSaaS.',
            ]);
        }

        $plain = Str::random(48);
        $ttl = max(5, (int) config('vetsaas.handoff_ttl_minutes', 30));

        $payload['microchip'] = $microchip;

        HandoffToken::query()->create([
            'token_hash' => hash('sha256', $plain),
            'payload' => $payload,
            'expires_at' => now()->addMinutes($ttl),
            'vetsaas_tenant_id' => $tenantId,
            'vetsaas_paciente_id' => $pacienteId,
        ]);

        $url = url('/handoff?token='.$plain);

        return [
            'token' => $plain,
            'url' => $url,
            'expires_at' => now()->addMinutes($ttl)->toIso8601String(),
        ];
    }

    public function findConsumable(string $plainToken): ?HandoffToken
    {
        if ($plainToken === '') {
            return null;
        }

        $row = HandoffToken::query()
            ->where('token_hash', hash('sha256', $plainToken))
            ->first();

        if ($row === null || ! $row->isConsumable()) {
            return null;
        }

        return $row;
    }

    public function markUsed(HandoffToken $token): void
    {
        $token->forceFill(['used_at' => now()])->save();
    }
}

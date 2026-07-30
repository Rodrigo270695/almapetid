<?php

namespace App\Services\Integrations\Concerns;

use App\Exceptions\ApiPeruConsultaException;

trait FallsBackToApisunatLookup
{
    /**
     * @param  callable(): array<string, mixed>  $apiPeruFetch
     * @param  callable(): array<string, mixed>  $apisunatFetch
     * @return array<string, mixed>
     */
    private function consultarConFallbackApisunat(callable $apiPeruFetch, callable $apisunatFetch): array
    {
        try {
            return $apiPeruFetch();
        } catch (ApiPeruConsultaException $e) {
            /** @var \App\Services\Integrations\ApisunatLookupService $lookup */
            $lookup = $this->apisunatLookup;
            if (! $lookup->isConfigured() || ! $this->shouldFallbackToApisunat($e)) {
                throw $e;
            }

            return $apisunatFetch();
        }
    }

    private function shouldFallbackToApisunat(ApiPeruConsultaException $e): bool
    {
        return in_array($e->codeKey(), [
            'rate_limit',
            'service_unavailable',
            'api_error',
            'not_configured',
        ], true);
    }
}

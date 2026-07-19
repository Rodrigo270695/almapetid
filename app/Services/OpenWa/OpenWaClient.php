<?php

namespace App\Services\OpenWa;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Cliente HTTP para OpenWA (sesión plataforma AlmaPet).
 *
 * @see https://www.open-wa.org/
 */
final class OpenWaClient
{
    public function isConfigured(): bool
    {
        return (bool) config('openwa.enabled')
            && filled(config('openwa.api_key'))
            && filled(config('openwa.api_url'));
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listSessions(): array
    {
        $response = $this->request('get', '/api/sessions');

        if (! is_array($response)) {
            return [];
        }

        // Algunas APIs envuelven en { sessions: [...] }
        if (isset($response['sessions']) && is_array($response['sessions'])) {
            $response = $response['sessions'];
        }

        return array_values(array_filter($response, 'is_array'));
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findSessionByName(string $name): ?array
    {
        foreach ($this->listSessions() as $session) {
            if (($session['name'] ?? null) === $name) {
                return $session;
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    public function createSession(string $name): array
    {
        $response = $this->request('post', '/api/sessions', [
            'name' => $name,
            'config' => ['autoReconnect' => true],
        ]);

        if (! is_array($response)) {
            throw new RuntimeException('OpenWA no devolvió sesión al crear.');
        }

        return $response;
    }

    /**
     * @return array<string, mixed>
     */
    public function getSession(string $sessionId): array
    {
        $response = $this->request('get', '/api/sessions/'.$sessionId);

        if (! is_array($response)) {
            throw new RuntimeException('Sesión OpenWA no encontrada: '.$sessionId);
        }

        return $response;
    }

    /**
     * @return array<string, mixed>
     */
    public function startSession(string $sessionId): array
    {
        $response = $this->request('post', '/api/sessions/'.$sessionId.'/start');

        if (! is_array($response)) {
            throw new RuntimeException('OpenWA no pudo iniciar la sesión.');
        }

        return $response;
    }

    /**
     * @return array<string, mixed>
     */
    public function getQrCode(string $sessionId): array
    {
        $response = $this->request('get', '/api/sessions/'.$sessionId.'/qr');

        if (! is_array($response)) {
            throw new RuntimeException('OpenWA no devolvió código QR.');
        }

        return $response;
    }

    /**
     * @return array<string, mixed>
     */
    public function stopSession(string $sessionId): array
    {
        $response = $this->request('post', '/api/sessions/'.$sessionId.'/stop');

        if (! is_array($response)) {
            throw new RuntimeException('OpenWA no confirmó la desconexión de WhatsApp.');
        }

        return $response;
    }

    /**
     * @return array<string, mixed>
     */
    public function sendText(string $sessionId, string $chatId, string $text): array
    {
        $response = $this->request('post', '/api/sessions/'.$sessionId.'/messages/send-text', [
            'chatId' => $chatId,
            'text' => $text,
        ]);

        if (! is_array($response)) {
            throw new RuntimeException('OpenWA no confirmó el envío del mensaje.');
        }

        return $response;
    }

    /**
     * @param  array<string, mixed>|null  $body
     * @return array<string, mixed>|list<array<string, mixed>>|null
     */
    private function request(string $method, string $path, ?array $body = null): mixed
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('OpenWA no está configurado (OPENWA_ENABLED / API_URL / API_KEY).');
        }

        $apiKey = trim((string) config('openwa.api_key', ''));
        $url = rtrim((string) config('openwa.api_url'), '/').$path;

        try {
            $pending = Http::timeout((int) config('openwa.timeout_seconds', 30))
                ->withHeaders(['X-API-Key' => $apiKey])
                ->acceptJson();

            $response = $method === 'get'
                ? $pending->get($url)
                : $pending->{$method}($url, $body ?? []);
        } catch (\Throwable $e) {
            Log::warning('OpenWA request failed', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);
            throw new RuntimeException('Error al contactar OpenWA: '.$e->getMessage(), 0, $e);
        }

        if (! $response->successful()) {
            Log::warning('OpenWA HTTP error', [
                'path' => $path,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new RuntimeException('OpenWA HTTP '.$response->status());
        }

        $json = $response->json();

        if (is_array($json) && array_key_exists('data', $json) && is_array($json['data'])) {
            return $json['data'];
        }

        return $json;
    }
}

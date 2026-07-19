<?php

namespace App\Services\Alerts;

use App\Models\Owner;
use App\Models\User;
use App\Services\OpenWa\PlatformWhatsAppMessenger;
use App\Services\Push\PushNotificationService;
use App\Support\Auth\Roles;
use App\Support\WhatsApp\WhatsAppChatId;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class AlertDispatchService
{
    public function __construct(
        private readonly PushNotificationService $push,
        private readonly PlatformWhatsAppMessenger $whatsapp,
    ) {}

    /**
     * @param  array{
     *     channels: list<string>,
     *     audience: string,
     *     title: string,
     *     body: string,
     *     url?: string|null,
     *     test_phone?: string|null
     * }  $data
     * @return array{push_sent: int, whatsapp_sent: int, whatsapp_failed: int, errors: list<string>}
     */
    public function dispatch(array $data): array
    {
        $channels = $data['channels'];
        $title = trim($data['title']);
        $body = trim($data['body']);
        $url = filled($data['url'] ?? null) ? (string) $data['url'] : '/';
        $audience = $data['audience'];

        $result = [
            'push_sent' => 0,
            'whatsapp_sent' => 0,
            'whatsapp_failed' => 0,
            'errors' => [],
        ];

        if (in_array('push', $channels, true)) {
            $users = $this->resolvePushUsers($audience);
            if ($users->isEmpty()) {
                $result['errors'][] = 'No hay destinatarios push para esa audiencia.';
            } else {
                $this->push->sendToUsers($users, [
                    'title' => $title,
                    'body' => $body,
                    'url' => $url,
                    'tag' => 'platform-alert-'.now()->timestamp,
                ]);
                $result['push_sent'] = $users->count();
            }
        }

        if (in_array('whatsapp', $channels, true)) {
            if (! $this->whatsapp->isReady()) {
                $result['errors'][] = 'WhatsApp de plataforma no está conectado. Escanea el QR en esta página.';
            } else {
                $phones = $this->resolveWhatsAppPhones($audience, $data['test_phone'] ?? null);
                if ($phones->isEmpty()) {
                    $result['errors'][] = 'No hay teléfonos WhatsApp para esa audiencia.';
                } else {
                    $text = "*{$title}*\n\n{$body}".($url !== '/' ? "\n\n".url($url) : '');
                    $waResult = $this->sendWhatsAppBatch($phones, $text);
                    $result['whatsapp_sent'] = $waResult['sent'];
                    $result['whatsapp_failed'] = $waResult['failed'];
                    $result['errors'] = array_merge($result['errors'], $waResult['errors']);
                }
            }
        }

        return $result;
    }

    /**
     * @return Collection<int, User>
     */
    private function resolvePushUsers(string $audience): Collection
    {
        return match ($audience) {
            'owners' => User::role(Roles::OWNER)->get(),
            'clinic_staff' => User::role([Roles::ORG_ADMIN, Roles::CLINIC_STAFF])->get(),
            'platform_admins' => User::role(Roles::PLATFORM_ADMIN)->get(),
            'test' => collect(),
            default => collect(),
        };
    }

    /**
     * @return Collection<int, string>
     */
    private function resolveWhatsAppPhones(string $audience, ?string $testPhone): Collection
    {
        if ($audience === 'test') {
            return filled($testPhone) ? collect([trim($testPhone)]) : collect();
        }

        if ($audience === 'owners') {
            return Owner::query()
                ->whereNotNull('phone')
                ->where('phone', '!=', '')
                ->pluck('phone')
                ->map(fn ($p) => trim((string) $p))
                ->filter()
                ->unique()
                ->values();
        }

        if ($audience === 'clinic_staff') {
            return User::role([Roles::ORG_ADMIN, Roles::CLINIC_STAFF])
                ->whereNotNull('phone')
                ->where('phone', '!=', '')
                ->pluck('phone')
                ->map(fn ($p) => trim((string) $p))
                ->filter()
                ->unique()
                ->values();
        }

        if ($audience === 'platform_admins') {
            return User::role(Roles::PLATFORM_ADMIN)
                ->whereNotNull('phone')
                ->where('phone', '!=', '')
                ->pluck('phone')
                ->map(fn ($p) => trim((string) $p))
                ->filter()
                ->unique()
                ->values();
        }

        return collect();
    }

    /**
     * @param  Collection<int, string>  $phones
     * @return array{sent: int, failed: int, errors: list<string>}
     */
    private function sendWhatsAppBatch(Collection $phones, string $text): array
    {
        $sent = 0;
        $failed = 0;
        $errors = [];

        foreach ($phones as $phone) {
            try {
                $chatId = WhatsAppChatId::fromPhone($phone);
                if ($chatId === null) {
                    throw new \RuntimeException('Teléfono inválido');
                }
                $this->whatsapp->sendText($chatId, $text);
                $sent++;
            } catch (\Throwable $e) {
                $failed++;
                $errors[] = $phone.': '.$e->getMessage();
                Log::warning('WhatsApp alert failed', [
                    'phone' => $phone,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return compact('sent', 'failed', 'errors');
    }
}

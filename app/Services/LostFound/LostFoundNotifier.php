<?php

namespace App\Services\LostFound;

use App\Models\ChipRegistration;
use App\Models\FoundReport;
use App\Models\LostReport;
use App\Models\PlatformWhatsAppSession;
use App\Models\User;
use App\Services\OpenWa\PlatformWhatsAppMessenger;
use App\Services\Push\PushNotificationService;
use App\Support\WhatsApp\WhatsAppChatId;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Notificaciones de perdido / hallazgo / recuperada (WhatsApp + Web Push).
 */
final class LostFoundNotifier
{
    public function __construct(
        private readonly PlatformWhatsAppMessenger $whatsapp,
        private readonly PushNotificationService $push,
    ) {}

    public function notifyDeclaredLost(ChipRegistration $registration, LostReport $report): void
    {
        $registration->loadMissing(['animal', 'organization']);

        $animalName = $registration->animal?->name ?? 'una mascota';
        $city = $report->last_seen_city ?: ($report->distrito ?: '—');
        $zone = $report->last_seen_zone;
        $code = $registration->public_code;
        $profileUrl = url('/p/'.$code);
        $wallUrl = url('/perdidos');

        $lines = [
            '*Mascota declarada perdida*',
            '',
            "{$animalName} figura como *PERDIDA* en AlmaPet ID.",
            "Zona: {$city}".($zone ? " ({$zone})" : ''),
            "Código: {$code}",
        ];

        if (filled($report->public_notes)) {
            $lines[] = 'Notas: '.$report->public_notes;
        }

        $lines[] = '';
        $lines[] = "Perfil: {$profileUrl}";
        $lines[] = "Muro de perdidos: {$wallUrl}";

        $title = 'Mascota declarada perdida';
        $body = "{$animalName} figura como PERDIDA en AlmaPet ID ({$city}).";
        $url = $registration->animal_id
            ? '/animals/'.$registration->animal_id
            : '/p/'.$code;

        $this->dispatch(
            registration: $registration,
            event: 'declared_lost',
            whatsappText: implode("\n", $lines),
            pushTitle: $title,
            pushBody: $body,
            pushUrl: $url,
            pushTag: 'lost-'.$report->id,
        );
    }

    public function notifyFound(ChipRegistration $registration, FoundReport $found): void
    {
        $registration->loadMissing(['animal']);

        $animalName = $registration->animal?->name ?? 'tu mascota';
        $animalId = $registration->animal_id;
        $detailUrl = $animalId !== null
            ? url('/animals/'.$animalId)
            : url('/p/'.$registration->public_code);
        $pushUrl = $animalId !== null
            ? '/animals/'.$animalId
            : '/p/'.$registration->public_code;

        $lines = [
            '*¡Posible hallazgo!*',
            '',
            "Alguien reportó haber encontrado a *{$animalName}*.",
            'Reportero: '.$found->reporter_name,
        ];

        if (filled($found->reporter_phone)) {
            $lines[] = 'Tel. reportero: '.$found->reporter_phone;
        }

        if (filled($found->reporter_email)) {
            $lines[] = 'Email reportero: '.$found->reporter_email;
        }

        $place = collect([$found->zone, $found->city])->filter()->implode(' · ');
        if ($place !== '') {
            $lines[] = "Zona del hallazgo: {$place}";
        }

        $lines[] = '';
        $lines[] = 'Mensaje:';
        $lines[] = $found->message;
        $lines[] = '';
        $lines[] = "Revisa el detalle: {$detailUrl}";

        $this->dispatch(
            registration: $registration,
            event: 'found',
            whatsappText: implode("\n", $lines),
            pushTitle: '¡Posible hallazgo!',
            pushBody: "Alguien reportó haber encontrado a {$animalName}.",
            pushUrl: $pushUrl,
            pushTag: 'found-report-'.$found->id,
        );
    }

    public function notifyRecovered(ChipRegistration $registration): void
    {
        $registration->loadMissing(['animal']);

        $animalName = $registration->animal?->name ?? 'la mascota';
        $code = $registration->public_code;
        $profileUrl = url('/p/'.$code);
        $pushUrl = $registration->animal_id
            ? '/animals/'.$registration->animal_id
            : '/p/'.$code;

        $text = implode("\n", [
            '*Mascota recuperada*',
            '',
            "{$animalName} volvió a estado *activo* en AlmaPet ID.",
            "Código: {$code}",
            '',
            "Perfil: {$profileUrl}",
        ]);

        $this->dispatch(
            registration: $registration,
            event: 'recovered',
            whatsappText: $text,
            pushTitle: 'Mascota recuperada',
            pushBody: "{$animalName} volvió a estado activo en AlmaPet ID.",
            pushUrl: $pushUrl,
            pushTag: 'recovered-'.$registration->id.'-'.now()->timestamp,
        );
    }

    private function dispatch(
        ChipRegistration $registration,
        string $event,
        string $whatsappText,
        string $pushTitle,
        string $pushBody,
        string $pushUrl,
        string $pushTag,
    ): void {
        $users = $this->recipientUsers($registration);
        $pushSent = $this->push->sendToUsers($users, [
            'title' => $pushTitle,
            'body' => $pushBody,
            'url' => $pushUrl,
            'tag' => $pushTag,
        ]);

        $wa = $this->sendWhatsApp($registration, $whatsappText);

        Log::info('Lost/found notification dispatched', [
            'event' => $event,
            'registration_id' => $registration->id,
            'push_users' => $users->pluck('id')->all(),
            'push_sent' => $pushSent,
            'whatsapp_ready' => $wa['ready'],
            'whatsapp_sent' => $wa['sent'],
            'whatsapp_failed' => $wa['failed'],
            'whatsapp_targets' => $wa['targets'],
        ]);
    }

    /**
     * @return Collection<int, User>
     */
    private function recipientUsers(ChipRegistration $registration): Collection
    {
        $registration->loadMissing(['animal.owner.user', 'organization.users']);

        $users = collect();

        $ownerUser = $registration->animal?->owner?->user;
        if ($ownerUser instanceof User) {
            $users->push($ownerUser);
        }

        $orgUsers = $registration->organization?->users;
        if ($orgUsers !== null) {
            $users = $users->merge($orgUsers);
        }

        return $users->unique('id')->values();
    }

    /**
     * @return array{ready: bool, sent: int, failed: int, targets: list<string>}
     */
    private function sendWhatsApp(ChipRegistration $registration, string $text): array
    {
        $result = [
            'ready' => false,
            'sent' => 0,
            'failed' => 0,
            'targets' => [],
        ];

        if (! $this->whatsapp->isReady()) {
            Log::warning('Lost/found WhatsApp skipped: platform session not ready', [
                'registration_id' => $registration->id,
            ]);

            return $result;
        }

        $result['ready'] = true;
        $phones = $this->recipientPhones($registration);

        if ($phones->isEmpty()) {
            Log::warning('Lost/found WhatsApp skipped: no recipient phones', [
                'registration_id' => $registration->id,
            ]);

            return $result;
        }

        $platformDigits = $this->platformSessionDigits();

        foreach ($phones as $phone) {
            $chatId = WhatsAppChatId::fromPhone($phone);
            if ($chatId === null) {
                $result['failed']++;
                continue;
            }

            $digits = $this->digitsOnly($phone);
            $result['targets'][] = $digits;

            try {
                $this->whatsapp->sendText($chatId, $text);
                $result['sent']++;

                if ($platformDigits !== null && $digits === $platformDigits) {
                    Log::info('Lost/found WhatsApp sent to platform self-number', [
                        'phone' => $digits,
                        'registration_id' => $registration->id,
                        'note' => 'WhatsApp may not notify the same linked device; clinic/other phones still notified.',
                    ]);
                }
            } catch (Throwable $e) {
                $result['failed']++;
                Log::warning('Lost/found WhatsApp failed', [
                    'phone' => $digits,
                    'registration_id' => $registration->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $result;
    }

    /**
     * @return Collection<int, string>
     */
    private function recipientPhones(ChipRegistration $registration): Collection
    {
        $registration->loadMissing(['animal.owner.user', 'organization.users']);

        $owner = $registration->animal?->owner;

        $raw = collect([
            $owner?->phone,
            $owner?->user?->phone,
            $registration->organization?->contact_phone,
        ]);

        $orgUsers = $registration->organization?->users;
        if ($orgUsers !== null) {
            $raw = $raw->merge($orgUsers->pluck('phone'));
        }

        return $raw
            ->map(fn ($p) => is_string($p) ? trim($p) : '')
            ->filter()
            ->unique(fn (string $phone): string => $this->digitsOnly($phone))
            ->values();
    }

    private function platformSessionDigits(): ?string
    {
        $phone = PlatformWhatsAppSession::query()
            ->where('status', PlatformWhatsAppSession::STATUS_READY)
            ->value('phone');

        if (! is_string($phone) || trim($phone) === '') {
            return null;
        }

        $digits = $this->digitsOnly($phone);

        return $digits !== '' ? $digits : null;
    }

    private function digitsOnly(string $phone): string
    {
        $digits = preg_replace('/\D+/', '', $phone) ?? '';

        if (strlen($digits) === 9 && str_starts_with($digits, '9')) {
            return '51'.$digits;
        }

        if (str_starts_with($digits, '0') && strlen($digits) === 10) {
            return '51'.substr($digits, 1);
        }

        return $digits;
    }
}

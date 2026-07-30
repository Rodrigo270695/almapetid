<?php

namespace App\Services\Clinics;

use App\Models\ChipRegistration;
use App\Models\Plan;
use App\Services\Integrations\HandoffRegistrationService;
use App\Services\OpenWa\PlatformWhatsAppMessenger;
use App\Support\RegistrationPricing;
use App\Support\WhatsApp\WhatsAppChatId;
use Illuminate\Support\Facades\Log;
use Throwable;

final class ClinicOwnerActivationNotifier
{
    public function __construct(
        private readonly PlatformWhatsAppMessenger $whatsapp,
        private readonly HandoffRegistrationService $handoff,
    ) {}

    public function buildMessage(ChipRegistration $registration): string
    {
        $registration->loadMissing(['animal.owner', 'organization']);

        $plan = Plan::query()
            ->where('active', true)
            ->where('billing_period', Plan::PERIOD_REGISTRATION)
            ->orderByDesc('is_default')
            ->first();

        $pricing = $plan !== null
            ? RegistrationPricing::forActivation($registration, $plan)
            : [
                'amount' => (float) config('almapet.clinic_external_digital_amount', 20),
                'physical_amount' => (float) config('almapet.physical_carnet_amount', 30),
            ];

        $petName = (string) ($registration->animal?->name ?: 'tu mascota');
        $clinicName = (string) ($registration->organization?->name ?: 'tu clínica');
        $activateUrl = $this->handoff->activateUrl($registration);
        $support = (string) config('almapet.support_phone_display', '976 809 804');
        $digital = number_format((float) $pricing['amount'], 0, '.', '');
        $physical = number_format((float) $pricing['physical_amount'], 0, '.', '');

        return "🐾 *AlmaPet ID*\n"
            ."Tu mascota *{$petName}* ya fue registrada por *{$clinicName}*.\n\n"
            ."✅ Estado: pendiente de activación\n"
            ."💳 Carnet digital: *S/ {$digital}*\n"
            ."🪪 Carnet físico (opcional): *+S/ {$physical}*\n\n"
            ."👉 Activa aquí (crea tu cuenta o inicia sesión):\n"
            ."{$activateUrl}\n\n"
            ."🛟 Soporte AlmaPet: *{$support}*";
    }

    public function ownerWhatsAppUrl(ChipRegistration $registration): ?string
    {
        $phone = $registration->animal?->owner?->phone;
        $chatId = WhatsAppChatId::fromPhone($phone);
        if ($chatId === null) {
            return null;
        }

        $digits = str_replace('@c.us', '', $chatId);
        $text = rawurlencode($this->buildMessage($registration));

        return "https://wa.me/{$digits}?text={$text}";
    }

    /**
     * @return array{sent: bool, error: string|null, whatsapp_url: string|null}
     */
    public function notify(ChipRegistration $registration): array
    {
        $url = $this->ownerWhatsAppUrl($registration);
        $chatId = WhatsAppChatId::fromPhone($registration->animal?->owner?->phone);

        if ($chatId === null) {
            return [
                'sent' => false,
                'error' => 'El propietario no tiene un teléfono válido para WhatsApp.',
                'whatsapp_url' => null,
            ];
        }

        if (! $this->whatsapp->isReady()) {
            return [
                'sent' => false,
                'error' => 'WhatsApp de plataforma no está conectado. Usa el enlace manual.',
                'whatsapp_url' => $url,
            ];
        }

        try {
            $this->whatsapp->sendText($chatId, $this->buildMessage($registration));

            return [
                'sent' => true,
                'error' => null,
                'whatsapp_url' => $url,
            ];
        } catch (Throwable $e) {
            Log::warning('Clinic owner activation WhatsApp failed', [
                'registration_id' => $registration->id,
                'error' => $e->getMessage(),
            ]);

            return [
                'sent' => false,
                'error' => $e->getMessage(),
                'whatsapp_url' => $url,
            ];
        }
    }
}

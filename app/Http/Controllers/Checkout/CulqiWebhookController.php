<?php

namespace App\Http\Controllers\Checkout;

use App\Http\Controllers\Controller;
use App\Models\RegistrationPayment;
use App\Models\WebhookEvent;
use App\Services\Payments\RegistrationPaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CulqiWebhookController extends Controller
{
    public function __construct(
        private readonly RegistrationPaymentService $payments,
    ) {}

    public function handle(Request $request): JsonResponse
    {
        if (! $this->passesBasicAuth($request)) {
            return response()->json(['ok' => false, 'message' => 'Unauthorized'], 401);
        }

        $payload = $request->all();
        $eventType = $this->resolveEventType($request, $payload);
        $gatewayEventId = $this->resolveGatewayEventId($request, $payload, $eventType);

        $event = WebhookEvent::query()->firstOrCreate(
            [
                'gateway' => 'culqi',
                'gateway_event_id' => $gatewayEventId,
            ],
            [
                'event_type' => $eventType,
                'payload' => $payload,
                'processed' => false,
                'attempts' => 0,
            ],
        );

        if (! $event->wasRecentlyCreated) {
            return response()->json(['ok' => true, 'duplicate' => true]);
        }

        try {
            $this->processChargeEvent($payload);
            $event->markProcessed();

            return response()->json(['ok' => true]);
        } catch (\Throwable $e) {
            $event->markFailed($e->getMessage());

            return response()->json(['ok' => false], 500);
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function processChargeEvent(array $payload): void
    {
        $chargeId = (string) data_get($payload, 'data.id', '');
        $outcomeType = strtolower((string) data_get($payload, 'data.outcome.type', ''));
        $paymentId = (string) data_get($payload, 'data.metadata.payment_id', '');

        if ($chargeId === '' || $paymentId === '') {
            return;
        }

        if ($outcomeType !== 'venta_exitosa') {
            if ($outcomeType !== '') {
                $payment = RegistrationPayment::query()->whereKey($paymentId)->first();
                if ($payment && $payment->status === RegistrationPayment::STATUS_PENDING) {
                    $this->payments->markFailed(
                        $payment,
                        (string) data_get($payload, 'data.outcome.user_message', 'Cobro fallido'),
                    );
                }
            }

            return;
        }

        $payment = RegistrationPayment::query()->whereKey($paymentId)->first();
        if (! $payment || $payment->status === RegistrationPayment::STATUS_PAID) {
            return;
        }

        $this->payments->markPaid($payment, $chargeId, data_get($payload, 'data', []));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolveEventType(Request $request, array $payload): string
    {
        $resource = strtolower((string) ($request->query('resource')
            ?: data_get($payload, 'resource')
            ?: data_get($payload, 'data.object')
            ?: 'unknown'));

        $action = strtolower((string) ($request->query('action')
            ?: data_get($payload, 'action')
            ?: data_get($payload, 'type')
            ?: 'unknown'));

        $result = strtolower((string) ($request->query('result')
            ?: data_get($payload, 'result')
            ?: data_get($payload, 'data.outcome.type')
            ?: 'unknown'));

        return trim($resource.'.'.$action.'.'.$result, '.');
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolveGatewayEventId(Request $request, array $payload, string $eventType): string
    {
        $candidate = (string) ($request->header('x-culqi-event-id')
            ?: data_get($payload, 'id')
            ?: data_get($payload, 'event_id')
            ?: data_get($payload, 'data.id')
            ?: '');

        if ($candidate !== '') {
            return $candidate;
        }

        return $eventType.':'.sha1((string) $request->getContent());
    }

    private function passesBasicAuth(Request $request): bool
    {
        $expectedUser = trim((string) config('culqi.webhook_basic_user'));
        $expectedPass = trim((string) config('culqi.webhook_basic_password'));

        if ($expectedUser === '' && $expectedPass === '') {
            return true;
        }

        $user = (string) ($request->getUser() ?? '');
        $pass = (string) ($request->getPassword() ?? '');

        return hash_equals($expectedUser, $user) && hash_equals($expectedPass, $pass);
    }
}

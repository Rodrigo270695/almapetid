<?php

namespace App\Services\Push;

use App\Models\CatalogSuggestion;
use App\Models\PushSubscription;
use App\Models\User;
use App\Support\Auth\Roles;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class PushNotificationService
{
    public function isConfigured(): bool
    {
        return filled(config('webpush.vapid.public_key'))
            && filled(config('webpush.vapid.private_key'));
    }

    public function notifyCatalogSuggestion(CatalogSuggestion $suggestion, ?User $except = null): void
    {
        $suggestion->loadMissing(['requestedBy:id,name,lastname', 'species:id,name']);

        $requester = $suggestion->requestedBy
            ? trim($suggestion->requestedBy->name.' '.($suggestion->requestedBy->lastname ?? ''))
            : 'Usuario';

        $isSpecies = $suggestion->type === CatalogSuggestion::TYPE_SPECIES;
        $label = $isSpecies ? 'especie' : 'raza';
        $context = $isSpecies
            ? $suggestion->name
            : $suggestion->name.($suggestion->species ? " ({$suggestion->species->name})" : '');

        $this->notifyRole(
            Roles::PLATFORM_ADMIN,
            [
                'title' => 'Nueva solicitud de catálogo',
                'body' => "{$requester} sugirió la {$label}: {$context}",
                'url' => '/platform/catalog',
                'tag' => "catalog-suggestion-{$suggestion->id}",
            ],
            $except,
        );
    }

    public function notifyCatalogDecision(CatalogSuggestion $suggestion, string $decision): void
    {
        $suggestion->loadMissing(['requestedBy', 'species:id,name']);

        $requester = $suggestion->requestedBy;
        if ($requester === null) {
            return;
        }

        $isSpecies = $suggestion->type === CatalogSuggestion::TYPE_SPECIES;
        $label = $isSpecies ? 'especie' : 'raza';
        $context = $isSpecies
            ? $suggestion->name
            : $suggestion->name.($suggestion->species ? " ({$suggestion->species->name})" : '');

        $approved = $decision === 'approved';

        $this->sendToUsers(collect([$requester]), [
            'title' => $approved
                ? 'Solicitud de catálogo aprobada'
                : 'Solicitud de catálogo rechazada',
            'body' => $approved
                ? "Tu {$label} «{$context}» fue aprobada y permanece en el catálogo."
                : "Tu {$label} «{$context}» fue rechazada y quedó desactivada.",
            'url' => '/animals',
            'tag' => "catalog-decision-{$suggestion->id}",
        ]);
    }

    /**
     * @param  array{title: string, body: string, url: string, tag: string}  $payload
     */
    public function notifyRole(string $role, array $payload, ?User $except = null): void
    {
        $users = User::role($role)->get();

        if ($except !== null) {
            $users = $users->reject(fn (User $user): bool => $user->id === $except->id);
        }

        $this->sendToUsers($users, $payload);
    }

    /**
     * @param  Collection<int, User>  $users
     * @param  array{title: string, body: string, url: string, tag: string}  $payload
     */
    public function sendToUsers(Collection $users, array $payload): void
    {
        if (! $this->isConfigured() || $users->isEmpty()) {
            return;
        }

        $subscriptions = PushSubscription::query()
            ->whereIn('user_id', $users->pluck('id')->all())
            ->get();

        if ($subscriptions->isEmpty()) {
            return;
        }

        $webPush = new WebPush([
            'VAPID' => [
                'subject' => (string) config('webpush.vapid.subject'),
                'publicKey' => (string) config('webpush.vapid.public_key'),
                'privateKey' => (string) config('webpush.vapid.private_key'),
            ],
        ]);

        $json = json_encode($payload, JSON_THROW_ON_ERROR);

        foreach ($subscriptions as $subscription) {
            $webPush->queueNotification(
                Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'publicKey' => $subscription->public_key,
                    'authToken' => $subscription->auth_token,
                    'contentEncoding' => $subscription->content_encoding,
                ]),
                $json,
            );
        }

        foreach ($webPush->flush() as $report) {
            if ($report->isSuccess()) {
                continue;
            }

            $endpoint = $report->getRequest()->getUri()->__toString();

            if ($report->isSubscriptionExpired()) {
                PushSubscription::query()
                    ->where('endpoint', $endpoint)
                    ->delete();
            }

            Log::warning('Web push delivery failed', [
                'endpoint' => $endpoint,
                'reason' => $report->getReason(),
            ]);
        }
    }
}

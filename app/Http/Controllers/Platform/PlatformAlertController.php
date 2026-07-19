<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Sponsor;
use App\Services\Alerts\AlertDispatchService;
use App\Services\Push\PushNotificationService;
use App\Support\OpenWa\PlatformWhatsAppPresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformAlertController extends Controller
{
    public function index(
        PlatformWhatsAppPresenter $whatsapp,
        PushNotificationService $push,
    ): Response {
        return Inertia::render('platform/alerts/index', [
            'whatsapp' => $whatsapp->present(),
            'pushConfigured' => $push->isConfigured(),
            'sponsors' => Sponsor::publicCatalog(),
        ]);
    }

    public function store(Request $request, AlertDispatchService $alerts): RedirectResponse
    {
        $data = $request->validate([
            'channels' => ['required', 'array', 'min:1'],
            'channels.*' => ['in:push,whatsapp'],
            'audience' => ['required', 'in:owners,clinic_staff,platform_admins,test'],
            'title' => ['required', 'string', 'max:120'],
            'body' => ['required', 'string', 'max:2000'],
            'url' => ['nullable', 'string', 'max:500'],
            'test_phone' => ['nullable', 'string', 'max:40'],
        ]);

        if ($data['audience'] === 'test' && in_array('whatsapp', $data['channels'], true) && blank($data['test_phone'] ?? null)) {
            return back()
                ->withErrors(['test_phone' => 'Indica un teléfono de prueba para WhatsApp.'])
                ->withInput();
        }

        if ($data['audience'] === 'test' && in_array('push', $data['channels'], true) && ! in_array('whatsapp', $data['channels'], true)) {
            return back()
                ->withErrors(['channels' => 'La audiencia «prueba» solo aplica a WhatsApp (usa un teléfono).'])
                ->withInput();
        }

        try {
            $result = $alerts->dispatch($data);
        } catch (\Throwable $e) {
            return back()
                ->withErrors(['body' => $e->getMessage()])
                ->withInput();
        }

        $parts = [];
        if ($result['push_sent'] > 0) {
            $parts[] = "Push: {$result['push_sent']}";
        }
        if ($result['whatsapp_sent'] > 0) {
            $parts[] = "WhatsApp: {$result['whatsapp_sent']}";
        }
        if ($result['whatsapp_failed'] > 0) {
            $parts[] = "WA fallidos: {$result['whatsapp_failed']}";
        }

        $message = $parts !== []
            ? 'Alerta enviada — '.implode(' · ', $parts)
            : 'No se envió a ningún destinatario.';

        if ($result['errors'] !== []) {
            return back()
                ->with('warning', $message.' '.implode(' ', array_slice($result['errors'], 0, 3)))
                ->withInput();
        }

        return back()->with('success', $message);
    }
}

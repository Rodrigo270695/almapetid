<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Services\Certificates\CertificatePdfService;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class CertificateController extends Controller
{
    /**
     * Visor HTML: el tenant ve el PDF embebido; descarga solo si pulsa el botón.
     */
    public function show(string $code, CertificatePdfService $certificates): InertiaResponse
    {
        $chip = $certificates->findByCode($code);
        abort_if($chip === null, 404);

        $chip->loadMissing(['animal.owner', 'organization']);

        return Inertia::render('public/certificate/show', [
            'code' => $chip->certificate_code,
            'public_code' => $chip->public_code,
            'animal_name' => $chip->animal?->name,
            'pdf_url' => route('public.certificate.pdf', $chip->certificate_code),
            'download_url' => route('public.certificate.download', $chip->certificate_code),
            'profile_url' => url('/p/'.$chip->public_code),
        ]);
    }

    public function pdf(string $code, CertificatePdfService $certificates): SymfonyResponse
    {
        $chip = $certificates->findByCode($code);
        abort_if($chip === null, 404);

        return $certificates->stream($chip);
    }

    public function download(string $code, CertificatePdfService $certificates): Response
    {
        $chip = $certificates->findByCode($code);
        abort_if($chip === null, 404);

        return $certificates->download($chip);
    }
}

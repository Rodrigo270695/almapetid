<?php

namespace App\Services\Certificates;

use App\Models\ChipRegistration;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CertificatePdfService
{
    public function findByCode(string $code): ?ChipRegistration
    {
        $upper = strtoupper(trim($code));

        return ChipRegistration::query()
            ->whereRaw('UPPER(certificate_code) = ?', [$upper])
            ->whereIn('status', [
                ChipRegistration::STATUS_ACTIVE,
                ChipRegistration::STATUS_LOST,
            ])
            ->with(['animal.owner', 'organization'])
            ->first();
    }

    public function download(ChipRegistration $chip): Response|StreamedResponse
    {
        $chip->loadMissing(['animal.owner', 'organization']);

        $profileUrl = url('/p/'.$chip->public_code);
        $qrPng = $this->qrPngDataUri($profileUrl);

        $pdf = Pdf::loadView('certificates.almapet', [
            'chip' => $chip,
            'animal' => $chip->animal,
            'owner' => $chip->animal?->owner,
            'organization' => $chip->organization,
            'profileUrl' => $profileUrl,
            'qrPng' => $qrPng,
            'issuedAt' => now('America/Lima'),
        ])->setPaper('a4', 'portrait');

        $filename = 'almapet-'.$chip->certificate_code.'.pdf';

        return $pdf->download($filename);
    }

    public function qrPngDataUri(string $url): string
    {
        $qr = new QrCode(data: $url);
        $result = (new PngWriter)->write($qr);

        return 'data:image/png;base64,'.base64_encode($result->getString());
    }
}

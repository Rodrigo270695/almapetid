<?php

namespace App\Services\Certificates;

use App\Models\ChipRegistration;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

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

    /**
     * PDF para ver en el navegador (no fuerza descarga).
     */
    public function stream(ChipRegistration $chip): SymfonyResponse
    {
        return $this->buildPdf($chip)->stream($this->filename($chip));
    }

    /**
     * PDF con descarga explícita (botón "Descargar").
     */
    public function download(ChipRegistration $chip): Response
    {
        $binary = $this->buildPdf($chip)->output();
        $filename = $this->filename($chip);

        return response($binary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
            'Content-Length' => (string) strlen($binary),
            'Cache-Control' => 'private, max-age=0, must-revalidate',
        ]);
    }

    private function buildPdf(ChipRegistration $chip)
    {
        $chip->loadMissing(['animal.owner', 'organization']);

        $profileUrl = url('/p/'.$chip->public_code);
        $qrPng = $this->qrPngDataUri($profileUrl);

        return Pdf::loadView('certificates.almapet', [
            'chip' => $chip,
            'animal' => $chip->animal,
            'owner' => $chip->animal?->owner,
            'organization' => $chip->organization,
            'profileUrl' => $profileUrl,
            'qrPng' => $qrPng,
            'issuedAt' => now('America/Lima'),
        ])->setPaper('a4', 'landscape');
    }

    private function filename(ChipRegistration $chip): string
    {
        return 'almapet-'.$chip->certificate_code.'.pdf';
    }

    public function qrPngDataUri(string $url): string
    {
        $qr = new QrCode(data: $url);
        $result = (new PngWriter)->write($qr);

        return 'data:image/png;base64,'.base64_encode($result->getString());
    }
}

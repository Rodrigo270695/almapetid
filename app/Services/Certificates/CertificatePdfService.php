<?php

namespace App\Services\Certificates;

use App\Models\ChipRegistration;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class CertificatePdfService
{
    /** ISO/IEC 7810 ID-1 (DNI Perú): 85,60 × 53,98 mm → puntos DomPDF (72 dpi). */
    private const ID1_WIDTH_PT = 242.65;

    private const ID1_HEIGHT_PT = 153.01;

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

        $issuedAt = $chip->registered_at ?? $chip->created_at ?? now();
        $expiresAt = $issuedAt->copy()->addYears(3);
        $profileUrl = url('/p/'.$chip->public_code);

        return Pdf::loadView('certificates.almapet', [
            'chip' => $chip,
            'animal' => $chip->animal,
            'owner' => $chip->animal?->owner,
            'organization' => $chip->organization,
            'profileUrl' => $profileUrl,
            'qrPng' => $this->qrPngDataUri($profileUrl),
            'logoDataUri' => $this->publicImageDataUri('brand/almapet-id-wordmark-sky.png'),
            'iconDataUri' => $this->publicImageDataUri('icon-192.png'),
            'photoDataUri' => $this->animalPhotoDataUri($chip),
            'issuedAt' => $issuedAt,
            'expiresAt' => $expiresAt,
            'nationality' => $this->nationalityLabel($chip->country_code),
            'sexLabel' => $this->sexLabel($chip->animal?->sex),
        ])->setPaper([0, 0, self::ID1_WIDTH_PT, self::ID1_HEIGHT_PT], 'portrait');
    }

    private function filename(ChipRegistration $chip): string
    {
        return 'almapet-carnet-'.$chip->certificate_code.'.pdf';
    }

    public function qrPngDataUri(string $url): string
    {
        $qr = new QrCode(data: $url);
        $result = (new PngWriter)->write($qr);

        return 'data:image/png;base64,'.base64_encode($result->getString());
    }

    private function publicImageDataUri(string $relativePath): ?string
    {
        $path = public_path($relativePath);
        if (! is_file($path)) {
            return null;
        }

        $mime = match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'png' => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            default => 'application/octet-stream',
        };

        $binary = file_get_contents($path);
        if ($binary === false) {
            return null;
        }

        return 'data:'.$mime.';base64,'.base64_encode($binary);
    }

    private function animalPhotoDataUri(ChipRegistration $chip): ?string
    {
        $path = $chip->animal?->photo_path;
        if (blank($path) || ! Storage::disk('public')->exists($path)) {
            return null;
        }

        $binary = Storage::disk('public')->get($path);
        if ($binary === null || $binary === '') {
            return null;
        }

        $ext = strtolower(pathinfo($path, PATHINFO_EXTENSION));
        $mime = match ($ext) {
            'png' => 'image/png',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            default => 'image/jpeg',
        };

        return 'data:'.$mime.';base64,'.base64_encode($binary);
    }

    private function nationalityLabel(?string $countryCode): string
    {
        $code = strtoupper(trim((string) $countryCode));
        if ($code === '' || $code === 'PE') {
            return 'PERU';
        }

        return match ($code) {
            'AR' => 'ARGENTINA',
            'BO' => 'BOLIVIANA',
            'CL' => 'CHILENA',
            'CO' => 'COLOMBIANA',
            'EC' => 'ECUATORIANA',
            'MX' => 'MEXICANA',
            'US' => 'ESTADOUNIDENSE',
            'ES' => 'ESPANOLA',
            default => $code,
        };
    }

    private function sexLabel(?string $sex): string
    {
        return match (strtoupper(trim((string) $sex))) {
            'M' => 'MACHO',
            'H', 'F' => 'HEMBRA',
            default => '—',
        };
    }
}

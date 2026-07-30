<?php

namespace App\Services\Certificates;

use App\Models\ChipRegistration;
use Barryvdh\DomPDF\Facade\Pdf;
use Endroid\QrCode\ErrorCorrectionLevel;
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

    public function stream(ChipRegistration $chip): SymfonyResponse
    {
        return $this->buildPdf($chip)->stream($this->filename($chip));
    }

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
            'logoDataUri' => $this->resizedPublicImage('brand/almapet-id-wordmark-sky.png', 320, 48),
            'iconDataUri' => $this->resizedPublicImage('icon-192.png', 48, 48),
            'photoDataUri' => $this->animalPhotoDataUri($chip),
            'issuedAt' => $issuedAt,
            'expiresAt' => $expiresAt,
            'nationality' => $this->nationalityLabel($chip->country_code),
            'sexLabel' => $this->sexLabel($chip->animal?->sex),
        ])
            ->setPaper([0, 0, self::ID1_WIDTH_PT, self::ID1_HEIGHT_PT], 'portrait')
            ->setOption('dpi', 72)
            ->setOption('defaultFont', 'DejaVu Sans')
            ->setOption('isHtml5ParserEnabled', true)
            ->setOption('isRemoteEnabled', false)
            ->setOption('isFontSubsettingEnabled', true);
    }

    private function filename(ChipRegistration $chip): string
    {
        return 'almapet-carnet-'.$chip->certificate_code.'.pdf';
    }

    public function qrPngDataUri(string $url): string
    {
        $qr = new QrCode(
            data: $url,
            errorCorrectionLevel: ErrorCorrectionLevel::Medium,
            size: 120,
            margin: 2,
        );
        $result = (new PngWriter)->write($qr);

        return 'data:image/png;base64,'.base64_encode($result->getString());
    }

    private function resizedPublicImage(string $relativePath, int $maxW, int $maxH): ?string
    {
        $path = public_path($relativePath);
        if (! is_file($path) || ! function_exists('imagecreatefromstring')) {
            return $this->fileToDataUri($path);
        }

        $binary = file_get_contents($path);
        if ($binary === false) {
            return null;
        }

        return $this->resizeBinaryToJpegDataUri($binary, $maxW, $maxH);
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

        return $this->resizeBinaryToJpegDataUri($binary, 140, 170);
    }

    private function resizeBinaryToJpegDataUri(string $binary, int $maxW, int $maxH): ?string
    {
        if (! function_exists('imagecreatefromstring')) {
            return 'data:image/jpeg;base64,'.base64_encode($binary);
        }

        $src = @imagecreatefromstring($binary);
        if ($src === false) {
            return null;
        }

        $sw = imagesx($src);
        $sh = imagesy($src);
        if ($sw < 1 || $sh < 1) {
            imagedestroy($src);

            return null;
        }

        $scale = min($maxW / $sw, $maxH / $sh, 1.0);
        $dw = max(1, (int) round($sw * $scale));
        $dh = max(1, (int) round($sh * $scale));

        $dst = imagecreatetruecolor($dw, $dh);
        $white = imagecolorallocate($dst, 255, 255, 255);
        imagefilledrectangle($dst, 0, 0, $dw, $dh, $white);
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $dw, $dh, $sw, $sh);
        imagedestroy($src);

        ob_start();
        imagejpeg($dst, null, 82);
        imagedestroy($dst);
        $jpeg = ob_get_clean();

        if (! is_string($jpeg) || $jpeg === '') {
            return null;
        }

        return 'data:image/jpeg;base64,'.base64_encode($jpeg);
    }

    private function fileToDataUri(?string $path): ?string
    {
        if ($path === null || ! is_file($path)) {
            return null;
        }

        $binary = file_get_contents($path);
        if ($binary === false) {
            return null;
        }

        $mime = match (strtolower(pathinfo($path, PATHINFO_EXTENSION))) {
            'png' => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'webp' => 'image/webp',
            default => 'image/png',
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

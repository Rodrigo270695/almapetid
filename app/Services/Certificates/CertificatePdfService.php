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
            'iconDataUri' => $this->brandIconDataUri(16, false),
            'iconBackDataUri' => $this->brandIconDataUri(56, false),
            'watermarkDataUri' => $this->brandIconDataUri(44, true),
            'photoDataUri' => $this->animalPhotoDataUri($chip),
            'issuedAt' => $issuedAt,
            'expiresAt' => $expiresAt,
            'nationality' => $this->nationalityLabel($chip->country_code),
            'nationalityCode' => $this->nationalityCode($chip->country_code),
            'sexLabel' => $this->sexLabel($chip->animal?->sex),
            'sexShort' => $this->sexShort($chip->animal?->sex),
        ])
            ->setPaper([0, 0, self::ID1_WIDTH_PT, self::ID1_HEIGHT_PT], 'portrait')
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
        // Tamaño intrínseco ~32px; el HTML fija width/height en pt (DomPDF default ~96dpi).
        $qr = new QrCode(
            data: $url,
            errorCorrectionLevel: ErrorCorrectionLevel::Medium,
            size: 48,
            margin: 0,
        );

        return 'data:image/png;base64,'.base64_encode((new PngWriter)->write($qr)->getString());
    }

    private function brandIconDataUri(int $size, bool $asWatermark): ?string
    {
        if (! function_exists('imagecreatefromstring')) {
            return $this->fileToDataUri(public_path('icon-192.png'));
        }

        $path = public_path('icon-192.png');
        if (! is_file($path)) {
            $path = public_path('logo.png');
        }
        if (! is_file($path)) {
            return null;
        }

        $binary = file_get_contents($path);
        if ($binary === false) {
            return null;
        }

        $src = @imagecreatefromstring($binary);
        if ($src === false) {
            return null;
        }

        $sw = imagesx($src);
        $sh = imagesy($src);
        $dst = imagecreatetruecolor($size, $size);
        $bgR = $asWatermark ? 231 : 255;
        $bgG = $asWatermark ? 243 : 255;
        $bgB = $asWatermark ? 249 : 255;
        $bg = imagecolorallocate($dst, $bgR, $bgG, $bgB);
        imagefilledrectangle($dst, 0, 0, $size, $size, $bg);

        $clean = imagecreatetruecolor($sw, $sh);
        imagecopy($clean, $src, 0, 0, 0, 0, $sw, $sh);
        imagedestroy($src);

        for ($y = 0; $y < $sh; $y++) {
            for ($x = 0; $x < $sw; $x++) {
                $rgb = imagecolorat($clean, $x, $y);
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                if ($r < 40 && $g < 40 && $b < 40) {
                    imagesetpixel($clean, $x, $y, imagecolorallocate($clean, $bgR, $bgG, $bgB));
                } elseif ($asWatermark) {
                    imagesetpixel(
                        $clean,
                        $x,
                        $y,
                        imagecolorallocate(
                            $clean,
                            (int) min(255, $r * 0.25 + 195),
                            (int) min(255, $g * 0.35 + 215),
                            (int) min(255, $b * 0.45 + 225),
                        ),
                    );
                }
            }
        }

        imagecopyresampled($dst, $clean, 0, 0, 0, 0, $size, $size, $sw, $sh);
        imagedestroy($clean);

        ob_start();
        imagejpeg($dst, null, $asWatermark ? 70 : 90);
        imagedestroy($dst);
        $jpeg = ob_get_clean();

        return is_string($jpeg) && $jpeg !== ''
            ? 'data:image/jpeg;base64,'.base64_encode($jpeg)
            : null;
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

        return $this->resizeBinaryToJpegDataUri($binary, 56, 66);
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
        imagefilledrectangle($dst, 0, 0, $dw, $dh, imagecolorallocate($dst, 255, 255, 255));
        imagecopyresampled($dst, $src, 0, 0, 0, 0, $dw, $dh, $sw, $sh);
        imagedestroy($src);

        ob_start();
        imagejpeg($dst, null, 84);
        imagedestroy($dst);
        $jpeg = ob_get_clean();

        return is_string($jpeg) && $jpeg !== ''
            ? 'data:image/jpeg;base64,'.base64_encode($jpeg)
            : null;
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
            default => 'image/png',
        };

        return 'data:'.$mime.';base64,'.base64_encode($binary);
    }

    private function nationalityLabel(?string $countryCode): string
    {
        $code = strtoupper(trim((string) $countryCode));

        return ($code === '' || $code === 'PE') ? 'PERU' : $code;
    }

    private function nationalityCode(?string $countryCode): string
    {
        $code = strtoupper(trim((string) $countryCode));

        return ($code === '' || $code === 'PE') ? 'PER' : substr($code, 0, 3);
    }

    private function sexLabel(?string $sex): string
    {
        return match (strtoupper(trim((string) $sex))) {
            'M' => 'MACHO',
            'H', 'F' => 'HEMBRA',
            default => '—',
        };
    }

    private function sexShort(?string $sex): string
    {
        return match (strtoupper(trim((string) $sex))) {
            'M' => 'M',
            'H', 'F' => 'H',
            default => '—',
        };
    }
}

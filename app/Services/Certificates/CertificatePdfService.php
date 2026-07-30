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

/**
 * Carnet digital AlmaPet ID — formato DNI Perú (ISO ID-1).
 * Anverso/reverso se componen con GD (ondas, marca de agua, tipografía).
 */
class CertificatePdfService
{
    private const ID1_WIDTH_PT = 242.65;

    private const ID1_HEIGHT_PT = 153.01;

    /** Píxeles del arte (≈ 96 dpi sobre ID-1). */
    private const W = 320;

    private const H = 202;

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

        $front = $this->composeFrontJpeg($chip, $issuedAt, $expiresAt, $profileUrl);
        $back = $this->composeBackJpeg($chip);

        return Pdf::loadView('certificates.almapet', [
            'frontDataUri' => 'data:image/jpeg;base64,'.base64_encode($front),
            'backDataUri' => 'data:image/jpeg;base64,'.base64_encode($back),
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

    // ─── Composición anverso ───────────────────────────────────────────

    private function composeFrontJpeg(
        ChipRegistration $chip,
        mixed $issuedAt,
        mixed $expiresAt,
        string $profileUrl,
    ): string {
        $img = imagecreatetruecolor(self::W, self::H);
        imagealphablending($img, true);
        $this->paintFrontBackground($img);

        // Marca de agua central (wordmark celeste grande)
        $this->blitWordmark($img, self::W / 2, (int) (self::H * 0.55), 240, 0.32, true);

        $animal = $chip->animal;
        $owner = $animal?->owner;
        $org = $chip->organization;

        $font = $this->fontRegular();
        $fontBold = $this->fontBold();

        $sky = imagecolorallocate($img, 3, 105, 161);      // #0369a1
        $ink = imagecolorallocate($img, 15, 23, 42);       // #0f172a
        $muted = imagecolorallocate($img, 71, 85, 105);    // #475569
        $red = imagecolorallocate($img, 185, 28, 28);      // caducidad
        $line = imagecolorallocate($img, 56, 189, 248);    // celeste

        // Header wordmark pequeño
        $this->blitWordmark($img, 72, 16, 118, 1.0, false);

        // Subtítulo
        if ($font) {
            imagettftext($img, 5.2, 0, 12, 33, $muted, $font, 'REGISTRO NACIONAL DE IDENTIFICACIÓN ANIMAL');
            imagettftext($img, 5.5, 0, 228, 14, $muted, $font, 'CÓDIGO');
            $code = (string) $chip->certificate_code;
            imagettftext($img, 7.5, 0, 218, 28, $sky, $fontBold ?: $font, $code);
        }

        // Línea institucional
        imagefilledrectangle($img, 12, 40, self::W - 12, 42, $line);
        imagefilledrectangle($img, (int) (self::W * 0.72), 40, self::W - 12, 42, imagecolorallocate($img, 245, 158, 11));

        // Foto
        $photoX = 14;
        $photoY = 50;
        $photoW = 68;
        $photoH = 82;
        $this->drawPhotoBox($img, $photoX, $photoY, $photoW, $photoH, $animal?->photo_path);

        // QR debajo de la foto
        $qrBin = $this->qrPngBinary($profileUrl, 52);
        if ($qrBin !== null) {
            $qr = @imagecreatefromstring($qrBin);
            if ($qr !== false) {
                $qw = 48;
                $qh = 48;
                imagecopyresampled($img, $qr, $photoX + 10, $photoY + $photoH + 4, 0, 0, $qw, $qh, imagesx($qr), imagesy($qr));
                imagedestroy($qr);
            }
        }

        if ($font) {
            imagettftext($img, 5.5, 0, $photoX + 8, $photoY + $photoH + 60, $muted, $font, (string) $chip->public_code);
        }

        // Datos (columna derecha, estilo DNI)
        $dx = 96;
        $dy = 52;
        $this->field($img, $font, $fontBold, $sky, $ink, $dx, $dy, 'Apellido del titular', mb_strtoupper((string) ($owner?->lastname ?: '—')));
        $this->field($img, $font, $fontBold, $sky, $ink, $dx, $dy + 28, 'Nombre de la mascota', mb_strtoupper((string) ($animal?->name ?? '—')));

        // Fila sexo / nac / nacimiento
        $rowY = $dy + 58;
        $this->field($img, $font, $fontBold, $sky, $ink, $dx, $rowY, 'Sexo', $this->sexShort($animal?->sex), 7.5);
        $this->field($img, $font, $fontBold, $sky, $ink, $dx + 48, $rowY, 'Nacionalidad', $this->nationalityCode($chip->country_code), 7.5);
        $this->drawMiniFlag($img, $dx + 48, $rowY + 20);
        $this->field(
            $img,
            $font,
            $fontBold,
            $sky,
            $ink,
            $dx + 120,
            $rowY,
            'Fecha de nacimiento',
            $animal?->birth_date?->format('d  m  Y') ?? '—',
            7.5,
        );

        $this->field(
            $img,
            $font,
            $fontBold,
            $sky,
            $ink,
            $dx,
            $rowY + 32,
            'Raza / especie',
            mb_strtoupper((string) ($animal?->breed ?: ($animal?->species ?? '—'))),
        );

        $this->field($img, $font, $fontBold, $sky, $ink, $dx, $rowY + 58, 'Fecha de emisión', $issuedAt->format('d  m  Y'), 7.5);
        $this->field($img, $font, $fontBold, $sky, $red, $dx + 110, $rowY + 58, 'Fecha de caducidad', $expiresAt->format('d  m  Y'), 7.5);

        // Footer
        imagefilledrectangle($img, 12, self::H - 18, self::W - 12, self::H - 17, imagecolorallocate($img, 186, 230, 253));
        if ($font) {
            $foot = sprintf(
                'Microchip %s  ·  Vigencia 3 años  ·  %s  ·  Formato DNI Perú 85,60 × 53,98 mm',
                (string) $chip->microchip,
                (string) ($org?->name ?? 'AlmaPet ID'),
            );
            imagettftext($img, 5, 0, 12, self::H - 7, $muted, $font, $foot);
        }

        // Franja lateral ámbar (detalle de seguridad)
        imagefilledrectangle($img, self::W - 5, 0, self::W - 1, self::H - 1, imagecolorallocate($img, 245, 158, 11));

        return $this->jpeg($img, 86);
    }

    // ─── Composición reverso ───────────────────────────────────────────

    private function composeBackJpeg(ChipRegistration $chip): string
    {
        $img = imagecreatetruecolor(self::W, self::H);
        imagealphablending($img, true);
        $this->paintBackBackground($img);

        // Wordmark centrado (protagonista del reverso)
        $this->blitWordmark($img, self::W / 2, (int) (self::H * 0.45), 220, 1.0, false);

        $font = $this->fontRegular();
        $skyDeep = imagecolorallocate($img, 7, 89, 133);

        if ($font) {
            $sub = 'IDENTIDAD DIGITAL ANIMAL · CARNET DIGITAL';
            $bbox = imagettfbbox(7, 0, $font, $sub);
            $tw = abs(($bbox[2] ?? 0) - ($bbox[0] ?? 0));
            imagettftext($img, 7, 0, (int) ((self::W - $tw) / 2), (int) (self::H * 0.68), $skyDeep, $font, $sub);

            $code = $chip->certificate_code.'  ·  '.$chip->public_code;
            $bbox = imagettfbbox(6.5, 0, $font, $code);
            $tw = abs(($bbox[2] ?? 0) - ($bbox[0] ?? 0));
            imagettftext($img, 6.5, 0, (int) ((self::W - $tw) / 2), (int) (self::H * 0.80), $skyDeep, $font, $code);
        }

        // Bandas superior/inferior tipo documento
        imagefilledrectangle($img, 0, 0, self::W, 10, imagecolorallocate($img, 14, 116, 144));
        imagefilledrectangle($img, 0, self::H - 10, self::W, self::H, imagecolorallocate($img, 56, 189, 248));

        return $this->jpeg($img, 86);
    }

    // ─── Fondos (olas / guilloche) ──────────────────────────────────────

    private function paintFrontBackground(\GdImage $img): void
    {
        $w = self::W;
        $h = self::H;

        // Degradé crema → blanco → celeste (estilo DNI)
        for ($y = 0; $y < $h; $y++) {
            $t = $y / max(1, $h - 1);
            if ($t < 0.45) {
                $u = $t / 0.45;
                $r = (int) (255 - $u * 8);
                $g = (int) (248 - $u * 4);
                $b = (int) (230 + $u * 10);
            } else {
                $u = ($t - 0.45) / 0.55;
                $r = (int) (247 - $u * 40);
                $g = (int) (244 - $u * 10);
                $b = (int) (240 + $u * 15);
            }
            $c = imagecolorallocate($img, $r, $g, $b);
            imageline($img, 0, $y, $w, $y, $c);
        }

        // Ondas / guilloche más densas (vida tipo DNI)
        for ($i = 0; $i < 36; $i++) {
            $phase = $i * 0.42;
            $amp = 5 + ($i % 6);
            $yBase = 18 + $i * 5;
            $col = imagecolorallocatealpha(
                $img,
                14 + ($i % 4) * 15,
                165 + ($i % 5) * 8,
                233,
                95 + ($i % 6) * 3,
            );
            for ($x = 0; $x < $w; $x++) {
                $yy = (int) ($yBase + sin($x * 0.04 + $phase) * $amp + sin($x * 0.11 + $phase * 1.7) * 2.5);
                if ($yy >= 0 && $yy < $h) {
                    imagesetpixel($img, $x, $yy, $col);
                    if ($yy + 1 < $h) {
                        imagesetpixel($img, $x, $yy + 1, $col);
                    }
                }
            }
        }

        // Curvas diagonales suaves (derecha)
        for ($i = 0; $i < 12; $i++) {
            $col = imagecolorallocatealpha($img, 125, 211, 252, 105);
            for ($t = 0; $t < 200; $t++) {
                $x = (int) ($w * 0.55 + $t * 0.9);
                $y = (int) (20 + $i * 12 + sin($t * 0.08) * 18);
                if ($x >= 0 && $x < $w && $y >= 0 && $y < $h) {
                    imagesetpixel($img, $x, $y, $col);
                }
            }
        }
    }

    private function paintBackBackground(\GdImage $img): void
    {
        $w = self::W;
        $h = self::H;

        // Base blanca → celeste
        for ($y = 0; $y < $h; $y++) {
            $t = $y / max(1, $h - 1);
            $r = (int) (255 - $t * 55);
            $g = (int) (255 - $t * 35);
            $b = (int) (255 - $t * 5);
            imageline($img, 0, $y, $w, $y, imagecolorallocate($img, $r, $g, $b));
        }

        // Olas densas blanco/celeste (reverso vivo)
        for ($i = 0; $i < 40; $i++) {
            $phase = $i * 0.55;
            $amp = 10 + ($i % 7);
            $yBase = 8 + $i * 5;
            $alpha = 90 + ($i % 6) * 5;
            $col = imagecolorallocatealpha($img, 14, 116, 144, $alpha);
            $col2 = imagecolorallocatealpha($img, 186, 230, 253, $alpha);
            for ($x = 0; $x < $w; $x++) {
                $yy = (int) ($yBase + sin($x * 0.035 + $phase) * $amp + cos($x * 0.09 + $phase) * 4);
                if ($yy >= 0 && $yy < $h) {
                    imagesetpixel($img, $x, $yy, $i % 2 === 0 ? $col : $col2);
                    if ($yy + 1 < $h) {
                        imagesetpixel($img, $x, $yy + 1, $i % 2 === 0 ? $col2 : $col);
                    }
                }
            }
        }

        // Círculos concéntricos suaves (centro)
        $cx = (int) ($w / 2);
        $cy = (int) ($h / 2);
        for ($r = 20; $r < 110; $r += 6) {
            $col = imagecolorallocatealpha($img, 56, 189, 248, 110);
            imageellipse($img, $cx, $cy, $r * 2, (int) ($r * 1.35), $col);
        }
    }

    // ─── Wordmark celeste ──────────────────────────────────────────────

    /**
     * Dibuja el wordmark AlmaPet (celeste) centrado en (cx, cy).
     *
     * @param  float  $opacity  0..1 (1 = sólido)
     */
    private function blitWordmark(\GdImage $canvas, int $cx, int $cy, int $targetW, float $opacity, bool $asWatermark): void
    {
        $mark = $this->loadCelesteWordmark();
        if ($mark === null) {
            return;
        }

        $sw = imagesx($mark);
        $sh = imagesy($mark);
        $tw = $targetW;
        $th = max(1, (int) round($sh * ($tw / max(1, $sw))));
        $dx = (int) ($cx - $tw / 2);
        $dy = (int) ($cy - $th / 2);

        $scaled = imagecreatetruecolor($tw, $th);
        imagealphablending($scaled, false);
        imagesavealpha($scaled, true);
        $transparent = imagecolorallocatealpha($scaled, 0, 0, 0, 127);
        imagefilledrectangle($scaled, 0, 0, $tw, $th, $transparent);
        imagealphablending($scaled, true);
        imagecopyresampled($scaled, $mark, 0, 0, 0, 0, $tw, $th, $sw, $sh);
        imagedestroy($mark);

        if ($asWatermark || $opacity < 0.99) {
            // Mezclar con el fondo del canvas (marca de agua)
            for ($y = 0; $y < $th; $y++) {
                for ($x = 0; $x < $tw; $x++) {
                    $rgba = imagecolorat($scaled, $x, $y);
                    $a = ($rgba & 0x7F000000) >> 24;
                    if ($a > 120) {
                        continue;
                    }
                    $sr = ($rgba >> 16) & 0xFF;
                    $sg = ($rgba >> 8) & 0xFF;
                    $sb = $rgba & 0xFF;
                    // Ignorar casi blancos
                    if ($sr > 245 && $sg > 245 && $sb > 245) {
                        continue;
                    }
                    $px = $dx + $x;
                    $py = $dy + $y;
                    if ($px < 0 || $py < 0 || $px >= self::W || $py >= self::H) {
                        continue;
                    }
                    $dst = imagecolorat($canvas, $px, $py);
                    $dr = ($dst >> 16) & 0xFF;
                    $dg = ($dst >> 8) & 0xFF;
                    $db = $dst & 0xFF;
                    $o = $opacity * (1 - $a / 127);
                    $nr = (int) ($dr * (1 - $o) + $sr * $o);
                    $ng = (int) ($dg * (1 - $o) + $sg * $o);
                    $nb = (int) ($db * (1 - $o) + $sb * $o);
                    imagesetpixel($canvas, $px, $py, imagecolorallocate($canvas, $nr, $ng, $nb));
                }
            }
            imagedestroy($scaled);

            return;
        }

        // Sólido: también mezclar (conserva transparencia del PNG)
        for ($y = 0; $y < $th; $y++) {
            for ($x = 0; $x < $tw; $x++) {
                $rgba = imagecolorat($scaled, $x, $y);
                $a = ($rgba & 0x7F000000) >> 24;
                if ($a > 110) {
                    continue;
                }
                $sr = ($rgba >> 16) & 0xFF;
                $sg = ($rgba >> 8) & 0xFF;
                $sb = $rgba & 0xFF;
                if ($sr > 248 && $sg > 248 && $sb > 248) {
                    continue;
                }
                $px = $dx + $x;
                $py = $dy + $y;
                if ($px < 0 || $py < 0 || $px >= self::W || $py >= self::H) {
                    continue;
                }
                $dst = imagecolorat($canvas, $px, $py);
                $dr = ($dst >> 16) & 0xFF;
                $dg = ($dst >> 8) & 0xFF;
                $db = $dst & 0xFF;
                $o = 1 - $a / 127;
                $nr = (int) ($dr * (1 - $o) + $sr * $o);
                $ng = (int) ($dg * (1 - $o) + $sg * $o);
                $nb = (int) ($db * (1 - $o) + $sb * $o);
                imagesetpixel($canvas, $px, $py, imagecolorallocate($canvas, $nr, $ng, $nb));
            }
        }
        imagedestroy($scaled);
    }

    /**
     * Carga wordmark y lo fuerza a celeste sobre fondo transparente/blanco.
     */
    private function loadCelesteWordmark(): ?\GdImage
    {
        $path = public_path('brand/almapet-id-wordmark-sky.png');
        if (! is_file($path)) {
            $path = public_path('brand/almapet-id-wordmark.png');
        }
        if (! is_file($path)) {
            return null;
        }

        $bin = file_get_contents($path);
        if ($bin === false) {
            return null;
        }

        $src = @imagecreatefromstring($bin);
        if ($src === false) {
            return null;
        }

        $sw = imagesx($src);
        $sh = imagesy($src);
        $out = imagecreatetruecolor($sw, $sh);
        imagealphablending($out, false);
        imagesavealpha($out, true);
        $transparent = imagecolorallocatealpha($out, 255, 255, 255, 127);
        imagefilledrectangle($out, 0, 0, $sw, $sh, $transparent);

        // Celeste marca: #38BDF8 (letras) — siluetas internas quedan transparentes (se ve el fondo)
        $celesteR = 56;
        $celesteG = 189;
        $celesteB = 248;
        $celesteDeepR = 14;
        $celesteDeepG = 165;
        $celesteDeepB = 233;

        for ($y = 0; $y < $sh; $y++) {
            for ($x = 0; $x < $sw; $x++) {
                $rgb = imagecolorat($src, $x, $y);
                $a = ($rgb & 0x7F000000) >> 24;
                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                $lum = 0.299 * $r + 0.587 * $g + 0.114 * $b;

                // Fondo negro / alpha → transparente
                if ($a > 100 || ($r < 45 && $g < 45 && $b < 45)) {
                    imagesetpixel($out, $x, $y, $transparent);

                    continue;
                }

                // Siluetas internas muy oscuras → transparentes (efecto stencil)
                if ($lum < 85) {
                    imagesetpixel($out, $x, $y, $transparent);

                    continue;
                }

                // Cuerpo de letra (teal/cian/gris medio) → celeste
                if ($lum < 230) {
                    // Antialias: mezclar celeste según luminosidad
                    $t = max(0.0, min(1.0, ($lum - 85) / 145));
                    $nr = (int) ($celesteDeepR * (1 - $t) + $celesteR * $t);
                    $ng = (int) ($celesteDeepG * (1 - $t) + $celesteG * $t);
                    $nb = (int) ($celesteDeepB * (1 - $t) + $celesteB * $t);
                    imagesetpixel($out, $x, $y, imagecolorallocatealpha($out, $nr, $ng, $nb, 0));

                    continue;
                }

                // Bordes claros → celeste semitransparente
                imagesetpixel(
                    $out,
                    $x,
                    $y,
                    imagecolorallocatealpha($out, $celesteR, $celesteG, $celesteB, 40),
                );
            }
        }

        imagedestroy($src);

        return $out;
    }

    // ─── Helpers de dibujo ─────────────────────────────────────────────

    private function field(
        \GdImage $img,
        ?string $font,
        ?string $fontBold,
        int $labelColor,
        int $valueColor,
        int $x,
        int $y,
        string $label,
        string $value,
        float $valueSize = 9.0,
    ): void {
        if (! $font) {
            imagestring($img, 2, $x, $y, $label, $labelColor);
            imagestring($img, 3, $x, $y + 10, $value, $valueColor);

            return;
        }
        imagettftext($img, 5.5, 0, $x, $y, $labelColor, $font, mb_strtoupper($label));
        imagettftext($img, $valueSize, 0, $x, $y + 14, $valueColor, $fontBold ?: $font, $value);
    }

    private function drawPhotoBox(\GdImage $img, int $x, int $y, int $w, int $h, ?string $photoPath): void
    {
        $border = imagecolorallocate($img, 71, 85, 105);
        $fill = imagecolorallocate($img, 241, 245, 249);
        imagefilledrectangle($img, $x, $y, $x + $w, $y + $h, $fill);
        imagerectangle($img, $x, $y, $x + $w, $y + $h, $border);

        if (blank($photoPath) || ! Storage::disk('public')->exists($photoPath)) {
            $muted = imagecolorallocate($img, 148, 163, 184);
            $font = $this->fontRegular();
            if ($font) {
                imagettftext($img, 6, 0, $x + 14, $y + (int) ($h / 2), $muted, $font, 'SIN FOTO');
            } else {
                imagestring($img, 2, $x + 10, $y + (int) ($h / 2) - 4, 'SIN FOTO', $muted);
            }

            return;
        }

        $bin = Storage::disk('public')->get($photoPath);
        if ($bin === null || $bin === '') {
            return;
        }
        $src = @imagecreatefromstring($bin);
        if ($src === false) {
            return;
        }

        // Cover crop
        $sw = imagesx($src);
        $sh = imagesy($src);
        $scale = max($w / $sw, $h / $sh);
        $cw = (int) round($w / $scale);
        $ch = (int) round($h / $scale);
        $sx = (int) max(0, ($sw - $cw) / 2);
        $sy = (int) max(0, ($sh - $ch) / 2);
        imagecopyresampled($img, $src, $x, $y, $sx, $sy, $w, $h, $cw, $ch);
        imagedestroy($src);
        imagerectangle($img, $x, $y, $x + $w, $y + $h, $border);
    }

    private function drawMiniFlag(\GdImage $img, int $x, int $y): void
    {
        $red = imagecolorallocate($img, 217, 16, 35);
        $white = imagecolorallocate($img, 255, 255, 255);
        $border = imagecolorallocate($img, 203, 213, 225);
        imagefilledrectangle($img, $x, $y, $x + 5, $y + 8, $red);
        imagefilledrectangle($img, $x + 5, $y, $x + 10, $y + 8, $white);
        imagefilledrectangle($img, $x + 10, $y, $x + 15, $y + 8, $red);
        imagerectangle($img, $x, $y, $x + 15, $y + 8, $border);
    }

    private function qrPngBinary(string $url, int $size): ?string
    {
        try {
            $qr = new QrCode(
                data: $url,
                errorCorrectionLevel: ErrorCorrectionLevel::Medium,
                size: $size,
                margin: 0,
            );

            return (new PngWriter)->write($qr)->getString();
        } catch (\Throwable) {
            return null;
        }
    }

    private function jpeg(\GdImage $img, int $quality): string
    {
        ob_start();
        imagejpeg($img, null, $quality);
        imagedestroy($img);
        $bin = ob_get_clean();

        return is_string($bin) ? $bin : '';
    }

    private function fontRegular(): ?string
    {
        $path = base_path('vendor/dompdf/dompdf/lib/fonts/DejaVuSans.ttf');

        return is_file($path) ? $path : null;
    }

    private function fontBold(): ?string
    {
        $path = base_path('vendor/dompdf/dompdf/lib/fonts/DejaVuSans-Bold.ttf');

        return is_file($path) ? $path : $this->fontRegular();
    }

    private function nationalityCode(?string $countryCode): string
    {
        $code = strtoupper(trim((string) $countryCode));

        return ($code === '' || $code === 'PE') ? 'PER' : substr($code, 0, 3);
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

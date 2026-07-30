<?php

/**
 * One-shot: sync photo for Pelotito (or any chip) from VetSaaS storage via handoff IDs.
 * Usage from AlmaPet: php scripts/backfill_animal_photo.php AP-NNLSXYODTA /path/to/photo.jpg
 */

use App\Models\ChipRegistration;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$code = strtoupper(trim((string) ($argv[1] ?? '')));
$photoFile = (string) ($argv[2] ?? '');

if ($code === '' || $photoFile === '' || ! is_file($photoFile)) {
    fwrite(STDERR, "Usage: php scripts/backfill_animal_photo.php CERT_CODE /path/to/photo.jpg\n");
    exit(1);
}

$chip = ChipRegistration::query()
    ->whereRaw('UPPER(certificate_code) = ?', [$code])
    ->with('animal')
    ->first();

if ($chip === null || $chip->animal === null) {
    fwrite(STDERR, "Chip not found\n");
    exit(1);
}

$binary = file_get_contents($photoFile);
if ($binary === false || $binary === '') {
    fwrite(STDERR, "Empty photo\n");
    exit(1);
}

$ext = strtolower(pathinfo($photoFile, PATHINFO_EXTENSION) ?: 'jpg');
$path = 'animals/'.Str::uuid()->toString().'.'.$ext;
Storage::disk('public')->put($path, $binary);

if (filled($chip->animal->photo_path)) {
    Storage::disk('public')->delete($chip->animal->photo_path);
}

$chip->animal->forceFill(['photo_path' => $path])->save();

echo "OK {$code} -> {$path}\n";

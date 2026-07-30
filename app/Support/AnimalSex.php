<?php

namespace App\Support;

final class AnimalSex
{
    public static function normalize(mixed $raw): ?string
    {
        $value = strtoupper(trim((string) $raw));

        return match ($value) {
            'M', 'MACHO', 'MALE' => 'M',
            'H', 'F', 'HEMBRA', 'FEMALE' => 'H',
            'U', 'UNKNOWN', 'I' => 'U',
            default => null,
        };
    }

    public static function short(?string $sex): string
    {
        return match (self::normalize($sex)) {
            'M' => 'M',
            'H' => 'H',
            default => '—',
        };
    }

    public static function sterilizedLabel(?bool $value): string
    {
        if ($value === true) {
            return 'SÍ';
        }
        if ($value === false) {
            return 'NO';
        }

        return '—';
    }
}

<?php

namespace App\Support\WhatsApp;

final class WhatsAppChatId
{
    public static function fromPhone(?string $phone): ?string
    {
        if ($phone === null || trim($phone) === '') {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if ($digits === '') {
            return null;
        }

        if (strlen($digits) === 9 && str_starts_with($digits, '9')) {
            $digits = '51'.$digits;
        }

        if (str_starts_with($digits, '0') && strlen($digits) === 10) {
            $digits = '51'.substr($digits, 1);
        }

        if (strlen($digits) < 10) {
            return null;
        }

        return $digits.'@c.us';
    }
}

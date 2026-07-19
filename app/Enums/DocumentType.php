<?php

namespace App\Enums;

enum DocumentType: string
{
    case Dni = 'dni';
    case Passport = 'passport';
    case NationalId = 'national_id';
    case ForeignId = 'foreign_id';
    case Other = 'other';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

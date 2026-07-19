<?php

namespace App\Support\Auth;

use App\Models\User;

final class HomePath
{
    public static function for(?User $user): string
    {
        if ($user === null) {
            return '/login';
        }

        if ($user->isClinicUser()) {
            return '/clinic';
        }

        return '/dashboard';
    }
}

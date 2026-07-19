<?php

namespace App\Http\Responses;

use App\Support\Auth\HomePath;
use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Symfony\Component\HttpFoundation\Response;

class RegisterResponse implements RegisterResponseContract
{
    public function toResponse($request): Response
    {
        $home = HomePath::for($request->user());

        return $request->wantsJson()
            ? new JsonResponse('', 201)
            : redirect($home);
    }
}
